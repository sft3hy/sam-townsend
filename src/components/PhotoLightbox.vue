<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useTravelImages } from '@/composables/useTravelImages';

const { getImageUrl } = useTravelImages();

const props = defineProps({
  photo: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'next', 'prev']);

// Handle keyboard navigation
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    emit('close');
  } else if (e.key === 'ArrowRight') {
    emit('next');
  } else if (e.key === 'ArrowLeft') {
    emit('prev');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = ''; // Restore scrolling
});

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<template>
  <div class="lightbox-overlay" @click.self="emit('close')">
    <div class="lightbox-container glass-panel">
      <!-- Close button -->
      <button class="close-button" @click="emit('close')" aria-label="Close">
        ✕
      </button>

      <!-- Navigation buttons -->
      <button class="nav-button nav-prev" @click="emit('prev')" aria-label="Previous photo">
        ‹
      </button>
      <button class="nav-button nav-next" @click="emit('next')" aria-label="Next photo">
        ›
      </button>

      <!-- Image -->
      <div class="image-container">
        <img :src="getImageUrl(photo.path)" :alt="photo.filename" />
      </div>

      <!-- Photo metadata -->
      <div class="photo-metadata">
        <div class="metadata-row" v-if="photo.city && photo.city !== 'Unknown'">
          <span class="metadata-icon">📍</span>
          <span>{{ photo.city }}, {{ photo.state }}</span>
        </div>
        <div class="metadata-row" v-if="photo.date">
          <span class="metadata-icon">📅</span>
          <span>{{ formatDate(photo.date) }}</span>
        </div>
        <div class="metadata-row" v-if="photo.camera">
          <span class="metadata-icon">📷</span>
          <span>{{ photo.camera }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.lightbox-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(20px);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 2rem;
  font-weight: 300;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav-prev {
  left: 1rem;
}

.nav-next {
  right: 1rem;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 1rem;
}

.image-container img {
  max-width: 100%;
  max-height: calc(90vh - 200px);
  object-fit: contain;
  border-radius: var(--radius-md);
}

.photo-metadata {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
}

.metadata-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 0.9rem;
}

.metadata-icon {
  font-size: 1.1rem;
}

/* Touch/swipe support indicator for mobile */
@media (max-width: 768px) {
  .lightbox-overlay {
    padding: 1rem;
  }

  .lightbox-container {
    max-width: 95vw;
    max-height: 95vh;
    padding: 1rem;
  }

  .image-container img {
    max-height: calc(90vh - 150px);
  }

  .nav-button {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }

  .nav-prev {
    left: 0.5rem;
  }

  .nav-next {
    right: 0.5rem;
  }

  .photo-metadata {
    gap: 1rem;
    font-size: 0.8rem;
  }
}
</style>
