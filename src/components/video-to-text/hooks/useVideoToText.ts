 import { useState, useCallback, useRef } from 'react';
 import { FFmpeg } from '@ffmpeg/ffmpeg';
 import { fetchFile, toBlobURL } from '@ffmpeg/util';
 import { TranscriptionSegment } from '../types';
 import { formatTimeForSRT } from '../utils/timeUtils';
 import { extractAudioSegment, audioBufferToWavBlob } from '../utils/audioUtils';
 
 interface UseVideoToTextReturn {
   currentStep: number;
   setCurrentStep: (step: number) => void;
   videoFile: File | null;
   audioBlob: Blob | null;
   transcriptions: TranscriptionSegment[];
   setTranscriptions: React.Dispatch<React.SetStateAction<TranscriptionSegment[]>>;
   videoDuration: number;
   processing: boolean;
   progress: number;
   statusMessage: string;
   handleVideoFile: (file: File) => void;
   extractAudio: () => Promise<void>;
   startTranscription: (language: string) => Promise<void>;
   translateAll: () => Promise<void>;
   adjustTiming: () => void;
   mergeSegments: (indices: number[]) => void;
   splitSegment: (index: number) => void;
 }
 
 export function useVideoToText(): UseVideoToTextReturn {
   const [currentStep, setCurrentStep] = useState(1);
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
   const [transcriptions, setTranscriptions] = useState<TranscriptionSegment[]>([]);
   const [videoDuration, setVideoDuration] = useState(0);
   const [processing, setProcessing] = useState(false);
   const [progress, setProgress] = useState(0);
   const [statusMessage, setStatusMessage] = useState('');
   
   const ffmpegRef = useRef<FFmpeg | null>(null);
   const ffmpegLoaded = useRef(false);
 
   const handleVideoFile = useCallback((file: File) => {
     setVideoFile(file);
     
     // Get video duration
     const video = document.createElement('video');
     video.preload = 'metadata';
     video.onloadedmetadata = () => {
       setVideoDuration(video.duration);
       URL.revokeObjectURL(video.src);
     };
     video.src = URL.createObjectURL(file);
   }, []);
 
   const extractAudio = useCallback(async () => {
     if (!videoFile) return;
     
     setProcessing(true);
     setProgress(0);
     setStatusMessage('جاري تحميل معالج الفيديو...');
     
     try {
       // Initialize FFmpeg
       if (!ffmpegRef.current) {
         ffmpegRef.current = new FFmpeg();
       }
       
       if (!ffmpegLoaded.current) {
         const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
         await ffmpegRef.current.load({
           coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
           wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
         });
         ffmpegLoaded.current = true;
       }
       
       setProgress(20);
       setStatusMessage('جاري كتابة ملف الفيديو...');
       
       // Write video file
       await ffmpegRef.current.writeFile('input.mp4', await fetchFile(videoFile));
       
       setProgress(40);
       setStatusMessage('جاري استخراج الصوت...');
       
       // Extract audio
       await ffmpegRef.current.exec(['-i', 'input.mp4', '-q:a', '0', '-map', 'a', '-acodec', 'libmp3lame', 'audio.mp3']);
       
       setProgress(80);
       setStatusMessage('جاري قراءة ملف الصوت...');
       
       // Read audio file
       const audioData = await ffmpegRef.current.readFile('audio.mp3');
       // Handle both Uint8Array and string types from FFmpeg
       let audioBytes: Uint8Array;
       if (audioData instanceof Uint8Array) {
         audioBytes = audioData;
       } else if (typeof audioData === 'string') {
         // Convert base64 string to Uint8Array
         const binaryString = atob(audioData);
         audioBytes = new Uint8Array(binaryString.length);
         for (let i = 0; i < binaryString.length; i++) {
           audioBytes[i] = binaryString.charCodeAt(i);
         }
        } else {
          audioBytes = new Uint8Array(audioData as unknown as ArrayBuffer);
        }
        // Create a copy of the buffer to ensure it's a regular ArrayBuffer
        const buffer = new ArrayBuffer(audioBytes.length);
        const view = new Uint8Array(buffer);
        view.set(audioBytes);
        const blob = new Blob([buffer], { type: 'audio/mp3' });
       setAudioBlob(blob);
       
       setProgress(100);
       setStatusMessage('تم استخراج الصوت بنجاح!');
       
     } catch (error) {
       console.error('خطأ في استخراج الصوت:', error);
       setStatusMessage(`خطأ: ${error instanceof Error ? error.message : 'فشل استخراج الصوت'}`);
     } finally {
       setProcessing(false);
     }
   }, [videoFile]);
 
   const startTranscription = useCallback(async (language: string) => {
     if (!audioBlob) return;
     
     setProcessing(true);
     setProgress(0);
     setStatusMessage('جاري تحضير الصوت للتحويل...');
     
     try {
       const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
       
       if (!SpeechRecognition) {
         throw new Error('المتصفح لا يدعم التعرف على الكلام. يرجى استخدام Chrome.');
       }
       
       // Convert AudioBlob to AudioBuffer
       const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
       const arrayBuffer = await audioBlob.arrayBuffer();
       const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
       
       // Split audio into segments (30 seconds each)
       const segmentDuration = 30;
       const segments = Math.ceil(audioBuffer.duration / segmentDuration);
       
       setStatusMessage(`جاري تحويل ${segments} مقطع...`);
       
       const newTranscriptions: TranscriptionSegment[] = [];
       
       for (let i = 0; i < segments; i++) {
         const startTime = i * segmentDuration;
         const endTime = Math.min((i + 1) * segmentDuration, audioBuffer.duration);
         
         setProgress(Math.floor(((i + 1) / segments) * 100));
         setStatusMessage(`جاري تحويل المقطع ${i + 1} من ${segments}...`);
         
         // Extract segment
         const segmentBuffer = extractAudioSegment(audioBuffer, startTime, endTime);
         const segmentBlob = await audioBufferToWavBlob(segmentBuffer);
         
         // Transcribe segment using Web Speech API
         const text = await transcribeAudioSegment(segmentBlob, language);
         
         if (text) {
           newTranscriptions.push({
             id: i + 1,
             startTime: formatTimeForSRT(startTime),
             endTime: formatTimeForSRT(endTime),
             startSeconds: startTime,
             endSeconds: endTime,
             text: text,
             edited: false
           });
         }
       }
       
       setTranscriptions(newTranscriptions);
       setProgress(100);
       setStatusMessage('تم تحويل الصوت إلى نص بنجاح!');
       
     } catch (error) {
       console.error('خطأ في التحويل:', error);
       setStatusMessage(`خطأ: ${error instanceof Error ? error.message : 'فشل التحويل'}`);
     } finally {
       setProcessing(false);
     }
   }, [audioBlob]);
 
   const translateAll = useCallback(async () => {
     setProcessing(true);
     setStatusMessage('جاري الترجمة...');
     
     try {
       const updatedTranscriptions = [...transcriptions];
       
       for (let i = 0; i < updatedTranscriptions.length; i++) {
         const arabicText = updatedTranscriptions[i].text;
         
         if (arabicText.trim()) {
           const translatedText = await translateText(arabicText, 'ar', 'en');
           updatedTranscriptions[i].translation = translatedText;
         }
         
         setProgress(Math.floor(((i + 1) / updatedTranscriptions.length) * 100));
       }
       
       setTranscriptions(updatedTranscriptions);
       setStatusMessage('تمت الترجمة بنجاح!');
       
     } catch (error) {
       console.error('خطأ في الترجمة:', error);
       setStatusMessage('خطأ في الترجمة');
     } finally {
       setProcessing(false);
     }
   }, [transcriptions]);
 
   const adjustTiming = useCallback(() => {
     const updatedTranscriptions = [...transcriptions];
     
     updatedTranscriptions.forEach((segment, index) => {
       const wordCount = segment.text.split(/\s+/).length;
       const estimatedDuration = Math.max(2, Math.min(wordCount * 0.5, 10));
       
       if (index < updatedTranscriptions.length - 1) {
         segment.endSeconds = segment.startSeconds + estimatedDuration;
         segment.endTime = formatTimeForSRT(segment.endSeconds);
         
         updatedTranscriptions[index + 1].startSeconds = segment.endSeconds + 0.1;
         updatedTranscriptions[index + 1].startTime = formatTimeForSRT(updatedTranscriptions[index + 1].startSeconds);
       }
     });
     
     setTranscriptions(updatedTranscriptions);
   }, [transcriptions]);
 
   const mergeSegments = useCallback((indices: number[]) => {
     if (indices.length < 2) return;
     
     const sortedIndices = [...indices].sort((a, b) => a - b);
     
     let mergedText = '';
     const startTime = transcriptions[sortedIndices[0]].startTime;
     const endTime = transcriptions[sortedIndices[sortedIndices.length - 1]].endTime;
     
     sortedIndices.forEach(index => {
       mergedText += transcriptions[index].text + ' ';
     });
     
     const newSegment: TranscriptionSegment = {
       id: transcriptions.length + 1,
       startTime,
       endTime,
       startSeconds: transcriptions[sortedIndices[0]].startSeconds,
       endSeconds: transcriptions[sortedIndices[sortedIndices.length - 1]].endSeconds,
       text: mergedText.trim(),
       edited: true
     };
     
     const newTranscriptions = transcriptions.filter((_, index) => !sortedIndices.includes(index));
     newTranscriptions.splice(sortedIndices[0], 0, newSegment);
     
     // Re-number segments
     newTranscriptions.forEach((segment, index) => {
       segment.id = index + 1;
     });
     
     setTranscriptions(newTranscriptions);
   }, [transcriptions]);
 
   const splitSegment = useCallback((index: number) => {
     const segment = transcriptions[index];
     
     const words = segment.text.split(/\s+/);
     const midPoint = Math.floor(words.length / 2);
     
     const firstPart = words.slice(0, midPoint).join(' ');
     const secondPart = words.slice(midPoint).join(' ');
     
     const midTime = (segment.startSeconds + segment.endSeconds) / 2;
     
     const segment1: TranscriptionSegment = {
       id: segment.id,
       startTime: segment.startTime,
       endTime: formatTimeForSRT(midTime),
       startSeconds: segment.startSeconds,
       endSeconds: midTime,
       text: firstPart,
       edited: true
     };
     
     const segment2: TranscriptionSegment = {
       id: segment.id + 1,
       startTime: formatTimeForSRT(midTime + 0.1),
       endTime: segment.endTime,
       startSeconds: midTime + 0.1,
       endSeconds: segment.endSeconds,
       text: secondPart,
       edited: true
     };
     
     const newTranscriptions = [...transcriptions];
     newTranscriptions.splice(index, 1, segment1, segment2);
     
     // Re-number segments
     newTranscriptions.forEach((seg, idx) => {
       seg.id = idx + 1;
     });
     
     setTranscriptions(newTranscriptions);
   }, [transcriptions]);
 
   return {
     currentStep,
     setCurrentStep,
     videoFile,
     audioBlob,
     transcriptions,
     setTranscriptions,
     videoDuration,
     processing,
     progress,
     statusMessage,
     handleVideoFile,
     extractAudio,
     startTranscription,
     translateAll,
     adjustTiming,
     mergeSegments,
     splitSegment
   };
 }
 
 // Helper function to transcribe audio segment
 async function transcribeAudioSegment(audioBlob: Blob, language: string): Promise<string> {
   return new Promise((resolve) => {
     const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     const recognition = new SpeechRecognition();
     
     recognition.lang = language;
     recognition.continuous = true;
     recognition.interimResults = false;
     
     let finalText = '';
     
     recognition.onresult = (event: any) => {
       for (let i = event.resultIndex; i < event.results.length; i++) {
         if (event.results[i].isFinal) {
           finalText += event.results[i][0].transcript + ' ';
         }
       }
     };
     
     recognition.onend = () => {
       resolve(finalText.trim());
     };
     
     recognition.onerror = () => {
       resolve('');
     };
     
     // Play audio and start recognition
     const audioURL = URL.createObjectURL(audioBlob);
     const audio = new Audio(audioURL);
     
     audio.onloadeddata = () => {
       recognition.start();
       audio.play();
       
       setTimeout(() => {
         audio.pause();
         recognition.stop();
       }, audio.duration * 1000 + 1000);
     };
     
     audio.onerror = () => {
       resolve('');
     };
   });
 }
 
 // Helper function to translate text
 async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
   try {
     const response = await fetch(
       `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
     );
     const data = await response.json();
     return data[0][0][0];
   } catch {
     return `[مترجم]: ${text}`;
   }
 }