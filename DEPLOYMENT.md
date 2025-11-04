# Deployment Guide - Voiture

This guide will help you deploy Voiture to Vercel and set up Supabase as your database.

## Why Supabase?

**Supabase is the best choice for this project because:**

1. **You're already familiar with it** - No learning curve
2. **Built-in Authentication** - Perfect for passenger/driver accounts
3. **Real-time subscriptions** - Essential for live passenger counts and bus tracking
4. **Row Level Security (RLS)** - Secure data access for different user types
5. **PostgreSQL database** - Powerful and scalable
6. **Free tier is generous** - Great for prototypes
7. **Easy Vercel integration** - Seamless deployment
8. **Built-in Storage** - For user profiles, driver photos, etc.

### Comparison with alternatives:
- **Firebase**: Good, but you're not familiar with it. Similar features but different API.
- **PlanetScale/Railway**: Just databases, you'd need separate auth and real-time solutions.
- **Supabase**: All-in-one solution with features you already know!

---

## Part 1: Setting Up Supabase

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project:
   - Name: `voiture-campus-transit`
   - Database Password: (save this securely)
   - Region: Choose closest to your users

### Step 2: Get Your Supabase Keys

1. Go to Project Settings → API
2. Copy these values:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

### Step 3: Create Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT CHECK (user_type IN ('passenger', 'driver')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Bus stops table
CREATE TABLE bus_stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  route_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Passenger counts at bus stops (real-time data from IoT)
CREATE TABLE passenger_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_stop_id UUID REFERENCES bus_stops(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('normal', 'crowded', 'urgent')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable real-time for passenger counts
ALTER PUBLICATION supabase_realtime ADD TABLE passenger_counts;

-- Routes table
CREATE TABLE routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  route_type TEXT CHECK (route_type IN ('bus', 'shuttle', 'scooter', 'flight', 'train')),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration_minutes INTEGER,
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Saved routes for users
CREATE TABLE saved_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, route_id)
);

ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved routes"
  ON saved_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their saved routes"
  ON saved_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved routes"
  ON saved_routes FOR DELETE
  USING (auth.uid() = user_id);

-- Driver assignments to routes
CREATE TABLE driver_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  bus_number TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their assignments"
  ON driver_assignments FOR SELECT
  USING (auth.uid() = driver_id);

-- Backup bus requests
CREATE TABLE backup_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  bus_stop_id UUID REFERENCES bus_stops(id),
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE backup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can create backup requests"
  ON backup_requests FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their backup requests"
  ON backup_requests FOR SELECT
  USING (auth.uid() = driver_id);
```

### Step 4: Insert Sample Data

```sql
-- Sample bus stops
INSERT INTO bus_stops (name, address, route_id) VALUES
  ('Purdue Memorial Union', '101 N Grant St', '4B'),
  ('Krannert Building', '403 W State St', '4B'),
  ('Córdova Recreational Sports Center', '900 John R Wooden Dr', '4B'),
  ('Harrison Hall', '525 Russell St', '4B'),
  ('Purdue Village', '1050 3rd St', '4B');

-- Sample passenger counts
INSERT INTO passenger_counts (bus_stop_id, count, status)
SELECT id,
  CASE
    WHEN random() < 0.3 THEN floor(random() * 5 + 1)::INTEGER
    WHEN random() < 0.7 THEN floor(random() * 10 + 5)::INTEGER
    ELSE floor(random() * 15 + 15)::INTEGER
  END as count,
  CASE
    WHEN random() < 0.6 THEN 'normal'
    WHEN random() < 0.85 THEN 'crowded'
    ELSE 'urgent'
  END as status
FROM bus_stops;
```

---

## Part 2: Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## Part 3: Deploying to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit: Voiture campus transit app"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Add Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Step 4: Deploy

Click "Deploy" and wait for the build to complete!

---

## Part 4: Testing Your Deployment

1. Visit your Vercel URL (e.g., `voiture.vercel.app`)
2. Test authentication:
   - Sign up as a passenger
   - Sign up as a driver
3. Test the driver dashboard to see real-time passenger counts
4. Try searching for routes

---

## Part 5: Setting Up Real-time Updates

In your app, you can subscribe to real-time changes:

```typescript
// Example: Subscribe to passenger count updates
const supabase = createClient()
const channel = supabase
  .channel('passenger-counts')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'passenger_counts' },
    (payload) => {
      console.log('Passenger count updated:', payload)
      // Update UI
    }
  )
  .subscribe()
```

---

## Part 6: Next Steps

### Immediate priorities:
1. ✅ Deploy to Vercel
2. ✅ Set up Supabase authentication
3. [ ] Connect real APIs (Google Maps, etc.)
4. [ ] Set up IoT sensors for passenger counting
5. [ ] Add payment integration

### Environment Variables Needed:
- **Required now**: Supabase keys
- **Soon**: Google Maps API key
- **Later**: Flight APIs, transportation APIs

---

## Troubleshooting

### Build fails on Vercel
- Check that all dependencies are in `package.json`
- Ensure environment variables are set
- Check build logs for specific errors

### Database connection fails
- Verify Supabase URL and keys
- Check if RLS policies are correct
- Ensure tables are created

### Authentication issues
- Verify Supabase auth is enabled
- Check redirect URLs in Supabase dashboard
- Add Vercel domain to allowed URLs

---

## Useful Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Check for errors
npm run lint
```

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Test locally first with `npm run dev`
4. Review environment variables

Good luck with your deployment! 🚀
