<script setup>
import { ref } from "vue";

const sites = ref([
    { name: "Website Information Extractor", url: "https://cosmic-web-gist.streamlit.app/", image: "url-parser.png", description: "Parses website contents and uses an LLM to extract relevant information." },
    { name: "Document Summarizer", url: "https://the-gist.streamlit.app/", image: "document-summarizer.png", description: "Summarizes documents using an LLM." },
    { name: "NOAA GOES-18 Satellite Imagery Change Detection", url: "https://noaa-goes18-change-detection.streamlit.app/", image: "sat-image-st.png", description: "Downloads NOAA GOES-18 satellite imagery from s3, combines multiple spectra to create full color images from today and yesterday, and calls a vision model to describe changes in the imagery." },
    { name: "Dashboard Creator", url: "https://cosmic-dashboard.streamlit.app/", image: "llm-dboard.png", description: "Users upload data files and ask for a chart from their data, and an LLM writes streamlit code to visualize their data." },
    { name: "Custom Brew", url: "https://custom-brew.streamlit.app/", image: "custom-brew.png", description: "Users can sign up for a daily newsletter and choose from several topics. An LLM then parses NewsAPI's output for that topic to choose the most relevant articles, and another LLM then summarizes each article before the email is sent to the correct users." },
    { name: "Wine Temperature Calculator", url: "https://wine-time.streamlit.app/", image: "wine-time.png", description: "Users input fridge temperature, desired wine temperature, and room temperature, and the app uses Newton's Law of Cooling to determine how long the wine should be left out to warm up to the desired temperature." }
]);

const getImage = (imageName) => {
    return new URL(`../assets/images/portfolio_screenshots/${imageName}`, import.meta.url).href;
};
</script>

<template>
    <div class="portfolio-container">
        <div class="header-section glass-panel">
            <h1>Project Portfolio</h1>
            <p class="subtitle">Here are some of the projects I've built.</p>
        </div>

        <div class="projects-grid">
            <div v-for="site in sites" :key="site.url" class="project-card glass-panel">
                <a :href="site.url" target="_blank" class="card-link">
                    <div class="image-container">
                        <img :src="getImage(site.image)" :alt="site.name" class="project-image" />
                        <div class="overlay">
                            <span class="view-btn">View Project</span>
                        </div>
                    </div>
                    <div class="card-content">
                        <h3>{{ site.name }}</h3>
                        <p>{{ site.description }}</p>
                    </div>
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped>
.portfolio-container {
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
}

.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    padding: 0 1rem;
}

.project-card {
    padding: 0; /* Remove default padding for image flush */
    overflow: hidden;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.project-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--glass-shadow), 0 10px 20px rgba(0,0,0,0.1);
}

.card-link {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: inherit;
    text-decoration: none;
}

.image-container {
    position: relative;
    width: 100%;
    height: 220px;
    overflow: hidden;
}

.project-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.project-card:hover .project-image {
    transform: scale(1.05);
}

.overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.project-card:hover .overlay {
    opacity: 1;
}

.view-btn {
    background: white;
    color: var(--vt-c-black);
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    font-weight: 600;
    transform: translateY(10px);
    transition: transform 0.3s ease;
}

.project-card:hover .view-btn {
    transform: translateY(0);
}

.card-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.card-content h3 {
    margin-bottom: 0.75rem;
    font-size: 1.25rem;
    color: var(--vt-c-accent);
}

.card-content p {
    font-size: 0.95rem;
    color: var(--color-text);
    margin-bottom: 0;
    line-height: 1.6;
}

@media (max-width: 768px) {
    .projects-grid {
        grid-template-columns: 1fr;
    }
}
</style>