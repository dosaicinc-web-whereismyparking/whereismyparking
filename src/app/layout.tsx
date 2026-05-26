import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}
