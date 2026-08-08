"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            Contact Us
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Get in Touch With Us
          </motion.h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Have a question or ready to book an appointment? Reach out to us
            through any of the channels below. We are here to help you with all
            your dental care needs in Vijayawada.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info + Map */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-5">
              {[
                {
                  icon: MapPin,
                  title: "Visit Us",
                  lines: [
                    "Door No. 29-28-23, Bhavani Complex",
                    "Suryaraopeta, Vijayawada",
                    "Andhra Pradesh 520002",
                  ],
                },
                {
                  icon: Phone,
                  title: "Call Us",
                  lines: ["+91 98663 44866"],
                  href: "tel:+919866344866",
                },
                {
                  icon: Mail,
                  title: "Email Us",
                  lines: ["mouthcaresolutions@gmail.com"],
                  href: "mailto:mouthcaresolutions@gmail.com",
                },
                {
                  icon: Clock,
                  title: "Working Hours",
                  lines: [
                    "Monday – Saturday",
                    "10:00 AM – 8:00 PM",
                    "Sunday: Closed",
                  ],
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {item.title}
                    </h4>
                    {item.lines.map((line, idx) => (
                      <p
                        key={idx}
                        className="text-sm text-gray-500"
                      >
                        {item.href && idx === 0 ? (
                          <a
                            href={item.href}
                            className="hover:text-teal-600 transition-colors"
                          >
                            {line}
                          </a>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Social Media Links */}
            <div className="pt-2">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Follow Us</h4>
              <div className="flex items-center gap-3">
                <a href="https://www.facebook.com/Mouthcaresolutions/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110" title="Facebook">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/mouthcaresolutions/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-pink-100 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 text-pink-600 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110" title="Instagram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.youtube.com/@MouthCareSolutions" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-600 text-red-600 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110" title="YouTube">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="https://www.threads.com/@mouthcaresolutions" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-800 text-gray-600 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110" title="Threads">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.058 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.795-2.045 1.647-1.619 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.107-2.14 1.703-3.73 1.774l-.068.002c-1.642 0-2.987-.539-3.847-1.558-.8-.946-1.165-2.17-1.029-3.638.229-2.49 1.837-4.154 4.245-4.54 1.076-.172 2.133-.065 3.054.303.224.09.44.193.648.309-.048-.637-.174-1.13-.375-1.471-.414-.707-1.261-1.045-2.58-1.062l.016-2.041c2.088.026 3.619.706 4.548 2.02.55.795.878 1.806.97 3.021.034.142.063.286.086.432l.138.914-.835.438c-.676.355-1.36.585-2.033.684-.505.073-1.025.07-1.544-.01l-.003-.001c-.632-.092-1.167-.311-1.59-.652-.393-.317-.676-.732-.843-1.235-.168-.507-.203-1.09-.105-1.734.157-1.076.72-1.888 1.58-2.35.861-.462 1.94-.553 3.112-.258l-.057.996.085-1.007c-.687-.06-1.337-.003-1.869.244-.52.24-.845.68-.976 1.379-.065.444-.046.824.057 1.137.094.285.253.516.473.694.258.208.6.346 1.015.41l.004.001c.368.056.747.057 1.127.003.452-.065.918-.215 1.387-.446-.003-.03-.005-.06-.01-.09-.07-.96-.333-1.727-.782-2.328-.698-.947-1.934-1.44-3.674-1.463l.011-2.041c2.298.027 4.124.788 5.304 2.216.69.842 1.136 1.918 1.33 3.22.088.555.127 1.148.117 1.776l-.002.088.002.063c.066.169.124.34.173.516.736 2.66.514 5.284-1.432 7.196-1.864 1.832-4.86 2.628-8.106 2.65z"/></svg>
                </a>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/919866344866?text=Hi%2C%20I%20would%20like%20to%20chat%20about%20dental%20treatment."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-12">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat on WhatsApp
              </Button>
            </a>

            {/* Google Map */}
            <div className="rounded-xl overflow-hidden border border-gray-200 h-56">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.7!2d80.631!3d16.5116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDMwJzQxLjgiTiA4MMKwMzcnNTEuNiJF!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mouth Care Solutions Location"
              />
            </div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Send Us a Message
            </h3>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-teal-500 mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Message Sent!
                </h4>
                <p className="text-gray-500">
                  Thank you for reaching out. We will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your dental concern or inquiry..."
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
