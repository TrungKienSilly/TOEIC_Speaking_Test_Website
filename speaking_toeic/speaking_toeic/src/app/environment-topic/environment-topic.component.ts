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
  selector: 'app-environment-topic',
  imports: [CommonModule],
  templateUrl: './environment-topic.component.html',
  styleUrls: ['./environment-topic.component.scss']
})
export class EnvironmentTopicComponent {
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
  activeTopic = signal<string | null>('environment'); // Topic hiện tại (school, hobby, etc.)

  // All lessons for the current topic
  lessons: SpeakingLesson[] = [];
  // All lessons without filter (backup)
  allTopicLessons: SpeakingLesson[] = [];
  // Lessons to be displayed in the sidebar (only 5)
  sidebarLessons: SpeakingLesson[] = [];

  // Gán nguyên âm và topic cho mỗi từ - 30 từ/chủ đề
  private allLessons: SpeakingLesson[] = [
    // ===== TOPIC: ENVIRONMENT (Môi trường) - 30 từ =====
    // Nguyên âm -ee (5 từ)
    { id: 'e1', english: 'tree', vietnamese: 'cây', phonetic: '[triː]', category: 'Environment', vowel: 'ee', topic: 'environment' },
    { id: 'e2', english: 'green', vietnamese: 'xanh', phonetic: '[ɡriːn]', category: 'Environment', vowel: 'ee', topic: 'environment' },
    { id: 'e3', english: 'clean', vietnamese: 'sạch', phonetic: '[kliːn]', category: 'Environment', vowel: 'ee', topic: 'environment' },
    { id: 'e4', english: 'sea', vietnamese: 'biển', phonetic: '[siː]', category: 'Environment', vowel: 'ee', topic: 'environment' },
    { id: 'e5', english: 'free', vietnamese: 'tự do', phonetic: '[friː]', category: 'Environment', vowel: 'ee', topic: 'environment' },
    // Nguyên âm -i (5 từ)
    { id: 'e6', english: 'climate', vietnamese: 'khí hậu', phonetic: '[ˈklaɪmət]', category: 'Environment', vowel: 'i', topic: 'environment' },
    { id: 'e7', english: 'river', vietnamese: 'sông', phonetic: '[ˈrɪvə]', category: 'Environment', vowel: 'i', topic: 'environment' },
    { id: 'e8', english: 'wind', vietnamese: 'gió', phonetic: '[wɪnd]', category: 'Environment', vowel: 'i', topic: 'environment' },
    { id: 'e9', english: 'fish', vietnamese: 'cá', phonetic: '[fɪʃ]', category: 'Environment', vowel: 'i', topic: 'environment' },
    { id: 'e10', english: 'bird', vietnamese: 'chim', phonetic: '[bɜːd]', category: 'Environment', vowel: 'i', topic: 'environment' },
    // Nguyên âm -a (5 từ)
    { id: 'e11', english: 'nature', vietnamese: 'thiên nhiên', phonetic: '[ˈneɪtʃə]', category: 'Environment', vowel: 'a', topic: 'environment' },
    { id: 'e12', english: 'water', vietnamese: 'nước', phonetic: '[ˈwɔːtə]', category: 'Environment', vowel: 'a', topic: 'environment' },
    { id: 'e13', english: 'air', vietnamese: 'không khí', phonetic: '[eə]', category: 'Environment', vowel: 'a', topic: 'environment' },
    { id: 'e14', english: 'land', vietnamese: 'đất', phonetic: '[lænd]', category: 'Environment', vowel: 'a', topic: 'environment' },
    { id: 'e15', english: 'grass', vietnamese: 'cỏ', phonetic: '[ɡrɑːs]', category: 'Environment', vowel: 'a', topic: 'environment' },
    // Nguyên âm -o (5 từ)
    { id: 'e16', english: 'forest', vietnamese: 'rừng', phonetic: '[ˈfɒrɪst]', category: 'Environment', vowel: 'o', topic: 'environment' },
    { id: 'e17', english: 'ocean', vietnamese: 'đại dương', phonetic: '[ˈəʊʃən]', category: 'Environment', vowel: 'o', topic: 'environment' },
    { id: 'e18', english: 'mountain', vietnamese: 'núi', phonetic: '[ˈmaʊntən]', category: 'Environment', vowel: 'o', topic: 'environment' },
    { id: 'e19', english: 'soil', vietnamese: 'đất', phonetic: '[sɔɪl]', category: 'Environment', vowel: 'o', topic: 'environment' },
    { id: 'e20', english: 'ozone', vietnamese: 'ôzôn', phonetic: '[ˈəʊzəʊn]', category: 'Environment', vowel: 'o', topic: 'environment' },
    // Phụ âm -p (5 từ)
    { id: 'e21', english: 'protect', vietnamese: 'bảo vệ', phonetic: '[prəˈtekt]', category: 'Environment', vowel: 'p', topic: 'environment' },
    { id: 'e22', english: 'pollution', vietnamese: 'ô nhiễm', phonetic: '[pəˈluːʃən]', category: 'Environment', vowel: 'p', topic: 'environment' },
    { id: 'e23', english: 'plant', vietnamese: 'cây cối', phonetic: '[plɑːnt]', category: 'Environment', vowel: 'p', topic: 'environment' },
    { id: 'e24', english: 'plastic', vietnamese: 'nhựa', phonetic: '[ˈplæstɪk]', category: 'Environment', vowel: 'p', topic: 'environment' },
    { id: 'e25', english: 'preserve', vietnamese: 'bảo tồn', phonetic: '[prɪˈzɜːv]', category: 'Environment', vowel: 'p', topic: 'environment' },
    // Phụ âm -b (5 từ)
    { id: 'e26', english: 'beach', vietnamese: 'bãi biển', phonetic: '[biːtʃ]', category: 'Environment', vowel: 'b', topic: 'environment' },
    { id: 'e27', english: 'breathe', vietnamese: 'thở', phonetic: '[briːð]', category: 'Environment', vowel: 'b', topic: 'environment' },
    { id: 'e28', english: 'biology', vietnamese: 'sinh học', phonetic: '[baɪˈɒlədʒi]', category: 'Environment', vowel: 'b', topic: 'environment' },
    { id: 'e29', english: 'balance', vietnamese: 'cân bằng', phonetic: '[ˈbæləns]', category: 'Environment', vowel: 'b', topic: 'environment' },
    { id: 'e30', english: 'biodiversity', vietnamese: 'đa dạng sinh học', phonetic: '[ˌbaɪəʊdaɪˈvɜːsəti]', category: 'Environment', vowel: 'b', topic: 'environment' }
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
    // Load dữ liệu environment ngay lập tức
    this.loadTopicData('environment');
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
      // Không cần fallback vì đã load dữ liệu topic ngay từ đầu
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
