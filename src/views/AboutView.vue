<script setup>
import { ref } from 'vue';
import { preloadImage } from '@/utils/common';
import VLazyImage from 'v-lazy-image';


import 'vue3-carousel/dist/carousel.css';
import 'swiper/swiper-bundle.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { Carousel, Slide, Navigation as CarouselNavigation, Pagination as CarouselPagination } from 'vue3-carousel';
import { Navigation as SwiperNavigation, Pagination as SwiperPagination, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';

import backpackingCamino from '../assets/images/about_pictures/backpackingCamino.jpeg';
import ChicagoBean from '../assets/images/about_pictures/ChicagoBean.jpeg';
import Climbing1 from '../assets/images/about_pictures/Climbing1.jpeg';
import friends from '../assets/images/about_pictures/friends.jpeg';
import SenecaBase from '../assets/images/about_pictures/SenecaBase.jpeg';
import snorkelMaui from '../assets/images/about_pictures/snorkelMaui.jpeg';
import surfingMaui from '../assets/images/about_pictures/surfingMaui.jpeg';
import surfingOBX from '../assets/images/about_pictures/surfingOBX.jpeg';

</script>

<template>
  <div class="about">
    <div class="topic-container">
      <h1>Professional Stuff:</h1>
      <p class="about-text">
        I grew up in Virginia Beach, VA and went to <a href="https://www.capehenrycollegiate.org/" target="_blank"
          rel="noopener">Cape
          Henry</a> for
        high school. I applied to a few colleges and chose <a href="https://www.virginia.edu/" target="_blank"
          rel="noopener">UVA</a>
        for my secondary education. My first year at UVA, I didn’t know what I wanted to focus on for my degree, so I
        took
        a wide variety of classes (drama, computer science, music, environmental science, physics, the list goes on).
        Over
        the years, I ended going for one fun major (music) and one "get-a-job" major (computer science). In May of 2022,
        I
        graduated UVA with 2 Bachelor of Arts degrees and then moved to northern Virginia. I worked for 2 years full
        time
        in person as a systems engineer for <a href="https://www.arcfield.com/" target="_blank"
          rel="noopener">Arcfield</a>, but did a
        lot of software
        engineering during my time. I sharpened my Python skills, as well as picking up some front end development tools
        (JavaScript, HTML, and CSS) and back end database management with SQL. I also learned the foundations of
        software
        deployment with Docker, Harbor, and Rancher for container orchestration. However, since I had lived in the state
        of Virginia my whole life and wanted a more advanced degree, I decided to apply to graduate school in
        California.
        I am now attending the University of California, Irvine, pursuing a Master’s in Data Science while still working
        remotely part time for Arcfield.
      </p>
    </div>
    <div class="topic-container">
      <h1><br>Who I really am:</h1>
      <p class="about-text">
        I’m a 25 year old guy that enjoys some pretty cookie cutter things: I like watching football (go Chiefs 3peat
        incoming), I enjoy spending time outdoors (hiking, camping, surfing, etc), and I love to cook just about
        anything.
        I’m currently living in Irvine, California, which is pretty conducive to the way I like to live my life with
        respect to the surfing and outdoorsy parts. Since my girlfriend lives in San Diego and attends USD law school, I
        spend a good amount of time down there as well. So far I’ve surfed at Scripps Pier, Encinitas, Windansea, and
        Trestles Beach, which have all had awesome waves.
      </p>

    </div>
    <div>
      <Carousel ref="carousel" v-if="isDesktop" :items-to-show="1" :items-to-scroll="1" navigationEnabled
        @slide="updateCurrentIndex">
        <template #addons>
          <CarouselNavigation />
          <CarouselPagination />
        </template>
        <Slide v-for="(image, index) in images" :key="index">
          <div class="slide-content">
            <img :src="image.src" :alt="image.alt" width="300rem">
            <p>{{ image.caption }}</p>
          </div>
        </Slide>
      </Carousel>

      <swiper v-else ref="swiper" :modules="modules" :slides-per-view="1" :space-between="5" navigation
        :pagination="{ clickable: true }" @slideChange="onSlideChange">
        <swiper-slide v-for="(image, index) in images" :key="index">
          <div class="slide-content">
            <v-lazy-image :src="image.src" :alt="image.alt" width="280rem" />
            <p>{{ image.caption }}</p>
          </div>
        </swiper-slide>
      </swiper>

    </div>
  </div>

</template>

<script>
export default {
  components: {
    Carousel,
    Slide,
    CarouselNavigation,
    CarouselPagination,
    Swiper,
    SwiperSlide,
    VLazyImage,
  },
  data() {
    const images = ref([
      {
        src: backpackingCamino, alt: 'Backpacking the Camino de Santiago in Spain',
        caption: 'Backpacking Camino de Santiago in Spain'
      },
      {
        src: ChicagoBean, alt: 'Me and a friend visiting the Chicago Bean',
        caption: 'Me and a friend visiting the Chicago Bean'
      },
      {
        src: Climbing1, alt: 'Climbing the Manchester Wall in Richmond, VA',
        caption: 'Climbing Manchester Wall in Richmond, VA'
      },
      {
        src: friends, alt: 'Friends visiting the caverns in Luray, VA', caption:
          'Friends visiting the caverns in Luray, VA'
      },
      {
        src: SenecaBase, alt: 'About to start the climb at Seneca Rocks, WV',
        caption: 'About to climb at Seneca Rocks, WV'
      },
      {
        src: snorkelMaui, alt: 'Snorkeling in Maui', caption: 'Snorkeling in Maui'
      },
      { src: surfingMaui, alt: 'Surfing in Maui', caption: 'Surfing in Maui' },
      { src: surfingOBX, alt: 'Surfing in the Outer Banks, NC', caption: 'Surfing in the Outer Banks, NC', height: "200rem" }
    ]);

    return {
      width: window.innerWidth,
      currentIndex: 0,
      modules: [SwiperNavigation, SwiperPagination, A11y],
      images,
      isFirstLoad: true
    };
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      if (vm.isFirstLoad) {
        preloadImage('about_pictures');
        vm.isFirstLoad = false;
      }
    });
  },
  computed: {
    isDesktop() {
      return this.width >= 534;
    }
  },
  methods: {
    onSlideChange(swiper) {
      this.updateCurrentIndex(swiper);
    },
    updateWidth() {
      this.width = window.innerWidth;
    },
    updateCurrentIndex(swiper) {
      this.currentIndex = swiper.activeIndex;
    },
  },
  mounted() {
    window.addEventListener('resize', this.updateWidth);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateWidth);
  },
};
</script>

<style>
.carousel__pagination-button {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  /* This makes the buttons circular */
  background-color: #090f20;
  margin: 0 5px;
  cursor: pointer;
  padding: 3px;
}

.carousel__pagination-button:hover {
  background-color: #000;
}


.carousel__pagination-button--active {
  background-color: #f3f7fc;
}

.swiper-pagination-bullet {
  background-color: #f3f7fc;
}

.about {
  min-height: 100vh;
}

.carousel-container {
  width: 100%;
  max-width: 600px;
  margin: auto;
}

.carousel__next--disabled,
.carousel__prev--disabled,
.swiper-button-prev,
.swiper-button-next {
  visibility: hidden;
}

.carousel__prev,
.carousel__next {
  width: 4rem;
  height: 4rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: #f3f7fc;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.carousel__prev:hover,
.carousel__next:hover {
  color: #384355;
  /* Change this to your desired color */
  background-color: #f3f7fc;
  /* Example for background color */
  /* Example for border color */
}

.carousel__pagination-button--active::after {
  background-color: #f3f7fc;
}

.swiper-slide {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: auto;
}

.slide-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.slide-content img {
  display: block;
  margin: auto;
}

.slide-content p {
  text-align: center;
  margin-top: 10px;
}
</style>
