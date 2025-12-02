"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Flight = {
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  duration: string;
  price: number;
  aircraft: string;
};

export default function FlightsPage() {
  const router = useRouter();
  const [direction, setDirection] = useState<"laf-to-ord" | "ord-to-laf">("laf-to-ord");

  // Static flight schedule based on Purdue Airport website
  const lafToOrdFlights: Flight[] = [
    {
      flightNumber: "UA 5043",
      departureTime: "6:10 AM",
      arrivalTime: "6:15 AM",
      origin: "LAF",
      destination: "ORD",
      duration: "1h 5m",
      price: 98,
      aircraft: "Bombardier CRJ200"
    },
    {
      flightNumber: "UA 5070",
      departureTime: "2:37 PM",
      arrivalTime: "2:42 PM",
      origin: "LAF",
      destination: "ORD",
      duration: "1h 5m",
      price: 98,
      aircraft: "Bombardier CRJ200"
    }
  ];

  const ordToLafFlights: Flight[] = [
    {
      flightNumber: "UA 5027",
      departureTime: "12:00 PM",
      arrivalTime: "2:01 PM",
      origin: "ORD",
      destination: "LAF",
      duration: "1h 1m",
      price: 103,
      aircraft: "Bombardier CRJ200"
    },
    {
      flightNumber: "UA 5048",
      departureTime: "9:09 PM",
      arrivalTime: "11:10 PM",
      origin: "ORD",
      destination: "LAF",
      duration: "1h 1m",
      price: 103,
      aircraft: "Bombardier CRJ200"
    }
  ];

  const flights = direction === "laf-to-ord" ? lafToOrdFlights : ordToLafFlights;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Purdue Colors */}
      <div className="bg-black text-[#CFB991] p-4">
        <button onClick={() => router.push("/")} className="mb-2">
          ← Back
        </button>
        <h1 className="text-xl font-bold">United Express Flights</h1>
        <p className="text-sm text-[#CFB991]/80">Purdue Airport ↔ Chicago O'Hare</p>
      </div>

      {/* Info Banner */}
      <div className="bg-[#CFB991]/10 border-l-4 border-[#CFB991] p-3 m-4">
        <p className="text-sm text-black">
          <strong>SkyWest operated flights</strong> - 1 flight daily Tue/Wed/Sat, 2 flights daily Mon/Thu/Fri/Sun
        </p>
      </div>

      {/* Direction Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setDirection("laf-to-ord")}
            className={`flex-1 py-3 text-sm font-medium ${
              direction === "laf-to-ord"
                ? "border-b-2 border-[#CFB991] text-[#CFB991]"
                : "text-gray-500"
            }`}
          >
            West Lafayette → Chicago
          </button>
          <button
            onClick={() => setDirection("ord-to-laf")}
            className={`flex-1 py-3 text-sm font-medium ${
              direction === "ord-to-laf"
                ? "border-b-2 border-[#CFB991] text-[#CFB991]"
                : "text-gray-500"
            }`}
          >
            Chicago → West Lafayette
          </button>
        </div>
      </div>

      {/* Flights List */}
      <div className="p-4 space-y-3">
        <h2 className="font-bold text-lg">
          {direction === "laf-to-ord" ? "From Purdue Airport (LAF)" : "From O'Hare (ORD)"}
        </h2>

        {flights.map((flight, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">NONSTOP</p>
                <p className="text-sm text-gray-600 mt-1">{flight.flightNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#CFB991]">${flight.price}</p>
                <p className="text-xs text-gray-500">Economy</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-2xl font-bold">{flight.departureTime}</p>
                <p className="text-sm text-gray-600">{flight.origin}</p>
              </div>

              <div className="flex-1 mx-4 flex items-center">
                <div className="flex-1 border-t-2 border-gray-300 border-dashed"></div>
                <span className="text-xs text-gray-500 mx-2">{flight.duration}</span>
                <div className="flex-1 border-t-2 border-gray-300 border-dashed"></div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold">{flight.arrivalTime}</p>
                <p className="text-sm text-gray-600">{flight.destination}</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500">Operated by SkyWest dba United Express</p>
              <p className="text-xs text-gray-500">{flight.aircraft}</p>
            </div>

            <a
              href="https://www.united.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full bg-[#CFB991] text-black text-center py-2 rounded font-medium hover:bg-[#CEB888]"
            >
              Book on United.com
            </a>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="p-4">
        <div className="bg-gray-100 rounded p-3">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Schedule and pricing are subject to change. Visit{" "}
            <a href="https://www.united.com" className="text-[#CFB991] underline">
              United.com
            </a>{" "}
            or{" "}
            <a
              href="https://www.purdue.edu/airport/flight/"
              className="text-[#CFB991] underline"
            >
              Purdue Airport
            </a>{" "}
            for current flight information.
          </p>
        </div>
      </div>
    </div>
  );
}
