<script setup>
import { computed } from 'vue';
import { RouterView, RouterLink, useRoute } from 'vue-router';
import { useHead } from '@vueuse/head';
import HamburgerMenu from './components/HamburgerMenu.vue';
import travelPhotos from '@/data/travel-photos.json';

const route = useRoute();
const pageTitle = computed(() => {
  if (route.name === 'TravelState' && route.params.state) {
    const slug = route.params.state;
    const stateName = Object.keys(travelPhotos).find(
      state => state.toLowerCase().replace(/\s+/g, '-') === slug
    );
    return stateName || 'Travel Gallery';
  }
  return route.name || 'Sam Townsend';
});

useHead({
  title: computed(() => route.meta.title || 'Sam Townsend'),
  meta: [
    {
      name: 'description',
      content: computed(() => route.meta.description || 'Sam Townsend - Software Engineer'),
    },
    {
      property: 'og:title',
      content: computed(() => route.meta.title || 'Sam Townsend'),
    },
    {
      property: 'og:description',
      content: computed(() => route.meta.ogDescription || route.meta.description || 'Sam Townsend - Software Engineer'),
    },
    {
      property: 'og:url',
      content: computed(() => route.meta.ogUrl || 'https://sft3hy.github.io/sam-townsend/'),
    },
    {
      property: 'og:image',
      content: computed(() => {
        const image = route.meta.ogImage;
        if (!image) return 'https://sft3hy.github.io/sam-townsend/assets/surfingOBX.jpeg';
        if (image.startsWith('http')) return image;
        return `https://sft3hy.github.io${image}`;
      }),
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: computed(() => route.meta.canonical || 'https://sft3hy.github.io/sam-townsend/'),
    },
  ],
});
</script>

<template>
  <div id="app">
    <header class="top-bar glass-panel">
      <div class="logo">
        <RouterLink to="/">{{ pageTitle }}</RouterLink>
      </div>
      <HamburgerMenu />
    </header>

    <main class="page-content">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <footer class="site-footer">
      <p>&copy; {{ new Date().getFullYear() }} Sam Townsend</p>
    </footer>
  </div>
</template>

<style scoped>
.top-bar {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  max-width: 1400px;
  height: 4rem;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  border-radius: var(--radius-lg);
  /* Glass effect handled by global .glass-panel class */
}

.logo a {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-heading);
  letter-spacing: -0.02em;
}

.page-content {
  padding-top: 8rem; /* Space for fixed header */
  flex: 1;
  width: 100%;
  min-width: 0; /* Allow flex item to shrink below content size */
}

.site-footer {
  padding: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text);
  margin-top: auto;
  opacity: 0.7;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
