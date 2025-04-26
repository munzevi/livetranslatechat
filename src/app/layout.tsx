import type {Metadata, Viewport} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TranslateChat',
  description: 'Real-time voice translation',
  manifest: '/manifest.json', // Link the manifest file
  icons: { // Optional: Define icons for PWA/bookmarks
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
};

// Add viewport configuration for PWA theme color
export const viewport: Viewport = {
  themeColor: '#008080', // Match theme_color in manifest.json
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       {/*
         No need to add <link rel="manifest"> or <meta name="theme-color"> manually.
         Next.js handles this automatically based on the metadata and viewport exports.
       */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-secondary`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
