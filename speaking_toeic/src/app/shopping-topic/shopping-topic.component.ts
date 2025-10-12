import { Component, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AzureSpeechService } from '../services/azure-speech.service';

// Cấu trúc cho bài học nói - thêm thuộc tính 'vowel' và 'topic'
export interface SpeakingLesson {
  id: string;
  english: string;
  vietnamese: string;
  phonetic: string;
  category: string;
  vowel: string; // ví dụ: 'i', 'ee', 'a'
  topic?: string; // ví dụ: 'school', 'hobby', 'food'
}

// Cấu trúc cho điểm số - đánh giá kết quả
export interface SpeakingScore {
  accuracy: number;
  completeness: number;
  fluency: number;
  naturalness: number;
  overall: number;
}

export interface PhonemeDetail {
  phoneme: string;
  score: number;
  color: string;
  hasData: boolean;
}

export interface SyllableDetail {
  syllable: string;
  score: number;
  accuracyScore: number;
}

@Component({
  selector: 'app-shopping-topic',
  imports: [CommonModule],
  templateUrl: './shopping-topic.component.html',
  styleUrls: ['./shopping-topic.component.scss']
})
export class ShoppingTopicComponent {
  // Quản lý trạng thái - theo dõi trạng thái hiện tại
  currentLessonIndex = signal(0);
  activeTab = signal('flashcard');
  isRecording = signal(false);
  isProcessing = signal(false);
  showScore = signal(false);
  isPlayingUS = signal(false);
  isPlayingUK = signal(false);
  showScoreDetails = signal(false);

  // Logo paths
  logoPath = 'assets/img/logo.png';
  logoTextPath = 'assets/img/VN-2-1024x512.png';
  showFallback = false;
  showMicFallback = true; // Tạm thời enable fallback
  activeVowel = signal('all'); // Mặc định là 'all' để hiển thị tất cả
  activeTopic = signal<string | null>('shopping'); // Topic hiện tại (school, hobby, etc.)

  // All lessons for the current topic
  lessons: SpeakingLesson[] = [];
  // All lessons without filter (backup)
  allTopicLessons: SpeakingLesson[] = [];
  // Lessons to be displayed in the sidebar (only 5)
  sidebarLessons: SpeakingLesson[] = [];

  // Gán nguyên âm và topic cho mỗi từ - 30 từ/chủ đề
  private allLessons: SpeakingLesson[] = [
    // ===== TOPIC: SHOPPING (Mua sắm) - 30 từ =====
    // Nguyên âm -ee (5 từ)
    { id: 'sh1', english: 'free', vietnamese: 'miễn phí', phonetic: '[friː]', category: 'Shopping', vowel: 'ee', topic: 'shopping' },
    { id: 'sh2', english: 'fee', vietnamese: 'phí', phonetic: '[fiː]', category: 'Shopping', vowel: 'ee', topic: 'shopping' },
    { id: 'sh3', english: 'agree', vietnamese: 'đồng ý', phonetic: '[əˈɡriː]', category: 'Shopping', vowel: 'ee', topic: 'shopping' },
    { id: 'sh4', english: 'guarantee', vietnamese: 'đảm bảo', phonetic: '[ˌɡærənˈtiː]', category: 'Shopping', vowel: 'ee', topic: 'shopping' },
    { id: 'sh5', english: 'employee', vietnamese: 'nhân viên', phonetic: '[ˌemplɔɪˈiː]', category: 'Shopping', vowel: 'ee', topic: 'shopping' },
    // Nguyên âm -i (5 từ)
    { id: 'sh6', english: 'discount', vietnamese: 'giảm giá', phonetic: '[ˈdɪskaʊnt]', category: 'Shopping', vowel: 'i', topic: 'shopping' },
    { id: 'sh7', english: 'gift', vietnamese: 'quà tặng', phonetic: '[ɡɪft]', category: 'Shopping', vowel: 'i', topic: 'shopping' },
    { id: 'sh8', english: 'list', vietnamese: 'danh sách', phonetic: '[lɪst]', category: 'Shopping', vowel: 'i', topic: 'shopping' },
    { id: 'sh9', english: 'visit', vietnamese: 'ghé thăm', phonetic: '[ˈvɪzɪt]', category: 'Shopping', vowel: 'i', topic: 'shopping' },
    { id: 'sh10', english: 'delivery', vietnamese: 'giao hàng', phonetic: '[dɪˈlɪvəri]', category: 'Shopping', vowel: 'i', topic: 'shopping' },
    // Nguyên âm -a (5 từ)
    { id: 'sh11', english: 'cash', vietnamese: 'tiền mặt', phonetic: '[kæʃ]', category: 'Shopping', vowel: 'a', topic: 'shopping' },
    { id: 'sh12', english: 'bag', vietnamese: 'túi', phonetic: '[bæɡ]', category: 'Shopping', vowel: 'a', topic: 'shopping' },
    { id: 'sh13', english: 'brand', vietnamese: 'thương hiệu', phonetic: '[brænd]', category: 'Shopping', vowel: 'a', topic: 'shopping' },
    { id: 'sh14', english: 'fashion', vietnamese: 'thời trang', phonetic: '[ˈfæʃn]', category: 'Shopping', vowel: 'a', topic: 'shopping' },
    { id: 'sh15', english: 'package', vietnamese: 'gói hàng', phonetic: '[ˈpækɪdʒ]', category: 'Shopping', vowel: 'a', topic: 'shopping' },
    // Nguyên âm -o (5 từ)
    { id: 'sh16', english: 'shopping', vietnamese: 'mua sắm', phonetic: '[ˈʃɒpɪŋ]', category: 'Shopping', vowel: 'o', topic: 'shopping' },
    { id: 'sh17', english: 'product', vietnamese: 'sản phẩm', phonetic: '[ˈprɒdʌkt]', category: 'Shopping', vowel: 'o', topic: 'shopping' },
    { id: 'sh18', english: 'option', vietnamese: 'lựa chọn', phonetic: '[ˈɒpʃən]', category: 'Shopping', vowel: 'o', topic: 'shopping' },
    { id: 'sh19', english: 'cost', vietnamese: 'chi phí', phonetic: '[kɒst]', category: 'Shopping', vowel: 'o', topic: 'shopping' },
    { id: 'sh20', english: 'shop', vietnamese: 'cửa hàng', phonetic: '[ʃɒp]', category: 'Shopping', vowel: 'o', topic: 'shopping' },
    // Phụ âm -p (5 từ)
    { id: 'sh21', english: 'price', vietnamese: 'giá cả', phonetic: '[praɪs]', category: 'Shopping', vowel: 'p', topic: 'shopping' },
    { id: 'sh22', english: 'purchase', vietnamese: 'mua hàng', phonetic: '[ˈpɜːtʃəs]', category: 'Shopping', vowel: 'p', topic: 'shopping' },
    { id: 'sh23', english: 'payment', vietnamese: 'thanh toán', phonetic: '[ˈpeɪmənt]', category: 'Shopping', vowel: 'p', topic: 'shopping' },
    { id: 'sh24', english: 'promotion', vietnamese: 'khuyến mãi', phonetic: '[prəˈməʊʃn]', category: 'Shopping', vowel: 'p', topic: 'shopping' },
    { id: 'sh25', english: 'popular', vietnamese: 'phổ biến', phonetic: '[ˈpɒpjələ]', category: 'Shopping', vowel: 'p', topic: 'shopping' },
    // Phụ âm -b (5 từ)
    { id: 'sh26', english: 'buy', vietnamese: 'mua', phonetic: '[baɪ]', category: 'Shopping', vowel: 'b', topic: 'shopping' },
    { id: 'sh27', english: 'budget', vietnamese: 'ngân sách', phonetic: '[ˈbʌdʒɪt]', category: 'Shopping', vowel: 'b', topic: 'shopping' },
    { id: 'sh28', english: 'bargain', vietnamese: 'mặc cả', phonetic: '[ˈbɑːɡən]', category: 'Shopping', vowel: 'b', topic: 'shopping' },
    { id: 'sh29', english: 'basket', vietnamese: 'giỏ hàng', phonetic: '[ˈbɑːskɪt]', category: 'Shopping', vowel: 'b', topic: 'shopping' },
    { id: 'sh30', english: 'bill', vietnamese: 'hóa đơn', phonetic: '[bɪl]', category: 'Shopping', vowel: 'b', topic: 'shopping' }
  ];

  currentScore: SpeakingScore = {
    accuracy: 60,
    completeness: 90,
    fluency: 70,
    naturalness: 55,
    overall: 68
  };

  // Lưu trữ kết quả chi tiết từ Azure
  azureRawResult: any = null;
  syllableDetails: SyllableDetail[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private azureSpeech: AzureSpeechService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Load dữ liệu shopping ngay lập tức
    this.loadTopicData('shopping');
    this.initializeSpeechSynthesis();
  }

  private initializeSpeechSynthesis() {
    // Chỉ chạy trên browser, không chạy trên server
    if (isPlatformBrowser(this.platformId) && 'speechSynthesis' in window) {
      // Load voices ngay lập tức nếu có sẵn
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices loaded:', voices.length);
      } else {
        // Nếu chưa có voices, đợi event voiceschanged
        speechSynthesis.addEventListener('voiceschanged', () => {
          const loadedVoices = speechSynthesis.getVoices();
          console.log('Voices loaded after event:', loadedVoices.length);
        });
      }
    }
  }

  getCurrentLesson(): SpeakingLesson {
    return this.lessons[this.currentLessonIndex()];
  }

  async startRecording() {
    if (this.isRecording() || this.isProcessing()) {
      return;
    }
    const reference = this.getCurrentLesson()?.english;
    if (!reference) return;

    this.isRecording.set(true);
    this.showScore.set(false);

    // Delay nhỏ để Azure khởi tạo mic
    await new Promise(resolve => setTimeout(resolve, 500));
    this.isProcessing.set(true);
    console.log('🎤 Azure đã sẵn sàng - Hãy nói từ:', reference);

    try {
      const result = await this.azureSpeech.assessPronunciation(reference, 5000);
      console.log('✅ Nhận được kết quả từ Azure:', result);

      // Lưu raw result để parse syllables
      this.azureRawResult = result.raw;
      this.parseSyllableDetails(result.raw);

      this.currentScore = {
        accuracy: Math.round(result.accuracy),
        completeness: Math.round(result.completeness),
        fluency: Math.round(result.fluency),
        naturalness: 60,
        overall: Math.round(result.overall)
      };
      this.showScore.set(true);
    } catch (err) {
      console.error('❌ Lỗi chấm điểm Azure:', err);
      // Chỉ hiện alert nếu thực sự là lỗi nghiêm trọng, không phải NoMatch
      if (err instanceof Error && !err.message.includes('NoMatch')) {
        alert('Không nhận dạng được giọng nói hoặc hết thời gian chờ. Vui lòng thử lại.');
      }
    } finally {
      this.isRecording.set(false);
      this.isProcessing.set(false);
    }
  }

  async playAudio(type: 'uk' | 'us') {
    const word = this.getCurrentLesson().english;
    console.log(`Playing ${type} audio via Azure TTS for:`, word);
    this.isPlayingUS.set(type === 'us');
    this.isPlayingUK.set(type === 'uk');
    try {
      await this.azureSpeech.speak(word, type);
    } catch (e) {
      console.error('Lỗi TTS Azure:', e);
      alert('Không phát âm được với Azure TTS. Vui lòng thử lại.');
    } finally {
      this.isPlayingUS.set(false);
      this.isPlayingUK.set(false);
    }
  }

  navigateLesson(direction: 'prev' | 'next') {
    const currentIndex = this.currentLessonIndex();
    if (direction === 'prev' && currentIndex > 0) {
      this.currentLessonIndex.set(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < this.lessons.length - 1) {
      this.currentLessonIndex.set(currentIndex + 1);
    }
    this.showScore.set(false);
  }

  refreshLesson() {
    this.showScore.set(false);
    // Reset any practice state
  }

  goBack() {
    this.router.navigate(['/']);
  }

  onImageError(event: any, type: string) {
    console.log(`Image error for ${type}:`, event);
    this.showFallback = true;
  }

  onMicImageError(event: any) {
    console.log('Mic image error:', event);
    this.showMicFallback = true;
  }

  toggleScoreDetails() {
    this.showScoreDetails.set(!this.showScoreDetails());
  }

  parseSyllableDetails(rawResult: any) {
    this.syllableDetails = [];

    if (!rawResult || !rawResult.NBest || !rawResult.NBest[0]) {
      console.warn('Không có dữ liệu syllable từ Azure');
      return;
    }

    const words = rawResult.NBest[0].Words;
    if (!words || words.length === 0) {
      console.warn('Không có Words trong kết quả');
      return;
    }

    // Lấy syllables từ word đầu tiên
    const word = words[0];
    const syllables = word.Syllables || [];

    console.log('Syllables từ Azure:', syllables);

    this.syllableDetails = syllables.map((syl: any) => ({
      syllable: syl.Syllable || '',
      score: Math.round(syl.PronunciationAssessment?.AccuracyScore || 0),
      accuracyScore: syl.PronunciationAssessment?.AccuracyScore || 0
    }));
  }

  getPhonemeBreakdown(): PhonemeDetail[] {
    // Nếu có dữ liệu syllable từ Azure, dùng nó
    if (this.syllableDetails && this.syllableDetails.length > 0) {
      return this.syllableDetails.map(syl => ({
        phoneme: syl.syllable,
        score: syl.score,
        color: this.getScoreColor(syl.score),
        hasData: true
      }));
    }

    // Fallback: không có dữ liệu
    const word = this.getCurrentLesson()?.english || '';
    return [
      { phoneme: word, score: 0, color: 'poor', hasData: false }
    ];
  }

  hasUndetectedPhonemes(): boolean {
    return this.getPhonemeBreakdown().some(p => !p.hasData);
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'good';
    if (score >= 60) return 'medium';
    return 'poor';
  }

  // Load dữ liệu theo topic ID
  loadTopicData(topicId: string) {
    console.log(`Loading vocabulary for topic: ${topicId}`);

    // Lọc từ vựng theo topic
    const filtered = this.allLessons.filter(lesson => lesson.topic === topicId);

    if (filtered.length > 0) {
      this.activeTopic.set(topicId);
      this.allTopicLessons = filtered; // Lưu tất cả từ của topic
      this.lessons = filtered; // Hiển thị tất cả ban đầu
      this.sidebarLessons = filtered.slice(0, 5);
      this.currentLessonIndex.set(0);
      this.activeVowel.set('all'); // Reset về 'all'
      this.showScore.set(false);
      console.log(`Loaded ${filtered.length} words for topic '${topicId}'`);
    } else {
      console.warn(`No vocabulary found for topic '${topicId}', loading default`);
      this.activeTopic.set(null);
      // Fallback: load theo vowel nếu không tìm thấy topic
      this.filterByVowel(this.activeVowel());
    }
  }

  // Lọc từ vựng theo nguyên âm
  filterByVowel(vowel: string) {
    console.log(`Filtering by vowel: ${vowel}`);
    this.activeVowel.set(vowel);

    if (vowel === 'all') {
      // Hiển thị tất cả
      this.lessons = this.allTopicLessons;
    } else {
      // Lọc theo nguyên âm
      this.lessons = this.allTopicLessons.filter(lesson => lesson.vowel === vowel);
    }

    this.sidebarLessons = this.lessons.slice(0, 5);
    this.currentLessonIndex.set(0);
    this.showScore.set(false);
  }

  // Lấy danh sách nguyên âm có sẵn trong topic hiện tại
  getAvailableVowels(): Array<{code: string, label: string, count: number}> {
    const vowelMap: {[key: string]: string} = {
      'ee': 'Nguyên âm -ee',
      'i': 'Nguyên âm -i',
      'a': 'Nguyên âm -a',
      'o': 'Nguyên âm -o',
      'p': 'Phụ âm -p',
      'b': 'Phụ âm -b'
    };

    // Đếm số lượng từ theo từng nguyên âm
    const vowelCounts: {[key: string]: number} = {};
    this.allTopicLessons.forEach(lesson => {
      vowelCounts[lesson.vowel] = (vowelCounts[lesson.vowel] || 0) + 1;
    });

    // Tạo danh sách kết quả
    return Object.keys(vowelCounts).map(code => ({
      code,
      label: vowelMap[code] || code,
      count: vowelCounts[code]
    }));
  }

  // Lấy tên chủ đề hiện tại
  getCurrentTopicName(): string {
    const topicNames: { [key: string]: string } = {
      'school': 'Trường học',
      'hobby': 'Sở thích',
      'food': 'Đồ ăn',
      'shopping': 'Mua sắm',
      'environment': 'Môi trường',
      'work': 'Công việc'
    };

    const topic = this.activeTopic();
    return topic ? topicNames[topic] || topic : 'Luyện phát âm';
  }
}
