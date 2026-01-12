# WasataAI - Security Tests Documentation
# توثيق اختبارات الأمان

## 📋 نظام الأدوار (Roles System)

### الأدوار المعتمدة فقط:
| الدور | المسمى العربي | الوصف |
|-------|---------------|-------|
| `owner` | مالك النظام | شخص واحد فقط - صلاحيات كاملة على النظام |
| `admin` | مدير مكتب | مدير داخل حسابه فقط - لا صلاحيات نظام |
| `member` | عضو فريق | صلاحيات محدودة ضمن الفريق |

### ⚠️ تحذيرات مهمة:
- **لا تستخدم `user`** - تم استبداله بـ `member`
- **Admin ≠ Owner** - Admin لا يملك أي صلاحيات نظام
- Admin محصور داخل: حسابه، فريقه، بيانات مكتبه فقط

---

## 🔒 اختبارات Backend Guard

### متطلبات الاختبار:
```bash
# معلومات المشروع
PROJECT_ID="icfizajxhgkxuwunhvtp"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1"
```

---

### 1️⃣ اختبار بدون Authorization Header

**الهدف:** التحقق من رفض الطلبات غير الموثقة

```bash
# اختبار publish-business-card
curl -X POST "${BASE_URL}/publish-business-card" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**النتيجة المتوقعة:**
```json
Status: 401
{
  "error": "غير مصرح - يرجى تسجيل الدخول"
}
```

```bash
# اختبار owner-admin
curl -X GET "${BASE_URL}/owner-admin" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
Status: 401
{
  "error": "غير مصرح - يرجى تسجيل الدخول"
}
```

---

### 2️⃣ اختبار مستخدم منتهي الصلاحية (Expired)

**الهدف:** التحقق من حظر المستخدمين منتهي الصلاحية

```bash
# استخدم توكن مستخدم status=expired
curl -X POST "${BASE_URL}/wasata-ai-chat" \
  -H "Authorization: Bearer <EXPIRED_USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

**النتيجة المتوقعة:**
```json
Status: 403
{
  "error": "اشتراكك منتهي. يرجى الترقية للاستمرار."
}
```

---

### 3️⃣ اختبار Owner Panel Access

**الهدف:** التحقق من أن owner-admin محمية فقط لـ Owner

#### A) مستخدم role=member
```bash
curl -X GET "${BASE_URL}/owner-admin" \
  -H "Authorization: Bearer <MEMBER_TOKEN>" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
Status: 403
{
  "error": "غير مصرح بالوصول - هذه اللوحة مخصصة لمالك التطبيق فقط"
}
```

#### B) مستخدم role=admin (مدير مكتب)
```bash
curl -X GET "${BASE_URL}/owner-admin" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
Status: 403
{
  "error": "غير مصرح بالوصول - هذه اللوحة مخصصة لمالك التطبيق فقط"
}
```

#### C) مستخدم role=owner
```bash
curl -X GET "${BASE_URL}/owner-admin" \
  -H "Authorization: Bearer <OWNER_TOKEN>" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
Status: 200
{
  "ok": true,
  "role": "owner"
}
```

---

### 4️⃣ اختبار Entitlements (Feature Access)

**الهدف:** التحقق من صلاحيات الميزات

```bash
# اختبار ميزة ai_assistant_advanced
curl -X POST "${BASE_URL}/entitlements-smoke-test" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json"
```

| نوع المستخدم | plan_code | النتيجة المتوقعة |
|-------------|-----------|-----------------|
| INDIVIDUAL (Active) | INDIVIDUAL | 403 (غير مسموح) |
| OFFICE (Active) | OFFICE | 200 (مسموح) |
| Trial (أي خطة) | - | 200 (مسموح خلال التجربة) |
| Expired | - | 403 (منتهي) |

---

### 5️⃣ اختبار ملكية البيانات (Data Ownership)

**الهدف:** منع المستخدمين من الوصول لبيانات الآخرين

```bash
# Token user(A) يحاول تعديل بطاقة user(B)
curl -X POST "${BASE_URL}/publish-business-card" \
  -H "Authorization: Bearer <USER_A_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"slug": "user-b-slug"}'
```

**النتيجة المتوقعة:**
```json
Status: 403
{
  "error": "لا يمكنك تعديل هذه البطاقة - أنت لست مالكها"
}
```

---

## 🛡️ حماية Owner Panel

### Edge Functions المحمية بـ ownerGuard:
| Function | الوصف |
|----------|-------|
| `owner-admin` | لوحة تحكم المالك |

### صلاحيات Owner فقط:
- إدارة الباقات (plan_code)
- إدارة الميزات (feature_flags)
- إدارة system_settings
- إدارة المستخدمين على مستوى النظام
- تغيير الأدوار (role)

### ⛔ Admin لا يستطيع:
- الوصول إلى Owner Panel
- تعديل system_settings
- تعديل plan_code مباشرة
- تغيير role لأي مستخدم

---

## 📊 ملخص نتائج الاختبارات المتوقعة

| الاختبار | role=member | role=admin | role=owner |
|----------|-------------|------------|------------|
| owner-admin | ❌ 403 | ❌ 403 | ✅ 200 |
| publish-business-card (ملكه) | ✅ 200 | ✅ 200 | ✅ 200 |
| publish-business-card (غيره) | ❌ 403 | ❌ 403 | ❌ 403 |
| wasata-ai-chat | ✅ 200 | ✅ 200 | ✅ 200 |
| بدون Auth | ❌ 401 | ❌ 401 | ❌ 401 |

---

## 🔧 كيفية الحصول على Token للاختبار

```javascript
// من Console المتصفح بعد تسجيل الدخول
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);
```

---

## ✅ قائمة التحقق النهائية

- [ ] جميع Edge Functions المحمية ترفض الطلبات بدون Authorization
- [ ] ownerGuard يمنع أي role غير owner
- [ ] entitlementsGuard يتحقق من الميزات حسب الخطة
- [ ] فحص ملكية البيانات في كل Function تقبل IDs
- [ ] لا يوجد أي استخدام لـ role="user" في الكود
