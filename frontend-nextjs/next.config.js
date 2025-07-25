/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PORT: '3000'
  },
  // Configurar explicitamente para usar src como diretório base
  experimental: {
    appDir: true,
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date' },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
      };
    }
    
    // Ignorar warnings específicos do webpack
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Cannot statically analyse/,
      /clone-deep/,
    ];
    
    return config;
  }
};

module.exports = nextConfig;
