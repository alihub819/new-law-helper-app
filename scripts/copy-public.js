import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = join(__dirname, '..', 'dist', 'public');
const targetDir = join(__dirname, '..', 'server', 'public');

try {
    // Create target directory if it doesn't exist
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
        console.log('Created server/public directory');
    }

    // Copy files if source exists
    if (existsSync(sourceDir)) {
        cpSync(sourceDir, targetDir, { recursive: true });
        console.log('Copied dist/public to server/public');
    } else {
        console.log('No dist/public directory to copy');
    }
} catch (error) {
    console.error('Error copying files:', error);
    process.exit(1);
}
