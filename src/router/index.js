import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/HomeView.vue';
import About from '../views/AboutView.vue';
import Contact from '../views/ContactView.vue';
import Portfolio from '../views/PortfolioView.vue'

const metaOgTitleHome = 'Sam Townsend - Home';
const metaDescriptionHome = "Sam is a software engineer working part time for Arcfield and getting his Master's in Data Science at UC Irvine. He graduated from UVA in 2022 and enjoys surfing, climbing, and playing video games with his friends.";

const metaOgTitleAbout = 'Sam Townsend - About';
const metaDescriptionAbout = "Sam Townsend's biographical information. Pictures on this page include travelling and surfing.";
const metaOgDescriptionAbout = "Sam Townsend's biographical information";

const metaOgTitleContact = 'Sam Townsend - Contact';
const metaDescriptionContact = "Get in touch with Sam Townsend - GitHub, Email address, LinkedIn, and Instagram.";
const metaOgDescriptionContact = "Sam Townsend's contact information";

const metaOgTitlePortfolio = 'Sam Townsend - Portfolio';
const metaDescriptionPortfolio = "Sam Townsend's portfolio.";
const metaOgDescriptionPortfolio = "Sam Townsend portfolio";

const ogUrlHome = 'https://sam-townsend.netlify.app/'
const ogUrlAbout = 'https://sam-townsend.netlify.app/about'
const ogUrlContact = 'https://sam-townsend.netlify.app/contact'
const ogUrlPortfolio = 'https://sam-townsend.netlify.app/portfolio'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: metaOgTitleHome,
      description: metaDescriptionHome,
      ogDescription: metaDescriptionHome,
      ogUrl: ogUrlHome,
      canonical: ogUrlHome,
    }

  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      title: metaOgTitleAbout,
      description: metaDescriptionAbout,
      ogDescription: metaOgDescriptionAbout,
      ogUrl: ogUrlAbout,
      canonical: ogUrlAbout,
    }

  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact,
    meta: {
      title: metaOgTitleContact,
      description: metaDescriptionContact,
      ogDescription: metaOgDescriptionContact,
      ogUrl: ogUrlContact,
      canonical: ogUrlContact,
    }

  },
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: Portfolio,
    meta: {
      title: metaOgTitlePortfolio,
      description: metaDescriptionPortfolio,
      ogDescription: metaOgDescriptionPortfolio,
      ogUrl: ogUrlPortfolio,
      canonical: ogUrlPortfolio,
    }
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes

});

export default router;