<script setup>
import Instagram from './icons/Instagram.vue'
import Gmail from './icons/Gmail.vue'
import LinkedIn from './icons/LinkedIn.vue'
import GitHub from './icons/GitHub.vue'

const contacts = [
  { 
    name: 'Email', 
    value: 'smaueltown@gmail.com',
    link: 'mailto:smaueltown@gmail.com',
    icon: Gmail,
    color: '#EA4335'
  },
  { 
    name: 'LinkedIn', 
    value: 'samuel-townsend1',
    link: 'https://linkedin.com/in/samuel-townsend1',
    icon: LinkedIn,
    color: '#0A66C2'
  },
  { 
    name: 'GitHub', 
    value: 'sft3hy',
    link: 'https://github.com/sft3hy',
    icon: GitHub,
    color: '#181717'
  },
  { 
    name: 'Instagram', 
    value: '@sam_townsend_',
    link: 'https://www.instagram.com/sam_townsend_',
    icon: Instagram,
    color: '#E4405F'
  }
]
</script>

<template>
  <div class="contact-container">
    <div class="header-section glass-panel">
      <h1>Get in Touch</h1>
      <p class="subtitle">I'm always open to discussing new projects, creative ideas or opportunities to collaborate.</p>
    </div>

    <div class="contact-grid">
      <a v-for="contact in contacts" 
         :key="contact.name" 
         :href="contact.link" 
         target="_blank" 
         rel="noopener"
         class="contact-card glass-panel"
      >
        <div class="icon-wrapper" :style="{ color: contact.color }">
          <component :is="contact.icon" class="contact-icon" />
        </div>
        <div class="card-content">
          <h3>{{ contact.name }}</h3>
          <p>{{ contact.value }}</p>
        </div>
        <div class="card-arrow">→</div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.contact-container {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

.header-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 3rem 2rem;
}

.subtitle {
  margin-bottom: 0;
  color: var(--vt-c-text-light-2);
  margin-top: 1rem;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 0 1rem;
}

.contact-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 1px solid var(--glass-border);
}

.contact-card:hover {
  transform: translateY(-5px) translateX(5px);
  background: white;
  border-color: var(--vt-c-accent);
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-background-soft);
  margin-right: 1.5rem;
  transition: transform 0.3s ease;
}

.contact-card:hover .icon-wrapper {
  transform: scale(1.1);
}

.contact-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: var(--color-heading);
}

.card-content p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vt-c-text-light-2);
}

.card-arrow {
  font-size: 1.5rem;
  color: var(--vt-c-accent);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.contact-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 600px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>