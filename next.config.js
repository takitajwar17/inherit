const nextConfig = {
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
