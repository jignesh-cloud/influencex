import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root so Turbopack doesn't walk up to an unrelated
  // lockfile in the parent home directory.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
