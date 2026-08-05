"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    text: "I was terrified of root canals, but Dr. Rao made the entire process completely painless. The clinic is spotless, and the staff is incredibly warm. Best dental experience I have ever had in Vijayawada!",
    rating: 5,
    treatment: "Root Canal Treatment",
  },
  {
    name: "Ramesh Kumar",
    text: "Got my dental implants done here. The results are amazing — they look and feel completely natural. Dr. Reddy explained every step clearly. Highly recommend Mouth Care Solutions for implants.",
    rating: 5,
    treatment: "Dental Implants",
  },
  {
    name: "Anitha Devi",
    text: "My son used to cry at the thought of visiting a dentist. The pediatric team here is so gentle and patient. Now he actually looks forward to his checkups! Thank you, Mouth Care Solutions.",
    rating: 5,
    treatment: "Pediatric Dentistry",
  },
  {
    name: "Srinivas Rao",
    text: "I got braces at 35 and was self-conscious, but the Invisalign treatment here changed my smile completely in just 10 months. The team was supportive throughout the journey.",
    rating: 5,
    treatment: "Orthodontics",
  },
  {
    name: "Lakshmi Narayana",
    text: "The teeth whitening session gave me brilliant results in just one visit. My confidence has skyrocketed. The pricing was very fair compared to other clinics in Vijayawada.",
    rating: 5,
    treatment: "Teeth Whitening",
  },
  {
    name: "Venkata Ramana",
    text: "I came in for an emergency extraction on a Saturday evening and they accommodated me immediately. Professional, quick, and caring. This is now my family\'s go-to dental clinic.",
    rating: 5,
    treatment: "Emergency Dental Care",
  },
];

export default function TestimonialsSection() {
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
            Patient Stories
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            What Our Patients Say
          </motion.h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Real stories from real patients who trusted us with their smiles.
            Your satisfaction is the greatest reward for our team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-gray-50 rounded-2xl p-6 relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-teal-100" />
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="border-t border-gray-200 pt-3">
                <p className="font-semibold text-gray-900 text-sm">
                  {t.name}
                </p>
                <p className="text-xs text-teal-600">{t.treatment}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
