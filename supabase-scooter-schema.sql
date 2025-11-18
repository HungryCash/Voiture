-- =====================================================
-- SCOOTER TABLES - Add to existing Voiture schema
-- =====================================================
-- Run this in Supabase SQL Editor after the main schema
-- =====================================================

-- Scooters table (for Lime/Veo/Bird scooters)
CREATE TABLE IF NOT EXISTS public.scooters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scooter_id TEXT UNIQUE NOT NULL, -- External ID from provider (e.g., Lime)
  provider TEXT CHECK (provider IN ('lime', 'veo', 'bird')) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100) NOT NULL,
  status TEXT CHECK (status IN ('available', 'in_use', 'low_battery', 'maintenance')) NOT NULL DEFAULT 'available',
  vehicle_type TEXT CHECK (vehicle_type IN ('scooter', 'bike')) DEFAULT 'scooter',
  price_per_minute DECIMAL(5, 2) DEFAULT 0.39,
  unlock_fee DECIMAL(5, 2) DEFAULT 1.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable realtime for scooters
ALTER PUBLICATION supabase_realtime ADD TABLE public.scooters;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_scooters_provider ON public.scooters(provider);
CREATE INDEX IF NOT EXISTS idx_scooters_status ON public.scooters(status);
CREATE INDEX IF NOT EXISTS idx_scooters_location ON public.scooters(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_scooters_last_updated ON public.scooters(last_updated DESC);

-- Scooter rides/bookings table
CREATE TABLE IF NOT EXISTS public.scooter_rides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scooter_id UUID REFERENCES public.scooters(id) ON DELETE CASCADE NOT NULL,
  start_latitude DECIMAL(10, 8),
  start_longitude DECIMAL(11, 8),
  end_latitude DECIMAL(10, 8),
  end_longitude DECIMAL(11, 8),
  duration_minutes INTEGER,
  distance_km DECIMAL(5, 2),
  total_cost DECIMAL(10, 2),
  status TEXT CHECK (status IN ('reserved', 'active', 'completed', 'cancelled')) NOT NULL DEFAULT 'reserved',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.scooter_rides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scooter rides
CREATE POLICY "Users can view their own rides"
  ON public.scooter_rides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rides"
  ON public.scooter_rides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rides"
  ON public.scooter_rides FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for rides
CREATE INDEX IF NOT EXISTS idx_scooter_rides_user ON public.scooter_rides(user_id);
CREATE INDEX IF NOT EXISTS idx_scooter_rides_status ON public.scooter_rides(status);
CREATE INDEX IF NOT EXISTS idx_scooter_rides_created ON public.scooter_rides(created_at DESC);

-- Function to update scooter status when ride starts/ends
CREATE OR REPLACE FUNCTION update_scooter_status_on_ride()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'reserved' THEN
    -- Mark scooter as in use
    UPDATE public.scooters
    SET status = 'in_use', last_updated = NOW()
    WHERE id = NEW.scooter_id;
  ELSIF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
    -- Mark scooter as available again
    UPDATE public.scooters
    SET status = 'available', last_updated = NOW()
    WHERE id = NEW.scooter_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for scooter status updates
DROP TRIGGER IF EXISTS trigger_update_scooter_status ON public.scooter_rides;
CREATE TRIGGER trigger_update_scooter_status
  AFTER UPDATE ON public.scooter_rides
  FOR EACH ROW
  EXECUTE FUNCTION update_scooter_status_on_ride();

-- =====================================================
-- SAMPLE SCOOTER DATA (Indianapolis/Purdue Indianapolis)
-- =====================================================
-- Insert Lime scooters around IUPUI campus
INSERT INTO public.scooters (scooter_id, provider, latitude, longitude, battery_level, status, price_per_minute, unlock_fee) VALUES
  -- Near IUPUI Campus Center
  ('LIME-001', 'lime', 39.7748, -86.1745, 95, 'available', 0.39, 1.00),
  ('LIME-002', 'lime', 39.7752, -86.1750, 87, 'available', 0.39, 1.00),
  ('LIME-003', 'lime', 39.7740, -86.1738, 72, 'available', 0.39, 1.00),

  -- Near University Library
  ('LIME-004', 'lime', 39.7735, -86.1755, 91, 'available', 0.39, 1.00),
  ('LIME-005', 'lime', 39.7730, -86.1760, 45, 'low_battery', 0.39, 1.00),

  -- Near Sports Complex
  ('LIME-006', 'lime', 39.7760, -86.1770, 88, 'available', 0.39, 1.00),
  ('LIME-007', 'lime', 39.7765, -86.1775, 63, 'available', 0.39, 1.00),

  -- Near Student Housing
  ('LIME-008', 'lime', 39.7720, -86.1765, 92, 'available', 0.39, 1.00),
  ('LIME-009', 'lime', 39.7725, -86.1770, 78, 'available', 0.39, 1.00),
  ('LIME-010', 'lime', 39.7715, -86.1755, 55, 'available', 0.39, 1.00),

  -- Downtown Indianapolis (Mass Ave area)
  ('LIME-011', 'lime', 39.7710, -86.1510, 84, 'available', 0.39, 1.00),
  ('LIME-012', 'lime', 39.7705, -86.1520, 96, 'available', 0.39, 1.00),
  ('LIME-013', 'lime', 39.7700, -86.1530, 68, 'available', 0.39, 1.00),

  -- Near White River State Park
  ('LIME-014', 'lime', 39.7680, -86.1650, 89, 'available', 0.39, 1.00),
  ('LIME-015', 'lime', 39.7685, -86.1655, 74, 'available', 0.39, 1.00)
ON CONFLICT (scooter_id) DO NOTHING;

-- Add some Veo scooters too (Purdue uses Veo)
INSERT INTO public.scooters (scooter_id, provider, latitude, longitude, battery_level, status, price_per_minute, unlock_fee) VALUES
  ('VEO-001', 'veo', 39.7755, -86.1735, 93, 'available', 0.35, 1.00),
  ('VEO-002', 'veo', 39.7745, -86.1742, 81, 'available', 0.35, 1.00),
  ('VEO-003', 'veo', 39.7738, -86.1748, 67, 'available', 0.35, 1.00),
  ('VEO-004', 'veo', 39.7728, -86.1752, 94, 'available', 0.35, 1.00),
  ('VEO-005', 'veo', 39.7718, -86.1758, 76, 'available', 0.35, 1.00)
ON CONFLICT (scooter_id) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON public.scooters TO authenticated;
GRANT ALL ON public.scooter_rides TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
