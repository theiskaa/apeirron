import type { Metadata } from "next";
import AboutView from "@/components/AboutView";

const BASE_URL = "https://www.apeirron.com";

export const metadata: Metadata = {
  title: "About — Apeirron",
  description:
    "How Apeirron is written, sourced, and governed. Editorial standards for mapping contested ideas: present both sides, show your work, treat every topic seriously. Open source, community-driven, Markdown-native.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Apeirron",
    description:
      "Editorial standards, sourcing requirements, and governance for an open-source knowledge graph of humanity's biggest questions.",
    type: "website",
    siteName: "Apeirron",
  },
};

export default function AboutPage() {
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${BASE_URL}/about#aboutpage`,
    url: `${BASE_URL}/about`,
    name: "About Apeirron",
    description:
      "Editorial standards, sourcing requirements, and governance for Apeirron — an open-source knowledge graph of contested ideas.",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    mainEntity: { "@id": `${BASE_URL}/#organization` },
    inLanguage: "en",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <AboutView />
    </>
  );
}
