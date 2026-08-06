import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { z } from "zod";

export const publicHttpUrlSchema = z.url().superRefine((value, ctx) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    ctx.addIssue({ code: "custom", message: "Only http and https URLs can be crawled." });
  }
  if (url.username || url.password) {
    ctx.addIssue({ code: "custom", message: "URLs with embedded credentials are not allowed." });
  }
});

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");
  if (normalized.includes(":")) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized)
    );
  }

  const parts = normalized.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

/** Prevents the admin URL fetcher from being used as an SSRF path into local/private services. */
export async function assertPublicHttpUrl(value: string): Promise<string> {
  const parsed = publicHttpUrlSchema.parse(value.trim());
  const url = new URL(parsed);
  const hostname = url.hostname.toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Local and private network addresses cannot be crawled.");
  }

  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("This URL resolves to a local or private network address.");
  }

  url.hash = "";
  return url.toString();
}
