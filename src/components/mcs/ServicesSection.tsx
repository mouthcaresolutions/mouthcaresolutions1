"use client";

import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Paintbrush,
  AlignLeft,
  Cog,
  CircleDot,
  Baby,
  Scissors,
  Siren,
  Layers,
  Gem,
  Shield,
} from "lucide-react";

const categories = [
  {
    title: "Preventive Dentistry",
    description:
      "Prevention is the foundation of good oral health. Our preventive services are designed to catch problems early and keep your teeth and gums healthy for life. Regular visits to our Vijayawada clinic help prevent costly treatments down the road.",
    icon: Shield,
    services: [
      {
        name: "Dental Checkups",
        desc: "Comprehensive oral examinations including visual inspection, palpation, and screening for oral cancer, cavities, and gum disease.",
      },
      {
        name: "Professional Cleaning",
        desc: "Thorough removal of plaque and tartar buildup using ultrasonic scalers and hand instruments, followed by polishing for a fresh feel.",
      },
      {
        name: "Scaling & Root Planing",
        desc: "Deep cleaning treatment for gingivitis and periodontitis, removing bacteria below the gumline to restore gum health.",
      },
      {
        name: "Fluoride Treatment",
        desc: "Professional fluoride application to strengthen tooth enamel and provide added protection against cavities and decay.",
      },
    ],
  },
  {
    title: "Restorative Dentistry",
    description:
      "When teeth are damaged by decay, injury, or wear, our restorative treatments bring them back to full function and appearance. We use the finest materials and techniques to ensure durability and a natural look.",
    icon: Layers,
    services: [
      {
        name: "Dental Fillings",
        desc: "Tooth-colored composite and ceramic fillings that blend seamlessly with your natural teeth, restoring strength and appearance.",
      },
      {
        name: "Crowns",
        desc: "Custom-made porcelain and zirconia crowns that cap damaged or weakened teeth, providing long-lasting protection and a natural appearance.",
      },
      {
        name: "Bridges",
        desc: "Fixed dental prosthetics that replace one or more missing teeth by anchoring to adjacent teeth, restoring your complete smile and bite.",
      },
    ],
  },
  {
    title: "Cosmetic Dentistry",
    description:
      "Transform your smile with our advanced cosmetic procedures. Whether you want brighter teeth, a complete smile makeover, or minor corrections, our cosmetic specialists deliver stunning, natural-looking results.",
    icon: Paintbrush,
    services: [
      {
        name: "Teeth Whitening",
        desc: "In-office and take-home whitening options using professional-grade bleaching agents for safe, dramatic whitening results in as little as one visit.",
      },
      {
        name: "Veneers",
        desc: "Ultra-thin porcelain shells bonded to the front of teeth to correct chips, gaps, discoloration, and minor misalignments for a flawless smile.",
      },
      {
        name: "Smile Makeover",
        desc: "A customized combination of treatments including whitening, veneers, bonding, and gum contouring to completely transform your smile.",
      },
    ],
  },
  {
    title: "Orthodontics",
    description:
      "Straighten your teeth and correct your bite at any age. From traditional braces to modern clear aligners, we offer a range of orthodontic solutions tailored to your lifestyle and treatment goals.",
    icon: AlignLeft,
    services: [
      {
        name: "Metal & Ceramic Braces",
        desc: "Traditional and tooth-colored bracket systems for effective correction of crowding, spacing, overbites, underbites, and crossbites.",
      },
      {
        name: "Invisalign & Clear Aligners",
        desc: "Virtually invisible, removable aligner trays that straighten teeth comfortably without metal brackets or wires.",
      },
    ],
  },
  {
    title: "Endodontics",
    description:
      "Save your natural teeth with our advanced root canal treatments. Using microscopic magnification and modern techniques, we make root canals comfortable, precise, and highly successful.",
    icon: Cog,
    services: [
      {
        name: "Root Canal Treatment",
        desc: "Painless, single-sitting and multi-sitting root canal therapy using rotary instruments, apex locators, and dental microscopes for precision.",
      },
      {
        name: "Retreatment",
        desc: "Specialized re-treatment of previously failed root canals to eliminate persistent infection and save the tooth from extraction.",
      },
    ],
  },
  {
    title: "Prosthodontics",
    description:
      "Replace missing teeth with advanced prosthetic solutions that look, feel, and function like natural teeth. Our implant and denture services restore your confidence and quality of life.",
    icon: CircleDot,
    services: [
      {
        name: "Dental Implants",
        desc: "Titanium implant posts placed in the jawbone to serve as artificial tooth roots, supporting crowns, bridges, or dentures for permanent tooth replacement.",
      },
      {
        name: "Dentures (Complete & Partial)",
        desc: "Custom-fabricated removable and fixed dentures that restore your smile, chewing ability, and facial appearance with a comfortable fit.",
      },
    ],
  },
  {
    title: "Pediatric Dentistry",
    description:
      "Gentle, fun, and effective dental care designed specifically for children from infancy through adolescence. Our pediatric specialists create positive dental experiences that set the foundation for a lifetime of good oral health.",
    icon: Baby,
    services: [
      {
        name: "Kids Dental Checkups",
        desc: "Age-appropriate examinations, cleanings, and fluoride treatments in a child-friendly environment that makes kids actually enjoy visiting the dentist.",
      },
      {
        name: "Pit & Fissure Sealants",
        desc: "Protective coatings applied to the chewing surfaces of back teeth to prevent cavities in children and teenagers.",
      },
      {
        name: "Interceptive Orthodontics",
        desc: "Early orthodontic evaluation and treatment for children to guide jaw growth and tooth eruption, preventing more serious issues later.",
      },
    ],
  },
  {
    title: "Oral Surgery",
    description:
      "When surgical intervention is needed, our experienced oral surgeons deliver safe and precise procedures with minimal discomfort and fast recovery times.",
    icon: Scissors,
    services: [
      {
        name: "Tooth Extractions",
        desc: "Simple and surgical extractions performed with care, including options for anxiety management to ensure a comfortable experience.",
      },
      {
        name: "Wisdom Tooth Removal",
        desc: "Impacted and partially erupted wisdom tooth removal using advanced surgical techniques for swift recovery and minimal post-operative pain.",
      },
    ],
  },
  {
    title: "Emergency Dental Services",
    description:
      "Dental emergencies do not wait, and neither do we. Our clinic provides prompt emergency dental care for urgent situations including severe pain, trauma, and infections during working hours.",
    icon: Siren,
    services: [
      {
        name: "Emergency Consultations",
        desc: "Same-day emergency appointments for acute dental pain, swelling, broken teeth, and other urgent dental problems requiring immediate attention.",
      },
      {
        name: "Trauma Management",
        desc: "Treatment for dental injuries including knocked-out teeth, fractures, and soft tissue injuries, with follow-up care to ensure complete recovery.",
      },
    ],
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            Our Services
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Complete Dental Care Under One Roof
          </motion.h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We offer a comprehensive range of dental treatments covering
            preventive, restorative, cosmetic, and surgical dentistry. Every
            procedure is performed using modern equipment and evidence-based
            techniques at our Vijayawada clinic.
          </p>
        </div>

        <div className="space-y-10">
          {categories.map((cat, catIdx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIdx * 0.05 }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                  <cat.icon className="h-6 w-6 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.services.map((svc) => (
                  <div
                    key={svc.name}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-teal-50 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 text-sm mb-1.5">
                      {svc.name}
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {svc.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
