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
  selector: 'app-speaking-practice',
  imports: [CommonModule],
  templateUrl: './speaking-practice.component.html',
  styleUrls: ['./speaking-practice.component.scss']
})
export class SpeakingPracticeComponent {
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
<<<<<<< HEAD
  activeVowel = signal('all'); // Mặc định là 'all' để hiển thị tất cả
  activeTopic = signal<string | null>(null); // Topic hiện tại (school, hobby, etc.)
=======
  activeVowel = signal('i'); // Mặc định là nguyên âm 'i'
>>>>>>> a9448cf6577b713fd8825c153a3345d5f3fbbb94
  
  // All lessons for the current topic
  lessons: SpeakingLesson[] = []; 
  // All lessons without filter (backup)
  allTopicLessons: SpeakingLesson[] = [];
  // Lessons to be displayed in the sidebar (only 5)
  sidebarLessons: SpeakingLesson[] = [];
  
  // Gán nguyên âm và topic cho mỗi từ - 30 từ/chủ đề
  private allLessons: SpeakingLesson[] = [
    // ===== TOPIC: SCHOOL (Trường học) - 30 từ =====
    // Nguyên âm -ee (5 từ)
    { id: 's1', english: 'degree', vietnamese: 'bằng cấp', phonetic: "[dɪˈɡriː]", category: 'School', vowel: 'ee', topic: 'school' },
    { id: 's2', english: 'trainee', vietnamese: 'thực tập sinh', phonetic: "[ˌtreɪˈniː]", category: 'School', vowel: 'ee', topic: 'school' },
    { id: 's3', english: 'employee', vietnamese: 'nhân viên', phonetic: "[ˌemplɔɪˈiː]", category: 'School', vowel: 'ee', topic: 'school' },
    { id: 's4', english: 'agree', vietnamese: 'đồng ý', phonetic: "[əˈɡriː]", category: 'School', vowel: 'ee', topic: 'school' },
    { id: 's5', english: 'guarantee', vietnamese: 'đảm bảo', phonetic: "[ˌɡærənˈtiː]", category: 'School', vowel: 'ee', topic: 'school' },
    
    // Nguyên âm -i (5 từ)
    { id: 's6', english: 'publication', vietnamese: 'ấn phẩm', phonetic: "[ˌpʌblɪˈkeɪʃən]", category: 'School', vowel: 'i', topic: 'school' },
    { id: 's7', english: 'facility', vietnamese: 'cơ sở vật chất', phonetic: "[fəˈsɪləti]", category: 'School', vowel: 'i', topic: 'school' },
    { id: 's8', english: 'discipline', vietnamese: 'kỷ luật', phonetic: "[ˈdɪsɪplɪn]", category: 'School', vowel: 'i', topic: 'school' },
    { id: 's9', english: 'activity', vietnamese: 'hoạt động', phonetic: "[ækˈtɪvəti]", category: 'School', vowel: 'i', topic: 'school' },
    { id: 's10', english: 'ability', vietnamese: 'khả năng', phonetic: "[əˈbɪləti]", category: 'School', vowel: 'i', topic: 'school' },
    
    // Nguyên âm -a (5 từ)
    { id: 's11', english: 'campus', vietnamese: 'khuôn viên trường', phonetic: "[ˈkæmpəs]", category: 'School', vowel: 'a', topic: 'school' },
    { id: 's12', english: 'classroom', vietnamese: 'lớp học', phonetic: "[ˈklɑːsruːm]", category: 'School', vowel: 'a', topic: 'school' },
    { id: 's13', english: 'graduate', vietnamese: 'tốt nghiệp', phonetic: "[ˈɡrædʒuət]", category: 'School', vowel: 'a', topic: 'school' },
    { id: 's14', english: 'exam', vietnamese: 'kỳ thi', phonetic: "[ɪɡˈzæm]", category: 'School', vowel: 'a', topic: 'school' },
    { id: 's15', english: 'academic', vietnamese: 'học thuật', phonetic: "[ˌækəˈdemɪk]", category: 'School', vowel: 'a', topic: 'school' },
    
    // Nguyên âm -o (5 từ)
    { id: 's16', english: 'scholarship', vietnamese: 'học bổng', phonetic: "[ˈskɒləʃɪp]", category: 'School', vowel: 'o', topic: 'school' },
    { id: 's17', english: 'document', vietnamese: 'tài liệu', phonetic: "[ˈdɒkjumənt]", category: 'School', vowel: 'o', topic: 'school' },
    { id: 's18', english: 'college', vietnamese: 'trường cao đẳng', phonetic: "[ˈkɒlɪdʒ]", category: 'School', vowel: 'o', topic: 'school' },
    { id: 's19', english: 'knowledge', vietnamese: 'kiến thức', phonetic: "[ˈnɒlɪdʒ]", category: 'School', vowel: 'o', topic: 'school' },
    { id: 's20', english: 'optional', vietnamese: 'tùy chọn', phonetic: "[ˈɒpʃənl]", category: 'School', vowel: 'o', topic: 'school' },
    
    // Phụ âm -p (5 từ)
    { id: 's21', english: 'professor', vietnamese: 'giáo sư', phonetic: "[prəˈfesə]", category: 'School', vowel: 'p', topic: 'school' },
    { id: 's22', english: 'presentation', vietnamese: 'bài thuyết trình', phonetic: "[ˌpreznˈteɪʃn]", category: 'School', vowel: 'p', topic: 'school' },
    { id: 's23', english: 'project', vietnamese: 'dự án', phonetic: "[ˈprɒdʒekt]", category: 'School', vowel: 'p', topic: 'school' },
    { id: 's24', english: 'practice', vietnamese: 'thực hành', phonetic: "[ˈpræktɪs]", category: 'School', vowel: 'p', topic: 'school' },
    { id: 's25', english: 'principal', vietnamese: 'hiệu trưởng', phonetic: "[ˈprɪnsəpl]", category: 'School', vowel: 'p', topic: 'school' },
    
    // Phụ âm -b (5 từ)
    { id: 's26', english: 'textbook', vietnamese: 'sách giáo khoa', phonetic: "[ˈtekstbʊk]", category: 'School', vowel: 'b', topic: 'school' },
    { id: 's27', english: 'library', vietnamese: 'thư viện', phonetic: "[ˈlaɪbrəri]", category: 'School', vowel: 'b', topic: 'school' },
    { id: 's28', english: 'subject', vietnamese: 'môn học', phonetic: "[ˈsʌbdʒɪkt]", category: 'School', vowel: 'b', topic: 'school' },
    { id: 's29', english: 'absent', vietnamese: 'vắng mặt', phonetic: "[ˈæbsənt]", category: 'School', vowel: 'b', topic: 'school' },
    { id: 's30', english: 'submit', vietnamese: 'nộp bài', phonetic: "[səbˈmɪt]", category: 'School', vowel: 'b', topic: 'school' },

    // Topic: Hobby (Sở thích) - vowel 'ee'
    { id: '6', english: 'employee', vietnamese: 'nhân viên', phonetic: "[ˌemplɔɪˈiː]", category: 'Hobby', vowel: 'ee', topic: 'hobby' },
    { id: '7', english: 'agree', vietnamese: 'đồng ý', phonetic: "[əˈɡriː]", category: 'Hobby', vowel: 'ee', topic: 'hobby' },
    { id: '8', english: 'degree', vietnamese: 'bằng cấp', phonetic: "[dɪˈɡriː]", category: 'Hobby', vowel: 'ee', topic: 'hobby' },
    { id: '9', english: 'trainee', vietnamese: 'thực tập sinh', phonetic: "[ˌtreɪˈniː]", category: 'Hobby', vowel: 'ee', topic: 'hobby' },
    { id: '10', english: 'guarantee', vietnamese: 'đảm bảo', phonetic: "[ˌɡærənˈtiː]", category: 'Hobby', vowel: 'ee', topic: 'hobby' },

    // Topic: Food (Đồ ăn) - vowel 'a'
    { id: '11', english: 'restaurant', vietnamese: 'nhà hàng', phonetic: "[ˈrestrɒnt]", category: 'Food', vowel: 'a', topic: 'food' },
    { id: '12', english: 'salad', vietnamese: 'salad', phonetic: "[ˈsæləd]", category: 'Food', vowel: 'a', topic: 'food' },
    { id: '13', english: 'sandwich', vietnamese: 'bánh mì sandwich', phonetic: "[ˈsænwɪdʒ]", category: 'Food', vowel: 'a', topic: 'food' },
    { id: '14', english: 'pasta', vietnamese: 'mì ý', phonetic: "[ˈpæstə]", category: 'Food', vowel: 'a', topic: 'food' },
    { id: '15', english: 'snack', vietnamese: 'đồ ăn vặt', phonetic: "[snæk]", category: 'Food', vowel: 'a', topic: 'food' },

    // Topic: Shopping (Mua sắm) - vowel 'o'
    { id: '16', english: 'shopping', vietnamese: 'mua sắm', phonetic: "[ˈʃɒpɪŋ]", category: 'Shopping', vowel: 'o', topic: 'shopping' },
    { id: '17', english: 'product', vietnamese: 'sản phẩm', phonetic: "[ˈprɒdʌkt]", category: 'Shopping', vowel: 'o', topic: 'shopping' },
    { id: '18', english: 'option', vietnamese: 'lựa chọn', phonetic: "[ˈɒpʃən]", category: 'Shopping', vowel: 'o', topic: 'shopping' },
    { id: '19', english: 'cost', vietnamese: 'chi phí', phonetic: "[kɒst]", category: 'Shopping', vowel: 'o', topic: 'shopping' },
    { id: '20', english: 'shop', vietnamese: 'cửa hàng', phonetic: "[ʃɒp]", category: 'Shopping', vowel: 'o', topic: 'shopping' },

    // Topic: Environment (Môi trường) - vowel 'p'
    { id: '21', english: 'protect', vietnamese: 'bảo vệ', phonetic: "[prəˈtekt]", category: 'Environment', vowel: 'p', topic: 'environment' },
    { id: '22', english: 'pollution', vietnamese: 'ô nhiễm', phonetic: "[pəˈluːʃən]", category: 'Environment', vowel: 'p', topic: 'environment' },
    { id: '23', english: 'plant', vietnamese: 'cây cối', phonetic: "[plɑːnt]", category: 'Environment', vowel: 'p', topic: 'environment' },
    { id: '24', english: 'plastic', vietnamese: 'nhựa', phonetic: "[ˈplæstɪk]", category: 'Environment', vowel: 'p', topic: 'environment' },
    { id: '25', english: 'preserve', vietnamese: 'bảo tồn', phonetic: "[prɪˈzɜːv]", category: 'Environment', vowel: 'p', topic: 'environment' },
    
    // Topic: Work (Công việc) - vowel 'b'
    { id: '26', english: 'job', vietnamese: 'công việc', phonetic: "[dʒɒb]", category: 'Work', vowel: 'b', topic: 'work' },
    { id: '27', english: 'ability', vietnamese: 'khả năng', phonetic: "[əˈbɪləti]", category: 'Work', vowel: 'b', topic: 'work' },
    { id: '28', english: 'problem', vietnamese: 'vấn đề', phonetic: "[ˈprɒbləm]", category: 'Work', vowel: 'b', topic: 'work' },
    { id: '29', english: 'business', vietnamese: 'kinh doanh', phonetic: "[ˈbɪznəs]", category: 'Work', vowel: 'b', topic: 'work' },
    { id: '30', english: 'benefit', vietnamese: 'lợi ích', phonetic: "[ˈbenɪfɪt]", category: 'Work', vowel: 'b', topic: 'work' }
  ];

  days = [
    { label: 'Day 1 - Luyện nguyên âm -ee', vowel: 'ee' },
    { label: 'Day 2 - Luyện nguyên âm -i', vowel: 'i' },
    { label: 'Day 3 - Luyện nguyên âm -a', vowel: 'a' },
    { label: 'Day 4 - Luyện nguyên âm -o', vowel: 'o' },
    { label: 'Day 5 - Luyện nguyên âm -p', vowel: 'p' },
    { label: 'Day 6 - Luyện nguyên âm -b', vowel: 'b' }
  ];
  
  relatedLessons = [
    { id: '1', title: 'Câu chào hỏi', type: 'greeting' },
    { id: '2', title: 'Câu chào hỏi', type: 'greeting' },
    { id: '3', title: 'Câu chào hỏi', type: 'greeting' },
    { id: '4', title: 'Câu yêu cầu', type: 'request' },
    { id: '5', title: 'Câu yêu cầu', type: 'request' },
    { id: '6', title: 'Câu yêu cầu', type: 'request' },
    { id: '7', title: 'Câu phàn nàn', type: 'complaint' },
    { id: '8', title: 'Câu khẳng định', type: 'affirmative' }
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
    // Đọc topic từ URL parameter
    this.route.params.subscribe(params => {
      const topicId = params['topic'];
      if (topicId) {
        console.log('Loading topic:', topicId);
        this.loadTopicData(topicId);
      } else {
        // Mặc định load nguyên âm 'i'
        this.selectVowel(this.activeVowel());
      }
    });
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

  // Lọc bài học dựa trên nguyên âm được chọn
  selectVowel(vowel: string) {
    this.activeVowel.set(vowel);
    const filtered = this.allLessons.filter(l => l.vowel === vowel);
    
    if (filtered.length > 0) {
      this.lessons = filtered; // Toàn bộ danh sách từ cho nguyên âm đó
      this.sidebarLessons = filtered.slice(0, 5); // 5 từ cho sidebar
      this.currentLessonIndex.set(0);
    } else {
      // Xử lý trường hợp không có từ nào
      this.lessons = [];
      this.sidebarLessons = [];
    }
    this.showScore.set(false);
  }
  
  getCurrentLesson(): SpeakingLesson {
    return this.lessons[this.currentLessonIndex()];
  }
  
  setActiveTab(tab: string) {
    this.activeTab.set(tab);
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
<<<<<<< HEAD
      
      // Lưu raw result để parse syllables
      this.azureRawResult = result.raw;
      this.parseSyllableDetails(result.raw);
      
=======
>>>>>>> a9448cf6577b713fd8825c153a3345d5f3fbbb94
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

<<<<<<< HEAD
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
=======
  getPhonemeBreakdown() {
    // Simulate phoneme breakdown based on current word
    const word = this.getCurrentLesson()?.english || '';
    if (word === 'publication') {
      return [
        { phoneme: 'pʌb', score: 95, color: 'good', hasData: true },
        { phoneme: 'lɪ', score: 70, color: 'medium', hasData: true },
        { phoneme: 'keɪ', score: 58, color: 'poor', hasData: true },
        { phoneme: 'ʃən', score: 80, color: 'good', hasData: true }
      ];
    }
    // Default breakdown for other words
    return [
      { phoneme: word.slice(0, 2), score: 85, color: 'good', hasData: true },
      { phoneme: word.slice(2, 4), score: 75, color: 'medium', hasData: true },
      { phoneme: word.slice(4), score: 65, color: 'medium', hasData: true }
>>>>>>> a9448cf6577b713fd8825c153a3345d5f3fbbb94
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
<<<<<<< HEAD

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
      this.selectVowel(this.activeVowel());
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
=======
>>>>>>> a9448cf6577b713fd8825c153a3345d5f3fbbb94
}