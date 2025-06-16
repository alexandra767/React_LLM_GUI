#!/usr/bin/env node

/**
 * Version Display Script for Sephia
 * Shows current version information and build details
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Read version info if it exists
const versionInfoPath = path.join(__dirname, '..', 'public', 'version.json');
let versionInfo = null;

if (fs.existsSync(versionInfoPath)) {
  versionInfo = JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
}

console.log('🚀 Sephia - AI Assistant Application');
console.log('=====================================');
console.log(`📦 Name: ${packageJson.name}`);
console.log(`🔢 Version: ${packageJson.version}`);

if (versionInfo) {
  console.log(`📅 Build Date: ${new Date(versionInfo.buildDate).toLocaleString()}`);
  console.log(`🌟 Node Version: ${versionInfo.nodeVersion}`);
  console.log(`💻 Platform: ${versionInfo.platform}`);
  console.log('');
  console.log('🎯 Features:');
  versionInfo.features.forEach(feature => {
    console.log(`   ✅ ${feature}`);
  });
  
  if (versionInfo.changelog && versionInfo.changelog[packageJson.version]) {
    console.log('');
    console.log(`📝 Changelog for v${packageJson.version}:`);
    versionInfo.changelog[packageJson.version].forEach(change => {
      console.log(`   • ${change}`);
    });
  }
} else {
  console.log('⚠️  Version info not generated yet. Run `npm run version:update` to generate.');
}

console.log('');
console.log('🛠️  Available version commands:');
console.log('   npm run version:patch  - Increment patch version (1.0.0 → 1.0.1)');
console.log('   npm run version:minor  - Increment minor version (1.0.0 → 1.1.0)');
console.log('   npm run version:major  - Increment major version (1.0.0 → 2.0.0)');
console.log('   npm run version:update - Update version files without changing version');
console.log('   npm run version:display- Show this information');
console.log('   npm run changelog     - Generate changelog');