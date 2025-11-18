-- =====================================================
-- JAGLINE TABLES - Real-time bus tracking for IUPUI
-- =====================================================
-- Run this in Supabase SQL Editor after the main schema
-- =====================================================

-- Jagline routes table
CREATE TABLE IF NOT EXISTS public.jagline_routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  route_id INTEGER UNIQUE NOT NULL, -- RouteID from API
  route_name TEXT NOT NULL,
  route_number TEXT,
  color TEXT DEFAULT '#0066CC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Jagline buses table (real-time vehicle positions)
CREATE TABLE IF NOT EXISTS public.jagline_buses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id INTEGER UNIQUE NOT NULL, -- VehicleID from API
  name TEXT NOT NULL, -- Bus number (e.g., "9384")
  route_id INTEGER REFERENCES public.jagline_routes(route_id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  ground_speed DECIMAL(5, 2), -- Speed in mph
  heading INTEGER CHECK (heading >= 0 AND heading <= 360), -- Direction in degrees
  is_delayed BOOLEAN DEFAULT false,
  is_on_route BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  api_timestamp BIGINT, -- Original timestamp from API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable realtime for jagline_buses
ALTER PUBLICATION supabase_realtime ADD TABLE public.jagline_buses;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_jagline_buses_vehicle_id ON public.jagline_buses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_jagline_buses_route_id ON public.jagline_buses(route_id);
CREATE INDEX IF NOT EXISTS idx_jagline_buses_location ON public.jagline_buses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_jagline_buses_last_updated ON public.jagline_buses(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_jagline_routes_route_id ON public.jagline_routes(route_id);

-- Bus position history (optional - for analytics)
CREATE TABLE IF NOT EXISTS public.jagline_bus_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id INTEGER NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  ground_speed DECIMAL(5, 2),
  heading INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jagline_history_vehicle ON public.jagline_bus_history(vehicle_id, timestamp DESC);

-- =====================================================
-- SAMPLE JAGLINE ROUTES (Indianapolis)
-- =====================================================
-- Common IUPUI routes based on RideSystem
INSERT INTO public.jagline_routes (route_id, route_name, route_number, color) VALUES
  (27, 'Campus Connector', '27', '#0066CC'),
  (1, 'Blue Line', '1', '#0000FF'),
  (2, 'Red Line', '2', '#FF0000'),
  (3, 'Green Line', '3', '#00CC00')
ON CONFLICT (route_id) DO UPDATE SET
  route_name = EXCLUDED.route_name,
  updated_at = NOW();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON public.jagline_routes TO authenticated;
GRANT SELECT ON public.jagline_buses TO authenticated;
GRANT SELECT ON public.jagline_bus_history TO authenticated;

-- Allow anon users to view bus locations (public data)
GRANT SELECT ON public.jagline_routes TO anon;
GRANT SELECT ON public.jagline_buses TO anon;

-- =====================================================
-- FUNCTION: Update bus position (upsert)
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_jagline_bus_position(
  p_vehicle_id INTEGER,
  p_name TEXT,
  p_route_id INTEGER,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_ground_speed DECIMAL,
  p_heading INTEGER,
  p_is_delayed BOOLEAN,
  p_is_on_route BOOLEAN,
  p_api_timestamp BIGINT
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.jagline_buses (
    vehicle_id, name, route_id, latitude, longitude,
    ground_speed, heading, is_delayed, is_on_route,
    last_updated, api_timestamp
  ) VALUES (
    p_vehicle_id, p_name, p_route_id, p_latitude, p_longitude,
    p_ground_speed, p_heading, p_is_delayed, p_is_on_route,
    NOW(), p_api_timestamp
  )
  ON CONFLICT (vehicle_id) DO UPDATE SET
    name = EXCLUDED.name,
    route_id = EXCLUDED.route_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    ground_speed = EXCLUDED.ground_speed,
    heading = EXCLUDED.heading,
    is_delayed = EXCLUDED.is_delayed,
    is_on_route = EXCLUDED.is_on_route,
    last_updated = EXCLUDED.last_updated,
    api_timestamp = EXCLUDED.api_timestamp;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Enable Realtime for jagline_buses table
-- 3. Create API route in Next.js to fetch and store data
-- =====================================================
