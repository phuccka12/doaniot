const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

/**
 * Ưu tiên lấy từ process.env (Cloud Functions v2 hỗ trợ env vars),
 * fallback sang config cũ nếu có.
 */
function getTelegramConfig() {
  const token =
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.TG_BOT_TOKEN ||
    null;

  const chatId =
    process.env.TELEGRAM_CHAT_ID ||
    process.env.TG_CHAT_ID ||
    null;

  return { token, chatId };
}

async function sendTelegramMessage(text, lat = null, lng = null) {
  const { token, chatId } = getTelegramConfig();

  if (!token || !chatId) {
    logger.error("Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID env");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    logger.info("✓ Telegram message sent");
    
    // If location provided, send location pin
    if (lat && lng) {
      const locUrl = `https://api.telegram.org/bot${token}/sendLocation`;
      await axios.post(locUrl, {
        chat_id: chatId,
        latitude: lat,
        longitude: lng,
      });
    }
  } catch (err) {
    logger.error("✗ Telegram send failed", err?.response?.data || err.message);
  }
}

/**
 * Trigger 1: Có log sự cố mới trong /logs/{logId}
 */
exports.onNewIncidentLog = onDocumentCreated("logs/{logId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const eventName = data.event || data.title || "Sự cố mới";
  const patient = data.patientName || data.name || data.userId || "Không rõ";
  const status = data.status || "Mới";
  const lat = data.lat ?? "N/A";
  const lng = data.lng ?? "N/A";
  const location = data.location || `${lat}, ${lng}`;

  const msg = [
    "🚨 <b>CẢNH BÁO SỰ CỐ MỚI</b>",
    `👤 Bệnh nhân: <b>${patient}</b>`,
    `📌 Sự kiện: <b>${eventName}</b>`,
    `📍 Vị trí: ${location}`,
    `📊 Trạng thái: ${status}`,
    `🗺️ Map: https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  ].join("\n");

  await sendTelegramMessage(msg);
});

/**
 * Trigger 2: Khi fall đổi từ false -> true trong /health_monitoring/{userId}
 */
exports.onFallDetected = onDocumentUpdated("health_monitoring/{userId}", async (event) => {
  const beforeData = event.data?.before?.data() || {};
  const afterData = event.data?.after?.data() || {};

  // chỉ trigger khi chuyển trạng thái sang true
  if (afterData.fall === true && beforeData.fall !== true) {
    const userId = event.params.userId;
    const patient = afterData.name || userId;
    const hr = afterData.hr ?? "N/A";
    const spo2 = afterData.spo2 ?? "N/A";
    const lat = afterData.lat ?? "N/A";
    const lng = afterData.lng ?? "N/A";

    const msg = [
      "🆘 <b>PHÁT HIỆN TÉ NGÃ KHẨN CẤP</b>",
      `👤 Bệnh nhân: <b>${patient}</b>`,
      `❤️ HR: ${hr} BPM | 🫁 SpO2: ${spo2}%`,
      `📍 Tọa độ: ${lat}, ${lng}`,
      `🗺️ https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    ].join("\n");

    await sendTelegramMessage(msg);

    // optional: ghi log tự động để dashboard hiển thị
    try {
      await admin.firestore().collection("logs").add({
        userId,
        event: "Té ngã",
        status: "Chưa xử lý",
        location: `${lat}, ${lng}`,
        lat: afterData.lat ?? null,
        lng: afterData.lng ?? null,
        patientName: patient,
        source: "cloud_function",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      logger.error("Failed to auto-create incident log", err.message);
    }
  }
});

/**
 * Trigger 3: Theo dõi chỉ số sức khỏe bất thường
 * Trigger khi HR hoặc SpO2 vượt ngưỡng trong /health_monitoring/{userId}
 */
exports.onHealthAlerts = onDocumentUpdated("health_monitoring/{userId}", async (event) => {
  const beforeData = event.data?.before?.data() || {};
  const afterData = event.data?.after?.data() || {};
  const userId = event.params.userId;

  // Lấy settings người dùng từ Firestore
  let settings = { minHr: 40, maxHr: 120, minSpO2: 90 };
  try {
    const settingsDoc = await db.collection("settings").doc(userId).get();
    if (settingsDoc.exists) {
      settings = { ...settings, ...settingsDoc.data() };
    }
  } catch (err) {
    logger.warn("Could not fetch settings for " + userId);
  }

  const hr = afterData.hr ?? 0;
  const spo2 = afterData.spo2 ?? 0;
  const patient = afterData.name || userId;
  const lat = afterData.lat ?? "N/A";
  const lng = afterData.lng ?? "N/A";

  let alerts = [];

  // Check HR
  if (hr < settings.minHr && beforeData.hr >= settings.minHr) {
    alerts.push(`❤️ <b>HR quá thấp:</b> ${hr} BPM (ngưỡng: ${settings.minHr})`);
  } else if (hr > settings.maxHr && beforeData.hr <= settings.maxHr) {
    alerts.push(`❤️ <b>HR quá cao:</b> ${hr} BPM (ngưỡng: ${settings.maxHr})`);
  }

  // Check SpO2
  if (spo2 < settings.minSpO2 && beforeData.spo2 >= settings.minSpO2) {
    alerts.push(`🫁 <b>SpO2 quá thấp:</b> ${spo2}% (ngưỡng: ${settings.minSpO2}%)`);
  }

  // Gửi alert nếu có
  if (alerts.length > 0) {
    const msg = [
      "⚠️ <b>CẢNH BÁO SỨC KHỎE</b>",
      `👤 Bệnh nhân: <b>${patient}</b>`,
      ...alerts,
      `📍 Vị trí: ${lat}, ${lng}`,
      `🗺️ https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    ].join("\n");

    await sendTelegramMessage(msg, lat, lng);

    // Ghi log sự cố
    try {
      await db.collection("logs").add({
        userId,
        event: alerts[0].replace(/<[^>]*>/g, ""), // remove HTML tags
        status: "Mới",
        location: `${lat}, ${lng}`,
        lat,
        lng,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        patientName: patient,
        source: "cloud_function",
      });
    } catch (err) {
      logger.error("Failed to create health alert log", err);
    }
  }
});

/**
 * Trigger 4: Cập nhật trạng thái last_seen (hỗ trợ online/offline detection)
 */
exports.updateLastSeen = onDocumentUpdated("health_monitoring/{userId}", async (event) => {
  const afterData = event.data?.after?.data() || {};
  const userId = event.params.userId;

  // Cập nhật last_seen timestamp
  if (afterData.hr !== undefined || afterData.spo2 !== undefined) {
    try {
      await db.collection("health_monitoring").doc(userId).update({
        last_seen: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      logger.warn("Could not update last_seen", err);
    }
  }
});