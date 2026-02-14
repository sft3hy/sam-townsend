import { ref } from 'vue';

// Import all travel images eagerly
// We use a glob pattern to match all possible image extensions
const travelImages = import.meta.glob('@/assets/images/travel_images/*.{jpg,JPG,jpeg,JPEG,png,PNG,gif,GIF}', { eager: true });

export function useTravelImages() {
    const getImageUrl = (path) => {
        if (!path) return '';

        // 1. Try exact match if the input path matches the glob keys
        if (travelImages[path]) {
            return travelImages[path].default;
        }

        // 2. Try identifying by filename
        // The path usually comes from JSON as "/src/assets/images/travel_images/FILENAME.EXT"
        const filename = path.split('/').pop();

        if (!filename) return '';

        // Find a key that ends with this filename
        // We iterate through keys to find a match
        const matchingKey = Object.keys(travelImages).find(key => key.endsWith(filename));

        if (matchingKey) {
            return travelImages[matchingKey].default;
        }

        console.warn(`Image not found for path: ${path} (Filename: ${filename})`);
        return '';
    };

    return {
        getImageUrl
    };
}
