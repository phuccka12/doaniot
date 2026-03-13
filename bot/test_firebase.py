#!/usr/bin/env python3
"""
Test Firebase Data Push - Gửi dữ liệu test từ Python tới Firestore
Dùng để test bot listener
"""

import os
from dotenv import load_dotenv

load_dotenv()

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    from datetime import datetime
    import time
    
    # Initialize Firebase
    if not firebase_admin.get_app():
        # Try to use serviceAccountKey.json
        if os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            print("[OK] Firebase initialized with serviceAccountKey.json")
        else:
            print("[ERROR] serviceAccountKey.json not found!")
            exit(1)
    
    db = firestore.client()
    
    def test_fall_alert():
        """Test: Trigger fall detection alert"""
        print("\n[TEST] Sending fall alert...")
        
        db.collection('health_monitoring').document('phuc_dev').update({
            'fall': True,
            'name': 'Phuc',
            'hr': 92,
            'spo2': 95,
            'lat': 10.8123,
            'lng': 106.6299,
            'phone': '0909123456',
            'last_seen': firestore.SERVER_TIMESTAMP
        })
        
        print("[OK] Fall alert sent to Firestore")
        print("    - Check bot console for '[SOS] TE PHAT HIEN'")
        print("    - Check Telegram for SOS message")
        time.sleep(2)
        
        # Reset fall
        print("[INFO] Resetting fall status...")
        db.collection('health_monitoring').document('phuc_dev').update({'fall': False})
    
    def test_health_alert():
        """Test: Trigger health alert (high HR)"""
        print("\n[TEST] Sending health alert...")
        
        db.collection('logs').add({
            'userId': 'phuc_dev',
            'event': 'Heart Rate Alert',
            'patientName': 'Phuc',
            'status': 'Moi',
            'location': 'TP.HCM',
            'lat': 10.8123,
            'lng': 106.6299,
            'hr': 125,
            'spo2': 92,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        print("[OK] Health alert sent to Firestore")
        print("    - Check bot console for '[LOG] New incident'")
        print("    - Check Telegram for alert message")
        time.sleep(2)
    
    def test_spo2_alert():
        """Test: Trigger SpO2 low alert"""
        print("\n[TEST] Sending SpO2 alert...")
        
        db.collection('logs').add({
            'userId': 'phuc_dev',
            'event': 'SpO2 Critical Low',
            'patientName': 'Phuc',
            'status': 'Moi',
            'location': 'TP.HCM',
            'lat': 10.8123,
            'lng': 106.6299,
            'hr': 95,
            'spo2': 88,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        print("[OK] SpO2 alert sent to Firestore")
        print("    - Check Telegram for alert message")
        time.sleep(2)
    
    def test_device_update():
        """Test: Update device data"""
        print("\n[TEST] Updating device data...")
        
        db.collection('health_monitoring').document('phuc_dev').update({
            'name': 'Phuc Nguyen',
            'hr': 78,
            'spo2': 99,
            'lat': 10.8234,
            'lng': 106.6456,
            'fall': False,
            'ai_status': 'Normal',
            'phone': '0909123456',
            'last_seen': firestore.SERVER_TIMESTAMP
        })
        
        print("[OK] Device updated")
        print("    - Check bot console for '[DEVICE]' log")
        time.sleep(1)
    
    def main():
        """Interactive menu"""
        print("\n" + "="*60)
        print("FIREBASE TEST UTILITY")
        print("="*60)
        print("\nNote: Bot must be running to see alerts!")
        print("  Terminal 1: python firebase_listener.py")
        print("  Terminal 2: python test_firebase.py")
        print("\n" + "="*60)
        
        while True:
            print("\n[MENU] Choose test:")
            print("  1 - Fall Detection Alert")
            print("  2 - High Heart Rate Alert")
            print("  3 - Low SpO2 Alert")
            print("  4 - Update Device Data")
            print("  5 - Run All Tests")
            print("  0 - Exit")
            
            choice = input("\nChoice (0-5): ").strip()
            
            if choice == '1':
                test_fall_alert()
            elif choice == '2':
                test_health_alert()
            elif choice == '3':
                test_spo2_alert()
            elif choice == '4':
                test_device_update()
            elif choice == '5':
                test_fall_alert()
                test_health_alert()
                test_spo2_alert()
                test_device_update()
            elif choice == '0':
                print("\n[EXIT] Goodbye!")
                break
            else:
                print("[ERROR] Invalid choice")
    
    if __name__ == "__main__":
        main()

except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("\nInstall Firebase:")
    print("  pip install firebase-admin")
except Exception as e:
    print(f"[ERROR] {e}")
    print("\nMake sure:")
    print("  1. serviceAccountKey.json exists in bot folder")
    print("  2. Firebase project is created")
    print("  3. Firestore database is enabled")
