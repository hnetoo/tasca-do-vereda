/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.TAURI_BUILD === 'true' ? 'export' : undefined,
  distDir: process.env.TAURI_BUILD === 'true' ? 'dist' : '.next',

  // Isso permite que o Tauri use a app como arquivos estáticos
  // mas mantém a funcionalidade total na Vercel
  trailingSlash: process.env.TAURI_BUILD === 'true' ? true : false,
  images: { 
    unoptimized: true 
  },
  
  // Configuração para resolver problemas de Server Actions com proxy
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  serverExternalPackages: [],
  
  // Permitir requisições de diferentes origins para desenvolvimento
  allowedDevOrigins: ['127.0.0.1:57309', 'localhost:3000'],
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://myppylcyupoirizyxhpo.supabase.co https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://myppylcyupoirizyxhpo.supabase.co",
              "connect-src 'self' https://myppylcyupoirizyxhpo.supabase.co https://*.googleapis.com wss://myppylcyupoirizyxhpo.supabase.co",
              "worker-src 'self' blob:",
              "frame-src 'none'"
            ].join('; ')
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // PWA Head Configuration
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
    ];
  },
  
  turbopack: {
    root: './',
  },
  
  // Configuração TypeScript mais permissiva para evitar erros
  typescript: { 
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json'
  },
  
  // Configuração do Webpack para estabilidade
  webpack: (config, { isServer }) => {
    // Resolver problemas de chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    config.externals.push(({ request }, callback) => {
      if (request?.startsWith('node:')) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    });
    
    // Desabilitar crypto polyfill no Tauri para evitar erros
    if (!isServer) {
      config.resolve.alias['node:crypto'] = false;
    }
    
    return config;
  },
  
  async redirects() {
    return [
      {
        source: '/menu-digital',
        destination: '/menu',
        permanent: true,
      },
      {
        source: '/',
        destination: '/menu',
        permanent: false,
        has: [
          {
            type: 'header',
            key: 'x-menu-mode',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
