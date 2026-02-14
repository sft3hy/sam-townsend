<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { preloadImage } from '@/utils/common';
import VLazyImage from 'v-lazy-image';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/mousewheel';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { FreeMode, Navigation, Pagination, Mousewheel } from 'swiper/modules';

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
      <div class="swiper-container">
        <swiper
          :modules="[FreeMode, Navigation, Pagination, Mousewheel]"
          :slides-per-view="isDesktop ? 2.5 : 1.2"
          :space-between="20"
          :free-mode="{
            enabled: true,
            momentum: false,
          }"
          :mousewheel="{
            forceToAxis: true,
            sensitivity: 1,
          }"
          :navigation="{
            prevEl: '.swiper-button-prev',
            nextEl: '.swiper-button-next',
          }"
          :pagination="{ clickable: true }"
          class="adventures-swiper"
        >
          <swiper-slide v-for="(image, index) in images" :key="index">
            <div class="carousel__item">
              <div class="image-card">
                <v-lazy-image :src="image.src" :alt="image.alt" class="slide-image" />
              </div>
              <div class="slide-caption glass-panel">
                {{ image.caption }}
              </div>
            </div>
          </swiper-slide>
        </swiper>
        <!-- Navigation Buttons moved outside swiper element for better visibility -->
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 4rem;
  box-sizing: border-box;
  min-width: 0;
}

.split-section {
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
  align-items: flex-start;
  width: 100%;
}

.content-side {
  flex: 1;
  min-width: 0; /* Allow flex item to shrink below content size */
}

.divider {
  width: 1px;
  background: var(--color-border);
  align-self: stretch;
  margin: 1rem 0;
  flex-shrink: 0;
}

.carousel-section {
  text-align: center;
  padding: 3rem 1rem;
  position: relative;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* Prevent swiper from expanding the container */
}

.carousel-section h3 {
  margin-bottom: 2rem;
  color: var(--vt-c-accent);
}

.swiper-container {
  position: relative;
  width: 100%;
  max-width: 100%; /* Ensure it doesn't exceed parent */
  margin: 0 auto;
  padding: 0 3.5rem; /* Space for arrows */
  box-sizing: border-box;
  overflow: visible; /* Allow arrows to be visible outside if needed, but parent hides overflow */
}

/* Swiper Specific Styling */
.adventures-swiper {
  padding: 1rem 0 3.5rem 0; /* Space for pagination */
  width: 100%;
}

/* Custom Swiper Navigation */
.swiper-button-prev,
.swiper-button-next {
  background-color: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 50%;
  color: var(--vt-c-accent);
  border: 1px solid var(--glass-border);
  width: 3.25rem;
  height: 3.25rem;
  transition: all 0.3s ease;
  top: 45%;
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.swiper-button-prev {
  left: 0.25rem;
}

.swiper-button-next {
  right: 0.25rem;
}

.swiper-button-prev::after,
.swiper-button-next::after {
  font-size: 1.2rem;
  font-weight: 800;
}

.swiper-button-prev:hover,
.swiper-button-next:hover {
  background-color: var(--vt-c-accent);
  color: white;
  transform: scale(1.1);
}

/* Hide default swiper internal buttons if they appear */
:deep(.swiper-button-disabled) {
  opacity: 0.35;
  cursor: not-allowed;
}

:deep(.swiper-slide) {
  height: auto;
}

.carousel__item {
  padding: 0.5rem;
  height: 100%;
}

.image-card {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease;
  height: 400px;
  width: 100%;
  cursor: grab;
}

.image-card:active {
  cursor: grabbing;
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
  margin-top: 1.25rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  color: var(--color-text);
  display: inline-block;
  max-width: 90%;
  line-height: 1.4;
}

/* Custom Swiper Pagination */
:deep(.swiper-pagination-bullet) {
  background: var(--color-border-hover);
  opacity: 0.5;
  width: 25px;
  height: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

:deep(.swiper-pagination-bullet-active) {
  background: var(--vt-c-accent);
  opacity: 1;
  width: 40px;
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
    height: 350px;
    width: 100%;
  }

  .swiper-container {
    padding: 0 3rem;
  }
}

@media (max-width: 600px) {
  .image-card {
    height: 300px;
  }
  
  .carousel__item {
    padding: 0.25rem;
  }

  .swiper-container {
    padding: 0 2rem;
  }

  .swiper-button-prev,
  .swiper-button-next {
    width: 2.5rem;
    height: 2.5rem;
  }

  .swiper-button-prev::after,
  .swiper-button-next::after {
    font-size: 1rem;
  }

  .swiper-button-prev {
    left: 0.125rem;
  }

  .swiper-button-next {
    right: 0.125rem;
  }
}
</style>

