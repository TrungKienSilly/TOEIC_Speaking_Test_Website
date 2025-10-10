# TOEIC Speaking Test Website

Ứng dụng web luyện tập TOEIC Speaking với giao diện hiện đại, được xây dựng bằng Angular 20 với kiến trúc standalone components và signals. Dự án hỗ trợ Server-Side Rendering (SSR) với Express để tối ưu hiệu suất và SEO.

## ✨ Tính năng chính
- **Trang chủ**: Hiển thị các lộ trình học tập và điều hướng đến các phần luyện tập
- **Luyện Speaking**: 
  - Luyện tập theo chủ đề và topic cụ thể
  - Hỗ trợ phát âm với Web Speech API
  - Giao diện flashcard từ vựng
  - Phiên âm và phát âm US/UK
- **SSR Support**: Tối ưu SEO và tốc độ tải trang đầu tiên
- **Responsive Design**: Giao diện thân thiện trên mọi thiết bị

## 🛠️ Công nghệ sử dụng
- **Frontend**: Angular 20 với Standalone Components và Signals
- **Styling**: SCSS modules
- **SSR**: Angular SSR + Express.js
- **Build Tool**: Angular CLI
- **Testing**: Karma + Jasmine

## 📁 Cấu trúc dự án

```text
TOEIC_Speaking_Test_Website/
├─ speaking_toeic/              # Thư mục chính của ứng dụng Angular
│  ├─ public/                   # Tài nguyên tĩnh (logo, favicon, v.v.)
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ home/              # Component trang chủ
│  │  │  ├─ speaking-practice/ # Component luyện speaking
│  │  │  ├─ services/          # Các service Angular
│  │  │  ├─ app.routes.ts      # Cấu hình routing
│  │  │  └─ app.ts             # Root component
│  │  ├─ main.ts               # Entry point cho browser
│  │  ├─ main.server.ts        # Entry point cho SSR
│  │  └─ server.ts             # Express server cho SSR
│  ├─ angular.json             # Cấu hình Angular CLI
│  ├─ package.json             # Dependencies và scripts
│  └─ tsconfig.json            # Cấu hình TypeScript
└─ README.md                   # File này
```

**Lưu ý**: Thư mục `public/` được cấu hình trong `angular.json` để copy tự động vào build output.

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 (đi kèm với Node.js)

### Cài đặt

1. **Clone repository**:
```bash
git clone <repository-url>
cd TOEIC_Speaking_Test_Website
```

2. **Cài đặt dependencies**:
```bash
cd speaking_toeic
npm install
```

### Chạy ở môi trường Development

```bash
cd speaking_toeic
npm start
# hoặc: ng serve
```

Ứng dụng sẽ chạy tại `http://localhost:4200` và tự động reload khi có thay đổi code.

### Build Production

```bash
cd speaking_toeic
npm run build
```

Build artifacts sẽ được tạo trong thư mục `dist/speaking_toeic/`. Dự án được cấu hình với `outputMode: server` để hỗ trợ SSR.

### Chạy Production với SSR

```bash
cd speaking_toeic
npm run build
npm run serve:ssr:speaking_toeic
```

Server sẽ chạy tại `http://localhost:4000`. Bạn có thể thay đổi port bằng biến môi trường:

```bash
PORT=3000 npm run serve:ssr:speaking_toeic
```

## 🧪 Testing

Dự án sử dụng Karma + Jasmine cho unit testing:

```bash
cd speaking_toeic
npm test
```

Để chạy test với watch mode:
```bash
npm run test -- --watch
```

## 🛠️ Scripts npm hữu ích

```json
{
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test",
  "serve:ssr:speaking_toeic": "node dist/speaking_toeic/server/server.mjs"
}
```

## 🖼️ Tài nguyên (Assets)
- Ảnh dùng trong giao diện (logo, banner) hiện đặt ở `public/` và được tham chiếu bằng đường dẫn tuyệt đối như `/logo.png`.
- Nếu bạn muốn đặt file trong `src/assets/...`, cần bổ sung `src/assets` vào `angular.json > projects.speaking_toeic.architect.build.options.assets`.

## 🚀 Deployment

### Các nền tảng được khuyến nghị

#### **Node.js Hosting (Render, Railway, Fly.io)**
```bash
# Build command
npm run build

# Start command  
npm run serve:ssr:speaking_toeic
```

#### **Docker**
Tạo `Dockerfile` trong thư mục `speaking_toeic/`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "serve:ssr:speaking_toeic"]
```

#### **Heroku**
Thêm vào `package.json`:
```json
{
  "scripts": {
    "heroku-postbuild": "npm run build",
    "start": "npm run serve:ssr:speaking_toeic"
  }
}
```

### Biến môi trường
- `PORT`: Port cho server (mặc định: 4000)
- `NODE_ENV`: Môi trường (production/development)

## ❓ Khắc phục sự cố

### Lỗi thường gặp

**🔊 Web Speech API không hoạt động**
- Đảm bảo sử dụng trình duyệt hỗ trợ (Chrome, Edge, Safari)
- Web Speech API chỉ hoạt động trên HTTPS hoặc localhost
- Tính năng chỉ chạy phía client, không hoạt động trong SSR

**🖼️ Assets không hiển thị**
- Kiểm tra đường dẫn: files trong `public/` dùng `/filename.ext`
- Nếu dùng `src/assets/`, cần cấu hình trong `angular.json`

**🏗️ Build errors**
- Xóa `node_modules` và `package-lock.json`, sau đó `npm install`
- Đảm bảo Node.js >= 18.0.0
- Kiểm tra TypeScript errors với `ng build --verbose`

**🌐 SSR issues**
- Đảm bảo không sử dụng browser-only APIs trong component lifecycle
- Sử dụng `isPlatformBrowser()` để check môi trường
- Kiểm tra server logs khi chạy production build

---

Nếu bạn thấy dự án hữu ích, hãy ⭐ repo trên GitHub để ủng hộ nhé!
