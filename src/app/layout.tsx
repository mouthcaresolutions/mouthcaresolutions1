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
  metadataBase: new URL("https://mouthcaresolutions.com"),
  title: {
    default: "Mouth Care Solutions | Best Dental Clinic in Vijayawada",
    template: "%s | Mouth Care Solutions - Dentist Vijayawada",
  },
  description:
    "Mouth Care Solutions is a leading dental clinic in Vijayawada, Andhra Pradesh offering root canal treatment, teeth whitening, braces, dental implants, cosmetic dentistry, pediatric dentistry and more. Call 9866344866. Rated 4.8/5 by 500+ patients.",
  keywords: [
    "Dentist in Vijayawada", "Dental Clinic near me", "Dental Clinic Vijayawada",
    "Root Canal Treatment Vijayawada", "Teeth Whitening Vijayawada",
    "Braces and Aligners Vijayawada", "Dental Implants Vijayawada",
    "Cosmetic Dentistry Vijayawada", "Best Dentist Vijayawada",
    "Mouth Care Solutions", "Smile Makeover Vijayawada",
    "Wisdom Tooth Removal Vijayawada", "Gum Treatment Vijayawada",
    "Pediatric Dentist Vijayawada", "Kids Dentist Vijayawada",
    "Invisalign Vijayawada", "Clear Aligners Vijayawada",
    "Dentures Vijayawada", "Emergency Dentist Vijayawada",
    "Affordable Dental Clinic Vijayawada", "Painless Root Canal Vijayawada",
    "Dental Checkup Vijayawada", "Veneers Vijayawada",
    "Dental Clinic Suryaraopeta", "Dentist near Suryaraopeta",
    "Dental Clinic Andhra Pradesh", "Oral Surgeon Vijayawada",
    "Periodontist Vijayawada", "Endodontist Vijayawada",
    "Orthodontist Vijayawada", "Pedodontist Vijayawada",
  ],
  authors: [{ name: "Mouth Care Solutions" }],
  icons: {
    icon: "/mcs-logo.jpg",
  },
  openGraph: {
    title: "Mouth Care Solutions | Best Dental Clinic in Vijayawada",
    description:
      "Experience painless, modern dental care at Mouth Care Solutions, Vijayawada. 10 specialist dentists. Root canal, implants, braces, whitening & more. 10,000+ happy patients. Book appointment today!",
    url: "https://mouthcaresolutions.com",
    siteName: "Mouth Care Solutions",
    type: "website",
    locale: "en_IN",
    images: [{ url: "/mcs-logo.jpg", width: 200, height: 200 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mouth Care Solutions | Dentist in Vijayawada",
    description:
      "Best dental clinic in Vijayawada with 10 specialist dentists. Root canal, implants, braces, whitening & more. Call 9866344866.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://mouthcaresolutions.com",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["Dentist", "LocalBusiness", "MedicalOrganization"],
  name: "Mouth Care Solutions",
  alternateName: "MCS Dental Clinic Vijayawada",
  image: "https://mouthcaresolutions.com/mcs-logo.jpg",
  "@id": "https://mouthcaresolutions.com#business",
  url: "https://mouthcaresolutions.com",
  telephone: "+91-9866344866",
  email: "mouthcaresolutions@gmail.com",
  logo: "https://mouthcaresolutions.com/mcs-logo.jpg",
  description:
    "Mouth Care Solutions is a leading multi-specialty dental clinic in Vijayawada, Andhra Pradesh. We offer root canal treatment, dental implants, teeth whitening, braces, Invisalign, cosmetic dentistry, pediatric dentistry, oral surgery, and more. Our team of 10 specialist dentists provides painless, modern dental care with state-of-the-art technology.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Door No. 29-28-23, Bhavani Complex, Suryaraopeta",
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
  hasMap: "https://maps.app.goo.gl/fLb5iKihcmXN9N696",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "20:00",
    },
  ],
  priceRange: "$$",
  currenciesAccepted: "INR",
  paymentAccepted: "Cash, Credit Card, UPI, Debit Card",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    bestRating: "5",
    worstRating: "1",
    reviewCount: "520",
  },
  areaServed: [
    { "@type": "City", name: "Vijayawada" },
    { "@type": "State", name: "Andhra Pradesh" },
  ],
  sameAs: [
    "https://wa.me/919866344866",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Mouth Care Solutions",
  url: "https://mouthcaresolutions.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://mouthcaresolutions.com/#blog?search={search_term_string}",
    "query-input": "required name=search_term_string",
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
        <meta name="geo.region" content="IN-AP" />
        <meta name="geo.placename" content="Vijayawada" />
        <meta name="geo.position" content="16.5116;80.631" />
        <meta name="ICBM" content="16.5116, 80.631" />
        <link rel="canonical" href="https://mouthcaresolutions.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
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
