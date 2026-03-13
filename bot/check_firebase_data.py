#!/usr/bin/env python3
"""
Check Firebase Data - Xem dữ liệu trong Firestore
Giúp debug vị trí và dữ liệu khác
"""

import os
from dotenv import load_dotenv

load_dotenv()

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    import json
    
    # Initialize Firebase
    if os.path.exists("serviceAccountKey.json"):
        cred = credentials.Certificate("serviceAccountKey.json")
        try:
            firebase_admin.get_app()
        except:
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        
        print("\n" + "="*60)
        print("FIREBASE DATA CHECKER")
        print("="*60)
        
        # Check health_monitoring
        print("\n[1] health_monitoring collection:")
        print("-" * 60)
        docs = db.collection('health_monitoring').stream()
        for doc in docs:
            data = doc.to_dict()
            print(f"\nDevice: {doc.id}")
            print(f"  Name: {data.get('name')}")
            print(f"  Location: {data.get('location')}")
            print(f"  Latitude: {data.get('lat')}")
            print(f"  Longitude: {data.get('lng')}")
            print(f"  HR: {data.get('hr')}")
            print(f"  SpO2: {data.get('spo2')}")
            print(f"  Fall: {data.get('fall')}")
            
            # Check if coordinates are valid
            lat = data.get('lat')
            lng = data.get('lng')
            if lat and lng:
                # Valid Vietnam coordinates should be around:
                # Lat: 8-24, Lng: 102-110
                if 8 <= float(lat) <= 24 and 102 <= float(lng) <= 110:
                    print(f"  ✅ Valid Vietnam coordinates")
                    print(f"     Maps: https://www.google.com/maps?q={lat},{lng}")
                else:
                    print(f"  ⚠️  WRONG COORDINATES! (looks like not Vietnam)")
                    print(f"     Current: {lat}, {lng}")
                    print(f"     Should be around: 10.77, 106.63 (HCM)")
        
        # Check logs
        print("\n\n[2] logs collection (last 5):")
        print("-" * 60)
        docs = db.collection('logs').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(5).stream()
        for doc in docs:
            data = doc.to_dict()
            print(f"\nLog: {doc.id}")
            print(f"  Event: {data.get('event')}")
            print(f"  Patient: {data.get('patientName')}")
            print(f"  Location: {data.get('location')}")
            print(f"  Latitude: {data.get('lat')}")
            print(f"  Longitude: {data.get('lng')}")
            
            lat = data.get('lat')
            lng = data.get('lng')
            if lat and lng:
                if 8 <= float(lat) <= 24 and 102 <= float(lng) <= 110:
                    print(f"  ✅ Valid Vietnam coordinates")
                else:
                    print(f"  ⚠️  WRONG COORDINATES!")
        
        # Check settings
        print("\n\n[3] settings collection:")
        print("-" * 60)
        docs = db.collection('settings').stream()
        for doc in docs:
            data = doc.to_dict()
            print(f"\nUser: {doc.id}")
            print(f"  Min HR: {data.get('minHr')}")
            print(f"  Max HR: {data.get('maxHr')}")
            print(f"  Min SpO2: {data.get('minSpO2')}")
        
        print("\n" + "="*60)
        print("\n[HOW TO FIX BAD COORDINATES]")
        print("1. Go to: https://console.firebase.google.com")
        print("2. Select your project")
        print("3. Go to Firestore")
        print("4. Find health_monitoring/phuc_dev")
        print("5. Edit 'lat' field: change to 10.7749327")
        print("6. Edit 'lng' field: change to 106.6296391")
        print("\nOR use script below to auto-fix...")
        print("="*60)
        
    else:
        print("[ERROR] serviceAccountKey.json not found!")
        
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
