import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import  './globals.css'
import Head from "next/head";
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
  title: "Guls Fitness Ai",
  description: "Creates a workout and diet plan tailored to the user's needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
    </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
