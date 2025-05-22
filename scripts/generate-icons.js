const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create a simple favicon.ico if it doesn't exist
const faviconPath = path.join(publicDir, 'favicon.ico');
if (!fs.existsSync(faviconPath)) {
  // This is a minimal 16x16 transparent PNG in base64
  const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABhSURBVDiRY/j//z8DNQETAxUxQxMDA8N/BoZ9DAwM/6lpgJGBgeE/AwPDf2oawMDAwMBITQMYGBgYGFZQ2QAGBgYGhhUwB6j8Z2BgYGD4T0UDGBgYGFb8Z2BgYGD4T1UDGBgYGP4zMDAwMDCsoLoBDAwMDAwMDAwM/6luAAMDw38GBob/VDcAAMVdH2bD4gD4AAAAAElFTkSuQmCC';
  fs.writeFileSync(faviconPath, minimalPng, 'base64');
  console.log('Created favicon.ico');
}

// Create favicon.icns for macOS
const icnsPath = path.join(publicDir, 'favicon.icns');
if (!fs.existsSync(icnsPath)) {
  // Just copy the .ico file as .icns for now
  fs.copyFileSync(faviconPath, icnsPath);
  console.log('Created favicon.icns');
}

// Create favicon.png for Linux
const pngPath = path.join(publicDir, 'favicon.png');
if (!fs.existsSync(pngPath)) {
  // Just copy the .ico file as .png for now
  fs.copyFileSync(faviconPath, pngPath);
  console.log('Created favicon.png');
}

console.log('Icon generation complete');
