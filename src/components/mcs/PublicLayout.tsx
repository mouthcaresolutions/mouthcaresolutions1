"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import WhatsAppButton from "./WhatsAppButton";
import Footer from "./Footer";

export default function PublicLayout({ children, activeNav }: { children: React.ReactNode; activeNav: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarPublic activeNav={activeNav} scrolled={scrolled} />
      <main className="flex-1 pt-[88px]">
        <div className="md:hidden bg-teal-700 text-white text-xs text-center py-1.5 px-4">
          <a href="tel:+919866344866" className="hover:underline">Call: +91 98663 44866</a>{" "}
          | Mon–Sat 10AM–8PM
        </div>
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function NavbarPublic({ activeNav, scrolled }: { activeNav: string; scrolled: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/doctors", label: "Our Doctors" },
    { href: "/services", label: "Services" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact Us" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return activeNav === "/";
    return activeNav.startsWith(href);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white/80 backdrop-blur-sm"}`}>
      {/* Top bar */}
      <div className="bg-teal-700 text-white text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              +91 98663 44866
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Mon–Sat 10:00 AM – 8:00 PM
            </span>
          </div>
          <span className="text-teal-100">Door No. 29-28-23, Bhavani Complex, Suryaraopeta, Vijayawada</span>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 shrink-0">
          <img src="/mcs-logo.jpg" alt="Mouth Care Solutions Logo" className="h-11 w-11 rounded-full object-cover border-2 border-teal-600" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-teal-800 leading-tight">Mouth Care Solutions</h1>
            <p className="text-xs text-teal-600 font-medium">Smile with us</p>
          </div>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.href) ? "bg-teal-600 text-white" : "text-gray-700 hover:bg-teal-50 hover:text-teal-700"}`}>
              {link.label}
            </a>
          ))}
          <a href="https://wa.me/919866344866?text=Hi%2C%20I%20would%20like%20to%20book%20an%20appointment." target="_blank" rel="noopener noreferrer" className="ml-3 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Book Appointment
          </a>
        </div>

        <button className="lg:hidden p-2 rounded-md hover:bg-teal-50" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <svg className="h-6 w-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="h-6 w-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
        </button>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-teal-100 overflow-hidden">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.href) ? "bg-teal-600 text-white" : "text-gray-700 hover:bg-teal-50"}`}>
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <a href="https://wa.me/919866344866?text=Hi%2C%20I%20would%20like%20to%20book%20an%20appointment." target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                Book Appointment
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
