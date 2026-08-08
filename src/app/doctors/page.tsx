"use client";

import PublicLayout from "@/components/mcs/PublicLayout";
import DoctorsSection from "@/components/mcs/DoctorsSection";

export default function DoctorsPage() {
  return (
    <PublicLayout activeNav="/doctors">
      <DoctorsSection />
    </PublicLayout>
  );
}