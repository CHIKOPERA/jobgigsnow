import "server-only";
import { env } from "./env";

export const site = {
  name: "Hirelane",
  description: "Find your next job — sourced, rewritten and posted daily.",
  url: env.NEXT_PUBLIC_SITE_URL,
} as const;
