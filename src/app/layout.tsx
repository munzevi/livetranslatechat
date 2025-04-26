import type {Metadata, Viewport} from 'next';
import {Geist, Geist_Mono, Pacifico } from 'next/font/google'; // Import Pacifico
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

// Set up Pacifico font
const pacifico = Pacifico({
  weight: '400', // Pacifico only has weight 400
  subsets: ['latin'],
  variable: '--font-pacifico', // Assign CSS variable
  display: 'swap', // Improve font loading
});

export const metadata: Metadata = {
  title: 'Nicole', // Updated title
  description: 'Real-time voice translation with Nicole', // Updated description
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased bg-secondary`}> {/* Add Pacifico variable */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
