from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả các nguồn (Web, App) gọi vào
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 1. Nạp "bộ não" Super-Pro mà ông đã lưu
try:
    system = joblib.load("health_ai_super_pro_v4.pkl")
    model = system['pipeline']
    anomaly = system['anomaly_model']
    features = system['features']
    print("✅ AI Model loaded successfully")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    # Fallback or exit


# Định nghĩa cấu trúc dữ liệu gửi từ Android/ESP32
class HealthData(BaseModel):
    hr: float
    spo2: float
    a_mag: float
    fall: bool = False


@app.post("/predict")
async def predict_health(data: HealthData):
    print(f"DEBUG: Received Data -> HR: {data.hr}, SpO2: {data.spo2}, a_mag: {data.a_mag}, Fall: {data.fall}")

    # 🚨 Ưu tiên cảnh báo Té ngã (Nếu thiết bị đã báo té)
    if data.fall:
        # Nhãn mặc định
        msg = "Fall Detected"
        advice = "🚩 PHÁT HIỆN TÉ NGÃ! Hệ thống đang gửi tín hiệu cứu hộ. Hãy giữ bình tĩnh."
        
        # AI THẨM ĐỊNH MỨC ĐỘ NGUY HIỂM:
        if data.a_mag > 3.0: 
            advice = "⚠️ AI XÁC NHẬN: CÚ TÉ CHẤN THƯƠNG MẠNH! Đang gọi cấp cứu ngay lập tức."
        elif data.hr < 50 and data.hr > 0:
            advice = "🆘 CẢNH BÁO NGUY KỊCH: Phát hiện té ngã kèm nhịp tim yếu. Cần can thiệp gấp!"
        elif data.a_mag < 1.1:
            advice = "❓ Cảnh báo: Có tín hiệu té nhưng dữ liệu ổn định. Hãy xác nhận tình trạng của bạn."

        return {
            "prediction": "Emergency", 
            "advice": advice,
            "level": 3,
            "status": "success",
            "message": msg
        }


    # 🚨 Lọc dữ liệu rác (Rút cảm biến)
    if (data.hr == 0 and data.spo2 == 0) or (data.hr < 5 and data.spo2 < 5):
        return {
            "prediction": "Sensor Offline", 
            "advice": "Hãy đeo lại đồng hồ để AI có thể theo dõi sức khỏe của bạn.",
            "level": 0,
            "status": "success"
        }

    # 🚨 Luật y khoa chặn đầu
    if data.spo2 < 85 or (data.hr > 175 and data.hr > 0):
        return {
            "prediction": "Emergency", 
            "advice": "🚩 CẢNH BÁO NGUY KỊCH: Nhịp tim hoặc SpO2 ở mức báo động!",
            "level": 3,
            "status": "success"
        }

    # CHUẨN BỊ DỮ LIỆU ĐỂ AI DỰ ĐOÁN (Đầy đủ 8 features cho v4)
    input_df = pd.DataFrame([{
        'a_mag': data.a_mag,
        'hr': data.hr,
        'spo2': data.spo2,
        'hr_spo2_ratio': data.hr / (data.spo2 + 1e-5),
        'activity_index': data.hr * data.a_mag,
        'hr_squared': data.hr ** 2,
        'spo2_drop': 100 - data.spo2,
        'hr_spo2_interaction': data.hr * data.spo2
    }])

    try:
        # 🤖 AI TÍNH TOÁN
        proba = model.predict_proba(input_df[features])
        scores = anomaly.decision_function(input_df[features])
        
        # Anomaly Boost (Giảm độ nhạy một chút để tránh báo nhầm)
        proba[:, 3] = np.where(scores < -0.2, proba[:, 3] * 1.3, proba[:, 3])
        
        res = int(np.argmax(proba, axis=1)[0])
        
        # MAPPING TRẠNG THÁI & LỜI KHUYÊN PHÁT TRIỂN (Dành cho đồ án)
        status_map = {
            0: {
                "prediction": "Bình thường", 
                "advice": "Sức khỏe ổn định. Bạn nên thực hiện bài tập thở 4-7-8 (Hít 4s, giữ 7s, thở 8s) để thư giãn tim mạch. 🧘‍♂️"
            },
            1: {
                "prediction": "Đang vận động", 
                "advice": "Vận động tốt! Đừng quên bài tập xoay cổ tay và khớp vai để giảm áp lực cơ. Hãy uống thêm 200ml nước. 🏃‍♂️💧"
            },
            2: {
                "prediction": "Cảnh báo nhẹ", 
                "advice": "Nhịp tim hơi cao. Áp dụng ngay 'Box Breathing' (Hít 4s, giữ 4s, thở 4s, giữ 4s) để điều hòa lại. ☕"
            },
            3: {
                "prediction": "Emergency", 
                "advice": "🚩 NGUY CẢNH: Hãy nằm xuống nơi thoáng mát, nới lỏng trang phục. Đang gửi tín hiệu khẩn cấp!"
            }
        }

        # 🚨 SAFEGUARD: Chỉ áp dụng nếu KHÔNG có té ngã và vitals quá đẹp
        if not data.fall and 60 <= data.hr <= 95 and data.spo2 >= 96 and res == 3:
            res = 0 # Ép về Normal nếu vitals quá hoàn hảo
            
        result = status_map.get(res, status_map[0])
        
        return {
            "prediction": result["prediction"],
            "advice": result["advice"],
            "level": res,
            "status": "success"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"prediction": "Error", "advice": "Lỗi AI", "level": 0, "status": "error", "message": str(e)}

@app.get("/health")
async def health_check():
    return {"status": "online", "model_version": "super_pro_1.0"}

# Lệnh chạy: uvicorn main:app --host 0.0.0.0 --port 8000
