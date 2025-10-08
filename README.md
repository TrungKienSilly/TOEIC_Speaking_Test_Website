# TOEIC Speaking Practice

Trang web luyện TOEIC (nhấn mạnh phần Speaking) với giao diện hiện đại, chạy bằng Angular 20 (standalone + signals) và hỗ trợ Server-Side Rendering (SSR) với Express.

## 🔎 Tính năng chính
- **Trang chủ** hiển thị các lộ trình học: từ vựng, điền khuyết, học căn bản, lộ trình 600+, luyện Speaking.
- **Luyện Speaking** theo ngày/chủ đề âm (nguyên âm/phụ âm), có flashcard từ vựng, phiên âm, và phát âm US/UK bằng Web Speech API.
- **SSR + Express**: build production và chạy server Node để tối ưu SEO, tốc độ tải lần đầu.

## 🧱 Công nghệ
- Angular 20, Standalone Components, Signals
- Angular Router
- @angular/ssr + Express (Node)
- SCSS modules cho từng component

## 📁 Cấu trúc thư mục chính

```text
speaking_toeic/
  ├─ public/                 # Tài nguyên tĩnh được copy ra root build (logo, favicon,...)
  ├─ src/
  │  ├─ app/
  │  │  ├─ home/            # Trang chủ
  │  │  └─ speaking-practice/ # Màn luyện nói
  │  ├─ main.ts             # Entry phía trình duyệt
  │  ├─ main.server.ts      # Entry phía server (SSR)
  │  └─ server.ts           # Express server SSR
  ├─ angular.json           # Cấu hình build/serve
  ├─ package.json           # Scripts & dependencies
  └─ README.md
```

Lưu ý: Thư mục `public/` đã được khai báo trong `angular.json` để copy toàn bộ nội dung vào build. Nếu bạn cần dùng `src/assets`, hãy thêm vào `options.assets` trong `angular.json`.

## 🚀 Chạy dự án (Dev)
Yêu cầu: Node >= 18.

```bash
cd speaking_toeic
npm install
npm start
# hoặc: ng serve
```

Mở trình duyệt tại `http://localhost:4200`.

## 🏗️ Build Production

```bash
cd speaking_toeic
npm run build
```

Artifacts sẽ nằm trong `dist/speaking_toeic`. Dự án được cấu hình `outputMode: server` để phục vụ SSR.

## 🌐 Chạy bản SSR (Node + Express)

```bash
cd speaking_toeic
npm run build
npm run serve:ssr:speaking_toeic
```

Mặc định server lắng nghe tại `http://localhost:4000` (có thể đổi bằng biến môi trường `PORT`).

## 🧪 Test
Karma/Jasmine đã được cấu hình sẵn:

```bash
npm test
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

## 🧩 Gợi ý triển khai (Deploy)
- **Node/VM/Container**: Build rồi chạy `serve:ssr` (port 4000). Đảm bảo Node phiên bản tương thích.
- **Render/Heroku/Fly.io**: Dùng build command `npm run build` và start command `npm run serve:ssr:speaking_toeic`.
- **Vercel/Netlify**: Có thể dùng adapter SSR riêng; dự án hiện dùng Express nên phù hợp hơn với môi trường Node server truyền thống.

## ❓ Khắc phục sự cố
- Lỗi phát âm (TTS) không chạy: Trình duyệt phải hỗ trợ Web Speech API và chỉ hoạt động phía client (không chạy trên SSR). Hãy thử Chrome mới nhất.
- Ảnh không hiển thị: Kiểm tra đường dẫn. Với ảnh trong `public/`, dùng `/ten-anh.png`. Với ảnh trong `src/assets`, cần khai báo assets trong `angular.json`.
- Build SSR lỗi: Xoá `node_modules` và cài lại, đảm bảo Node >= 18.

---

Nếu bạn thấy dự án hữu ích, hãy ⭐ repo trên GitHub để ủng hộ nhé!
