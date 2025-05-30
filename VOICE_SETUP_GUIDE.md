# Sephia Voice Pack Setup Guide

## 🎯 Quick Start

### Option 1: Double-Click to Launch (Recommended)
1. **Double-click `Sephia.app`** in your project folder
2. The app will automatically start all services:
   - ComfyUI for image generation
   - Bark TTS for AI voices  
   - React development server
   - Electron app

### Option 2: Terminal Launch
```bash
# In project directory
./Sephia.command
```

## 🎤 Voice Features

### Available Voice Providers
1. **Browser TTS** - Built-in system voices
2. **Bark AI TTS** - High-quality AI voices (12 voices available)

### Accessing Voice Settings
1. Open Sephia app
2. Go to **Settings** → **Voice Settings**
3. Select **Text-to-Speech Provider**:
   - Choose "Browser TTS" for system voices
   - Choose "Bark AI TTS" for AI voices

### Voice Pack Status
Your Bark TTS server is running with 12 AI voices:
- Alex (Male) - Neutral
- Sarah (Female) - Friendly  
- Mike (Male) - Professional
- Emma (Female) - Warm
- David (Male) - Deep
- Lisa (Female) - Clear
- James (Male) - Calm
- Anna (Female) - Expressive
- Tom (Male) - Energetic
- Grace (Female) - Soft
- Announcer (Male) - Professional Announcer
- Narrator (Male) - Story Narrator

## 🔧 Troubleshooting

### Voices Not Showing?
1. Go to Settings → Voice Settings
2. Change "Text-to-Speech Provider" to "Bark AI TTS"
3. Wait for voices to load (they'll appear in the dropdown)
4. If still not showing, click "Refresh Voice List"

### Bark TTS Not Working?
```bash
# Check if Bark TTS is running
curl http://localhost:8189/status

# If not running, start it manually:
cd ai-tools/ComfyUI
./start-bark-tts.sh
```

### Browser Voices Missing?
1. Go to Settings → Voice Settings  
2. Click "Refresh Voice List"
3. If issue persists, click "Enable Voice Features"

## 🚀 Using the Clickable App

### Move to Applications (Optional)
```bash
# Move app to Applications folder
mv Sephia.app /Applications/

# Now you can:
# - Find it in Spotlight search
# - Add to Dock
# - Launch from Launchpad
```

### App Features
- ✅ Automatically starts all required services
- ✅ Proper macOS app bundle
- ✅ Custom icon
- ✅ Can be added to Dock
- ✅ No terminal window required
- ✅ Graceful shutdown of all services

## 🎭 Voice Testing

### Test Voice in Settings
1. Go to Settings → Voice Settings
2. Select a voice from the dropdown
3. Click "Test Voice" button
4. Adjust rate, pitch, volume as needed

### Voice Features
- **Speech Rate**: 0.1 - 2.0 (how fast)
- **Speech Pitch**: 0.0 - 2.0 (how high/low)  
- **Speech Volume**: 0.0 - 1.0 (how loud)
- **Voice Selection**: Choose from available voices
- **Auto-speak**: Automatically read AI responses

## 📱 Usage Tips

1. **For best AI voice quality**: Use Bark TTS provider
2. **For fastest response**: Use Browser TTS provider  
3. **For offline use**: Both providers work offline
4. **Voice memory**: Your selected voice and settings are saved automatically

Enjoy your enhanced Sephia experience with high-quality AI voices! 🎊