# Các phương án mô phỏng giá cổ phiếu - Cập nhật ngày 21/4

# 1. Sử dụng hàm tạo các lệnh mua-bán để mô phỏng các tình huống giao dịch thực tế

Sau khi trao đổi với Trung Anh, phương án sử dụng mô hình AI để sinh giá trị sẽ vừa tốn thời gian vừa không đem lại hiệu quả cao, khi mà việc thu thập dữ liệu và lựa chọn mô hình, tinh chỉnh .... mất nhiều công sức. Trong khi đó tất cả mọi yếu tố ảnh hưởng đến giá cổ phiếu đều quy về một lý do : `lượng mua bán trên thị trường`. Admin sẽ có quyền tạo ra các lệnh mua bán ảo, từ đó thúc đẩy thị trường và tạo ra sự biến động cho cổ phiếu. Quy luật về giá đặt lệnh mua-bán sẽ được tham khảo và quyết định sau.

# 2. Thêm các sự kiện ngẫu nhiên & lấy thêm thông tin từ `Order Book`

Các sự kiện ngẫu nhiên ở đây có thể là thay đổi chính trị, thay đổi cơ cấu kinh tế, lạm phát …… Tất cả sự kiện này đều có điểm chung là làm thay đổi biên độ giá của các cổ phiếu một cách đột ngột do hiện tượng FOMO, bán tháo, …. Vì thế nên ta sẽ gộp chung các sự kiện này thành một lớp `Events`. Khi `Events` xảy ra thì giá của một vài cổ phiếu sẽ thay đổi, thay vì: 

`price[t+1]` sẽ trở thành:

`price[t+1] = price[t+1] x Events.coeff` 

Với **Events.coeff** là mức độ ảnh hưởng mà Events gây ra. Việc các Events xảy ra như nào hay ảnh hưởng ra sao sẽ diễn ra ngẫu nhiên, sẽ có một danh sách các sự kiện mẫu và tỷ lệ tương ứng (VD: khủng hoảng kinh tế có tỷ lệ xảy ra là 5%, etc..).

Thông tin từ `Order Book` cũng có thể được sử dụng để góp phần vào việc dự đoán giá cổ phiếu. Chúng ta có thể biết sơ bộ được rằng lượng cung và cầu của các cổ phiếu, giá trị khớp lệnh, .... Từ đó đưa thêm dữ liệu cho các quyết định thay đổi giá. 

**Ưu điểm**: việc bổ sung các yếu tố này đã thêm một vài các yếu tố thực tế vào yếu tố thay đổi giá của cổ phiếu, tuy nhiên vẫn chỉ còn ở mức độ thấp. Tuy nhiên một lần nữa mục tiêu chính là tạo ra cảm giác "thực tế", nên có thể chỉ cần như vậy là đủ.

**Nhược điểm**: với `Order Book` thì yêu cầu phải có các bên đặt lệnh mua và bán &rarr; yêu cầu có users sử dụng hệ thống. Mà phần mềm của chúng ta khó có thể đáp ứng việc đó. Một phương án khả thi là sử dụng `Trading Bots`, nhưng đây là vấn đề hoàn toàn khác với **Price Simulation**.

