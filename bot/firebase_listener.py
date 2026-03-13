"""
Firebase Real-time Listener - Nghe cảnh báo từ Firestore
Khi có người té hoặc HR/SpO2 bất thường -> Gửi Telegram ngay
"""

import sys
import io

# Force UTF-8 encoding for console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import firebase_admin
from firebase_admin import credentials, firestore
from telegram_messenger import telegram
from config import FIREBASE_CREDENTIALS_PATH
import logging
import time
from datetime import datetime

# Setup logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("bot.log", encoding='utf-8'),
        logging.StreamHandler(sys.stdout)

    ]
)
logger = logging.getLogger(__name__)

# Initialize Firebase
try:
    import os
    
    # Check if serviceAccountKey.json exists
    if os.path.exists(FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        try:
            firebase_admin.get_app()
            logger.info("[FIREBASE] App already initialized")
        except ValueError:
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("[FIREBASE] Da ket noi Firebase Firestore")
    else:
        logger.warning(f"[WARNING] File not found: {FIREBASE_CREDENTIALS_PATH}")
        db = None
        
except Exception as e:
    logger.warning(f"[WARNING] Firebase khong co: {e}")
    logger.info("[MODE] Chay o test mode (khong Firebase)")
    db = None

class FirebaseListener:
    def __init__(self):
        self.db = db
        self.last_processed = {}  # Track processed alerts to avoid duplicates
        
    def listen_fall_detection(self):
        """
        Nghe health_monitoring/{userId}.fall
        Khi fall: true -> Gửi SOS alert
        """
        if not self.db:
            logger.warning("[SKIP] Firebase khong co, bo qua fall detection listener")
            return
        
        def on_change(doc_snapshot, changes, read_time):
            try:
                for change in changes:
                    if change.type.name == 'MODIFIED':
                        doc = change.document
                        user_id = doc.id
                        data = doc.to_dict()
                        
                        # Check if fall detected
                        if data.get('fall') == True:
                            logger.error(f"[SOS] TE PHAT HIEN: {user_id}")
                            
                            # Get user info
                            name = data.get('name', user_id)
                            try:
                                lat = float(data.get('lat', 0))
                                lng = float(data.get('lng', 0))
                            except:
                                lat = 0.0
                                lng = 0.0
                            
                            hr = data.get('hr', 'N/A')
                            spo2 = data.get('spo2', 'N/A')
                            
                            # Build maps URL
                            maps_url = f"https://www.google.com/maps?q={lat:.6f},{lng:.6f}" if lat != 0 and lng != 0 else "https://www.google.com/maps"
                            
                            # Send SOS alert via Telegram
                            msg = f"""
[SOS] CANH BAO TE GAY KHANCAP [SOS]

Nguoi dung: {name}
User ID: {user_id}
Nhip tim: {hr} BPM
SpO2: {spo2}%
Vi tri: {lat:.6f}, {lng:.6f}
Thoi gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

HANH DONG NGAY:
1) Goi cap cuu: 115
2) Kiem tra tinh trang benh nhan
3) Cung cap vi tri chinh xac

[MAPS] {maps_url}
                            """.strip()
                            
                            telegram.send_message(msg)
                            # Don't send location pin separately - link in message is enough!
                            # if lat != 0 and lng != 0:
                            #     try:
                            #         telegram.send_location(float(lat), float(lng))
                            #         logger.info(f"[SOS LOCATION SENT] {lat}, {lng} -> Telegram")
                            #     except Exception as le:
                            #         logger.error(f"[ERROR] Failed to send SOS location: {le}")
                            logger.info(f"[SOS SENT] {user_id} -> Telegram")
                            
            except Exception as e:
                logger.error(f"[ERROR] Listen fall detection: {e}")
        
        try:
            logger.info("[LISTEN] Dang theo doi: health_monitoring (fall detection)...")
            collection_ref = self.db.collection('health_monitoring')
            collection_ref.on_snapshot(on_change)
        except Exception as e:
            logger.error(f"[ERROR] Setup fall listener failed: {e}")
    
    def listen_health_alerts(self):
        """
        Nghe /logs collection
        Khi co log moi -> Kiem tra type va gui canh bao Telegram
        """
        if not self.db:
            logger.warning("[SKIP] Firebase khong co, bo qua health alerts listener")
            return
        
        def on_change(doc_snapshot, changes, read_time):
            try:
                for change in changes:
                    if change.type.name == 'ADDED':
                        doc = change.document
                        log_id = doc.id
                        data = doc.to_dict()
                        
                        # Avoid duplicate processing
                        if log_id in self.last_processed:
                            continue
                        self.last_processed[log_id] = True
                        
                        event = data.get('event', 'Unknown Event')
                        user_id = data.get('userId', 'unknown')
                        status = data.get('status', 'Moi')
                        location = data.get('location', 'N/A')
                        
                        # Ensure lat/lng are floats
                        # Try from 'lat'/'lng' fields first
                        lat = data.get('lat')
                        lng = data.get('lng')
                        
                        # If not found, try to parse from 'location' string (format: "10.123, 106.456")
                        if not lat or not lng:
                            if location and location != 'N/A' and ',' in str(location):
                                try:
                                    parts = str(location).split(',')
                                    lat = float(parts[0].strip())
                                    lng = float(parts[1].strip())
                                except:
                                    lat = 0.0
                                    lng = 0.0
                        
                        # Fallback to 0
                        if not lat:
                            lat = 0.0
                        if not lng:
                            lng = 0.0
                        
                        try:
                            lat = float(lat)
                            lng = float(lng)
                        except:
                            lat = 0.0
                            lng = 0.0
                        
                        patient_name = data.get('patientName', user_id)
                        
                        logger.info(f"[LOG] New incident: {event} - {patient_name}")
                        
                        # Build message
                        if event.lower() == 'fall detected' or 'te' in event.lower():
                            maps_url = f"https://www.google.com/maps?q={lat:.6f},{lng:.6f}" if lat != 0 and lng != 0 else "https://www.google.com/maps"
                            msg = f"""
[SOS] CANH BAO TE GAY {event.upper()}

Nguoi dung: {patient_name}
Vi tri: {location}
Toa do: {lat:.6f}, {lng:.6f}
Trang thai: {status}
Thoi gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

[MAPS] {maps_url}
                            """.strip()
                        else:
                            maps_url = f"https://www.google.com/maps?q={lat:.6f},{lng:.6f}" if lat != 0 and lng != 0 else "https://www.google.com/maps"
                            msg = f"""
[CANH BAO] {event}

Nguoi dung: {patient_name}
Vi tri: {location}
Trang thai: {status}
Log ID: {log_id}

[MAPS] {maps_url}
                            """.strip()
                        
                        telegram.send_message(msg)
                        # Don't send location pin separately - link in message is enough!
                        # if lat != 0 and lng != 0:
                        #     try:
                        #         telegram.send_location(float(lat), float(lng))
                        #         logger.info(f"[LOCATION SENT] {lat}, {lng} -> Telegram")
                        #     except Exception as le:
                        #         logger.error(f"[ERROR] Failed to send location: {le}")
                        logger.info(f"[ALERT SENT] {log_id} -> Telegram")
                        
            except Exception as e:
                logger.error(f"[ERROR] Listen health alerts: {e}")
        
        try:
            logger.info("[LISTEN] Dang theo doi: logs (health alerts)...")
            collection_ref = self.db.collection('logs')
            collection_ref.on_snapshot(on_change)
        except Exception as e:
            logger.error(f"[ERROR] Setup logs listener failed: {e}")
    
    def listen_devices(self):
        """
        Nghe danh sach devices trong health_monitoring
        Cap nhat online/offline status
        """
        if not self.db:
            logger.warning("[SKIP] Firebase khong co, bo qua devices listener")
            return
        
        def on_change(doc_snapshot, changes, read_time):
            try:
                for change in changes:
                    doc = change.document
                    user_id = doc.id
                    data = doc.to_dict()
                    
                    if data.get('last_seen'):
                        try:
                            # Handle both Timestamp and seconds format
                            if hasattr(data['last_seen'], 'timestamp'):
                                ts = int(data['last_seen'].timestamp())
                            elif hasattr(data['last_seen'], 'seconds'):
                                ts = data['last_seen'].seconds
                            else:
                                ts = int(data['last_seen'])
                            
                            time_ago = int(time.time()) - ts
                            status = "ONLINE" if time_ago < 30 else "OFFLINE"
                            # Skip verbose logging to reduce noise
                            # logger.info(f"[DEVICE] {user_id}: {status} ({time_ago}s ago)")
                        except Exception as te:
                            pass  # Skip timestamp conversion errors
                        
            except Exception as e:
                logger.error(f"[ERROR] Listen devices: {e}")
        
        try:
            logger.info("[LISTEN] Dang theo doi: health_monitoring (devices)...")
            collection_ref = self.db.collection('health_monitoring')
            collection_ref.on_snapshot(on_change)
        except Exception as e:
            logger.error(f"[ERROR] Setup devices listener failed: {e}")


def run_firebase_listener():
    """
    Main function: Start all Firebase listeners
    """
    logger.info("=" * 60)
    logger.info("[BOT] IOT FIREBASE LISTENER MODE")
    logger.info("=" * 60)
    logger.info("[CONFIG] Nghe real-time alerts tu Firestore")
    logger.info("[TELEGRAM] Bot da ket noi")
    logger.info("=" * 60)
    
    listener = FirebaseListener()
    
    # Start listening
    if listener.db:
        listener.listen_fall_detection()
        listener.listen_health_alerts()
        listener.listen_devices()
        
        logger.info("[START] Listening started. Press Ctrl+C to stop.")
        
        # Keep the listener running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("[STOP] Listener stopped")
    else:
        logger.error("[ERROR] Firebase khong co. Vui long cau hinh Firebase credentials!")


if __name__ == "__main__":
    run_firebase_listener()
