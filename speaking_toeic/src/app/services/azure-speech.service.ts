import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export interface AzureConfig {
  azure: {
    subscriptionKey: string;
    serviceRegion: string;
    tts?: {
      usVoice?: string;
      ukVoice?: string;
    }
  }
}

export interface AssessmentResult {
  accuracy: number;
  completeness: number;
  fluency: number;
  overall: number;
  raw?: any;
}

@Injectable({ providedIn: 'root' })
export class AzureSpeechService {
  private config: AzureConfig | null = null;
  private loadingPromise: Promise<void> | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private async ensureConfigLoaded(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Azure Speech chỉ hoạt động trên browser');
    }
    if (this.config) return;
    if (!this.loadingPromise) {
      this.loadingPromise = fetch('/config.json')
        .then(async r => {
          if (!r.ok) throw new Error(`Không tải được config.json: ${r.status}`);
          this.config = await r.json();
          console.log('Azure config loaded successfully');
        })
        .catch(err => {
          console.error('Lỗi tải config.json:', err);
          // Fallback: dùng config hardcode nếu không tải được file
          this.config = {
            azure: {
              subscriptionKey: 'Your Azure Subscription Key',
              serviceRegion: 'eastus',
              tts: {
                usVoice: 'en-US-JennyNeural',
                ukVoice: 'en-GB-LibbyNeural'
              }
            }
          };
          console.warn('Sử dụng Azure config mặc định (hardcoded)');
        });
    }
    return this.loadingPromise;
  }

  private buildSpeechConfig(): SpeechSDK.SpeechConfig {
    if (!this.config) throw new Error('Config Azure chưa sẵn sàng');
    const { subscriptionKey, serviceRegion } = this.config.azure;
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    return speechConfig;
  }

  async speak(text: string, variant: 'us' | 'uk' = 'us'): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.ensureConfigLoaded();
    const speechConfig = this.buildSpeechConfig();

    // Chọn giọng
    const us = this.config?.azure.tts?.usVoice || 'en-US-JennyNeural';
    const uk = this.config?.azure.tts?.ukVoice || 'en-GB-LibbyNeural';
    speechConfig.speechSynthesisVoiceName = variant === 'us' ? us : uk;

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

    return new Promise<void>((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result: SpeechSDK.SpeechSynthesisResult) => {
          synthesizer.close();
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            resolve();
          } else {
            reject(new Error('TTS thất bại'));
          }
        },
        (error: any) => {
          synthesizer.close();
          reject(error);
        }
      );
    });
  }

  async assessPronunciation(referenceText: string, timeoutMs = 5000): Promise<AssessmentResult> {
    if (!isPlatformBrowser(this.platformId)) throw new Error('Không hỗ trợ trên server');
    await this.ensureConfigLoaded();

    console.log(`Bắt đầu chấm điểm cho từ: "${referenceText}", timeout: ${timeoutMs}ms`);
    
    const speechConfig = this.buildSpeechConfig();
    // Ngôn ngữ nhận dạng: mặc định en-US, có thể cho phép chọn sau
    speechConfig.speechRecognitionLanguage = 'en-US';

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    // Áp dụng Pronunciation Assessment
    const paConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    paConfig.nbestPhonemeCount = 3;
    paConfig.applyTo(recognizer);

    const result = await new Promise<SpeechSDK.SpeechRecognitionResult>((resolve, reject) => {
      let timeoutId: any;
      let isCompleted = false;
      
      // Cleanup timeout - chỉ để dọn dẹp, không reject
      timeoutId = setTimeout(() => {
        if (!isCompleted) {
          console.warn(`Cleanup sau ${timeoutMs}ms - Azure vẫn đang xử lý...`);
          try { recognizer.stopContinuousRecognitionAsync(() => {}, () => {}); } catch {}
        }
      }, timeoutMs);

      recognizer.recognizeOnceAsync(
        (r: SpeechSDK.SpeechRecognitionResult) => {
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutId);
            console.log(`✅ Nhận dạng hoàn tất. Reason: ${r.reason}, Text: "${r.text}"`);
            try { recognizer.close(); } catch {}
            resolve(r);
          }
        },
        (err: any) => {
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutId);
            console.error('❌ Lỗi recognizeOnceAsync:', err);
            try { recognizer.close(); } catch {}
            reject(err);
          }
        }
      );
      
      // Backup timeout chỉ khi thực sự cần thiết (15s)
      setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timeoutId);
          console.error('⏰ Hard timeout - Azure không phản hồi');
          try { recognizer.close(); } catch {}
          reject(new Error('Azure không phản hồi sau 15 giây'));
        }
      }, 15000);
    });

    // Parse Pronunciation Assessment JSON
    const paJson = result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult);
    let accuracy = 0, completeness = 0, fluency = 0, overall = 0;
    
    if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
      // Nhận dạng thành công, parse điểm
      try {
        const parsed = JSON.parse(paJson);
        const nbest = parsed?.NBest?.[0];
        const pa = nbest?.PronunciationAssessment;
        accuracy = pa?.AccuracyScore ?? 0;
        completeness = pa?.CompletenessScore ?? 0;
        fluency = pa?.FluencyScore ?? 0;
        overall = pa?.PronScore ?? Math.round((accuracy + completeness + fluency) / 3);
        console.log('Điểm chấm:', { accuracy, completeness, fluency, overall });
        return { accuracy, completeness, fluency, overall, raw: parsed };
      } catch (err) {
        console.error('Lỗi parse JSON:', err);
        return { accuracy: 0, completeness: 0, fluency: 0, overall: 0, raw: paJson };
      }
    } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
      // NoMatch: Azure nghe được nhưng không khớp tốt -> trả điểm dựa trên độ tương đồng text
      console.warn('NoMatch: Phát âm không đủ rõ, tính điểm dựa trên text nhận dạng');
      const recognizedText = result.text.toLowerCase().replace(/[.,!?]/g, '');
      const expectedText = referenceText.toLowerCase();
      
      // Tính điểm đơn giản dựa trên text match
      const similarity = recognizedText === expectedText ? 70 : 40;
      console.log(`Text match: "${recognizedText}" vs "${expectedText}" -> ${similarity}%`);
      
      return { 
        accuracy: similarity, 
        completeness: similarity, 
        fluency: Math.max(50, similarity - 10), 
        overall: similarity, 
        raw: { text: result.text, reason: result.reason } 
      };
    } else {
      throw new Error(`Lỗi nhận dạng: Reason ${result.reason}`);
    }
  }
}
