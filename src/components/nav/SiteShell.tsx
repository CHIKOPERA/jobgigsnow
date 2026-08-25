"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function SiteShell({
  children,
  footer,
  header,
  tabBar,
}: {
  children: ReactNode;
  footer: ReactNode;
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
      {footer}
      {tabBar}
    </>
  );
}
