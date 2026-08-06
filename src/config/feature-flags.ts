import "server-only";
import { env } from "./env";

export const featureFlags = {
  nativeApply: env.FEATURE_NATIVE_APPLY,
  alerts: env.FEATURE_ALERTS,
} as const;
