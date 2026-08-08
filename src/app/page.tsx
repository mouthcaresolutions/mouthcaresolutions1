"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/mcs/Navbar";
import WhatsAppButton from "@/components/mcs/WhatsAppButton";
import Footer from "@/components/mcs/Footer";
import HeroSection from "@/components/mcs/HeroSection";
import ServiceHighlights from "@/components/mcs/ServiceHighlights";
import QuickServices from "@/components/mcs/QuickServices";
import TestimonialsSection from "@/components/mcs/TestimonialsSection";
import AboutSection from "@/components/mcs/AboutSection";
import DoctorsSection from "@/components/mcs/DoctorsSection";
import ServicesSection from "@/components/mcs/ServicesSection";
import ContactSection from "@/components/mcs/ContactSection";
import BlogSection from "@/components/mcs/BlogSection";

const sectionIds = ["home", "about", "doctors", "services", "blog", "contact"];

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("home");

  const handleNavigate = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />
      <main className="flex-1 pt-[88px]">
        {/* Mobile top bar spacer for info */}
        <div className="md:hidden bg-teal-700 text-white text-xs text-center py-1.5 px-4">
          <a href="tel:+919866344866" className="hover:underline">
            Call: +91 98663 44866
          </a>{" "}
          | Mon–Sat 10AM–8PM
        </div>

        <HeroSection />
        <ServiceHighlights />
        <QuickServices />
        <TestimonialsSection />
        <AboutSection />
        <DoctorsSection />
        <ServicesSection />
        <BlogSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}