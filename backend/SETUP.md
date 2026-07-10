# Hướng dẫn thiết lập Database và Cấu hình Google Apps Script

Tài liệu này hướng dẫn cách thiết lập thủ công cơ sở dữ liệu trên Google Sheets và cấu hình dự án Google Apps Script (GAS) cho ứng dụng **Save Manager**.

## 1. Tạo Google Sheets làm Database

1. Truy cập [Google Sheets (sheets.google.com)](https://sheets.google.com).
2. Tạo một bảng tính (spreadsheet) mới và đặt tên là: `Save Manager DB`.
3. **Cấu hình Timezone cho Google Sheet**:
   - Ở thanh menu trên cùng của Google Sheet, chọn **File** > **Settings** (hoặc **Tệp** > **Cài đặt**).
   - Ở mục **Time zone** (hoặc **Múi giờ**), chọn `(GMT+07:00) Jakarta` hoặc `(GMT+07:00) Bangkok` (Múi giờ Việt Nam, hiển thị là **Ho Chi Minh** hoặc **Bangkok** tùy ngôn ngữ trình duyệt).
   - Nhấn **Save Settings** (hoặc **Lưu cài đặt**).

## 2. Lấy Spreadsheet ID

Copy ID của Google Sheet từ đường dẫn URL trên thanh địa chỉ trình duyệt. Định dạng URL có dạng:
`https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid=0`

Ví dụ, nếu URL là `https://docs.google.com/spreadsheets/d/1abc123xyz789/edit`, thì **Spreadsheet ID** là:
`1abc123xyz789`

## 3. Cấu hình Script Properties trong Google Apps Script

Để dự án Google Apps Script có quyền kết nối với Google Sheet của bạn:

1. Mở trình chỉnh sửa Google Apps Script của bạn (hoặc chạy lệnh `clasp open` ở máy cá nhân).
2. Trong thanh menu bên trái, nhấn vào biểu tượng bánh răng **Project Settings** (hoặc **Cài đặt dự án**).
3. Cuộn xuống mục **Script Properties** (hoặc **Thuộc tính tập lệnh**), nhấn vào **Edit script properties** (hoặc **Chỉnh sửa thuộc tính tập lệnh**).
4. Thêm một thuộc tính mới:
   - **Key / Property**: `SPREADSHEET_ID`
   - **Value**: Dán **Spreadsheet ID** bạn đã copy ở bước 2.
5. Nhấn **Save script properties** (hoặc **Lưu thuộc tính tập lệnh**).

## 4. Chạy Khởi tạo Database (initializeSheets)

1. Mở file `Code.js` trong trình chỉnh sửa Apps Script.
2. Trên thanh công cụ, chọn function `initializeSheets` từ menu danh sách các hàm.
3. Nhấn vào nút **Run** (hoặc **Chạy**).
4. Xác nhận cấp các quyền truy cập cần thiết (Google sẽ yêu cầu quyền đọc/ghi Spreadsheet).
5. Sau khi chạy thành công, mở lại Google Sheet để kiểm tra. Các sheet sau sẽ được tự động tạo kèm các cột tiêu đề (headers):
   - Sheet `Users`:
     - Cột: `username_bankcode`
   - Sheet `Deposits`:
     - Các cột: `id`, `amount`, `interest_rate`, `status`, `expected_interest`, `created_at`, `maturity_at`, `user_bankcode`

## 5. Đồng bộ dự án bằng clasp (Tùy chọn cho Nhà phát triển)

Dự án này được cấu hình để đồng bộ code từ máy local lên Google Apps Script bằng công cụ `clasp` của Google.

1. File cấu hình mặc định là `backend/.clasp.json` đã được tạo sẵn với placeholder `"YOUR_SCRIPT_ID_HERE"`.
2. Để kết nối dự án local với dự án script thực tế trên Apps Script:
   - **Cách 1 (Nếu đã có sẵn script)**: Hãy copy **Script ID** từ phần **Project Settings** trên Apps Script editor và thay thế vào trường `scriptId` trong file `backend/.clasp.json` thủ công.
   - **Cách 2 (Nếu muốn tạo script mới)**: Di chuyển vào thư mục `backend/` và chạy lệnh `clasp create --type standalone` để clasp tự tạo dự án mới và tự động cập nhật `scriptId` trong `.clasp.json`.

---

> [!IMPORTANT]
> **Lưu ý quan trọng về Timezone**:
> Timezone trong cấu hình file `backend/appsscript.json` (`Asia/Ho_Chi_Minh`) và timezone được cấu hình trên Google Sheet settings là **ĐỘC LẬP** và được quản lý riêng biệt. Để đảm bảo ngày tháng được hiển thị và xử lý chính xác, bạn **phải thiết lập chính xác múi giờ GMT+07 / Asia/Ho_Chi_Minh ở cả hai nơi**.
