# Hướng dẫn Debug App React Native

## 📱 Tình trạng hiện tại
- ✅ Đã xóa toàn bộ phần diễn viên (ActorsScreen, ActorDetailScreen, tab Diễn viên)
- ✅ Đã cải thiện màn hình đăng nhập với tài khoản demo
- ✅ Đã thêm debug tools và error handling
- ✅ Tất cả file không có lỗi syntax

## 🚀 Cách chạy app

### 1. Cài đặt dependencies
```bash
cd FontendApp
npm install
```

### 2. Khởi động Expo development server
```bash
npx expo start
```

### 3. Chạy trên thiết bị
- **Android**: Dùng Expo Go app hoặc `npx expo start --android`
- **iOS**: Dùng Expo Go app hoặc `npx expo start --ios`
- **Web**: `npx expo start --web`

## 🔐 Tài khoản demo để test đăng nhập

### Tài khoản offline (không cần internet)
- `test@demo.com` / `123456`
- `admin@demo.com` / `admin123`
- `user@demo.com` / `user123`

### Tài khoản API thật (cần internet)
- Cần có tài khoản đã đăng ký và xác thực OTP từ server

## 🐛 Debug tools trong màn hình đăng nhập

### 1. Nút "📝 Điền tài khoản demo"
- Tự động điền email/password demo

### 2. Nút "🔗 Test kết nối API"
- Kiểm tra kết nối đến server
- Hiển thị response status và error

### 3. Nút "🐛 Debug Navigation"
- Kiểm tra navigation object có hoạt động
- Xem current route

## 🔧 Nếu đăng nhập không được

### 1. Kiểm tra console logs
- Mở Metro bundler terminal
- Xem logs khi nhấn đăng nhập
- Tìm error messages

### 2. Test tài khoản demo trước
- Dùng `test@demo.com` / `123456`
- Nếu demo không chạy = lỗi navigation
- Nếu demo chạy nhưng API không = lỗi network

### 3. Test kết nối API
- Nhấn nút "Test kết nối API"
- Xem response status
- Nếu status 404/500 = server có vấn đề
- Nếu network error = không có internet

### 4. Kiểm tra navigation
- Nhấn nút "Debug Navigation"
- Xem navigation object có tồn tại
- Kiểm tra MainTabs screen có được register

## 📱 Màn hình sau đăng nhập (MainTabs)

- **Home**: Trang chủ với danh sách phim
- **Ticket**: Màn hình vé
- **Movie**: Danh sách phim
- **Profile**: Thông tin cá nhân

## 🌐 API Configuration

Server: `https://my-backend-api-movie.onrender.com/api`

### Endpoints:
- Login: `/auth/login`
- Register: `/auth/register`
- Verify OTP: `/auth/verify-email`

## 📝 Các bước debug khi có lỗi

1. **Lỗi white screen**: Kiểm tra console logs, có thể lỗi syntax
2. **Lỗi navigation**: Dùng debug navigation button
3. **Lỗi API**: Dùng test connection button
4. **Lỗi authentication**: Thử tài khoản demo trước

## 🎯 Tips

- Luôn test tài khoản demo trước khi test API
- Kiểm tra internet connection nếu API không hoạt động
- Xem console logs để debug chi tiết
- Server có thể cần thời gian wake up nếu bị sleep

## 📞 Support

Nếu vẫn có lỗi, cung cấp:
1. Console error logs
2. Screenshot màn hình lỗi
3. Kết quả test connection
4. Device/emulator đang dùng
