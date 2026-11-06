# Kế Hoạch Rà Soát & Kiểm Tra Toàn Diện Hệ Thống Website THCS Nguyễn Du e-Testing

## 1. Mục Tiêu & Phạm Vi Rà Soát
Rà soát toàn diện tất cả các phân hệ của website nhằm phát hiện và khắc phục triệt để các lỗi tiềm ẩn (logic phân quyền, giao diện, luồng làm bài thi, và xuất báo cáo).

---

## 2. Kết Quả Khảo Sát Hiện Trạng & Các Vấn Đề Cần Tối Ưu

### Vấn Đề 1: Bảo Vệ Tab Báo Cáo & Phổ Điểm (`reports`)
- **Hiện trạng:** Thanh điều hướng (`Header.tsx`) đã ẩn tab `reports` đối với học sinh và khách. Tuy nhiên, trong `App.tsx` chưa có bộ bảo vệ (Access Guard) nếu URL hoặc state chuyển tới tab `reports` khi tài khoản hiện tại là học sinh hoặc khách.
- **Giải pháp:** Bổ sung màn hình thông báo giới hạn quyền truy cập tương tự trang Quản trị, hoặc tự động chuyển hướng về trang `exams` / `news`.

### Vấn Đề 2: Chuyển Hướng An Toàn Khi Đổi Tài Khoản (`handleUserChange`)
- **Hiện trạng:** Hàm `handleUserChange` trong `App.tsx` chỉ kiểm tra chuyển hướng khỏi tab `students`. Nếu một giáo viên/admin đang mở tab `admin_portal` hoặc `reports` rồi chuyển sang tài khoản học sinh/khách, giao diện có thể vẫn giữ nguyên tab cũ.
- **Giải pháp:** Cập nhật `handleUserChange` để tự động chuyển về `exams` nếu người dùng mới không có quyền truy cập vào `admin_portal`, `students` hoặc `reports`.

### Vấn Đề 3: Ẩn Đáp Án Chi Tiết Với Tài Khoản Khách (`ExamResultModal`)
- **Hiện trạng:** Trong `ExamResultModal.tsx`, biến `showDetailedAnswers` đang được tính bằng `!isStudent` (phủ định học sinh). Khi tài khoản là Khách (`guest`), đáp án đúng và lời giải vẫn có thể hiển thị.
- **Giải pháp:** Chỉnh sửa điều kiện thành `const showDetailedAnswers = currentUser?.role === 'admin' || currentUser?.role === 'teacher';` để cả học sinh lẫn khách đều không xem được đáp án đúng của từng câu.

### Vấn Đề 4: Kiểm Tra Danh Sách Bài Kiểm Tra Dành Cho Học Sinh
- **Hiện trạng:** Đã thiết lập lọc theo `grade`, `subject`, và `targetClasses`. Cần kiểm tra kỹ các trường hợp học sinh đăng nhập nhưng đề thi không gán lớp cụ thể hoặc đề thi tự do để đảm bảo không bị sót hoặc hiển thị nhầm khối khác.

### Vấn Đề 5: Kiểm Tra Trang Quản Trị, Xuất Báo Cáo & Tên File CSV
- **Hiện trạng:** Đã hỗ trợ lọc theo lớp, đề thi, chọn nhiều học sinh để xóa và xuất báo cáo CSV đặt tên theo đề thi.
- **Cần kiểm tra:** Đảm bảo khi tên bài kiểm tra chứa ký tự tiếng Việt có dấu hoặc ký tự đặc biệt, tên file tải về chuẩn Unicode/ASCII an toàn, không bị lỗi font hoặc lỗi tải trên mọi trình duyệt.

---

## 3. Các Bước Triển Khai Chi Tiết

- [ ] **Bước 1: Tăng cường bảo mật phân quyền trong `App.tsx`**
  - Thêm Access Guard cho phân hệ `reports` (chỉ cho phép `teacher` và `admin`).
  - Cập nhật hàm `handleUserChange` để tự động chuyển tab về `exams` khi tài khoản chuyển sang `student` hoặc `guest` nếu đang ở các tab quản trị/báo cáo.

- [ ] **Bước 2: Chuẩn hóa quyền xem đáp án thi trong `ExamResultModal.tsx`**
  - Cập nhật `showDetailedAnswers`: chỉ giáo viên và admin mới xem được đáp án đúng và giải thích; học sinh và khách chỉ xem được điểm số, số câu đúng/sai và tổng quan kết quả.

- [ ] **Bước 3: Tối ưu bộ lọc đề thi cho học sinh trong `ExamList.tsx`**
  - Rà soát điều kiện lọc lớp/khối/môn nhằm đảm bảo học sinh tuyệt đối không nhìn thấy bài của khối, lớp hoặc môn học khác khi đã đăng nhập.

- [ ] **Bước 4: Kiểm tra và làm sạch hàm tạo tên file xuất báo cáo (`AdminDashboardView.tsx` & `AnalyticsDashboard.tsx`)**
  - Xử lý làm sạch tên file tiếng Việt không dấu chuẩn (`Bao_Cao_Kiem_Tra_...csv`) để tương thích tối đa với Excel và hệ điều hành Windows/macOS.

- [ ] **Bước 5: Kiểm tra biên dịch (Lint & Build)**
  - Chạy `lint_applet` và `compile_applet` để xác nhận không phát sinh bất kỳ lỗi cú pháp hoặc runtime error nào.

---

## 4. Kế Hoạch Xác Minh Sau Khi Hoàn Thành (Verification Plan)
1. Đăng nhập lần lượt với 4 loại tài khoản:
   - **Thầy Toàn / Admin:** Truy cập đầy đủ Quản trị, Báo cáo & Phổ điểm, Ngân hàng đề, Xuất báo cáo.
   - **Giáo viên khác:** Xem đề của mình, chấm thi, xem kết quả.
   - **Học sinh (VD: Trần Quốc Tuấn - Lớp 9A1):** Chỉ thấy đề Tin học Khối 9, không thấy nút Báo cáo/Quản trị, sau khi nộp bài không thấy đáp án chi tiết.
   - **Khách (Guest):** Không thấy Báo cáo & Phổ điểm, không thấy Quản lý tài khoản, xem thông tin công khai.
2. Kiểm tra thao tác xuất file CSV xem tên file và nội dung tiếng Việt có hiển thị chuẩn xác không.
