<script setup>
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import travelPhotos from '@/data/travel-photos.json';
import { useTravelImages } from '@/composables/useTravelImages';

const { getImageUrl } = useTravelImages();

// Calculate photo counts and representative images for each state
const stateData = computed(() => {
  return Object.entries(travelPhotos)
    .filter(([state]) => state !== 'Unknown')
    .map(([state, photos]) => {
      // Find first photo with GPS or fallback to first photo
      const photo = photos.find(p => p.hasGPS) || photos[0];
      return {
        name: state,
        count: photos.length,
        // Use resolved image URL
        thumbnail: photo ? getImageUrl(photo.path) : '',
        slug: state.toLowerCase().replace(/\s+/g, '-')
      };
    })
    .sort((a, b) => b.count - a.count); // Sort by photo count descending
});

const totalPhotos = computed(() => {
  return Object.values(travelPhotos)
    .filter((photos, index) => Object.keys(travelPhotos)[index] !== 'Unknown')
    .reduce((sum, photos) => sum + photos.length, 0);
});
</script>

<template>
  <main class="travel-container">
    <div class="hero-section">
      <h1 class="page-title">Travel Gallery</h1>
      <p class="page-subtitle">
        Exploring life through {{ totalPhotos }} photos across {{ stateData.length }} {{ stateData.length === 1 ? 'state' : 'states' }}
      </p>
    </div>

    <div class="states-grid">
      <RouterLink
        v-for="state in stateData"
        :key="state.name"
        :to="`/travel/${state.slug}`"
        class="state-card glass-panel"
      >
        <div class="state-card-image">
          <img 
            :src="state.thumbnail" 
            :alt="`${state.name} travel photos`"
            loading="lazy"
          />
          <div class="state-overlay"></div>
        </div>
        <div class="state-info">
          <h2 class="state-name">{{ state.name }}</h2>
          <p class="photo-count">{{ state.count }} {{ state.count === 1 ? 'photo' : 'photos' }}</p>
        </div>
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.travel-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 8rem);
}

.hero-section {
  text-align: center;
  margin-bottom: 4rem;
}

.page-title {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--vt-c-dark-blue) 0%, var(--vt-c-accent) 50%, #68d391 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.25rem;
  color: var(--color-text);
  opacity: 0.8;
}

.states-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.state-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  text-decoration: none;
  display: block;
  aspect-ratio: 4/3;
}

.state-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-lg);
}

.state-card-image {
  position: relative;
  width: 100%;
  height: 100%;
}

.state-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.state-card:hover .state-card-image img {
  transform: scale(1.1);
}

.state-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  transition: opacity 0.3s ease;
}

.state-card:hover .state-overlay {
  opacity: 0.9;
}

.state-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  z-index: 10;
  color: white;
}

.state-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: white;
}

.photo-count {
  font-size: 0.9rem;
  opacity: 0.9;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .travel-container {
    padding: 1rem;
  }

  .page-title {
    font-size: 2.5rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .states-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
