# IoT Health Monitoring Bot

Đây là bot tự động theo dõi sức khỏe và gửi cảnh báo qua Telegram.

## 📋 Cài đặt

### 1. Yêu cầu hệ thống
- Python 3.9 trở lên
- pip

### 2. Cài đặt Dependencies

```bash
cd bot
pip install -r requirements.txt
```

### 3. Cấu hình Firebase

Chỉnh sửa `config.py` với thông tin Firebase của bạn:

```python
FIREBASE_CONFIG = {
    "apiKey": "YOUR_API_KEY",
    "authDomain": "YOUR_AUTH_DOMAIN",
    "projectId": "YOUR_PROJECT_ID",
    ...
}
```

### 4. Cấu hình Telegram Bot

#### Tạo Telegram Bot:
1. Mở Telegram, tìm **@BotFather**
2. Nhập `/start` → `/newbot`
3. Đặt tên bot và username
4. Copy **Bot Token** vào `config.py`

#### Lấy Chat ID:
1. Thêm bot vào group hoặc direct message
2. Gửi tin nhắn: `/start`
3. Truy cập: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Copy `chat.id` vào `config.py`

```python
TELEGRAM_BOT_TOKEN = "123456789:ABCdefGHIjklmnoPQRstuvwxyz"
TELEGRAM_CHAT_ID = "987654321"
```

## 🚀 Chạy Bot

```bash
# Cách 1: Chạy trực tiếp
python main.py

# Cách 2: Chạy với nohup (background)
nohup python main.py > bot.log 2>&1 &

# Cách 3: Chạy với Docker
docker build -t iot-health-bot .
docker run -d iot-health-bot
```

## 📊 Cấu hình Thiết bị

Chỉnh sửa danh sách thiết bị trong `config.py`:

```python
IOT_DEVICES = {
    "phuc_dev": {
        "name": "Phúc (Developer)",
        "device_id": "esp32_001",
        "location": "Ho Chi Minh City",
        "phone": "0909123456"
    },
    # Thêm thiết bị khác...
}
```

## ⚙️ Cấu hình Mô phỏng Dữ liệu

Để mô phỏng dữ liệu sensor (không cần thiết bị thực):

```python
SENSOR_SIMULATION = {
    "enabled": True,  # Bật mô phỏng
    "update_interval": 5,  # Cập nhật mỗi 5 giây
    "hr_range": [60, 100],
    "spo2_range": [95, 100],
}
```

## 📱 Cảnh báo Telegram

Bot sẽ gửi cảnh báo trong các trường hợp:

### 1. Nhịp Tim Bất Thường
```
❤️ Nhịp tim quá cao: 125 BPM (ngưỡng: 120)
```

### 2. SpO2 Thấp
```
🫁 SpO2 quá thấp: 88% (ngưỡng: 90%)
```

### 3. Phát Hiện Ngã (Khẩn cấp)
```
🚨 CẢNH BÁO TÉ NGÃ KHẨN CẤP 🚨
📍 Vị trí: 10.812345, 106.629876
⏰ Thời gian: Ngay bây giờ
```

## 📂 Cấu trúc Thư mục

```
bot/
├── config.py              # Cấu hình chính
├── main.py                # Bot engine chính
├── firebase_utils.py      # Hỗ trợ Firebase
├── telegram_messenger.py  # Hỗ trợ Telegram
├── sensor_simulator.py    # Mô phỏng sensor
├── requirements.txt       # Dependencies
├── bot.log               # Log file
└── README.md             # Hướng dẫn này
```

## 🔧 Các Hàm Chính

### `HealthMonitoringBot.process_device_data(device_id)`
Xử lý dữ liệu một thiết bị

### `HealthMonitoringBot.check_health_alerts(device_id, data, settings)`
Kiểm tra cảnh báo sức khỏe

### `HealthMonitoringBot.handle_fall_detection(device_id, data)`
Xử lý phát hiện ngã

### `TelegramMessenger.send_alert(...)`
Gửi cảnh báo qua Telegram

### `fb.write_health_data(user_id, data)`
Ghi dữ liệu lên Firebase

## 📊 Thông tin Firestore Collections

Bot ghi dữ liệu vào các collection sau:

### `health_monitoring/{userId}`
```json
{
  "name": "Phúc",
  "hr": 75,
  "spo2": 98,
  "lat": 10.8123,
  "lng": 106.6299,
  "fall": false,
  "ai_status": "Normal",
  "last_seen": 1678900000000
}
```

### `logs/`
```json
{
  "userId": "phuc_dev",
  "event": "Fall Detected",
  "status": "Mới",
  "location": "Ho Chi Minh City",
  "timestamp": 1678900000000,
  "patientName": "Phúc"
}
```

### `settings/{userId}`
```json
{
  "minHr": 40,
  "maxHr": 120,
  "minSpO2": 90,
  "updatedAt": 1678900000000
}
```

## 🔐 Bảo Mật

⚠️ **QUAN TRỌNG:** 
- Không commit `config.py` với token thực lên GitHub
- Sử dụng `.env` file:

```bash
# .env
FIREBASE_PROJECT_ID=your_project_id
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...
TELEGRAM_CHAT_ID=987654321
```

```python
# config.py
from dotenv import load_dotenv
import os

load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
```

## 🐛 Troubleshooting

### Bot không gửi tin nhắn
- Kiểm tra `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`
- Kiểm tra internet connection
- Xem log file: `cat bot.log`

### Firebase không kết nối
- Kiểm tra `FIREBASE_CONFIG`
- Kiểm tra security rules trên Firebase Console

### Sensor data không cập nhật
- Bật `SENSOR_SIMULATION.enabled = True` để mô phỏng
- Kiểm tra `update_interval`

## 📞 Support

Để debug, kiểm tra logs:

```bash
tail -f bot.log
```

## 🎯 Các tính năng sắp tới

- [ ] Web dashboard để quản lý bot
- [ ] Zalo bot integration
- [ ] SMS alerts
- [ ] Email notifications
- [ ] Real device integration (MQTT, HTTP)
- [ ] Database persistence (PostgreSQL)
- [ ] Admin panel để quản lý settings
