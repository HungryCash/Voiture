-- Campus Shuttle Schema
-- Handles bookings and ride tracking for Campus Connect shuttle between West Lafayette and Indianapolis

-- Create shuttle_rides table (stores scheduled rides)
CREATE TABLE IF NOT EXISTS public.shuttle_rides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('West Lafayette', 'Indianapolis')),
  destination TEXT NOT NULL CHECK (destination IN ('West Lafayette', 'Indianapolis')),
  origin_coords POINT NOT NULL, -- (lat, lng)
  destination_coords POINT NOT NULL,
  capacity INTEGER DEFAULT 48 NOT NULL,
  booked_seats INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shuttle_bookings table
CREATE TABLE IF NOT EXISTS public.shuttle_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES public.shuttle_rides(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  passenger_count INTEGER DEFAULT 1 NOT NULL,
  booking_code TEXT UNIQUE NOT NULL, -- For sharing/tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ride_id) -- Prevent duplicate bookings
);

-- Create shuttle_tracking table (stores simulated bus positions)
CREATE TABLE IF NOT EXISTS public.shuttle_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.shuttle_rides(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  progress_percent DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
  estimated_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shuttle_rides_departure ON public.shuttle_rides(departure_time);
CREATE INDEX IF NOT EXISTS idx_shuttle_rides_status ON public.shuttle_rides(status);
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_user ON public.shuttle_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_ride ON public.shuttle_bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_code ON public.shuttle_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_shuttle_tracking_ride ON public.shuttle_tracking(ride_id);

-- Enable Row Level Security
ALTER TABLE public.shuttle_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shuttle_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shuttle_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shuttle_rides (public read, service role can insert)
CREATE POLICY "Anyone can view shuttle rides"
  ON public.shuttle_rides FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert shuttle rides"
  ON public.shuttle_rides FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update shuttle rides"
  ON public.shuttle_rides FOR UPDATE
  USING (true);

-- RLS Policies for shuttle_bookings
CREATE POLICY "Users can view their own bookings"
  ON public.shuttle_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.shuttle_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings"
  ON public.shuttle_bookings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for shuttle_tracking (public read for sharing)
CREATE POLICY "Anyone can view shuttle tracking"
  ON public.shuttle_tracking FOR SELECT
  USING (true);

-- Function to generate unique booking code
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.shuttle_bookings WHERE booking_code = code) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create booking and update seat count
CREATE OR REPLACE FUNCTION book_shuttle_ride(
  p_user_id UUID,
  p_ride_id UUID,
  p_passenger_name TEXT,
  p_passenger_count INTEGER DEFAULT 1
)
RETURNS TABLE(booking_id UUID, booking_code TEXT, success BOOLEAN, message TEXT) AS $$
DECLARE
  v_booking_id UUID;
  v_booking_code TEXT;
  v_current_booked INTEGER;
  v_capacity INTEGER;
BEGIN
  -- Get current bookings and capacity
  SELECT booked_seats, capacity INTO v_current_booked, v_capacity
  FROM public.shuttle_rides
  WHERE id = p_ride_id;

  -- Check if enough seats available
  IF (v_current_booked + p_passenger_count) > v_capacity THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, false, 'Not enough seats available';
    RETURN;
  END IF;

  -- Generate booking code
  v_booking_code := generate_booking_code();

  -- Create booking
  INSERT INTO public.shuttle_bookings (user_id, ride_id, passenger_name, passenger_count, booking_code)
  VALUES (p_user_id, p_ride_id, p_passenger_name, p_passenger_count, v_booking_code)
  RETURNING id INTO v_booking_id;

  -- Update booked seats count
  UPDATE public.shuttle_rides
  SET booked_seats = booked_seats + p_passenger_count
  WHERE id = p_ride_id;

  RETURN QUERY SELECT v_booking_id, v_booking_code, true, 'Booking successful';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
