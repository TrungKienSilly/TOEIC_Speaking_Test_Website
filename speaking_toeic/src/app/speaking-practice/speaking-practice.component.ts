import { Component, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// Cấu trúc cho bài học nói - thêm thuộc tính 'vowel'
export interface SpeakingLesson {
  id: string;
  english: string;
  vietnamese: string;
  phonetic: string;
  category: string;
  vowel: string; // ví dụ: 'i', 'ee', 'a'
}

// Cấu trúc cho điểm số - đánh giá kết quả
export interface SpeakingScore {
  accuracy: number;
  completeness: number;
  fluency: number;
  naturalness: number;
  overall: number;
}

@Component({
  selector: 'app-speaking-practice',
  imports: [CommonModule],
  templateUrl: './speaking-practice.component.html',
  styleUrl: './speaking-practice.component.scss'
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
  
  // Logo paths
  logoPath = 'assets/img/logo.png';
  logoTextPath = 'assets/img/VN-2-1024x512.png';
  showFallback = false;
  activeVowel = signal('i'); // Mặc định là nguyên âm 'i'
  
  // All lessons for the current topic
  lessons: SpeakingLesson[] = []; 
  // Lessons to be displayed in the sidebar (only 5)
  sidebarLessons: SpeakingLesson[] = [];
  
  // Gán nguyên âm cho mỗi từ
  private allLessons: SpeakingLesson[] = [
    // Nguyên âm -ee
    { id: '1', english: 'employee', vietnamese: 'nhân viên', phonetic: "[ˌemplɔɪˈiː]", category: 'Work', vowel: 'ee' },
    { id: '2', english: 'guarantee', vietnamese: 'đảm bảo', phonetic: "[ˌɡærənˈtiː]", category: 'Business', vowel: 'ee' },
    { id: '3', english: 'agree', vietnamese: 'đồng ý', phonetic: "[əˈɡriː]", category: 'Communication', vowel: 'ee' },
    { id: '4', english: 'degree', vietnamese: 'bằng cấp', phonetic: "[dɪˈɡriː]", category: 'Education', vowel: 'ee' },
    { id: '5', english: 'trainee', vietnamese: 'thực tập sinh', phonetic: "[ˌtreɪˈniː]", category: 'Work', vowel: 'ee' },

    // Nguyên âm -i
    { id: '6', english: 'publication', vietnamese: 'ấn phẩm', phonetic: "[ˌpʌblɪˈkeɪʃən]", category: 'Trường học', vowel: 'i' },
    { id: '7', english: 'assignment', vietnamese: 'bài tập', phonetic: "[əˈsaɪnmənt]", category: 'Trường học', vowel: 'i' },
    { id: '8', english: 'resident', vietnamese: 'cư dân', phonetic: "[ˈrezɪdənt]", category: 'Trường học', vowel: 'i' },
    { id: '9', english: 'facility', vietnamese: 'cơ sở vật chất', phonetic: "[fəˈsɪləti]", category: 'Trường học', vowel: 'i' },
    { id: '10', english: 'expertise', vietnamese: 'chuyên môn', phonetic: "[ˌekspɜːˈtiːz]", category: 'Trường học', vowel: 'i' },

    // Nguyên âm -a
    { id: '11', english: 'classroom', vietnamese: 'lớp học', phonetic: "[ˈklɑːsruːm]", category: 'Trường học', vowel: 'a' },
    { id: '12', english: 'associate', vietnamese: 'liên kết', phonetic: "[əˈsəʊʃieɪt]", category: 'Trường học', vowel: 'a' },
    { id: '13', english: 'graduation', vietnamese: 'lễ tốt nghiệp', phonetic: "[ˌɡrædʒuˈeɪʃən]", category: 'Trường học', vowel: 'a' },
    { id: '14', english: 'campus', vietnamese: 'khuôn viên trường', phonetic: "[ˈkæmpəs]", category: 'Trường học', vowel: 'a' },
    { id: '15', english: 'staff', vietnamese: 'nhân viên', phonetic: "[stɑːf]", category: 'Work', vowel: 'a' },

    // Nguyên âm -o
    { id: '16', english: 'scholarship', vietnamese: 'học bổng', phonetic: "[ˈskɒləʃɪp]", category: 'Trường học', vowel: 'o' },
    { id: '17', english: 'document', vietnamese: 'tài liệu', phonetic: "[ˈdɒkjumənt]", category: 'Work', vowel: 'o' },
    { id: '18', english: 'accommodation', vietnamese: 'chỗ ở', phonetic: "[əˌkɒməˈdeɪʃən]", category: 'Trường học', vowel: 'o' },
    { id: '19', english: 'opportunity', vietnamese: 'cơ hội', phonetic: "[ˌɒpəˈtjuːnəti]", category: 'General', vowel: 'o' },
    { id: '20', english: 'conference', vietnamese: 'hội nghị', phonetic: "[ˈkɒnfərəns]", category: 'Business', vowel: 'o' },

    // Phụ âm -p
    { id: '21', english: 'professor', vietnamese: 'giáo sư', phonetic: "[prəˈfesə]", category: 'Trường học', vowel: 'p' },
    { id: '22', english: 'presentation', vietnamese: 'bài thuyết trình', phonetic: "[ˌpreznˈteɪʃn]", category: 'Education', vowel: 'p' },
    { id: '23', english: 'project', vietnamese: 'dự án', phonetic: "[ˈprɒdʒekt]", category: 'Work', vowel: 'p' },
    { id: '24', english: 'application', vietnamese: 'ứng dụng', phonetic: "[ˌæplɪˈkeɪʃn]", category: 'Technology', vowel: 'p' },
    { id: '25', english: 'department', vietnamese: 'phòng ban', phonetic: "[dɪˈpɑːtmənt]", category: 'Work', vowel: 'p' },
    
    // Phụ âm -b
    { id: '26', english: 'textbook', vietnamese: 'sách giáo khoa', phonetic: "[ˈtekstbʊk]", category: 'Trường học', vowel: 'b' },
    { id: '27', english: 'subscribe', vietnamese: 'đăng ký', phonetic: "[səbˈskraɪb]", category: 'Media', vowel: 'b' },
    { id: '28', english: 'problem', vietnamese: 'vấn đề', phonetic: "[ˈprɒbləm]", category: 'General', vowel: 'b' },
    { id: '29', english: 'job', vietnamese: 'công việc', phonetic: "[dʒɒb]", category: 'Work', vowel: 'b' },
    { id: '30', english: 'ability', vietnamese: 'khả năng', phonetic: "[əˈbɪləti]", category: 'General', vowel: 'b' }
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
  
  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.selectVowel(this.activeVowel()); // Lọc theo nguyên âm mặc định khi khởi tạo
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
  
  startRecording() {
    if (this.isRecording() || this.isProcessing()) {
      return; // Prevent multiple clicks
    }

    // Trạng thái 1: Bắt đầu ghi âm
    this.isRecording.set(true);
    
    // Simulate recording process (3 seconds)
    setTimeout(() => {
      this.isRecording.set(false);
      this.isProcessing.set(true);
      
      // Trạng thái 2: Xử lý (2 seconds)
      setTimeout(() => {
        this.isProcessing.set(false);
        this.showScore.set(true);
        
        // Trạng thái 3: Hoàn tất, reset về trạng thái ban đầu sau 3 giây
        setTimeout(() => {
          this.showScore.set(false);
        }, 3000);
      }, 2000);
    }, 3000);
  }
  
  playAudio(type: 'uk' | 'us') {
    const word = this.getCurrentLesson().english;
    console.log(`Playing ${type} audio for:`, word);
    
    // Chỉ chạy trên browser, không chạy trên server
    if (isPlatformBrowser(this.platformId) && 'speechSynthesis' in window) {
      // Dừng bất kỳ giọng đọc nào đang chạy
      speechSynthesis.cancel();
      
      // Reset trạng thái playing
      this.isPlayingUS.set(false);
      this.isPlayingUK.set(false);
      
      // Tạo utterance mới
      const utterance = new SpeechSynthesisUtterance(word);
      
      // Cấu hình giọng đọc
      utterance.rate = 0.8; // Tốc độ đọc (0.1 - 10)
      utterance.pitch = 1; // Cao độ (0 - 2)
      utterance.volume = 1; // Âm lượng (0 - 1)
      
      // Chọn giọng đọc theo US/UK
      const voices = speechSynthesis.getVoices();
      let selectedVoice = null;
      
      if (type === 'us') {
        // Tìm giọng Mỹ
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-US') || 
          voice.name.includes('US') ||
          voice.name.includes('American')
        );
      } else if (type === 'uk') {
        // Tìm giọng Anh
        selectedVoice = voices.find(voice => 
          voice.lang.includes('en-GB') || 
          voice.name.includes('UK') ||
          voice.name.includes('British')
        );
      }
      
      // Nếu không tìm thấy giọng cụ thể, dùng giọng tiếng Anh đầu tiên
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      }
      
      // Set trạng thái playing
      if (type === 'us') {
        this.isPlayingUS.set(true);
      } else {
        this.isPlayingUK.set(true);
      }
      
      // Phát âm
      speechSynthesis.speak(utterance);
      
      // Log khi hoàn thành
      utterance.onend = () => {
        console.log(`Finished speaking: ${word}`);
        this.isPlayingUS.set(false);
        this.isPlayingUK.set(false);
      };
      
      // Log lỗi nếu có
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.isPlayingUS.set(false);
        this.isPlayingUK.set(false);
      };
      
    } else {
      console.warn('Speech Synthesis not supported in this browser');
      // Fallback: hiển thị thông báo
      alert(`Giọng đọc không được hỗ trợ trong browser này. Từ: ${word}`);
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
}