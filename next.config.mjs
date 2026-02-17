/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para compatibilidade com Tauri e Next.js 15
  // Ativa 'export' apenas quando a variável de ambiente TAURI_BUILD estiver definida
  // Para Vercel (sem TAURI_BUILD), usamos o default (undefined) para garantir a estrutura .next padrão
  output: process.env.TAURI_BUILD ? 'export' : undefined,

  // Isso permite que o Tauri use a app como arquivos estáticos se necessário
  // mas mantém a funcionalidade total na Vercel
  images: { 
    unoptimized: true 
  },
  
  // Ignorar erros de linting e typescript durante o build
  typescript: { 
    ignoreBuildErrors: true 
  },
  eslint: { 
    ignoreDuringBuilds: true 
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
