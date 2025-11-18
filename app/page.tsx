"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeftRight, MapPin, User } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Voiture</h1>
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="text-primary-foreground">
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Campus Transit Made Simple</h2>
          <p className="text-muted-foreground text-sm">
            Find the fastest, cheapest, and most convenient routes across campus
          </p>
        </div>

        {/* Search Card */}
        <Card className="p-4 mb-6 shadow-lg">
          <div className="space-y-4">
            {/* Origin Input */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-green-600" />
              <Input
                type="text"
                placeholder="Origin (e.g., West Lafayette)"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwapLocations}
                className="rounded-full"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Destination Input */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-red-600" />
              <Input
                type="text"
                placeholder="Destination (e.g., Indianapolis)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Button */}
            <Link href="/routes">
              <Button className="w-full" size="lg">
                Search Routes
              </Button>
            </Link>
          </div>
        </Card>

        {/* Quick Access Cards */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Transportation Services</h3>

          <Link href="/routes">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Purdue Campus Transit</h4>
                  <p className="text-sm text-muted-foreground">CityBus routes on campus</p>
                </div>
                <div className="text-2xl">🚌</div>
              </div>
            </Card>
          </Link>

          <Link href="/jagline">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Jagline Live Buses</h4>
                  <p className="text-sm text-muted-foreground">Real-time IUPUI buses</p>
                </div>
                <div className="text-2xl">🚍</div>
              </div>
            </Card>
          </Link>

          <Link href="/routes">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Campus Shuttle</h4>
                  <p className="text-sm text-muted-foreground">West Lafayette ↔ Indianapolis</p>
                </div>
                <div className="text-2xl">🚐</div>
              </div>
            </Card>
          </Link>

          <Link href="/scooters">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Scooter Services</h4>
                  <p className="text-sm text-muted-foreground">Lime & Veo scooters</p>
                </div>
                <div className="text-2xl">🛴</div>
              </div>
            </Card>
          </Link>

          <Link href="/routes">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Flights</h4>
                  <p className="text-sm text-muted-foreground">Purdue Airport departures</p>
                </div>
                <div className="text-2xl">✈️</div>
              </div>
            </Card>
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t bg-background p-4">
        <div className="flex justify-around">
          <Button variant="ghost" className="flex-1">
            Home
          </Button>
          <Button variant="ghost" className="flex-1">
            Routes
          </Button>
          <Button variant="ghost" className="flex-1">
            Saved
          </Button>
        </div>
      </nav>
    </div>
  );
}
