# Using React 18.3.0

1. Create project :
- In terminal: npm create vite@latest
- Choose the name for project and package (example: Stock-Market)
- Choose framework React, then choose JavaScript only 

2. Change to the dir of the project:
    ```bash
    cd Stock-Market # name project
    npm install
    ```

3. After the folder `node_modules` create, delete React 19.0:
    ```bash
    npm uninstall react react-dom
    npm install react@18.3.0 react-dom@18.3.0 react-router-dom@6.22.0
    ```

4. Check the React version using 'npm list react', the true output is:
    ```perl
    react@18.3.0
    react-dom@18.3.0
    react-router-dom@6.22.0 
    ```

5. Remember to change the "dependencies" in file 'package.json':
from: 
```bash
"dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.5.0"
}
```

to: 
```bash
"dependencies": {
    "react": "18.3.0",
    "react-dom": "18.3.0",
    "react-router-dom": "6.22.0"
}
```


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Testing...........

frontend/
├── node_modules/
├── public/
│   ├── favicon.ico
│   └── ... (other static assets)
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── api/
│   ├── styles/
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
├── index.html
├── vite.config.js
├── package.json
└── README.md



from Grok:

project-frontend/
├── node_modules/          # Thư mục chứa các thư viện phụ thuộc
├── public/                # Thư mục chứa các tài nguyên tĩnh (không qua build)
│   ├── favicon.ico        # Icon của trang web
│   └── ...                # Các tài nguyên khác như hình ảnh, font
├── src/                   # Thư mục chứa mã nguồn chính
│   ├── assets/            # Tài nguyên được xử lý bởi Vite (hình ảnh, font, v.v.)
│   ├── components/        # Các thành phần React tái sử dụng
│   │   ├── Navbar.jsx     # Thanh điều hướng với logic đăng nhập/đăng xuất
│   │   ├── Login.jsx      # Form đăng nhập
│   │   ├── Signup.jsx     # Form đăng ký (nếu cần)
│   │   ├── Home.jsx       # Trang chủ
│   │   ├── Profile.jsx    # Trang hồ sơ người dùng (yêu cầu đăng nhập)
│   │   └── PrivateRoute.jsx # Thành phần bảo vệ các tuyến đường
│   ├── context/           # Quản lý trạng thái toàn cục (ví dụ: xác thực)
│   │   └── AuthContext.jsx # Context cho trạng thái đăng nhập
│   ├── api/               # Các hàm gọi API tới backend
│   │   └── authApi.js     # Hàm xử lý đăng nhập, đăng xuất, v.v.
│   ├── styles/            # File CSS cho kiểu dáng
│   │   └── main.css       # CSS toàn cục
│   ├── App.jsx            # Thành phần chính, thiết lập router
│   ├── main.jsx           # Điểm vào của ứng dụng
│   └── ...                # Các file khác (nếu cần)
├── index.html             # File HTML chính
├── vite.config.js         # Cấu hình Vite
├── package.json           # Thông tin dự án và phụ thuộc
└── README.md              # Tài liệu dự án



src/
├── components/        # Các thành phần UI tái sử dụng
│   ├── Button.jsx     # Nút chung
│   ├── Navbar.jsx     # Thanh điều hướng
│   ├── Footer.jsx     # Chân trang
│   └── ...
├── pages/             # Các trang của ứng dụng
│   ├── Home.jsx       # Trang chủ
│   ├── Login.jsx      # Trang đăng nhập
│   ├── Profile.jsx    # Trang hồ sơ
│   └── ...
├── App.jsx            # File chính để thiết lập router
└── main.jsx           # Điểm vào của ứng dụng
