const nextConfig = {
  experimental: {
    serverActions: true,
  },
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination: "/api/socket",
      },
      // Add other rewrite rules as needed
    ];
  },
};

module.exports = nextConfig;
