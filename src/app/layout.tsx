import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { site } from "@/config";
import { SiteShell } from "@/components/nav/SiteShell";
import { Header } from "@/components/nav/Header";
import { TabBar } from "@/components/nav/TabBar";
import { Footer } from "@/components/nav/Footer";
import "./globals.css";

const GOOGLE_ANALYTICS_ID = "G-CTH96RBWSK";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${schibstedGrotesk.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-bg text-ink font-sans text-body">
          <SiteShell header={<Header />} footer={<Footer />} tabBar={<TabBar />}>
            {children}
          </SiteShell>
        </body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
      </html>
    </ClerkProvider>
  );
}
