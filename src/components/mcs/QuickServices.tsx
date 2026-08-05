"use client";

import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Smile,
  AlignLeft,
  Cog,
  PlusCircle,
  Baby,
  Scissors,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  { icon: Search, name: "Dental Checkups", category: "Preventive" },
  { icon: Sparkles, name: "Teeth Whitening", category: "Cosmetic" },
  { icon: Smile, name: "Smile Makeover", category: "Cosmetic" },
  { icon: AlignLeft, name: "Braces & Aligners", category: "Orthodontics" },
  { icon: Cog, name: "Root Canal", category: "Endodontics" },
  { icon: PlusCircle, name: "Dental Implants", category: "Prosthodontics" },
  { icon: Baby, name: "Kids Dentistry", category: "Pediatric" },
  { icon: Scissors, name: "Extractions", category: "Surgery" },
  { icon: Siren, name: "Emergency Care", category: "Emergency" },
];

export default function QuickServices() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            Our Expertise
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Comprehensive Dental Services
          </motion.h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            From routine checkups to advanced cosmetic procedures, we provide a
            full range of dental treatments under one roof in Vijayawada.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc, i) => (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-5 flex items-center gap-4 hover:shadow-lg transition-shadow group border border-gray-100"
            >
              <div className="w-12 h-12 bg-teal-50 group-hover:bg-teal-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <svc.icon className="h-6 w-6 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                <p className="text-xs text-gray-400">{svc.category}</p>
              </div>
              <span className="text-teal-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button
            variant="outline"
            className="border-teal-600 text-teal-700 hover:bg-teal-50"
            onClick={() =>
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            View All Services
          </Button>
        </div>
      </div>
    </section>
  );
}
