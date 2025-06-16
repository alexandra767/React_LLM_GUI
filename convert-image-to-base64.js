#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧠 Converting brain-lightning image to base64...\n');

const imagePath = process.argv[2] || path.join(__dirname, 'public', 'brain-lightning.png');

if (!fs.existsSync(imagePath)) {
  console.error(`❌ Error: Image not found at ${imagePath}`);
  console.log('\nUsage: node convert-image-to-base64.js [path-to-image]');
  console.log('Or save your image as: public/brain-lightning.png');
  process.exit(1);
}

// Read the image file
const imageBuffer = fs.readFileSync(imagePath);
const base64String = imageBuffer.toString('base64');

// Determine the MIME type
const ext = path.extname(imagePath).toLowerCase();
const mimeTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};
const mimeType = mimeTypes[ext] || 'image/png';

const dataUri = `data:${mimeType};base64,${base64String}`;

// Save to a file
const outputPath = path.join(__dirname, 'brain-lightning-base64.txt');
fs.writeFileSync(outputPath, dataUri);

console.log('✅ Conversion complete!');
console.log(`📄 Base64 string saved to: ${outputPath}`);
console.log(`📏 Data URI length: ${dataUri.length} characters`);
console.log('\nNext steps:');
console.log('1. Copy the content from brain-lightning-base64.txt');
console.log('2. Replace the placeholder in src/components/Chat/BrainLightningIcon.js');
console.log('3. Run: npm start to see the changes');