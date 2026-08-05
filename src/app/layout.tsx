import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mouth Care Solutions | Best Dental Clinic in Vijayawada",
  description:
    "Mouth Care Solutions is a leading dental clinic in Vijayawada, Andhra Pradesh offering root canal treatment, teeth whitening, braces, dental implants, cosmetic dentistry and more. Call 9866344866.",
  keywords: [
    "Dentist in Vijayawada",
    "Dental Clinic near me",
    "Root Canal Treatment Vijayawada",
    "Teeth Whitening Vijayawada",
    "Braces and Aligners Vijayawada",
    "Dental Implants Vijayawada",
    "Cosmetic Dentistry Vijayawada",
    "Best Dentist Vijayawada",
    "Mouth Care Solutions",
    "Dental Clinic Vijayawada",
  ],
  authors: [{ name: "Mouth Care Solutions" }],
  icons: {
    icon: "/mcs-logo.jpg",
  },
  openGraph: {
    title: "Mouth Care Solutions | Best Dental Clinic in Vijayawada",
    description:
      "Experience painless, modern dental care at Mouth Care Solutions, Vijayawada. Services include root canal, implants, braces, whitening & more. Book appointment today!",
    url: "https://mouthcaresolutions.com",
    siteName: "Mouth Care Solutions",
    type: "website",
    images: [{ url: "/mcs-logo.jpg", width: 200, height: 200 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mouth Care Solutions | Dentist in Vijayawada",
    description:
      "Best dental clinic in Vijayawada. Root canal, implants, braces, whitening & more. Call 9866344866.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://mouthcaresolutions.com",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["Dentist", "LocalBusiness"],
              name: "Mouth Care Solutions",
              image: "/mcs-logo.jpg",
              "@id": "https://mouthcaresolutions.com",
              url: "https://mouthcaresolutions.com",
              telephone: "+91-9866344866",
              email: "mouthcaresolutions@gmail.com",
              address: {
                "@type": "PostalAddress",
                streetAddress:
                  "Door No. 29-28-23, Bhavani Complex, Suryaraopeta",
                addressLocality: "Vijayawada",
                addressRegion: "Andhra Pradesh",
                postalCode: "520002",
                addressCountry: "IN",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 16.5116,
                longitude: 80.631,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ],
                  opens: "10:00",
                  closes: "20:00",
                },
              ],
              priceRange: "$$",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                reviewCount: "520",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
