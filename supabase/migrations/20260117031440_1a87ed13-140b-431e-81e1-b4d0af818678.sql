-- إزالة سياسات RLS التي تعتمد على auth.users لأنها تسبب permission denied

-- crm_customers
DROP POLICY IF EXISTS "Anyone can insert customers for valid users" ON public.crm_customers;
DROP POLICY IF EXISTS "Anyone can update customers metadata" ON public.crm_customers;
DROP POLICY IF EXISTS "Public forms can search customers by phone" ON public.crm_customers;

-- notifications
DROP POLICY IF EXISTS "Anyone can insert notifications for valid users" ON public.notifications;

-- received_documents (للأمان لأن عليها نفس النمط)
DROP POLICY IF EXISTS "Anyone can insert received documents for valid users" ON public.received_documents;

-- (ملاحظة) الإدخال من الصفحات العامة يتم عبر backend function بصلاحية خدمة، لذلك لا نحتاج سياسات "Anyone can insert" أصلاً.
