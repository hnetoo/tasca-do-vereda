/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para compatibilidade com Tauri e Next.js 15
  // Ativa 'export' apenas quando a variável de ambiente TAURI_BUILD estiver definida
  output: process.env.TAURI_BUILD ? 'export' : 'standalone',
  
  // Ignorar erros de linting e typescript durante o build para debug
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
