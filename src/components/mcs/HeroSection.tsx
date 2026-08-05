"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-emerald-50" />
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-10 w-72 h-72 bg-teal-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 fill-teal-600 text-teal-600" />
              Rated 4.8/5 by 500+ Patients
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Your Smile, Our{" "}
              <span className="text-teal-600">Passion</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl leading-relaxed">
              Welcome to Mouth Care Solutions, the leading dental clinic in
              Vijayawada. Experience painless, modern dental care with our team
              of experienced specialists using state-of-the-art technology.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Button
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                onClick={() =>
                  window.open(
                    "https://wa.me/919866344866?text=Hi%2C%20I%20would%20like%20to%20book%20an%20appointment.",
                    "_blank"
                  )
                }
              >
                Book Appointment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-teal-600 text-teal-700 hover:bg-teal-50 px-8"
                onClick={() =>
                  document
                    .getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Our Services
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                15+ Years Experience
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                10,000+ Happy Patients
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                Painless Treatment
              </div>
            </div>
          </motion.div>

          {/* Right - Hero visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative">
              <div className="w-96 h-96 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full opacity-10 absolute -top-6 -left-6" />
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-[420px]">
                <div className="flex justify-center mb-6">
                  <img
                    src="/mcs-logo.jpg"
                    alt="Mouth Care Solutions"
                    className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-teal-100"
                  />
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  Mouth Care Solutions
                </h3>
                <p className="text-center text-teal-600 font-medium mb-6">
                  Smile with us
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { num: "15+", label: "Years Exp." },
                    { num: "10K+", label: "Patients" },
                    { num: "8+", label: "Specialists" },
                    { num: "4.8", label: "Rating" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-teal-50 rounded-xl p-3 text-center"
                    >
                      <div className="text-xl font-bold text-teal-700">
                        {stat.num}
                      </div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
