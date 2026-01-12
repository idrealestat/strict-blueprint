/**
 * notificationSounds.ts
 * إنشاء أصوات إشعارات باستخدام Web Audio API
 */

// دالة لإنشاء صوت بسيط
function createTone(
  frequency: number,
  duration: number,
  volume: number = 0.5,
  type: OscillatorType = 'sine'
): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;
      
      // تلاشي تدريجي
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
      
      setTimeout(() => {
        audioContext.close();
        resolve();
      }, duration * 1000);
    } catch (e) {
      console.log('Could not create tone');
      resolve();
    }
  });
}

// أصوات مختلفة للإشعارات
export const NotificationSounds = {
  // الصوت الافتراضي - نغمة بسيطة
  async default(volume: number = 0.5) {
    await createTone(800, 0.15, volume, 'sine');
    await new Promise(r => setTimeout(r, 50));
    await createTone(1000, 0.15, volume, 'sine');
  },

  // صوت جرس
  async bell(volume: number = 0.5) {
    await createTone(1200, 0.3, volume, 'sine');
    await new Promise(r => setTimeout(r, 100));
    await createTone(1200, 0.2, volume * 0.7, 'sine');
  },

  // رنة موسيقية
  async chime(volume: number = 0.5) {
    await createTone(523, 0.12, volume, 'sine'); // C5
    await new Promise(r => setTimeout(r, 80));
    await createTone(659, 0.12, volume, 'sine'); // E5
    await new Promise(r => setTimeout(r, 80));
    await createTone(784, 0.2, volume, 'sine'); // G5
  },

  // صوت نجاح
  async success(volume: number = 0.5) {
    await createTone(523, 0.1, volume, 'sine'); // C5
    await new Promise(r => setTimeout(r, 50));
    await createTone(659, 0.1, volume, 'sine'); // E5
    await new Promise(r => setTimeout(r, 50));
    await createTone(784, 0.15, volume, 'sine'); // G5
    await new Promise(r => setTimeout(r, 50));
    await createTone(1047, 0.25, volume, 'sine'); // C6
  },

  // صوت تنبيه
  async alert(volume: number = 0.5) {
    await createTone(440, 0.15, volume, 'square');
    await new Promise(r => setTimeout(r, 100));
    await createTone(440, 0.15, volume, 'square');
    await new Promise(r => setTimeout(r, 100));
    await createTone(440, 0.2, volume, 'square');
  },

  // صوت فرصة ذكية
  async opportunity(volume: number = 0.5) {
    await createTone(698, 0.1, volume, 'sine'); // F5
    await new Promise(r => setTimeout(r, 60));
    await createTone(880, 0.1, volume, 'sine'); // A5
    await new Promise(r => setTimeout(r, 60));
    await createTone(1047, 0.15, volume, 'sine'); // C6
    await new Promise(r => setTimeout(r, 60));
    await createTone(1319, 0.25, volume, 'sine'); // E6
  },
};

// دالة لتشغيل صوت حسب الاسم
export async function playNotificationSoundByName(
  soundName: string,
  volume: number = 0.5
): Promise<void> {
  const normalizedVolume = Math.max(0, Math.min(1, volume / 100));
  
  switch (soundName) {
    case 'default':
      await NotificationSounds.default(normalizedVolume);
      break;
    case 'bell':
      await NotificationSounds.bell(normalizedVolume);
      break;
    case 'chime':
      await NotificationSounds.chime(normalizedVolume);
      break;
    case 'success':
      await NotificationSounds.success(normalizedVolume);
      break;
    case 'alert':
      await NotificationSounds.alert(normalizedVolume);
      break;
    case 'opportunity':
      await NotificationSounds.opportunity(normalizedVolume);
      break;
    default:
      await NotificationSounds.default(normalizedVolume);
  }
}
