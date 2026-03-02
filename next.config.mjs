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
  
  // PWA Configuration
  async headers() {
    return [
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
  
  // Ignorar erros de linting e typescript durante o build
  typescript: { 
    ignoreBuildErrors: false 
  },
  
  // Configuração do Webpack para lidar com módulos node:
  webpack: (config, { isServer }) => {
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
