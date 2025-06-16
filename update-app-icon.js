#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🧠 Updating Sephia app icon...\n');

// Paths
const publicDir = path.join(__dirname, 'public');
const sourceImage = path.join(publicDir, 'brain-lightning.png');

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error('❌ Error: brain-lightning.png not found in public directory!');
  console.log('\nPlease save the brain with lightning image as:');
  console.log(`  ${sourceImage}`);
  console.log('\nThen run this script again.');
  process.exit(1);
}

async function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  // Check for ImageMagick
  try {
    await execPromise('which convert');
    console.log('✅ ImageMagick found');
  } catch (error) {
    console.log('❌ ImageMagick not found');
    console.log('\nTo install ImageMagick on macOS:');
    console.log('  brew install imagemagick');
    console.log('\nAfter installation, run this script again.');
    process.exit(1);
  }
}

async function generateIcons() {
  console.log('\n🎨 Generating icon files...');
  
  try {
    // Generate different sizes for various platforms
    const sizes = [16, 32, 64, 128, 256, 512, 1024];
    
    // Create temporary directory for icon sizes
    const tempDir = path.join(__dirname, 'temp-icons');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate PNG files of different sizes
    for (const size of sizes) {
      const outputFile = path.join(tempDir, `icon_${size}x${size}.png`);
      console.log(`  Creating ${size}x${size} icon...`);
      await execPromise(`magick "${sourceImage}" -resize ${size}x${size} "${outputFile}"`);
    }
    
    // Generate favicon.ico (multi-resolution)
    console.log('\n  Creating favicon.ico...');
    const icoSizes = [16, 32, 64];
    const icoFiles = icoSizes.map(size => path.join(tempDir, `icon_${size}x${size}.png`)).join(' ');
    await execPromise(`magick ${icoFiles} "${path.join(publicDir, 'favicon.ico')}"`);
    
    // Generate favicon.png (for Linux)
    console.log('  Creating favicon.png...');
    await execPromise(`cp "${path.join(tempDir, 'icon_256x256.png')}" "${path.join(publicDir, 'favicon.png')}"`);
    
    // Generate favicon.icns (for macOS)
    console.log('  Creating favicon.icns...');
    const icnsDir = path.join(tempDir, 'favicon.iconset');
    if (!fs.existsSync(icnsDir)) {
      fs.mkdirSync(icnsDir, { recursive: true });
    }
    
    // Create iconset directory with proper naming
    const icnsSizes = [
      { size: 16, name: 'icon_16x16.png' },
      { size: 32, name: 'icon_16x16@2x.png' },
      { size: 32, name: 'icon_32x32.png' },
      { size: 64, name: 'icon_32x32@2x.png' },
      { size: 128, name: 'icon_128x128.png' },
      { size: 256, name: 'icon_128x128@2x.png' },
      { size: 256, name: 'icon_256x256.png' },
      { size: 512, name: 'icon_256x256@2x.png' },
      { size: 512, name: 'icon_512x512.png' },
      { size: 1024, name: 'icon_512x512@2x.png' }
    ];
    
    for (const { size, name } of icnsSizes) {
      await execPromise(`cp "${path.join(tempDir, `icon_${size}x${size}.png`)}" "${path.join(icnsDir, name)}"`);
    }
    
    // Convert iconset to icns
    await execPromise(`iconutil -c icns "${icnsDir}" -o "${path.join(publicDir, 'favicon.icns')}"`);
    
    // Copy to other locations
    console.log('\n  Updating other icon references...');
    await execPromise(`cp "${sourceImage}" "${path.join(publicDir, 'logo192.png')}"`);
    await execPromise(`cp "${sourceImage}" "${path.join(publicDir, 'logo512.png')}"`);
    
    // Clean up temp directory
    console.log('\n🧹 Cleaning up temporary files...');
    await execPromise(`rm -rf "${tempDir}"`);
    
    console.log('\n✅ Icon generation complete!');
    
  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

async function updateManifest() {
  console.log('\n📝 Updating manifest.json...');
  
  const manifestPath = path.join(publicDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Update icon references
    manifest.icons = [
      {
        "src": "favicon.ico",
        "sizes": "64x64 32x32 24x24 16x16",
        "type": "image/x-icon"
      },
      {
        "src": "logo192.png",
        "type": "image/png",
        "sizes": "192x192"
      },
      {
        "src": "logo512.png",
        "type": "image/png",
        "sizes": "512x512"
      }
    ];
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ manifest.json updated');
  }
}

async function main() {
  console.log('This script will update all app icons to use the brain-lightning.png image.\n');
  
  await checkDependencies();
  await generateIcons();
  await updateManifest();
  
  console.log('\n🎉 All done! Your app icons have been updated.');
  console.log('\nNext steps:');
  console.log('1. Rebuild the app: npm run build');
  console.log('2. For Electron app: npm run electron-pack');
  console.log('\nThe new brain with lightning icon will be used throughout the app! ⚡🧠');
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});