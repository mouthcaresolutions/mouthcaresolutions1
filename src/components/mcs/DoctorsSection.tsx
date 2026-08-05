"use client";

import { motion } from "framer-motion";
import { Award, User } from "lucide-react";

const doctors = [
  {
    name: "Dr. A. Suresh Babu",
    qualification: "BDS, MDS (Prosthodontics)",
    specialization: "Dental Implants & Prosthodontics",
    experience: "18 years",
    bio: "Dr. Suresh Babu is the lead implantologist at Mouth Care Solutions with nearly two decades of experience in placing dental implants and full-mouth rehabilitation. He has successfully placed over 3,000 implants and is known for his meticulous planning and gentle surgical technique. He regularly attends international conferences on implantology.",
  },
  {
    name: "Dr. P. Lakshmi Devi",
    qualification: "BDS, MDS (Endodontics)",
    specialization: "Root Canal Treatment",
    experience: "15 years",
    bio: "Dr. Lakshmi Devi specializes in endodontics and is renowned for her painless root canal procedures. With advanced training in rotary endodontics and microscopic dentistry, she has treated over 5,000 root canal cases. Patients appreciate her calm demeanor and ability to make even the most anxious patients feel at ease.",
  },
  {
    name: "Dr. K. Venkata Rao",
    qualification: "BDS, MDS (Orthodontics)",
    specialization: "Braces, Invisalign & Aligners",
    experience: "12 years",
    bio: "Dr. Venkata Rao is a certified Invisalign provider and orthodontic specialist. He creates customized treatment plans for children and adults, from traditional braces to clear aligners. His approach combines aesthetics with functionality, ensuring beautiful and lasting results for every patient.",
  },
  {
    name: "Dr. M. Sravanthi",
    qualification: "BDS, MDS (Conservative Dentistry)",
    specialization: "Cosmetic Dentistry & Smile Design",
    experience: "10 years",
    bio: "Dr. Sravanthi is our cosmetic dentistry expert, specializing in smile makeovers, veneers, and teeth whitening. She has a keen eye for aesthetics and uses digital smile design technology to show patients their expected results before treatment begins. She has transformed over 1,500 smiles.",
  },
  {
    name: "Dr. R. Nagendra Babu",
    qualification: "BDS, MDS (Pediatric Dentistry)",
    specialization: "Children's Dental Care",
    experience: "14 years",
    bio: "Dr. Nagendra Babu is passionate about making dental visits fun and stress-free for children. With specialized training in behavior management and pediatric sedation dentistry, he handles everything from cavity prevention to interceptive orthodontics. Kids love his friendly and playful approach.",
  },
  {
    name: "Dr. T. Padmavathi",
    qualification: "BDS, MDS (Oral Surgery)",
    specialization: "Oral Surgery & Extractions",
    experience: "16 years",
    bio: "Dr. Padmavathi is an experienced oral surgeon specializing in wisdom tooth extractions, surgical extractions, and minor oral surgical procedures. She is known for her precision, minimal post-operative discomfort, and thorough post-surgical care instructions that ensure quick recovery.",
  },
];

export default function DoctorsSection() {
  return (
    <section id="doctors" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            Our Doctors
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Meet Our Expert Dental Team
          </motion.h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Our team of highly qualified and experienced dental specialists is
            dedicated to providing you and your family with the best possible
            dental care in Vijayawada.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc, i) => (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
            >
              {/* Avatar placeholder */}
              <div className="h-48 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                <User className="h-20 w-20 text-teal-300" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900">{doc.name}</h3>
                <p className="text-sm text-teal-600 font-medium mb-1">
                  {doc.qualification}
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Award className="h-3.5 w-3.5" />
                    {doc.experience}
                  </span>
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                    {doc.specialization}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {doc.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
