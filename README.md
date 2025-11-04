# Voiture

**Campus Transit Made Simple**

Voiture is a unified campus transportation app prototype designed to make campus transit more accessible by consolidating multiple transportation options into a single, easy-to-use mobile interface.

## Mission

Taking down the inconvenience of having multiple apps to just get from point A to point B on campus. Voiture brings together all campus transportation services - buses, shuttles, scooters, and flights - into one streamlined experience.

## Features

### For Passengers
- **Multi-modal Route Search**: Rome2Rio-inspired interface to compare different transportation options
- **Smart Route Comparison**: Sort routes by fastest, cheapest, or most convenient (least transfers)
- **Transportation Services**:
  - Purdue Campus Transit (CityBus)
  - Jagline (Indianapolis)
  - Campus Shuttle (West Lafayette <-> Indianapolis)
  - Scooter Services (Veo/Bird)
  - Flights (Purdue Airport)
- **Real-time Information**: Route details with duration, pricing, and transfer information
- **Mobile-First Design**: Optimized for mobile devices

### For Bus Drivers
- **Passenger Count Dashboard**: Real-time view of waiting passengers at each bus stop
- **IoT Integration**: Uses Raspberry Pi/Flipper Zero to detect phone signals at bus stops
- **Route Overview**: See all upcoming stops with ETA and passenger counts
- **Capacity Alerts**: Visual indicators for crowded or urgent stops
- **Backup Request System**: Request additional buses when capacity is reached

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get up and running in 5 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide with Supabase setup
- **[.env.example](.env.example)** - Environment variables template

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Voiture.git
cd Voiture
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
Voiture/
├── app/
│   ├── auth/              # Authentication pages
│   ├── routes/            # Route search and comparison
│   ├── driver-dashboard/  # Bus driver dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## Transportation Services

### Currently Integrated (UI Ready)
- **Purdue Campus Transit**: CityBus routes serving West Lafayette campus
- **Jagline**: Indianapolis public transit
- **Campus Shuttle**: Direct shuttle service between campuses
- **Scooter Services**: Veo and Bird electric scooters
- **Flights**: Purdue Airport flight information

### API Integration Status
Most transportation APIs are private and require authorization. The current implementation includes:
- Mock data for demonstration
- UI/UX ready for API integration
- Placeholder components for all services

## Future Development

### Phase 1 (Current)
- [x] Basic UI/UX prototype
- [x] Authentication system
- [x] Route comparison interface
- [x] Driver dashboard prototype

### Phase 2 (Planned)
- [ ] Real-time API integration for transportation services
- [ ] Google Maps Distance Matrix API for travel time calculation
- [ ] Flight tracking integration (Flighty API)
- [ ] Skyscanner API for flight pricing
- [ ] Database implementation for user data

### Phase 3 (Planned)
- [ ] IoT integration with Raspberry Pi/Flipper Zero
- [ ] Real-time passenger counting at bus stops
- [ ] Push notifications for route updates
- [ ] Saved routes and favorites
- [ ] User preferences and history

### Phase 4 (Future)
- [ ] Backend API development
- [ ] Real-time bus tracking
- [ ] Payment integration
- [ ] Social features (ride sharing, carpooling)

## IoT Passenger Counting System

The driver dashboard is designed to work with an IoT system that counts waiting passengers:

**Hardware Options**:
- Raspberry Pi with WiFi/Bluetooth scanning
- Flipper Zero for signal detection

**How It Works**:
1. Sensors detect phone signals in a specific radius of the bus stop
2. Data is sent to the backend in real-time
3. Driver dashboard displays passenger counts and alerts
4. Drivers can request backup buses for high-capacity stops

## Contributing

This is a prototype project for making campus transportation more accessible. Contributions are welcome!

## License

ISC

## Contact

For questions or suggestions, please open an issue on GitHub.

---

*Built with Next.js and shadcn/ui*
