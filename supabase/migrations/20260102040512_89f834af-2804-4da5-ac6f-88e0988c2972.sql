-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  company_name TEXT,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Update platform_listings RLS policies for authenticated users
DROP POLICY IF EXISTS "Anyone can view published listings" ON public.platform_listings;
DROP POLICY IF EXISTS "Authenticated users can insert listings" ON public.platform_listings;
DROP POLICY IF EXISTS "Anyone can update their listings" ON public.platform_listings;
DROP POLICY IF EXISTS "Anyone can delete their listings" ON public.platform_listings;

-- Add user_id column to platform_listings if not exists
ALTER TABLE public.platform_listings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create new RLS policies for platform_listings
CREATE POLICY "Public can view published listings"
ON public.platform_listings
FOR SELECT
USING (status = 'published' AND is_hidden = false);

CREATE POLICY "Authenticated users can insert their listings"
ON public.platform_listings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
ON public.platform_listings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
ON public.platform_listings
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own listings"
ON public.platform_listings
FOR SELECT
USING (auth.uid() = user_id);

-- Update calendar_appointments RLS
DROP POLICY IF EXISTS "Allow all for calendar_appointments" ON public.calendar_appointments;

ALTER TABLE public.calendar_appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "Users can view their own appointments"
ON public.calendar_appointments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
ON public.calendar_appointments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
ON public.calendar_appointments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
ON public.calendar_appointments
FOR DELETE
USING (auth.uid() = user_id);

-- Update storage policies for property-media bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload property media" ON storage.objects;

CREATE POLICY "Property media is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-media');

CREATE POLICY "Authenticated users can upload property media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'property-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'property-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'property-media' AND auth.role() = 'authenticated');