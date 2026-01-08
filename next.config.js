/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Output optimization for deployment
  output: 'standalone',
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Image optimization
  images: {
    unoptimized: true,
    domains: ['localhost', 'firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Production-only optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Enable strict mode in production
    productionBrowserSourceMaps: false,
  }),
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
}

module.exports = nextConfig

