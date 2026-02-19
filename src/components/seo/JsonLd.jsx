import { BASE_URL, SITE_NAME } from "@/lib/seo";

/**
 * JSON-LD structured data components (Schema.org)
 * ─────────────────────────────────────────────────
 * Usage:
 *   - <OrganizationJsonLd />  → add to root layout (once, site-wide)
 *   - <WebSiteJsonLd />       → add to root layout (once, site-wide)
 *   - <ProductJsonLd product={parsedProduct} /> → add to product page
 *   - <BreadcrumbJsonLd items={[...]} />        → add to any page with crumbs
 *
 * These tags help Google display rich results (product cards, sitelinks, etc.)
 */

// ─── Organization ─────────────────────────────────────────────────────────────
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/reelogo.png`,
      width: 200,
      height: 60,
    },
    description:
      "Ree is an AI-powered platform for secondhand and resale stores — automated product listing, smart POS, and instant webstore syncing.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${BASE_URL}/contact-support`,
    },
    sameAs: [
      "https://www.instagram.com/lestores_preloved",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── WebSite (enables Google Sitelinks Search Box) ───────────────────────────
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
    description:
      "AI-powered platform for secondhand and resale stores. Sell instantly — auto-list & auto-sync your webstore.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Product (rich product cards in Google Search) ───────────────────────────
export function ProductJsonLd({ product }) {
  if (!product) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    image: (product.images || []).map((img) => img.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.price,
      itemCondition: "https://schema.org/UsedCondition",
      availability: product.sold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      url: `${BASE_URL}/product/${product._id}`,
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Breadcrumb (improves click-through with breadcrumb display in SERPs) ────
/**
 * @param {{ label: string; href: string }[]} items  - ordered list of crumbs
 * Example: [{ label: "Home", href: "/" }, { label: "Product", href: "/product/123" }]
 */
export function BreadcrumbJsonLd({ items = [] }) {
  if (items.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href.startsWith("http")
        ? item.href
        : `${BASE_URL}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
