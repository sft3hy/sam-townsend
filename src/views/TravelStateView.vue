// import 'leaflet/dist/leaflet.css'; // Keep CSS if it parses fine, typically yes.
// Start of script
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import travelPhotos from '@/data/travel-photos.json';
import PhotoLightbox from '@/components/PhotoLightbox.vue';
import 'leaflet/dist/leaflet.css';
// import L from 'leaflet'; // Removed static import
import { useTravelImages } from '@/composables/useTravelImages';

import { useHead } from '@vueuse/head';

const { getImageUrl } = useTravelImages();

const route = useRoute();
const mapContainer = ref(null);
const map = ref(null);
const selectedPhoto = ref(null);
const lightboxOpen = ref(false);

// ... (computed properties skipped in replace block if I can match on context) ...
// Actually I need to be careful with replace_file_content.
// I can target the imports and onMounted separately or together.

// Let's replace the top imports first.


const { getImageUrl } = useTravelImages();

const route = useRoute();
const mapContainer = ref(null);
const map = ref(null);
const selectedPhoto = ref(null);
const lightboxOpen = ref(false);

// Get state name from route params
const stateName = computed(() => {
  const slug = route.params.state;
  return Object.keys(travelPhotos).find(
    state => state.toLowerCase().replace(/\s+/g, '-') === slug
  ) || slug; // Fallback to slug if not found
});

// Get photos for this state
const statePhotos = computed(() => {
  return stateName.value ? travelPhotos[stateName.value] || [] : [];
});

// Filter photos with GPS data for map display
const photosWithGPS = computed(() => {
  return statePhotos.value.filter(p => p.hasGPS && p.lat && p.lng);
});

// Dynamic Head Management
useHead({
  title: computed(() => `${stateName.value} Travel Gallery - Sam Townsend`),
  meta: [
    {
      name: 'description',
      content: computed(() => `Explore ${statePhotos.value.length} travel photos from ${stateName.value} by Sam Townsend.`),
    },
    {
      property: 'og:title',
      content: computed(() => `${stateName.value} Travel Gallery`),
    },
    {
      property: 'og:description',
      content: computed(() => `View ${statePhotos.value.length} photos and locations from my trip to ${stateName.value}.`),
    },
     {
      property: 'og:image',
      content: computed(() => {
        if (statePhotos.value.length > 0) {
          const firstPhoto = statePhotos.value[0];
          const imgPath = getImageUrl(firstPhoto.path);
          // Check if path is already absolute or relative to base
          if (imgPath.startsWith('http')) return imgPath;
          return `https://sft3hy.github.io${imgPath}`;
        }
        return 'https://sft3hy.github.io/sam-townsend/assets/surfingOBX.jpeg';
      }),
    },
    {
      property: 'og:url',
      content: computed(() => `https://sft3hy.github.io/sam-townsend/travel/${route.params.state}`),
    }
  ],
});

// Initialize map
onMounted(() => {
  if (photosWithGPS.value.length > 0 && mapContainer.value) {
    // Initialize the map
    map.value = L.map(mapContainer.value).setView(
      [photosWithGPS.value[0].lat, photosWithGPS.value[0].lng],
      8
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.value);

    // Create custom icon for photo markers
    const photoIcon = L.divIcon({
      className: 'custom-photo-marker',
      html: '<div class="marker-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Add markers for each photo
    const markers = [];
    photosWithGPS.value.forEach(photo => {
      const marker = L.marker([photo.lat, photo.lng], { icon: photoIcon })
        .addTo(map.value);
      
      marker.on('click', () => {
        openLightbox(photo);
      });
      
      markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.value.fitBounds(group.getBounds().pad(0.1));
    }
  }
});

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
  }
});

function openLightbox(photo) {
  selectedPhoto.value = photo;
  lightboxOpen.value = true;
}

function closeLightbox() {
  lightboxOpen.value = false;
  selectedPhoto.value = null;
}

function nextPhoto() {
  const currentIndex = statePhotos.value.findIndex(p => p.filename === selectedPhoto.value.filename);
  const nextIndex = (currentIndex + 1) % statePhotos.value.length;
  selectedPhoto.value = statePhotos.value[nextIndex];
}

function prevPhoto() {
  const currentIndex = statePhotos.value.findIndex(p => p.filename === selectedPhoto.value.filename);
  const prevIndex = (currentIndex - 1 + statePhotos.value.length) % statePhotos.value.length;
  selectedPhoto.value = statePhotos.value[prevIndex];
}
</script>

<template>
  <main class="state-view-container">
    <div class="header-section">
      <RouterLink to="/travel" class="back-button">
        ← Back to Travel
      </RouterLink>
      <h1 class="state-title">{{ stateName }}</h1>
      <p class="state-subtitle">{{ statePhotos.length }} {{ statePhotos.length === 1 ? 'photo' : 'photos' }}</p>
    </div>

    <!-- Map Section -->
    <div v-if="photosWithGPS.length > 0" class="map-section glass-panel">
      <div ref="mapContainer" class="map-container"></div>
    </div>

    <div v-else class="no-map-notice">
      <p>No location data available for these photos</p>
    </div>

    <!-- Photo Grid -->
    <div class="photos-grid">
      <div
        v-for="photo in statePhotos"
        :key="photo.filename"
        class="photo-card"
        @click="openLightbox(photo)"
      >
        <img 
          :src="getImageUrl(photo.path)" 
          :alt="photo.filename"
          loading="lazy"
        />
        <div class="photo-overlay">
          <p v-if="photo.city && photo.city !== 'Unknown'" class="photo-location">
            📍 {{ photo.city }}
          </p>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <PhotoLightbox
      v-if="lightboxOpen && selectedPhoto"
      :photo="selectedPhoto"
      @close="closeLightbox"
      @next="nextPhoto"
      @prev="prevPhoto"
    />
  </main>
</template>

<style scoped>
.state-view-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 8rem);
}

.header-section {
  margin-bottom: 2rem;
  text-align: center;
}

.back-button {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  color: var(--vt-c-accent);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  font-weight: 500;
}

.back-button:hover {
  background: rgba(143, 169, 247, 0.1);
  transform: translateX(-4px);
}

.state-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--vt-c-dark-blue) 0%, var(--vt-c-accent) 50%, #68d391 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.state-subtitle {
  font-size: 1.1rem;
  color: var(--color-text);
  opacity: 0.8;
}

.map-section {
  margin-bottom: 3rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
  padding: 1rem;
}

.map-container {
  width: 100%;
  height: 500px;
  border-radius: var(--radius-md);
}

.no-map-notice {
  text-align: center;
  padding: 2rem;
  color: var(--color-text);
  opacity: 0.6;
  margin-bottom: 3rem;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.photo-card {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--color-background-soft);
}

.photo-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-card:hover img {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-card:hover .photo-overlay {
  opacity: 1;
}

.photo-location {
  color: white;
  font-size: 0.875rem;
  margin: 0;
  font-weight: 500;
}

/* Custom marker styling */
:deep(.custom-photo-marker) {
  background: transparent;
  border: none;
}

:deep(.marker-dot) {
  width: 20px;
  height: 20px;
  background: var(--vt-c-accent);
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.marker-dot:hover) {
  transform: scale(1.3);
  background: var(--vt-c-accent-hover);
}

/* Responsive */
@media (max-width: 768px) {
  .state-view-container {
    padding: 1rem;
  }

  .state-title {
    font-size: 2rem;
  }

  .map-container {
    height: 350px;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }
}
</style>
