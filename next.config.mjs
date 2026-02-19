/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.TAURI_BUILD === 'true' ? 'export' : undefined,
  distDir: process.env.TAURI_BUILD === 'true' ? 'dist' : '.next',

  // Isso permite que o Tauri use a app como arquivos estáticos se necessário
  // mas mantém a funcionalidade total na Vercel
  trailingSlash: true,
  images: { 
    unoptimized: true 
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

    if (!isServer) {
      config.resolve.alias['node:crypto'] = false;
    }

    return config;
  },
};

export default nextConfig;
