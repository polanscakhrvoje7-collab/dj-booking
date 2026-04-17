import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Enables Cloudflare bindings in local `next dev`
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {};

export default nextConfig;
