"use client";

import type { ReactNode } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

export function SiteShell({
  children,
  header,
  tabBar,
}: {
  children: ReactNode;
  header: ReactNode;
  tabBar: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      {tabBar}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4285411663423178"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    </>
  );
}
