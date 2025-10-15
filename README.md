# TOEIC Speaking Test Website

Ứng dụng web luyện phát âm tiếng Anh cho kỳ thi TOEIC Speaking, xây dựng bằng Angular 20 với kiến trúc standalone component, signals và zoneless change detection. Dự án tích hợp Azure Cognitive Services để đánh giá phát âm chính xác, hỗ trợ Server-Side Rendering (SSR) bằng Express để cải thiện tốc độ tải ban đầu và SEO.

## ✨ Tính năng nổi bật

### 🎯 Luyện phát âm từng nguyên âm
- **10 chủ đề nguyên âm**: Từ cơ bản đến nâng cao (Cat /æ/, Bed /e/, Fish /ɪ/, Hot /ɑ/, Cup /ʌ/, Cake /eɪ/, Eat /iː/, Rice /aɪ/, Hello /oʊ/, School /uː/)
- **Hơn 500 từ vựng**: Được phân loại theo âm vị IPA với 50 từ mỗi chủ đề
- **Phát âm chuẩn**: Hỗ trợ cả giọng Mỹ (US) và Anh (UK) thông qua Azure Text-to-Speech
- **Sidebar thông minh**: Điều hướng nhanh giữa các chủ đề và từ vựng

### 🎤 Đánh giá phát âm thông minh
- **Azure Pronunciation Assessment**: Chấm điểm phát âm theo 4 tiêu chí
  - Accuracy (Độ chính xác)
  - Completeness (Độ đầy đủ)
  - Fluency (Độ lưu loát)
  - Pronunciation Score (Điểm tổng)
- **Phân tích âm tiết chi tiết**: Hiển thị từng âm tiết với điểm số và màu sắc trực quan
- **Hệ thống penalty thông minh**: Tính điểm dựa trên số lượng âm tiết sai/thiếu
- **Feedback theo cấp độ**: Tự động đưa ra nhận xét phù hợp với điểm số

### 🎨 Trải nghiệm người dùng tối ưu
- **Countdown timer**: Hiển thị thời gian chuẩn bị trước khi ghi âm (1 giây)
- **Trạng thái trực quan**:
  - 🟢 Xanh: Sẵn sàng
  - 🟡 Vàng: Đang chuẩn bị/khởi động Azure
  - 🔴 Đỏ: Đang ghi âm
- **Quản lý quyền microphone**: Xử lý thông minh các trường hợp Allow/Block/Dismiss
- **Responsive design**: Hoạt động mượt mà trên mọi thiết bị
- **Error handling**: Xử lý lỗi SSR khi load dữ liệu JSON


## 🛠️ Công nghệ sử dụng

### Frontend
- **Angular 20**: Standalone components, Signals API, Zoneless change detection
- **TypeScript**: Strict mode để đảm bảo type safety
- **SCSS**: Module-based styling với biến và mixins
- **Angular Router**: Client-side routing với lazy loading

### Backend & SSR
- **Angular Universal**: Server-Side Rendering với Express
- **@angular/ssr**: Package chính thức cho SSR trong Angular 20
- **Express.js**: HTTP server cho production

### AI & Speech Services
- **Azure Cognitive Services Speech SDK**:
  - Text-to-Speech (TTS) cho giọng US/UK
  - Pronunciation Assessment API
  - Syllable-level scoring
- **Web Audio API**: Ghi âm và xử lý audio trong trình duyệt

### Testing
- **Jasmine**: Testing framework
- **Karma**: Test runner
- **Angular Testing Utilities**: TestBed, ComponentFixture

### Build Tools
- **Angular CLI 20.3.1**: Development server và build tools
- **esbuild**: Fast JavaScript bundler
- **Vite** (optional): Alternative dev server

## 📁 Cấu trúc dự án

```text
TOEIC_Speaking_Test_Website/
├─ README.md                          # Tài liệu tổng quan
├─ TAI_LIEU_LOGIC_CHAM_DIEM.md        # Tài liệu logic chấm điểm penalty
│
└─ speaking_toeic/                    # Ứng dụng Angular chính
   ├─ public/                         # Static assets
   │  ├─ config.json.example          # Mẫu cấu hình Azure
   │  └─ config.json                  # Cấu hình Azure (gitignored)
   │
   ├─ src/
   │  ├─ app/
   │  │  ├─ home/                     # Trang chủ với lộ trình học
   │  │  │  ├─ home.component.ts
   │  │  │  ├─ home.component.html
   │  │  │  └─ home.component.scss
   │  │  │
   │  │  ├─ pronunciation-practice/   # Component luyện phát âm chính
   │  │  │  ├─ pronunciation-practice.component.ts
   │  │  │  ├─ pronunciation-practice.component.html
   │  │  │  └─ pronunciation-practice.component.scss
   │  │  │
   │  │  ├─ services/
   │  │  │  ├─ azure-speech.service.ts          # Azure Speech SDK wrapper
   │  │  │  └─ pronunciation-data.service.ts     # Load & manage JSON data
   │  │  │
   │  │  ├─ app.ts                    # Root component
   │  │  ├─ app.routes.ts             # Client-side routes
   │  │  ├─ app.routes.server.ts      # SSR routes
   │  │  ├─ app.config.ts             # App configuration
   │  │  └─ app.config.server.ts      # SSR configuration
   │  │
   │  ├─ assets/
   │  │  ├─ data/
   │  │  │  ├─ dataPronunciationWord.json    # 500+ từ vựng theo IPA
   │  │  │  └─ feebackPronunciation.json      # Feedback theo điểm số
   │  │  └─ img/                              # Logo, icons, images
   │  │
   │  ├─ main.ts                      # Browser entry point
   │  ├─ main.server.ts               # Server entry point
   │  ├─ server.ts                    # Express SSR server
   │  ├─ index.html                   # HTML template
   │  └─ styles.scss                  # Global styles
   │
   ├─ angular.json                    # Angular CLI configuration
   ├─ package.json                    # Dependencies & scripts
   ├─ tsconfig.json                   # TypeScript config
   └─ tsconfig.app.json               # App-specific TS config
```


## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- **Node.js**: >= 18.0.0 (khuyến nghị Node 20 LTS)
- **npm**: >= 8 (cài kèm Node.js)
- **Tài khoản Azure**: Cognitive Services (nếu sử dụng tính năng đánh giá phát âm)
- **Trình duyệt**: Chrome, Edge, Firefox (hỗ trợ Web Audio API)

### Bước 1: Clone repository
```bash
git clone https://github.com/TrungKienSilly/TOEIC_Speaking_Test_Website.git
cd TOEIC_Speaking_Test_Website/speaking_toeic
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình Azure Speech (Tùy chọn)
1. Tạo tài khoản Azure Cognitive Services
2. Lấy `subscriptionKey` và `serviceRegion`
3. Cập nhật trong file `src/app/services/azure-speech.service.ts`:
   ```typescript
   private subscriptionKey = 'YOUR_AZURE_KEY';
   private serviceRegion = 'YOUR_REGION'; // Ví dụ: 'southeastasia'
   ```

> **Lưu ý**: Nếu không có Azure key, bạn vẫn có thể sử dụng chức năng phát âm TTS, nhưng không thể đánh giá phát âm.

## 💻 Chạy ứng dụng

### Development mode (Client-side only)
```bash
npm start
# hoặc
ng serve
```
- Ứng dụng chạy tại: `http://localhost:4200`
- Hot reload khi thay đổi code
- Mở DevTools để xem logs

### Development với SSR
```bash
ng serve --ssr
```
- Test SSR trước khi deploy production
- Cần Angular CLI 20.3+

### Production build
```bash
# Build ứng dụng với SSR
npm run build

# Chạy production server
npm run serve:ssr:speaking_toeic
```
- Server chạy tại: `http://localhost:4000`
- Đổi port: `PORT=3000 npm run serve:ssr:speaking_toeic`

## 🧪 Kiểm thử

### Chạy unit tests
```bash
npm test
```

### Watch mode
```bash
npm run test -- --watch
```

### Test coverage
```bash
ng test --code-coverage
```

## 📖 Hướng dẫn sử dụng

### 1. Chọn chủ đề luyện tập
- Mở ứng dụng tại `http://localhost:4200`
- Sidebar bên trái hiển thị 10 chủ đề nguyên âm (Cat, Bed, Fish, Hot, Cup, Cake, Eat, Rice, Hello, School)
- Click vào chủ đề để xem danh sách từ vựng

### 2. Luyện phát âm
1. **Nghe phát âm chuẩn**: Click nút US hoặc UK để nghe
2. **Chuẩn bị ghi âm**: Click vào icon microphone
3. **Cấp quyền mic**: Lần đầu tiên cần cho phép truy cập microphone
4. **Ghi âm**: 
   - Nút chuyển màu vàng → Countdown 1 giây
   - Nút chuyển màu đỏ → Bắt đầu nói
   - Tự động dừng sau 5 giây
5. **Xem kết quả**: Điểm số hiển thị với 4 chỉ số và phân tích âm tiết

### 3. Xem chi tiết đánh giá
- Click "Chi tiết" để xem phân tích từng âm tiết
- Màu sắc âm tiết:
  - 🟢 Xanh (≥80): Tốt
  - 🟡 Vàng (60-79): Khá
  - 🔴 Đỏ (<60): Cần luyện thêm

### 4. Điều hướng
- **Nút Prev/Next**: Chuyển từ trước/sau
- **Refresh**: Làm mới bài tập
- **Trở về**: Quay lại trang chủ


## 🔧 Kiến trúc & Kỹ thuật

### Components

#### `PronunciationPracticeComponent`
Component chính cho chức năng luyện phát âm:
- **Signals**: `currentTopic`, `currentWords`, `isRecording`, `isPreparing`, `showScore`
- **State Management**: Quản lý trạng thái ghi âm, countdown, permission
- **Azure Integration**: Gọi API Text-to-Speech và Pronunciation Assessment
- **Error Handling**: Xử lý lỗi microphone, network, Azure API

#### `HomeComponent`
Trang chủ hiển thị các lộ trình học:
- Luyện từ vựng theo chủ đề
- Lộ trình 600+ TOEIC
- Thi thử Speaking

### Services

#### `AzureSpeechService`
Wrapper cho Azure Cognitive Services Speech SDK:
- **TTS (Text-to-Speech)**: Phát âm giọng US/UK
- **Pronunciation Assessment**: Đánh giá phát âm với 4 metrics
- **Penalty Logic**: Tính điểm dựa trên số âm tiết sai
- **Syllable Analysis**: Phân tích từng âm tiết với accuracy score

Công thức chấm điểm:
```typescript
// Single syllable: Dùng điểm của âm tiết
overall = syllableScore

// Multi-syllable: Penalty system
percentPerSyllable = 100 / totalSyllables
totalPenalty = (missingCount + badCount) * percentPerSyllable
overall = max(0, baseScore - totalPenalty)
```

#### `PronunciationDataService`
Quản lý dữ liệu JSON:
- Load `dataPronunciationWord.json` (500+ từ vựng)
- Load `feebackPronunciation.json` (feedback theo level)
- **SSR-safe**: Chỉ load data trên browser với `isPlatformBrowser()`
- Cache data để tối ưu performance

### Xử lý SSR

```typescript
// Tránh lỗi HttpClient khi SSR
if (!isPlatformBrowser(this.platformId)) {
  console.log('⚠️ Running on server - skip loading JSON data');
  return;
}
```

### Quản lý quyền Microphone

```typescript
// Flow xử lý permission
1. Check permission status (nếu browser hỗ trợ)
2. Request microphone access
3. Xử lý 3 trường hợp:
   - Allow: Set hasMicPermission = true
   - Block: Hiển thị thông báo hướng dẫn
   - Dismiss: Hỏi lại lần sau
```

## 📊 Dữ liệu

### `dataPronunciationWord.json`
Cấu trúc:
```json
[
  {
    "name": "Words with the sound a in Cat",
    "level": "basic",
    "am": "æ",
    "list": [
      {
        "stt": 1,
        "word": "cat",
        "ipa": "kæt",
        "translation": "Con Mèo",
        "partOfSpeech": "N"
      }
    ]
  }
]
```

### `feebackPronunciation.json`
```json
[
  {
    "level": "good",
    "min": 80,
    "max": 100,
    "feedback": "Xuất sắc! Phát âm rất tốt!"
  }
]
```

## 🐛 Xử lý lỗi thường gặp

### 1. Lỗi HttpClient khi share qua tunnel
**Nguyên nhân**: SSR cố gắng load JSON file, bị redirect qua GitHub authentication

**Giải pháp**: Đã fix bằng `isPlatformBrowser()` check trong `PronunciationDataService`

### 2. Microphone permission bị từ chối
**Triệu chứng**: Popup permission không hiện

**Giải pháp**: 
- Kiểm tra browser settings → Site permissions → Microphone
- Reset permissions và reload trang
- Đảm bảo chạy trên `localhost` hoặc HTTPS

### 3. Azure API lỗi 401 Unauthorized
**Nguyên nhân**: Sai `subscriptionKey` hoặc `serviceRegion`

**Giải pháp**: 
- Kiểm tra Azure Portal → Cognitive Services → Keys and Endpoint
- Cập nhật đúng key và region trong `azure-speech.service.ts`

### 4. Build lỗi TypeScript
**Nguyên nhân**: Strict mode enabled

**Giải pháp**: 
- Kiểm tra tất cả types được define đầy đủ
- Không dùng `any` type
- Initialize tất cả properties trong constructor

## 🚢 Deploy Production

### Vercel (Khuyến nghị)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build & deploy
npm run build
netlify deploy --prod --dir=dist/speaking_toeic/browser
```

### Railway / Render
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm run serve:ssr:speaking_toeic`
4. Set `PORT` environment variable (Railway tự động set)

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/speaking_toeic ./dist/speaking_toeic
EXPOSE 4000
CMD ["npm", "run", "serve:ssr:speaking_toeic"]
```

## 📚 Tài liệu tham khảo

- [Angular 20 Documentation](https://angular.dev)
- [Azure Cognitive Services Speech SDK](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [TOEIC Speaking Test Format](https://www.ets.org/toeic/test-takers/speaking-writing-tests/test-content/speaking.html)
- [TAI_LIEU_LOGIC_CHAM_DIEM.md](./TAI_LIEU_LOGIC_CHAM_DIEM.md) - Chi tiết logic chấm điểm penalty

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

## 📄 License

Dự án này được phát hành theo giấy phép MIT License.

## 👨‍💻 Tác giả

**TrungKienSilly**
- GitHub: [@TrungKienSilly](https://github.com/TrungKienSilly)
- Repository: [TOEIC_Speaking_Test_Website](https://github.com/TrungKienSilly/TOEIC_Speaking_Test_Website)

---

⭐ Nếu dự án hữu ích, đừng quên star repository để ủng hộ!
