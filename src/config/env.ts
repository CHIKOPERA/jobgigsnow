import "server-only";
import { z } from "zod";

const boolFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),

  CONTACT_EMAIL: z.email().default("contact@jobgigsnow.co.za"),

  ADSENSE_CLIENT_ID: z.string().regex(/^ca-pub-\d+$/).default("ca-pub-4285411663423178"),
  ADSENSE_JOB_SLOT: z.string().regex(/^\d+$/).optional(),
  ADSENSE_ARTICLE_SLOT: z.string().regex(/^\d+$/).optional(),
  ADSENSE_COURSE_SLOT: z.string().regex(/^\d+$/).optional(),

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),

  INGEST_SERVICE_TOKEN: z.string().min(16, "INGEST_SERVICE_TOKEN must be at least 16 characters"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),

  AI_PROVIDER: z.enum(["anthropic", "openai"]).default("anthropic"),
  AI_MODEL: z.string().min(1).default("claude-sonnet-4-5"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),

  PEXELS_API_KEY: z.string().min(1).optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1).default("jobgigsnow"),
  CLOUDFLARE_R2_PUBLIC_DOMAIN: z.string().min(1).optional(),

  // JS-rendering fallback for HTML sources that return an empty shell (SPAs).
  // Get a token at console.lightpanda.io — set this and add jsRendering:true to any source's
  // crawlConfig to route its detail-page acquisitions through Lightpanda Cloud.
  LIGHTPANDA_API_TOKEN: z.string().min(1).optional(),

  FEATURE_NATIVE_APPLY: boolFromString,
  FEATURE_ALERTS: boolFromString,
}).refine(
  (env) => (env.AI_PROVIDER === "anthropic" ? !!env.ANTHROPIC_API_KEY : !!env.OPENAI_API_KEY),
  {
    message: "The API key matching AI_PROVIDER is required (ANTHROPIC_API_KEY or OPENAI_API_KEY).",
    path: ["AI_PROVIDER"],
  },
);

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables — see errors above.");
  }
  return parsed.data;
}

export const env = loadEnv();
