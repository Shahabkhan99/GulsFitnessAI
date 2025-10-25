import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import  './globals.css'
// 1. REMOVE THIS IMPORT:
// import Head from "next/head"; 
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fit Ai",
  description: "Creates a workout and diet plan tailored to the user's needs.",
  // 2. ADD VIEWPORT HERE INSTEAD OF <Head>:
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* 3. REMOVE THE <Head> ... </Head> TAGS FROM HERE */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}