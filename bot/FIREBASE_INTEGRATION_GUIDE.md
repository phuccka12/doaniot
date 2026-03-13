# 🤖 IoT Health Monitoring Bot - Real-time Firebase Integration

**Tình Trạng:** Bot đã sẵn sàng nghe cảnh báo từ Firebase Firestore và gửi Telegram! ✅

---

## 📊 Hoạt động như thế nào?

### Flow: Người té → Firebase → Bot → Telegram

```
1. Cảm biến phát hiện ngã
   ↓
2. Ghi vào Firebase: health_monitoring/phuc_dev { fall: true }
   ↓
3. Bot listener nghe thay đổi
   ↓
4. Bot gửi SOS qua Telegram ngay lập tức
   ↓
5. Admin nhận alert + Google Maps vị trí
```

---

## 🚀 Chạy Bot (2 cách)

### **Cách 1: Test Mode (ĐỀ NGHỊ - Chạy ngay)** ⭐

```bash
cd d:\DoanIot\bot
python quickstart.py
```

✅ **Ưu điểm:**
- Chạy ngay, không cần Firebase
- Mô phỏng dữ liệu tự động
- Gửi Telegram alert mỗi 5 giây (để test)

❌ **Nhược điểm:**
- Không kết nối Firebase thật

---

### **Cách 2: Production Mode (Firebase Real-time)**

#### 🔑 Bước 1: Lấy Firebase Credentials

1. Vào https://console.firebase.google.com
2. Chọn project của bạn
3. **Project Settings** (bánh răng icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Nó sẽ download file `serviceAccountKey.json`

#### 📁 Bước 2: Copy file vào bot folder

```bash
# Copy file từ Downloads vào bot folder
cp "C:\Users\admin\Downloads\serviceAccountKey.json" "d:\DoanIot\bot\"
```

#### 🎬 Bước 3: Chạy Firebase Listener

```bash
cd d:\DoanIot\bot
python firebase_listener.py
```

**Output sẽ là:**
```
[FIREBASE] Da ket noi Firebase Firestore
[LISTEN] Dang theo doi: health_monitoring (fall detection)...
[LISTEN] Dang theo doi: logs (health alerts)...
[LISTEN] Dang theo doi: health_monitoring (devices)...
[START] Listening started. Press Ctrl+C to stop.
```

---

## 🧪 Test Alerts

### **Option A: Dùng Dashboard (easiest)**

1. Mở dashboard: `npm run dev`
2. Chạy bot: `python quickstart.py`
3. Trên dashboard → cập nhật device data
4. Bot sẽ nhận và gửi Telegram

### **Option B: Dùng test_firebase.py**

Terminal 1: Chạy bot listener
```bash
cd d:\DoanIot\bot
python firebase_listener.py
```

Terminal 2: Push test data
```bash
cd d:\DoanIot\bot
python test_firebase.py
```

Menu sẽ hiện:
```
[MENU] Choose test:
  1 - Fall Detection Alert
  2 - High Heart Rate Alert
  3 - Low SpO2 Alert
  4 - Update Device Data
  5 - Run All Tests
  0 - Exit

Choice: 1
```

Chọn `1` → Bot sẽ nhận fall alert → Telegram nhận SOS ngay!

---

## 📱 Telegram Messages

### SOS Fall Alert
```
[SOS] CANH BAO TE GAY KHANCAP [SOS]

Nguoi dung: Phuc
User ID: phuc_dev
Nhip tim: 92 BPM
SpO2: 95%
Vi tri: 10.8123, 106.6299
Thoi gian: 2026-03-13 11:45:30

HANH DONG NGAY:
1) Goi cap cuu: 115
2) Kiem tra tinh trang benh nhan
3) Cung cap vi tri chinh xac

[MAPS] https://www.google.com/maps?q=10.8123,106.6299
```

### Health Alert
```
[CANH BAO] Heart Rate Alert

Nguoi dung: Phuc
Vi tri: TP.HCM
Trang thai: Moi
Thoi gian: 2026-03-13 11:46:00

[MAPS] https://www.google.com/maps?q=10.8123,106.6299
```

---

## 🏗️ Firestore Collections Cần Có

### 1. **health_monitoring/{userId}**

Cấu trúc:
```json
{
  "name": "Phuc",
  "hr": 85,
  "spo2": 98,
  "lat": 10.8123,
  "lng": 106.6299,
  "fall": false,
  "phone": "0909123456",
  "ai_status": "Normal",
  "last_seen": Timestamp
}
```

**Bot nghe:** `fall: false → true` → Gửi SOS

---

### 2. **logs/{logId}**

Cấu trúc (tạo khi có incident):
```json
{
  "userId": "phuc_dev",
  "event": "Fall Detected",
  "patientName": "Phuc",
  "status": "Moi",
  "location": "TP.HCM",
  "lat": 10.8123,
  "lng": 106.6299,
  "timestamp": Timestamp
}
```

**Bot nghe:** Document mới được add → Gửi alert

---

### 3. **settings/{userId}** (Optional)

```json
{
  "minHr": 40,
  "maxHr": 120,
  "minSpO2": 90,
  "updatedAt": Timestamp
}
```

---

## 📋 Bot Files

| File | Mục đích |
|------|---------|
| `quickstart.py` | Test mode (mô phỏng + Telegram) |
| `firebase_listener.py` | 🔥 **Main bot** - nghe Firebase real-time |
| `telegram_messenger.py` | Gửi Telegram messages |
| `config.py` | Cấu hình (tokens, devices, thresholds) |
| `sensor_simulator.py` | Mô phỏng dữ liệu (HR, SpO2, GPS) |
| `test_firebase.py` | Tool để push test data vào Firestore |
| `.env` | Environment variables (tokens) |

---

## ⚙️ Configuration

### `.env` file

```env
TELEGRAM_BOT_TOKEN=8790249939:AAHMRMDdrEpcn7PvpSl-GkZXNaJ4e32W4sU
TELEGRAM_CHAT_ID=8751026690
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
```

---

## 🐛 Troubleshooting

### ❌ "Firebase khong co"
```
[WARNING] Firebase khong co: ...
[MODE] Chay o test mode (khong Firebase)
```

**Fix:**
- Kiểm tra `serviceAccountKey.json` tồn tại
- Xác nhận path: `d:\DoanIot\bot\serviceAccountKey.json`

### ❌ "Telegram khong nhan alert"
```
[ERROR] Exception gui Telegram: ...
```

**Fix:**
- Kiểm tra `.env` có token và chat ID
- Test: `curl "https://api.telegram.org/bot<TOKEN>/getMe"`

### ❌ "Bot không nghe Firebase"
```
[ERROR] Setup fall listener failed: ...
```

**Fix:**
- Restart bot
- Check Firestore rules (must allow read)
- Verify serviceAccountKey.json credentials

---

## 🎯 Quick Start (5 phút)

### **Cách nhanh nhất:**

1. **Cấu hình Telegram** (nếu chưa có)
   ```bash
   cd d:\DoanIot\bot
   # Mở .env, verify TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID
   ```

2. **Chạy bot test**
   ```bash
   python quickstart.py
   ```

3. **Check Telegram**
   - Bạn sẽ thấy messages mỗi 5 giây
   - Include SOS alert mỗi 15 giây

4. **Test successful?**
   - ✅ Messages có trong Telegram
   - ✅ Bot logs show `[SENT]` messages

---

## 🚀 Khi sẵn sàng → Deploy

### Option 1: Cloud Functions (Recommended - 24/7)
```bash
cd d:\DoanIot\functions
firebase deploy --only functions
```

**Ưu điểm:**
- Chạy 24/7 trên Google Cloud
- Không cần máy của bạn
- Tự động restart nếu fail

### Option 2: Keep bot chạy locally
```bash
python firebase_listener.py
```

**Ưu điểm:**
- Đơn giản
- Có control

---

## 📊 Monitoring Bot

### Xem logs real-time
```bash
# Terminal 1: Bot logs
tail -f bot.log

# Terminal 2: Watch Firestore
firebase firestore:indexes
```

### Check Firebase listeners
```bash
# Via Firebase Console
https://console.firebase.google.com → Cloud Functions → Logs
```

---

## ✅ Checklist

- [ ] Telegram bot token trong `.env`
- [ ] Telegram chat ID trong `.env`
- [ ] Firebase project tạo
- [ ] Firestore database enabled
- [ ] Collections: health_monitoring, logs, settings
- [ ] Bot chạy: `python quickstart.py` hoặc `python firebase_listener.py`
- [ ] Telegram nhận test alerts
- [ ] Dashboard hiện dữ liệu

---

## 📚 Tài liệu thêm

- `FIREBASE_LISTENER.md` - Chi tiết Firebase listener
- `QUICKSTART.md` - Quick start cho bot local
- `CLOUD_FUNCTIONS_GUIDE.md` - Deploy lên Cloud

---

## 🎉 Status

```
✅ Bot framework: DONE
✅ Telegram integration: DONE
✅ Firebase listener: DONE
✅ Test utilities: DONE
⏳ Run & Test: NEXT (in progress)
⏳ Deploy Cloud: OPTIONAL
```

**Ready to run!** 🚀

```bash
cd d:\DoanIot\bot
python quickstart.py
```

Mở Telegram → watch messages coming in! 📱
