import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Sitemap from 'vite-plugin-sitemap';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoSleep() {
  console.log('Start sleeping...');
  await sleep(10000); // 10 seconds
  console.log('Wake up after 10 seconds!');
}

const rewriteSlashToIndexHtml = () => {
  return {
    name: 'rewrite-slash-to-index-html',
    apply: 'serve',
    enforce: 'post',
    configureServer(server) {
      // rewrite / as index.html
      server.middlewares.use('/', (req, _, next) => {
        if (req.url === '/about' || req.url === '/about/') {
          console.log('rerouting to about page');
          demoSleep();
          req.url = '/about/';
        } else if (req.url === '/contact' || req.url === '/contact/') {
          console.log('rerouting to contact page');
          demoSleep();
          req.url = '/contact/';
        }
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {

  return {
    base: '/sam-townsend/',
    plugins: [
      vue(),
      rewriteSlashToIndexHtml(),
      Sitemap({
        hostname: 'https://sam-townsend.netlify.app/',
        dynamicRoutes: [
          '/sam-townsend',
          '/contact',
          '/about',
          '/portfolio'
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
  }

});

