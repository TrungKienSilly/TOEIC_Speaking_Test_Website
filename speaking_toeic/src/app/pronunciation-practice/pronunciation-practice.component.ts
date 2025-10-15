import { Component, signal, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AzureSpeechService } from '../services/azure-speech.service';
import { PronunciationDataService, PronunciationTopic, WordItem } from '../services/pronunciation-data.service';

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
  selector: 'app-pronunciation-practice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pronunciation-practice.component.html',
  styleUrls: ['./pronunciation-practice.component.scss']
})
export class PronunciationPracticeComponent implements OnInit {
  // State management
  currentLessonIndex = signal(0);
  currentTopicIndex = signal(0);
  isRecording = signal(false);
  isPreparing = signal(false); // Trạng thái countdown/khởi động Azure (màu vàng)
  isProcessing = signal(false);
  showScore = signal(false);
  isPlayingUS = signal(false);
  isPlayingUK = signal(false);
  showScoreDetails = signal(false);
  readyMessage = signal(''); // Thông báo sẵn sàng ghi âm
  hasMicPermission = signal(false); // Đã có quyền microphone chưa

  // Logo paths
  logoPath = 'assets/img/logo.png';
  logoTextPath = 'assets/img/VN-2-1024x512.png';
  showFallback = false;
  showMicFallback = true;

  // Data từ JSON - DÙNG SIGNALS để Angular track changes
  allTopics = signal<PronunciationTopic[]>([]);
  currentTopic = signal<PronunciationTopic | null>(null);
  currentWords = signal<WordItem[]>([]);

  // Scores
  currentScore: SpeakingScore = {
    accuracy: 0,
    completeness: 0,
    fluency: 0,
    naturalness: 0,
    overall: 0
  };

  azureRawResult: any = null;
  syllableDetails: SyllableDetail[] = [];
  overallFeedback = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private azureSpeech: AzureSpeechService,
    private pronunciationService: PronunciationDataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeSpeechSynthesis();
  }

  async ngOnInit() {
    console.log('🔄 PronunciationPractice ngOnInit started');
    
    // Load data từ JSON
    await this.pronunciationService.loadData();
    const topics = this.pronunciationService.getAllTopics();
    this.allTopics.set(topics);
    
    console.log('📚 All topics loaded:', this.allTopics().length);
    
    if (this.allTopics().length > 0) {
      // Get topic index from query params (use snapshot for SSR compatibility)
      const topicParam = this.route.snapshot.queryParams['topic'];
      
      if (topicParam !== undefined && topicParam !== null) {
        const index = parseInt(topicParam);
        if (index >= 0 && index < this.allTopics().length) {
          console.log('📌 Loading topic from URL parameter:', index);
          this.selectTopic(index);
        } else {
          console.log('⚠️ Invalid topic index, loading first topic');
          this.selectTopic(0);
        }
      } else {
        console.log('📌 No topic parameter, loading first topic');
        this.selectTopic(0);
      }
    } else {
      console.warn('⚠️ No topics loaded!');
    }

    console.log('✅ Loaded', this.allTopics().length, 'topics for pronunciation practice');
  }

  private initializeSpeechSynthesis() {
    if (isPlatformBrowser(this.platformId) && 'speechSynthesis' in window) {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices loaded:', voices.length);
      } else {
        speechSynthesis.addEventListener('voiceschanged', () => {
          const loadedVoices = speechSynthesis.getVoices();
          console.log('Voices loaded after event:', loadedVoices.length);
        });
      }
    }
  }

  // Chọn topic từ sidebar
  selectTopic(index: number) {
    console.log('🎯 selectTopic called with index:', index, 'Total topics:', this.allTopics().length);
    
    const topics = this.allTopics();
    if (index < 0 || index >= topics.length) {
      console.warn('⚠️ Invalid topic index');
      return;
    }

    this.currentTopicIndex.set(index);
    this.currentTopic.set(topics[index]);
    this.currentWords.set(topics[index].list);
    this.currentLessonIndex.set(0);
    this.resetRecordingState();

    const topic = this.currentTopic();
    console.log(`✅ Selected topic: ${topic?.name} (${this.currentWords().length} words)`);
    console.log('📝 currentTopic is now:', topic ? 'SET' : 'NULL');
  }

  // Chọn từ từ sidebar phải
  selectWord(index: number) {
    const words = this.currentWords();
    if (index < 0 || index >= words.length) {
      return;
    }
    this.currentLessonIndex.set(index);
    this.resetRecordingState();
  }

  getCurrentWord(): WordItem | null {
    const words = this.currentWords();
    if (!words || words.length === 0) {
      return null;
    }
    return words[this.currentLessonIndex()];
  }

  async startRecording() {
    if (this.isRecording() || this.isProcessing() || this.isPreparing()) {
      return;
    }

    const currentWord = this.getCurrentWord();
    if (!currentWord) return;

    // BƯỚC 1: Kiểm tra quyền microphone
    if (!this.hasMicPermission()) {
      console.log('🎤 Lần đầu bấm mic - Yêu cầu quyền microphone...');
      await this.requestMicrophonePermission();
      return; // Dừng lại, chờ user bấm lần 2
    }

    // BƯỚC 2: Đã có quyền - Bắt đầu ghi âm
    console.log('🎤 Đã có quyền mic - Bắt đầu ghi âm...');
    
    const reference = currentWord.word;
    this.isPreparing.set(true); // Bắt đầu countdown - màu vàng
    this.showScore.set(false);
    
    // Hiển thị countdown 1 giây trước khi bắt đầu
    this.readyMessage.set('Chuẩn bị ghi âm sau 1.0s...');
    
    // Countdown từ 1.0s -> 0.0s
    let countdown = 1.0;
    const countdownInterval = setInterval(() => {
      countdown -= 0.1;
      if (countdown > 0) {
        this.readyMessage.set(`Chuẩn bị ghi âm sau ${countdown.toFixed(1)}s...`);
      }
    }, 100);
    
    // Đợi 1 giây
    await new Promise(resolve => setTimeout(resolve, 1000));
    clearInterval(countdownInterval);
    
    this.readyMessage.set('Đang khởi động Azure...');

    await new Promise(resolve => setTimeout(resolve, 500));
    this.isProcessing.set(true);
    console.log('🎤 Recording word:', reference);

    try {
      const result = await this.azureSpeech.assessPronunciation(
        reference, 
        5000,
        (readyTimeMs) => {
          // Callback khi Azure sẵn sàng - chuyển sang trạng thái ghi âm (màu đỏ)
          const readyTimeSec = (readyTimeMs / 1000).toFixed(1);
          this.isPreparing.set(false); // Kết thúc countdown
          this.isRecording.set(true); // Bắt đầu ghi âm - màu đỏ
          this.readyMessage.set(`Đang ghi âm - Hãy nói ngay!`);
          console.log(`✅ Azure sẵn sàng sau ${readyTimeSec}s - Bắt đầu ghi âm`);
        }
      );
      console.log('✅ Azure result:', result);

      this.azureRawResult = result.raw;
      this.parseSyllableDetails(result.raw);

      this.currentScore = {
        accuracy: Math.round(result.accuracy),
        completeness: Math.round(result.completeness),
        fluency: Math.round(result.fluency),
        naturalness: 60,
        overall: Math.round(result.overall)
      };

      this.overallFeedback = this.pronunciationService.getFeedbackByScore(this.currentScore.overall);
      this.showScore.set(true);
    } catch (err) {
      console.error('❌ Recording error:', err);
      if (err instanceof Error && !err.message.includes('NoMatch')) {
        alert('Không nhận dạng được giọng nói. Vui lòng thử lại.');
      }
    } finally {
      this.isRecording.set(false);
      this.isPreparing.set(false);
      this.isProcessing.set(false);
      this.readyMessage.set(''); // Clear message
    }
  }

  async requestMicrophonePermission() {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('⚠️ Không thể xin quyền mic trên server');
      return false;
    }

    try {
      // BƯỚC 1: Kiểm tra permission hiện tại (nếu trình duyệt hỗ trợ)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('📋 Permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            // User đã chọn Block trước đó
            console.log('❌ User đã block quyền microphone trước đó');
            this.readyMessage.set('❌ Bạn đã chặn quyền mic. Vui lòng bật lại trong cài đặt trình duyệt');
            this.hasMicPermission.set(false);
            
            setTimeout(() => {
              this.readyMessage.set('');
            }, 4000);
            
            return false;
          }
        } catch (e) {
          // Một số trình duyệt không hỗ trợ query microphone permission
          console.log('Trình duyệt không hỗ trợ query permission, thử request trực tiếp');
        }
      }
      
      // BƯỚC 2: Request microphone permission
      console.log('🎤 Yêu cầu quyền microphone từ trình duyệt...');
      this.readyMessage.set('Vui lòng cấp quyền microphone...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Có quyền rồi - dừng stream ngay
      stream.getTracks().forEach(track => track.stop());
      
      this.hasMicPermission.set(true);
      this.readyMessage.set('✅ Đã có quyền mic - Bấm lại để ghi âm');
      
      console.log('✅ Đã cấp quyền microphone');
      
      // Tự động clear message sau 2 giây
      setTimeout(() => {
        this.readyMessage.set('');
      }, 2000);
      
      return true; // Thành công
      
    } catch (error: any) {
      console.error('❌ Lỗi khi yêu cầu quyền microphone:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      
      // Phân loại lỗi
      if (error.name === 'NotAllowedError') {
        // User chủ động từ chối (Block)
        console.log('⛔ User chủ động từ chối quyền (Block)');
        this.readyMessage.set('❌ Bạn đã từ chối quyền microphone');
        this.hasMicPermission.set(false);
      } else if (error.name === 'NotFoundError') {
        // Không tìm thấy microphone
        console.log('🔍 Không tìm thấy microphone');
        this.readyMessage.set('❌ Không tìm thấy microphone');
        this.hasMicPermission.set(false);
      } else if (error.name === 'AbortError' || error.name === 'NotReadableError') {
        // User đóng popup hoặc thiết bị đang được sử dụng
        console.log('⚠️ User đóng popup hoặc mic đang bận - sẽ hỏi lại lần sau');
        this.readyMessage.set('⚠️ Vui lòng cấp quyền microphone để tiếp tục');
        // QUAN TRỌNG: KHÔNG set hasMicPermission
        // Để lần sau vẫn hỏi lại
      } else {
        // Lỗi khác
        console.log('❓ Lỗi không xác định - sẽ hỏi lại lần sau');
        this.readyMessage.set('⚠️ Có lỗi xảy ra. Vui lòng thử lại');
        // KHÔNG set hasMicPermission
      }
      
      // Clear message sau 3 giây
      setTimeout(() => {
        this.readyMessage.set('');
      }, 3000);
      
      return false; // Thất bại
    }
  }

  async playAudio(type: 'uk' | 'us') {
    const currentWord = this.getCurrentWord();
    if (!currentWord) return;

    const word = currentWord.word;
    console.log(`Playing ${type} audio:`, word);
    
    this.isPlayingUS.set(type === 'us');
    this.isPlayingUK.set(type === 'uk');
    
    try {
      await this.azureSpeech.speak(word, type);
    } catch (e) {
      console.error('TTS error:', e);
      alert('Không phát âm được. Vui lòng thử lại.');
    } finally {
      this.isPlayingUS.set(false);
      this.isPlayingUK.set(false);
    }
  }

  navigateLesson(direction: 'prev' | 'next') {
    const currentIndex = this.currentLessonIndex();
    const words = this.currentWords();
    if (direction === 'prev' && currentIndex > 0) {
      this.currentLessonIndex.set(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < words.length - 1) {
      this.currentLessonIndex.set(currentIndex + 1);
    }
    this.resetRecordingState();
  }

  refreshLesson() {
    this.resetRecordingState();
  }

  goBack() {
    this.router.navigate(['/']);
  }

  parseSyllableDetails(rawResult: any) {
    this.syllableDetails = [];

    if (!rawResult || !rawResult.NBest || !rawResult.NBest[0]) {
      return;
    }

    const words = rawResult.NBest[0].Words;
    if (!words || words.length === 0) {
      return;
    }

    const word = words[0];
    const syllables = word.Syllables || [];

    this.syllableDetails = syllables.map((syl: any) => ({
      syllable: syl.Syllable || '',
      score: Math.round(syl.PronunciationAssessment?.AccuracyScore || 0),
      accuracyScore: syl.PronunciationAssessment?.AccuracyScore || 0
    }));
  }

  getPhonemeBreakdown(): PhonemeDetail[] {
    if (this.syllableDetails && this.syllableDetails.length > 0) {
      return this.syllableDetails.map(syl => ({
        phoneme: syl.syllable,
        score: syl.score,
        color: this.getScoreColor(syl.score),
        hasData: true
      }));
    }

    const currentWord = this.getCurrentWord();
    return [
      { phoneme: currentWord?.word || '', score: 0, color: 'poor', hasData: false }
    ];
  }

  getWorstPhoneme(): PhonemeDetail | null {
    // Không cần dùng hàm này nữa, giữ lại để tương thích
    const breakdown = this.getPhonemeBreakdown().filter(p => p.hasData && p.score < 60);
    if (breakdown.length === 0) {
      return null;
    }
    return breakdown.reduce((min, item) => item.score < min.score ? item : min);
  }

  isWorstPhoneme(detail: PhonemeDetail): boolean {
    // TẤT CẢ âm tiết có điểm < 60 đều được tô đỏ
    return detail.hasData && detail.score < 60;
  }

  getWorstPhonemeLabel(): string | null {
    const worst = this.getWorstPhoneme();
    return worst?.phoneme ?? null;
  }

  getPhonemeFeedback(detail: PhonemeDetail): string {
    if (!detail.hasData) {
      return 'Không có dữ liệu';
    }
    if (detail.score >= 80) {
      return 'Phát âm rất tốt';
    }
    if (detail.score >= 60) {
      return 'Cần luyện thêm';
    }
    return 'Hãy luyện kỹ âm này';
  }

  private resetRecordingState() {
    this.showScore.set(false);
    this.showScoreDetails.set(false);
    this.isRecording.set(false);
    this.isPreparing.set(false);
    this.isProcessing.set(false);
    this.readyMessage.set('');
    this.overallFeedback = '';
    this.azureRawResult = null;
    this.syllableDetails = [];
  }

  hasUndetectedPhonemes(): boolean {
    return this.getPhonemeBreakdown().some(p => !p.hasData);
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'good';
    if (score >= 60) return 'medium';
    return 'poor';
  }

  toggleScoreDetails() {
    this.showScoreDetails.set(!this.showScoreDetails());
  }

  onImageError(event: any, type: string) {
    console.log(`Image error for ${type}:`, event);
    this.showFallback = true;
  }

  onMicImageError(event: any) {
    console.log('Mic image error:', event);
    this.showMicFallback = true;
  }

  // Helper: Get topic display name
  getTopicDisplayName(topic: PronunciationTopic): string {
    // Extract shorter name from full name
    // "Words with the sound a in Cat" -> "Âm /æ/ Cat"
    const match = topic.name.match(/sound (\w+) in (\w+)/i);
    if (match) {
      return `Âm /${topic.am}/ ${match[2]}`;
    }
    // Fallback: Just return the name after "Words with the"
    const simplified = topic.name.replace(/^Words with the\s+/i, '');
    return simplified;
  }
}
