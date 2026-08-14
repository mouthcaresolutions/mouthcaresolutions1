import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // SEC-C06 + SEC-M12 FIX: Block admin and API routes from indexing
        disallow: ['/api/', '/rajeshark'],
      },
    ],
    sitemap: 'https://mouthcaresolutions.com/sitemap.xml',
  };
}