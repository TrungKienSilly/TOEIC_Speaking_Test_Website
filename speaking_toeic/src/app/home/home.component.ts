import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PronunciationDataService, PronunciationTopic } from '../services/pronunciation-data.service';

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
  title: string;
  description: string;
  tags: string[];
  buttonText: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  protected readonly title = signal('990 TOEIC Speaking Practice');
  showFallback = false;
  
  // Data từ JSON
  pronunciationTopics: PronunciationTopic[] = [];
  
  constructor(
    private router: Router,
    private pronunciationService: PronunciationDataService
  ) {
    console.log('HomeComponent khởi tạo - chào mừng đến với trang TOEIC!');
  }
  
  async ngOnInit() {
    console.log('HomeComponent sẵn sàng - bắt đầu học thôi!');
    
    // Load pronunciation data từ JSON
    await this.pronunciationService.loadData();
    this.pronunciationTopics = this.pronunciationService.getAllTopics();
    
    console.log('✅ Loaded', this.pronunciationTopics.length, 'pronunciation topics for home');
  }
  
  // Quản lý trạng thái - theo dõi xem user đang làm gì
  activeLearningPath = signal<LearningPath>('vocabulary');
  activeSpeakingPart = signal<SpeakingPart>('part1');
  activeSpeakingTopic = signal<SpeakingTopic>('vocabulary');
  
  // Dữ liệu bài tập - tất cả bài học có sẵn
  exerciseData = {
    vocabulary: [
      { id: 'day1', title: 'Day 1 - Noun', description: '30 từ vựng mỗi ngày', difficulty: '3 dạng bài tập', tags: ['FlashCard-Exam', 'Voca'], buttonText: 'Luyện tập' },
      { id: 'day2', title: 'Day 2 - Noun', description: '30 từ vựng mỗi ngày', difficulty: '3 dạng bài tập', tags: ['FlashCard-Exam', 'Voca'], buttonText: 'Luyện tập' },
      { id: 'day3', title: 'Day 3 - Noun', description: '30 từ vựng mỗi ngày', difficulty: '3 dạng bài tập', tags: ['FlashCard-Exam', 'Voca'], buttonText: 'Luyện tập' },
      { id: 'day4', title: 'Day 4 - Noun', description: '30 từ vựng mỗi ngày', difficulty: '3 dạng bài tập', tags: ['FlashCard-Exam', 'Voca'], buttonText: 'Luyện tập' },
      { id: 'day5', title: 'Day 5 - Noun', description: '30 từ vựng mỗi ngày', difficulty: '3 dạng bài tập', tags: ['FlashCard-Exam', 'Voca'], buttonText: 'Luyện tập' }
    ],
    'fill-blanks': [
      { id: 'day1', title: '[DAY 1] Part 1 Tranh một người', description: 'Nghe và điền từ', difficulty: 'Cấp độ: B1-B2', tags: ['Listening', 'Part 1'], buttonText: 'Luyện tập' },
      { id: 'day2', title: '[DAY 2] Part 1 Tranh nhiều người', description: 'Nghe và điền từ', difficulty: 'Cấp độ: B1-B2', tags: ['Listening', 'Part 1'], buttonText: 'Luyện tập' },
      { id: 'day3', title: '[DAY 3] Part 1 Tranh tả vật', description: 'Nghe và điền từ', difficulty: 'Cấp độ: B1-B2', tags: ['Listening', 'Part 1'], buttonText: 'Luyện tập' },
      { id: 'day4', title: '[DAY 4] Part 2 Câu hỏi Who/What/Which', description: 'Nghe và điền từ', difficulty: 'Cấp độ: B1-B2', tags: ['Listening', 'Part 2'], buttonText: 'Luyện tập' },
      { id: 'day5', title: '[DAY 5] Part 2 Câu hỏi When/Where/How', description: 'Nghe và điền từ', difficulty: 'Cấp độ: B1-B2', tags: ['Listening', 'Part 2'], buttonText: 'Luyện tập' },
      { id: 'day6', title: '[DAY 6] Part 2 Câu hỏi Yes/No', description: 'Nghe và điền từ', difficulty: 'Cấp độ: B1-B2', tags: ['Listening', 'Part 2'], buttonText: 'Luyện tập' },
      { id: 'day7', title: '[DAY 7] Part 3 Hội thoại ngắn', description: 'Nghe và điền từ', difficulty: 'Cấp độ: B1-B2', tags: ['Listening', 'Part 3'], buttonText: 'Luyện tập' },
      { id: 'day8', title: '[DAY 8] Part 3 Hội thoại dài', description: 'Nghe và điền từ', difficulty: 'Cấp độ: B1-B2', tags: ['Listening', 'Part 3'], buttonText: 'Luyện tập' }
    ],
    'basic-learning': [
      { id: 'grammar1', title: 'Ngữ pháp cơ bản - Thì hiện tại', description: 'Học các thì cơ bản', difficulty: 'Cấp độ: A1-A2', tags: ['Grammar', 'Basic'], buttonText: 'Bắt đầu' },
      { id: 'grammar2', title: 'Ngữ pháp cơ bản - Thì quá khứ', description: 'Học các thì cơ bản', difficulty: 'Cấp độ: A1-A2', tags: ['Grammar', 'Basic'], buttonText: 'Bắt đầu' },
      { id: 'grammar3', title: 'Ngữ pháp cơ bản - Thì tương lai', description: 'Học các thì cơ bản', difficulty: 'Cấp độ: A1-A2', tags: ['Grammar', 'Basic'], buttonText: 'Bắt đầu' },
      { id: 'vocab1', title: 'Từ vựng cơ bản - Gia đình', description: 'Học từ vựng cơ bản', difficulty: 'Cấp độ: A1-A2', tags: ['Vocabulary', 'Basic'], buttonText: 'Bắt đầu' },
      { id: 'vocab2', title: 'Từ vựng cơ bản - Công việc', description: 'Học từ vựng cơ bản', difficulty: 'Cấp độ: A1-A2', tags: ['Vocabulary', 'Basic'], buttonText: 'Bắt đầu' }
    ],
    roadmap: [
      { id: 'week1', title: 'Tuần 1 - Listening Part 1-2', description: 'Luyện nghe cơ bản', difficulty: 'Mục tiêu: 400-500', tags: ['Listening', 'Week 1'], buttonText: 'Bắt đầu' },
      { id: 'week2', title: 'Tuần 2 - Listening Part 3-4', description: 'Luyện nghe nâng cao', difficulty: 'Mục tiêu: 500-600', tags: ['Listening', 'Week 2'], buttonText: 'Bắt đầu' },
      { id: 'week3', title: 'Tuần 3 - Reading Part 5-6', description: 'Luyện đọc cơ bản', difficulty: 'Mục tiêu: 600-700', tags: ['Reading', 'Week 3'], buttonText: 'Bắt đầu' },
      { id: 'week4', title: 'Tuần 4 - Reading Part 7', description: 'Luyện đọc nâng cao', difficulty: 'Mục tiêu: 700-800', tags: ['Reading', 'Week 4'], buttonText: 'Bắt đầu' },
      { id: 'week5', title: 'Tuần 5 - Tổng hợp', description: 'Luyện đề tổng hợp', difficulty: 'Mục tiêu: 800+', tags: ['Full Test', 'Week 5'], buttonText: 'Bắt đầu' }
    ],
    speaking: [
      { id: 'speak1', title: 'Part 1 - Giới thiệu bản thân', description: 'Luyện nói cơ bản', difficulty: 'Cấp độ: A2-B1', tags: ['Speaking', 'Part 1'], buttonText: 'Luyện nói' },
      { id: 'speak2', title: 'Part 2 - Mô tả tranh', description: 'Luyện mô tả tranh', difficulty: 'Cấp độ: B1-B2', tags: ['Speaking', 'Part 2'], buttonText: 'Luyện nói' },
      { id: 'speak3', title: 'Part 3 - Trả lời câu hỏi', description: 'Luyện trả lời câu hỏi', difficulty: 'Cấp độ: B1-B2', tags: ['Speaking', 'Part 3'], buttonText: 'Luyện nói' },
      { id: 'speak4', title: 'Part 4 - Thảo luận', description: 'Luyện thảo luận', difficulty: 'Cấp độ: B2-C1', tags: ['Speaking', 'Part 4'], buttonText: 'Luyện nói' },
      { id: 'speak5', title: 'Part 5 - Thuyết trình', description: 'Luyện thuyết trình', difficulty: 'Cấp độ: B2-C1', tags: ['Speaking', 'Part 5'], buttonText: 'Luyện nói' }
    ]
  };
  
  // Dữ liệu Speaking - các bài nói chi tiết
  speakingData = {
    part1: {
      vocabulary: [] as SpeakingLesson[], // Sẽ load từ JSON
      sentence: [
        { id: 'meeting', title: 'Cuộc họp', description: '30 Câu chủ đề', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'movie', title: 'Xem phim', description: '30 Câu chủ đề', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'shopping', title: 'Mua sắm', description: '30 Câu chủ đề', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'communication', title: 'Giao tiếp', description: '30 Câu chủ đề', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'school', title: 'Trường học', description: '30 Câu chủ đề', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'dating', title: 'Hẹn hò', description: '30 Câu chủ đề', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' }
      ],
      paragraph: [
        { id: 'introduction', title: 'Giới thiệu bản thân', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' },
        { id: 'family', title: 'Gia đình', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' },
        { id: 'hometown', title: 'Quê hương', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' }
      ]
    },
    part2: {
      vocabulary: [
        { id: 'people', title: 'Mô tả người', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' },
        { id: 'objects', title: 'Mô tả vật', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' },
        { id: 'places', title: 'Mô tả nơi chốn', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' },
        { id: 'actions', title: 'Mô tả hành động', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' }
      ],
      sentence: [
        { id: 'describing', title: 'Cấu trúc mô tả', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'location', title: 'Vị trí và không gian', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'time', title: 'Thời gian và thứ tự', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' }
      ],
      paragraph: [
        { id: 'picture', title: 'Mô tả tranh chi tiết', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' },
        { id: 'comparison', title: 'So sánh và đối chiếu', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' }
      ]
    },
    part3: {
      vocabulary: [
        { id: 'questions', title: 'Từ vựng câu hỏi', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' },
        { id: 'answers', title: 'Từ vựng trả lời', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' },
        { id: 'opinions', title: 'Từ vựng ý kiến', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' }
      ],
      sentence: [
        { id: 'greeting', title: 'Câu chào hỏi', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'request', title: 'Câu yêu cầu', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'complaint', title: 'Câu phàn nàn', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'affirmative', title: 'Câu khẳng định', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' }
      ],
      paragraph: [
        { id: 'conversation', title: 'Hội thoại tự nhiên', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' },
        { id: 'interview', title: 'Phỏng vấn', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' }
      ]
    },
    part4: {
      vocabulary: [
        { id: 'discussion', title: 'Từ vựng thảo luận', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' },
        { id: 'debate', title: 'Từ vựng tranh luận', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' }
      ],
      sentence: [
        { id: 'agreement', title: 'Đồng ý/Phản đối', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'suggestion', title: 'Đề xuất/Gợi ý', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' }
      ],
      paragraph: [
        { id: 'group', title: 'Thảo luận nhóm', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' },
        { id: 'problem', title: 'Giải quyết vấn đề', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' }
      ]
    },
    part5: {
      vocabulary: [
        { id: 'presentation', title: 'Từ vựng thuyết trình', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' },
        { id: 'formal', title: 'Từ vựng trang trọng', description: '30 từ vựng', tags: ['Flashcard & Quiz'], buttonText: 'Luyện tập' }
      ],
      sentence: [
        { id: 'opening', title: 'Mở đầu thuyết trình', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' },
        { id: 'conclusion', title: 'Kết thúc thuyết trình', description: '30 Câu mẫu', tags: ['Flashcard & Speaking'], buttonText: 'Luyện tập' }
      ],
      paragraph: [
        { id: 'formal', title: 'Thuyết trình trang trọng', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' },
        { id: 'business', title: 'Thuyết trình kinh doanh', description: 'Luyện đoạn văn', tags: ['Speaking Practice'], buttonText: 'Luyện tập' }
      ]
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
    return this.exerciseData[this.activeLearningPath()];
  }
  
  // Lấy tiêu đề section - để hiển thị tên phần học
  getCurrentSectionTitle(): string {
    return this.sectionTitles[this.activeLearningPath()];
  }
  
  // Lấy bài học speaking - theo part và topic đã chọn
  getCurrentSpeakingLessons(): SpeakingLesson[] {
    const part = this.activeSpeakingPart();
    const topic = this.activeSpeakingTopic();
    
    // Nếu là Part 1 và Vocabulary, load từ JSON
    if (part === 'part1' && topic === 'vocabulary') {
      return this.pronunciationTopics.map((pronunciationTopic, index) => ({
        id: `pronunciation-${index}`, // ID sẽ là pronunciation-0, pronunciation-1, ...
        title: this.getPronunciationTopicTitle(pronunciationTopic),
        description: `${pronunciationTopic.list.length} từ vựng`,
        tags: ['Flashcard & Quiz'],
        buttonText: 'Luyện tập'
      }));
    }
    
    return this.speakingData[part][topic];
  }
  
  // Helper: Get pronunciation topic title
  getPronunciationTopicTitle(topic: PronunciationTopic): string {
    // Extract shorter name from full name
    // "Words with the sound a in Cat" -> "Âm /æ/ trong Cat"
    const match = topic.name.match(/sound (\w+) in (\w+)/i);
    if (match) {
      return `Âm /${topic.am}/ - ${match[2]}`;
    }
    // Fallback
    return topic.name.replace(/^Words with the\s+/i, '');
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
  
  // Chuyển đến trang luyện nói - điều hướng sang trang khác
  goToSpeakingPractice(topicId?: string) {
    // Nếu là pronunciation topic (từ JSON)
    if (topicId && topicId.startsWith('pronunciation-')) {
      // Extract index từ ID (pronunciation-0 -> 0)
      const topicIndex = parseInt(topicId.split('-')[1]);
      // Navigate với query param
      this.router.navigate(['/pronunciation-practice'], { 
        queryParams: { topic: topicIndex } 
      });
      return;
    }
    
    // Điều hướng đến các trang topic riêng biệt
    if (topicId) {
      // Map các ID cũ sang tên topic mới
      const topicMap: { [key: string]: string } = {
        'school': 'school',
        'hobby': 'hobby',
        'food': 'food',
        'shopping': 'shopping',
        'environment': 'environment',
        'work': 'work'
      };

      const targetTopic = topicMap[topicId] || topicId;
      this.router.navigate([`/${targetTopic}`]);
    } else {
      this.router.navigate(['/speaking-practice']);
    }
  }

  onImageError(event: any, type: string) {
    console.log(`Image error for ${type}:`, event);
    this.showFallback = true;
  }
}
