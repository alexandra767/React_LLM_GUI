# Brain Lightning Icon Update Instructions

I've updated all the icon references in the app to use the new BrainLightningIcon component. Now you just need to add your actual image.

## Steps to complete the icon update:

### 1. Convert your brain-lightning image to base64

Save your brain with lightning image somewhere on your computer, then run:

```bash
node convert-image-to-base64.js /path/to/your/brain-lightning-image.png
```

This will create a file called `brain-lightning-base64.txt` containing the base64 string.

### 2. Update the BrainLightningIcon component

Open `src/components/Chat/BrainLightningIcon.js` and replace the placeholder base64 string with your actual image:

```javascript
// Replace this line:
const BRAIN_LIGHTNING_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// With the content from brain-lightning-base64.txt
const BRAIN_LIGHTNING_BASE64 = "your-actual-base64-string-here";
```

### 3. Verify the changes

The brain-lightning icon is now used in:
- Welcome screen (main chat view)
- Sidebar logo
- Assistant message avatars

### 4. Optional: Update app icons for desktop

If you also want to update the desktop app icon (shown in dock/taskbar):

1. Save your image as `public/brain-lightning.png`
2. Install ImageMagick: `brew install imagemagick`
3. Run: `node update-app-icon.js`
4. Rebuild: `npm run build && npm run electron-pack`

## Where the icon is used:

- **ChatView.js**: Welcome screen icon (60x60)
- **Sidebar.js**: App logo in sidebar (36x36)
- **Message.js**: Assistant avatar icon (20x20)

All these now use the BrainLightningIcon component with your custom image!