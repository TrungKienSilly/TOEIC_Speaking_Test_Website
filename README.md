# TOEIC Speaking Test Website

Ứng dụng web luyện Speaking cho kỳ thi TOEIC, xây dựng bằng Angular 20 với kiến trúc standalone component, signals và zoneless change detection. Dự án hỗ trợ Server-Side Rendering (SSR) bằng Express để cải thiện tốc độ tải ban đầu và SEO.

## Tổng quan
- **Lộ trình học**: `HomeComponent` cung cấp nhiều đường học khác nhau (từ vựng, điền khuyết, lộ trình theo tuần, luyện speaking).
- **Luyện phát âm**: `SpeakingPracticeComponent` hiển thị flashcard, phát âm US/UK thông qua Azure TTS và chấm điểm phát âm sử dụng Azure Cognitive Services.
- **Topic riêng**: Các component theo chủ đề (`school-topic`, `hobby-topic`, …) cho phép điều hướng trực tiếp tới nội dung luyện tập cụ thể.
- **SSR & Responsive**: `server.ts` cấu hình Express để render Angular phía server, đồng thời giao diện được thiết kế responsive với SCSS.

## Công nghệ chính
- Angular 20 (standalone components, signals, `provideZonelessChangeDetection()`).
- Angular SSR + Express (`@angular/ssr`, `server.ts`).
- Azure Cognitive Services Speech SDK cho Text-to-Speech và Pronunciation Assessment (`AzureSpeechService`).
- SCSS modules cho styling, Angular CLI để build/test.
- Karma + Jasmine cho unit test.

## Cấu trúc thư mục

```text
TOEIC_Speaking_Test_Website/
├─ speaking_toeic/                  # Ứng dụng Angular chính
│  ├─ public/                       # Cấu hình Azure mẫu, favicon
│  ├─ src/
│  │  ├─ app/                       # Standalone components + services
│  │  │  ├─ home/                   # Trang lộ trình học
│  │  │  ├─ speaking-practice/      # Luyện phát âm + Azure Speech
│  │  │  ├─ services/azure-speech.service.ts
│  │  │  ├─ app.routes.ts           # Routes cho toàn bộ topic
│  │  │  └─ app.config.ts           # Cấu hình providers
│  │  ├─ main.ts / main.server.ts   # Entry cho browser và SSR
│  │  ├─ server.ts                  # Express SSR server
│  │  └─ assets/img/                # Logo, loa, microphone, ...
│  ├─ angular.json                  # Cấu hình Angular CLI
│  ├─ package.json                  # Scripts & dependencies
│  └─ README.md                     # README mặc định của Angular CLI
└─ README.md                        # Tài liệu tổng quan (file hiện tại)
```

> `angular.json` đã bao gồm `src/assets`, vì vậy tất cả ảnh trong `src/assets/img/` sẽ được build tự động. Thư mục `public/` giữ các file cần copy nguyên trạng (ví dụ `config.json`).

## Yêu cầu môi trường
- Node.js >= 18.0.0 (khuyến nghị Node 20 LTS).
- npm >= 8 (cài kèm Node.js).
- Tài khoản Azure Cognitive Services (nếu sử dụng tính năng phát âm).

## Cài đặt
```bash
git clone <repository-url>
cd TOEIC_Speaking_Test_Website/speaking_toeic
npm install
```

## Chạy development
```bash
npm start
# hoặc: npx ng serve
```
- Ứng dụng chạy tại `http://localhost:4200` và hot reload khi thay đổi mã nguồn.
- Khi cần debug SSR, có thể dùng `npx ng serve --ssr` (cần Angular CLI 20.3 trở lên).

## Build production & SSR
```bash
npm run build               # Tạo build SSR với outputMode: server
npm run serve:ssr:speaking_toeic
```
- Build nằm tại `dist/speaking_toeic/`.
- Server SSR chạy mặc định port 4000. Đổi port bằng `PORT=3000 npm run serve:ssr:speaking_toeic`.

## Kiểm thử
```bash
npm test
# Watch mode
npm run test -- --watch
```

## Cấu hình Azure Speech
- `AzureSpeechService` hiện đang chứa placeholder `subscriptionKey` và `serviceRegion`. Thay thế bằng thông tin thật trước khi build production.
- Có thể sao chép `public/config.json.example` thành `public/config.json` để lưu khóa dưới dạng file tĩnh, sau đó mở rộng service đọc file này (hiện tại chưa được triển khai trong mã nguồn).
- Yêu cầu trình duyệt hỗ trợ Web Speech/Azure SDK và chạy trên HTTPS hoặc `localhost`.

## Quản lý tài nguyên giao diện
- Hình ảnh sử dụng trong template (`speaking-practice.component.html`) được tham chiếu thông qua đường dẫn `/assets/...` và nằm trong `src/assets/img/`.
- Nếu bổ sung tài nguyên mới ở `src/assets/`, chỉ cần commit và Angular CLI sẽ xử lý khi build.
- Tài nguyên đặc biệt cần giữ nguyên tên (ví dụ logo) nên đặt ở `public/` và tham chiếu tuyệt đối (`/logo.png`).

## Lưu ý quan trọng
- `speaking_toeic/src/app/speaking-practice/speaking-practice.component.ts` hiện vẫn còn marker merge (`<<<<<<< HEAD` …). Cần dọn sạch và hợp nhất logic trước khi build để tránh lỗi TypeScript.
- `AzureSpeechService` chỉ hoạt động trên trình duyệt; SSR không thể gọi microphone. Sử dụng `isPlatformBrowser()` trước khi dùng API phụ thuộc browser.
- Khi deploy lên nền tảng Node (Render, Railway, Fly.io, Heroku, …), sử dụng cặp lệnh `npm run build` và `npm run serve:ssr:speaking_toeic`.

---

Nếu dự án hữu ích, đừng quên ⭐ repository để ủng hộ!
