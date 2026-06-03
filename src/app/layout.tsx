import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1A4A8A",
};

export const metadata: Metadata = {
  title: "WhereIsMyParking - Find Parking in India",
  description: "Discover nearby parking spaces in urban India. Public and private parking available.",
  keywords: ["parking", "India", "urban", "GPS"],
  authors: [{ name: "WhereIsMyParking" }],
  openGraph: {
    title: "WhereIsMyParking - Find Parking in India",
    description: "Discover nearby parking spaces in urban India. Public and private parking available.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "WhereIsMyParking - Find Parking in India",
    description: "Discover nearby parking spaces in urban India. Public and private parking available.",
  },
  alternates: {
    canonical: "https://whereismyparking.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="theme-color" content="#1A4A8A" />
      </head>
      <body
        className={`${inter.className}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
