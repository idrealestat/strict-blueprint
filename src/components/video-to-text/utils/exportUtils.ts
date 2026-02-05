 import { TranscriptionSegment } from '../types';
 
 export function generateSRTContent(transcriptions: TranscriptionSegment[]): string {
   let srt = '';
   
   transcriptions.forEach((segment, index) => {
     srt += `${index + 1}\n`;
     srt += `${segment.startTime.replace('.', ',')} --> ${segment.endTime.replace('.', ',')}\n`;
     srt += `${segment.translation || segment.text}\n\n`;
   });
   
   return srt;
 }
 
 export function generateVTTContent(transcriptions: TranscriptionSegment[]): string {
   let vtt = 'WEBVTT\n\n';
   
   transcriptions.forEach((segment) => {
     vtt += `${segment.startTime} --> ${segment.endTime}\n`;
     vtt += `${segment.translation || segment.text}\n\n`;
   });
   
   return vtt;
 }
 
 export function generateCapcutContent(transcriptions: TranscriptionSegment[]): string {
   let content = 'Time,Text\n';
   
   transcriptions.forEach(segment => {
     const timeInSeconds = segment.startSeconds;
     const minutes = Math.floor(timeInSeconds / 60);
     const seconds = Math.floor(timeInSeconds % 60);
     const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
     
     const timeFormat = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
     content += `${timeFormat},${segment.translation || segment.text}\n`;
   });
   
   return content;
 }
 
 export function downloadFile(content: string, filename: string, type: string): void {
   const blob = new Blob([content], { type: type });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
 }
 
 export function saveProject(transcriptions: TranscriptionSegment[], videoDuration: number, fileName?: string): void {
   const project = {
     transcriptions,
     videoInfo: {
       duration: videoDuration,
       fileName
     },
     timestamp: new Date().toISOString()
   };
   
   const content = JSON.stringify(project, null, 2);
   downloadFile(content, 'project_transcript.json', 'application/json');
 }