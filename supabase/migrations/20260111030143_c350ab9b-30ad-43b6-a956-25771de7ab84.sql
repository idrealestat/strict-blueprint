-- =============================================
-- UNIFIED EVENTS TABLE - Single source of truth for all system events
-- =============================================

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'user', -- user, system, visitor
  channel TEXT NOT NULL DEFAULT 'in_app_admin', -- public_web, in_app_preview, in_app_admin
  entity_type TEXT, -- offer, customer, business_card, calendar, request, etc.
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  viewer_id TEXT, -- for anonymous visitors
  device TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_entity ON public.events(entity_type, entity_id);
CREATE INDEX idx_events_channel ON public.events(channel);
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX idx_events_event_name ON public.events(event_name);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own events
CREATE POLICY "Users can view own events"
ON public.events
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert events (both authenticated and anonymous via viewer_id)
CREATE POLICY "Anyone can insert events"
ON public.events
FOR INSERT
WITH CHECK (true);

-- Owner can view all events
CREATE POLICY "Owner can view all events"
ON public.events
FOR SELECT
USING (has_role(auth.uid(), 'owner'::app_role));

-- =============================================
-- CRM CUSTOMERS TABLE - Replace localStorage
-- =============================================

CREATE TABLE public.crm_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  company TEXT,
  status TEXT DEFAULT 'جديد',
  priority TEXT DEFAULT 'متوسط',
  property_type TEXT,
  budget TEXT,
  location TEXT,
  notes TEXT,
  source TEXT DEFAULT 'يدوي',
  tags TEXT[] DEFAULT '{}',
  next_follow_up DATE,
  last_contact DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_crm_customers_user_id ON public.crm_customers(user_id);
CREATE INDEX idx_crm_customers_status ON public.crm_customers(status);
CREATE INDEX idx_crm_customers_phone ON public.crm_customers(phone);

-- Enable RLS
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own customers"
ON public.crm_customers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers"
ON public.crm_customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
ON public.crm_customers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers"
ON public.crm_customers
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_crm_customers_updated_at
BEFORE UPDATE ON public.crm_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- NOTIFICATIONS TABLE - Unified notification storage
-- =============================================

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- request, crm, offer, calendar, insight, publishing
  category TEXT, -- sub-category
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  is_read BOOLEAN DEFAULT false,
  related_entity_type TEXT,
  related_entity_id TEXT,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- ADD deleted_at TO platform_listings FOR SOFT DELETE
-- =============================================

ALTER TABLE public.platform_listings 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX idx_platform_listings_deleted_at ON public.platform_listings(deleted_at);

-- Enable realtime for events and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_customers;