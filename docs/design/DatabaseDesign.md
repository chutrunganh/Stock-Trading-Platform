# Usecase

- **Quản lý người dùng**: Đăng ký, đăng nhập, quản lý, thay đổi thông tin cá nhân. Với tài khoản admin có thêm quyền xóa ngươid dùng bất kỳ

- **Mô phỏng giao dịch chứng khoán**: Người dùng có thể mua, bán cổ phiếu và theo dõi danh mục đầu tư.
- **Dữ liệu thị trường**: Cung cấp giá cổ phiếu, thông tin công ty, và tin tức.

- **Tài khoản ảo**: Người dùng được cấp một số tiền ảo để đầu tư.
- **Lịch sử giao dịch**: Ghi lại các giao dịch mua bán của người dùng.
- **Bảng xếp hạng**: Xếp hạng người dùng dựa trên hiệu suất đầu tư.

Dựa trên các chức năng này, chúng ta sẽ thiết kế cơ sở dữ liệu phù hợp.

# Thiết kế cơ sở dữ liệu

## Bảng 1: Users

Dùng để lưu thông tin của người dùng.

- `user_id`: INT, AUTO_INCREMENT, PRIMARY KEY (Khóa chính để định danh người dùng).
- `username`: VARCHAR(50), UNIQUE (Tên đăng nhập, không trùng lặp).
- `password`: VARCHAR(255) (Mật khẩu đã mã hash bằng bcrypt).
- `email`: VARCHAR(100), UNIQUE (Email duy nhất cho mỗi người dùng).
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP (Ngày tạo tài khoản).
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP (Ngày cập nhật thông tin gần nhất).

#### **Bảng 2: Stocks (Cổ phiếu)**
Lưu thông tin về các cổ phiếu có sẵn trên hệ thống.

- `stock_id`: INT, AUTO_INCREMENT, PRIMARY KEY (Khóa chính định danh cổ phiếu).
- `symbol`: VARCHAR(10), UNIQUE (Mã cổ phiếu, ví dụ: AAPL, GOOGL).
- `company_name`: VARCHAR(100) (Tên công ty).
- `industry`: VARCHAR(50) (Ngành công nghiệp).
- `market_cap`: DECIMAL(15,2) (Vốn hóa thị trường). Vốn hóa thị trường (market capitalization - market cap) của một mã cổ phiếu là tổng giá trị của tất cả cổ phiếu đang lưu hành của công ty trên thị trường. Nó được tính theo công thức: **Vốn hóa thị trường = Giá cổ phiếu hiện tại (lấy từ close_price của bảng stockPrice) x Số lượng cổ phiếu đang lưu hành (Lấy sô cố định)**. Giá này sẽ cập nhật theo ngày từ bảng stockPrices.
- `description`: TEXT (Mô tả công ty).

## Bảng 3: StockPrices (Giá cổ phiếu)

Lưu lịch sử giá cổ phiếu theo thời gian để vẽ biểu đồ nến

- `price_id`: INT, AUTO_INCREMENT, PRIMARY KEY (Khóa chính).
- `stock_id`: INT, FOREIGN KEY to Stocks(stock_id) (Khóa ngoại liên kết đến bảng Stocks).
- `date`: DATE (Ngày ghi nhận giá).
- `open_price`: DECIMAL(10,2) (Giá mở cửa).
- `high_price`: DECIMAL(10,2) (Giá cao nhất).
- `low_price`: DECIMAL(10,2) (Giá thấp nhất).
- `close_price`: DECIMAL(10,2) (Giá đóng cửa).
- `volume`: INT (Khối lượng giao dịch).
- `UNIQUE KEY`: (stock_id, date) (Đảm bảo không có dữ liệu trùng lặp cho cùng cổ phiếu và ngày).

## Bảng 4: Portfolios (Danh mục đầu tư)
Lưu thông tin danh mục đầu tư của người dùng (mỗi người dùng có một danh mục).

- `portfolio_id`: INT, AUTO_INCREMENT, PRIMARY KEY (Khóa chính).
- `user_id`: INT, FOREIGN KEY to Users(user_id), UNIQUE (Khóa ngoại liên kết đến Users, mỗi người dùng chỉ có một danh mục).
- `cash_balance`: DECIMAL(15,2), DEFAULT 100000.00 (Số tiền ảo còn lại, ví dụ: 100,000 USD).
- `total_value`: DECIMAL(15,2), DEFAULT 100000.00 (Tổng giá trị danh mục) = cash_balance + (số lượng cổ phiếu đang nắm giữ * giá cổ phiếu hiện tại).
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP (Ngày tạo danh mục).
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP (Ngày cập nhật gần nhất).

## Bảng 5: Holdings (Cổ phiếu đang sở hữu)
Lưu số lượng cổ phiếu mà người dùng đang sở hữu trong danh mục.

- `holding_id`: INT, AUTO_INCREMENT, PRIMARY KEY (Khóa chính).
- `portfolio_id`: INT, FOREIGN KEY to Portfolios(portfolio_id) (Khóa ngoại liên kết đến Portfolios).
- `stock_id`: INT, FOREIGN KEY to Stocks(stock_id) (Khóa ngoại liên kết đến Stocks).
- `quantity`: INT (Số lượng cổ phiếu sở hữu).
- `average_cost`: DECIMAL(10,2) (Giá trung bình mua).
- `UNIQUE KEY`: (portfolio_id, stock_id) (Đảm bảo mỗi danh mục chỉ có một bản ghi cho mỗi cổ phiếu).

## Bảng 6: Transactions (Giao dịch)
Lưu lịch sử giao dịch mua/bán cổ phiếu.

- `transaction_id`: INT, AUTO_INCREMENT, PRIMARY KEY (Khóa chính).
- `portfolio_id`: INT, FOREIGN KEY to Portfolios(portfolio_id) (Khóa ngoại liên kết đến Portfolios).
- `stock_id`: INT, FOREIGN KEY to Stocks(stock_id) (Khóa ngoại liên kết đến Stocks).
- `transaction_type`: ENUM('BUY', 'SELL') (Loại giao dịch: mua hoặc bán).
- `quantity`: INT (Số lượng cổ phiếu giao dịch).
- `price`: DECIMAL(10,2) (Giá giao dịch).
- `transaction_date`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP (Thời gian giao dịch).

## Bảng 7: News (Tin tức)
Lưu tin tức liên quan đến thị trường hoặc cổ phiếu cụ thể.

- `news_id`: INT, AUTO_INCREMENT, PRIMARY KEY (Khóa chính).
- `title`: VARCHAR(255) (Tiêu đề tin tức).
- `content`: TEXT (Nội dung tin tức).
- `published_date`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP (Ngày đăng tin).
- `stock_id`: INT, FOREIGN KEY to Stocks(stock_id).

## Bảng 8: Leaderboard (Bảng xếp hạng)

Xếp hạng người dùng dựa trên hiệu suất đầu tư.


- `leaderboard_id`: INT, AUTO_INCREMENT, PRIMARY KEY (Khóa chính).
- `user_id`: INT, FOREIGN KEY to Users(user_id), UNIQUE (Khóa ngoại liên kết đến Users).
- `rank`: INT (Xếp hạng).
- `performance`: DECIMAL(5,2) (Hiệu suất đầu tư, ví dụ: % tăng trưởng).
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE - CURRENT_TIMESTAMP (Ngày cập nhật gần nhất).

## Mối quan hệ giữa các bảng

- Users ↔ Portfolios: Một người dùng có một danh mục đầu tư (1-1).
- Portfolios ↔ Holdings: Một danh mục có thể chứa nhiều cổ phiếu đang sở hữu (1-N).
- Portfolios ↔ Transactions: Một danh mục có thể có nhiều giao dịch (1-N).
- Stocks ↔ StockPrices: Một cổ phiếu có nhiều bản ghi giá theo thời gian (1-N).
- Stocks ↔ Holdings: Một cổ phiếu có thể được sở hữu trong nhiều danh mục (1-N).
- Stocks ↔ Transactions: Một cổ phiếu có thể xuất hiện trong nhiều giao dịch (1-N).
- Stocks ↔ News: Một cổ phiếu có thể có nhiều tin tức liên quan (1-N, nhưng stock_id trong News có thể null).
- Users ↔ Leaderboard: Một người dùng có thể có một bản ghi trong bảng xếp hạng (1-1).