# LOGIC CHẤM ĐIỂM PENALTY - HỆ THỐNG PHÁT ÂM TOEIC

**Dự án:** TOEIC Speaking Test Website  
**Ngày tạo:** 14/10/2025  
**Mục đích:** Giải thích chi tiết logic penalty cho từ nhiều âm tiết

---

## MỤC LỤC

1. [Tổng Quan](#1-tổng-quan)
2. [Logic Phân Loại Âm Tiết](#2-logic-phân-loại-âm-tiết)
3. [Công Thức Tính Penalty](#3-công-thức-tính-penalty)
4. [Ví Dụ Thực Tế: Từ 3 Âm Tiết](#4-ví-dụ-thực-tế-từ-3-âm-tiết)
5. [Điều Chỉnh Các Loại Điểm](#5-điều-chỉnh-các-loại-điểm)
6. [Các Trường Hợp Đặc Biệt](#6-các-trường-hợp-đặc-biệt)
7. [Bảng Tổng Hợp](#7-bảng-tổng-hợp)

---

## 1. TỔNG QUAN

### 1.1. Mục Đích
Hệ thống penalty được thiết kế để:
- **Phạt chính xác** khi người dùng phát âm sai hoặc bỏ sót âm tiết
- **Công bằng** trong việc đánh giá từng loại lỗi
- **Khuyến khích** cải thiện từng âm tiết cụ thể

### 1.2. Nguyên Tắc
- **Mỗi âm tiết** có giá trị bằng nhau: `100% / số âm tiết`
- **Missing syllable** (điểm 0): Penalty toàn bộ giá trị âm đó
- **Bad syllable** (điểm < 60): Penalty toàn bộ giá trị âm đó
- **Good syllable** (điểm ≥ 60): KHÔNG penalty

### 1.3. Phạm Vi Áp Dụng
- ✅ **Từ nhiều âm tiết** (≥ 2 syllables): Áp dụng penalty system
- ❌ **Từ một âm tiết** (1 syllable): KHÔNG áp dụng penalty, lấy điểm syllable trực tiếp

---

## 2. LOGIC PHÂN LOẠI ÂM TIẾT

### 2.1. Code Implementation

```typescript
let missingSyllableCount = 0; // Âm KHÔNG được nhận dạng
let badSyllableCount = 0;     // Âm YẾU (phát âm không tốt)
let goodSyllableCount = 0;    // Âm TỐT

syllables.forEach((syl: any) => {
  const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
  
  if (sylScore === 0) {
    // Loại 1: MISSING - Azure không nhận dạng được
    missingSyllableCount++;
    console.error(`❌ Âm tiết "${syl.Syllable}" KHÔNG được nhận dạng: 0 điểm`);
  } else if (sylScore < 60) {
    // Loại 2: BAD - Phát âm yếu
    badSyllableCount++;
    console.log(`⚠️ Âm tiết "${syl.Syllable}" có điểm thấp: ${sylScore}`);
  } else {
    // Loại 3: GOOD - Phát âm tốt
    goodSyllableCount++;
    console.log(`✅ Âm tiết "${syl.Syllable}" phát âm tốt: ${sylScore}`);
  }
});
```

### 2.2. Bảng Phân Loại

| Loại | Điều Kiện | Ý Nghĩa | Penalty |
|------|-----------|---------|---------|
| **Missing** | Score = 0 | Không nhận dạng được, bỏ sót hoàn toàn | ✅ CÓ |
| **Bad** | 0 < Score < 60 | Phát âm yếu, cần cải thiện | ✅ CÓ |
| **Good** | Score ≥ 60 | Phát âm chấp nhận được | ❌ KHÔNG |

### 2.3. Ví Dụ Phân Loại

#### Từ "fantastic" (3 âm tiết):
```
Input từ Azure:
{
  "Syllables": [
    { "Syllable": "faen", "AccuracyScore": 0 },    // Missing ❌
    { "Syllable": "taes", "AccuracyScore": 65 },   // Good ✅
    { "Syllable": "tihk", "AccuracyScore": 50 }    // Bad ⚠️
  ]
}

Kết quả phân loại:
- missingSyllableCount = 1 (faen)
- badSyllableCount = 1 (tihk)
- goodSyllableCount = 1 (taes)
```

---

## 3. CÔNG THỨC TÍNH PENALTY

### 3.1. Công Thức Cơ Bản

```typescript
// Bước 1: Tính giá trị mỗi âm tiết
percentPerSyllable = 100 / totalSyllables

// Bước 2: Tính penalty cho từng loại
missingPenalty = missingSyllableCount × percentPerSyllable
badPenalty = badSyllableCount × percentPerSyllable
totalPenalty = missingPenalty + badPenalty

// Bước 3: Tính Overall Score
baseScore = min(PronScore, AccuracyScore)
overall = max(0, round(baseScore - totalPenalty))
```

### 3.2. Giải Thích Từng Bước

#### **Bước 1: Tính giá trị mỗi âm tiết**
```
Ví dụ: "fantastic" có 3 âm tiết
→ percentPerSyllable = 100 / 3 = 33.33%

Nghĩa là: Mỗi âm tiết chiếm 33.33% giá trị tổng thể
```

#### **Bước 2: Tính penalty**
```
Missing: 1 âm × 33.33% = 33.33% penalty
Bad: 1 âm × 33.33% = 33.33% penalty
Total: 33.33% + 33.33% = 66.66% penalty

→ Tổng cộng trừ đi 66.66% điểm base
```

#### **Bước 3: Chọn base score và tính final**
```
Azure trả về:
- AccuracyScore: 61
- PronScore: 84

baseScore = min(61, 84) = 61

overall = max(0, 61 - 66.66)
        = max(0, -5.66)
        = 0 điểm
```

### 3.3. Code Implementation

```typescript
// Tính phần trăm mỗi âm tiết
const percentPerSyllable = 100 / totalSyllables;

// Tính penalty
const missingPenalty = missingSyllableCount * percentPerSyllable;
const badPenalty = badSyllableCount * percentPerSyllable;
const totalPenalty = missingPenalty + badPenalty;

// Chọn base score
const baseScore = pronScore < accuracy ? pronScore : accuracy;

// Điểm cuối
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
  finalScore: overall
});
```

---

## 4. VÍ DỤ THỰC TÊ: TỪ 3 ÂM TIẾT

### 4.1. Ví Dụ 1: "fantastic" - Kết Hợp Missing + Bad

#### **Input từ Azure:**
```json
{
  "PronunciationAssessment": {
    "AccuracyScore": 61,
    "CompletenessScore": 100,
    "FluencyScore": 100,
    "PronScore": 84
  },
  "Words": [{
    "Syllables": [
      { "Syllable": "faen", "AccuracyScore": 0 },
      { "Syllable": "taes", "AccuracyScore": 65 },
      { "Syllable": "tihk", "AccuracyScore": 50 }
    ]
  }]
}
```

#### **Bước 1: Phân loại**
```
faen: 0 điểm   → Missing ❌
taes: 65 điểm  → Good ✅
tihk: 50 điểm  → Bad ⚠️

missingSyllableCount = 1
badSyllableCount = 1
goodSyllableCount = 1
```

#### **Bước 2: Tính penalty**
```
percentPerSyllable = 100 / 3 = 33.33%

missingPenalty = 1 × 33.33% = 33.33%
badPenalty = 1 × 33.33% = 33.33%
totalPenalty = 66.66%
```

#### **Bước 3: Tính điểm**
```
baseScore = min(84, 61) = 61
overall = max(0, 61 - 66.66) = 0
```

#### **Kết quả cuối cùng:**
```
✅ Accuracy: 61 (không đổi)
✅ Completeness: 67 (100 - 33.33)
✅ Fluency: 83 (100 - 16.67)
✅ Overall: 0
```

---

### 4.2. Ví Dụ 2: "beautiful" - Phát Âm Tốt Toàn Bộ

#### **Input từ Azure:**
```json
{
  "PronunciationAssessment": {
    "AccuracyScore": 92,
    "CompletenessScore": 100,
    "FluencyScore": 100,
    "PronScore": 95
  },
  "Words": [{
    "Syllables": [
      { "Syllable": "bju:", "AccuracyScore": 90 },
      { "Syllable": "tɪ", "AccuracyScore": 88 },
      { "Syllable": "fəl", "AccuracyScore": 95 }
    ]
  }]
}
```

#### **Bước 1: Phân loại**
```
bju: 90 điểm   → Good ✅
tɪ: 88 điểm    → Good ✅
fəl: 95 điểm   → Good ✅

missingSyllableCount = 0
badSyllableCount = 0
goodSyllableCount = 3
```

#### **Bước 2: Tính penalty**
```
percentPerSyllable = 100 / 3 = 33.33%

missingPenalty = 0 × 33.33% = 0%
badPenalty = 0 × 33.33% = 0%
totalPenalty = 0%
```

#### **Bước 3: Tính điểm**
```
baseScore = min(95, 92) = 92
overall = max(0, 92 - 0) = 92
```

#### **Kết quả cuối cùng:**
```
✅ Accuracy: 92 (không đổi)
✅ Completeness: 100 (không đổi)
✅ Fluency: 100 (không đổi)
✅ Overall: 92 (KHÔNG penalty)
```

---

### 4.3. Ví Dụ 3: "computer" - Thiếu 2 Âm

#### **Input từ Azure:**
```json
{
  "PronunciationAssessment": {
    "AccuracyScore": 45,
    "CompletenessScore": 33,
    "FluencyScore": 40,
    "PronScore": 40
  },
  "Words": [{
    "Syllables": [
      { "Syllable": "kəm", "AccuracyScore": 0 },
      { "Syllable": "pju:", "AccuracyScore": 0 },
      { "Syllable": "tə", "AccuracyScore": 75 }
    ]
  }]
}
```

#### **Bước 1: Phân loại**
```
kəm: 0 điểm    → Missing ❌
pju: 0 điểm    → Missing ❌
tə: 75 điểm    → Good ✅

missingSyllableCount = 2
badSyllableCount = 0
goodSyllableCount = 1
```

#### **Bước 2: Tính penalty**
```
percentPerSyllable = 100 / 3 = 33.33%

missingPenalty = 2 × 33.33% = 66.66%
badPenalty = 0 × 33.33% = 0%
totalPenalty = 66.66%
```

#### **Bước 3: Tính điểm**
```
baseScore = min(40, 45) = 40
overall = max(0, 40 - 66.66) = 0
```

#### **Kết quả cuối cùng:**
```
✅ Accuracy: 45 (không đổi)
✅ Completeness: 0 (33 - 66.66 → capped at 0)
✅ Fluency: 7 (40 - 33.33)
✅ Overall: 0
```

---

### 4.4. Ví Dụ 4: "important" - Tất Cả Âm Yếu

#### **Input từ Azure:**
```json
{
  "PronunciationAssessment": {
    "AccuracyScore": 52,
    "CompletenessScore": 100,
    "FluencyScore": 100,
    "PronScore": 55
  },
  "Words": [{
    "Syllables": [
      { "Syllable": "ɪm", "AccuracyScore": 55 },
      { "Syllable": "pɔ:", "AccuracyScore": 50 },
      { "Syllable": "tənt", "AccuracyScore": 52 }
    ]
  }]
}
```

#### **Bước 1: Phân loại**
```
ɪm: 55 điểm     → Bad ⚠️
pɔ: 50 điểm     → Bad ⚠️
tənt: 52 điểm   → Bad ⚠️

missingSyllableCount = 0
badSyllableCount = 3
goodSyllableCount = 0
```

#### **Bước 2: Tính penalty**
```
percentPerSyllable = 100 / 3 = 33.33%

missingPenalty = 0 × 33.33% = 0%
badPenalty = 3 × 33.33% = 100%
totalPenalty = 100%
```

#### **Bước 3: Tính điểm**
```
baseScore = min(55, 52) = 52
overall = max(0, 52 - 100) = 0
```

#### **Kết quả cuối cùng:**
```
✅ Accuracy: 52 (không đổi)
✅ Completeness: 100 (không có missing)
✅ Fluency: 100 (không có missing)
✅ Overall: 0 (penalty 100%)
```

---

## 5. ĐIỀU CHỈNH CÁC LOẠI ĐIỂM

### 5.1. Accuracy Score
```typescript
// KHÔNG điều chỉnh - giữ nguyên giá trị Azure
accuracy = pa?.AccuracyScore ?? 0;
```

**Lý do:** Accuracy là điểm tổng thể từ Azure, phản ánh độ chính xác phát âm cả từ.

---

### 5.2. Completeness Score

#### **Công thức:**
```typescript
adjustedCompleteness = max(0, completeness - missingPenalty)
```

#### **Giải thích:**
- Completeness đo lường "độ đầy đủ" khi phát âm
- Nếu có âm bị thiếu → giảm Completeness theo tỷ lệ

#### **Ví dụ:**
```
Từ "fantastic" (3 âm):
- Missing: 1 âm (faen)
- Azure Completeness: 100

percentPerSyllable = 100 / 3 = 33.33%
missingPenalty = 1 × 33.33% = 33.33%

adjustedCompleteness = max(0, 100 - 33.33) = 67
```

#### **Code:**
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

---

### 5.3. Fluency Score

#### **Công thức:**
```typescript
// Penalty 1: Missing syllables (30% của tỷ lệ thiếu)
missingFlPenalty = fluency × (missingSyllables / total) × 0.3

// Penalty 2: Timing pauses (5 điểm mỗi lần dừng)
timingPenalty = timingPausesCount × 5

// Total
adjustedFluency = max(0, fluency - missingFlPenalty - timingPenalty)
```

#### **Giải thích:**
- **Missing penalty**: Nếu bỏ sót âm → nói ngắt quãng → giảm fluency
- **Timing penalty**: Nếu dừng quá lâu giữa các âm → không trôi chảy → giảm fluency

#### **Ví dụ:**
```
Từ "fantastic" (3 âm):
- Missing: 1 âm
- Timing pauses: 1 lần
- Azure Fluency: 100

Missing Penalty:
  missingRatio = 1 / 3 = 0.333
  missingFlPenalty = 100 × 0.333 × 0.3 = 10 điểm

Timing Penalty:
  timingPenalty = 1 × 5 = 5 điểm

adjustedFluency = max(0, 100 - 10 - 5) = 85
```

#### **Code:**
```typescript
let adjustedFluency = fluency;

// Penalty 1: Missing syllables
if (missingSyllableCount > 0 && adjustedFluency > 0) {
  const missingRatio = missingSyllableCount / totalSyllables;
  const flMissingPenalty = Math.round(adjustedFluency * missingRatio * 0.3);
  const beforePenalty = adjustedFluency;
  adjustedFluency = Math.max(0, adjustedFluency - flMissingPenalty);
  
  console.warn(
    `⚠️ Fluency penalty (missing): ${beforePenalty} -> ${adjustedFluency} ` +
    `(thiếu ${missingSyllableCount}/${totalSyllables} âm, penalty: ${flMissingPenalty})`
  );
}

// Penalty 2: Timing pauses
if (timingPausesCount > 0 && adjustedFluency > 0) {
  const timingPenalty = timingPausesCount * 5;
  const beforePenalty = adjustedFluency;
  adjustedFluency = Math.max(0, adjustedFluency - timingPenalty);
  
  console.warn(
    `⏱️ Fluency penalty (timing): ${beforePenalty} -> ${adjustedFluency} ` +
    `(${timingPausesCount} khoảng dừng × 5 điểm)`
  );
}
```

---

### 5.4. Overall Score

#### **Công thức:**
```typescript
baseScore = min(PronScore, AccuracyScore)
overall = max(0, round(baseScore - totalPenalty))
```

#### **Giải thích:**
- **Base score**: Chọn điểm THẤP hơn giữa PronScore và Accuracy
- **Total penalty**: Tổng penalty từ missing + bad syllables
- **Final**: Base score trừ đi penalty, tối thiểu là 0

#### **Ví dụ:**
```
Azure scores:
- AccuracyScore: 61
- PronScore: 84

baseScore = min(84, 61) = 61

Penalty:
- Missing: 33.33%
- Bad: 33.33%
- Total: 66.66%

overall = max(0, 61 - 66.66) = 0
```

---

## 6. CÁC TRƯỜNG HỢP ĐẶC BIỆT

### 6.1. Completeness = 0 Nhưng Có Syllable Data

**Tình huống:** Người dùng chỉ nói một phần từ (VD: "tic" thay vì "fantastic")

```typescript
if (completeness === 0 && syllables.length > 0) {
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
```

**Ví dụ:**
```
User nói: "tic" (chỉ 1 âm cuối của "fantastic")

Azure trả về:
- Syllable 1: "tihk" - 60 điểm
- Completeness: 0

avgScore = 60
overall = 60 × 0.5 = 30 điểm
```

---

### 6.2. Completeness = 0 Và Không Có Syllable Data

**Tình huống:** Azure hoàn toàn không nhận dạng được

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

---

### 6.3. Timing Pauses (Khoảng Dừng Giữa Các Âm)

**Công thức kiểm tra:**
```typescript
const MAX_GAP_MS = 50; // 50 milliseconds
const TIMING_PENALTY_PER_PAUSE = 5;

for (let i = 0; i < syllables.length - 1; i++) {
  const currentSyl = syllables[i];
  const nextSyl = syllables[i + 1];
  
  // Offset và Duration tính bằng 100-nanosecond
  const currentEnd = (currentSyl.Offset + currentSyl.Duration) / 10000; // ms
  const nextStart = nextSyl.Offset / 10000; // ms
  const gap = nextStart - currentEnd;
  
  if (gap > MAX_GAP_MS) {
    timingPausesCount++;
    console.warn(
      `⏱️ Khoảng dừng giữa "${currentSyl.Syllable}" và "${nextSyl.Syllable}": ` +
      `${gap.toFixed(1)}ms (> ${MAX_GAP_MS}ms)`
    );
  }
}
```

**Ví dụ:**
```
Syllable timing:
- "faen": 0-210ms
- "taes": 590-820ms  → Gap = 590 - 210 = 380ms > 50ms ❌
- "tihk": 830-1050ms → Gap = 830 - 820 = 10ms < 50ms ✅

timingPausesCount = 1
timingPenalty = 1 × 5 = 5 điểm
```

---

## 7. BẢNG TỔNG HỢP

### 7.1. Công Thức Tổng Quát

```typescript
// Phân loại âm tiết
forEach syllable:
  if (score === 0) → Missing
  else if (score < 60) → Bad
  else → Good

// Tính penalty
percentPerSyllable = 100 / totalSyllables
missingPenalty = missing × percentPerSyllable
badPenalty = bad × percentPerSyllable
totalPenalty = missingPenalty + badPenalty

// Điều chỉnh điểm
Accuracy: KHÔNG đổi
Completeness: max(0, old - missingPenalty)
Fluency: max(0, old - missingFlPenalty - timingPenalty)
Overall: max(0, baseScore - totalPenalty)
```

### 7.2. Bảng So Sánh Các Trường Hợp

| Tình Huống | Missing | Bad | Good | Total Penalty | Overall |
|------------|---------|-----|------|---------------|---------|
| **Hoàn hảo** | 0 | 0 | 3 | 0% | = baseScore |
| **1 Missing** | 1 | 0 | 2 | 33.33% | baseScore - 33.33% |
| **1 Bad** | 0 | 1 | 2 | 33.33% | baseScore - 33.33% |
| **1M + 1B** | 1 | 1 | 1 | 66.66% | baseScore - 66.66% |
| **2 Missing** | 2 | 0 | 1 | 66.66% | baseScore - 66.66% |
| **3 Bad** | 0 | 3 | 0 | 100% | 0 |

### 7.3. Bảng Điểm Mẫu

#### Từ "fantastic" - Base Score = 61

| Missing | Bad | Good | Penalty | Overall | Completeness | Fluency |
|---------|-----|------|---------|---------|--------------|---------|
| 0 | 0 | 3 | 0% | **61** | 100 | 100 |
| 1 | 0 | 2 | 33% | **41** | 67 | 90 |
| 0 | 1 | 2 | 33% | **41** | 100 | 100 |
| 1 | 1 | 1 | 67% | **0** | 67 | 85 |
| 2 | 0 | 1 | 67% | **0** | 33 | 77 |
| 0 | 2 | 1 | 67% | **0** | 100 | 100 |
| 3 | 0 | 0 | 100% | **0** | 0 | 50 |

---

## KẾT LUẬN

### ✅ Ưu Điểm Của Hệ Thống

1. **Công bằng**: Mỗi âm tiết có giá trị bằng nhau
2. **Chính xác**: Phân biệt rõ missing vs bad syllables
3. **Khuyến khích**: Người dùng biết chính xác âm nào cần luyện
4. **Minh bạch**: Logic rõ ràng, dễ debug qua console logs

### ⚠️ Lưu Ý

1. **Base score**: Luôn chọn MIN(PronScore, Accuracy) để an toàn
2. **Penalty cap**: Overall không bao giờ < 0
3. **Fluency penalty**: Nhẹ hơn (30% thay vì 100%) vì timing không ảnh hưởng lớn
4. **Timing threshold**: 50ms có thể điều chỉnh tùy độ khó

### 🔮 Cải Tiến Tương Lai

1. **Dynamic threshold**: Điều chỉnh ngưỡng 60 điểm theo level
2. **Weighted penalty**: Âm quan trọng (stressed syllable) có penalty cao hơn
3. **Progressive penalty**: Penalty giảm dần khi người dùng cải thiện
4. **Context-aware**: Xem xét ngữ cảnh câu (nếu mở rộng lên câu/đoạn)

---

**Phiên bản tài liệu:** 1.0  
**Tác giả:** Development Team  
**Cập nhật cuối:** 14/10/2025
