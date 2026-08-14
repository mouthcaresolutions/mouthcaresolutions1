import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Dental Health Blog | Mouth Care Solutions Vijayawada',
  description: 'Read expert dental health articles, treatment guides, and oral care tips from the specialists at Mouth Care Solutions, Vijayawada.',
  alternates: { canonical: 'https://mouthcaresolutions.com/blog' },
};
export default function BlogLayout({ children }: { children: React.ReactNode }) { return children; }
