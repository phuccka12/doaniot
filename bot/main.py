"""
Main Bot Engine - Bot chính điều phối tất cả các thành phần
"""

import logging
import time
import threading
from datetime import datetime
from config import IOT_DEVICES, SENSOR_SIMULATION, ALERT_THRESHOLDS
from sensor_simulator import simulator
from telegram_messenger import telegram
import firebase_utils as fb

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("bot.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class HealthMonitoringBot:
    def __init__(self):
        self.running = False
        self.devices = IOT_DEVICES
        self.alert_thresholds = ALERT_THRESHOLDS
        self.sensor_config = SENSOR_SIMULATION
        self.fall_detected_count = {}  # Track fall detection
        
        logger.info("=" * 60)
        logger.info("🤖 IOT HEALTH MONITORING BOT INITIALIZED")
        logger.info("=" * 60)
        
        # Initialize fall detection tracking
        for device_id in self.devices:
            self.fall_detected_count[device_id] = 0
    
    def check_health_alerts(self, device_id: str, data: dict, settings: dict):
        """
        Kiểm tra các cảnh báo sức khỏe
        
        Args:
            device_id: ID thiết bị
            data: Dữ liệu cảm biến
            settings: Cài đặt người dùng
        """
        device_info = self.devices[device_id]
        alerts = []
        
        # Check heart rate
        if data["hr"] < settings["minHr"]:
            alerts.append(f"❤️ Nhịp tim quá thấp: {data['hr']} BPM (ngưỡng: {settings['minHr']})")
        elif data["hr"] > settings["maxHr"]:
            alerts.append(f"❤️ Nhịp tim quá cao: {data['hr']} BPM (ngưỡng: {settings['maxHr']})")
        
        # Check SpO2
        if data["spo2"] < settings["minSpO2"]:
            alerts.append(f"🫁 SpO2 quá thấp: {data['spo2']}% (ngưỡng: {settings['minSpO2']}%)")
        
        # Send alerts if any
        if alerts:
            message = f"<b>⚠️ CẢNH BÁO SỨC KHỎE</b>\n\n"
            message += f"👤 <b>{device_info['name']}</b>\n"
            for alert in alerts:
                message += f"{alert}\n"
            message += f"\n📍 <a href=\"https://www.google.com/maps?q={data['lat']},{data['lng']}\">Vị trí</a>"
            
            telegram.send_message(message)
            logger.warning(f"⚠️ Alert sent for {device_id}: {', '.join(alerts)}")
        
        # Create incident log for alerts
        if alerts:
            fb.create_incident_log(
                user_id=device_id,
                event=alerts[0],
                location=device_info["location"],
                lat=data["lat"],
                lng=data["lng"],
                patient_name=device_info["name"]
            )
    
    def handle_fall_detection(self, device_id: str, data: dict):
        """
        Xử lý phát hiện ngã
        
        Args:
            device_id: ID thiết bị
            data: Dữ liệu cảm biến
        """
        device_info = self.devices[device_id]
        
        if data["fall"]:
            self.fall_detected_count[device_id] += 1
            
            # Send alert only on first detection
            if self.fall_detected_count[device_id] == 1:
                logger.error(f"🚨 FALL DETECTED: {device_id}")
                
                # Send Telegram alert
                telegram.send_fall_alert(
                    user_name=device_info["name"],
                    lat=data["lat"],
                    lng=data["lng"]
                )
                
                # Create incident log
                fb.create_incident_log(
                    user_id=device_id,
                    event="Fall Detected - Tế Ngã Phát Hiện",
                    location=device_info["location"],
                    lat=data["lat"],
                    lng=data["lng"],
                    patient_name=device_info["name"]
                )
        else:
            # Reset counter when fall is not detected
            if self.fall_detected_count[device_id] > 0:
                logger.info(f"✓ Fall status cleared for {device_id}")
            self.fall_detected_count[device_id] = 0
    
    def process_device_data(self, device_id: str):
        """
        Xử lý dữ liệu một thiết bị
        
        Args:
            device_id: ID thiết bị
        """
        try:
            # Get simulated or real sensor data
            if self.sensor_config["enabled"]:
                sensor_data = simulator.simulate_data(device_id)
            else:
                # In real scenario, read from MQTT, HTTP, or serial
                sensor_data = self.read_real_sensor(device_id)
            
            if not sensor_data:
                logger.warning(f"No data for {device_id}")
                return
            
            device_info = self.devices[device_id]
            
            # Update Firebase with sensor data
            fb.write_health_data(device_id, {
                "name": device_info["name"],
                "hr": sensor_data["hr"],
                "spo2": sensor_data["spo2"],
                "lat": sensor_data["lat"],
                "lng": sensor_data["lng"],
                "fall": sensor_data["fall"],
                "ai_status": sensor_data["ai_status"],
                "phone": device_info["phone"],
                "last_seen": {".sv": "timestamp"}
            })
            
            # Get user settings
            settings = fb.get_user_settings(device_id)
            
            # Check for health alerts
            self.check_health_alerts(device_id, sensor_data, settings)
            
            # Handle fall detection
            self.handle_fall_detection(device_id, sensor_data)
            
            # Log current status
            logger.info(f"📊 {device_id}: HR={sensor_data['hr']} SpO2={sensor_data['spo2']}% Fall={sensor_data['fall']}")
            
        except Exception as e:
            logger.error(f"Error processing {device_id}: {e}")
    
    def read_real_sensor(self, device_id: str) -> dict:
        """
        Đọc dữ liệu từ thiết bị thực (sẽ được triển khai)
        
        Args:
            device_id: ID thiết bị
        
        Returns:
            Dict dữ liệu cảm biến
        """
        # This would be implemented for real devices
        # (MQTT, HTTP, Serial, etc.)
        return None
    
    def run_monitoring_loop(self):
        """
        Vòng lặp chính theo dõi tất cả thiết bị
        """
        logger.info(f"⏱️ Starting monitoring loop (interval: {self.sensor_config['update_interval']}s)")
        
        while self.running:
            try:
                for device_id in self.devices:
                    self.process_device_data(device_id)
                
                # Wait before next update
                time.sleep(self.sensor_config["update_interval"])
                
            except KeyboardInterrupt:
                logger.info("Keyboard interrupt received")
                self.stop()
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(1)
    
    def start(self):
        """
        Khởi động bot
        """
        self.running = True
        logger.info("🚀 Bot is starting...")
        
        # Start monitoring in a separate thread
        monitor_thread = threading.Thread(target=self.run_monitoring_loop, daemon=True)
        monitor_thread.start()
        
        logger.info("✓ Monitoring thread started")
        logger.info("Press Ctrl+C to stop the bot")
        
        # Keep main thread alive
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()
    
    def stop(self):
        """
        Dừng bot
        """
        self.running = False
        logger.info("🛑 Bot is stopping...")
        logger.info("=" * 60)

# Global bot instance
bot = HealthMonitoringBot()

if __name__ == "__main__":
    bot.start()
