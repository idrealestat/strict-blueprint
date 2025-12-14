/**
 * imageStorage.ts
 * نظام تخزين الصور
 */

const IMAGE_STORAGE_KEY = 'wasata_images';

interface StoredImage {
  id: string;
  url: string;
  name?: string;
  type?: string;
  uploadedAt: string;
}

/**
 * الحصول على صورة بالمعرف
 */
export function getImage(imageId: string): string | null {
  try {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    if (stored) {
      const images: StoredImage[] = JSON.parse(stored);
      const image = images.find(img => img.id === imageId);
      return image?.url || null;
    }
  } catch (error) {
    console.error('خطأ في قراءة الصور:', error);
  }
  return null;
}

/**
 * حفظ صورة جديدة
 */
export function saveImage(imageId: string, url: string, name?: string): void {
  try {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    const images: StoredImage[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = images.findIndex(img => img.id === imageId);
    const newImage: StoredImage = {
      id: imageId,
      url,
      name,
      uploadedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      images[existingIndex] = newImage;
    } else {
      images.push(newImage);
    }
    
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
  } catch (error) {
    console.error('خطأ في حفظ الصورة:', error);
  }
}

/**
 * حذف صورة
 */
export function deleteImage(imageId: string): void {
  try {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    if (stored) {
      const images: StoredImage[] = JSON.parse(stored);
      const filtered = images.filter(img => img.id !== imageId);
      localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('خطأ في حذف الصورة:', error);
  }
}

/**
 * الحصول على جميع الصور
 */
export function getAllImages(): StoredImage[] {
  try {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('خطأ في قراءة الصور:', error);
    return [];
  }
}
