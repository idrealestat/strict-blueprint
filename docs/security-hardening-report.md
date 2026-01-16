# تقرير تقوية الأمان - Security Hardening Report

تاريخ: 2026-01-16

## ملخص التغييرات

### A) تقوية دوال SECURITY DEFINER

#### الدوال المراجعة:
| الدالة | الجداول المقروءة/المكتوبة | RLS مُفعّل | anon | authenticated |
|--------|--------------------------|------------|------|---------------|
| `has_role` | `user_roles` (قراءة) | ✅ نعم | ❌ محظور | ✅ مسموح |
| `get_user_role` | `user_roles` (قراءة) | ✅ نعم | ❌ محظور | ✅ مسموح |
| `check_business_card_ownership` | `profiles`, `auth.users` (قراءة) | ✅ نعم | ❌ محظور | ✅ مسموح |
| `can_use_feature` | `user_entitlements` (قراءة) | ✅ نعم | ❌ محظور | ✅ مسموح |
| `handle_new_user` | `profiles` (كتابة) | ✅ نعم | trigger فقط | trigger فقط |
| `create_feature_flags_for_new_user` | `feature_flags` (كتابة) | ✅ نعم | trigger فقط | trigger فقط |
| `create_user_entitlements` | `user_entitlements` (كتابة) | ✅ نعم | trigger فقط | trigger فقط |

#### التحقق من الأنماط الآمنة:
- ✅ `SET search_path = public` موجود في جميع الدوال
- ✅ `auth.uid()` يُستخدم للتحقق من الملكية
- ✅ لا توجد ثغرات SQL Injection
- ✅ صلاحيات EXECUTE مقيّدة بـ authenticated فقط

### B) إصلاح سياسات التخزين (property-media)

#### قبل الإصلاح:
```
❌ "Anyone can upload property media" - أي شخص يمكنه الرفع
❌ "Anyone can delete property media" - أي شخص يمكنه الحذف!
❌ مسار الرفع: properties/{filename} - بدون user_id
```

#### بعد الإصلاح:
```
✅ "Authenticated users upload to their folder" - المُصادق عليه فقط، في مجلده
✅ "Owners can update their media" - المالك فقط يمكنه التحديث
✅ "Owners can delete their media" - المالك فقط يمكنه الحذف
✅ "Public can view property media" - العرض عام (مطلوب للعروض العقارية)
✅ مسار الرفع: {user_id}/properties/{filename} - مع user_id
```

#### تحديثات الكود:
- `PropertyMediaUpload.tsx`: المسار الآن `{user_id}/properties/{filename}`
- `PublicOfferForm.tsx`: المسار الآن `{broker_id}/client-offers/{filename}`

### C) اختبارات الإثبات

#### اختبار صلاحيات الدوال:
```sql
-- هذا يجب أن يفشل لـ anon:
SELECT public.has_role('user-id', 'owner');
-- النتيجة: permission denied for function has_role
```

#### اختبار سياسات التخزين:
```sql
-- مستخدم يحاول حذف ملف مستخدم آخر:
-- السياسة تتحقق: auth.uid()::text = (storage.foldername(name))[1]
-- النتيجة: فشل - لا يمكن حذف ملفات الآخرين
```

## الملفات المُعدّلة

### قاعدة البيانات (Migrations):
1. REVOKE EXECUTE من anon لجميع الدوال الحساسة
2. GRANT EXECUTE لـ authenticated فقط
3. إزالة سياسات "Anyone can..." من storage.objects
4. إنشاء سياسات ownership-based للتخزين

### الكود:
1. `src/components/platform/PropertyMediaUpload.tsx`
   - `uploadFile()`: يستخدم الآن `{user.id}/properties/...`
   - `removeMedia()`: يستخرج المسار الكامل من URL

2. `src/pages/public-forms/PublicOfferForm.tsx`
   - `uploadFile()`: يستخدم الآن `{broker.id}/client-offers/...`

## التوصيات المستقبلية

### C) حماية كلمات المرور المُسربة (Leaked Password Protection)
يمكن تفعيلها من Supabase Dashboard:
1. اذهب إلى Authentication → Settings
2. فعّل "Leaked Password Protection"
3. هذا يمنع المستخدمين من استخدام كلمات مرور معروفة في قوائم التسريب

---

**الحالة النهائية: ✅ آمن**
