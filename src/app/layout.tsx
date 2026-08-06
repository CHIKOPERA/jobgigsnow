import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { site } from "@/config";
import { Header } from "@/components/nav/Header";
import { TabBar } from "@/components/nav/TabBar";
import "./globals.css";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${schibstedGrotesk.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-bg text-ink font-sans text-body">
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <TabBar />
        </body>
      </html>
    </ClerkProvider>
  );
}
