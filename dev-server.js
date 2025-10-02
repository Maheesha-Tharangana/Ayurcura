// dev-server.js - Script to start development server and open browser
import { spawn } from 'child_process';
import open from 'open';
import fs from 'fs';
import path from 'path';

// Server port
const PORT = 5000;
const URL = `http://localhost:${PORT}`;

console.log('Starting development server...');

// Function to check if server is ready by testing port
async function isServerReady() {
  try {
    const response = await fetch(URL);
    return response.status >= 200 && response.status < 500;
  } catch (error) {
    return false;
  }
}

// Function to preload common routes to warm up the caches
async function preloadCommonRoutes() {
  const commonRoutes = ['/', '/doctors', '/treatments', '/articles'];
  
  console.log('Preloading common routes to warm cache...');
  for (const route of commonRoutes) {
    try {
      await fetch(`${URL}${route}`);
      console.log(`Preloaded: ${route}`);
    } catch (error) {
      console.error(`Failed to preload ${route}:`, error);
    }
  }
}

// Determine the correct command and arguments for Windows vs other platforms
const isWindows = process.platform === 'win32';
const command = isWindows ? 'cmd' : 'tsx';
const args = isWindows 
  ? ['/c', 'set', '"NODE_ENV=development"', '&&', 'tsx', 'server/index.ts'] 
  : ['server/index.ts'];

// Set environment variables to optimize development performance
const env = {
  ...process.env,
  NODE_ENV: 'development',
  // Optimize startup performance
  NODE_OPTIONS: '--max-old-space-size=4096'
};

// Start the development server
const devProcess = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  env
});

// Set a flag to track if browser has been opened
let browserOpened = false;

// Wait for server to be ready before opening browser
const maxRetries = 10;
let retries = 0;

const checkInterval = setInterval(async () => {
  if (browserOpened) {
    clearInterval(checkInterval);
    return;
  }
  
  const ready = await isServerReady();
  
  if (ready) {
    clearInterval(checkInterval);
    browserOpened = true;
    console.log(`Server is ready. Opening browser at ${URL}`);
    
    // Preload common routes and then open browser
    await preloadCommonRoutes();
    
    open(URL).catch(err => {
      console.error('Failed to open browser:', err);
    });
  } else {
    retries++;
    console.log(`Waiting for server to be ready... (${retries}/${maxRetries})`);
    
    if (retries >= maxRetries) {
      clearInterval(checkInterval);
      console.log('Server took too long to start. Opening browser anyway...');
      browserOpened = true;
      open(URL).catch(err => {
        console.error('Failed to open browser:', err);
      });
    }
  }
}, 1000);

// Handle the dev process exit
devProcess.on('close', (code) => {
  clearInterval(checkInterval);
  console.log(`Development server exited with code ${code}`);
  process.exit(code);
});

// Forward termination signals to the child process
process.on('SIGINT', () => {
  clearInterval(checkInterval);
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  clearInterval(checkInterval);
  devProcess.kill('SIGTERM');
}); 