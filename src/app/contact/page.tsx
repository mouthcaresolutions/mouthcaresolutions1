"use client";

import PublicLayout from "@/components/mcs/PublicLayout";
import ContactSection from "@/components/mcs/ContactSection";

export default function ContactPage() {
  return (
    <PublicLayout activeNav="/contact">
      <ContactSection />
    </PublicLayout>
  );
}