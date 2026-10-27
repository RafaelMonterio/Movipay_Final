/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/login', destination: '/entrar' }, { source: '/register', destination: '/cadastro' },
      { source: '/client/:path*', destination: '/cliente/:path*' }, { source: '/worker/:path*', destination: '/trabalhador/:path*' },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [],
  },
};

module.exports = nextConfig;

