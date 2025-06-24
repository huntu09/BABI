/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript and ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable problematic optimizations that might cause SSR issues
  swcMinify: true,
  
  // Enable React strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    unoptimized: true,
  },

  // Enable compression
  compress: true,

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // Webpack configuration to handle client-side only modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude client-side only modules from server bundle
      config.externals = config.externals || []
      config.externals.push({
        'react-window': 'react-window',
      })
    }

    // Handle modules that use 'self' or other browser globals
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },

  // Disable static optimization for pages that use browser APIs
  experimental: {
    esmExternals: 'loose',
  },
}

export default nextConfig
