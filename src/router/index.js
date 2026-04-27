import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/HomeView.vue';
import About from '../views/AboutView.vue';
import Contact from '../views/ContactView.vue';
import Portfolio from '../views/PortfolioView.vue';
import Travel from '../views/TravelView.vue';
import TravelState from '../views/TravelStateView.vue';
import homeImg from '@/assets/images/home_picture/Climbing.jpeg';
import aboutImg from '@/assets/images/about_pictures/backpackingCamino.jpeg';
import contactImg from '@/assets/images/about_pictures/friends.jpeg';
import portfolioImg from '@/assets/images/about_pictures/SenecaBase.jpeg';
import travelImg from '@/assets/images/about_pictures/surfingMaui.jpeg';

const metaOgTitleHome = 'Sam Townsend - Software Engineer & Data Scientist';
const metaDescriptionHome = "Sam Townsend is a Software Engineer and Data Science Master's student at UC Irvine. Expert in full-stack development, Python, and cloud technologies. View his portfolio and projects.";

const metaOgTitleAbout = 'About Sam Townsend - Software Engineer';
const metaDescriptionAbout = "Learn about Sam Townsend, a software engineer with a passion for surfing, climbing, and technology. Discover his background, education, and interests.";
const metaOgDescriptionAbout = "Biography of Sam Townsend, Software Engineer and Data Science student.";

const metaOgTitleContact = 'Contact Sam Townsend';
const metaDescriptionContact = "Connect with Sam Townsend. Reach out via Email, LinkedIn, GitHub, or Instagram for collaboration or inquiries.";
const metaOgDescriptionContact = "Contact information for Sam Townsend.";

const metaOgTitlePortfolio = 'Sam Townsend - Portfolio & Projects';
const metaDescriptionPortfolio = "Explore Sam Townsend's software engineering portfolio. Featuring projects in web development, data science, and more.";
const metaOgDescriptionPortfolio = "Sam Townsend's project portfolio.";

const metaOgTitleTravel = 'Travel Gallery - Sam Townsend';
const metaDescriptionTravel = "Browse Sam Townsend's travel photography from adventures across different states. View photos on interactive maps.";
const metaOgDescriptionTravel = "Sam Townsend's travel photo gallery.";

const ogUrlHome = 'https://sft3hy.github.io/sam-townsend/'
const ogUrlAbout = 'https://sft3hy.github.io/sam-townsend/about'
const ogUrlContact = 'https://sft3hy.github.io/sam-townsend/contact'
const ogUrlPortfolio = 'https://sft3hy.github.io/sam-townsend/portfolio'
const ogUrlTravel = 'https://sft3hy.github.io/sam-townsend/travel'

export const routes = [
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
      ogImage: homeImg,
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
      ogImage: aboutImg,
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
      ogImage: contactImg,
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
      ogImage: portfolioImg,
    }
  },
  {
    path: '/travel',
    name: 'Travel',
    component: Travel,
    meta: {
      title: metaOgTitleTravel,
      description: metaDescriptionTravel,
      ogDescription: metaOgDescriptionTravel,
      ogUrl: ogUrlTravel,
      canonical: ogUrlTravel,
      ogImage: travelImg,
    }
  },
  {
    path: '/travel/:state',
    name: 'TravelState',
    component: TravelState,
    meta: {
      title: metaOgTitleTravel,
      description: metaDescriptionTravel,
      ogDescription: metaOgDescriptionTravel,
      ogUrl: ogUrlTravel,
      canonical: ogUrlTravel,
      ogImage: travelImg, // Fallback, will be overridden by component
    }
  }
]

export default routes;