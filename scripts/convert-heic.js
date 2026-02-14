import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import convert from 'heic-convert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRAVEL_IMAGES_DIR = path.join(__dirname, '../src/assets/images/travel_images');
const OUTPUT_DIR = TRAVEL_IMAGES_DIR; // Convert in place

async function convertHeicFile(filePath) {
    try {
        const inputBuffer = await fs.readFile(filePath);

        const outputBuffer = await convert({
            buffer: inputBuffer,
            format: 'JPEG',
            quality: 0.9
        });

        // Replace .heic/.HEIC extension with .jpg
        const outputPath = filePath.replace(/\.(heic|HEIC)$/i, '.jpg');
        await fs.writeFile(outputPath, outputBuffer);

        console.log(`✓ Converted: ${path.basename(filePath)} -> ${path.basename(outputPath)}`);

        // Optionally delete the original HEIC file
        // await fs.unlink(filePath);

        return outputPath;
    } catch (error) {
        console.error(`✗ Failed to convert ${path.basename(filePath)}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('🔄 Converting HEIC files to JPEG...\n');

    try {
        const files = await fs.readdir(TRAVEL_IMAGES_DIR);
        const heicFiles = files.filter(f => /\.(heic|HEIC)$/i.test(f));

        if (heicFiles.length === 0) {
            console.log('No HEIC files found to convert.');
            return;
        }

        console.log(`Found ${heicFiles.length} HEIC files to convert.\n`);

        let converted = 0;
        for (const file of heicFiles) {
            const filePath = path.join(TRAVEL_IMAGES_DIR, file);
            const result = await convertHeicFile(filePath);
            if (result) converted++;
        }

        console.log(`\n✅ Conversion complete: ${converted}/${heicFiles.length} files converted successfully.`);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
