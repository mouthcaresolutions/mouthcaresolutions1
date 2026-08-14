import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'About Us | Best Dental Clinic in Vijayawada - Mouth Care Solutions',
  description: 'Meet our team of 10 specialist dentists at Mouth Care Solutions, Vijayawada. Learn about our state-of-the-art dental clinic, our mission, and why 10,000+ patients trust us for their dental care.',
  alternates: { canonical: 'https://mouthcaresolutions.com/about' },
};
export default function AboutLayout({ children }: { children: React.ReactNode }) { return children; }
