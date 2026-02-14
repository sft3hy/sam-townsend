<script setup>
import ContactInfo from '../components/ContactIcons.vue';
</script>

<template>
  <div class="contact-view">
    <ContactInfo />
  </div>
</template>

<style scoped>
.contact-view {
  width: 100%;
  animation: fade-in 0.5s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>