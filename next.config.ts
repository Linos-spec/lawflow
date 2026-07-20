import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // pdf-parse (pdf.js) must not be bundled — it breaks the module's interop.
  // Load it from node_modules at runtime instead.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
