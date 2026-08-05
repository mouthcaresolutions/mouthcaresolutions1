"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Cpu,
  BadgeIndianRupee,
} from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Experienced Dentists",
    description:
      "Our team of qualified dental professionals brings years of expertise across all dental specialties, ensuring you receive the highest standard of care for every treatment.",
  },
  {
    icon: Zap,
    title: "Painless Treatment",
    description:
      "We use advanced anesthesia techniques and gentle procedures to ensure your visit is as comfortable and pain-free as possible. Your comfort is our top priority.",
  },
  {
    icon: Cpu,
    title: "Modern Technology",
    description:
      "Equipped with digital X-rays, CAD/CAM systems, laser dentistry, and 3D imaging, we deliver precise diagnoses and treatments with cutting-edge technology.",
  },
  {
    icon: BadgeIndianRupee,
    title: "Affordable Care",
    description:
      "Quality dental care should be accessible to everyone. We offer transparent pricing, flexible payment options, and insurance assistance for all treatments.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ServiceHighlights() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            Why Choose Us
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Trusted Dental Care in Vijayawada
          </motion.h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            At Mouth Care Solutions, we combine expertise, technology, and
            compassion to deliver dental care that you and your family can trust.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {reasons.map((reason) => (
            <motion.div
              key={reason.title}
              variants={item}
              className="group bg-gray-50 hover:bg-teal-50 rounded-2xl p-6 text-center transition-all duration-300 border border-transparent hover:border-teal-200"
            >
              <div className="w-14 h-14 bg-teal-100 group-hover:bg-teal-200 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <reason.icon className="h-7 w-7 text-teal-700" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {reason.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
