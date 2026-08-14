import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Our Dentists & Specialists | Mouth Care Solutions Vijayawada',
  description: 'Meet our expert dental specialists: Endodontists, Orthodontists, Implantologists, Periodontists, Pedodontists & more at Mouth Care Solutions, Vijayawada.',
  alternates: { canonical: 'https://mouthcaresolutions.com/doctors' },
};
export default function DoctorsLayout({ children }: { children: React.ReactNode }) { return children; }
