// Auto-generated version file
// Updated on: 2025-05-31T01:16:55.790Z

export const VERSION_INFO = {
  "version": "1.0.0",
  "name": "sephia",
  "buildDate": "2025-05-31T01:16:55.789Z",
  "gitBranch": "unknown",
  "gitCommit": "unknown",
  "nodeVersion": "v22.16.0",
  "platform": "darwin",
  "features": [
    "Bark TTS Voice Synthesis",
    "Real-time Chat Interface",
    "Google Calendar Integration",
    "Apple Calendar Integration",
    "Google Drive Integration",
    "Image Generation (ComfyUI)",
    "Voice Recognition",
    "External Memory System",
    "Terminal Integration",
    "Ollama Local LLM Support"
  ],
  "changelog": {
    "1.0.0": [
      "Initial stable release",
      "Comprehensive voice synthesis fixes",
      "Memory optimization and leak prevention",
      "Process cleanup system implementation",
      "Audio management improvements",
      "AI response accuracy enhancements"
    ]
  }
};

export const getVersion = () => VERSION_INFO.version;
export const getBuildDate = () => VERSION_INFO.buildDate;
export const getFeatures = () => VERSION_INFO.features;
export const getChangelog = () => VERSION_INFO.changelog;

export default VERSION_INFO;
