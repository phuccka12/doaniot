# Hướng dẫn kết nối AI Server Luôn Luôn Hoạt Động (ngrok)

Để App Android có thể kết nối với AI Server từ bất cứ đâu (Wifi trường, Cafe, 4G) mà không cần đổi IP, hãy làm theo 3 bước sau:

### Bước 1: Đăng ký Domain miễn phí (Chỉ làm 1 lần)
1. Truy cập [ngrok.com](https://ngrok.com/) và đăng ký tài khoản miễn phí.
2. Tại menu bên trái, chọn **Cloud Edge** -> **Domains**.
3. Nhấn **Create Domain**. ngrok sẽ cấp cho bạn 1 cái tên miễn phí (Ví dụ: `https://abcd-123.ngrok-free.app`). **Hãy lưu lại tên này.**
4. Vào phần **Your Authtoken**, copy mã token của bạn.

### Bước 2: Cài đặt vào Project
1. Mở file `MainActivity.java` trong Android Studio.
2. Tìm dòng `AI_SERVER_URL` và dán cái tên domain bạn vừa nhận được vào:
   ```java
   private static final String AI_SERVER_URL = "https://abcd-123.ngrok-free.app/";
   ```
3. Sau đó nhấn **Run** để cài lại App vào điện thoại.

### Bước 3: Chạy Server (Làm mỗi khi muốn dùng)
1. Mở terminal tại thư mục `ai-server`.
2. Chạy lệnh:
   ```cmd
   python -m uvicorn main:app --host 0.0.0.0 --port 8999
   ```
3. Mở một terminal mới và chạy ngrok (sau khi đã cài ngrok vào máy):
   ```cmd
   ngrok http --url=abcd-123.ngrok-free.app 8999
   ```

---
**🚀 Xong!** Bây giờ dù bạn mang PC hay Laptop đi đâu, chỉ cần chạy 2 lệnh ở Bước 3 là App Android sẽ tự động kết nối được ngay!
