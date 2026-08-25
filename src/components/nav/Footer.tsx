import Link from "next/link";
import { site } from "@/config";

const links = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/editorial-policy", label: "Editorial policy" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="text-meta text-ink-muted">
          © {new Date().getFullYear()} {site.name}. Find opportunities with context and apply at the source.
        </p>
        <nav aria-label="Company and policies">
          <ul className="flex flex-wrap gap-x-5 gap-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="focus-ring rounded-sm text-meta text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
