<script setup>
import { RouterLink } from 'vue-router'
import Hamburger from './icons/Hamburger.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isOpen = ref(false)
const menuRef = ref(null)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="nav-container" ref="menuRef">
    <button @click="toggleMenu" class="hamburger-btn" aria-label="Menu" :class="{ 'is-active': isOpen }">
      <div class="hamburger-box">
        <div class="hamburger-inner"></div>
      </div>
    </button>

    <transition name="dropdown">
      <nav v-if="isOpen" class="nav-dropdown glass-panel">
        <ul>
          <li><RouterLink to="/" @click="closeMenu">Home</RouterLink></li>
          <li><RouterLink to="/about" @click="closeMenu">About</RouterLink></li>
          <li><RouterLink to="/portfolio" @click="closeMenu">Portfolio</RouterLink></li>
          <li><RouterLink to="/travel" @click="closeMenu">Travel</RouterLink></li>
          <li><RouterLink to="/contact" @click="closeMenu">Contact</RouterLink></li>
        </ul>
      </nav>
    </transition>
  </div>
</template>

<style scoped>
.nav-container {
  position: relative;
}

.hamburger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* CSS Hamburger Animation */
.hamburger-box {
  width: 24px;
  height: 24px;
  position: relative;
}

.hamburger-inner, .hamburger-inner::before, .hamburger-inner::after {
  width: 24px;
  height: 2px;
  background-color: var(--color-heading);
  border-radius: 4px;
  position: absolute;
  transition-property: transform, opacity;
  transition-duration: 0.15s;
  transition-timing-function: ease;
}

.hamburger-inner {
  top: 50%;
  margin-top: -1px;
}

.hamburger-inner::before, .hamburger-inner::after {
  content: "";
  display: block;
}

.hamburger-inner::before {
  top: -8px;
}

.hamburger-inner::after {
  bottom: -8px;
}

/* Active State for Hamburger */
.is-active .hamburger-inner {
  transform: rotate(45deg);
}

.is-active .hamburger-inner::before {
  top: 0;
  opacity: 0;
}

.is-active .hamburger-inner::after {
  bottom: 0;
  transform: rotate(-90deg);
}

/* Dropdown Menu */
.nav-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 1rem;
  min-width: 200px;
  background: #ffffff !important;
  border: 1px solid var(--color-border);
  padding: 1rem;
  z-index: 2000;
  transform-origin: top right;
  box-shadow: var(--shadow-lg);
}

@media (prefers-color-scheme: dark) {
  .nav-dropdown {
    background: #1e1e1e !important;
    border-color: #333;
  }
}

.nav-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-dropdown li {
  margin-bottom: 0.5rem;
}

.nav-dropdown li:last-child {
  margin-bottom: 0;
}

.nav-dropdown a {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--color-text);
  font-weight: 500;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.nav-dropdown a:hover,
.nav-dropdown a.router-link-exact-active {
  background: var(--vt-c-accent);
  color: white;
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>