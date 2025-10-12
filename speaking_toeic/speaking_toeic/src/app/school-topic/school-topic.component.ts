import { Component, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AzureSpeechService } from '../services/azure-speech.service';

// Các loại chủ để học tập - chọn cái nào cũng được, miễn là học được
export type LearningPath = 'vocabulary' | 'fill-blanks' | 'basic-learning' | 'roadmap' | 'speaking';
export type SpeakingPart = 'part1' | 'part2' | 'part3' | 'part4' | 'part5';
export type SpeakingTopic = 'vocabulary' | 'sentence' | 'paragraph';

// Cấu trúc cho thẻ bài tập - đơn giản thôi, có gì đâu
export interface ExerciseCard {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  tags: string[];
  buttonText: string;
}

// Cấu trúc cho bài học nói - cũng vậy, chẳng có gì phức tạp
export interface SpeakingLesson {
  id: string;
  english: string;
  vietnamese: string;
  phonetic: string;
  category: string;
  vowel: string; // ví dụ: 'i', 'ee', 'a'
  topic?: string; // ví dụ: 'school', 'hobby', 'food'
  title?: string;
  description?: string;
  tags?: string[];
  buttonText?: string;
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
  selector: 'app-school-topic',
  imports: [CommonModule],
  templateUrl: './school-topic.component.html',
  styleUrls: ['./school-topic.component.scss']
})
export class SchoolTopicComponent {
  // Quản lý trạng thái - theo dõi trạng thái hiện tại
  currentLessonIndex = signal(0);
  activeTab = signal('flashcard');
  isRecording = signal(false);
  isProcessing = signal(false);
  showScore = signal(false);
  isPlayingUS = signal(false);
  isPlayingUK = signal(false);
  showScoreDetails = signal(false);

  // Feedback câu nhận xét theo mức điểm
  private lowScoreFeedbacks = [
    'Bạn đã rất cố gắng, chúng ta cùng thử lại nhé!',
    'Thử lại lần nữa nào, tôi tin bạn làm được!',
    'Cố gắng lên, cùng nhau luyện để tăng điểm số nào!',
    'Tôi và bạn cùng thử lại lần nữa nhé!'
  ];

  private mediumScoreFeedbacks = [
    'Wow, điểm số ấn tượng đấy, cố bứt phá thêm xíu nào!',
    'Ấn tượng lắm, xíu nữa là hoàn hảo rồi.',
    'Điểm số cao đó, cùng luyện thêm để nhuần nhuyễn nào!'
  ];

  private highScoreFeedbacks = [
    'Thật đó hả, điểm cao quá trời luôn kìa!',
    'Bạn nói tốt thật đấy, giữ phong độ như này nha.',
    'Wow, tôi tưởng người bản xứ nói tiếng Anh đó.'
  ];

  overallFeedback = '';

  // Logo paths
  logoPath = 'assets/img/logo.png';
  logoTextPath = 'assets/img/VN-2-1024x512.png';
  showFallback = false;
  showMicFallback = true; // Tạm thời enable fallback
  activeVowel = signal('all'); // Mặc định là 'all' để hiển thị tất cả
  activeTopic = signal<string | null>('school'); // Topic hiện tại (school, hobby, etc.)

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
    { id: 's1', english: 'teacher', vietnamese: 'giáo viên', phonetic: '[ˈtiːtʃər]', category: 'School', vowel: 'ee', topic: 'school' },
    { id: 's2', english: 'student', vietnamese: 'học sinh', phonetic: '[ˈstjuːdənt]', category: 'School', vowel: 'ee', topic: 'school' },
    { id: 's3', english: 'degree', vietnamese: 'bằng cấp', phonetic: '[dɪˈɡriː]', category: 'School', vowel: 'ee', topic: 'school' },
    { id: 's4', english: 'university', vietnamese: 'trường đại học', phonetic: '[ˌjuːnɪˈvɜːsɪti]', category: 'School', vowel: 'ee', topic: 'school' },
    { id: 's5', english: 'achievement', vietnamese: 'thành tích', phonetic: '[əˈtʃiːvmənt]', category: 'School', vowel: 'ee', topic: 'school' },
    // Nguyên âm -i (5 từ)
    { id: 's6', english: 'education', vietnamese: 'giáo dục', phonetic: '[ˌedʒuˈkeɪʃn]', category: 'School', vowel: 'i', topic: 'school' },
    { id: 's7', english: 'certificate', vietnamese: 'chứng chỉ', phonetic: '[səˈtɪfɪkət]', category: 'School', vowel: 'i', topic: 'school' },
    { id: 's8', english: 'curriculum', vietnamese: 'chương trình học', phonetic: '[kəˈrɪkjələm]', category: 'School', vowel: 'i', topic: 'school' },
    { id: 's9', english: 'discipline', vietnamese: 'kỷ luật', phonetic: '[ˈdɪsɪplɪn]', category: 'School', vowel: 'i', topic: 'school' },
    { id: 's10', english: 'activity', vietnamese: 'hoạt động', phonetic: '[ækˈtɪvɪti]', category: 'School', vowel: 'i', topic: 'school' },
    // Nguyên âm -a (5 từ)
    { id: 's11', english: 'campus', vietnamese: 'khuôn viên trường', phonetic: '[ˈkæmpəs]', category: 'School', vowel: 'a', topic: 'school' },
    { id: 's12', english: 'classroom', vietnamese: 'lớp học', phonetic: '[ˈklɑːsruːm]', category: 'School', vowel: 'a', topic: 'school' },
    { id: 's13', english: 'examination', vietnamese: 'kỳ thi', phonetic: '[ɪɡˌzæmɪˈneɪʃən]', category: 'School', vowel: 'a', topic: 'school' },
    { id: 's14', english: 'graduation', vietnamese: 'tốt nghiệp', phonetic: '[ˌɡrædʒuˈeɪʃən]', category: 'School', vowel: 'a', topic: 'school' },
    { id: 's15', english: 'assignment', vietnamese: 'bài tập', phonetic: '[əˈsaɪnmənt]', category: 'School', vowel: 'a', topic: 'school' },
    // Nguyên âm -o (5 từ)
    { id: 's16', english: 'school', vietnamese: 'trường học', phonetic: '[skuːl]', category: 'School', vowel: 'o', topic: 'school' },
    { id: 's17', english: 'course', vietnamese: 'khóa học', phonetic: '[kɔːrs]', category: 'School', vowel: 'o', topic: 'school' },
    { id: 's18', english: 'homework', vietnamese: 'bài tập về nhà', phonetic: '[ˈhoʊmwɜːrk]', category: 'School', vowel: 'o', topic: 'school' },
    { id: 's19', english: 'knowledge', vietnamese: 'kiến thức', phonetic: '[ˈnɒlɪdʒ]', category: 'School', vowel: 'o', topic: 'school' },
    { id: 's20', english: 'professor', vietnamese: 'giáo sư', phonetic: '[prəˈfesər]', category: 'School', vowel: 'o', topic: 'school' },
    // Phụ âm -p (5 từ)
    { id: 's21', english: 'project', vietnamese: 'dự án', phonetic: '[ˈprɒdʒekt]', category: 'School', vowel: 'p', topic: 'school' },
    { id: 's22', english: 'practice', vietnamese: 'thực hành', phonetic: '[ˈpræktɪs]', category: 'School', vowel: 'p', topic: 'school' },
    { id: 's23', english: 'presentation', vietnamese: 'bài thuyết trình', phonetic: '[ˌprezənˈteɪʃən]', category: 'School', vowel: 'p', topic: 'school' },
    { id: 's24', english: 'participate', vietnamese: 'tham gia', phonetic: '[pɑːrˈtɪsɪpeɪt]', category: 'School', vowel: 'p', topic: 'school' },
    { id: 's25', english: 'performance', vietnamese: 'hiệu suất', phonetic: '[pərˈfɔːrməns]', category: 'School', vowel: 'p', topic: 'school' },
    // Phụ âm -b (5 từ)
    { id: 's26', english: 'book', vietnamese: 'sách', phonetic: '[bʊk]', category: 'School', vowel: 'b', topic: 'school' },
    { id: 's27', english: 'board', vietnamese: 'bảng', phonetic: '[bɔːrd]', category: 'School', vowel: 'b', topic: 'school' },
    { id: 's28', english: 'building', vietnamese: 'tòa nhà', phonetic: '[ˈbɪldɪŋ]', category: 'School', vowel: 'b', topic: 'school' },
    { id: 's29', english: 'biology', vietnamese: 'sinh học', phonetic: '[baɪˈɒlədʒi]', category: 'School', vowel: 'b', topic: 'school' },
    { id: 's30', english: 'brainstorm', vietnamese: 'động não', phonetic: '[ˈbreɪnstɔːrm]', category: 'School', vowel: 'b', topic: 'school' }
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
    // Load dữ liệu school ngay lập tức
    this.loadTopicData('school');
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

  selectLesson(index: number) {
    if (index < 0 || index >= this.lessons.length) {
      return;
    }
    this.currentLessonIndex.set(index);
    this.resetRecordingState();
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
      this.overallFeedback = this.generateOverallFeedback(this.currentScore.overall);
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
    this.resetRecordingState();
  }

  refreshLesson() {
    this.resetRecordingState();
    // Reset any practice state
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goToSpeakingPractice(lessonId?: string) {
    if (lessonId) {
      const targetLesson = this.allLessons.find(lesson => lesson.id === lessonId);
      if (targetLesson?.topic) {
        this.router.navigate(['/speaking-practice', targetLesson.topic]);
        return;
      }
    }

    this.router.navigate(['/speaking-practice']);
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

  getWorstPhoneme(): PhonemeDetail | null {
    const breakdown = this.getPhonemeBreakdown().filter(p => p.hasData);
    if (breakdown.length === 0) {
      return null;
    }
    return breakdown.reduce((min, item) => item.score < min.score ? item : min);
  }

  isWorstPhoneme(detail: PhonemeDetail): boolean {
    const worst = this.getWorstPhoneme();
    return !!worst && detail.hasData && worst.phoneme === detail.phoneme && worst.score === detail.score;
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

  private generateOverallFeedback(score: number): string {
    if (score < 50) {
      return this.randomFeedback(this.lowScoreFeedbacks);
    }
    if (score <= 80) {
      return this.randomFeedback(this.mediumScoreFeedbacks);
    }
    return this.randomFeedback(this.highScoreFeedbacks);
  }

  private randomFeedback(list: string[]): string {
    if (!list.length) {
      return '';
    }
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  private resetRecordingState() {
    this.showScore.set(false);
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

  // Quản lý trạng thái - theo dõi xem user đang làm gì
  activeLearningPath = signal<LearningPath>('vocabulary');
  activeSpeakingPart = signal<SpeakingPart>('part1');
  activeSpeakingTopic = signal<SpeakingTopic>('vocabulary');

  // Các hàm xử lý - làm những việc cần thiết
  setActiveLearningPath(path: LearningPath) {
    this.activeLearningPath.set(path);
  }

  setActiveSpeakingPart(part: SpeakingPart) {
    this.activeSpeakingPart.set(part);
  }

  setActiveSpeakingTopic(topic: SpeakingTopic) {
    this.activeSpeakingTopic.set(topic);
  }

  // Lấy bài tập hiện tại - trả về danh sách bài học
  getCurrentExercises(): ExerciseCard[] {
    return [];
  }

  // Lấy tiêu đề section - để hiển thị tên phần học
  getCurrentSectionTitle(): string {
    return this.sectionTitles[this.activeLearningPath()];
  }

  // Lấy bài học speaking - theo part và topic đã chọn
  getCurrentSpeakingLessons(): SpeakingLesson[] {
    return [];
  }

  // Lấy tiêu đề Part speaking - tên của từng phần nói
  getSpeakingPartTitle(): string {
    const partTitles = {
      part1: 'Part 1 - Giới thiệu bản thân',
      part2: 'Part 2 - Mô tả tranh',
      part3: 'Part 3 - Trả lời câu hỏi',
      part4: 'Part 4 - Thảo luận',
      part5: 'Part 5 - Thuyết trình'
    };
    return partTitles[this.activeSpeakingPart()];
  }

  // Dữ liệu bài tập - tất cả bài học có sẵn
  exerciseData = {
    vocabulary: [],
    'fill-blanks': [],
    'basic-learning': [],
    roadmap: [],
    speaking: []
  };

  // Dữ liệu Speaking - các bài nói chi tiết
  speakingData = {
    part1: {
      vocabulary: [],
      sentence: [],
      paragraph: []
    },
    part2: {
      vocabulary: [],
      sentence: [],
      paragraph: []
    },
    part3: {
      vocabulary: [],
      sentence: [],
      paragraph: []
    },
    part4: {
      vocabulary: [],
      sentence: [],
      paragraph: []
    },
    part5: {
      vocabulary: [],
      sentence: [],
      paragraph: []
    }
  };

  // Tiêu đề cho từng phần học - để biết đang ở đâu
  sectionTitles = {
    vocabulary: 'Từ vựng',
    'fill-blanks': 'Điền khuyết',
    'basic-learning': 'Học căn bản',
    roadmap: 'Lộ trình 600+',
    speaking: 'Luyện Speaking'
  };
}
