import type { NextConfig } from "next";

// Supabase-Host aus der Env ableiten, damit ein DB-/Projektwechsel keine
// Code-Änderung braucht (Fallback: altes Cloud-Projekt)
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : 'rypvcqzzcmgevdgeqtbr.supabase.co';

const nextConfig: NextConfig = {
  // Standalone-Output für Docker/Coolify-Deployment (siehe SELF-HOSTING-PLAN.md)
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Increase body size limit for API routes to handle large image uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Reduce build output
  cleanDistDir: true,
};

export default nextConfig;
