#!/usr/bin/env node

/**
 * Version Management Script for Sephia
 * Updates version information across the application
 */

const fs = require('fs');
const path = require('path');

// Read current package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

console.log(`🔄 Updating application to version ${version}...`);

// Create version info file for the app
const versionInfo = {
  version: version,
  name: packageJson.name,
  buildDate: new Date().toISOString(),
  gitBranch: process.env.GIT_BRANCH || 'unknown',
  gitCommit: process.env.GIT_COMMIT || 'unknown',
  nodeVersion: process.version,
  platform: process.platform,
  features: [
    'Bark TTS Voice Synthesis',
    'Real-time Chat Interface', 
    'Google Calendar Integration',
    'Apple Calendar Integration',
    'Google Drive Integration',
    'Image Generation (ComfyUI)',
    'Voice Recognition',
    'External Memory System',
    'Terminal Integration',
    'Ollama Local LLM Support'
  ],
  changelog: {
    '1.0.0': [
      'Initial stable release',
      'Comprehensive voice synthesis fixes',
      'Memory optimization and leak prevention',
      'Process cleanup system implementation',
      'Audio management improvements',
      'AI response accuracy enhancements'
    ]
  }
};

// Write version info to public directory (accessible to app)
const versionInfoPath = path.join(__dirname, '..', 'public', 'version.json');
fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));

// Write version info to src directory (for development)
const srcVersionPath = path.join(__dirname, '..', 'src', 'version.js');
const versionJsContent = `// Auto-generated version file
// Updated on: ${new Date().toISOString()}

export const VERSION_INFO = ${JSON.stringify(versionInfo, null, 2)};

export const getVersion = () => VERSION_INFO.version;
export const getBuildDate = () => VERSION_INFO.buildDate;
export const getFeatures = () => VERSION_INFO.features;
export const getChangelog = () => VERSION_INFO.changelog;

export default VERSION_INFO;
`;

fs.writeFileSync(srcVersionPath, versionJsContent);

// Update Electron main.js with version info
const electronMainPath = path.join(__dirname, '..', 'electron', 'main.js');
if (fs.existsSync(electronMainPath)) {
  let electronMain = fs.readFileSync(electronMainPath, 'utf8');
  
  // Add version logging if not already present
  if (!electronMain.includes('// Version Info')) {
    const versionCode = `
// Version Info
const VERSION = '${version}';
console.log(\`[Main] Sephia v\${VERSION} starting...\`);
console.log(\`[Main] Build date: ${versionInfo.buildDate}\`);
console.log(\`[Main] Platform: \${process.platform} \${process.arch}\`);
`;
    
    // Insert after the initial imports
    const insertPoint = electronMain.indexOf('const isDev = require(\'electron-is-dev\');');
    if (insertPoint !== -1) {
      const nextLine = electronMain.indexOf('\n', insertPoint) + 1;
      electronMain = electronMain.slice(0, nextLine) + versionCode + electronMain.slice(nextLine);
      fs.writeFileSync(electronMainPath, electronMain);
    }
  }
}

console.log(`✅ Version ${version} information updated successfully!`);
console.log(`📄 Files updated:`);
console.log(`   - ${versionInfoPath}`);
console.log(`   - ${srcVersionPath}`);
console.log(`   - ${electronMainPath} (version logging)`);
console.log(`🎯 Application ready with version ${version}`);