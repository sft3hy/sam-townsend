<script setup>
import { RouterLink } from 'vue-router';
import { preloadImage } from '@/utils/common';
import VLazyImage from 'v-lazy-image';

import Climbing from '../assets/images/home_picture/Climbing.jpeg';

</script>

<template>
  <main class="home-container">
    <div class="hero-content">
      <div class="text-section">
        <h1 class="animate-title">Howdy!</h1>
        <p class="home-text">
          Glad you could make it. Welcome to my site built with <a href="https://vuejs.org" target="_blank" rel="noopener">Vue JS</a>.
        </p>
        <div class="cta-group">
          <RouterLink to="/about" class="btn btn-primary">About Me</RouterLink>
          <RouterLink to="/contact" class="btn btn-secondary">Get in Touch</RouterLink>
        </div>
      </div>
      
      <div class="image-section">
        <div class="image-wrapper glass-panel">
          <v-lazy-image :src="Climbing" alt="Climbing Seneca Rocks" class="hero-image" />
          <div class="caption-badge glass-panel">
            Summit of <a href="https://en.wikipedia.org/wiki/Seneca_Rocks" target="_blank" rel="noopener">Seneca Rocks</a>, WV
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-container {
  min-height: calc(100vh - 8rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  width: 100%;
  max-width: 1200px;
}

.text-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.animate-title {
  font-size: 5rem;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--vt-c-dark-blue) 0%, var(--vt-c-accent) 50%, #68d391 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.home-text {
  font-size: 1.25rem;
  max-width: 50ch;
  margin-bottom: 2.5rem;
  color: var(--color-text);
}

.cta-group {
  display: flex;
  gap: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--vt-c-accent);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(143, 169, 247, 0.39);
}

.btn-primary:hover {
  background: var(--vt-c-accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(143, 169, 247, 0.23);
}

.btn-secondary {
  background: transparent;
  color: var(--vt-c-accent);
  border: 2px solid var(--vt-c-accent);
}

.btn-secondary:hover {
  background: rgba(143, 169, 247, 0.1);
  transform: translateY(-2px);
}

.image-section {
  position: relative;
  display: flex;
  justify-content: center;
}

.image-wrapper {
  position: relative;
  padding: 1rem;
  transform: rotate(2deg);
  transition: transform 0.5s ease;
}

.image-wrapper:hover {
  transform: rotate(0deg) scale(1.02);
}

.hero-image {
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 400px;
  height: auto;
  object-fit: cover;
  display: block;
}

.caption-badge {
  position: absolute;
  bottom: -1rem;
  right: -1rem;
  font-size: 0.875rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  max-width: 200px;
  text-align: center;
}

/* Responsive */
@media (max-width: 900px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 3rem;
  }

  .text-section {
    align-items: center;
  }

  .animate-title {
    font-size: 3.5rem;
  }

  .home-text {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
