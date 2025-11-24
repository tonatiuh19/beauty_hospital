import { Helmet } from "react-helmet-async";

interface MetaHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  canonicalUrl?: string;
}

export function MetaHelmet({
  title = "All Beauty Luxury & Wellness - Centro de Estética Médica",
  description = "Solución completa para clínicas de depilación y centros de estética médica. Atención experta, tecnología avanzada y tratamientos personalizados.",
  keywords = "all beauty luxury wellness, depilación láser, tratamientos estéticos, estética médica, tratamientos faciales, tratamientos corporales",
  ogTitle,
  ogDescription,
  ogImage = "/og-image.jpg",
  ogUrl,
  twitterCard = "summary_large_image",
  canonicalUrl,
}: MetaHelmetProps) {
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const currentUrl =
    ogUrl || (typeof window !== "undefined" ? window.location.href : "");

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {currentUrl && <meta property="og:url" content={currentUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Viewport and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#ffffff" />
    </Helmet>
  );
}
