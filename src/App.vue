<script setup>
import { RouterView } from 'vue-router';
import HamburgerMenu from './components/HamburgerMenu.vue';
</script>

<template>

  <div id="app">
    <div class="top-bar">
      <HamburgerMenu />
    </div>
  </div>


  <RouterView />
</template>




<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.top-bar {
  width: 100%;
  height: 4.2rem;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  background-color: #f3f7fc;

  padding: 10px;
  box-shadow: 0 2px 5px rgba(255, 249, 249, 0.1);
}
</style>
