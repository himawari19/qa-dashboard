import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppWrapper } from "@/components/app-wrapper";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QA Daily Hub — Test Management & Bug Tracking for QA Teams",
    template: "%s | QA Daily Hub",
  },
  description:
    "Plan tests, execute sessions, track bugs, and measure quality health in one workspace. Free for small teams. Replaces spreadsheets and complex tools like Jira/TestRail.",
  keywords: [
    "QA management",
    "test case management",
    "bug tracking",
    "test execution",
    "quality assurance",
    "QA workspace",
    "test management tool",
    "sprint testing",
    "QA dashboard",
    "software testing platform",
  ],
  authors: [{ name: "Akusara Project" }],
  creator: "Akusara Project",
  publisher: "Akusara Project",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://qadailyhub.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "QA Daily Hub",
    title: "QA Daily Hub — Test Management & Bug Tracking for QA Teams",
    description:
      "Plan tests, execute sessions, track bugs, and measure quality health in one workspace. Free for small teams.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QA Daily Hub — The modern QA workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QA Daily Hub — Test Management & Bug Tracking for QA Teams",
    description:
      "Plan tests, execute sessions, track bugs, and measure quality health in one workspace. Free for small teams.",
    images: ["/og-image.png"],
  },
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "QA Daily Hub",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Plan tests, execute sessions, track bugs, and measure quality health in one workspace for QA teams.",
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "0",
                highPrice: "59",
                priceCurrency: "USD",
                offerCount: "3",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "127",
              },
            }),
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  document.querySelectorAll('[bis_skin_checked]').forEach(function(el){
                    el.removeAttribute('bis_skin_checked');
                  });
                  new MutationObserver(function(mutations){
                    mutations.forEach(function(m){
                      if(m.type==='attributes'&&m.attributeName==='bis_skin_checked'){
                        m.target.removeAttribute('bis_skin_checked');
                      }
                    });
                  }).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked']});
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AppWrapper>
          {children}
        </AppWrapper>
        <Toaster />
      </body>
    </html>
  );
}
