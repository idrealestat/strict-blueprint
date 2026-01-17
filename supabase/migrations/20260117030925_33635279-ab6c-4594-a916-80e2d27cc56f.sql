-- حذف السياسات القديمة أولاً
DROP POLICY IF EXISTS "Users can view own customers" ON crm_customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON crm_customers;
DROP POLICY IF EXISTS "Users can update own customers" ON crm_customers;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

-- إعادة إنشاء policies بشكل صحيح
CREATE POLICY "Users can view own customers" ON crm_customers
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON crm_customers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON crm_customers
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);