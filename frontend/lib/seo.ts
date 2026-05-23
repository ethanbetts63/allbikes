import type { Metadata } from 'next';
import type { Bike } from '@/types/Bike';
import type { FaqItem } from '@/types/FaqItem';
import type { Product } from '@/types/Product';
import type { SiteSettings } from '@/types/SiteSettings';
import { getPrimaryVehicleImage } from '@/utils/vehicleImages';

export const SITE_URL = 'https://www.scootershop.com.au';
export const SITE_NAME = 'ScooterShop';

interface MetadataOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  image?: string | null;
  noindex?: boolean;
}

export function buildMetadata({
  title,
  description,
  canonicalPath,
  image,
  noindex,
}: MetadataOptions): Metadata {
  const url = canonicalPath ? new URL(canonicalPath, SITE_URL).toString() : undefined;
  const imageUrl = image ? absoluteUrl(image) : `${SITE_URL}/logo-512x512.png`;

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

export async function getBikeMetadata(slug: string): Promise<Metadata> {
  const bikeId = slug.split('-').pop();
  if (!bikeId) {
    return buildMetadata({
      title: 'Motorcycle Not Found',
      noindex: true,
    });
  }

  try {
    const bike = await fetchJson<Bike>(`/api/inventory/bikes/${bikeId}/`);
    const name = bike.year
      ? `${bike.year} ${bike.make} ${bike.model}`
      : `${bike.make} ${bike.model}`;
    const enginePart = bike.engine_size ? ` ${bike.engine_size}cc` : '';
    const primaryImage = getPrimaryVehicleImage(bike.images, 'detail');

    return buildMetadata({
      title: `${name}${enginePart}`,
      description:
        bike.description ||
        `View the ${name} at ScooterShop, Perth's motorcycle and scooter dealership.`,
      canonicalPath: `/inventory/motorcycles/${bike.slug}`,
      image: primaryImage,
      noindex: bike.status === 'unavailable',
    });
  } catch {
    return buildMetadata({
      title: 'Motorcycles & Scooters for Sale Perth',
      description: 'Browse motorcycles and scooters available for sale in Perth.',
      canonicalPath: `/inventory/motorcycles/${slug}`,
    });
  }
}

export async function getProductMetadata(slug: string): Promise<Metadata> {
  const productId = Number(slug.split('-').pop());
  if (!productId || Number.isNaN(productId)) {
    return buildMetadata({
      title: 'E-Scooter Not Found',
      noindex: true,
    });
  }

  try {
    const product = await fetchJson<Product>(`/api/product/products/${productId}/`);
    const primaryImage = getPrimaryVehicleImage(product.images, 'detail');

    return buildMetadata({
      title: `${product.name} | Free Australia-Wide Delivery`,
      description: `Buy the ${product.name} online with free delivery anywhere in Australia. Price includes GST. Secure checkout via Stripe.${product.description ? ` ${product.description}` : ''}`,
      canonicalPath: `/escooters/${product.slug}`,
      image: primaryImage,
      noindex: !product.is_active,
    });
  } catch {
    return buildMetadata({
      title: 'Electric Scooters for Sale Online',
      description: 'Shop electric scooters online with free delivery Australia-wide.',
      canonicalPath: `/escooters/${slug}`,
    });
  }
}

export function buildBikeSchema(bike: Bike): object {
  const name = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
  const url = `${SITE_URL}/inventory/motorcycles/${bike.slug}`;
  const price = bike.discount_price || bike.price;
  const primaryImage = getPrimaryVehicleImage(bike.images, 'detail');

  const conditionMap: Record<string, string> = {
    new: 'https://schema.org/NewCondition',
    used: 'https://schema.org/UsedCondition',
    demo: 'https://schema.org/RefurbishedCondition',
  };

  const availabilityMap: Record<string, string> = {
    for_sale: 'https://schema.org/InStock',
    available_soon: 'https://schema.org/PreOrder',
    sold: 'https://schema.org/OutOfStock',
    reserved: 'https://schema.org/LimitedAvailability',
    unavailable: 'https://schema.org/Discontinued',
  };

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Motorcycle',
    name,
    url,
    description: bike.description || `${name} for sale at ScooterShop, Perth.`,
    brand: { '@type': 'Brand', name: bike.make },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'AUD',
      price,
      itemCondition: conditionMap[bike.condition] ?? conditionMap.used,
      availability: availabilityMap[bike.status] ?? 'https://schema.org/OutOfStock',
      ...(bike.stock_number ? { sku: bike.stock_number } : {}),
      availableAtOrFrom: {
        '@type': 'Place',
        name: 'ScooterShop',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Unit 5/6 Cleveland Street',
          addressLocality: 'Dianella',
          addressRegion: 'WA',
          postalCode: '6059',
          addressCountry: 'AU',
        },
      },
      seller: {
        '@type': 'Organization',
        name: 'ScooterShop',
        '@id': `${SITE_URL}/#business`,
      },
    },
  };

  if (primaryImage) schema.image = absoluteUrl(primaryImage);
  if (bike.year) schema.vehicleModelDate = String(bike.year);
  if (bike.odometer) {
    schema.mileageFromOdometer = {
      '@type': 'QuantitativeValue',
      value: bike.odometer,
      unitCode: 'KMT',
    };
  }
  if (bike.vin) schema.vehicleIdentificationNumber = bike.vin;
  if (bike.transmission) schema.vehicleTransmission = bike.transmission;
  if (bike.engine_size) {
    schema.engineDisplacement = {
      '@type': 'QuantitativeValue',
      value: bike.engine_size,
      unitCode: 'CMQ',
      unitText: 'cc',
    };
  }
  if (bike.seats) schema.seatingCapacity = bike.seats;
  if (bike.warranty_months > 0) {
    schema.warranty = {
      '@type': 'WarrantyPromise',
      durationOfWarranty: {
        '@type': 'QuantitativeValue',
        value: bike.warranty_months,
        unitCode: 'MON',
      },
    };
  }

  return schema;
}

export function buildProductSchema(product: Product): object {
  const url = `${SITE_URL}/escooters/${product.slug}`;
  const price = product.discount_price || product.price;
  const primaryImage = getPrimaryVehicleImage(product.images, 'detail');

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url,
    description: product.description || `${product.name} available at ScooterShop. Free delivery Australia-wide.`,
    brand: { '@type': 'Brand', name: product.brand },
    ...(primaryImage ? { image: absoluteUrl(primaryImage) } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'AUD',
      price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'ScooterShop',
        '@id': `${SITE_URL}/#business`,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'AUD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'AU',
        },
      },
    },
  };
}

export function buildBikeListSchema(bikes: Bike[], listName: string, listUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    url: `${SITE_URL}${listUrl}`,
    itemListElement: bikes.map((bike, index) => {
      const name = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/inventory/motorcycles/${bike.slug}`,
        name,
      };
    }),
  };
}

export function buildProductListSchema(products: Product[], listName: string, listUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    url: `${SITE_URL}${listUrl}`,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/escooters/${product.slug}`,
      name: product.name,
    })),
  };
}

export function buildLocalBusinessSchema(settings: SiteSettings): object {
  return {
    '@context': 'https://schema.org',
    '@type': ['MotorcycleDealer', 'AutoDealer'],
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    alternateName: [
      'ScooterShop Fremantle',
      'Allbikes and Scooters',
      'Allbikes Vespa Warehouse',
    ],
    image: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo-512x512.png`,
      width: 512,
      height: 512,
    },
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo-512x512.png`,
      width: 512,
      height: 512,
    },
    url: SITE_URL,
    telephone: toE164Au(settings.phone_number),
    email: settings.email_address,
    owner: {
      '@type': 'Person',
      name: 'Frank Ingram',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.street_address,
      addressLocality: settings.address_locality,
      addressRegion: settings.address_region,
      postalCode: settings.postal_code,
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -31.90652137087452,
      longitude: 115.88103847100608,
    },
    openingHoursSpecification: [
      { day: 'Monday', hours: settings.opening_hours_monday },
      { day: 'Tuesday', hours: settings.opening_hours_tuesday },
      { day: 'Wednesday', hours: settings.opening_hours_wednesday },
      { day: 'Thursday', hours: settings.opening_hours_thursday },
      { day: 'Friday', hours: settings.opening_hours_friday },
      { day: 'Saturday', hours: settings.opening_hours_saturday },
      { day: 'Sunday', hours: settings.opening_hours_sunday },
    ]
      .filter(({ hours }) => hours && !hours.toLowerCase().includes('closed'))
      .map(({ day, hours }) => {
        const [opens = '', closes = ''] = hours.split('-').map((part) => part.trim());
        return {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: day,
          opens: to24h(opens),
          closes: to24h(closes),
        };
      }),
    currenciesAccepted: 'AUD',
    paymentAccepted: 'Cash, Credit Card, Afterpay, Klarna, Zip Pay',
    hasMap: `https://www.google.com/maps/place/?q=place_id:${settings.google_places_place_id}`,
    priceRange: '$$',
  };
}

export function buildWebsiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function buildBreadcrumbSchema(items: { name: string; path: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

interface ServiceOffer {
  name: string;
  description: string;
}

interface ServiceSchemaOptions {
  serviceType: string;
  path: string;
  description: string;
  catalogName?: string;
  offers?: ServiceOffer[];
}

export function buildServiceSchema(options: ServiceSchemaOptions): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: options.serviceType,
    url: `${SITE_URL}${options.path}`,
    description: options.description,
    areaServed: { '@type': 'City', name: 'Perth' },
    provider: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#business`,
      name: SITE_NAME,
    },
  };

  if (options.offers?.length && options.catalogName) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: options.catalogName,
      itemListElement: options.offers.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, description: s.description },
      })),
    };
  }

  return schema;
}

export function buildContactPageSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: `${SITE_URL}/contact`,
    name: `Contact ${SITE_NAME}`,
    description:
      'Contact the Dianella workshop for motorcycle and scooter sales, servicing, tyre fitting, hire, and general enquiries.',
    about: {
      '@id': `${SITE_URL}/#business`,
    },
  };
}

export function buildArticleSchema(options: {
  title: string;
  description: string;
  slug: string;
  dateModified: string;
}): object {
  const url = `${SITE_URL}/blog/${options.slug}`;
  const dateIso = `${options.dateModified}T00:00:00+08:00`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: options.title,
    description: options.description,
    url,
    datePublished: dateIso,
    dateModified: dateIso,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    isPartOf: {
      '@type': 'Blog',
      url: `${SITE_URL}/blog`,
      name: `${SITE_NAME} Guides & Articles`,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: options.title, item: url },
      ],
    },
  };
}

export function buildFaqSchema(faqData: FaqItem[]): object | null {
  if (!faqData.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.DJANGO_API_URL ?? 'http://localhost:8000';
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Metadata fetch failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function absoluteUrl(url: string): string {
  return new URL(url, SITE_URL).toString();
}

function toE164Au(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('61')) return `+${digits}`;
  if (digits.startsWith('0')) return `+61${digits.slice(1)}`;
  if (digits.length === 8) return `+618${digits}`;
  return `+61${digits}`;
}

function to24h(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return timeStr;
  let hour = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, '0')}:${minutes}`;
}
