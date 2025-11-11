-- =====================================================
-- VOITURE - Campus Transit App Database Schema
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT CHECK (user_type IN ('passenger', 'driver')) NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. BUS STOPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bus_stops (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  route_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bus_stops_route_id ON public.bus_stops(route_id);

-- =====================================================
-- 3. PASSENGER COUNTS TABLE (Real-time IoT data)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.passenger_counts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bus_stop_id UUID REFERENCES public.bus_stops(id) ON DELETE CASCADE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  status TEXT CHECK (status IN ('normal', 'crowded', 'urgent')) NOT NULL DEFAULT 'normal',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable realtime for passenger counts
ALTER PUBLICATION supabase_realtime ADD TABLE public.passenger_counts;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_passenger_counts_bus_stop ON public.passenger_counts(bus_stop_id);
CREATE INDEX IF NOT EXISTS idx_passenger_counts_timestamp ON public.passenger_counts(timestamp DESC);

-- =====================================================
-- 4. ROUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  route_type TEXT CHECK (route_type IN ('bus', 'shuttle', 'scooter', 'flight', 'train', 'walk')) NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  price_min DECIMAL(10, 2) CHECK (price_min >= 0),
  price_max DECIMAL(10, 2) CHECK (price_max >= price_min),
  transfers INTEGER DEFAULT 0 CHECK (transfers >= 0),
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_routes_type ON public.routes(route_type);
CREATE INDEX IF NOT EXISTS idx_routes_active ON public.routes(active);

-- =====================================================
-- 5. SAVED ROUTES TABLE (User favorites)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.saved_routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, route_id)
);

ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved routes
CREATE POLICY "Users can view their saved routes"
  ON public.saved_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their saved routes"
  ON public.saved_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved routes"
  ON public.saved_routes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their saved routes"
  ON public.saved_routes FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. DRIVER ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  route_name TEXT NOT NULL,
  bus_number TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'completed')) NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver assignments
CREATE POLICY "Drivers can view their assignments"
  ON public.driver_assignments FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert their assignments"
  ON public.driver_assignments FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their assignments"
  ON public.driver_assignments FOR UPDATE
  USING (auth.uid() = driver_id);

-- Index for active assignments
CREATE INDEX IF NOT EXISTS idx_driver_assignments_status ON public.driver_assignments(status);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON public.driver_assignments(driver_id);

-- =====================================================
-- 7. BACKUP REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.backup_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  route_name TEXT NOT NULL,
  bus_stop_id UUID REFERENCES public.bus_stops(id),
  reason TEXT,
  passenger_count INTEGER,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.backup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backup requests
CREATE POLICY "Drivers can create backup requests"
  ON public.backup_requests FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their backup requests"
  ON public.backup_requests FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can view all backup requests for their route"
  ON public.backup_requests FOR SELECT
  USING (true);

-- Index for pending requests
CREATE INDEX IF NOT EXISTS idx_backup_requests_status ON public.backup_requests(status);
CREATE INDEX IF NOT EXISTS idx_backup_requests_driver ON public.backup_requests(driver_id);

-- =====================================================
-- 8. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_requests_updated_at
  BEFORE UPDATE ON public.backup_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'passenger')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample bus stops
INSERT INTO public.bus_stops (name, address, route_id, latitude, longitude) VALUES
  ('Purdue Memorial Union', '101 N Grant St, West Lafayette, IN 47906', '4B', 40.4237, -86.9212),
  ('Krannert Building', '403 W State St, West Lafayette, IN 47907', '4B', 40.4259, -86.9214),
  ('Córdova Recreational Sports Center', '900 John R Wooden Dr, West Lafayette, IN 47907', '4B', 40.4286, -86.9208),
  ('Harrison Hall', '525 Russell St, West Lafayette, IN 47906', '4B', 40.4294, -86.9246),
  ('Purdue Village', '1050 3rd St, West Lafayette, IN 47906', '4B', 40.4368, -86.9241),
  ('Elliott Hall', '504 Northwestern Ave, West Lafayette, IN 47907', '1A', 40.4278, -86.9189),
  ('Armstrong Hall', '701 W Stadium Ave, West Lafayette, IN 47907', '1A', 40.4318, -86.9234)
ON CONFLICT DO NOTHING;

-- Insert sample passenger counts
INSERT INTO public.passenger_counts (bus_stop_id, count, status)
SELECT
  id,
  CASE
    WHEN random() < 0.3 THEN floor(random() * 5 + 1)::INTEGER
    WHEN random() < 0.7 THEN floor(random() * 10 + 5)::INTEGER
    ELSE floor(random() * 15 + 15)::INTEGER
  END as count,
  CASE
    WHEN random() < 0.6 THEN 'normal'::TEXT
    WHEN random() < 0.85 THEN 'crowded'::TEXT
    ELSE 'urgent'::TEXT
  END as status
FROM public.bus_stops
ON CONFLICT DO NOTHING;

-- Insert sample routes
INSERT INTO public.routes (name, route_type, origin, destination, duration_minutes, price_min, price_max, transfers) VALUES
  ('4B Silver Loop', 'bus', 'Purdue Memorial Union', 'Purdue Village', 25, 0, 0, 0),
  ('1A Gold Loop', 'bus', 'Elliott Hall', 'Armstrong Hall', 15, 0, 0, 0),
  ('Campus Shuttle Express', 'shuttle', 'West Lafayette', 'Indianapolis', 150, 45, 80, 0),
  ('Jagline Express', 'bus', 'West Lafayette', 'Indianapolis', 1278, 115, 220, 1),
  ('Veo Scooter', 'scooter', 'Campus Center', 'Downtown Lafayette', 12, 3, 8, 0),
  ('Bird Scooter', 'scooter', 'Campus Center', 'Downtown Lafayette', 12, 3, 8, 0),
  ('Purdue Airport Flight', 'flight', 'Purdue Airport (LAF)', 'Indianapolis Airport (IND)', 45, 113, 389, 0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Verify all tables are created in Table Editor
-- 2. Check Authentication settings are enabled
-- 3. Add your Vercel URL to Authentication → URL Configuration
-- 4. Test signup/login from your app
-- =====================================================
