# TÀI LIỆU: HỆ THỐNG CHẤM ĐIỂM PHÁT ÂM TOEIC SPEAKING

**Dự án:** TOEIC Speaking Test Website  
**Phiên bản:** 1.0  
**Ngày cập nhật:** 14/10/2025  
**Công nghệ:** Angular 18 + Azure Speech Service

---

## MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Azure Speech Service API](#2-azure-speech-service-api)
3. [Cấu Trúc JSON Trả Về Từ Azure](#3-cấu-trúc-json-trả-về-từ-azure)
4. [Logic Chấm Điểm Chi Tiết](#4-logic-chấm-điểm-chi-tiết)
5. [Phát Hiện Âm Tiết Thiếu/Sai](#5-phát-hiện-âm-tiết-thiếusai)
6. [Các Trường Hợp Đặc Biệt](#6-các-trường-hợp-đặc-biệt)
7. [Flow Diagram](#7-flow-diagram)
8. [Code Implementation](#8-code-implementation)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Mục đích
Hệ thống đánh giá phát âm tiếng Anh cho người học TOEIC Speaking, cung cấp:
- Điểm số chi tiết cho từng từ vựng
- Phân tích từng âm tiết (syllable)
- Gợi ý cải thiện phát âm
- Theo dõi tiến độ học tập

### 1.2. Các thành phần chính
```
┌─────────────────────────────────────────────────────┐
│                 USER INTERFACE                      │
│  (Angular Component - pronunciation-practice)      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              AZURE SPEECH SERVICE                   │
│         (azure-speech.service.ts)                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│        MICROSOFT AZURE CLOUD API                    │
│  - Speech-to-Text (STT)                            │
│  - Pronunciation Assessment                         │
└─────────────────────────────────────────────────────┘
```

### 1.3. Quy trình làm việc
1. Người dùng nhấn nút ghi âm
2. Microphone thu âm giọng nói
3. Gửi audio lên Azure Speech API
4. Azure phân tích và trả về JSON kết quả
5. Service xử lý JSON và tính điểm
6. Hiển thị kết quả chi tiết cho người dùng

---

## 2. AZURE SPEECH SERVICE API

### 2.1. Cấu hình API
```typescript
const paConfig = new SpeechSDK.PronunciationAssessmentConfig(
  referenceText,                                    // Từ chuẩn cần phát âm
  SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,  // Thang điểm 0-100
  SpeechSDK.PronunciationAssessmentGranularity.Phoneme,        // Phân tích đến mức âm vị
  true                                              // Enable miscue (phát hiện sai từ)
);
paConfig.nbestPhonemeCount = 3;                    // Lấy 3 phát âm gần đúng nhất
```

### 2.2. Các tham số quan trọng

| Tham số           | Giá trị        | Ý nghĩa |
|---------          |---------       |---------|
| `GradingSystem`   | `HundredMark` | Điểm từ 0-100 |
| `Granularity` | `Phoneme` | Phân tích chi tiết đến từng âm vị |
| `enableMiscue` | `true` | Phát hiện đọc sai từ |
| `nbestPhonemeCount` | `3` | Số lượng phát âm thay thế |

### 2.3. Timeout và Error Handling
```typescript
// Timeout chính: 3 giây (người dùng nói)
const timeoutMs = 3000;

// Hard timeout: 15 giây (chờ Azure xử lý)
const hardTimeout = 15000;

// Xử lý lỗi:
// - NoMatch: Azure nghe được nhưng không khớp
// - Canceled: Lỗi network hoặc API key
// - RecognizedSpeech: Thành công
```

---

## 3. CẤU TRÚC JSON TRẢ VỀ TỪ AZURE

### 3.1. JSON hoàn chỉnh (ví dụ: "fantastic")
```json
{
  "NBest": [
    {
      "Confidence": 0.95,
      "Display": "fantastic.",
      "ITN": "fantastic",
      "Lexical": "fantastic",
      "MaskedITN": "fantastic",
      "PronunciationAssessment": {
        "AccuracyScore": 61.0,
        "CompletenessScore": 100.0,
        "FluencyScore": 100.0,
        "PronScore": 84.0
      },
      "Words": [
        {
          "Word": "fantastic",
          "Offset": 3700000,
          "Duration": 6800000,
          "PronunciationAssessment": {
            "AccuracyScore": 61.0,
            "ErrorType": "None"
          },
          "Syllables": [
            {
              "Syllable": "faen",
              "Offset": 3700000,
              "Duration": 2100000,
              "PronunciationAssessment": {
                "AccuracyScore": 0.0
              }
            },
            {
              "Syllable": "taes",
              "Offset": 5900000,
              "Duration": 2300000,
              "PronunciationAssessment": {
                "AccuracyScore": 65.0
              }
            },
            {
              "Syllable": "tihk",
              "Offset": 8300000,
              "Duration": 2200000,
              "PronunciationAssessment": {
                "AccuracyScore": 50.0
              }
            }
          ],
          "Phonemes": [
            {
              "Phoneme": "f",
              "Offset": 3700000,
              "Duration": 800000,
              "PronunciationAssessment": {
                "AccuracyScore": 0.0,
                "NBestPhonemes": [
                  { "Phoneme": "t", "Score": 58.0 },
                  { "Phoneme": "d", "Score": 42.0 },
                  { "Phoneme": "f", "Score": 0.0 }
                ]
              }
            }
            // ... các phoneme khác
          ]
        }
      ]
    }
  ],
  "DisplayText": "fantastic."
}
```

### 3.2. Các trường dữ liệu quan trọng

#### A. Cấp độ từ (Word Level)
```json
"PronunciationAssessment": {
  "AccuracyScore": 61.0,      // Độ chính xác phát âm (0-100)
  "CompletenessScore": 100.0,  // Độ hoàn chỉnh (0-100)
  "FluencyScore": 100.0,       // Độ trôi chảy (0-100)
  "PronScore": 84.0            // Điểm tổng hợp của Azure
}
```

#### B. Cấp độ âm tiết (Syllable Level)
```json
"Syllables": [
  {
    "Syllable": "faen",                    // Âm tiết phiên âm
    "Offset": 3700000,                     // Thời điểm bắt đầu (100ns)
    "Duration": 2100000,                   // Độ dài âm thanh (100ns)
    "PronunciationAssessment": {
      "AccuracyScore": 0.0                 // Điểm âm tiết (0-100)
    }
  }
]
```

#### C. Cấp độ âm vị (Phoneme Level)
```json
"Phonemes": [
  {
    "Phoneme": "f",                        // Âm vị IPA
    "PronunciationAssessment": {
      "AccuracyScore": 0.0,
      "NBestPhonemes": [                   // Âm người dùng phát âm gần nhất
        { "Phoneme": "t", "Score": 58.0 },
        { "Phoneme": "d", "Score": 42.0 }
      ]
    }
  }
]
```

### 3.3. Cách lấy JSON trong code
```typescript
// Lấy raw JSON từ Azure
const paJson = result.properties.getProperty(
  SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
);

// Parse JSON
const parsed = JSON.parse(paJson);

// Truy cập dữ liệu
const nbest = parsed?.NBest?.[0];
const pa = nbest?.PronunciationAssessment;
const words = nbest?.Words || [];
const syllables = words[0]?.Syllables || [];

// Log để debug
console.log('Azure JSON:', JSON.stringify(parsed, null, 2));
```

---

## 4. LOGIC CHẤM ĐIỂM CHI TIẾT

### 4.1. Các loại điểm số

#### **A. Accuracy Score (Độ Chính Xác)**
- **Nguồn:** Trực tiếp từ Azure
- **Thang điểm:** 0-100
- **Ý nghĩa:** Đánh giá độ chính xác phát âm từng âm vị
- **Công thức Azure:** So sánh waveform với phát âm chuẩn
- **Không điều chỉnh:** Giữ nguyên giá trị Azure trả về

```typescript
accuracy = pa?.AccuracyScore ?? 0;
```

#### **B. Completeness Score (Độ Hoàn Chỉnh)**
- **Giá trị gốc:** Từ Azure (0-100)
- **Điều chỉnh:** CÓ - dựa trên số âm tiết thiếu

**Công thức điều chỉnh:**
```
percentPerSyllable = 100 / tổng số âm tiết
missingPenalty = số âm thiếu × percentPerSyllable
Completeness mới = max(0, Completeness cũ - missingPenalty)
```

**Ví dụ:** "fantastic" (3 âm tiết)
- Azure trả về: `CompletenessScore = 100`
- Phân tích syllables:
  - faen: 0 điểm → THIẾU
  - taes: 65 điểm → OK
  - tihk: 50 điểm → OK
- Tính toán:
  ```
  percentPerSyllable = 100 / 3 = 33.33%
  missingPenalty = 1 × 33.33 = 33.33%
  Completeness mới = 100 - 33.33 = 66.67 ≈ 67
  ```

#### **C. Fluency Score (Độ Trôi Chảy)**
- **Giá trị gốc:** Từ Azure (0-100)
- **Điều chỉnh:** CÓ - khi có âm bị thiếu (nói ngắt quãng)

**Logic:**
- Nếu có âm tiết bị thiếu → người dùng nói ngắt quãng → giảm fluency
- Penalty = 50% của penalty completeness

**Công thức:**
```
Fluency penalty = missingPenalty × 0.5
Fluency mới = max(0, Fluency cũ - Fluency penalty)
```

**Ví dụ:** "fantastic"
```
missingPenalty = 33.33% (thiếu âm "faen")
Fluency penalty = 33.33 × 0.5 = 16.67%
Fluency mới = 100 - 16.67 = 83.33 ≈ 83
```

**Code implementation:**
```typescript
let adjustedFluency = fluency;
if (missingSyllableCount > 0) {
  const flPenalty = missingPenalty * 0.5;
  adjustedFluency = Math.max(0, fluency - flPenalty);
  
  console.warn(
    `⚠️ Điều chỉnh Fluency: ${fluency} -> ` +
    `${adjustedFluency.toFixed(0)} (nói ngắt quãng)`
  );
}
```

**Code implementation cho Completeness:**
```typescript
let adjustedCompleteness = completeness;
if (missingSyllableCount > 0) {
  const percentPerSyllable = 100 / totalSyllables;
  const missingPenalty = missingSyllableCount * percentPerSyllable;
  adjustedCompleteness = Math.max(0, completeness - missingPenalty);
  
  console.warn(
    `⚠️ Điều chỉnh Completeness: ${completeness} -> ` +
    `${adjustedCompleteness.toFixed(0)} (thiếu ${missingSyllableCount} âm)`
  );
}
```

#### **D. Overall Score (Điểm Tổng Thể)**

**Lưu ý quan trọng:** Logic tính Overall Score khác nhau giữa từ 1 âm tiết và từ nhiều âm tiết.

---

##### **D.1. Từ MỘT ÂM TIẾT (totalSyllables === 1)**

**Ví dụ:** gym, run, cat, hot, bed, sit, dog

**Công thức:**
```typescript
const sylScore = syllables[0].PronunciationAssessment?.AccuracyScore ?? 0;
overall = sylScore;
adjustedAccuracy = sylScore; // Accuracy cũng lấy từ syllable
```

**Giải thích:**
- Với từ 1 âm tiết, điểm Overall = điểm chi tiết phát âm của âm tiết duy nhất
- KHÔNG sử dụng Accuracy Score tổng thể từ Azure
- KHÔNG áp dụng logic penalty
- Lý do: Từ 1 âm tiết không thể chia nhỏ hơn, điểm syllable phản ánh chính xác nhất

**Ví dụ cụ thể - từ "run":**
```json
Azure Response:
{
  "PronunciationAssessment": {
    "AccuracyScore": 62,      // Điểm tổng thể (KHÔNG dùng)
    "CompletenessScore": 100,
    "FluencyScore": 100
  },
  "Syllables": [
    {
      "Syllable": "rʌn",
      "PronunciationAssessment": {
        "AccuracyScore": 52   // Điểm chi tiết (SỬ DỤNG)
      }
    }
  ]
}

Kết quả trả về:
{
  accuracy: 52,        // Lấy từ syllable (không phải 62)
  completeness: 100,   // Giữ nguyên từ Azure
  fluency: 100,        // Giữ nguyên từ Azure  
  overall: 52          // = syllable score
}
```

**Console log:**
```
💡 Từ một âm tiết -> Điểm từ chi tiết phát âm (syllable score)
📊 Single Syllable Analysis: {
  syllable: "rʌn",
  syllableScore: 52,
  azureAccuracy: 62,      // Điểm Azure tổng thể (không dùng)
  adjustedAccuracy: 52,   // Điểm đã điều chỉnh
  completeness: 100,
  fluency: 100,
  overall: 52
}
```

**Code implementation:**
```typescript
if (totalSyllables === 1) {
  console.log('💡 Từ một âm tiết -> Điểm từ chi tiết phát âm (syllable score)');
  
  // Lấy điểm từ chi tiết phát âm (syllable)
  const sylScore = syllables[0].PronunciationAssessment?.AccuracyScore ?? 0;
  
  // Overall = syllable score
  overall = sylScore;
  
  // Accuracy cũng = syllable score (không dùng accuracy tổng thể)
  const adjustedAccuracy = sylScore;
  
  console.log('📊 Single Syllable Analysis:', {
    syllable: syllables[0].Syllable,
    syllableScore: sylScore,
    azureAccuracy: accuracy,
    adjustedAccuracy: sylScore,
    completeness,
    fluency,
    overall: sylScore
  });
  
  // Trả về với accuracy và overall điều chỉnh
  return { 
    accuracy: adjustedAccuracy, 
    completeness, 
    fluency, 
    overall, 
    raw: parsed 
  };
}
```

---

##### **D.2. Từ NHIỀU ÂM TIẾT (totalSyllables >= 2)**

**Ví dụ:** fantastic, wonderful, beautiful, attractive

**Công thức phức tạp (4 bước):**

**Bước 1: Phân loại âm tiết**
```typescript
let missingSyllableCount = 0; // Âm không được nhận dạng (score = 0)
let badSyllableCount = 0;     // Âm phát âm yếu (0 < score < 60)

syllables.forEach((syl: any) => {
  const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
  
  if (sylScore === 0) {
    missingSyllableCount++;
    console.error(`❌ Âm tiết "${syl.Syllable}" KHÔNG được nhận dạng`);
  } else if (sylScore < 60) {
    badSyllableCount++;
    console.log(`⚠️ Âm tiết "${syl.Syllable}" có điểm thấp: ${sylScore}`);
  }
  // Còn lại là âm tốt (score >= 60)
});
```

**Bước 2: Tính penalty**
```typescript
percentPerSyllable = 100 / totalSyllables;
missingPenalty = missingSyllableCount × percentPerSyllable;
badPenalty = badSyllableCount × percentPerSyllable;
totalPenalty = missingPenalty + badPenalty;
```

**Bước 3: Chọn base score**
```typescript
baseScore = min(PronScore, AccuracyScore);
```

**Bước 4: Tính overall**
```typescript
overall = max(0, round(baseScore - totalPenalty));
```

**Công thức tổng hợp:**
```
overall = max(0, min(PronScore, Accuracy) - totalPenalty)

Trong đó:
  totalPenalty = (missingSyllables × 100/totalSyllables) 
               + (badSyllables × 100/totalSyllables)
```

**Ví dụ chi tiết - từ "fantastic" (3 âm tiết):**

**Dữ liệu:**
```
Syllables:
  - faen: 0 điểm   → Missing
  - taes: 65 điểm  → OK  
  - tihk: 50 điểm  → Bad (< 60)

Azure scores:
  - AccuracyScore: 61
  - PronScore: 84
```

**Tính toán từng bước:**
```
Bước 1: Phân loại
  missingSyllableCount = 1 (faen)
  badSyllableCount = 1 (tihk)
  okSyllableCount = 1 (taes)

Bước 2: Tính penalty
  percentPerSyllable = 100 / 3 = 33.33%
  missingPenalty = 1 × 33.33 = 33.33%
  badPenalty = 1 × 33.33 = 33.33%
  totalPenalty = 33.33 + 33.33 = 66.66%

Bước 3: Chọn base score
  baseScore = min(84, 61) = 61

Bước 4: Tính overall
  overall = max(0, 61 - 66.66)
  overall = max(0, -5.66)
  overall = 0
```

**Console log:**
```
💡 Từ nhiều âm tiết -> Áp dụng logic penalty
❌ Âm tiết "faen" KHÔNG được nhận dạng: 0 điểm
⚠️ Âm tiết "tihk" có điểm thấp: 50

📊 Multi-Syllable Analysis: {
  totalSyllables: 3,
  percentPerSyllable: "33.33%",
  missingSyllables: 1,
  badSyllables: 1,
  missingPenalty: "33.33%",
  badPenalty: "33.33%",
  totalPenalty: "66.66%",
  baseScore: 61,
  finalScore: 0,
  adjustedCompleteness: "67",
  adjustedFluency: "83"
}
```

**Code implementation:**
```typescript
// TRƯỜNG HỢP THƯỜNG: Từ nhiều âm tiết (>= 2)
console.log('💡 Từ nhiều âm tiết -> Áp dụng logic penalty');

// Đếm số âm tiết bị thiếu (score = 0) và số âm tiết yếu (score < 60)
let missingSyllableCount = 0;
let badSyllableCount = 0;
let totalSyllableScore = 0;

syllables.forEach((syl: any) => {
  const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
  totalSyllableScore += sylScore;
  
  if (sylScore === 0) {
    missingSyllableCount++;
    console.error(`❌ Âm tiết "${syl.Syllable}" KHÔNG được nhận dạng: 0 điểm`);
  } else if (sylScore < 60) {
    badSyllableCount++;
    console.log(`⚠️ Âm tiết "${syl.Syllable}" có điểm thấp: ${sylScore}`);
  }
});

// Tính phần trăm mỗi âm tiết
const percentPerSyllable = 100 / totalSyllables;

// Tính penalty
const missingPenalty = missingSyllableCount * percentPerSyllable;
const badPenalty = badSyllableCount * percentPerSyllable;
const totalPenalty = missingPenalty + badPenalty;

// Điều chỉnh completeness nếu có âm bị thiếu
let adjustedCompleteness = completeness;
if (missingSyllableCount > 0) {
  adjustedCompleteness = Math.max(0, completeness - missingPenalty);
  console.warn(`⚠️ Điều chỉnh Completeness: ${completeness} -> ${adjustedCompleteness.toFixed(0)}`);
}

// Điều chỉnh fluency nếu nói ngắt quãng (có âm bị thiếu)
let adjustedFluency = fluency;
if (missingSyllableCount > 0) {
  adjustedFluency = Math.max(0, fluency - (missingPenalty * 0.5));
  console.warn(`⚠️ Điều chỉnh Fluency: ${fluency} -> ${adjustedFluency.toFixed(0)}`);
}

const baseScore = pronScore < accuracy ? pronScore : accuracy;
overall = Math.max(0, Math.round(baseScore - totalPenalty));

console.log('📊 Multi-Syllable Analysis:', {
  totalSyllables,
  percentPerSyllable: percentPerSyllable.toFixed(2) + '%',
  missingSyllables: missingSyllableCount,
  badSyllables: badSyllableCount,
  missingPenalty: missingPenalty.toFixed(2) + '%',
  badPenalty: badPenalty.toFixed(2) + '%',
  totalPenalty: totalPenalty.toFixed(2) + '%',
  baseScore,
  finalScore: overall,
  adjustedCompleteness: adjustedCompleteness.toFixed(0),
  adjustedFluency: adjustedFluency.toFixed(0)
});

// Trả về điểm đã điều chỉnh
return { 
  accuracy, 
  completeness: Math.round(adjustedCompleteness), 
  fluency: Math.round(adjustedFluency), 
  overall, 
  raw: parsed 
};
```

---

##### **D.3. So sánh tóm tắt**

| Đặc điểm | Từ 1 âm tiết | Từ nhiều âm tiết |
|----------|--------------|------------------|
| **Ví dụ** | gym, run, cat | fantastic, beautiful |
| **Overall** | `syllables[0].AccuracyScore` | `min(PronScore, Accuracy) - totalPenalty` |
| **Accuracy** | `syllables[0].AccuracyScore` | Azure `AccuracyScore` (giữ nguyên) |
| **Completeness** | Azure (giữ nguyên) | Điều chỉnh theo missing penalty |
| **Fluency** | Azure (giữ nguyên) | Điều chỉnh theo 50% missing penalty |
| **Penalty** | KHÔNG áp dụng | CÓ áp dụng |

---

##### **D.4. Flow diagram cho Overall Score**

```
                  ┌─────────────────────────┐
                  │   Parse Azure JSON      │
                  └───────────┬─────────────┘
                              │
                 ┌────────────▼────────────┐
                 │ totalSyllables === 1?   │
                 └─────┬──────────┬────────┘
                       │ YES      │ NO
                       ▼          │
              ┌────────────────┐  │
              │ overall =      │  │
              │ syllables[0]   │  │
              │ .AccuracyScore │  │
              └────────────────┘  │
                                  │
                                  ▼
                     ┌──────────────────────┐
                     │  Phân loại syllables │
                     │  - Missing (=0)      │
                     │  - Bad (<60)         │
                     │  - OK (>=60)         │
                     └──────────┬───────────┘
                                │
                     ┌──────────▼───────────┐
                     │  Tính totalPenalty   │
                     │  = missing% + bad%   │
                     └──────────┬───────────┘
                                │
                     ┌──────────▼───────────┐
                     │  baseScore =         │
                     │  min(PronScore, Acc) │
                     └──────────┬───────────┘
                                │
                     ┌──────────▼───────────┐
                     │  overall =           │
                     │  max(0, base-penalty)│
                     └──────────────────────┘
```

---

### 4.2. Bảng tóm tắt công thức toàn bộ

| Điểm | Từ 1 âm tiết | Từ nhiều âm tiết | Điều chỉnh |
|------|--------------|------------------|------------|
| **Accuracy** | `syllables[0].AccuracyScore` | `Azure.AccuracyScore` | 1 âm: CÓ / Nhiều âm: KHÔNG |
| **Completeness** | `Azure.CompletenessScore` | `old - (missing × 100/total)` | Nhiều âm: CÓ (nếu có missing) |
| **Fluency** | `Azure.FluencyScore` | `old - (missing × 100/total × 0.5)` | Nhiều âm: CÓ (nếu có missing) |
| **Overall** | `syllables[0].AccuracyScore` | `baseScore - totalPenalty` | Luôn khác nhau |

---

**Công thức:**
```
Fluency penalty = missingPenalty × 0.5
Fluency mới = max(0, Fluency cũ - Fluency penalty)
```

**Ví dụ:** "fantastic"
```
missingPenalty = 33.33% (thiếu âm "faen")
Fluency penalty = 33.33 × 0.5 = 16.67%
Fluency mới = 100 - 16.67 = 83.33 ≈ 83
```

**Code implementation:**
```typescript
let adjustedFluency = fluency;
if (missingSyllableCount > 0) {
  const flPenalty = missingPenalty * 0.5;
  adjustedFluency = Math.max(0, fluency - flPenalty);
  
  console.warn(
    `⚠️ Điều chỉnh Fluency: ${fluency} -> ` +
    `${adjustedFluency.toFixed(0)} (nói ngắt quãng)`
  );
}
```

#### **D. Overall Score (Điểm Tổng Thể)**
**Công thức phức tạp nhất:**

```
1. Phân loại âm tiết:
   - Missing (score = 0): Âm không được nhận dạng
   - Bad (0 < score < 60): Âm phát âm yếu
   - OK (score ≥ 60): Âm phát âm tốt

2. Tính penalty:
   percentPerSyllable = 100 / tổng số âm tiết
   missingPenalty = số âm missing × percentPerSyllable
   badPenalty = số âm bad × percentPerSyllable
   totalPenalty = missingPenalty + badPenalty

3. Chọn base score:
   baseScore = min(PronScore, AccuracyScore)

4. Điểm cuối:
   overall = max(0, baseScore - totalPenalty)
```

**Ví dụ chi tiết: "fantastic"**

**Dữ liệu:**
- faen: 0 điểm → Missing
- taes: 65 điểm → OK
- tihk: 50 điểm → Bad (< 60)
- AccuracyScore: 61
- PronScore: 84

**Tính toán:**
```
Step 1: Phân loại
  missingSyllableCount = 1 (faen)
  badSyllableCount = 1 (tihk)

Step 2: Tính penalty
  percentPerSyllable = 100 / 3 = 33.33%
  missingPenalty = 1 × 33.33 = 33.33%
  badPenalty = 1 × 33.33 = 33.33%
  totalPenalty = 33.33 + 33.33 = 66.66%

Step 3: Chọn base score
  baseScore = min(84, 61) = 61

Step 4: Điểm cuối
  overall = max(0, 61 - 66.66) = 0
```

**Code implementation:**
```typescript
// Đếm loại âm tiết
let missingSyllableCount = 0;
let badSyllableCount = 0;

syllables.forEach((syl: any) => {
  const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
  
  if (sylScore === 0) {
    missingSyllableCount++;
    console.error(`❌ Âm tiết "${syl.Syllable}" KHÔNG được nhận dạng`);
  } else if (sylScore < 60) {
    badSyllableCount++;
    console.log(`⚠️ Âm tiết "${syl.Syllable}" có điểm thấp: ${sylScore}`);
  }
});

// Tính penalty
const percentPerSyllable = 100 / totalSyllables;
const missingPenalty = missingSyllableCount * percentPerSyllable;
const badPenalty = badSyllableCount * percentPerSyllable;
const totalPenalty = missingPenalty + badPenalty;

// Chọn base score
const baseScore = pronScore < accuracy ? pronScore : accuracy;

// Điểm cuối
overall = Math.max(0, Math.round(baseScore - totalPenalty));

// Log chi tiết
console.log('📊 Syllable Analysis:', {
  totalSyllables,
  percentPerSyllable: percentPerSyllable.toFixed(2) + '%',
  missingSyllables: missingSyllableCount,
  badSyllables: badSyllableCount,
  missingPenalty: missingPenalty.toFixed(2) + '%',
  badPenalty: badPenalty.toFixed(2) + '%',
  totalPenalty: totalPenalty.toFixed(2) + '%',
  baseScore,
  finalScore: overall
});
```

### 4.2. Bảng tóm tắt công thức

| Điểm | Nguồn | Điều chỉnh | Công thức |
|------|-------|------------|-----------|
| **Accuracy** | Azure | KHÔNG | `accuracy = Azure.AccuracyScore` |
| **Completeness** | Azure | CÓ | `new = old - (missing × 100/total)` |
| **Fluency** | Azure | CÓ | `new = old - (missing × 100/total × 0.5)` |
| **Overall** | Tính toán | CÓ | `baseScore - totalPenalty` |

---

## 5. PHÁT HIỆN ÂM TIẾT THIẾU/SAI

### 5.1. Cách nhận biết âm tiết thiếu

#### **Phương pháp 1: Kiểm tra AccuracyScore = 0**
```typescript
syllables.forEach((syl: any) => {
  const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
  
  if (sylScore === 0) {
    // Âm tiết này KHÔNG được nhận dạng
    console.error(`❌ Âm tiết "${syl.Syllable}" bị thiếu hoặc không đọc được`);
    missingSyllableCount++;
  }
});
```

#### **Phương pháp 2: Kiểm tra CompletenessScore**
```typescript
if (completeness === 0) {
  // Người dùng không nói đủ từ
  console.warn('⚠️ Từ không được phát âm đầy đủ');
}
```

#### **Phương pháp 3: So sánh số âm tiết**
```typescript
const expectedSyllables = 3; // fantastic có 3 âm tiết
const recognizedSyllables = syllables.length;

if (recognizedSyllables < expectedSyllables) {
  console.warn(`⚠️ Thiếu ${expectedSyllables - recognizedSyllables} âm tiết`);
}
```

### 5.2. Cách nhận biết âm tiết sai

#### **Dựa vào AccuracyScore**
```typescript
syllables.forEach((syl: any) => {
  const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
  
  if (sylScore > 0 && sylScore < 60) {
    // Có nhận dạng nhưng phát âm không tốt
    console.log(`⚠️ Âm tiết "${syl.Syllable}" phát âm yếu: ${sylScore} điểm`);
    badSyllableCount++;
  }
});
```

#### **Dựa vào NBestPhonemes (gợi ý sửa lỗi)**
```typescript
phonemes.forEach((ph: any) => {
  const phScore = ph.PronunciationAssessment?.AccuracyScore ?? 0;
  const nbestPhonemes = ph.PronunciationAssessment?.NBestPhonemes || [];
  
  if (phScore < 60 && nbestPhonemes.length > 0) {
    const actualPhoneme = nbestPhonemes[0].Phoneme; // Âm người dùng thực sự phát âm
    const expectedPhoneme = ph.Phoneme;             // Âm chuẩn
    
    console.log(`🔄 Bạn đọc "${actualPhoneme}" thay vì "${expectedPhoneme}"`);
  }
});
```

### 5.3. Hiển thị trực quan trong UI

#### **HTML Template:**
```html
<div class="syllable-detail">
  @for (detail of syllableDetails(); track detail.syllable) {
    <span 
      class="syllable-item"
      [class.worst]="isWorstPhoneme(detail)"
      [class.good]="detail.score >= 60">
      
      {{ detail.syllable }}
      
      @if (detail.hasData) {
        <span class="score">[{{ detail.score }}/100]</span>
      } @else {
        <span class="missing">❌ Thiếu</span>
      }
    </span>
  }
</div>
```

#### **TypeScript Logic:**
```typescript
isWorstPhoneme(detail: SyllableDetail): boolean {
  // Tô đỏ nếu điểm < 60 (bao gồm cả điểm 0)
  return detail.hasData && detail.score < 60;
}
```

#### **CSS Styling:**
```scss
.syllable-item {
  &.worst {
    background-color: #ffebee;  // Màu đỏ nhạt
    color: #c62828;             // Chữ đỏ đậm
    font-weight: bold;
  }
  
  &.good {
    background-color: #e8f5e9;  // Màu xanh nhạt
    color: #2e7d32;             // Chữ xanh đậm
  }
  
  .missing {
    color: #d32f2f;
    font-weight: bold;
  }
}
```

### 5.4. Console logging để debug

```typescript
console.log('🗣️ Người dùng phát âm:', recognizedText);
console.log('📝 Text mong đợi:', referenceText);

syllables.forEach((syl: any, index: number) => {
  const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
  
  if (sylScore === 0) {
    console.error(`❌ Âm ${index + 1} "${syl.Syllable}": KHÔNG nhận dạng (0 điểm)`);
  } else if (sylScore < 60) {
    console.warn(`⚠️ Âm ${index + 1} "${syl.Syllable}": ${sylScore} điểm (yếu)`);
  } else {
    console.log(`✅ Âm ${index + 1} "${syl.Syllable}": ${sylScore} điểm (tốt)`);
  }
});
```

---

## 6. CÁC TRƯỜNG HỢP ĐẶC BIỆT

### 6.1. Completeness = 0 nhưng có syllable data

**Tình huống:** Người dùng chỉ nói một phần từ (VD: "tic" thay vì "fantastic")

**Xử lý:**
```typescript
if (completeness === 0 && words.length > 0) {
  const syllables = words[0].Syllables || [];
  
  if (syllables.length > 0) {
    // Tính điểm trung bình các âm đã nói
    let totalSyllableScore = 0;
    syllables.forEach((syl: any) => {
      totalSyllableScore += syl.PronunciationAssessment?.AccuracyScore ?? 0;
    });
    
    const avgScore = totalSyllableScore / syllables.length;
    // Penalty 50% vì không nói đủ từ
    overall = Math.round(avgScore * 0.5);
    
    console.log('💡 Người dùng chỉ nói một phần từ:');
    console.log(`   - Số âm đã nói: ${syllables.length}`);
    console.log(`   - Điểm TB: ${avgScore.toFixed(1)}`);
    console.log(`   - Điểm cuối (penalty 50%): ${overall}`);
  }
}
```

### 6.2. Completeness = 0 và không có syllable data

**Tình huống:** Azure hoàn toàn không nhận dạng được

**Xử lý:**
```typescript
if (completeness === 0 && syllables.length === 0) {
  if (accuracy > 0) {
    // Vẫn có accuracy → cho điểm thấp
    overall = Math.round(accuracy * 0.3); // Penalty 70%
    console.log(`💡 Không có syllable nhưng có accuracy: ${accuracy}`);
  } else {
    // Hoàn toàn không có dữ liệu
    overall = 0;
    console.log('💡 Không có dữ liệu → 0 điểm');
  }
}
```

### 6.3. NoMatch - Azure không nhận dạng chính xác

**Tình huống:** `result.reason === SpeechSDK.ResultReason.NoMatch`

**Xử lý:**
```typescript
if (result.reason === SpeechSDK.ResultReason.NoMatch) {
  const recognizedText = result.text?.toLowerCase().replace(/[.,!?]/g, '') || '';
  const expectedText = referenceText.toLowerCase();
  
  if (!recognizedText || recognizedText.trim() === '') {
    // Không nhận dạng được gì
    console.warn('💡 Gợi ý: Nói quá nhỏ, quá nhanh, hoặc thiếu từ');
    return { accuracy: 0, completeness: 0, fluency: 0, overall: 0 };
  }
  
  // So sánh text để cho điểm
  const similarity = recognizedText === expectedText ? 70 : 30;
  return { 
    accuracy: similarity, 
    completeness: similarity, 
    fluency: Math.max(40, similarity - 10),
    overall: similarity 
  };
}
```

### 6.4. Timeout - Azure không phản hồi

**Xử lý:**
```typescript
const result = await new Promise<SpeechSDK.SpeechRecognitionResult>((resolve, reject) => {
  // Timeout dọn dẹp (3s)
  const cleanupTimeout = setTimeout(() => {
    console.warn('Cleanup sau 3s - Azure vẫn đang xử lý...');
    recognizer.stopContinuousRecognitionAsync();
  }, 3000);
  
  // Hard timeout (15s)
  const hardTimeout = setTimeout(() => {
    console.error('⏰ Hard timeout - Azure không phản hồi');
    recognizer.close();
    reject(new Error('Azure không phản hồi sau 15 giây'));
  }, 15000);
  
  recognizer.recognizeOnceAsync(
    (r) => {
      clearTimeout(cleanupTimeout);
      clearTimeout(hardTimeout);
      resolve(r);
    },
    (err) => {
      clearTimeout(cleanupTimeout);
      clearTimeout(hardTimeout);
      reject(err);
    }
  );
});
```

---

## 7. FLOW DIAGRAM

### 7.1. Overall Flow

```
┌─────────────────────────────────────────────────┐
│           USER CLICKS RECORD BUTTON             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         MICROPHONE CAPTURES AUDIO               │
│              (3 seconds max)                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      SEND AUDIO TO AZURE SPEECH API             │
│   + Reference text: "fantastic"                 │
│   + Config: Phoneme level analysis              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         AZURE PROCESSES & RETURNS JSON          │
│   - Speech-to-Text                              │
│   - Pronunciation Assessment                    │
│   - Syllable breakdown                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│            PARSE JSON RESPONSE                  │
│   Extract: accuracy, completeness,              │
│           fluency, syllables, phonemes          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           ANALYZE SYLLABLES                     │
│   - Count missing syllables (score = 0)         │
│   - Count bad syllables (score < 60)            │
│   - Calculate penalties                         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         ADJUST SCORES                           │
│   - Completeness: subtract missing penalty      │
│   - Fluency: subtract 50% of missing penalty    │
│   - Overall: baseScore - totalPenalty           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         DISPLAY RESULTS TO USER                 │
│   - Overall score with color coding             │
│   - Detailed syllable breakdown                 │
│   - Highlight syllables < 60 in red             │
│   - Show improvement suggestions                │
└─────────────────────────────────────────────────┘
```

### 7.2. Scoring Decision Tree

```
                  ┌─────────────────────┐
                  │  Parse Azure JSON   │
                  └──────────┬──────────┘
                             │
                ┌────────────▼────────────┐
                │ completeness === 0?     │
                └─────┬────────────┬──────┘
                      │ YES        │ NO
            ┌─────────▼──────┐     │
            │ Has syllables? │     │
            └─────┬────┬─────┘     │
                  │YES │NO         │
        ┌─────────▼──┐ │           │
        │ Avg × 0.5  │ │           │
        │ (50% pen)  │ │           │
        └────────────┘ │           │
                       │           │
              ┌────────▼─────┐     │
              │ Has accuracy?│     │
              └────┬────┬────┘     │
                   │YES │NO        │
          ┌────────▼──┐ │          │
          │Acc × 0.3  │ │          │
          │(70% pen)  │ │          │
          └───────────┘ │          │
                        │          │
                  ┌─────▼──────┐   │
                  │  Return 0  │   │
                  └────────────┘   │
                                   │
                      ┌────────────▼────────────┐
                      │  Analyze Syllables      │
                      │  - Count missing (=0)   │
                      │  - Count bad (<60)      │
                      └────────────┬────────────┘
                                   │
                      ┌────────────▼────────────┐
                      │  Calculate Penalties    │
                      │  - Missing penalty      │
                      │  - Bad penalty          │
                      │  - Total penalty        │
                      └────────────┬────────────┘
                                   │
                      ┌────────────▼────────────┐
                      │  Adjust Scores          │
                      │  - Completeness         │
                      │  - Fluency              │
                      │  - Overall              │
                      └────────────┬────────────┘
                                   │
                      ┌────────────▼────────────┐
                      │  Return Final Scores    │
                      └─────────────────────────┘
```

---

## 8. CODE IMPLEMENTATION

### 8.1. Service Method (azure-speech.service.ts)

```typescript
async assessPronunciation(
  referenceText: string, 
  timeoutMs = 3000
): Promise<AssessmentResult> {
  // 1. Setup Azure config
  const speechConfig = this.buildSpeechConfig();
  speechConfig.speechRecognitionLanguage = 'en-US';
  
  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  
  // 2. Configure Pronunciation Assessment
  const paConfig = new SpeechSDK.PronunciationAssessmentConfig(
    referenceText,
    SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
    SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
    true
  );
  paConfig.nbestPhonemeCount = 3;
  paConfig.applyTo(recognizer);
  
  // 3. Get recognition result
  const result = await new Promise<SpeechSDK.SpeechRecognitionResult>(
    (resolve, reject) => {
      recognizer.recognizeOnceAsync(resolve, reject);
    }
  );
  
  // 4. Parse JSON
  const paJson = result.properties.getProperty(
    SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
  );
  const parsed = JSON.parse(paJson);
  const nbest = parsed?.NBest?.[0];
  const pa = nbest?.PronunciationAssessment;
  
  // 5. Extract scores
  let accuracy = pa?.AccuracyScore ?? 0;
  let completeness = pa?.CompletenessScore ?? 0;
  let fluency = pa?.FluencyScore ?? 0;
  const pronScore = pa?.PronScore ?? 0;
  
  // 6. Get syllables
  const words = nbest?.Words || [];
  const syllables = words[0]?.Syllables || [];
  
  // 7. Analyze syllables
  let missingSyllableCount = 0;
  let badSyllableCount = 0;
  
  syllables.forEach((syl: any) => {
    const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
    
    if (sylScore === 0) {
      missingSyllableCount++;
      console.error(`❌ Âm "${syl.Syllable}": 0 điểm`);
    } else if (sylScore < 60) {
      badSyllableCount++;
      console.warn(`⚠️ Âm "${syl.Syllable}": ${sylScore} điểm`);
    }
  });
  
  // 8. Calculate penalties
  const percentPerSyllable = 100 / syllables.length;
  const missingPenalty = missingSyllableCount * percentPerSyllable;
  const badPenalty = badSyllableCount * percentPerSyllable;
  const totalPenalty = missingPenalty + badPenalty;
  
  // 9. Adjust Completeness
  let adjustedCompleteness = completeness;
  if (missingSyllableCount > 0) {
    adjustedCompleteness = Math.max(0, completeness - missingPenalty);
  }
  
  // 10. Adjust Fluency
  let adjustedFluency = fluency;
  if (missingSyllableCount > 0) {
    adjustedFluency = Math.max(0, fluency - (missingPenalty * 0.5));
  }
  
  // 11. Calculate Overall
  const baseScore = pronScore < accuracy ? pronScore : accuracy;
  const overall = Math.max(0, Math.round(baseScore - totalPenalty));
  
  // 12. Return results
  return {
    accuracy,
    completeness: Math.round(adjustedCompleteness),
    fluency: Math.round(adjustedFluency),
    overall,
    raw: parsed
  };
}
```

### 8.2. Component Method (pronunciation-practice.component.ts)

```typescript
isWorstPhoneme(detail: SyllableDetail): boolean {
  // Highlight all syllables with score < 60
  return detail.hasData && detail.score < 60;
}

async onPractice() {
  try {
    // Start recording
    this.isRecording.set(true);
    
    // Call Azure API
    const result = await this.azureService.assessPronunciation(
      this.currentWord().word,
      3000
    );
    
    // Update UI
    this.currentScore.set(result.overall);
    this.accuracyScore.set(result.accuracy);
    this.completenessScore.set(result.completeness);
    this.fluencyScore.set(result.fluency);
    
    // Parse syllable details
    this.parseSyllableDetails(result.raw);
    
    // Stop recording
    this.isRecording.set(false);
    
  } catch (error) {
    console.error('Lỗi đánh giá phát âm:', error);
    this.isRecording.set(false);
  }
}

private parseSyllableDetails(rawResult: any) {
  const words = rawResult?.NBest?.[0]?.Words || [];
  if (words.length === 0) return;
  
  const syllables = words[0].Syllables || [];
  const details: SyllableDetail[] = syllables.map((syl: any) => ({
    syllable: syl.Syllable,
    score: syl.PronunciationAssessment?.AccuracyScore ?? 0,
    hasData: true
  }));
  
  this.syllableDetails.set(details);
}
```

---

## KẾT LUẬN

Hệ thống chấm điểm phát âm sử dụng Azure Speech Service với logic phức tạp:

### ✅ Ưu điểm:
- Phân tích chi tiết đến từng âm vị (phoneme level)
- Phát hiện chính xác âm tiết thiếu/sai
- Điều chỉnh điểm số dựa trên phân tích thực tế
- Console logging chi tiết giúp debug
- UI hiển thị trực quan với color coding

### ⚠️ Hạn chế:
- Azure không trả về syllable data khi phát âm sai hoàn toàn
- Cần internet connection để hoạt động
- Chi phí API call

### 🔮 Cải tiến tương lai:
- Thêm dictionary âm tiết chuẩn để so sánh khi Azure thiếu data
- Lưu lịch sử phát âm để theo dõi tiến bộ
- Thêm gợi ý cải thiện cụ thể cho từng âm
- Hỗ trợ nhiều giọng (US, UK, AU)

---

**Phiên bản tài liệu:** 1.0  
**Tác giả:** Trung Kien Silly  
**Ngày:** 14/10/2025
