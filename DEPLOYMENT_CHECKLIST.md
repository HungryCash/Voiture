# Deployment Checklist

Use this checklist to ensure smooth deployment to Vercel with Supabase.

## Pre-Deployment Setup

### 1. Supabase Setup
- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create new project named `voiture-campus-transit`
- [ ] Save database password securely
- [ ] Copy Project URL from Settings → API
- [ ] Copy `anon` public key from Settings → API
- [ ] Copy `service_role` key from Settings → API
- [ ] Run all SQL commands from DEPLOYMENT.md in SQL Editor
- [ ] Verify tables created: profiles, bus_stops, passenger_counts, routes, saved_routes, driver_assignments, backup_requests
- [ ] Insert sample data (optional, for testing)
- [ ] Enable Realtime for `passenger_counts` table

### 2. Environment Variables
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Supabase URL: `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Fill in Supabase anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Fill in Supabase service role key: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] (Optional) Add Google Maps API key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 3. Local Testing
- [ ] Run `npm install` to ensure all dependencies installed
- [ ] Run `npm run dev` and verify app runs at localhost:3000
- [ ] Test home page loads correctly
- [ ] Test navigation to `/auth` page
- [ ] Test navigation to `/routes` page
- [ ] Test navigation to `/driver-dashboard` page
- [ ] Verify no console errors in browser
- [ ] Test on mobile viewport (F12 → Toggle device toolbar)

### 4. Git Repository
- [ ] Initialize git: `git init` (if not already done)
- [ ] Add all files: `git add .`
- [ ] Commit: `git commit -m "Initial commit: Voiture campus transit app"`
- [ ] Create GitHub repository (public or private)
- [ ] Add remote: `git remote add origin <your-repo-url>`
- [ ] Push to GitHub: `git push -u origin main`

## Vercel Deployment

### 5. Vercel Account Setup
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Connect GitHub account to Vercel
- [ ] Verify access to your repository

### 6. Import Project
- [ ] Click "New Project" in Vercel dashboard
- [ ] Select your GitHub repository
- [ ] Framework Preset: Should auto-detect as "Next.js"
- [ ] Root Directory: `./` (default)
- [ ] Build Command: `npm run build` (default)
- [ ] Output Directory: `.next` (default)
- [ ] Install Command: `npm install` (default)

### 7. Environment Variables in Vercel
Add these in Project Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key
- [ ] Set for: Production, Preview, Development (check all three)

Optional (for later):
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `FLIGHTY_API_KEY`
- [ ] `SKYSCANNER_API_KEY`

### 8. Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Check build logs for any errors
- [ ] Verify deployment succeeded

### 9. Post-Deployment Testing
- [ ] Visit your Vercel URL (e.g., `voiture.vercel.app`)
- [ ] Test home page loads
- [ ] Test all page navigation
- [ ] Test sign up functionality (create test account)
- [ ] Test sign in functionality
- [ ] Test driver dashboard access
- [ ] Test on mobile device (actual phone or browser DevTools)
- [ ] Check browser console for errors
- [ ] Test route search functionality

### 10. Supabase Configuration for Production
- [ ] Go to Supabase dashboard → Authentication → URL Configuration
- [ ] Add your Vercel URL to "Site URL": `https://your-app.vercel.app`
- [ ] Add to "Redirect URLs": `https://your-app.vercel.app/**`
- [ ] Save changes

### 11. Custom Domain (Optional)
- [ ] Purchase domain (if needed)
- [ ] Go to Vercel → Project Settings → Domains
- [ ] Add custom domain
- [ ] Follow DNS configuration instructions
- [ ] Wait for DNS propagation (can take 24-48 hours)
- [ ] Update Supabase redirect URLs with custom domain

## Post-Deployment

### 12. Monitoring
- [ ] Set up Vercel Analytics (optional)
- [ ] Monitor Supabase dashboard for usage
- [ ] Check Vercel logs for errors
- [ ] Set up error tracking (Sentry, optional)

### 13. Documentation
- [ ] Update README.md with live URL
- [ ] Document any issues encountered
- [ ] Share with team/stakeholders

### 14. Security
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Confirm sensitive keys not committed to Git
- [ ] Review Supabase RLS policies
- [ ] Enable Supabase MFA for your account (Settings → Account)

## Future Enhancements

### API Integration
- [ ] Obtain Google Maps API key
- [ ] Integrate Google Maps Distance Matrix API
- [ ] Obtain transportation API keys (CityBus, Jagline, etc.)
- [ ] Set up Flight APIs (Flighty, Skyscanner)
- [ ] Configure scooter APIs (Veo, Bird)

### IoT Setup
- [ ] Purchase Raspberry Pi or Flipper Zero
- [ ] Set up WiFi/Bluetooth scanning
- [ ] Create API endpoint for sensor data
- [ ] Test passenger counting at bus stops
- [ ] Deploy sensors at actual locations

### Features
- [ ] Implement real-time route tracking
- [ ] Add push notifications
- [ ] Implement payment system
- [ ] Add trip history
- [ ] Create admin dashboard
- [ ] Add analytics/reporting

## Troubleshooting

### Build Fails
- Check Node.js version (need 18+)
- Verify all dependencies in package.json
- Check for TypeScript errors: `npm run lint`
- Review build logs in Vercel

### Authentication Not Working
- Verify environment variables are set
- Check Supabase redirect URLs
- Confirm Site URL matches deployment
- Check browser console for errors

### Database Connection Issues
- Verify Supabase keys in Vercel
- Check RLS policies in Supabase
- Confirm tables exist
- Test connection locally first

### Images/Assets Not Loading
- Check public folder structure
- Verify Next.js image optimization settings
- Check browser console for 404 errors

## Success Criteria

Your deployment is successful when:
- ✅ App loads on Vercel URL
- ✅ All pages accessible and render correctly
- ✅ Authentication works (sign up/sign in)
- ✅ Database queries return data
- ✅ Mobile view works properly
- ✅ No console errors
- ✅ All routes navigate correctly

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Your DEPLOYMENT.md](./DEPLOYMENT.md)
- [Your QUICK_START.md](./QUICK_START.md)

---

**Estimated Time**: 30-45 minutes for first deployment

**Remember**: Save your Supabase keys and passwords securely!

Good luck! 🚀
