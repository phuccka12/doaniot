"""
Firebase Utilities - Cấu hình kết nối Firebase Realtime Database
"""

import firebase_admin
from firebase_admin import credentials, db
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase (using service account key)
# Download your service account key from Firebase Console
# Settings > Service Accounts > Generate new private key
try:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://YOUR_PROJECT.firebaseio.com'
    })
    logger.info("✓ Firebase initialized successfully")
except FileNotFoundError:
    logger.warning("⚠️ serviceAccountKey.json not found. Please download from Firebase Console")
except Exception as e:
    logger.error(f"✗ Firebase initialization error: {e}")

def write_health_data(user_id: str, data: dict) -> bool:
    """
    Ghi dữ liệu sức khỏe lên Firebase Realtime Database
    
    Args:
        user_id: ID của người dùng
        data: Dict chứa {hr, spo2, lat, lng, fall, ai_status, last_seen}
    
    Returns:
        True nếu thành công, False nếu thất bại
    """
    try:
        db.reference(f'health_monitoring/{user_id}').update(data)
        logger.info(f"✓ Dữ liệu {user_id} đã được cập nhật: {data}")
        return True
    except Exception as e:
        logger.error(f"✗ Lỗi ghi dữ liệu {user_id}: {e}")
        return False

def create_incident_log(user_id: str, event: str, location: str, lat: float, lng: float, patient_name: str) -> bool:
    """
    Tạo bản ghi sự cố (incident log) khi phát hiện ngã
    
    Args:
        user_id: ID người dùng
        event: Mô tả sự kiện (e.g., "Fall detected")
        location: Vị trí địa điểm
        lat: Latitude
        lng: Longitude
        patient_name: Tên bệnh nhân
    
    Returns:
        True nếu thành công
    """
    try:
        from datetime import datetime
        import time
        
        log_data = {
            "userId": user_id,
            "event": event,
            "status": "Mới",
            "location": location,
            "lat": lat,
            "lng": lng,
            "timestamp": int(time.time() * 1000),
            "patientName": patient_name
        }
        
        # Push to logs collection
        ref = db.reference('logs')
        ref.push(log_data)
        logger.info(f"✓ Bản ghi sự cố tạo cho {user_id}: {event}")
        return True
    except Exception as e:
        logger.error(f"✗ Lỗi tạo bản ghi sự cố: {e}")
        return False

def get_user_settings(user_id: str) -> dict:
    """
    Lấy cài đặt cảnh báo của người dùng từ Firebase
    
    Args:
        user_id: ID người dùng
    
    Returns:
        Dict với {minHr, maxHr, minSpO2}
    """
    try:
        result = db.reference(f'settings/{user_id}').get()
        if result:
            return result.val() if hasattr(result, 'val') else result
        else:
            # Return defaults
            return {"minHr": 40, "maxHr": 120, "minSpO2": 90}
    except Exception as e:
        logger.error(f"✗ Lỗi lấy cài đặt {user_id}: {e}")
        return {"minHr": 40, "maxHr": 120, "minSpO2": 90}

def update_last_seen(user_id: str) -> bool:
    """
    Cập nhật thời gian hoạt động cuối cùng (last_seen)
    
    Args:
        user_id: ID người dùng
    
    Returns:
        True nếu thành công
    """
    try:
        import time
        db.reference(f'health_monitoring/{user_id}').update({
            "last_seen": int(time.time() * 1000)
        })
        return True
    except Exception as e:
        logger.error(f"✗ Lỗi cập nhật last_seen {user_id}: {e}")
        return False
