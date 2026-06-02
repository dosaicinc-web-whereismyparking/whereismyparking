import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhereIsMyParking - Find Parking in India",
  description: "Discover nearby parking spaces in urban India. Public and private parking available.",
  keywords: ["parking", "India", "urban", "GPS"],
  authors: [{ name: "WhereIsMyParking" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body
        className={`${inter.className} h-screen overflow-hidden`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
