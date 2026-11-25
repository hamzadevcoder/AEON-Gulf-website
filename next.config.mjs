import { readdirSync } from 'node:fs';

// Serve photos from /public/images once `scripts/fetch-assets.mjs` has downloaded them all.
let localImages = false;
try {
  localImages = readdirSync(new URL('./public/images/', import.meta.url)).length >= 18;
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false, // hides the Next.js "N" badge in development
  poweredByHeader: false,
  experimental: {
    // image uploads in the dashboard go through server actions
    serverActions: { bodySizeLimit: '10mb' },
  },
  async headers() {
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
    ];
    return [
      { source: '/:path*', headers: security },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
  env: { NEXT_PUBLIC_LOCAL_IMAGES: process.env.NEXT_PUBLIC_LOCAL_IMAGES ?? (localImages ? '1' : '0') },
  // Keep links from the current WordPress site working after launch.
  async redirects() {
    return [
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/ksa', destination: '/saudi-arabia', permanent: true },
      { source: '/ksa/service/:slug', destination: '/saudi-arabia/services/:slug', permanent: true },
      { source: '/:country(kuwait|qatar)/service/:slug', destination: '/:country/services/:slug', permanent: true },
      { source: '/:country(kuwait|qatar|ksa)/contact-us', destination: '/contact', permanent: true },
      { source: '/:country(kuwait|qatar|ksa)/about-us', destination: '/about', permanent: true },
      { source: '/:country(kuwait|qatar|ksa)/quote', destination: '/quote', permanent: true },
    ];
  },
};
export default nextConfig;
