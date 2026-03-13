# 🚀 Firebase Cloud Functions - Deployment Guide

Đây là hướng dẫn triển khai Cloud Functions trên Firebase để bot chạy **24/7 trên cloud** (không cần treo máy tính).

## 📋 Kiến Trúc

```
┌─────────────────────────────────┐
│    ESP32 / IoT Device           │
│    (Gửi dữ liệu)                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│    Firebase Firestore           │
│    - health_monitoring/{userId} │
│    - logs/{logId}               │
│    - settings/{userId}          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│    Cloud Functions (Node.js)    │
│    - onFallDetected()           │  ◄─── Mây chạy 24/7
│    - onHealthAlerts()           │
│    - onNewIncidentLog()         │
│    - updateLastSeen()           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│    Telegram Bot API             │
│    (Gửi cảnh báo)               │
└─────────────────────────────────┘
```

## ✅ Yêu Cầu

1. ✓ Firebase Project (đã có)
2. ✓ Telegram Bot Token (đã tạo)
3. ✓ Firebase CLI cài đặt
4. ✓ Google Cloud Project liên kết

## 🔧 Cài Đặt

### Bước 1: Cài Firebase CLI

```bash
npm install -g firebase-tools
```

### Bước 2: Login Firebase

```bash
firebase login
```

Nó sẽ mở trình duyệt, chọn Google account để xác thực.

### Bước 3: Khởi Tạo Project

```bash
cd d:\DoanIot
firebase init
```

Chọn các option:
```
✔ Firestore
✔ Functions
✔ Emulators (optional)
```

### Bước 4: Cấu Hình Environment Variables

Firebase Cloud Functions cần biết Telegram Bot Token. Cấu hình như sau:

```bash
cd functions

# Set env vars
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN"
firebase functions:config:set telegram.chat_id="YOUR_CHAT_ID"
```

Hoặc chỉnh sửa trực tiếp. Tạo file `.env.local`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvwxyz
TELEGRAM_CHAT_ID=987654321
```

## 🚀 Triển Khai (Deploy)

### Deploy Cloud Functions

```bash
cd d:\DoanIot
firebase deploy --only functions
```

Output sẽ hiển thị:

```
✓ Deploy complete!

Function URL (onNewIncidentLog): https://us-central1-YOUR_PROJECT.cloudfunctions.net/onNewIncidentLog
Function URL (onFallDetected): https://us-central1-YOUR_PROJECT.cloudfunctions.net/onFallDetected
Function URL (onHealthAlerts): https://us-central1-YOUR_PROJECT.cloudfunctions.net/onHealthAlerts
Function URL (updateLastSeen): https://us-central1-YOUR_PROJECT.cloudfunctions.net/updateLastSeen
```

## 🧪 Kiểm Tra Functions

### Xem Logs

```bash
firebase functions:log
```

Hoặc trong [Firebase Console](https://console.firebase.google.com):
- Chọn Project
- Functions → Logs

### Test Functions Locally (Emulator)

```bash
firebase emulators:start --only firestore,functions
```

Sau đó cập nhật dữ liệu Firestore để trigger functions.

## 📊 Cloud Functions Được Deploy

### 1️⃣ `onNewIncidentLog` - Cảnh báo sự cố mới

**Trigger:** Khi tạo document mới trong `/logs/{logId}`

**Ghi nhớ:** Mỗi khi dashboard ghi log ngã mới → Telegram nhận cảnh báo

```javascript
// Example trigger:
db.collection("logs").add({
  userId: "phuc_dev",
  event: "Fall Detected",
  patientName: "Phúc",
  lat: 10.8123,
  lng: 106.6299,
  location: "Ho Chi Minh City",
  status: "Mới"
})
// ↓ Tự động gửi Telegram
```

### 2️⃣ `onFallDetected` - Phát hiện ngã khẩn cấp

**Trigger:** Khi `health_monitoring/{userId}.fall` đổi `false → true`

**Ghi nhớ:** ESPdevice gửi `fall: true` → Cloud Function ngay tức khắc gửi SOS Telegram

```javascript
// Example trigger (từ ESP32):
db.collection("health_monitoring").doc("phuc_dev").update({
  fall: true,
  hr: 95,
  spo2: 92,
  lat: 10.8123,
  lng: 106.6299
})
// ↓ 🚨 SOS Telegram gửi ngay
```

### 3️⃣ `onHealthAlerts` - Cảnh báo nhịp tim / SpO2 bất thường

**Trigger:** Khi HR hoặc SpO2 vượt ngưỡng

**Ghi nhớ:** Nếu HR < 40 hoặc > 120 → Cảnh báo Telegram

**Ngưỡng mặc định:**
- HR: 40-120 BPM
- SpO2: 90% trở lên

**Có thể tuỳ chỉnh** qua `/settings/{userId}`

### 4️⃣ `updateLastSeen` - Cập nhật trạng thái online/offline

**Trigger:** Mỗi lần `health_monitoring/{userId}` cập nhật

**Ghi nhớ:** Tự động cập nhật `last_seen` để dashboard biết device còn sống hay không

## 🔐 Cảnh Báo Bảo Mật

⚠️ **KHÔNG commit env vars lên GitHub!**

### Cách 1: Dùng `.env` (Local development)

```bash
# functions/.env.local
TELEGRAM_BOT_TOKEN=123456...
TELEGRAM_CHAT_ID=987654...
```

### Cách 2: Dùng Firebase Secrets (Production)

```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
```

## 📈 Giám Sát & Debugging

### Xem Metrics trong Firebase Console

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn Project → Functions
3. Xem: Invocations, Errors, Duration, Memory

### Kiểm Tra Logs

```bash
# Real-time logs
firebase functions:log --only onFallDetected

# Lịch sử logs (15 phút gần nhất)
firebase functions:log
```

## 🧹 Làm Sạch & Cập Nhật

### Re-deploy sau khi sửa code

```bash
firebase deploy --only functions
```

### Xóa tất cả functions (nếu cần reset)

```bash
firebase functions:delete onFallDetected
firebase functions:delete onHealthAlerts
firebase functions:delete onNewIncidentLog
firebase functions:delete updateLastSeen
```

## 🎯 Workflow Thực Tế

### Scenario: Người dùng ngã

```
1. ESP32 phát hiện ngã
   ↓
2. Gửi health_monitoring/phuc_dev.fall = true
   ↓
3. ☁️ Cloud Function `onFallDetected` trigger ngay
   ↓
4. Gọi Telegram API
   ↓
5. 📱 Admin nhận SOS trên Telegram với vị trí + Maps link
   ↓
6. Click Maps → Định vị người dùng
   ↓
7. Gọi 115 để cấp cứu
```

### Scenario: HR bất thường

```
1. Sensor đọc HR = 125 BPM (> 120)
   ↓
2. Gửi health_monitoring/phuc_dev.hr = 125
   ↓
3. ☁️ Cloud Function `onHealthAlerts` trigger
   ↓
4. So sánh với settings → Vượt ngưỡng
   ↓
5. Tạo log + Gửi Telegram cảnh báo
   ↓
6. 📱 Admin nhận thông báo: "HR quá cao: 125 BPM"
```

## 💡 Tối Ưu Hóa & Best Practices

### 1. Giảm Latency

- Trigger functions từ Firestore (hơn là HTTP)
- Firestore cập nhật nhanh hơn → Cloud Function trigger nhanh

### 2. Tiết Kiệm Chi Phí

- Cloud Functions có **free tier** (2M invocations/tháng)
- Optimize code để tránh infinite loops
- Không log quá nhiều (logs cũng tính phí)

### 3. Độ Tin Cậy

- Thêm error handling (đang làm)
- Retry tự động nếu API fail (Firebase tự làm)
- Monitor logs & metrics

### 4. Tuỳ Chỉnh Alerts

Chỉnh sửa thresholds trong `/settings/{userId}`:

```javascript
{
  "minHr": 45,
  "maxHr": 110,
  "minSpO2": 92,
  "updatedAt": "2026-03-13..."
}
```

## 🆘 Troubleshooting

### ❌ "TELEGRAM_BOT_TOKEN is not defined"

**Lỗi:** Env vars chưa set

**Giải pháp:**
```bash
firebase functions:config:set telegram.bot_token="YOUR_TOKEN"
firebase deploy --only functions
```

### ❌ "Function timeout"

**Lỗi:** Function chạy quá lâu

**Giải pháp:** Trong `functions/index.js`, tăng timeout:

```javascript
exports.onHealthAlerts = onDocumentUpdated(
  {
    document: "health_monitoring/{userId}",
    timeoutSeconds: 540, // 9 phút
  },
  async (event) => {
    // ...
  }
);
```

### ❌ "Telegram API Error 429 (Too Many Requests)"

**Lỗi:** Gửi tin quá nhanh

**Giải pháp:** Thêm rate limiting hoặc debounce:

```javascript
// Ghi nhớ timestamp alert cuối cùng
const lastAlertTime = {}; // In production, dùng Firestore

if (alerts.length > 0 && (Date.now() - lastAlertTime[userId] > 60000)) {
  await sendTelegramMessage(msg);
  lastAlertTime[userId] = Date.now();
}
```

## 📚 Tài Liệu Tham Khảo

- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)

## 🎉 Kết Quả

Sau khi deploy:

✅ Bot chạy **24/7** trên cloud (không cần máy tính)
✅ Cảnh báo **real-time** qua Telegram
✅ **Tự động** xử lý ngã, HR bất thường
✅ Chi phí thấp (free tier đủ dùng)
✅ Có thể mở rộng (thêm devices)
