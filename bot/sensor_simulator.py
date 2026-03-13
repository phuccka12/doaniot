"""
Sensor Data Simulator - Mô phỏng dữ liệu từ các thiết bị IoT
"""

import random
import math
import logging
from config import IOT_DEVICES, SENSOR_SIMULATION

logger = logging.getLogger(__name__)

class SensorSimulator:
    def __init__(self):
        self.devices = IOT_DEVICES
        self.config = SENSOR_SIMULATION
        
        # Initialize device states
        self.device_states = {}
        for device_id in self.devices:
            self.device_states[device_id] = {
                "hr": random.randint(*self.config["hr_range"]),
                "spo2": random.randint(*self.config["spo2_range"]),
                "lat": random.uniform(*self.config["lat_range"]),
                "lng": random.uniform(*self.config["lng_range"]),
                "fall": False,
                "ai_status": "Normal",
                "last_sensor_read": None
            }
    
    def simulate_data(self, device_id: str) -> dict:
        """
        Mô phỏng dữ liệu cảm biến cho một thiết bị
        
        Args:
            device_id: ID của thiết bị (e.g., 'phuc_dev')
        
        Returns:
            Dict chứa {hr, spo2, lat, lng, fall, ai_status}
        """
        if device_id not in self.device_states:
            logger.warning(f"Device {device_id} not found")
            return None
        
        state = self.device_states[device_id]
        
        # Simulate heart rate (normal variation ±5 BPM)
        state["hr"] = max(40, min(200, state["hr"] + random.randint(-5, 5)))
        
        # Simulate SpO2 (normal variation ±1%)
        state["spo2"] = max(85, min(100, state["spo2"] + random.randint(-1, 1)))
        
        # Simulate location (random walk in small area)
        lat_delta = random.uniform(-0.001, 0.001)
        lng_delta = random.uniform(-0.001, 0.001)
        state["lat"] = max(self.config["lat_range"][0], 
                          min(self.config["lat_range"][1], 
                              state["lat"] + lat_delta))
        state["lng"] = max(self.config["lng_range"][0], 
                          min(self.config["lng_range"][1], 
                              state["lng"] + lng_delta))
        
        # Random fall detection (1% chance)
        if random.random() < 0.01:
            state["fall"] = True
            state["ai_status"] = "Fall Detected"
            logger.warning(f"🚨 FALL DETECTED for {device_id}")
        else:
            state["fall"] = False
            state["ai_status"] = "Normal"
        
        return {
            "hr": state["hr"],
            "spo2": state["spo2"],
            "lat": state["lat"],
            "lng": state["lng"],
            "fall": state["fall"],
            "ai_status": state["ai_status"]
        }
    
    def get_device_info(self, device_id: str) -> dict:
        """
        Lấy thông tin thiết bị
        
        Args:
            device_id: ID của thiết bị
        
        Returns:
            Dict chứa thông tin thiết bị
        """
        return self.devices.get(device_id, {})
    
    def simulate_emergency(self, device_id: str):
        """
        Bắt buộc mô phỏng tình huống khẩn cấp (ngã)
        
        Args:
            device_id: ID của thiết bị
        """
        if device_id in self.device_states:
            self.device_states[device_id]["fall"] = True
            self.device_states[device_id]["ai_status"] = "Fall Detected"
            logger.warning(f"⚠️ Emergency simulated for {device_id}")

# Global simulator instance
simulator = SensorSimulator()
