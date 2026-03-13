# 🤖 IOT HEALTH MONITORING BOT - QUICK START

## ⚡ 5 Bước Cài Đặt & Chạy

### Bước 1️⃣: Tạo Telegram Bot Token

1. Mở **Telegram**, tìm **@BotFather**
2. Nhập: `/newbot`
3. Đặt tên bot (vd: "Health Monitoring Bot")
4. Đặt username (vd: "health_monitor_bot")
5. **Copy Bot Token** (sẽ có dạng: `123456789:ABCdefGHIjklmnoPQRstuvwxyz`)

### Bước 2️⃣: Lấy Chat ID

1. Thêm bot vừa tạo vào một group hoặc chat trực tiếp
2. Gửi tin nhắn `/start`
3. Truy cập link này trong trình duyệt:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. Tìm `"chat":{"id": 123456789` và **copy số đó**

### Bước 3️⃣: Cấu Hình Bot

Chỉnh sửa file `bot/.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmnoPQRstuvwxyz
TELEGRAM_CHAT_ID=987654321
```

### Bước 4️⃣: Chạy Bot (Test Mode)

```bash
cd d:\DoanIot\bot
python quickstart.py
```

Bạn sẽ thấy:
```
[2026-03-13 10:30:45] INFO - 🤖 IOT HEALTH MONITORING BOT (TEST MODE)
[2026-03-13 10:30:45] INFO - ✓ Monitoring started. Press Ctrl+C to stop.
[2026-03-13 10:30:46] INFO - 📊 phuc_dev: HR=75 SpO2=98% Fall=False
[2026-03-13 10:30:51] INFO - 📊 phuc_dev: HR=78 SpO2=97% Fall=False
...
```

### Bước 5️⃣: Kiểm Tra Telegram

Nếu HR > 110 hoặc < 50, hoặc SpO2 < 93%, bạn sẽ nhận được cảnh báo trên Telegram.

---

## 🧪 Test Cảnh Báo

### Test Cảnh báo Nhịp Tim Cao (HR > 110)

Chỉnh sửa `sensor_simulator.py`:

```python
def simulate_data(self, device_id: str) -> dict:
    ...
    # Thay đổi HR thành giá trị cao
    state["hr"] = 115  # > 110 sẽ trigger cảnh báo
    ...
```

### Test Cảnh báo Ngã (SOS)

Chỉnh sửa `sensor_simulator.py`:

```python
def simulate_data(self, device_id: str) -> dict:
    ...
    # Bắt buộc ngã
    state["fall"] = True
    state["ai_status"] = "Fall Detected"
    ...
```

Hoặc chạy trong Python shell:

```python
from sensor_simulator import simulator
simulator.simulate_emergency("phuc_dev")
```

---

## 📁 Cấu Trúc File

```
bot/
├── .env                  ← Cấu hình Telegram (edit file này)
├── quickstart.py         ← Chạy bot (TEST MODE)
├── main.py              ← Bot chính (cần Firebase)
├── config.py            ← Cấu hình chung
├── sensor_simulator.py  ← Mô phỏng sensor
├── telegram_messenger.py ← Gửi tin Telegram
├── firebase_utils.py    ← Kết nối Firebase (tùy chọn)
├── requirements.txt     ← Dependencies
├── bot.log             ← Log file (tự tạo)
└── README.md           ← Hướng dẫn đầy đủ
```

---

## 🚀 Các Lệnh Hữu Ích

### Chạy Bot (TEST - không cần Firebase)
```bash
cd d:\DoanIot\bot
python quickstart.py
```

### Chạy Bot (FULL - với Firebase)
```bash
python main.py
```

### Cài đặt lại dependencies
```bash
pip install -r requirements.txt
```

### Xem logs
```bash
tail -f bot.log
```

---

## 🔧 Cấu Hình Thiết Bị

Chỉnh sửa `config.py` để thêm thiết bị:

```python
IOT_DEVICES = {
    "phuc_dev": {
        "name": "Phúc",
        "device_id": "esp32_001",
        "location": "TP.HCM",
        "phone": "0909123456"
    },
    "my_grandma": {
        "name": "Bà ngoại",
        "device_id": "esp32_002",
        "location": "Hà Nội",
        "phone": "0919123456"
    }
}
```

---

## ⚠️ Troubleshooting

### ❌ "Bot token not configured"

**Lỗi:** Bạn chưa cấu hình token Telegram

**Giải pháp:**
1. Tạo Telegram Bot (xem Bước 1)
2. Thêm token vào `.env`
3. Kiểm tra: `echo $env:TELEGRAM_BOT_TOKEN` (PowerShell)

### ❌ "Failed to send message"

**Lỗi:** Telegram API lỗi

**Giải pháp:**
1. Kiểm tra Bot Token đúng chưa
2. Kiểm tra Chat ID đúng chưa
3. Kiểm tra internet kết nối
4. Xem logs: `cat bot.log`

### ❌ "Module not found"

**Lỗi:** Thiếu package

**Giải pháp:**
```bash
pip install -r requirements.txt
```

### ❌ Không nhận cảnh báo

**Lỗi:** Bot không gửi được tin

**Giải pháp:**
1. Chạy `quickstart.py` để debug
2. Kiểm tra log output
3. Test: `python -c "from telegram_messenger import telegram; telegram.send_message('Test message')"`

---

## 📊 Cảnh báo Tự Động

Bot sẽ gửi cảnh báo **tự động** khi:

| Sự kiện | Ngưỡng | Icon |
|---------|--------|------|
| HR quá cao | > 110 BPM | ⚠️ |
| HR quá thấp | < 50 BPM | ⚠️ |
| SpO2 quá thấp | < 93% | 🫁 |
| Phát hiện ngã | fall = true | 🚨 |

---

## 🎯 Bước Tiếp Theo

1. ✅ **Test bot với mode mô phỏng** (quickstart.py)
2. 📱 **Thêm Zalo bot** (tùy chọn)
3. 🔌 **Kết nối thiết bị thực** (ESP32, Arduino)
4. 🌐 **Tích hợp Firebase** (lưu lịch sử)
5. 📊 **Tạo web dashboard** (quản lý alerts)

---

## 💬 Cần Giúp?

Xem file log:
```bash
# PowerShell
Get-Content bot.log -Tail 20 -Wait

# Git Bash / Linux
tail -f bot.log
```

Kiểm tra Telegram API:
```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```
