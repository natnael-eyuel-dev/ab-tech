export function StructuredData({ type, data }: { type: string; data: any }) {
  const structuredData = {
    "@context": "https://schema.org",
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// Article structured data
export function ArticleStructuredData({
  title,
  description,
  url,
  imageUrl,
  authorName,
  publishedDate,
  modifiedDate,
  category,
}: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  authorName: string;
  publishedDate: string;
  modifiedDate: string;
  category: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://abtech.com").replace(/\/$/, "");
  const logoUrl = `${baseUrl}/images/logo-mark.png`;

  const data = {
    "@type": "BlogPosting",
    headline: title,
    description,
    image: imageUrl,
    url,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "ABTech",
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
    },
    datePublished: publishedDate,
    dateModified: modifiedDate,
    articleSection: category,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return <StructuredData type="BlogPosting" data={data} />;
}

// Breadcrumb structured data
export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <StructuredData type="BreadcrumbList" data={data} />;
}

// Organization structured data
export function OrganizationStructuredData() {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://abtech.com").replace(/\/$/, "");
  const logoUrl = `${baseUrl}/images/logo-mark.png`;
  const data = {
    "@type": "Organization",
    name: "ABTech",
    url: "https://abtech.com",
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
    },
    description: "Latest technology news, AI insights, startup stories, and tech trends.",
    sameAs: [
      "https://twitter.com/abtech",
      "https://linkedin.com/company/abtech",
      "https://github.com/abtech",
    ],
  };

  return <StructuredData type="Organization" data={data} />;
}

// Website structured data
export function WebsiteStructuredData() {
  const data = {
    "@type": "WebSite",
    name: "ABTech",
    url: "https://abtech.com",
    description: "Latest technology news, AI insights, startup stories, and tech trends.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://abtech.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return <StructuredData type="WebSite" data={data} />;
}