# Cách chạy 

```bash
cd app/backend
node .\src\utils\autoCreateArtificialOrders.js
```
Do hiện tại chưa để chỉ admin mới được chạy chương trình nên không cần lo về `ADMIN_TOKEN`.

# Thuật toán sinh giao dịch ảo

Từ thông tin trong [Giá cổ phiếu](docs\stockFundamentalTheory\stockFundamentalTheory.md), ta có thuật toán sau đây để sinh các giao dịch ảo, là các giao dịch có `id` đặc biệt, không có `userId`, do hệ thống tự đặt ra để hỗ trợ việc mô phỏng giá.

```bash
S = [List of available stocks, with their last prices (OLHCV)]
If the trading session is on and admin turn the generator on:
    Then for every `t` seconds:
        ____________________________________________________
        |- Select a random stocks from S. (1)       |
        |- Select random volume. (2)                       | 
        |- Random price in range ±7%                       | 
        |- Random select order type (Limit Buy or Sell) (2)|
        |- Send request POST to server                     |
        ---------------------------------------------------- 
```

Lưu ý rằng (1), (2) và (3) có thể thay đổi thông qua biến `TREND` là một trong 3 giá trị ["buy-dominant", "sell-dominant", "neutral"].

Một hàng trong bảng `StockPrices` sẽ trông như sau:

"price_id"| "stock_id"| "date"|	"open_price"| "high_price"| "low_price"| "close_price"| "volume"|
----------|-----------|-------|-------------|-------------|------------|--------------|---------|
1         | 1       | "2023-10-01 00:00:00"|	150.00|	155.00|	148.00|	153.00|	1000000|
2         | 2       | "2023-10-01 00:00:00"|	200.00|	205.00|	198.00|	202.00|	2000000|
3         | 1       | "2023-10-02 00:00:00"|	155.00|	160.00|	146.00|	155.00|	1000000|

Do hệ thống cập nhật giá theo ngày, nên giá tham chiếu của một cổ phiếu ngày hôm sau sẽ là giá đóng cửa (close_price) của ngày hôm trước.

>Chi tiết về thuật toán khi được áp dụng sẽ như sau:

0. Định nghĩa các tham số sử dụng

```javascript
import axios from 'axios';
import { getLatestStockPriceByStockIdService } from '../services/stockPriceCRUDService';
import { getAllStockService } from '../services/stockCRUDService';
// Constants
const SERVER_URL = '/api';
const ADMIN_JWT = 'your_admin_jwt_token_here'; //replace with admin token when signed up
const INTERVAL_MS = 5000; //one order every 5 sec = one cycle
const ORDERS_PER_CYCLE = 5; //num of orders per cycle 
const TREND = 'neutral'; // 'buy-dominant', 'sell-dominant', 'neutral'

```
1. Lấy danh sách các cổ phiếu hiện có trong database và giá của ngày gần nhất tương ứng (Do giá cập nhật theo ngày nên giá gần nhất của một cổ phiếu là giá của ngày hôm trước)
```javascript
const getAvailableStocksAndPrices = async () => {
    try {
        //get all stocks
        const stocks = await getAllStockService();

        //for each stock, get the lastest close_price
        const stocksWithPrices = await Promise.all(
            stocks.map(async (stock) => {
                const latestPrice = await getLatestStockPriceByStockIdService(stock.id);
                return {
                    ...stock,
                    latestPrice: latestPrice.close_price, 
                };
            })
        );

        return stocksWithPrices;
    } catch (error) {
        console.error('Error fetching stocks and prices:', error.message);
        return next(error);
    }
};
```

The return result of this function will look like this:
```json
[
    {
        "stock_id": 1,
        "symbol": "AAPL",
        "company_name": "Apple Inc.",
        "industry": "Technology",
        "market_cap": 2500000000000,
        "description": "Apple Inc. designs, manufactures, and markets smartphones.",
        "latestPrice": 175.50
    },
    {
        "stock_id": 2,
        "symbol": "MSFT",
        "company_name": "Microsoft Corporation",
        "industry": "Technology",
        "market_cap": 2300000000000,
        "description": "Microsoft develops, licenses, and supports software products.",
        "latestPrice": 310.25
    }
]
```

2. Sinh giao dịch ảo

```javascript
const generateArtificialOrder = (stocks) => {
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    const quantity = Math.floor(Math.random() * 100) + 1;

    //calculate ceiling and floor price - in ±7% range
    const referencePrice = randomStock.lastestPrice;
    const floorPrice = referencePrice * 0.93;
    const ceilPrice = referencePrice * 1.07;

    const price = parseFloat(
        (floorPrice + Math.random() * (ceilPrice - floorPrice)).toFixed(2)
    );

    
    let orderType;
    const marketChance = 0.2; //assume that 20% of orders are market orders 
    const rand = Math.random();

    if (rand < marketChance) {
        orderType = Math.random() > 0.5 ? 'Market Buy' : 'Market Sell';
    } else {
        if (TREND === 'buy-dominant') {
            orderType = Math.random() < 0.8 ? 'Limit Buy' : 'Limit Sell';
        } else if (TREND === 'sell-dominant') {
            orderType = Math.random() < 0.8 ? 'Limit Sell' : 'Limit Buy';
        } else {
            orderType = Math.random() > 0.5 ? 'Limit Buy' : 'Limit Sell';
        }
    }

    const order = {
        stockId: randomStock.id,
        quantity,
        price: orderType.includes('Limit') ? price : undefined,
        orderType,
    };

    return order;
};
```

3. Gửi request đến backend 

```javascript
const sendArtificialOrder = async (order) => {
    try {
        const response = await axios.post(`${SERVER_URL}/createArtiOrder`, order, {
            headers: {
                Authorization: `Bearer ${ADMIN_JWT}`,
            },
        });
        console.log('Created:', order.orderType, '–', order);
    } catch (error) {
        console.error('Failed to create order:', error.message);
    }
};
```

4. Kết hợp tất cả lại với nhau

```javascript
const startCreatingArtificialOrders = async () => {
    const stocks = await getAvailableStocks();
    if (stocks.length === 0) {
        console.error('No stocks available to create orders.');
        return;
    }

    console.log('Starting auto-create orders...');
    console.log(`Current trend: ${TREND}`);

    setInterval(async () => {
        for (let i = 0; i < ORDERS_PER_CYCLE; i++) {
            const order = generateArtificialOrder(stocks);
            await sendArtificialOrder(order);
        }
    }, INTERVAL_MS);
};

startCreatingArtificialOrders();
```

### Ưu điểm và nhược điểm 

>Ưu điểm: 
- Đơn giản, dễ cài đặt
- Sát với thực tế nhất (phần phi thực tế là thuật toán random không miêu tả được tâm lý nhà đầu tư)
>Nhược điểm:
- Còn thiếu sự kiện đặc biệt (thuế quan, bán tháo, ....)
- Các phép ngẫu nhiên không mô phỏng được tâm lý con người, còn sơ sài
- Tạo ra các request ảo liên tục cần server xử lý -> ảnh hưởng đến trải nghiệm người dùng (ở đây đề xuất cách giải quyết là sử dụng queue để ưu tiên xử lý request đến từ người dùng thật, còn các request ảo mô phỏng sẽ được xử lý sau).

