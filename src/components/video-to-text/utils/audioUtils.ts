 export function extractAudioSegment(audioBuffer: AudioBuffer, startTime: number, endTime: number): AudioBuffer {
   const sampleRate = audioBuffer.sampleRate;
   const startSample = Math.floor(startTime * sampleRate);
   const endSample = Math.floor(endTime * sampleRate);
   const frameCount = endSample - startSample;
 
   const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
   const newBuffer = audioContext.createBuffer(
     audioBuffer.numberOfChannels,
     frameCount,
     sampleRate
   );
 
   for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
     const channelData = audioBuffer.getChannelData(channel);
     const newChannelData = newBuffer.getChannelData(channel);
 
     for (let i = 0; i < frameCount; i++) {
       newChannelData[i] = channelData[startSample + i];
     }
   }
 
   return newBuffer;
 }
 
 function writeString(view: DataView, offset: number, string: string): void {
   for (let i = 0; i < string.length; i++) {
     view.setUint8(offset + i, string.charCodeAt(i));
   }
 }
 
 export async function audioBufferToWavBlob(audioBuffer: AudioBuffer): Promise<Blob> {
   const sampleRate = audioBuffer.sampleRate;
   const numberOfChannels = audioBuffer.numberOfChannels;
   const length = audioBuffer.length * numberOfChannels * 2;
 
   const buffer = new ArrayBuffer(44 + length);
   const view = new DataView(buffer);
 
   // WAV header
   writeString(view, 0, 'RIFF');
   view.setUint32(4, 36 + length, true);
   writeString(view, 8, 'WAVE');
   writeString(view, 12, 'fmt ');
   view.setUint32(16, 16, true);
   view.setUint16(20, 1, true);
   view.setUint16(22, numberOfChannels, true);
   view.setUint32(24, sampleRate, true);
   view.setUint32(28, sampleRate * numberOfChannels * 2, true);
   view.setUint16(32, numberOfChannels * 2, true);
   view.setUint16(34, 16, true);
   writeString(view, 36, 'data');
   view.setUint32(40, length, true);
 
   // Audio data
   const offset = 44;
   const channels: Float32Array[] = [];
 
   for (let i = 0; i < numberOfChannels; i++) {
     channels.push(audioBuffer.getChannelData(i));
   }
 
   let index = 0;
   for (let i = 0; i < audioBuffer.length; i++) {
     for (let channel = 0; channel < numberOfChannels; channel++) {
       const sample = Math.max(-1, Math.min(1, channels[channel][i]));
       view.setInt16(offset + index, sample * 0x7FFF, true);
       index += 2;
     }
   }
 
   return new Blob([buffer], { type: 'audio/wav' });
 }