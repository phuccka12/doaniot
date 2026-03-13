# 🏗️ IoT Health Monitoring System - Architecture Overview

## 📌 Tổng Quan

Hệ thống theo dõi sức khỏe IoT **toàn diện** với 3 lựa chọn triển khai:

### Option 1: Local Bot (Python) ✅ DONE
- **Nơi chạy:** Máy tính của bạn
- **Ưu điểm:** Dễ cấu hình, đơn giản, kiểm soát toàn bộ
- **Nhược điểm:** Phải treo máy tính 24/7
- **Thích hợp:** Testing, development

### Option 2: Cloud Functions (Node.js) ⭐ RECOMMENDED
- **Nơi chạy:** Firebase Cloud (Google's servers)
- **Ưu điểm:** Chạy 24/7, không tốn tiền điện, tự động scale, AI sẵn sàng
- **Nhược điểm:** Cần setup ban đầu
- **Thích hợp:** Production, deploy thực tế

### Option 3: Hybrid (Kết hợp)
- **Nơi chạy:** Vừa Local Bot + Cloud Functions
- **Ưu điểm:** Dự phòng, tăng độ tin cậy
- **Thích hợp:** Critical systems

---

## 🎯 Lựa Chọn Cloud Functions (RECOMMENDED)

### Lý do chọn Cloud Functions:

1. **Chạy 24/7 trên Cloud**
   ```
   Thiết bị gửi dữ liệu → Firebase Firestore → Cloud Function trigger
   ```

2. **Không cần treo máy**
   - Chạy serverless (không máy chủ)
   - Google quản lý infrastructure
   - Tự động restart nếu fail

3. **Chi phí siêu rẻ**
   - Free tier: 2 triệu invocations/tháng
   - Hầu hết doanh nghiệp dùng không hết free tier

4. **Real-time alerts**
   - Trigger ngay khi dữ liệu thay đổi
   - Latency < 1 giây

5. **Dễ bảo trì**
   - Code quản lý bởi Firebase
   - Tự động log & monitoring

---

## 🗂️ Cấu Trúc Thư Mục

```
d:\DoanIot/
├── src/
│   ├── app/
│   │   └── page.tsx          ← Dashboard (React)
│   └── lib/
│       ├── firebase.js        ← Firebase config
│       ├── pdfExport.ts       ← PDF report
│       └── geofence.ts        ← Vùng an toàn (removed)
│
├── functions/                 ← ⭐ CLOUD FUNCTIONS (Node.js)
│   ├── index.js              ← Main Cloud Functions code
│   ├── package.json          ← Dependencies
│   ├── .env.local            ← Env vars (local)
│   ├── deploy.ps1            ← Deploy script (Windows)
│   ├── deploy.sh             ← Deploy script (Linux/Mac)
│   ├── CLOUD_FUNCTIONS_GUIDE.md  ← Setup guide
│   └── README.md
│
├── bot/                       ← ⭐ LOCAL BOT (Python)
│   ├── quickstart.py         ← Bot test mode
│   ├── main.py               ← Bot chính
│   ├── config.py             ← Config
│   ├── sensor_simulator.py   ← Mô phỏng sensor
│   ├── telegram_messenger.py ← Gửi Telegram
│   ├── firebase_utils.py     ← Firebase utils
│   ├── .env                  ← Env vars
│   ├── requirements.txt       ← Dependencies
│   ├── QUICKSTART.md         ← Quick start guide
│   └── README.md
│
├── package.json              ← npm dependencies
├── next.config.ts            ← Next.js config
├── firebase.json             ← Firebase config
└── README.md
```

---

## 🔄 Data Flow

### Scenario: Người dùng ngã

```
┌────────────────────────────────────────────────────────────┐
│ 1. ESP32 / IoT Device                                      │
│    (Cảm biến: gia tốc, con quay, ...phát hiện ngã)        │
└────────────────┬─────────────────────────────────────────┘
                 │ Gửi HTTP POST
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 2. Next.js API Route (Optional)                            │
│    /api/health/update                                       │
└────────────────┬─────────────────────────────────────────┘
                 │ Ghi vào Firestore
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 3. Firebase Firestore                                      │
│    health_monitoring/phuc_dev {                            │
│      "hr": 95,                                             │
│      "spo2": 92,                                           │
│      "fall": true,  ← Trigger nhân!                       │
│      "lat": 10.8123,                                       │
│      "lng": 106.6299                                       │
│    }                                                       │
└────────────────┬─────────────────────────────────────────┘
                 │ Trigger onChange
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 4. Cloud Function: onFallDetected() [☁️ RUNS ON CLOUD]    │
│    - Kiểm tra: beforeData.fall !== true && after.fall     │
│    - Gọi Telegram API                                      │
│    - Ghi log sự cố                                         │
│    - Cập nhật last_seen                                    │
└────────────────┬─────────────────────────────────────────┘
                 │ gọi API
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 5. Telegram Bot API                                        │
│    - Gửi tin nhắn SOS                                      │
│    - Gửi vị trí (Google Maps pin)                          │
│    - Alert: 📍 Maps link                                    │
└────────────────┬─────────────────────────────────────────┘
                 │ HTTP response
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 6. Admin Telegram                                          │
│    📱 Nhận SOS: "🚨 Phúc ngã! Vị trí: [Maps]"            │
│    👉 Click Maps → Xem vị trí                              │
│    👉 Gọi 115 cứu hộ                                       │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Databases & Collections

### Firebase Firestore Schema

```
firestore.google.com/
├── health_monitoring/          ← Real-time device data
│   ├── phuc_dev
│   │   ├── name: "Phúc"
│   │   ├── hr: 75
│   │   ├── spo2: 98
│   │   ├── lat: 10.8123
│   │   ├── lng: 106.6299
│   │   ├── fall: false
│   │   ├── ai_status: "Normal"
│   │   ├── phone: "0909123456"
│   │   └── last_seen: timestamp
│   └── user_001
│       └── ...
│
├── logs/                       ← Incident records
│   ├── log_id_123
│   │   ├── userId: "phuc_dev"
│   │   ├── event: "Fall Detected"
│   │   ├── status: "Mới"
│   │   ├── location: "TP.HCM"
│   │   ├── lat: 10.8123
│   │   ├── lng: 106.6299
│   │   ├── timestamp: timestamp
│   │   ├── patientName: "Phúc"
│   │   └── source: "cloud_function"
│   └── ...
│
├── settings/                   ← User preferences
│   ├── phuc_dev
│   │   ├── minHr: 40
│   │   ├── maxHr: 120
│   │   ├── minSpO2: 90
│   │   └── updatedAt: timestamp
│   └── ...
│
├── tracks/                     ← Route history
│   ├── phuc_dev/points/
│   │   ├── track_001
│   │   │   ├── lat: 10.8123
│   │   │   ├── lng: 106.6299
│   │   │   └── ts: timestamp
│   │   └── ...
│   └── ...
│
└── notifications/              ← Alert history (optional)
    ├── notif_001
    │   ├── userId: "phuc_dev"
    │   ├── type: "fall" | "hr_high" | "spo2_low"
    │   ├── message: "Ngã phát hiện"
    │   ├── sent_at: timestamp
    │   └── status: "sent" | "failed"
    └── ...
```

---

## 🚀 Quick Start: Cloud Functions

### Bước 1: Cài Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Bước 2: Cấu Hình Telegram Token

Tạo `functions/.env.local`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvwxyz
TELEGRAM_CHAT_ID=987654321
```

### Bước 3: Deploy

**Windows (PowerShell):**
```powershell
cd d:\DoanIot\functions
.\deploy.ps1
```

**Mac/Linux:**
```bash
cd d:/DoanIot/functions
chmod +x deploy.sh
./deploy.sh
```

### Bước 4: Verify

```bash
firebase functions:log
```

---

## 📈 Comparison: Local Bot vs Cloud Functions

| Feature | Local Bot (Python) | Cloud Functions | Winner |
|---------|-------------------|-----------------|--------|
| Setup Complexity | ⭐ Simple | ⭐⭐ Medium | Local |
| Cost | 💰 Máy điện | ✅ Free | Cloud |
| Uptime | 📴 Phụ thuộc máy | ⭐⭐⭐ 99.95% | Cloud |
| Latency | 🐢 Depends on device | ⚡ < 1s | Cloud |
| Scalability | ❌ Limited | ✅ Auto-scale | Cloud |
| Maintenance | 🔧 Manual | ✅ Auto | Cloud |
| Real-time | ❓ Polling | ✅ Event-driven | Cloud |
| Development | ✅ Easy to test | 🔧 Needs emulator | Local |

**Verdict:** Cloud Functions for production, Local Bot for testing.

---

## 🔐 Security Best Practices

### 1. Environment Variables

❌ KHÔNG làm việc này:
```javascript
const TELEGRAM_BOT_TOKEN = "123456...";  // Hardcoded!
```

✅ Làm việc này:
```javascript
const token = process.env.TELEGRAM_BOT_TOKEN;  // From env var
```

### 2. Firebase Security Rules

```
firestore.rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin only
    match /logs/{logId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && request.auth.customClaims.admin == true;
    }
    
    // Device can only update own data
    match /health_monitoring/{userId} {
      allow write: if request.auth.uid == userId;
      allow read: if request.auth != null;
    }
  }
}
```

### 3. Rate Limiting (Optional)

```javascript
// In Cloud Function: Prevent alert spam
const lastAlerts = {};
const ALERT_COOLDOWN = 60000; // 1 minute

if (Date.now() - lastAlerts[userId] > ALERT_COOLDOWN) {
  await sendTelegramMessage(msg);
  lastAlerts[userId] = Date.now();
}
```

---

## 📞 Support & Troubleshooting

### Cloud Functions không trigger?

1. Kiểm tra Firestore rules cho phép write
2. Kiểm tra Cloud Function logs: `firebase functions:log`
3. Verify env vars: `firebase functions:config:get`

### Telegram API errors?

1. Test bot: `curl https://api.telegram.org/bot<TOKEN>/getMe`
2. Kiểm tra token format
3. Kiểm tra chat ID

### Hỗ trợ

- Firebase Docs: https://firebase.google.com/docs/functions
- Telegram API: https://core.telegram.org/bots/api
- Cloud Functions Pricing: https://firebase.google.com/pricing

---

## 🎯 Next Steps

1. ✅ **Deploy Cloud Functions**
   ```bash
   cd functions && firebase deploy --only functions
   ```

2. ✅ **Test with Firestore**
   - Thay đổi `health_monitoring/phuc_dev.fall = true`
   - Kiểm tra Telegram nhận cảnh báo

3. ✅ **Tích hợp ESP32**
   - Code ESP32 gửi dữ liệu qua HTTP/MQTT
   - Update Firestore với sensor data

4. ✅ **Monitor & Scale**
   - Xem Cloud Function logs
   - Thêm devices
   - Optimize thresholds

5. ✅ **Production Deploy**
   - Set up Security Rules
   - Enable Firestore backups
   - Configure alerts

---

## 📚 Tài Liệu

| File | Mục Đích |
|------|---------|
| `CLOUD_FUNCTIONS_GUIDE.md` | Chi tiết Cloud Functions |
| `bot/QUICKSTART.md` | Local Bot setup |
| `src/lib/pdfExport.ts` | PDF report export |
| `functions/index.js` | Cloud Function code |

---

**Happy Monitoring! 🎉**
