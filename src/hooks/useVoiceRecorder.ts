import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceRecorderOptions {
  // مدة الصمت قبل الإيقاف التلقائي (بالمللي ثانية)
  silenceTimeout?: number;
  // الحد الأدنى لمستوى الصوت للاعتبار كنشاط
  silenceThreshold?: number;
  // الحد الأقصى لمدة التسجيل (بالثواني)
  maxDuration?: number;
  // تفعيل الإيقاف التلقائي عند الصمت
  autoStopOnSilence?: boolean;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ base64: string; mimeType: string } | null>;
  cancelRecording: () => void;
  audioLevel: number; // مستوى الصوت الحالي (0-1)
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const {
    silenceTimeout = 1500, // 1.5 ثانية صمت
    silenceThreshold = 0.02, // حد أدنى للصوت
    maxDuration = 30, // 30 ثانية كحد أقصى
    autoStopOnSilence = true,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const hasSpokenRef = useRef<boolean>(false);
  const stopPromiseRef = useRef<{
    resolve: (value: { base64: string; mimeType: string } | null) => void;
  } | null>(null);

  // تنظيف عند unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // مراقبة مستوى الصوت للكشف عن الصمت
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // حساب متوسط مستوى الصوت
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = average / 255;
    setAudioLevel(normalizedLevel);

    // التحقق من نشاط الصوت
    if (normalizedLevel > silenceThreshold) {
      lastSoundTimeRef.current = Date.now();
      hasSpokenRef.current = true; // المستخدم تكلم
      
      // إلغاء مؤقت الصمت إذا كان موجوداً
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else if (autoStopOnSilence && hasSpokenRef.current) {
      // المستخدم تكلم ثم صمت - نبدأ مؤقت الصمت
      const silenceDuration = Date.now() - lastSoundTimeRef.current;
      
      if (silenceDuration >= silenceTimeout && !silenceTimerRef.current) {
        console.log('🔇 Silence detected, auto-stopping...');
        // إيقاف التسجيل تلقائياً
        stopRecordingInternal();
        return;
      }
    }

    // استمرار المراقبة
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, [isRecording, silenceThreshold, silenceTimeout, autoStopOnSilence]);

  const stopRecordingInternal = useCallback(() => {
    if (!mediaRecorderRef.current || !streamRef.current) {
      if (stopPromiseRef.current) {
        stopPromiseRef.current.resolve(null);
        stopPromiseRef.current = null;
      }
      return;
    }

    // إيقاف المراقبة
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // إيقاف العداد
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // إيقاف مؤقت الصمت
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // طلب إذن الميكروفون
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        }
      });
      
      streamRef.current = stream;
      
      // إعداد Audio Context لمراقبة مستوى الصوت
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // إعادة تعيين متغيرات الكشف عن الصوت
      lastSoundTimeRef.current = Date.now();
      hasSpokenRef.current = false;
      
      // اختيار نوع الترميز المناسب
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // default
          }
        }
      }
      
      const recorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordedMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: recordedMimeType });
        setAudioBlob(blob);
        
        console.log('Recording stopped, blob size:', blob.size, 'type:', recordedMimeType);

        // تحويل إلى base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          
          if (stopPromiseRef.current) {
            stopPromiseRef.current.resolve({ base64: base64Data, mimeType: recordedMimeType });
            stopPromiseRef.current = null;
          }
        };
        reader.onerror = () => {
          console.error('Error reading audio blob');
          if (stopPromiseRef.current) {
            stopPromiseRef.current.resolve(null);
            stopPromiseRef.current = null;
          }
        };
        reader.readAsDataURL(blob);

        // إيقاف جميع المسارات
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // إغلاق Audio Context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      // بدء التسجيل
      mediaRecorder.start(100);
      setIsRecording(true);

      // عداد مدة التسجيل
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
        
        // إيقاف تلقائي عند الوصول للحد الأقصى
        if (elapsed >= maxDuration) {
          console.log('⏱️ Max duration reached, auto-stopping...');
          stopRecordingInternal();
        }
      }, 100);

      // بدء مراقبة مستوى الصوت
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);

      console.log('Recording started with mimeType:', mimeType || 'default');

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, [maxDuration, monitorAudioLevel, stopRecordingInternal]);

  const stopRecording = useCallback(async (): Promise<{ base64: string; mimeType: string } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !streamRef.current) {
        resolve(null);
        return;
      }

      stopPromiseRef.current = { resolve };
      stopRecordingInternal();
    });
  }, [stopRecordingInternal]);

  const cancelRecording = useCallback(() => {
    // إيقاف المراقبة
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // إيقاف العداد
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // إيقاف مؤقت الصمت
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // إيقاف التسجيل
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // إيقاف المسارات
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // إغلاق Audio Context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    chunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioBlob(null);
    setAudioLevel(0);
    
    if (stopPromiseRef.current) {
      stopPromiseRef.current.resolve(null);
      stopPromiseRef.current = null;
    }
  }, []);

  return {
    isRecording,
    recordingDuration,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    audioLevel
  };
}
