"use client";

import PublicLayout from "@/components/mcs/PublicLayout";
import ServicesSection from "@/components/mcs/ServicesSection";

export default function ServicesPage() {
  return (
    <PublicLayout activeNav="/services">
      <ServicesSection />
    </PublicLayout>
  );
}