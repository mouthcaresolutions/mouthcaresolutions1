"use client";

import { motion } from "framer-motion";
import { Stethoscope, User } from "lucide-react";

const doctors = [
  {
    name: "Dr. B. Madhuri",
    qualification: "BDS",
    specialization: "Chief Cosmetic Dental Surgeon",
    bio: "Dr. B. Madhuri leads the cosmetic dentistry wing at Mouth Care Solutions. With extensive experience in smile design, veneers, teeth whitening, and full-mouth makeovers, she combines artistic vision with clinical precision. She is dedicated to helping patients achieve the smile they have always dreamed of, using the latest digital smile design technology to preview results before treatment begins.",
  },
  {
    name: "Dr. Rajya Lakshmi",
    qualification: "BDS",
    specialization: "General Dentist",
    bio: "Dr. Rajya Lakshmi is a skilled general dentist providing comprehensive oral care including routine checkups, fillings, cleanings, and preventive treatments. She is known for her gentle approach and thorough patient examinations, ensuring every patient receives personalized care. She focuses on patient education and preventive strategies to maintain long-term oral health.",
  },
  {
    name: "Dr. A. Bilwa Bindu",
    qualification: "MDS",
    specialization: "Periodontist",
    bio: "Dr. A. Bilwa Bindu is a specialist in periodontics, focusing on the prevention, diagnosis, and treatment of gum diseases. She handles complex cases of gingivitis and periodontitis with expertise in scaling, root planing, gum grafting, and laser periodontal therapy. Her treatment plans are designed to halt disease progression and restore healthy gums for a strong foundation.",
  },
  {
    name: "Dr. M.S. Karthik",
    qualification: "MDS",
    specialization: "Oral & Maxillofacial Surgeon",
    bio: "Dr. M.S. Karthik is a highly trained oral and maxillofacial surgeon handling complex surgical procedures including impacted wisdom teeth removal, jaw fracture repairs, cyst and tumor removals, and dental implant placement. His surgical precision and compassionate pre- and post-operative care ensure optimal outcomes and comfortable recovery for every patient.",
  },
  {
    name: "Dr. G. Rakesh",
    qualification: "MDS",
    specialization: "Oral & Maxillofacial Surgeon",
    bio: "Dr. G. Rakesh is an experienced oral and maxillofacial surgeon specializing in surgical extractions, bone grafting, and reconstructive jaw surgery. He brings advanced surgical skills to complex dental cases, working closely with the implant and prosthetic teams to deliver comprehensive rehabilitation solutions for patients with severe dental issues.",
  },
  {
    name: "Dr. K. Jyothsna",
    qualification: "MDS",
    specialization: "Orthodontist",
    bio: "Dr. K. Jyothsna is a dedicated orthodontist specializing in braces, clear aligners, and orthodontic correction for children and adults. She creates customized treatment plans to correct crowding, spacing, bite issues, and jaw alignment problems. Her friendly approach and attention to detail ensure a comfortable and effective orthodontic journey for every patient.",
  },
  {
    name: "Dr. Bindu Madhavi",
    qualification: "MDS",
    specialization: "Endodontist",
    bio: "Dr. Bindu Madhavi is a skilled endodontist specializing in root canal treatment and dental pain management. Using advanced rotary instruments, dental microscopes, and modern obturation techniques, she performs painless and precise root canal procedures. Her expertise extends to retreatment of previously failed root canals and managing complex dental trauma cases.",
  },
  {
    name: "Dr. Shoba",
    qualification: "MDS",
    specialization: "Endodontist",
    bio: "Dr. Shoba is an experienced endodontist dedicated to saving natural teeth through expert root canal therapy. She is proficient in single-visit root canals, microscopic endodontics, and regenerative endodontic procedures. Patients appreciate her patient explanations, gentle technique, and commitment to making each procedure as comfortable as possible.",
  },
  {
    name: "Dr. Tilak",
    qualification: "MDS",
    specialization: "Pedodontist",
    bio: "Dr. Tilak is a specialist in pediatric dentistry, providing gentle and effective dental care for infants, children, and teenagers. His expertise includes fluoride treatments, pit and fissure sealants, cavity management in primary teeth, and interceptive orthodontics. He creates a fun and positive dental experience that helps children develop healthy oral habits for life.",
  },
  {
    name: "Dr. M B Naik",
    qualification: "BDS",
    specialization: "General Dentist",
    bio: "Dr. M B Naik is a compassionate general dentist providing a wide range of dental treatments including fillings, extractions, dentures, and preventive care. He takes a holistic approach to patient health, ensuring comprehensive examinations and clear communication about treatment options. He is committed to making quality dental care accessible and comfortable for all patients.",
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {doctors.map((doc, i) => (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group"
            >
              <div className="h-40 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                <User className="h-16 w-16 text-teal-300 group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  {doc.name}
                </h3>
                <p className="text-sm text-teal-600 font-medium mt-0.5">
                  {doc.qualification}
                </p>
                <div className="mt-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">
                    <Stethoscope className="h-3 w-3" />
                    {doc.specialization}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">
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