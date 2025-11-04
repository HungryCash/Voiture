import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voiture - Campus Transit Made Simple",
  description: "Unified campus transportation app for Purdue students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="max-w-md mx-auto min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
