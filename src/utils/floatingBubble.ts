/**
 * floatingBubble.ts
 * TypeScript wrapper للتحكم في الفقاعة العائمة على Android
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

interface FloatingBubblePluginInterface {
  showBubble(): Promise<{ success: boolean; message: string; needsPermission?: boolean }>;
  hideBubble(): Promise<{ success: boolean; message: string }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<{ opened: boolean; message: string }>;
  isBubbleActive(): Promise<{ active: boolean }>;
}

// تسجيل Plugin فقط على Android
const FloatingBubblePlugin = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  ? registerPlugin<FloatingBubblePluginInterface>('FloatingBubble')
  : null;

export const FloatingBubble = {
  /**
   * التحقق مما إذا كانت الميزة متاحة
   */
  isAvailable(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  },

  /**
   * التحقق من صلاحية العرض فوق التطبيقات
   */
  async checkPermission(): Promise<boolean> {
    if (!this.isAvailable() || !FloatingBubblePlugin) {
      return false;
    }
    
    try {
      const result = await FloatingBubblePlugin.checkOverlayPermission();
      return result.granted;
    } catch (error) {
      console.error('[FloatingBubble] Error checking permission:', error);
      return false;
    }
  },

  /**
   * طلب صلاحية العرض فوق التطبيقات
   * يفتح صفحة إعدادات Android
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isAvailable() || !FloatingBubblePlugin) {
      return false;
    }
    
    try {
      const result = await FloatingBubblePlugin.requestOverlayPermission();
      return result.opened;
    } catch (error) {
      console.error('[FloatingBubble] Error requesting permission:', error);
      return false;
    }
  },

  /**
   * إظهار الفقاعة العائمة
   */
  async show(): Promise<{ success: boolean; message: string; needsPermission?: boolean }> {
    if (!this.isAvailable() || !FloatingBubblePlugin) {
      return { 
        success: false, 
        message: 'الفقاعة العائمة متاحة فقط على Android' 
      };
    }
    
    try {
      return await FloatingBubblePlugin.showBubble();
    } catch (error) {
      console.error('[FloatingBubble] Error showing bubble:', error);
      return { 
        success: false, 
        message: 'فشل في إظهار الفقاعة العائمة' 
      };
    }
  },

  /**
   * إخفاء الفقاعة العائمة
   */
  async hide(): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable() || !FloatingBubblePlugin) {
      return { 
        success: false, 
        message: 'الفقاعة العائمة متاحة فقط على Android' 
      };
    }
    
    try {
      return await FloatingBubblePlugin.hideBubble();
    } catch (error) {
      console.error('[FloatingBubble] Error hiding bubble:', error);
      return { 
        success: false, 
        message: 'فشل في إخفاء الفقاعة العائمة' 
      };
    }
  },

  /**
   * التحقق مما إذا كانت الفقاعة نشطة
   */
  async isActive(): Promise<boolean> {
    if (!this.isAvailable() || !FloatingBubblePlugin) {
      return false;
    }
    
    try {
      const result = await FloatingBubblePlugin.isBubbleActive();
      return result.active;
    } catch (error) {
      console.error('[FloatingBubble] Error checking bubble status:', error);
      return false;
    }
  },

  /**
   * تبديل حالة الفقاعة
   */
  async toggle(): Promise<{ success: boolean; message: string; isActive: boolean; needsPermission?: boolean }> {
    const isActive = await this.isActive();
    
    if (isActive) {
      const result = await this.hide();
      return { ...result, isActive: false };
    } else {
      const result = await this.show();
      return { ...result, isActive: result.success };
    }
  }
};

export default FloatingBubble;
