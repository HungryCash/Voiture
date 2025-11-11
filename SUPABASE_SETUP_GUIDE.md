# Supabase Setup Guide - Step by Step

Follow these exact steps to set up your Supabase database for Voiture.

## ✅ Prerequisites

- [ ] You already have a Supabase account
- [ ] Your project is created: `https://fvduwqscsnosbyleogyi.supabase.co`
- [ ] You have your API keys in `.env.local`

## 📝 Step 1: Run the SQL Schema

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `fvduwqscsnosbyleogyi`

2. **Open SQL Editor**
   - Click on the **SQL Editor** icon in the left sidebar (looks like `</>`)
   - Or go directly to: https://supabase.com/dashboard/project/fvduwqscsnosbyleogyi/sql

3. **Create New Query**
   - Click **"New query"** button (top right)

4. **Copy & Paste the Schema**
   - Open the file: `supabase-schema.sql` (in your project root)
   - Copy ALL the contents (Ctrl+A, Ctrl+C)
   - Paste into the SQL Editor

5. **Run the Script**
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for it to complete (should take 5-10 seconds)
   - You should see: "Success. No rows returned"

## 🔍 Step 2: Verify Tables Were Created

1. **Go to Table Editor**
   - Click on the **Table Editor** icon in left sidebar (looks like a table/grid)
   - Or go to: https://supabase.com/dashboard/project/fvduwqscsnosbyleogyi/editor

2. **Check for These Tables**
   You should see 7 tables:
   - ✅ `profiles` - User accounts
   - ✅ `bus_stops` - Bus stop locations (should have 7 sample stops)
   - ✅ `passenger_counts` - Real-time passenger data (should have 7 sample counts)
   - ✅ `routes` - Transportation routes (should have 7 sample routes)
   - ✅ `saved_routes` - User favorites (empty for now)
   - ✅ `driver_assignments` - Driver assignments (empty for now)
   - ✅ `backup_requests` - Backup bus requests (empty for now)

3. **Verify Sample Data**
   - Click on `bus_stops` table
   - You should see 7 bus stops (Purdue Memorial Union, Krannert, etc.)
   - Click on `routes` table
   - You should see 7 routes (4B Silver Loop, Campus Shuttle, etc.)

## 🔐 Step 3: Configure Authentication

1. **Go to Authentication Settings**
   - Click **Authentication** in left sidebar
   - Then click **"Settings"** tab
   - Or go to: https://supabase.com/dashboard/project/fvduwqscsnosbyleogyi/settings/auth

2. **Configure URL Settings**
   Scroll to **"URL Configuration"** section:

   - **Site URL**: `http://localhost:3000` (for now)
   - **Redirect URLs**: Add these (one per line):
     ```
     http://localhost:3000/**
     http://localhost:3000/auth/callback
     ```

3. **Enable Email Auth**
   - Scroll to **"Auth Providers"**
   - Make sure **"Email"** is enabled (should be by default)
   - Optional: Enable **"Confirm email"** if you want email verification

4. **Save Changes**
   - Click **"Save"** at the bottom

## 🔌 Step 4: Enable Realtime

1. **Go to Database Settings**
   - Click **Database** in left sidebar
   - Then click **"Replication"** tab
   - Or go to: https://supabase.com/dashboard/project/fvduwqscsnosbyleogyi/database/replication

2. **Enable Realtime for passenger_counts**
   - Find the table `passenger_counts` in the list
   - Toggle the switch to **ON** (it should turn green)
   - This enables real-time updates for driver dashboard

## 🧪 Step 5: Test Your Setup

### Test 1: Database Connection

1. **Go to SQL Editor** again
2. **Run this test query**:
   ```sql
   SELECT COUNT(*) as total_bus_stops FROM bus_stops;
   SELECT COUNT(*) as total_routes FROM routes;
   ```
3. **Expected result**:
   - `total_bus_stops`: 7
   - `total_routes`: 7

### Test 2: Authentication

1. **Open your app** at http://localhost:3000
2. **Click on the user icon** (top right) to go to `/auth`
3. **Try signing up**:
   - Select "Passenger"
   - Enter your email (use a real email you can access)
   - Enter a password (at least 6 characters)
   - Click "Create Account"

4. **Check Supabase**:
   - Go to: Authentication → Users
   - You should see your new user!

5. **Check profiles table**:
   - Go to: Table Editor → profiles
   - You should see a new row with your user data!

### Test 3: Driver Dashboard Data

1. **Sign up as a driver**:
   - Go to `/auth`
   - Sign out if needed
   - Sign up with "Driver" selected
   - Use a different email

2. **Go to Driver Dashboard**:
   - Navigate to `/driver-dashboard`
   - You should see the 7 bus stops with passenger counts!

## 🎉 Step 6: You're Done!

If all tests passed, your Supabase is fully set up!

## 🔧 What You Have Now

- ✅ All database tables created
- ✅ Sample data loaded (7 stops, 7 routes, passenger counts)
- ✅ Authentication configured
- ✅ Row Level Security (RLS) enabled
- ✅ Realtime updates enabled
- ✅ Automatic profile creation on signup
- ✅ Triggers and functions working

## 📊 View Your Data

You can view and manage your data:
- **Users**: Authentication → Users
- **All Tables**: Table Editor
- **Real-time subscriptions**: Database → Replication
- **API logs**: API → Logs

## 🚀 Next Steps

### For Local Development:
- ✅ Your app is already connected (keys in `.env.local`)
- ✅ Test signup/login at http://localhost:3000/auth
- ✅ Test saving routes (coming soon)
- ✅ Test driver dashboard at `/driver-dashboard`

### For Production (When ready to deploy):
1. Add your Vercel URL to:
   - Authentication → Settings → URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

2. Add the same environment variables to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin tasks)

## 🆘 Troubleshooting

### "relation does not exist" error
- Make sure you ran the entire SQL script
- Check Table Editor to see if tables exist
- Try running the script again (it's safe to run multiple times)

### Authentication not working
- Check URL configuration in Authentication → Settings
- Make sure `http://localhost:3000` is in Site URL
- Check browser console for errors

### Can't see sample data
- Go to SQL Editor
- Run: `SELECT * FROM bus_stops;`
- If empty, re-run the INSERT statements from the schema

### Realtime not working
- Check Database → Replication
- Make sure `passenger_counts` has Realtime enabled
- Check browser console for connection errors

## 📝 Database Schema Summary

```
profiles
├── id (UUID, Primary Key, refs auth.users)
├── email (TEXT, Unique)
├── full_name (TEXT)
├── user_type ('passenger' | 'driver')
└── timestamps

bus_stops
├── id (UUID, Primary Key)
├── name (TEXT)
├── address (TEXT)
├── latitude/longitude (DECIMAL)
└── route_id (TEXT)

passenger_counts (Realtime enabled)
├── id (UUID, Primary Key)
├── bus_stop_id (UUID, refs bus_stops)
├── count (INTEGER)
├── status ('normal' | 'crowded' | 'urgent')
└── timestamp

routes
├── id (UUID, Primary Key)
├── name (TEXT)
├── route_type ('bus' | 'shuttle' | 'scooter' | 'flight' | 'train')
├── origin/destination (TEXT)
├── duration_minutes (INTEGER)
└── price_min/price_max (DECIMAL)

saved_routes
├── id (UUID, Primary Key)
├── user_id (UUID, refs auth.users)
└── route_id (UUID, refs routes)

driver_assignments
├── id (UUID, Primary Key)
├── driver_id (UUID, refs profiles)
├── route_name (TEXT)
├── status ('active' | 'inactive' | 'completed')
└── timestamps

backup_requests
├── id (UUID, Primary Key)
├── driver_id (UUID, refs profiles)
├── bus_stop_id (UUID, refs bus_stops)
├── status ('pending' | 'approved' | 'rejected' | 'completed')
└── timestamps
```

---

**Time to complete**: 10-15 minutes

**Need help?** Check the Supabase docs: https://supabase.com/docs

Good luck! 🎉
