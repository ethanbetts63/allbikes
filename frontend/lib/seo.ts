import type { Metadata } from 'next';
import type { Bike } from '@/types/Bike';
import type { Product } from '@/types/Product';

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
      title: 'Motorcycle Not Found | ScooterShop',
      noindex: true,
    });
  }

  try {
    const bike = await fetchJson<Bike>(`/api/inventory/bikes/${bikeId}/`);
    const name = bike.year
      ? `${bike.year} ${bike.make} ${bike.model}`
      : `${bike.make} ${bike.model}`;
    const primaryImage = [...bike.images].sort((a, b) => a.order - b.order)[0];

    return buildMetadata({
      title: `${name} | ScooterShop`,
      description:
        bike.description ||
        `View the ${name} at ScooterShop, Perth's motorcycle and scooter dealership.`,
      canonicalPath: `/inventory/motorcycles/${bike.slug}`,
      image: primaryImage?.medium || primaryImage?.image,
      noindex: bike.status === 'unavailable',
    });
  } catch {
    return buildMetadata({
      title: 'Motorcycles & Scooters | ScooterShop',
      description: 'Browse motorcycles and scooters available from ScooterShop Perth.',
      canonicalPath: `/inventory/motorcycles/${slug}`,
    });
  }
}

export async function getProductMetadata(slug: string): Promise<Metadata> {
  const productId = Number(slug.split('-').pop());
  if (!productId || Number.isNaN(productId)) {
    return buildMetadata({
      title: 'E-Scooter Not Found | ScooterShop',
      noindex: true,
    });
  }

  try {
    const product = await fetchJson<Product>(`/api/product/products/${productId}/`);
    const primaryImage = [...product.images].sort((a, b) => a.order - b.order)[0];

    return buildMetadata({
      title: `${product.name} | Free Delivery Australia-Wide | ScooterShop`,
      description: `Buy the ${product.name} online with free delivery anywhere in Australia. Price includes GST. Secure checkout via Stripe.${product.description ? ` ${product.description}` : ''}`,
      canonicalPath: `/escooters/${product.slug}`,
      image: primaryImage?.medium || primaryImage?.image,
      noindex: !product.is_active,
    });
  } catch {
    return buildMetadata({
      title: 'Electric Scooters | ScooterShop',
      description: 'Shop electric scooters online with free delivery Australia-wide.',
      canonicalPath: `/escooters/${slug}`,
    });
  }
}

export function buildBikeSchema(bike: Bike): object {
  const name = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
  const url = `${SITE_URL}/inventory/motorcycles/${bike.slug}`;
  const price = bike.discount_price || bike.price;
  const primaryImage = [...bike.images].sort((a, b) => a.order - b.order)[0];

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
    '@type': 'Product',
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
      seller: {
        '@type': 'Organization',
        name: 'ScooterShop',
        '@id': `${SITE_URL}/#business`,
      },
    },
  };

  if (primaryImage) schema.image = primaryImage.medium || primaryImage.image;
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
  const primaryImage = [...product.images].sort((a, b) => a.order - b.order)[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url,
    description: product.description || `${product.name} available at ScooterShop. Free delivery Australia-wide.`,
    brand: { '@type': 'Brand', name: product.brand },
    ...(primaryImage ? { image: primaryImage.medium || primaryImage.image } : {}),
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
