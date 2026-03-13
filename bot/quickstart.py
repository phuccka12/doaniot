#!/usr/bin/env python3
"""
Quick Start - Chạy bot với cấu hình mô phỏng (test mode)
Chế độ này không cần Firebase, chỉ cần Telegram Bot Token
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from config import IOT_DEVICES, SENSOR_SIMULATION
from sensor_simulator import simulator
from telegram_messenger import telegram
import logging
import time
import threading

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("bot.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def simulate_health_monitoring():
    """
    Chế độ test: Mô phỏng dữ liệu health monitoring và gửi cảnh báo Telegram
    """
    logger.info("=" * 60)
    logger.info("[BOT] IOT HEALTH MONITORING BOT (TEST MODE)")
    logger.info("=" * 60)
    logger.info("[CONFIG]")
    logger.info(f"   - Thiet bi: {', '.join(IOT_DEVICES.keys())}")
    logger.info(f"   - Cap nhat moi: {SENSOR_SIMULATION['update_interval']}s")
    logger.info(f"   - Telegram Bot: {'[OK] Ket noi' if telegram.bot_token else '[ERROR] Chua cau hinh'}")
    logger.info("=" * 60)
    
    running = [True]  # Use list to avoid nonlocal issues
    
    def monitoring_loop():
        """Loop theo dõi các thiết bị"""
        while running[0]:
            try:
                for device_id, device_info in IOT_DEVICES.items():
                    # Get simulated sensor data
                    sensor_data = simulator.simulate_data(device_id)
                    
                    if not sensor_data:
                        logger.warning(f"No data for {device_id}")
                        continue
                    
                    # Log current status
                    logger.info(f"[DATA] {device_id}: HR={sensor_data['hr']} SpO2={sensor_data['spo2']}% Fall={sensor_data['fall']}")
                    
                    # FORCE TEST MODE: Send alerts every time
                    msg = f"[TEST] HR: {sensor_data['hr']} BPM | SpO2: {sensor_data['spo2']}%\n{device_info['name']}\n{device_info['location']}"
                    telegram.send_message(msg)
                    logger.info(f"[MSG SENT] {device_id} -> Telegram")
                    
                    # Every 3rd update, simulate fall
                    if int(time.time()) % 15 == 0:  # Trigger every 15 seconds
                        logger.error(f"[SOS] FALL DETECTED: {device_id}")
                        telegram.send_fall_alert(
                            user_name=device_info['name'],
                            lat=sensor_data['lat'],
                            lng=sensor_data['lng']
                        )
                        logger.info(f"[SOS SENT] {device_id} -> Telegram")
                
                # Wait before next update
                time.sleep(SENSOR_SIMULATION["update_interval"])
                
            except KeyboardInterrupt:
                logger.info("[STOP] Stopped by user")
                running[0] = False
            except Exception as e:
                logger.error(f"[ERROR] Error in monitoring loop: {e}")
                time.sleep(1)
    
    # Start monitoring in background thread
    monitor_thread = threading.Thread(target=monitoring_loop, daemon=True)
    monitor_thread.start()
    
    logger.info("[START] Monitoring started. Press Ctrl+C to stop.")
    
    # Keep main thread alive
    try:
        while running[0]:
            time.sleep(1)
    except KeyboardInterrupt:
        running[0] = False
        logger.info("[STOP] Bot stopped")

if __name__ == "__main__":
    simulate_health_monitoring()
