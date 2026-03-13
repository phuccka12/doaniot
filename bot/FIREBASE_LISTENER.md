# 🔥 Firebase Real-time Listener Bot

**Bot này nghe trực tiếp từ Firebase Firestore và gửi Telegram alert ngay khi:**
- ✅ Có người té (fall detected)
- ✅ Có incident log mới
- ✅ Devices online/offline

---

## 🚀 Cách chạy (2 options)

### Option 1: Test Mode (No Firebase needed) ⭐ **ĐỀ NGHỊ**

```bash
cd d:\DoanIot\bot
python quickstart.py
```

**Ưu điểm:** Chạy ngay, không cần Firebase credentials, dùng mô phỏng dữ liệu

---

### Option 2: Production Mode (Real Firebase)

#### Bước 1: Lấy Firebase Credentials

1. Vào https://console.firebase.google.com
2. **Project Settings** → **Service Accounts**
3. Click **Generate New Private Key**
4. Download file `serviceAccountKey.json`

#### Bước 2: Copy file vào project

```bash
cp serviceAccountKey.json d:\DoanIot\bot\
```

#### Bước 3: Chạy listener

```bash
cd d:\DoanIot\bot
python firebase_listener.py
```

---

## 📊 Cấu trúc dữ liệu Firestore cần có

### 1. **health_monitoring/{userId}**

```json
{
  "name": "Phúc",
  "hr": 85,
  "spo2": 98,
  "lat": 10.8123,
  "lng": 106.6299,
  "fall": false,
  "phone": "0909123456",
  "ai_status": "Normal",
  "last_seen": {
    "seconds": 1710345600
  }
}
```

**Khi nào trigger:**
- `fall: false → true` → Bot gửi SOS

### 2. **logs/{logId}** (New document)

```json
{
  "userId": "phuc_dev",
  "event": "Fall Detected",
  "patientName": "Phúc",
  "status": "Mới",
  "location": "TP.HCM",
  "lat": 10.8123,
  "lng": 106.6299,
  "timestamp": {
    "seconds": 1710345600
  }
}
```

**Khi nào trigger:**
- Khi có document mới được add → Bot gửi alert

### 3. **settings/{userId}** (Optional)

```json
{
  "minHr": 40,
  "maxHr": 120,
  "minSpO2": 90
}
```

---

## 🧪 Test với Dashboard

1. Mở dashboard: `npm run dev`
2. Chạy bot: `python quickstart.py` hoặc `python firebase_listener.py`
3. Trên dashboard → Chọn device → Update data
4. Bot sẽ nhận và gửi Telegram

### Trigger SOS:
- Dashboard: Chỉnh `fall: true`
- Bot sẽ nhận trong <1 giây
- Telegram nhận alert ngay

---

## 📱 Telegram Alerts

### SOS Alert (Fall)
```
[SOS] CANH BAO TE GAY KHANCAP [SOS]

Nguoi dung: Phúc
Nhip tim: 85 BPM
SpO2: 98%
Vi tri: 10.8123, 106.6299

[MAPS] https://www.google.com/maps?q=10.8123,106.6299
```

### Health Alert (HR/SpO2)
```
[CANH BAO] Heart Rate Alert

Nguoi dung: Phúc
Nhip tim: 130 BPM (HIGH!)
Trang thai: Moi
```

---

## 🛠️ Troubleshooting

### Bot không nghe Firebase?
```
[ERROR] Setup fall listener failed: ...
```

**Fix:**
- Check Firebase credentials path
- Verify serviceAccountKey.json tồn tại
- Check Firestore security rules cho phép read

### Telegram không nhận alert?
```
[ERROR] Exception gui Telegram: ...
```

**Fix:**
- Check TELEGRAM_BOT_TOKEN trong `.env`
- Check TELEGRAM_CHAT_ID hợp lệ
- Test: `curl https://api.telegram.org/bot<TOKEN>/getMe`

### Firestore connection failed?
```
[WARNING] Firebase khong co: ...
```

**Fix:**
- Download serviceAccountKey.json từ Firebase Console
- Đặt ở `d:\DoanIot\bot\serviceAccountKey.json`
- Restart bot

---

## 🔗 Files

| File | Mục đích |
|------|---------|
| `quickstart.py` | Bot test (mô phỏng) |
| `firebase_listener.py` | Bot production (Firebase real-time) |
| `telegram_messenger.py` | Gửi Telegram |
| `config.py` | Cấu hình chung |
| `serviceAccountKey.json` | Firebase credentials (tạo từ Console) |

---

## 📋 Checklist trước chạy

- [ ] Telegram bot token trong `.env`
- [ ] Telegram chat ID trong `.env`
- [ ] Firebase project tạo (nếu dùng production)
- [ ] Firestore database enabled
- [ ] serviceAccountKey.json (nếu dùng production)

---

## 🎯 Next Steps

1. **Chạy quickstart.py trước** (đơn giản nhất)
   ```bash
   python quickstart.py
   ```

2. **Kiểm tra Telegram nhận alerts**
   - Mở Telegram
   - Xem có messages từ bot không?

3. **Tích hợp Firebase** (khi sẵn sàng)
   ```bash
   python firebase_listener.py
   ```

4. **Deploy lên Cloud Functions** (optional, 24/7)
   - Xem `functions/index.js`

---

**Happy monitoring! 🚀**
