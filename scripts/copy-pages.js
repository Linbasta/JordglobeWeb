import fs from 'fs/promises';
import path from 'path';

const PAGES_DIR = 'src/pages';
const LANGUAGES = ['sv']; // Add more languages as needed

async function copyPages() {
    try {
        // Get all .astro files from the root pages directory
        const files = await fs.readdir(PAGES_DIR);
        const astroFiles = files.filter(file => file.endsWith('.astro'));

        for (const lang of LANGUAGES) {
            const langDir = path.join(PAGES_DIR, lang);

            // Create language directory if it doesn't exist
            try {
                await fs.access(langDir);
            } catch {
                await fs.mkdir(langDir, { recursive: true });
                console.log(`Created directory: ${langDir}`);
            }

            // Copy each .astro file
            for (const file of astroFiles) {
                const sourcePath = path.join(PAGES_DIR, file);
                const targetPath = path.join(langDir, file);

                await fs.copyFile(sourcePath, targetPath);
                console.log(`Copied: ${targetPath}`);
            }
        }

        console.log('Page copying complete!');
    } catch (error) {
        console.error('Error copying pages:', error);
        process.exit(1); // Exit with error code if something goes wrong
    }
}

copyPages();