import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    // Use environment variable for API URL, fallback to localhost for development
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    
    return [
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` }
    ]
  }
};

export default nextConfig;
