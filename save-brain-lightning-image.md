# How to Add Your Brain Lightning Image

The blue square you're seeing is because the BrainLightningIcon component currently has a placeholder image (a single blue pixel).

## Quick Fix Steps:

### Option 1: Direct Base64 Update (Easiest)

1. Go to any online image-to-base64 converter like:
   - https://www.base64-image.de/
   - https://www.base64encode.org/
   
2. Upload your brain-lightning image

3. Copy the complete data URI (it will start with `data:image/png;base64,` followed by a long string)

4. Open `/src/components/Chat/BrainLightningIcon.js`

5. Replace this line:
```javascript
const BRAIN_LIGHTNING_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
```

With your actual base64 string:
```javascript
const BRAIN_LIGHTNING_BASE64 = "your-actual-base64-string-here";
```

### Option 2: Using the Script

1. Save your brain-lightning image to the public folder:
   - Save as: `/Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI/public/brain-lightning.png`

2. Run the conversion script:
```bash
cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI
node convert-image-to-base64.js public/brain-lightning.png
```

3. Open the generated file `brain-lightning-base64.txt` and copy its contents

4. Paste it into `src/components/Chat/BrainLightningIcon.js` replacing the placeholder

### Option 3: Use an External URL (Temporary)

If you have the image hosted somewhere, you can temporarily use:
```javascript
const BRAIN_LIGHTNING_BASE64 = "https://your-image-url-here.png";
```

## After updating:

1. Save the file
2. The React app should auto-refresh
3. You'll see your brain-lightning image instead of the blue square!

The image will appear in:
- Welcome screen (center, with orange border)
- Sidebar logo (next to "Sephia")
- Assistant message avatars

Need help? Make sure your base64 string is complete and starts with `data:image/png;base64,` or `data:image/jpeg;base64,`