<script setup>
import { RouterLink } from 'vue-router'
import Hamburger from './icons/Hamburger.vue'
</script>
<template>
  <div>
    <button @click="toggleMenu" class="hamburger" aria-label="menu-dropdown" title="menu-dropdown">
      <Hamburger />
      Menu
    </button>
    <transition name="fade">

      <nav v-if="isOpen" class="menu">
        <ul>
          <RouterLink to="/" @click="toggleMenu">Home</RouterLink>
          <RouterLink to="/about" @click="toggleMenu">About</RouterLink>
          <RouterLink to="/contact" @click="toggleMenu">Contact</RouterLink>
          <RouterLink to="/portfolio" @click="toggleMenu">Portfolio</RouterLink>
        </ul>
      </nav>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isOpen: false
    };
  },
  methods: {
    toggleMenu() {
      this.isOpen = !this.isOpen;
    },
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.isOpen = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style>
.hamburger {
  position: absolute;
  /* Change to absolute to position it within the .top-bar */
  top: 10px;
  /* Adjust as needed */
  right: 10px;
  /* Adjust as needed */
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 50px;
  height: 50px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.hamburger span {
  width: 100%;
  height: 3px;
  background: black;
}

.menu {
  position: fixed;
  right: 0;
  background: #f3f7fc;
  display: flex;
  flex-direction: column;
  margin-right: 1rem;
  /* Ensures the menu items are in a column */
  margin-top: 4rem;
  border-radius: 0.2rem;

}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, display 0.5s ease;
}

.fade-enter,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */
  {
  opacity: 0;
}

.fade-enter-to {
  opacity: 1;
}


.menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
  /* border: 1px solid rgb(116, 213, 134); */
  font-size: 20px;
}

.menu li {
  padding: 10px;
}

.menu a {
  text-decoration: none;
  color: black;
  border: 1px solid #384355;
  border-radius: 0.2rem;

}


nav {
  width: fit-content;
  height: fit-content;
  display: flex;
  flex-direction: column;
  /* Ensures the links are in a column */
}

nav a.router-link-exact-active {
  color: #8fa9f7;
  font-weight: bold;
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: block;
  /* Makes each link take up the full width */
  padding: 0.5rem 1rem;
  /* Adjust padding as needed */
  /* Ensures the links are full width */
  text-align: center;
}


@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>