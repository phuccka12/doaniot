"""
Telegram Bot Messenger - Gửi cảnh báo qua Telegram
"""

import requests
import logging
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

logger = logging.getLogger(__name__)

class TelegramMessenger:
    def __init__(self, bot_token: str, chat_id: str):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
    
    def send_message(self, text: str, parse_mode: str = "HTML") -> bool:
        """
        Gửi tin nhắn văn bản qua Telegram
        
        Args:
            text: Nội dung tin nhắn
            parse_mode: HTML hoặc Markdown
        
        Returns:
            True nếu thành công
        """
        try:
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": parse_mode
            }
            response = requests.post(url, json=payload, timeout=5)
            if response.status_code == 200:
                logger.info("[SENT] Tin nhan Telegram da gui")
                return True
            else:
                logger.error(f"[ERROR] Loi gui Telegram: {response.text}")
                return False
        except Exception as e:
            logger.error(f"[ERROR] Exception gui Telegram: {e}")
            return False
    
    def send_location(self, lat: float, lng: float, title: str = "Vị trí") -> bool:
        """
        Gửi vị trí lên Telegram
        
        Args:
            lat: Latitude
            lng: Longitude
            title: Tiêu đề vị trí
        
        Returns:
            True nếu thành công
        """
        try:
            url = f"{self.base_url}/sendLocation"
            payload = {
                "chat_id": self.chat_id,
                "latitude": lat,
                "longitude": lng
            }
            response = requests.post(url, json=payload, timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"[ERROR] Exception gui location: {e}")
            return False
    
    def send_alert(self, user_name: str, event: str, hr: int, spo2: int, lat: float, lng: float) -> bool:
        """
        Gửi cảnh báo sức khỏe
        
        Args:
            user_name: Tên người dùng
            event: Loại sự kiện
            hr: Heart rate
            spo2: SpO2
            lat: Latitude
            lng: Longitude
        
        Returns:
            True nếu thành công
        """
        message = f"""
[CANH BAO] SUC KHOE

Nguoi dung: {user_name}
Su kien: {event}
Nhip tim: {hr} BPM
SpO2: {spo2}%
Vi tri: {lat:.6f}, {lng:.6f}

[MAPS] https://www.google.com/maps?q={lat},{lng}
        """.strip()
        
        success = self.send_message(message)
        self.send_location(lat, lng)
        return success
    
    def send_fall_alert(self, user_name: str, lat: float, lng: float) -> bool:
        """
        Gửi cảnh báo ngã khẩn cấp
        
        Args:
            user_name: Tên người dùng
            lat: Latitude
            lng: Longitude
        
        Returns:
            True nếu thành công
        """
        message = f"""
[SOS] CANH BAO TEN GAY KHANCAP [SOS]

Nguoi dung: {user_name}
Vi tri: {lat:.6f}, {lng:.6f}
Thoi gian: Ngay bay gio

HANH DONG NGAY:
1) Goi cap cuu: 115
2) Kiem tra tinh trang benh nhan
3) Cung cap vi tri chinh xac

[MAPS] https://www.google.com/maps?q={lat},{lng}
        """.strip()
        
        success = self.send_message(message)
        self.send_location(lat, lng)
        return success

# Initialize global messenger
telegram = TelegramMessenger(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
