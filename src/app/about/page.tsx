"use client";

import PublicLayout from "@/components/mcs/PublicLayout";
import AboutSection from "@/components/mcs/AboutSection";

export default function AboutPage() {
  return (
    <PublicLayout activeNav="/about">
      <AboutSection />
    </PublicLayout>
  );
}