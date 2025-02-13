<style scoped>
.grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 50rem;
    margin-bottom: 10rem;
}

.grid>div {
    padding: 24px;
}

.card {
    max-width: 20rem;
    /* margin-top: 1rem;
    margin-left: 1rem; */
    margin: 10px;
    max-height: 30rem;
    border-radius: 8px;
    border: 1px solid #ffffff;
    /* Add a white border */
    background-color: transparent;
    /* Set the background color to white */
    padding: 20px;
    /* Add some padding inside the card */
}
</style>

<template>
    <div class="topic-container">
        <h1>Project Portfolio</h1>
        <p class="about-text">Thanks for stopping by! Here are some of my projects.</p>
    </div>

    <div class="grid mt-4">
        <div v-for="site in sites" :key="site.url" class="card shadow-md rounded-lg bg-white relative overflow-hidden">
            <a :href="site.url" target="_blank" class="absolute top-0 left-0 right-0 bottom-0">

                <p class="about-text">{{ site.name }}</p>
                <img v-bind:src="getImage(site.image)" alt="Site Logo" class="responsive-preview" />
                <p>{{ site.description }}</p>
            </a>

        </div>
    </div>
</template>

<style>
/* Responsive Image Preview */
.responsive-preview {
    width: 100%;
    height: auto;
    max-height: 200px;
    /* Set a maximum height for the images */
    object-fit: cover;
    border-radius: 0.375rem;
    /* Matches rounded-md */
}

@media (min-width: 1024px) {

    /* Tablets */
    .responsive-preview {
        max-width: 30rem;
        max-height: 60rem;
    }
}

/* Adjust for smaller screens */
@media (max-width: 1024px) {

    /* Tablets */
    .responsive-preview {
        max-width: 30rem;
        max-height: 60rem;
    }
}

@media (max-width: 768px) {

    /* Mobile */
    .responsive-preview {
        max-width: 30rem;
        max-height: 60rem;
    }
}

@media (max-width: 480px) {

    /* Small Mobile */
    .responsive-preview {
        max-width: 100%;
        max-height: 100%;
    }
}
</style>


<script setup>
import { ref } from "vue";

const sites = ref([
    { name: "Website Information Extractor", url: "https://cosmic-web-gist.streamlit.app/", image: "url-parser.png", description: "Parses website contents and uses an llm to extract relevant information." },
    { name: "Document Summarizer", url: "https://the-gist.streamlit.app/", image: "document-summarizer.png", description: "Summarizes documents using an llm." },
    { name: "NOAA GOES-18 Satellite Imagery Change Detection", url: "https://noaa-goes18-change-detection.streamlit.app/", image: "sat-image-st.png", description: "Downloads NOAA GOES-18 satellite imagery from s3, combines multiple spectra to create full color images from today and yesterday, and calls a vision model to describe changes in the imagery." },
    { name: "Dashboard Creator", url: "https://cosmic-dashboard.streamlit.app/", image: "llm-dboard.png", description: "Users upload data files and ask for a chart from their data, and an llm writes streamlit code to visualize their data." }
]);

const getImage = (imageName) => {
    return new URL(`../assets/images/portfolio_screenshots/${imageName}`, import.meta.url).href;
};
</script>

<style scoped>
.card {
    transition: transform 0.2s ease-in-out;
}

.card:hover {
    transform: scale(1.05);
}
</style>