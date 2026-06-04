import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resumio-AI – AI Job Matcher & Portfolio Advisor",
  description: "Free AI job matcher. Upload your resume, search real jobs, get AI compatibility scores, and discover portfolio projects to boost your candidacy.",
  keywords: ["AI job search", "job matcher", "resume screening", "portfolio projects", "career advice", "job recommendations"],
  authors: [{ name: "Jake Sanders" }],
  openGraph: {
    title: "Resumio-AI – AI Job Matcher & Portfolio Advisor",
    description: "Free AI job matcher. Upload your resume, search real jobs, get AI compatibility scores, and discover portfolio projects to boost your candidacy.",
    type: "website",
    url: "https://myresumio.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Resumio-AI – AI Job Matcher & Portfolio Advisor",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Resumio-AI – AI Job Matcher & Portfolio Advisor",
    description: "Free AI job matcher. Upload your resume, search real jobs, get AI compatibility scores, and discover portfolio projects.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          id="resumio-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Resumio-AI",
              description: "Free AI job matcher that uploads your resume, searches real jobs, provides AI compatibility scores, and recommends portfolio projects to boost your candidacy.",
              url: "https://myresumio.app",
              applicationCategory: "UtilityApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Jake Sanders",
              },
            }),
          }}
        />
        <Script
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          data-name="BMC-Widget"
          data-cfasync="false"
          data-id="jsanders"
          data-description="Support Resumio-AI on Buy Me a Coffee!"
          data-message="If Resumio-AI helped your job search, buy me a coffee to keep it free ☕"
          data-color="#6366f1"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
