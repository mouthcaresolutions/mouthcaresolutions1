import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Dental Services in Vijayawada | Complete Dental Treatments - MCS',
  description: 'Explore our comprehensive dental services: Root Canal, Dental Implants, Teeth Whitening, Braces, Invisalign, Cosmetic Dentistry, Pediatric Dentistry and more at Mouth Care Solutions, Vijayawada.',
  alternates: { canonical: 'https://mouthcaresolutions.com/services' },
};
export default function ServicesLayout({ children }: { children: React.ReactNode }) { return children; }
