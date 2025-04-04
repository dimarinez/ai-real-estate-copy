import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import SessionProviderWrapper from './components/SessionProviderWrapper';
import Navbar from './components/Navbar';
import LinkedInInsightTag from './components/LinkedInInsightTag';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Real Estate Copy - Generate Listings & Posts",
  description: "Create AI-powered real estate listings and social media posts with precision and engagement effortlessly.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-YE24MELHFK"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-YE24MELHFK');
              gtag('config', 'AW-XXXXXXXXX'); // Add Google Ads Conversion ID
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <SessionProviderWrapper>
          <Navbar />
          {children}
          <footer className="p-4 text-center text-gray-500">
            © {new Date().getFullYear()} AI Real Estate Copy. All rights reserved.
          </footer>
        </SessionProviderWrapper>
        <LinkedInInsightTag />
      </body>
    </html>
  );
}