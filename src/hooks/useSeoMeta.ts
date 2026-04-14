import { useEffect } from 'react';

interface SeoMetaProps {
  title: string;
  description?: string;
  image?: string | null;
  url?: string;
}

export function useSeoMeta({ title, description, image, url }: SeoMetaProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('og:title', title);
    if (description) setMeta('og:description', description);
    if (image) setMeta('og:image', image);
    if (url) setMeta('og:url', url);
    setMeta('og:type', 'article');

    // Twitter card
    let twitterCard = document.querySelector('meta[name="twitter:card"]') as HTMLMetaElement | null;
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', image ? 'summary_large_image' : 'summary');

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image, url]);
}
