#!/usr/bin/env node

/**
 * Changelog Generation Script for Sephia
 * Generates a comprehensive changelog from git history and version info
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('📝 Generating changelog for Sephia...');

// Get git information
let gitInfo = {
  currentBranch: 'unknown',
  lastCommit: 'unknown',
  commitCount: 0,
  recentCommits: []
};

try {
  gitInfo.currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  gitInfo.lastCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  gitInfo.commitCount = parseInt(execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim());
  
  // Get recent commits (last 10)
  const commitLog = execSync('git log --oneline -10', { encoding: 'utf8' }).trim();
  gitInfo.recentCommits = commitLog.split('\n').map(line => {
    const [hash, ...messageParts] = line.split(' ');
    return {
      hash: hash,
      message: messageParts.join(' ')
    };
  });
} catch (error) {
  console.warn('⚠️  Could not retrieve git information:', error.message);
}

// Define version history and features
const changelog = {
  projectInfo: {
    name: 'Sephia',
    description: 'Advanced AI Assistant with Voice Synthesis and Multi-Modal Capabilities',
    repository: 'https://github.com/alexandra767/React_LLM_GUI',
    license: 'MIT',
    author: 'Alexandra',
    currentVersion: packageJson.version,
    lastUpdated: new Date().toISOString()
  },
  
  versions: {
    '1.0.0': {
      date: '2025-01-30',
      type: 'major',
      title: 'Initial Stable Release',
      description: 'First stable release with comprehensive voice synthesis, memory optimization, and process management.',
      features: [
        'Comprehensive voice synthesis system with Bark TTS integration',
        'Memory optimization and leak prevention mechanisms',
        'Advanced process cleanup and shutdown management',
        'Intelligent audio management with speech preservation',
        'Enhanced AI response accuracy and context handling',
        'Google Calendar and Apple Calendar integration',
        'Google Drive integration for file management',
        'ComfyUI integration for image generation',
        'Terminal integration with Ollama support',
        'External memory system for persistent conversations',
        'Voice recognition with fallback mechanisms',
        'Real-time chat interface with typing indicators',
        'Electron-based desktop application',
        'Multi-platform support (macOS, Windows, Linux)'
      ],
      bugFixes: [
        'Fixed infinite rendering loops causing duplicate voice synthesis',
        'Resolved memory leaks in audio element management',
        'Fixed AI giving wrong responses due to complex context prompts',
        'Prevented voice synthesis interruption during active speech',
        'Resolved background process cleanup issues',
        'Fixed duplicate Aria identity issues in conversation memory',
        'Improved error handling in voice services',
        'Enhanced stability of Electron process management'
      ],
      technicalImprovements: [
        'Implemented global spoken message tracking to prevent duplicates',
        'Added conservative audio interruption logic in BarkVoiceService',
        'Created comprehensive Electron shutdown system',
        'Optimized conversation memory with history limits',
        'Enhanced error recovery mechanisms',
        'Improved service initialization and lazy loading',
        'Added background service registration and cleanup',
        'Implemented time-based audio preservation logic'
      ],
      breaking: []
    }
  },
  
  roadmap: {
    '1.1.0': [
      'Enhanced voice customization options',
      'Additional TTS provider support',
      'Improved calendar event management',
      'Advanced image generation workflows'
    ],
    '1.2.0': [
      'Multi-language support',
      'Cloud synchronization options',
      'Plugin architecture',
      'Advanced automation workflows'
    ],
    '2.0.0': [
      'Complete UI redesign',
      'Advanced AI model support',
      'Team collaboration features',
      'Enterprise deployment options'
    ]
  },
  
  gitInfo: gitInfo
};

// Generate markdown changelog
const markdownChangelog = generateMarkdownChangelog(changelog);

// Write changelog files
const changelogMdPath = path.join(__dirname, '..', 'CHANGELOG.md');
const changelogJsonPath = path.join(__dirname, '..', 'public', 'changelog.json');

fs.writeFileSync(changelogMdPath, markdownChangelog);
fs.writeFileSync(changelogJsonPath, JSON.stringify(changelog, null, 2));

console.log('✅ Changelog generated successfully!');
console.log(`📄 Files created:`);
console.log(`   - ${changelogMdPath}`);
console.log(`   - ${changelogJsonPath}`);

function generateMarkdownChangelog(changelog) {
  const { projectInfo, versions, roadmap, gitInfo } = changelog;
  
  let md = `# Changelog - ${projectInfo.name}\n\n`;
  md += `${projectInfo.description}\n\n`;
  md += `**Current Version:** ${projectInfo.currentVersion}  \n`;
  md += `**Last Updated:** ${new Date(projectInfo.lastUpdated).toLocaleDateString()}  \n`;
  md += `**Repository:** [${projectInfo.repository}](${projectInfo.repository})  \n\n`;
  
  // Version history
  md += `## Version History\n\n`;
  
  for (const [version, info] of Object.entries(versions)) {
    md += `### ${version} - ${info.title} (${info.date})\n\n`;
    md += `${info.description}\n\n`;
    
    if (info.features.length > 0) {
      md += `#### ✨ New Features\n\n`;
      info.features.forEach(feature => {
        md += `- ${feature}\n`;
      });
      md += `\n`;
    }
    
    if (info.bugFixes.length > 0) {
      md += `#### 🐛 Bug Fixes\n\n`;
      info.bugFixes.forEach(fix => {
        md += `- ${fix}\n`;
      });
      md += `\n`;
    }
    
    if (info.technicalImprovements.length > 0) {
      md += `#### 🔧 Technical Improvements\n\n`;
      info.technicalImprovements.forEach(improvement => {
        md += `- ${improvement}\n`;
      });
      md += `\n`;
    }
    
    if (info.breaking.length > 0) {
      md += `#### ⚠️ Breaking Changes\n\n`;
      info.breaking.forEach(breaking => {
        md += `- ${breaking}\n`;
      });
      md += `\n`;
    }
  }
  
  // Roadmap
  md += `## 🗺️ Roadmap\n\n`;
  for (const [version, features] of Object.entries(roadmap)) {
    md += `### ${version}\n\n`;
    features.forEach(feature => {
      md += `- ${feature}\n`;
    });
    md += `\n`;
  }
  
  // Git information
  md += `## 📊 Development Info\n\n`;
  md += `**Current Branch:** ${gitInfo.currentBranch}  \n`;
  md += `**Latest Commit:** ${gitInfo.lastCommit}  \n`;
  md += `**Total Commits:** ${gitInfo.commitCount}  \n\n`;
  
  if (gitInfo.recentCommits.length > 0) {
    md += `### Recent Commits\n\n`;
    gitInfo.recentCommits.forEach(commit => {
      md += `- \`${commit.hash}\` ${commit.message}\n`;
    });
    md += `\n`;
  }
  
  md += `---\n\n`;
  md += `*This changelog is automatically generated. For more detailed information, see the git commit history.*\n`;
  
  return md;
}