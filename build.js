#!/usr/bin/env node

// Build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Vercel build process...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Build the frontend
  console.log('🏗️  Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Copy shared files to api directory for serverless function access
  console.log('📂 Copying shared files...');
  const sharedDir = './shared';
  const apiSharedDir = './api/shared';
  
  if (fs.existsSync(sharedDir) && !fs.existsSync(apiSharedDir)) {
    fs.mkdirSync(path.dirname(apiSharedDir), { recursive: true });
    fs.cpSync(sharedDir, apiSharedDir, { recursive: true });
    console.log('✅ Shared files copied to api directory');
  }
  
  // Copy server files needed by API
  console.log('📁 Copying server files...');
  const serverFiles = ['storage.js', 'auth.js', 'db.js'];
  const serverDir = './server';
  const apiServerDir = './api/server';
  
  if (!fs.existsSync(apiServerDir)) {
    fs.mkdirSync(apiServerDir, { recursive: true });
  }
  
  serverFiles.forEach(file => {
    const srcPath = path.join(serverDir, file.replace('.js', '.ts'));
    const destPath = path.join(apiServerDir, file);
    
    if (fs.existsSync(srcPath)) {
      // For now, we'll need to manually transpile or copy the TS files
      console.log(`⚠️  ${file} needs to be transpiled from TypeScript`);
    }
  });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}