import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/HomeView.vue';
import About from '../views/AboutView.vue';
import Contact from '../views/ContactView.vue';
import Portfolio from '../views/PortfolioView.vue'

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

const ogUrlHome = 'https://sft3hy.github.io/sam-townsend/'
const ogUrlAbout = 'https://sft3hy.github.io/sam-townsend/about/'
const ogUrlContact = 'https://sft3hy.github.io/sam-townsend/contact/'
const ogUrlPortfolio = 'https://sft3hy.github.io/sam-townsend/portfolio/'

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
    path: '/about/',
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
    path: '/contact/',
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
    path: '/portfolio/',
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
  history: createWebHistory(import.meta.env.BASE_URL),
  routes

});

export default router;