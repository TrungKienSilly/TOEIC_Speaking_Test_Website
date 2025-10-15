import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Interface cho feedback
export interface FeedbackDetail {
  feedback: string;
}

export interface FeedbackLevel {
  level: string; // "Excellent", "Good", "Bad"
  description: string;
  detail: FeedbackDetail[];
}

// Interface cho từ vựng
export interface WordItem {
  stt: number;
  word: string;
  ipa: string;
  translation: string;
  partOfSpeech: string;
}

export interface PronunciationTopic {
  name: string; // "Words with the sound a in Cat"
  level: string; // "basic"
  am: string; // "æ" - âm tiết
  list: WordItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PronunciationDataService {
  private feedbackData: FeedbackLevel[] = [];
  private pronunciationData: PronunciationTopic[] = [];
  private dataLoaded = false;

  constructor(private http: HttpClient) {}

  // Load dữ liệu từ file JSON
  async loadData(): Promise<void> {
    if (this.dataLoaded) {
      console.log('⚠️ Data already loaded, skipping...');
      return;
    }

    try {
      console.log('📥 Loading pronunciation data from JSON files...');
      
      // Load feedback data
      const feedbackPromise = this.http.get<FeedbackLevel[]>('assets/data/feebackPronunciation.json')
        .pipe(
          catchError((err) => {
            console.error('❌ Error loading feedback:', err);
            return of([]);
          })
        )
        .toPromise();

      // Load pronunciation word data
      const pronunciationPromise = this.http.get<PronunciationTopic[]>('assets/data/dataPronunciationWord.json')
        .pipe(
          catchError((err) => {
            console.error('❌ Error loading pronunciation words:', err);
            return of([]);
          })
        )
        .toPromise();

      const [feedback, pronunciation] = await Promise.all([feedbackPromise, pronunciationPromise]);

      this.feedbackData = feedback || [];
      this.pronunciationData = pronunciation || [];
      this.dataLoaded = true;

      console.log('✅ Loaded feedback data:', this.feedbackData.length, 'levels');
      console.log('✅ Loaded pronunciation data:', this.pronunciationData.length, 'topics');
      
      if (this.feedbackData.length === 0) {
        console.warn('⚠️ No feedback data loaded! Check if assets/data/feebackPronunciation.json exists');
      }
      if (this.pronunciationData.length === 0) {
        console.warn('⚠️ No pronunciation data loaded! Check if assets/data/dataPronunciationWord.json exists');
      }
    } catch (error) {
      console.error('❌ Error loading pronunciation data:', error);
      this.feedbackData = [];
      this.pronunciationData = [];
    }
  }

  // Lấy feedback theo điểm số (0-100)
  getFeedbackByScore(score: number): string {
    if (!this.dataLoaded) {
      return 'Đang tải dữ liệu...';
    }

    let level: FeedbackLevel | undefined;

    if (score >= 80) {
      // Excellent: 80-100 điểm
      level = this.feedbackData.find(f => f.level === 'Excellent');
    } else if (score >= 50) {
      // Good: 50-80 điểm
      level = this.feedbackData.find(f => f.level === 'Good');
    } else {
      // Bad: 0-50 điểm
      level = this.feedbackData.find(f => f.level === 'Bad');
    }

    if (!level || !level.detail || level.detail.length === 0) {
      return 'Bạn đã cố gắng rất tốt!';
    }

    // Random một feedback từ danh sách
    const randomIndex = Math.floor(Math.random() * level.detail.length);
    return level.detail[randomIndex].feedback;
  }

  // Lấy danh sách feedback theo level
  getFeedbacksByLevel(levelName: 'Excellent' | 'Good' | 'Bad'): string[] {
    const level = this.feedbackData.find(f => f.level === levelName);
    if (!level || !level.detail) {
      return [];
    }
    return level.detail.map(d => d.feedback);
  }

  // Lấy tất cả pronunciation topics
  getAllTopics(): PronunciationTopic[] {
    return this.pronunciationData;
  }

  // Lấy topic theo âm tiết (am)
  getTopicByPhoneme(phoneme: string): PronunciationTopic | undefined {
    return this.pronunciationData.find(t => t.am === phoneme);
  }

  // Lấy topic theo tên
  getTopicByName(name: string): PronunciationTopic | undefined {
    return this.pronunciationData.find(t => t.name === name);
  }

  // Lấy topic theo level
  getTopicsByLevel(level: string): PronunciationTopic[] {
    return this.pronunciationData.filter(t => t.level === level);
  }

  // Lấy tất cả từ vựng từ một topic
  getWordsByTopic(topicName: string): WordItem[] {
    const topic = this.getTopicByName(topicName);
    return topic ? topic.list : [];
  }

  // Lấy danh sách tất cả các âm tiết
  getAllPhonemes(): string[] {
    return this.pronunciationData.map(t => t.am);
  }

  // Kiểm tra data đã load chưa
  isDataLoaded(): boolean {
    return this.dataLoaded;
  }
}
