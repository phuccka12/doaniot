"""
Bot Configuration - Cấu hình cho IoT Health Monitoring Bot
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Firebase Configuration (using Firestore)
FIREBASE_CONFIG = {
    "type": "service_account",
    "project_id": os.getenv("FIREBASE_PROJECT_ID", "your-project-id"),
    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", ""),
    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL", ""),
    "client_id": os.getenv("FIREBASE_CLIENT_ID", ""),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
}

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "YOUR_TELEGRAM_CHAT_ID")

# Firebase Credentials (optional - for production)
# If you have serviceAccountKey.json from Firebase Console
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")

# IoT Device Configuration
IOT_DEVICES = {
    "phuc_dev": {
        "name": "Phúc (Developer)",
        "device_id": "esp32_001",
        "location": "Ho Chi Minh City",
        "phone": "0909123456"
    },
    "user_001": {
        "name": "Người dùng 1",
        "device_id": "esp32_002",
        "location": "Hanoi",
        "phone": "0919234567"
    }
}

# Sensor Data Simulation (for testing without real devices)
SENSOR_SIMULATION = {
    "enabled": True,  # Set to False for real devices
    "update_interval": 5,  # seconds
    "hr_range": [60, 100],  # Heart rate range
    "spo2_range": [95, 100],  # SpO2 range
    "lat_range": [10.8, 10.83],  # Latitude range (Ho Chi Minh City)
    "lng_range": [106.6, 106.65],  # Longitude range
}

# Alert Thresholds
ALERT_THRESHOLDS = {
    "hr_min": 40,
    "hr_max": 120,
    "spo2_min": 90,
    "fall_detection": True,
    "location_update_interval": 30  # seconds
}

# Logging Configuration
LOG_FILE = "bot.log"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
