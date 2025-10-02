// A script to set up the local development environment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Setting up local development environment...');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir);
}

// Check for .env.local file
const envLocal = path.join(__dirname, '.env.local');
const envExample = path.join(__dirname, '.env.local.example');
if (!fs.existsSync(envLocal) && fs.existsSync(envExample)) {
  console.log('Creating .env.local from example...');
  fs.copyFileSync(envExample, envLocal);
}

// Success message
console.log('\n===================================');
console.log('Local setup complete!');
console.log('===================================');
console.log('Next steps:');
console.log('1. Edit .env.local if needed');
console.log('2. Run: npm run dev');
console.log('===================================\n');