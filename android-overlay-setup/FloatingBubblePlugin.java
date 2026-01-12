/**
 * FloatingBubblePlugin.java
 * Capacitor Plugin للتحكم في الفقاعة العائمة من JavaScript
 * 
 * يجب نسخه إلى:
 * android/app/src/main/java/app/lovable/wasata/FloatingBubblePlugin.java
 */

package app.lovable.wasata;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FloatingBubble")
public class FloatingBubblePlugin extends Plugin {

    @PluginMethod()
    public void showBubble(PluginCall call) {
        if (canDrawOverlays()) {
            Intent intent = new Intent(getContext(), FloatingBubbleService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "تم تفعيل الفقاعة العائمة");
            call.resolve(result);
        } else {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "يجب منح صلاحية العرض فوق التطبيقات");
            result.put("needsPermission", true);
            call.resolve(result);
        }
    }

    @PluginMethod()
    public void hideBubble(PluginCall call) {
        Intent intent = new Intent(getContext(), FloatingBubbleService.class);
        getContext().stopService(intent);
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "تم إخفاء الفقاعة العائمة");
        call.resolve(result);
    }

    @PluginMethod()
    public void checkOverlayPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", canDrawOverlays());
        call.resolve(result);
    }

    @PluginMethod()
    public void requestOverlayPermission(PluginCall call) {
        if (!canDrawOverlays()) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("message", "تم فتح صفحة الإعدادات - يرجى تفعيل الصلاحية");
            call.resolve(result);
        } else {
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("message", "الصلاحية مفعلة مسبقاً");
            call.resolve(result);
        }
    }

    @PluginMethod()
    public void isBubbleActive(PluginCall call) {
        // التحقق مما إذا كانت الخدمة تعمل
        JSObject result = new JSObject();
        result.put("active", FloatingBubbleService.isRunning);
        call.resolve(result);
    }

    private boolean canDrawOverlays() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getContext());
        }
        return true;
    }
}
