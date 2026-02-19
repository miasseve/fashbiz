/**
 * Central SEO Configuration for Ree (re-e.dk)
 * -----------------------------------------------
 * All shared SEO constants, defaults, and helper functions live here.
 * Import from this file rather than hardcoding values across the app.
 */

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://re-e.dk";

export const SITE_NAME = "Ree";

export const DEFAULT_DESCRIPTION =
  "Ree — Buy and sell secondhand fashion online. Secondhand & resale store platform with automated product listing and smart POS. Genbrugstøj, brugt tøj og resale i Danmark.";

export const DEFAULT_OG_IMAGE = `${BASE_URL}/reelogo.png`;

// ─── Default metadata shared across all pages ────────────────────────────────
export const defaultMetadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: `%s | ${SITE_NAME} — Secondhand Store`,
    default: `${SITE_NAME} — Secondhand & Resale Store | Genbrugstøj Online`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "secondhand", "resale", "genbrugstøj", "brugt tøj", "secondhand store",
    "secondhand butik", "køb genbrugstøj", "used clothes", "secondhand fashion",
    "resale store Denmark", "Ree", "re-e.dk",
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "da_DK",
    url: BASE_URL,
    title: {
      template: `%s | ${SITE_NAME} — Secondhand Store`,
      default: `${SITE_NAME} — Secondhand & Resale Store`,
    },
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Secondhand & Resale Store Denmark`,
      },
    ],
  },
  // Twitter/X card — no @handle needed; card tags still control how links
  // appear when shared on X, WhatsApp, LinkedIn, Slack, etc.
  twitter: {
    card: "summary_large_image",
    title: {
      template: `%s | ${SITE_NAME}`,
      default: SITE_NAME,
    },
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  // Prevent auth/protected pages from being indexed (set per-page as needed)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  // Verification tokens — fill in after connecting Search Console / Bing
  verification: {
    // google: "YOUR_GOOGLE_SITE_VERIFICATION_TOKEN",
    // other: { "msvalidate.01": "YOUR_BING_VERIFICATION_TOKEN" },
  },
};

// ─── noindex directive for protected/private pages ───────────────────────────
export const noIndexMetadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

// ─── Helper: build OG metadata for a product ─────────────────────────────────
export function buildProductMetadata(product) {
  const title = product.title;
  const rawDescription =
    product.description ||
    `${product.brand} — ${product.title}. Shop secondhand on Ree.`;
  const description =
    rawDescription.length > 160
      ? rawDescription.slice(0, 157) + "..."
      : rawDescription;

  const images = (product.images || [])
    .slice(0, 4)
    .map((img) => ({ url: img.url, alt: title }));

  const productUrl = `${BASE_URL}/product/${product._id}`;

  return {
    title,
    description,
    alternates: { canonical: productUrl },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: productUrl,
      title: `${title} | ${SITE_NAME}`,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: images.map((i) => i.url),
    },
    // Product-specific Open Graph tags (used by Facebook / Pinterest)
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": "EUR",
      "product:brand": product.brand,
      "product:availability": product.sold ? "out of stock" : "in stock",
      "product:condition": "used",
    },
  };
}
