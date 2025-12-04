"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MapPin,
  AlertCircle,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  User
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

type Route = {
  id: string;
  name: string;
  shortName: string;
  color: string;
};

type Stop = {
  id: string;
  name: string;
  address: string;
  waitingCount: number;
  eta: number;
  status: "normal" | "crowded" | "urgent";
};

const AVAILABLE_ROUTES: Route[] = [
  { id: "discovery-park", name: "Discovery Park Loop", shortName: "D", color: "#CFB991" },
  { id: "purdue-mall", name: "Purdue Mall Loop", shortName: "P", color: "#9CA3AF" },
  { id: "ross-ade", name: "Ross-Ade Loop", shortName: "R", color: "#CFB991" },
];

const ROUTE_STOPS: { [key: string]: Stop[] } = {
  "discovery-park": [
    { id: "1", name: "Lynn Hall", address: "Horticulture Greenhouses, 250 West Lafayette, IN", waitingCount: 3, eta: 5, status: "normal" },
    { id: "2", name: "CL50", address: "648 Oval Dr, West Lafayette, IN", waitingCount: 5, eta: 8, status: "normal" },
    { id: "3", name: "Daniels / Russell", address: "Mitch Daniels Blv & Russell St, BUS547", waitingCount: 7, eta: 12, status: "normal" },
    { id: "4", name: "MacArthur Dr", address: "Aspire Apts at Discovery Park, BUS011", waitingCount: 4, eta: 18, status: "normal" },
    { id: "5", name: "Airport Rd / District Blvd", address: "1501 W State St, West Lafayette, IN", waitingCount: 2, eta: 25, status: "normal" },
    { id: "6", name: "Niswonger", address: "1452 Aviation Dr, West Lafayette, IN", waitingCount: 1, eta: 30, status: "normal" },
  ],
  "purdue-mall": [
    { id: "7", name: "Armstrong", address: "Armstrong Hall on Stadium Ave, BUS190", waitingCount: 8, eta: 3, status: "normal" },
    { id: "8", name: "Electrical Engineering", address: "Electrical Engineering at Shelter, BUS538", waitingCount: 6, eta: 6, status: "normal" },
    { id: "9", name: "PMU", address: "425 W State St, West Lafayette, IN", waitingCount: 15, eta: 9, status: "crowded" },
    { id: "10", name: "Daniels / Russell", address: "Mitch Daniels Blv & Russell St, BUS547", waitingCount: 5, eta: 13, status: "normal" },
    { id: "11", name: "Daniels / MacArthur", address: "Aspire Apts at Discovery Park, BUS011", waitingCount: 4, eta: 17, status: "normal" },
    { id: "12", name: "McCutcheon", address: "McCutcheon Hall on McCutcheon, BUS491E", waitingCount: 9, eta: 21, status: "normal" },
    { id: "13", name: "Hillenbrand", address: "1301 3rd Street, West Lafayette, IN", waitingCount: 7, eta: 25, status: "normal" },
    { id: "14", name: "CoRec", address: "RSC on Jischke Dr, BUS362", waitingCount: 6, eta: 28, status: "normal" },
  ],
  "ross-ade": [
    { id: "15", name: "Armstrong", address: "Armstrong Hall on Stadium Ave, BUS190", waitingCount: 5, eta: 5, status: "normal" },
    { id: "16", name: "Electrical Engineering", address: "Electrical Engineering at Shelter, BUS538", waitingCount: 8, eta: 8, status: "normal" },
    { id: "17", name: "PMU", address: "425 W State St, West Lafayette, IN", waitingCount: 12, eta: 10, status: "crowded" },
    { id: "18", name: "Daniels/University", address: "Matthews (Mary L.) Hall, 812 W State St", waitingCount: 6, eta: 15, status: "normal" },
    { id: "19", name: "Armory", address: "305 N University St, West Lafayette, IN", waitingCount: 3, eta: 18, status: "normal" },
    { id: "20", name: "Tiller Dr", address: "850 Steven Beering Dr, West Lafayette, IN", waitingCount: 4, eta: 22, status: "normal" },
    { id: "21", name: "Hilltop", address: "Tower Dr & Hilltop Dr, BUS472N", waitingCount: 2, eta: 27, status: "normal" },
    { id: "22", name: "David Ross Rd / Tower Dr", address: "800 David Ross Rd, West Lafayette, IN", waitingCount: 3, eta: 32, status: "normal" },
  ],
};

type MessageType = "late" | "early" | "paused" | "arrived";

export default function DriverDashboard() {
  const [currentRoute, setCurrentRoute] = useState<Route>(AVAILABLE_ROUTES[2]); // Ross-Ade Loop
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{type: MessageType, minutes?: number} | null>(null);
  const [stops, setStops] = useState<Stop[]>(ROUTE_STOPS["ross-ade"]);
  const [driverName, setDriverName] = useState<string>("Driver");

  // Fetch driver profile
  useEffect(() => {
    async function fetchDriverProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          setDriverName(profile.full_name);
        }
      }
    }

    fetchDriverProfile();
  }, []);

  const totalWaiting = stops.reduce((sum, stop) => sum + stop.waitingCount, 0);
  const stopsAhead = stops.length;
  const urgentStops = stops.filter(s => s.status === "urgent").length;
  const nextStop = stops[0];

  function handleQuickMessage(type: MessageType, minutes?: number) {
    setSelectedMessage({ type, minutes });
    setShowMessageModal(true);
  }

  function confirmMessage() {
    if (!selectedMessage) return;

    // Here you would send the notification to passengers
    console.log("Sending notification:", selectedMessage);
    alert(`Notification sent: ${getMessageText(selectedMessage.type, selectedMessage.minutes)}`);

    setShowMessageModal(false);
    setSelectedMessage(null);
  }

  function getMessageText(type: MessageType, minutes?: number): string {
    switch (type) {
      case "late":
        return `Bus is running ${minutes} minutes late`;
      case "early":
        return `Bus will arrive ${minutes} minutes early`;
      case "paused":
        return "Bus is temporarily paused due to emergency/technical difficulty";
      case "arrived":
        return "Bus has arrived at the stop";
      default:
        return "";
    }
  }

  function switchRoute(route: Route) {
    setCurrentRoute(route);
    setStops(ROUTE_STOPS[route.id]);
    setShowRouteSelector(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-[#CFB991] p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-sm text-[#CFB991]/80">Welcome, {driverName}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-[#CFB991] hover:text-[#CEB888]"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="text-[#CFB991] hover:text-[#CEB888]"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Route Selector */}
        <div className="mt-3">
          <button
            onClick={() => setShowRouteSelector(!showRouteSelector)}
            className="w-full flex items-center justify-between bg-[#CFB991] text-black px-4 py-3 rounded-lg font-semibold"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: currentRoute.color }}
              >
                {currentRoute.shortName}
              </div>
              <span>Route: {currentRoute.name}</span>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${showRouteSelector ? 'rotate-180' : ''}`} />
          </button>

          {showRouteSelector && (
            <div className="mt-2 space-y-2">
              {AVAILABLE_ROUTES.map(route => (
                <button
                  key={route.id}
                  onClick={() => switchRoute(route)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                    currentRoute.id === route.id ? 'bg-[#CFB991] text-black' : 'bg-white text-black'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: route.color }}
                  >
                    {route.shortName}
                  </div>
                  <span className="font-medium">{route.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <div className="text-3xl font-bold">{totalWaiting}</div>
            <div className="text-xs text-muted-foreground">Total Waiting</div>
          </Card>
          <Card className="p-4 text-center">
            <MapPin className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <div className="text-3xl font-bold">{stopsAhead}</div>
            <div className="text-xs text-muted-foreground">Stops Ahead</div>
          </Card>
          <Card className="p-4 text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <div className="text-3xl font-bold">{urgentStops}</div>
            <div className="text-xs text-muted-foreground">Urgent</div>
          </Card>
        </div>

        {/* Quick Messages Section */}
        <Card className="p-4 border-2 border-[#CFB991]">
          <div className="flex items-center gap-2 mb-4">
            <Send className="h-5 w-5 text-[#CFB991]" />
            <h2 className="text-lg font-bold">Quick Messages to Passengers</h2>
          </div>

          <div className="space-y-3">
            {/* Late Messages */}
            <div>
              <p className="text-sm font-semibold mb-2">Bus Running Late</p>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map(mins => (
                  <Button
                    key={`late-${mins}`}
                    onClick={() => handleQuickMessage("late", mins)}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    +{mins} min
                  </Button>
                ))}
              </div>
            </div>

            {/* Early Messages */}
            <div>
              <p className="text-sm font-semibold mb-2">Bus Arriving Early</p>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map(mins => (
                  <Button
                    key={`early-${mins}`}
                    onClick={() => handleQuickMessage("early", mins)}
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    -{mins} min
                  </Button>
                ))}
              </div>
            </div>

            {/* Emergency/Paused */}
            <Button
              onClick={() => handleQuickMessage("paused")}
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Bus Paused (Emergency/Technical)
            </Button>

            {/* Arrived */}
            <Button
              onClick={() => handleQuickMessage("arrived")}
              variant="outline"
              className="w-full border-[#CFB991] text-black hover:bg-[#CFB991]/10"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Bus Has Arrived
            </Button>
          </div>
        </Card>

        {/* Next Stop */}
        {nextStop && (
          <Card className="p-4 border-l-4 border-[#CFB991]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#CFB991] flex items-center justify-center">
                <MapPin className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Next Stop</h3>
                <p className="text-sm text-gray-600">{nextStop.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm mt-3">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>ETA: {nextStop.eta} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{nextStop.waitingCount} waiting</span>
              </div>
            </div>
          </Card>
        )}

        {/* Upcoming Stops */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Upcoming Stops</h2>
            <Button variant="ghost" size="sm">Refresh</Button>
          </div>

          <div className="space-y-3">
            {stops.map((stop, index) => (
              <Card key={stop.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#CFB991] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold">{stop.name}</h3>
                        <p className="text-xs text-muted-foreground">{stop.address}</p>
                      </div>
                      {stop.status === "crowded" && (
                        <Badge variant="destructive" className="ml-2">CROWDED</Badge>
                      )}
                      {stop.status === "normal" && (
                        <Badge variant="secondary" className="ml-2 bg-[#CFB991] text-black">NORMAL</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm mt-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{stop.waitingCount} waiting</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>ETA: {stop.eta} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Message</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to send this notification to all passengers?
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="font-semibold text-center">
                {getMessageText(selectedMessage.type, selectedMessage.minutes)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowMessageModal(false)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#CFB991] text-black hover:bg-[#CEB888]"
                onClick={confirmMessage}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Yes, Send
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
