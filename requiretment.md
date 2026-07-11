# Mục đích
tôi muốn viết app để quản lý các khoản tiết kiệm của tôi 
# Techstack 
1- sử dụng ngôn ngữ Google App Script 
2- Sử dụng Google Sheet làm database , với mỗi sheet sẽ coi là một table 
 2.1 - chia ra làm các bảng Users (chứa thông tin username_)ankcode ), bảng tiền gửi ( gồm tiền , % lãi dự tính , trạng thái , amount lãi dự tính , ngày tạo , ngày đáo hạn , user_bankcode)
3- Giao diện : sửa dụng Telegram Bot, generate UI dạng web app để tương tác

# TÍnh năng yêu cầu :
1- thêm một khoản tiết kiệm mới (mới hoàn toàn)
2- khi một khoản tiết kiệm đáo hạn , thực hiện bổ sung được history (đây hiểu là tái tục khoản tiết kiệm đó)
3- tạo thống kê, biểu đồ ước tính tăng trưởng của tổng tài sản (tổng các khoản tiết kiệm + tổng khoảng lãi dự tính tại thời điểm đó ) hiển thị biểu đồ timeseries 