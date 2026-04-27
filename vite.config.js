import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Sitemap from 'vite-plugin-sitemap';
import fs from 'node:fs';
import path from 'node:path';

// Read travel photos data for dynamic routes
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const travelPhotosPath = path.resolve(__dirname, './src/data/travel-photos.json');
const travelPhotos = JSON.parse(fs.readFileSync(travelPhotosPath, 'utf-8'));
const stateRoutes = Object.keys(travelPhotos)
  .filter(state => state !== 'Unknown')
  .map(state => `/travel/${state.toLowerCase().replace(/\s+/g, '-')}`);

const allRoutes = [
  '/',
  '/contact',
  '/about',
  '/portfolio',
  '/travel',
  ...stateRoutes
];

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    base: '/sam-townsend/',
    plugins: [
      vue(),
      Sitemap({
        hostname: 'https://sft3hy.github.io/sam-townsend',
        dynamicRoutes: allRoutes,
      }),
    ],
    ssgOptions: {
      includedRoutes(paths, routes) {
        return allRoutes;
      },
    },
    assetsInclude: ['**/*.JPG', '**/*.JPEG', '**/*.GIF', '**/*.PNG'],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
  }
});
