# 🎈 إعداد الفقاعة العائمة للمساعد الذكي - Android

## 📋 المتطلبات

- Android Studio (أحدث إصدار)
- JDK 17 أو أحدث
- Android SDK (API 24+)

## 🚀 خطوات الإعداد

### 1. تصدير المشروع

```bash
# من Lovable، اضغط على "Export to GitHub"
# ثم استنسخ المشروع محلياً
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. تثبيت الاعتماديات وإضافة Android

```bash
npm install

# إضافة منصة Android
npx cap add android

# تحديث المنصة
npx cap update android
```

### 3. نسخ ملفات الفقاعة العائمة

انسخ الملفات من مجلد `android-overlay-setup/` إلى المواقع التالية:

| الملف المصدر | الوجهة |
|--------------|--------|
| `FloatingBubbleService.java` | `android/app/src/main/java/app/lovable/wasata/` |
| `FloatingBubblePlugin.java` | `android/app/src/main/java/app/lovable/wasata/` |
| `floating_bubble.xml` | `android/app/src/main/res/layout/` |
| `bubble_gradient.xml` | `android/app/src/main/res/drawable/` |
| `notification_dot.xml` | `android/app/src/main/res/drawable/` |

### 4. تعديل AndroidManifest.xml

افتح `android/app/src/main/AndroidManifest.xml` وأضف:

```xml
<!-- قبل <application> -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<!-- داخل <application> -->
<service
    android:name=".FloatingBubbleService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="specialUse">
</service>
```

### 5. تسجيل Plugin في MainActivity

افتح `android/app/src/main/java/app/lovable/wasata/MainActivity.java`:

```java
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingBubblePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

### 6. إضافة أيقونة المساعد

أنشئ ملف أيقونة بحجم 96x96 px واحفظه في:
`android/app/src/main/res/drawable/ic_ai_assistant.png`

### 7. البناء والتشغيل

```bash
# بناء المشروع
npm run build

# مزامنة مع Android
npx cap sync android

# تشغيل على جهاز/محاكي
npx cap run android
```

## 📱 الاستخدام من JavaScript

```typescript
import { Capacitor, registerPlugin } from '@capacitor/core';

interface FloatingBubblePlugin {
  showBubble(): Promise<{ success: boolean; message: string }>;
  hideBubble(): Promise<{ success: boolean; message: string }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<{ opened: boolean; message: string }>;
}

const FloatingBubble = registerPlugin<FloatingBubblePlugin>('FloatingBubble');

// التحقق من الصلاحية
const { granted } = await FloatingBubble.checkOverlayPermission();

if (!granted) {
  // طلب الصلاحية
  await FloatingBubble.requestOverlayPermission();
} else {
  // إظهار الفقاعة
  await FloatingBubble.showBubble();
}

// إخفاء الفقاعة
await FloatingBubble.hideBubble();
```

## ⚠️ ملاحظات مهمة

1. **صلاحية Overlay** تتطلب موافقة يدوية من المستخدم
2. على Android 13+، يجب طلب إذن POST_NOTIFICATIONS أيضاً
3. الفقاعة تستمر حتى بعد إغلاق التطبيق
4. يُنصح بإضافة خيار في الإعدادات لتفعيل/تعطيل الفقاعة

## 🍎 بالنسبة لـ iOS

**غير مدعومة**: Apple لا تسمح بالعناصر العائمة خارج التطبيق لأسباب أمنية وخصوصية.

## 🖥️ بالنسبة لـ PC

يتطلب تطبيق سطح مكتب منفصل باستخدام Electron أو Tauri.
