#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧠⚡ Preparing Sephia app icons...\n');

// For now, we'll use the existing icon files
// In production, you would use proper icon generation tools

const publicDir = path.join(__dirname, 'public');
const iconFile = path.join(publicDir, 'brain-lightning.jpg');

if (!fs.existsSync(iconFile)) {
  console.error('❌ brain-lightning.jpg not found in public directory!');
  console.log('\nPlease ensure your brain-lightning image is saved as:');
  console.log(`  ${iconFile}`);
  process.exit(1);
}

console.log('✅ Found brain-lightning.jpg');

// Check for existing icon files
const iconFiles = ['favicon.ico', 'favicon.icns', 'favicon.png'];
iconFiles.forEach(file => {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`⚠️  ${file} missing - needs to be generated`);
  }
});

console.log('\n📦 To generate proper icons from your image:');
console.log('1. Install ImageMagick: brew install imagemagick');
console.log('2. Run: node update-app-icon.js');
console.log('\n🚀 To package the app:');
console.log('1. npm run build');
console.log('2. npm run electron:build');
console.log('\nThe packaged app will be in the dist/ directory!');