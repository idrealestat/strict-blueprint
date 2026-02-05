 export interface TranscriptionSegment {
   id: number;
   startTime: string;
   endTime: string;
   startSeconds: number;
   endSeconds: number;
   text: string;
   translation?: string;
   edited: boolean;
 }
 
 export interface AppState {
   currentStep: number;
   videoFile: File | null;
   audioBlob: Blob | null;
   transcriptions: TranscriptionSegment[];
   translations: string[];
   videoDuration: number;
   processing: boolean;
 }
 
 export interface VideoInfo {
   duration: number;
   size: number;
   name: string;
 }