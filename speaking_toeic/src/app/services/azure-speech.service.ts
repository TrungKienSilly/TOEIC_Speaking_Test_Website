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
    
    // Sử dụng config hardcode trực tiếp
    this.config = {
      azure: {
        subscriptionKey: 'Your_key',// Thay thế bằng khóa thực tế
        serviceRegion: 'Your_region',// Thay thế bằng vùng thực tế
        tts: {
          usVoice: 'en-US-JennyNeural',
          ukVoice: 'en-GB-LibbyNeural'
        }
      }
    };
    console.log('Azure config loaded successfully');
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

  async assessPronunciation(
    referenceText: string, 
    timeoutMs = 5000,
    onReady?: (readyTimeMs: number) => void
  ): Promise<AssessmentResult> {
    if (!isPlatformBrowser(this.platformId)) throw new Error('Không hỗ trợ trên server');
    
    const startTime = performance.now();
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
    
    // Tính thời gian Azure khởi động
    const readyTime = Math.round(performance.now() - startTime);
    console.log(`✅ Azure sẵn sàng sau ${readyTime}ms`);
    
    // Callback thời gian khởi động
    if (onReady) {
      onReady(readyTime);
    }

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
        const pronScore = pa?.PronScore ?? 0;
        
        // 🎤 SPEECH-TO-TEXT: Hiển thị text người dùng đã nói
        const recognizedText = result.text || nbest?.Display || '';
        console.log('🗣️ Người dùng phát âm:', recognizedText || '(rỗng)');
        console.log('📝 Text mong đợi:', referenceText);
        
        if (!recognizedText || recognizedText.trim() === '') {
          console.warn('⚠️ Azure không nhận dạng được text nào!');
          console.log('✅ Khớp: KHÔNG');
        } else {
          console.log('✅ Khớp:', recognizedText.toLowerCase() === referenceText.toLowerCase() ? 'CÓ' : 'KHÔNG');
        }
        
        // LOGIC MỚI: Xử lý khi completeness = 0 (nói một phần từ)
        const words = nbest?.Words || [];
        
        if (completeness === 0 && words.length > 0) {
          // Người dùng chỉ nói một phần từ, nhưng Azure vẫn nhận dạng được
          console.warn('⚠️ CompletenessScore = 0 -> Chỉ nói một phần từ');
          
          const word = words[0];
          const syllables = word.Syllables || [];
          
          if (syllables.length > 0) {
            // Tính điểm dựa trên phần đã nói
            let totalSyllableScore = 0;
            syllables.forEach((syl: any) => {
              const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
              totalSyllableScore += sylScore;
              console.log(`📝 Âm tiết "${syl.Syllable}": ${sylScore} điểm`);
            });
            
            // Điểm trung bình của các âm đã nói, nhưng trừ penalty vì thiếu từ
            const avgScore = totalSyllableScore / syllables.length;
            // Penalty: 50% vì không nói đủ từ
            overall = Math.round(avgScore * 0.5);
            
            console.log('💡 Người dùng chỉ nói một phần từ:');
            console.log(`   - Số âm đã nói: ${syllables.length}`);
            console.log(`   - Điểm TB các âm: ${avgScore.toFixed(1)}`);
            console.log(`   - Điểm cuối (penalty 50%): ${overall}`);
            
            return { accuracy, completeness, fluency, overall, raw: parsed };
          } else {
            // Không có syllable data - dùng accuracy score nếu có
            if (accuracy > 0) {
              // Azure vẫn cho điểm accuracy mặc dù không có syllable detail
              overall = Math.round(accuracy * 0.3); // Penalty 70% vì thiếu từ
              console.log(`💡 Không có syllable data nhưng có accuracy: ${accuracy}`);
              console.log(`   - Điểm cuối (penalty 70%): ${overall}`);
            } else {
              overall = 0;
              console.log('💡 Không có dữ liệu âm tiết và accuracy -> 0 điểm');
            }
            return { accuracy, completeness, fluency, overall, raw: parsed };
          }
        }
        
        if (completeness === 0) {
          // Không nhận dạng được gì - nhưng kiểm tra xem có accuracy không
          console.warn('⚠️ CompletenessScore = 0 và không có Words data');
          if (accuracy > 0) {
            overall = Math.round(accuracy * 0.2); // Penalty 80%
            console.log(`💡 Có accuracy score: ${accuracy} -> Điểm cuối: ${overall}`);
          } else {
            overall = 0;
            console.log('💡 Không có bất kỳ dữ liệu nào -> 0 điểm');
          }
          return { accuracy, completeness, fluency, overall, raw: parsed };
        }
        
        // LOGIC CHÍNH: Tính điểm khi nói đủ từ (completeness > 0)
        if (words.length > 0 && completeness > 0) {
          const word = words[0];
          const syllables = word.Syllables || [];
          const totalSyllables = syllables.length;
          
          if (totalSyllables > 0) {
            // TRƯỜNG HỢP ĐẶC BIỆT: Từ một âm tiết
            if (totalSyllables === 1) {
              console.log('💡 Từ một âm tiết -> Điểm từ chi tiết phát âm (syllable score)');
              
              // Lấy điểm từ chi tiết phát âm (syllable)
              const sylScore = syllables[0].PronunciationAssessment?.AccuracyScore ?? 0;
              
              // Overall = syllable score
              overall = sylScore;
              
              // Accuracy cũng = syllable score (không dùng accuracy tổng thể)
              const adjustedAccuracy = sylScore;
              
              console.log('📊 Single Syllable Analysis:', {
                syllable: syllables[0].Syllable,
                syllableScore: sylScore,
                azureAccuracy: accuracy,
                adjustedAccuracy: sylScore,
                completeness,
                fluency,
                overall: sylScore
              });
              
              // Trả về với accuracy và overall điều chỉnh
              return { 
                accuracy: adjustedAccuracy, 
                completeness, 
                fluency, 
                overall, 
                raw: parsed 
              };
            }
            
            // TRƯỜNG HỢP THƯỜNG: Từ nhiều âm tiết (>= 2)
            console.log('💡 Từ nhiều âm tiết -> Áp dụng logic penalty');
            
            // Đếm số âm tiết bị thiếu (score = 0) và số âm tiết yếu (score < 60)
            let missingSyllableCount = 0; // Âm không được nhận dạng
            let badSyllableCount = 0; // Âm yếu (< 60 nhưng > 0)
            let totalSyllableScore = 0;
            
            syllables.forEach((syl: any) => {
              const sylScore = syl.PronunciationAssessment?.AccuracyScore ?? 0;
              totalSyllableScore += sylScore;
              
              if (sylScore === 0) {
                missingSyllableCount++;
                console.error(`❌ Âm tiết "${syl.Syllable}" KHÔNG được nhận dạng: 0 điểm`);
              } else if (sylScore < 60) {
                badSyllableCount++;
                console.log(`⚠️ Âm tiết "${syl.Syllable}" có điểm thấp: ${sylScore}`);
              }
            });
            
            // KIỂM TRA KHOẢNG CÁCH THỜI GIAN GIỮA CÁC ÂM TIẾT (Fluency Timing Check)
            let timingPausesCount = 0;
            const MAX_GAP_MS = 50; // 0.05 giây = 50ms
            const TIMING_PENALTY_PER_PAUSE = 5; // Penalty 5 điểm mỗi khoảng dừng
            
            for (let i = 0; i < syllables.length - 1; i++) {
              const currentSyl = syllables[i];
              const nextSyl = syllables[i + 1];
              
              // Offset và Duration tính bằng đơn vị 100-nanosecond (1ms = 10,000 units)
              const currentEnd = (currentSyl.Offset + currentSyl.Duration) / 10000; // Convert to ms
              const nextStart = nextSyl.Offset / 10000; // Convert to ms
              const gap = nextStart - currentEnd;
              
              if (gap > MAX_GAP_MS) {
                timingPausesCount++;
                console.warn(
                  `⏱️ Khoảng dừng giữa "${currentSyl.Syllable}" và "${nextSyl.Syllable}": ` +
                  `${gap.toFixed(1)}ms (> ${MAX_GAP_MS}ms)`
                );
              }
            }
            
            // Tính phần trăm mỗi âm tiết
            const percentPerSyllable = 100 / totalSyllables;
            
            // Tính penalty
            const missingPenalty = missingSyllableCount * percentPerSyllable;
            const badPenalty = badSyllableCount * percentPerSyllable;
            const totalPenalty = missingPenalty + badPenalty;
            
            // Tính số âm đã đọc được (không bị missing)
            const pronouncedSyllables = totalSyllables - missingSyllableCount;
            const pronouncedPercentage = (pronouncedSyllables / totalSyllables) * 100;
            
            console.log(`📝 Phân tích âm tiết: ${pronouncedSyllables}/${totalSyllables} âm được đọc (${pronouncedPercentage.toFixed(1)}%)`);
            
            // LOGIC MỚI: Điều chỉnh Completeness dựa trên số âm thực tế đọc được
            let adjustedCompleteness = completeness;
            
            // Nếu Azure trả về Completeness = 0 NHƯNG đã đọc được >= 1 âm
            if (completeness === 0 && pronouncedSyllables > 0) {
              // Tính completeness base từ số âm đã đọc
              // Công thức: pronouncedPercentage (100% nếu đọc hết, giảm dần nếu thiếu)
              adjustedCompleteness = Math.round(pronouncedPercentage);
              console.warn(`� Completeness gốc = 0 nhưng đã đọc ${pronouncedSyllables}/${totalSyllables} âm -> Completeness: ${adjustedCompleteness}`);
            } else if (missingSyllableCount > 0) {
              // Nếu Completeness > 0 nhưng có âm bị thiếu
              adjustedCompleteness = Math.max(0, completeness - missingPenalty);
              console.warn(`⚠️ Điều chỉnh Completeness: ${completeness} -> ${adjustedCompleteness.toFixed(0)} (thiếu ${missingSyllableCount} âm)`);
            }
            
            // LOGIC MỚI: Điều chỉnh Fluency hợp lý
            let adjustedFluency = fluency;
            
            // Nếu Azure trả về Fluency = 0 NHƯNG người dùng đã đọc >= 1 âm
            if (fluency === 0 && pronouncedSyllables > 0) {
              // Tính fluency base dựa trên số âm đã đọc
              // Công thức: pronouncedPercentage × 0.8 (điểm base tối đa 80 nếu đọc hết)
              adjustedFluency = Math.round(pronouncedPercentage * 0.8);
              console.warn(`🔧 Fluency gốc = 0 nhưng đã đọc ${pronouncedSyllables} âm -> Base fluency: ${adjustedFluency}`);
            }
            
            // Penalty 1: Nếu có âm bị thiếu -> giảm dựa trên tỷ lệ thiếu
            if (missingSyllableCount > 0 && adjustedFluency > 0) {
              const missingRatio = missingSyllableCount / totalSyllables;
              const flMissingPenalty = Math.round(adjustedFluency * missingRatio * 0.3); // Penalty 30% theo tỷ lệ (giảm từ 50% xuống)
              const beforePenalty = adjustedFluency;
              adjustedFluency = Math.max(0, adjustedFluency - flMissingPenalty);
              console.warn(
                `⚠️ Fluency penalty (missing): ${beforePenalty} -> ${adjustedFluency} ` +
                `(thiếu ${missingSyllableCount}/${totalSyllables} âm, penalty: ${flMissingPenalty})`
              );
            }
            
            // Penalty 2: Nếu có khoảng dừng quá lâu giữa các âm tiết
            if (timingPausesCount > 0 && adjustedFluency > 0) {
              const timingPenalty = timingPausesCount * TIMING_PENALTY_PER_PAUSE;
              const beforePenalty = adjustedFluency;
              adjustedFluency = Math.max(0, adjustedFluency - timingPenalty);
              console.warn(
                `⏱️ Fluency penalty (timing): ${beforePenalty} -> ${adjustedFluency} ` +
                `(${timingPausesCount} khoảng dừng × ${TIMING_PENALTY_PER_PAUSE} điểm)`
              );
            }
            
            // Đảm bảo fluency ít nhất bằng pronouncedPercentage × 0.5 nếu đã đọc được âm
            if (pronouncedSyllables > 0) {
              const minFluency = Math.round(pronouncedPercentage * 0.5);
              if (adjustedFluency < minFluency) {
                console.warn(`🔧 Tăng fluency lên mức tối thiểu: ${adjustedFluency} -> ${minFluency}`);
                adjustedFluency = minFluency;
              }
            }
            
            const baseScore = pronScore < accuracy ? pronScore : accuracy;
            overall = Math.max(0, Math.round(baseScore - totalPenalty));
            
            console.log('📊 Multi-Syllable Analysis:', {
              totalSyllables,
              percentPerSyllable: percentPerSyllable.toFixed(2) + '%',
              missingSyllables: missingSyllableCount,
              badSyllables: badSyllableCount,
              timingPauses: timingPausesCount,
              missingPenalty: missingPenalty.toFixed(2) + '%',
              badPenalty: badPenalty.toFixed(2) + '%',
              totalPenalty: totalPenalty.toFixed(2) + '%',
              timingPenalty: timingPausesCount * TIMING_PENALTY_PER_PAUSE,
              baseScore,
              finalScore: overall,
              adjustedCompleteness: adjustedCompleteness.toFixed(0),
              adjustedFluency: adjustedFluency.toFixed(0)
            });
            
            // Trả về điểm đã điều chỉnh
            return { 
              accuracy, 
              completeness: Math.round(adjustedCompleteness), 
              fluency: Math.round(adjustedFluency), 
              overall, 
              raw: parsed 
            };
          } else {
            // Không có syllable data, dùng logic cũ
            if (pronScore < accuracy) {
              overall = pronScore;
            } else {
              overall = accuracy;
            }
          }
        } else if (completeness === 0) {
          // Từ không được phát âm đầy đủ -> điểm rất thấp
          console.warn('⚠️ CompletenessScore = 0 -> Từ không được nói hoặc thiếu');
          overall = Math.min(20, accuracy);
        } else {
          // Fallback: dùng logic so sánh pronScore vs accuracy
          if (pronScore < accuracy) {
            overall = pronScore;
          } else {
            overall = accuracy;
          }
        }
        
        console.log('Điểm chấm:', { accuracy, completeness, fluency, pronScore, overall });
        return { accuracy, completeness, fluency, overall, raw: parsed };
      } catch (err) {
        console.error('Lỗi parse JSON:', err);
        return { accuracy: 0, completeness: 0, fluency: 0, overall: 0, raw: paJson };
      }
    } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
      // NoMatch: Azure nghe được nhưng không khớp tốt
      console.warn('⚠️ NoMatch: Azure không nhận dạng được từ chính xác');
      
      const recognizedText = result.text?.toLowerCase().replace(/[.,!?]/g, '') || '';
      const expectedText = referenceText.toLowerCase();
      
      console.log('🗣️ Người dùng phát âm:', recognizedText || '(không nhận dạng được)');
      console.log('📝 Text mong đợi:', expectedText);
      
      if (!recognizedText || recognizedText.trim() === '') {
        console.warn('💡 Gợi ý: Có thể bạn nói quá nhỏ, quá nhanh, hoặc chỉ nói một phần từ');
        return { 
          accuracy: 0, 
          completeness: 0, 
          fluency: 0, 
          overall: 0, 
          raw: { text: result.text, reason: 'NoMatch - No text recognized' } 
        };
      }
      
      // Tính điểm đơn giản dựa trên text match
      const similarity = recognizedText === expectedText ? 70 : 30;
      console.log(`✅ Khớp: KHÔNG (độ tương đồng: ${similarity}%)`);
      
      return { 
        accuracy: similarity, 
        completeness: similarity, 
        fluency: Math.max(40, similarity - 10), 
        overall: similarity, 
        raw: { text: result.text, reason: result.reason } 
      };
    } else {
      throw new Error(`Lỗi nhận dạng: Reason ${result.reason}`);
    }
  }
}
