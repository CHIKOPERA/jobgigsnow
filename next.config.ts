import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse / pdfjs-dist v5 references browser globals (DOMMatrix, ImageData, Path2D) at
  // module-initialisation time, which crashes the serverless bundle before any request is served.
  // Marking them external means Next.js loads them via require() at runtime rather than bundling
  // them through webpack, which avoids the static-analysis pass that triggers the crash.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
