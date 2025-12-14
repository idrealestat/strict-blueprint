-- Create map_locations table for storing locations
CREATE TABLE public.map_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_code VARCHAR(50) UNIQUE,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  location_type VARCHAR(50) NOT NULL DEFAULT 'customer',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  formatted_address TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  properties JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create map_routes table for storing routes
CREATE TABLE public.map_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code VARCHAR(50) UNIQUE,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  route_type VARCHAR(50) NOT NULL DEFAULT 'delivery',
  start_location_id UUID REFERENCES public.map_locations(id),
  end_location_id UUID REFERENCES public.map_locations(id),
  waypoints JSONB DEFAULT '[]',
  path_coordinates JSONB DEFAULT '[]',
  total_distance DECIMAL(10, 2),
  estimated_duration INTEGER,
  status VARCHAR(50) DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create map_areas table for geographic areas
CREATE TABLE public.map_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code VARCHAR(50) UNIQUE,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  area_type VARCHAR(50) NOT NULL DEFAULT 'district',
  boundary_coordinates JSONB NOT NULL,
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  properties JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.map_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_areas ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow all for map_locations" ON public.map_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for map_routes" ON public.map_routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for map_areas" ON public.map_areas FOR ALL USING (true) WITH CHECK (true);

-- Insert sample locations in Riyadh
INSERT INTO public.map_locations (location_code, name_ar, name_en, location_type, latitude, longitude, city, district, status) VALUES
('LOC-001', 'فرع الرياض الرئيسي', 'Riyadh Main Branch', 'branch', 24.7136, 46.6753, 'الرياض', 'العليا', 'active'),
('LOC-002', 'عميل أحمد محمد', 'Customer Ahmed Mohammed', 'customer', 24.7236, 46.6853, 'الرياض', 'النخيل', 'active'),
('LOC-003', 'مستودع الشحن', 'Shipping Warehouse', 'warehouse', 24.6936, 46.6553, 'الرياض', 'الصناعية', 'active'),
('LOC-004', 'نقطة توصيل المطار', 'Airport Delivery Point', 'delivery_point', 24.9576, 46.6988, 'الرياض', 'المطار', 'active'),
('LOC-005', 'عميل سارة عبدالله', 'Customer Sara Abdullah', 'customer', 24.7336, 46.6953, 'الرياض', 'الملقا', 'active');