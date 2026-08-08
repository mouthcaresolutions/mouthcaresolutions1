"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { id: "home", label: "Home" },
  { id: "about", label: "About Us" },
  { id: "doctors", label: "Our Doctors" },
  { id: "services", label: "Services" },
  { id: "blog", label: "Blog" },
  { id: "contact", label: "Contact Us" },
];

interface NavbarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

export default function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      {/* Top bar */}
      <div className="bg-teal-700 text-white text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              +91 98663 44866
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Mon–Sat 10:00 AM – 8:00 PM
            </span>
          </div>
          <span className="text-teal-100">
            Door No. 29-28-23, Bhavani Complex, Suryaraopeta, Vijayawada
          </span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => handleNav("home")}
          className="flex items-center gap-3 shrink-0"
        >
          <img
            src="/mcs-logo.jpg"
            alt="Mouth Care Solutions Logo"
            className="h-11 w-11 rounded-full object-cover border-2 border-teal-600"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-teal-800 leading-tight">
              Mouth Care Solutions
            </h1>
            <p className="text-xs text-teal-600 font-medium">
              Smile with us
            </p>
          </div>
        </button>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === link.id
                  ? "bg-teal-600 text-white"
                  : "text-gray-700 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              {link.label}
            </button>
          ))}
          <Button
            onClick={() =>
              window.open(
                "https://wa.me/919866344866?text=Hi%2C%20I%20would%20like%20to%20book%20an%20appointment.",
                "_blank"
              )
            }
            className="ml-3 bg-teal-600 hover:bg-teal-700 text-white"
          >
            Book Appointment
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 rounded-md hover:bg-teal-50"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6 text-teal-700" />
          ) : (
            <Menu className="h-6 w-6 text-teal-700" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-teal-100 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === link.id
                      ? "bg-teal-600 text-white"
                      : "text-gray-700 hover:bg-teal-50"
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2">
                <Button
                  onClick={() =>
                    window.open(
                      "https://wa.me/919866344866?text=Hi%2C%20I%20would%20like%20to%20book%20an%20appointment.",
                      "_blank"
                    )
                  }
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Book Appointment
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
