import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Still Dreaming — a website that proves itself",
    template: "%s — Still Dreaming",
  },
  description:
    "A marketing site, an automated lead-tracking system, an AI chatbot, and the funnels connecting them — built end to end with Claude, as proof of what it can do.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <div aria-hidden className="grain-overlay pointer-events-none fixed inset-0 z-40 opacity-[0.05]" />
        {children}
      </body>
    </html>
  );
}
