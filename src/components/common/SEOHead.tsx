import React, { useEffect } from 'react';
import { Raffle } from '../../types';

interface SEOHeadProps {
  activeRaffle?: Raffle | null;
  pageTitle?: string;
  pageDescription?: string;
  canonicalUrl?: string;
  imageUrl?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  activeRaffle,
  pageTitle,
  pageDescription,
  canonicalUrl,
  imageUrl
}) => {
  useEffect(() => {
    // Determine dynamic values
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentHref = typeof window !== 'undefined' ? window.location.href : '';

    const title = pageTitle || (activeRaffle 
      ? `${activeRaffle.name} - Gran Sorteo por ${activeRaffle.prize} | Promo Blitz`
      : 'Promo Blitz | Impulsa tus Campañas, Sorteos y Ventas Promocionales');

    const description = pageDescription || (activeRaffle
      ? `Participa en el sorteo oficial "${activeRaffle.name}" y gana ${activeRaffle.prize}. Adquiere tus boletos por solo ${activeRaffle.ticketPrice} USD de forma rápida, transparente y segura.`
      : 'Promo Blitz es la plataforma líder en gestión de sorteos, promociones digitales y fidelización con atribución en tiempo real.');

    const keywords = activeRaffle
      ? `sorteos, rifa, boletos, ${activeRaffle.name}, ganar ${activeRaffle.prize}, loteria digital, promo blitz`
      : 'Promo Blitz, marketing promocional, sorteos digitales, rifas en linea, fidelizacion, cupones digitales';

    const finalCanonical = canonicalUrl || currentHref;
    const finalImage = imageUrl || ((activeRaffle as any)?.bannerUrl || (activeRaffle as any)?.imageUrl 
      ? ((activeRaffle as any).bannerUrl || (activeRaffle as any).imageUrl) 
      : `${currentOrigin}/icon.svg`);

    // 1. Update Document Title
    document.title = title;

    // Helper function to set or create meta tag
    const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. SEO Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', 'index, follow');
    setMetaTag('name', 'author', 'Promo Blitz');

    // 3. Open Graph Tags (Facebook, WhatsApp, LinkedIn)
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', finalImage);
    setMetaTag('property', 'og:url', finalCanonical);
    setMetaTag('property', 'og:type', activeRaffle ? 'product' : 'website');
    setMetaTag('property', 'og:site_name', 'Promo Blitz');
    setMetaTag('property', 'og:locale', 'es_ES');

    // 4. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', finalImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalCanonical);

    // 6. JSON-LD Schema.org Structured Data
    let schemaScript = document.getElementById('json-ld-seo-schema') as HTMLScriptElement;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'json-ld-seo-schema';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    const structuredData: any = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${currentOrigin}/#website`,
          'url': currentOrigin,
          'name': 'Promo Blitz',
          'description': 'Plataforma líder para gestión de sorteos, rifas y promociones digitales.',
          'publisher': {
            '@type': 'Organization',
            'name': 'Promo Blitz',
            'logo': `${currentOrigin}/icon.svg`
          },
          'inLanguage': 'es'
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${currentHref}#breadcrumb`,
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Inicio',
              'item': currentOrigin
            },
            ...(activeRaffle ? [
              {
                '@type': 'ListItem',
                'position': 2,
                'name': activeRaffle.name,
                'item': `${currentOrigin}/?sorteo=${activeRaffle.id}`
              }
            ] : [])
          ]
        }
      ]
    };

    if (activeRaffle) {
      structuredData['@graph'].push({
        '@type': 'Event',
        '@id': `${currentOrigin}/?sorteo=${activeRaffle.id}#event`,
        'name': activeRaffle.name,
        'description': activeRaffle.description || `Sorteo por ${activeRaffle.prize}`,
        'startDate': activeRaffle.startDate || new Date().toISOString(),
        'endDate': activeRaffle.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        'eventStatus': 'https://schema.org/EventScheduled',
        'eventAttendanceMode': 'https://schema.org/OnlineEventAttendanceMode',
        'location': {
          '@type': 'VirtualLocation',
          'url': currentOrigin
        },
        'image': [finalImage],
        'organizer': {
          '@type': 'Organization',
          'name': 'Promo Blitz',
          'url': currentOrigin
        },
        'offers': {
          '@type': 'Offer',
          'price': activeRaffle.ticketPrice || 10,
          'priceCurrency': 'USD',
          'availability': 'https://schema.org/InStock',
          'url': `${currentOrigin}/?sorteo=${activeRaffle.id}`,
          'validFrom': activeRaffle.startDate || new Date().toISOString()
        }
      });
    }

    schemaScript.textContent = JSON.stringify(structuredData, null, 2);

  }, [activeRaffle, pageTitle, pageDescription, canonicalUrl, imageUrl]);

  return null;
};

export default SEOHead;
