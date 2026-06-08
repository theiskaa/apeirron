import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Georgian, Playfair_Display } from "next/font/google";
import "./globals.css";
import { buildGraphData } from "@/lib/content";
import SearchProvider from "@/components/SearchProvider";

const inter = Inter({ subsets: ["latin"] });
const notoGeorgian = Noto_Sans_Georgian({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-title",
});
// Newspaper headline serif. Used on the front-page index (/nodes) masthead and
// article headlines; exposed as the --font-serif CSS variable.
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1b1d" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Apeirron — Biggest questions humanity asks",
    template: "%s",
  },
  description:
    "An interactive knowledge graph mapping the biggest questions humanity asks — consciousness, ancient civilizations, the nature of reality, and many more",
  keywords: [
    "knowledge graph",
    "consciousness",
    "simulation theory",
    "ancient civilizations",
    "fermi paradox",
    "panpsychism",
    "philosophy",
    "deep dive",
    "interactive graph",
  ],
  metadataBase: new URL("https://www.apeirron.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Apeirron — Biggest questions humanity asks",
    description:
      "An interactive knowledge graph exploring consciousness, reality, ancient civilizations, and the cosmos. Every idea is a node. Every connection has a reason.",
    siteName: "Apeirron",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Apeirron — Interactive Knowledge Graph" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apeirron — Biggest questions humanity asks",
    description:
      "An interactive knowledge graph exploring consciousness, reality, ancient civilizations, and the cosmos.",
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lightweight, module-cached node metadata (id/title/category/color/val) for
  // the global search palette. Passed via the RSC payload so the palette is
  // available on every route without importing server-only content on the client.
  const { nodes } = await buildGraphData();

  return (
    <html
      lang="en"
      className={`${notoGeorgian.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="warm"||t==="black")document.documentElement.classList.add(t);}catch(e){}`,
          }}
        />
      </head>
      <body className={inter.className}>
        <SearchProvider nodes={nodes}>{children}</SearchProvider>
      </body>
    </html>
  );
}
