"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Heart, Eye, Target } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            About Us
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Your Trusted Dental Partner in Vijayawada
          </motion.h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Dedicated to delivering exceptional dental care with a personal touch
            since our establishment in the heart of Vijayawada, Andhra Pradesh.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - About content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Committed to Your Oral Health & Beautiful Smile
            </h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Mouth Care Solutions was founded with a simple yet powerful mission:
                to make high-quality dental care accessible and comfortable for
                everyone in Vijayawada and the surrounding regions of Andhra Pradesh.
                Located at Bhavani Complex in Suryaraopeta, our clinic has grown to
                become one of the most trusted names in dental healthcare in the city.
              </p>
              <p>
                Our clinic is equipped with the latest dental technology including
                digital radiography, intraoral cameras, CAD/CAM systems for same-day
                crowns, and advanced laser dentistry equipment. Every instrument is
                sterilized using hospital-grade autoclaves, and we follow stringent
                infection control protocols that exceed international standards.
              </p>
              <p>
                We believe that a visit to the dentist should never be a source of
                anxiety. From the moment you walk through our doors, our friendly
                team ensures you feel welcomed and relaxed. Our dentists take the time to explain every
                procedure, answer your questions, and address your concerns thoroughly.
              </p>
              <p>
                Whether you need a routine cleaning, a complex root canal, dental
                implants, or a complete smile makeover, our multidisciplinary team
                works together to create personalized treatment plans that suit your
                unique needs and budget. At Mouth Care Solutions, your smile is our
                responsibility, and we take that seriously.
              </p>
            </div>
            <div className="mt-6">
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() =>
                  window.open(
                    "https://wa.me/919866344866?text=Hi%2C%20I%20would%20like%20to%20book%20an%20appointment.",
                    "_blank"
                  )
                }
              >
                Book Appointment
              </Button>
            </div>
          </motion.div>

          {/* Right - Mission, Vision, Values */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-5"
          >
            {[
              {
                icon: Target,
                title: "Our Mission",
                text: "To provide comprehensive, patient-centered dental care using the latest technology and evidence-based practices, making every visit comfortable, effective, and affordable for families across Vijayawada.",
              },
              {
                icon: Eye,
                title: "Our Vision",
                text: "To be the most trusted and preferred dental healthcare provider in Andhra Pradesh, known for clinical excellence, innovation, and a genuine commitment to improving the oral health and confidence of every patient we serve.",
              },
              {
                icon: Heart,
                title: "Our Values",
                text: "Patient-first approach, unwavering commitment to hygiene and safety, continuous learning and adoption of new techniques, transparent communication, and treating every patient like family.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1.5">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Hygiene standards */}
            <div className="bg-teal-50 rounded-xl p-6 border border-teal-100">
              <h4 className="font-semibold text-teal-800 mb-3">
                Our Hygiene Standards
              </h4>
              <ul className="space-y-2">
                {[
                  "Hospital-grade autoclave sterilization for all instruments",
                  "Single-use disposable items wherever possible",
                  "Stringent infection control protocols (CDC standards)",
                  "Regular equipment calibration and maintenance",
                  "Sanitized treatment rooms between every patient",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-teal-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-teal-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}