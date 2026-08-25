"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

interface AdSenseUnitProps {
  clientId: string;
  slotId: string;
}

export function AdSenseUnit({ clientId, slotId }: AdSenseUnitProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("AdSense unit could not be initialized", error);
      }
    }
  }, []);

  return (
    <aside className="mt-6" aria-label="Advertisement">
      <p className="mb-2 text-center text-[11px] uppercase tracking-[0.08em] text-ink-muted">
        Advertisement
      </p>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className="adsbygoogle block min-h-24 overflow-hidden rounded-md"
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
