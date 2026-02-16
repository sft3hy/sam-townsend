import './assets/main.css';
import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import { routes } from './router';
import { removeTags, createTag } from '@/utils/common';

export const createApp = ViteSSG(
    App,
    { routes, base: import.meta.env.BASE_URL },
    ({ app, router, routes, isClient, initialState }) => {
        if (isClient) {
            router.beforeEach((to, from, next) => {
                removeTags();

                const ogTitle = to.meta.title || 'Default Description';
                createTag('meta', 'property', 'og:title', ogTitle);

                const ogDescription = to.meta.ogDescription || 'Default Description';
                createTag('meta', 'property', 'og:description', ogDescription);

                const siteName = to.meta.title || 'Default Title';
                createTag('meta', 'property', 'og:site_name', siteName);

                const ogUrl = to.meta.ogUrl || 'Default Title';
                createTag('meta', 'property', 'og:url', ogUrl);

                const description = to.meta.description || 'Default Description';
                createTag('meta', 'name', 'description', description);
                document.title = to.meta.title || 'Default Title';

                const canon = document.createElement('link');
                canon.setAttribute('rel', 'canonical');
                canon.setAttribute('href', to.meta.canonical);
                document.head.insertBefore(canon, document.head.firstChild);

                next();
            });
        }
    }
);
