-- Add user_id column to map tables
ALTER TABLE public.map_locations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.map_routes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.map_areas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow all for map_locations" ON public.map_locations;
DROP POLICY IF EXISTS "Allow all for map_routes" ON public.map_routes;
DROP POLICY IF EXISTS "Allow all for map_areas" ON public.map_areas;

-- Create user-scoped policies for map_locations
CREATE POLICY "Users can view own locations"
ON public.map_locations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations"
ON public.map_locations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
ON public.map_locations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
ON public.map_locations FOR DELETE
USING (auth.uid() = user_id);

-- Create user-scoped policies for map_routes
CREATE POLICY "Users can view own routes"
ON public.map_routes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routes"
ON public.map_routes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routes"
ON public.map_routes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routes"
ON public.map_routes FOR DELETE
USING (auth.uid() = user_id);

-- Create user-scoped policies for map_areas
CREATE POLICY "Users can view own areas"
ON public.map_areas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own areas"
ON public.map_areas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own areas"
ON public.map_areas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own areas"
ON public.map_areas FOR DELETE
USING (auth.uid() = user_id);