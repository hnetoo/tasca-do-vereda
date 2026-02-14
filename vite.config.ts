import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const configDir = dirname(fileURLToPath(import.meta.url))

const findRoot = () => {
  let current = process.cwd()
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(resolve(current, 'index.html'))) {
      return current
    }
    const parent = resolve(current, '..')
    if (parent === current) {
      break
    }
    current = parent
  }
  if (existsSync(resolve(configDir, 'index.html'))) {
    return configDir
  }
  return process.cwd()
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true' || process.env.GITHUB_PAGES === 'true';
  const base = (isGitHubPages && repoName) ? `/${repoName}/` : './';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    base,
    root: findRoot(),
    server: {
      port: 5173,
      open: false,
      strictPort: true
    },
    build: {
      target: 'chrome89',
      outDir: 'dist',
      minify: false,
      sourcemap: false,
      cssCodeSplit: false,
      rollupOptions: {
        input: 'index.html',
      },
    },
    resolve: {
      alias: {
        '@': '/src'
      },
      dedupe: ['react', 'react-dom', 'react-router-dom']
    },
    optimizeDeps: {
      include: ['cookie', 'react-router-dom', 'exceljs'],
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },
    define: {
      'process.env': {},
      'global': 'globalThis'
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      coverage: {
        provider: 'v8' as const,
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage',
        thresholds: {
          lines: 10,
          functions: 10,
          statements: 15,
          branches: 10
        }
      }
    }
  };
});
