# 🤖 AI Health Server (v4)

Máy chủ phân tích sức khỏe thời gian thực sử dụng Machine Learning (XGBoost & Isolation Forest).

## 📋 Yêu cầu hệ thống
- **Python**: 3.8 trở lên.
- **Thư viện**: Cài đặt qua file `requirements.txt`.
  ```bash
  pip install -r requirements.txt
  ```

## 🚀 Cách chạy Server
Để khởi động server và cho phép các thiết bị khác (như điện thoại Android) truy cập, hãy dùng lệnh sau:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8999
```

---

## ⚠️ LƯU Ý QUAN TRỌNG (Về file Model)

File mô hình trí tuệ nhân tạo **`health_ai_super_pro_v4.pkl`** có kích thước lớn và chứa dữ liệu quan trọng, do đó **không được đẩy lên GitHub** (đã nằm trong `.gitignore`).

👉 **Để có file mô hình này, vui lòng liên hệ: PHÚC** để được bàn giao trực tiếp.

---

## 🛠️ Chi tiết kỹ thuật
- **Port**: `8999`
- **Features (8 chỉ số)**: `hr`, `spo2`, `a_mag`, `hr_spo2_ratio`, `activity_index`, `hr_squared`, `spo2_drop`, `hr_spo2_interaction`.
- **Logic**: Kết hợp luật y khoa cứng (Safeguards) và AI dự đoán để đưa ra kết quả chính xác nhất.
