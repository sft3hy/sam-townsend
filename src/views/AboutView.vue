<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { preloadImage } from '@/utils/common';
import VLazyImage from 'v-lazy-image';

import 'vue3-carousel/dist/carousel.css';
import { Carousel, Slide, Navigation as CarouselNavigation, Pagination as CarouselPagination } from 'vue3-carousel';

import backpackingCamino from '../assets/images/about_pictures/backpackingCamino.jpeg';
import ChicagoBean from '../assets/images/about_pictures/ChicagoBean.jpeg';
import Climbing1 from '../assets/images/about_pictures/Climbing1.jpeg';
import friends from '../assets/images/about_pictures/friends.jpeg';
import SenecaBase from '../assets/images/about_pictures/SenecaBase.jpeg';
import snorkelMaui from '../assets/images/about_pictures/snorkelMaui.jpeg';
import surfingMaui from '../assets/images/about_pictures/surfingMaui.jpeg';
import surfingOBX from '../assets/images/about_pictures/surfingOBX.jpeg';

const images = ref([
  { src: backpackingCamino, alt: 'Backpacking the Camino de Santiago', caption: 'Backpacking Camino de Santiago in Spain' },
  { src: ChicagoBean, alt: 'Visiting the Chicago Bean', caption: 'Me and a friend visiting the Chicago Bean' },
  { src: Climbing1, alt: 'Climbing the Manchester Wall', caption: 'Climbing Manchester Wall in Richmond, VA' },
  { src: friends, alt: 'Visiting Luray Caverns', caption: 'Friends visiting the caverns in Luray, VA' },
  { src: SenecaBase, alt: 'Seneca Rocks, WV', caption: 'About to climb at Seneca Rocks, WV' },
  { src: snorkelMaui, alt: 'Snorkeling in Maui', caption: 'Snorkeling in Maui' },
  { src: surfingMaui, alt: 'Surfing in Maui', caption: 'Surfing in Maui' },
  { src: surfingOBX, alt: 'Surfing in OBX', caption: 'Surfing in the Outer Banks, NC' }
]);

const width = ref(window.innerWidth);
const isDesktop = computed(() => width.value >= 900);

const updateWidth = () => {
  width.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', updateWidth);
  preloadImage('about_pictures');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidth);
});
</script>

<template>
  <div class="about-container">
    <div class="split-section glass-panel">
      <div class="content-side">
        <h2>Professional Stuff</h2>
        <p>
          I grew up in Virginia Beach, VA and went to <a href="https://www.capehenrycollegiate.org/" target="_blank" rel="noopener">Cape Henry</a> for high school. I chose <a href="https://www.virginia.edu/" target="_blank" rel="noopener">UVA</a> for my secondary education. My first year, I explored a variety of classes before settling on a double major in Music and Computer Science.
        </p>
        <p>
          In May 2022, I graduated and worked as a systems engineer for <a href="https://www.arcfield.com/" target="_blank" rel="noopener">Arcfield</a>. There, I sharpened my Python skills, front-end development (JS/HTML/CSS), and back-end database management. I also learned container orchestration with Docker and Rancher.
        </p>
        <p>
          Recently, I decided to pursue a Master’s in Data Science at the University of California, Irvine, while continuing to work remotely for Arcfield.
        </p>
      </div>
      <div class="divider"></div>
      <div class="content-side">
        <h2>Who I really am</h2>
        <p>
          I’m a 26-year-old guy who enjoys some pretty standard stuff: watching football (Go Chiefs!), hiking, camping, and cooking.
        </p>
        <p>
          I love living in La Jolla. Some of my favorite surf spots are Scripps Pier, Encinitas, and Trestles.
        </p>
      </div>
    </div>

    <div class="carousel-section glass-panel">
      <h3>Adventures</h3>
      <Carousel :items-to-show="isDesktop ? 2.5 : 1" :wrap-around="true" :transition="500">
        <Slide v-for="(image, index) in images" :key="index">
          <div class="carousel__item">
            <div class="image-card">
              <v-lazy-image :src="image.src" :alt="image.alt" class="slide-image" />
              <div class="slide-caption glass-panel">
                {{ image.caption }}
              </div>
            </div>
          </div>
        </Slide>
        <template #addons>
          <CarouselNavigation />
          <CarouselPagination />
        </template>
      </Carousel>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

.split-section {
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
  align-items: flex-start;
}

.content-side {
  flex: 1;
}

.divider {
  width: 1px;
  background: var(--color-border);
  align-self: stretch;
  margin: 1rem 0;
}

.carousel-section {
  text-align: center;
  overflow: hidden; /* Contain carousel overflow */
  padding: 3rem 1rem;
}

.carousel-section h3 {
  margin-bottom: 2rem;
  color: var(--vt-c-accent);
}

.carousel__item {
  padding: 1rem;
  height: 100%;
}

.image-card {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease;
  height: 400px; /* Fixed height for consistency */
  width: 100%;
}

.image-card:hover {
  transform: translateY(-5px);
}

.slide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-caption {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  padding: 0.5rem;
  font-size: 0.9rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-heading);
}

/* Customize Carousel Navigation */
:deep(.carousel__prev),
:deep(.carousel__next) {
  background-color: var(--glass-bg);
  border-radius: 50%;
  color: var(--vt-c-accent);
  border: 1px solid var(--glass-border);
  width: 3rem;
  height: 3rem;
  transition: all 0.2s;
}

:deep(.carousel__prev:hover),
:deep(.carousel__next:hover) {
  background-color: var(--vt-c-accent);
  color: white;
}

:deep(.carousel__pagination-button::after) {
  background-color: var(--color-border-hover);
  border-radius: 4px;
  width: 30px;
  height: 4px;
}

:deep(.carousel__pagination-button--active::after) {
  background-color: var(--vt-c-accent);
}

@media (max-width: 900px) {
  .split-section {
    flex-direction: column;
    gap: 2rem;
  }
  
  .divider {
    width: 100%;
    height: 1px;
    margin: 0;
  }

  .image-card {
    height: 300px;
  }
}
</style>
