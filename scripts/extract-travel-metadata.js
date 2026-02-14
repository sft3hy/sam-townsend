import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExifParser from 'exif-parser';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRAVEL_IMAGES_DIR = path.join(__dirname, '../src/assets/images/travel_images');
const OUTPUT_FILE = path.join(__dirname, '../src/data/travel-photos.json');

// Cache for reverse geocoding to avoid repeated API calls
const geocodeCache = new Map();

// Delay between API calls to respect rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function reverseGeocode(lat, lng) {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    if (geocodeCache.has(key)) {
        return geocodeCache.get(key);
    }

    try {
        // Using Nominatim (OpenStreetMap) for reverse geocoding
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat,
                lon: lng,
                format: 'json',
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'PersonalWebsiteTravelGallery/1.0'
            }
        });

        const address = response.data.address || {};
        const result = {
            city: address.city || address.town || address.village || 'Unknown',
            state: address.state || 'Unknown',
            country: address.country || 'Unknown'
        };

        geocodeCache.set(key, result);
        await delay(1000); // Rate limit: 1 request per second

        return result;
    } catch (error) {
        console.error(`Geocoding failed for ${lat}, ${lng}:`, error.message);
        return { city: 'Unknown', state: 'Unknown', country: 'Unknown' };
    }
}

async function extractExifData(filePath) {
    try {
        const buffer = await fs.readFile(filePath);
        const parser = ExifParser.create(buffer);
        const result = parser.parse();

        const data = {
            filename: path.basename(filePath),
            path: `/src/assets/images/travel_images/${path.basename(filePath)}`,
            hasGPS: false,
            lat: null,
            lng: null,
            city: null,
            state: null,
            country: null,
            date: null,
            camera: null
        };

        // Extract GPS coordinates
        if (result.tags && result.tags.GPSLatitude && result.tags.GPSLongitude) {
            data.hasGPS = true;
            data.lat = result.tags.GPSLatitude;
            data.lng = result.tags.GPSLongitude;
        }

        // Extract date
        if (result.tags && result.tags.DateTimeOriginal) {
            data.date = new Date(result.tags.DateTimeOriginal * 1000).toISOString();
        } else if (result.tags && result.tags.CreateDate) {
            data.date = new Date(result.tags.CreateDate * 1000).toISOString();
        }

        // Extract camera info
        if (result.tags) {
            const make = result.tags.Make || '';
            const model = result.tags.Model || '';
            if (make || model) {
                data.camera = `${make} ${model}`.trim();
            }
        }

        return data;
    } catch (error) {
        console.error(`Failed to extract EXIF from ${path.basename(filePath)}:`, error.message);
        return {
            filename: path.basename(filePath),
            path: `/src/assets/images/travel_images/${path.basename(filePath)}`,
            hasGPS: false,
            lat: null,
            lng: null,
            city: null,
            state: null,
            country: null,
            date: null,
            camera: null
        };
    }
}

async function main() {
    console.log('📍 Extracting travel photo metadata...\n');

    try {
        const files = await fs.readdir(TRAVEL_IMAGES_DIR);

        // Filter for supported image formats (JPG, JPEG, PNG, GIF)
        // HEIC should have been converted by now
        const imageFiles = files.filter(f =>
            /\.(jpg|jpeg|png|gif)$/i.test(f) && !f.startsWith('.')
        );

        console.log(`Found ${imageFiles.length} image files to process.\n`);

        const photos = [];
        let processedCount = 0;
        let gpsCount = 0;

        for (const file of imageFiles) {
            const filePath = path.join(TRAVEL_IMAGES_DIR, file);
            const photoData = await extractExifData(filePath);

            // Get location data if GPS coordinates are available
            if (photoData.hasGPS) {
                const location = await reverseGeocode(photoData.lat, photoData.lng);
                photoData.city = location.city;
                photoData.state = location.state;
                photoData.country = location.country;
                gpsCount++;
                console.log(`✓ ${file}: ${location.city}, ${location.state}`);
            } else {
                console.log(`○ ${file}: No GPS data`);
            }

            photos.push(photoData);
            processedCount++;

            if (processedCount % 10 === 0) {
                console.log(`Progress: ${processedCount}/${imageFiles.length} files processed...\n`);
            }
        }

        // Group photos by state
        const photosByState = {};
        photos.forEach(photo => {
            if (photo.state && photo.state !== 'Unknown') {
                if (!photosByState[photo.state]) {
                    photosByState[photo.state] = [];
                }
                photosByState[photo.state].push(photo);
            } else {
                // Put photos without location in "Unknown" category
                if (!photosByState['Unknown']) {
                    photosByState['Unknown'] = [];
                }
                photosByState['Unknown'].push(photo);
            }
        });

        // Sort photos within each state by date
        Object.keys(photosByState).forEach(state => {
            photosByState[state].sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(a.date) - new Date(b.date);
            });
        });

        // Write to JSON file
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(photosByState, null, 2));

        console.log('\n✅ Metadata extraction complete!');
        console.log(`   Total photos: ${photos.length}`);
        console.log(`   With GPS data: ${gpsCount}`);
        console.log(`   States found: ${Object.keys(photosByState).filter(s => s !== 'Unknown').length}`);
        console.log(`\n   Output: ${OUTPUT_FILE}`);

        // Print summary by state
        console.log('\n📊 Photos by state:');
        Object.entries(photosByState)
            .sort((a, b) => b[1].length - a[1].length)
            .forEach(([state, photos]) => {
                console.log(`   ${state}: ${photos.length} photos`);
            });

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
