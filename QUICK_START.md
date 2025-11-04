# Quick Start Guide - Voiture

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in at minimum (for basic functionality):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

### Step 3: Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📦 What's Included

### Pages Built:
- ✅ **Home** (`/`) - Search interface for routes
- ✅ **Auth** (`/auth`) - Login/Signup for passengers & drivers
- ✅ **Routes** (`/routes`) - Rome2Rio-style route comparison
- ✅ **Driver Dashboard** (`/driver-dashboard`) - Real-time passenger counts

### Features:
- ✅ Mobile-first responsive design
- ✅ shadcn/ui components
- ✅ TypeScript throughout
- ✅ Supabase ready (auth + database)
- ✅ Mock data for all transportation types

---

## 🗄️ Database Setup (Supabase)

### Quick Setup:
1. Create project at [supabase.com](https://supabase.com)
2. Copy SQL from `DEPLOYMENT.md` → Run in SQL Editor
3. Get API keys from Settings → API
4. Add keys to `.env.local`

### Tables Created:
- `profiles` - User accounts (passenger/driver)
- `bus_stops` - All bus stop locations
- `passenger_counts` - Real-time counts (IoT data)
- `routes` - Transportation routes
- `saved_routes` - User favorites
- `driver_assignments` - Current driver routes
- `backup_requests` - Additional bus requests

---

## 🎨 Using Supabase in Your Code

### Client-side (React Components):
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()

  // Sign up
  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'user@purdue.edu',
      password: 'password',
    })
  }

  // Get data
  const getData = async () => {
    const { data } = await supabase
      .from('bus_stops')
      .select('*')
  }
}
```

### Server-side (Server Components/Actions):
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  const { data: busStops } = await supabase
    .from('bus_stops')
    .select('*')

  return <div>...</div>
}
```

### Real-time Updates:
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function LiveCounts() {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('passenger-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'passenger_counts'
      }, (payload) => {
        console.log('Update:', payload)
        // Update your UI
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
```

---

## 🚢 Deploy to Vercel

### One Command:
```bash
vercel
```

Or use the Vercel dashboard:
1. Import GitHub repo
2. Add environment variables
3. Deploy!

See `DEPLOYMENT.md` for detailed instructions.

---

## 📱 Testing the App

### As a Passenger:
1. Go to `/auth`
2. Sign up with "Passenger" selected
3. Search for routes on home page
4. View route comparisons
5. Save favorite routes

### As a Driver:
1. Go to `/auth`
2. Sign up with "Driver" selected
3. You'll be redirected to `/driver-dashboard`
4. See real-time passenger counts
5. Request backup buses when needed

---

## 🔑 API Keys You'll Need

### Now (for MVP):
- ✅ Supabase keys (required for auth/database)

### Soon (for full functionality):
- Google Maps API (route calculation)
- Flight APIs (Flighty, Skyscanner)

### Later (for real-time data):
- CityBus API
- Jagline API
- Veo/Bird APIs

---

## 🛠️ Development Tips

### Add a new shadcn component:
```bash
npx shadcn@latest add dialog
```

### Generate TypeScript types from Supabase:
```bash
npx supabase gen types typescript --project-id your-project-id > lib/types/database.types.ts
```

### Build for production:
```bash
npm run build
npm start
```

---

## 📚 Project Structure

```
Voiture/
├── app/                        # Next.js App Router
│   ├── auth/                   # Authentication pages
│   ├── routes/                 # Route search & comparison
│   ├── driver-dashboard/       # Driver interface
│   ├── layout.tsx              # Root layout
│   └── page.tsx               # Home page
├── components/ui/              # shadcn/ui components
├── lib/
│   ├── supabase/              # Supabase clients
│   ├── types/                 # TypeScript types
│   └── utils.ts               # Utilities
├── .env.local                 # Your environment variables
├── middleware.ts              # Auth middleware
└── DEPLOYMENT.md              # Full deployment guide
```

---

## 🆘 Common Issues

### "Module not found" errors:
```bash
npm install
```

### Environment variables not working:
- Restart dev server after changing `.env.local`
- Variables must start with `NEXT_PUBLIC_` for client-side

### Supabase connection fails:
- Check URL and keys in `.env.local`
- Verify tables exist in Supabase dashboard
- Check RLS policies are set up

### Build fails:
```bash
rm -rf .next
npm run build
```

---

## 🎯 Next Steps

1. **Set up Supabase** (15 min)
   - Create project
   - Run SQL schema
   - Get API keys

2. **Deploy to Vercel** (5 min)
   - Push to GitHub
   - Import to Vercel
   - Add env vars

3. **Add Google Maps** (optional)
   - Get API key
   - Integrate for route calculation
   - Show map views

4. **IoT Integration** (future)
   - Set up Raspberry Pi
   - Connect to Supabase
   - Update passenger counts

---

## 📞 Need Help?

- Check `DEPLOYMENT.md` for detailed setup
- Check `README.md` for project overview
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)

Happy coding! 🎉
