 export function formatTime(seconds: number): string {
   const hours = Math.floor(seconds / 3600);
   const minutes = Math.floor((seconds % 3600) / 60);
   const secs = Math.floor(seconds % 60);
 
   if (hours > 0) {
     return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   } else {
     return `${minutes}:${secs.toString().padStart(2, '0')}`;
   }
 }
 
 export function formatTimeForSRT(seconds: number): string {
   const hours = Math.floor(seconds / 3600);
   const minutes = Math.floor((seconds % 3600) / 60);
   const secs = Math.floor(seconds % 60);
   const ms = Math.floor((seconds % 1) * 1000);
 
   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
 }
 
 export function parseTimeToSeconds(timeStr: string): number {
   const parts = timeStr.split(':');
   if (parts.length === 3) {
     const [hours, minutes, secondsWithMs] = parts;
     const [seconds, ms] = secondsWithMs.split('.');
     return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + (parseInt(ms) || 0) / 1000;
   }
   return 0;
 }