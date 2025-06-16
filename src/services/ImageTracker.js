class ImageTracker {
  constructor() {
    this.imageCount = parseInt(localStorage.getItem('comfyui_image_count') || '0');
    this.baseUrl = 'http://localhost:8188';
  }

  getNextImageNumber() {
    this.imageCount++;
    localStorage.setItem('comfyui_image_count', this.imageCount.toString());
    return String(this.imageCount).padStart(5, '0');
  }

  getLatestImageUrl() {
    const imageNumber = String(this.imageCount).padStart(5, '0');
    return `${this.baseUrl}/view?filename=Sephia_${imageNumber}_.png&type=output`;
  }

  async waitForNewImage(promptId, timeout = 30000) {
    const startCount = this.imageCount;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Check for new image
      const nextNumber = String(this.imageCount + 1).padStart(5, '0');
      const testUrl = `${this.baseUrl}/view?filename=Sephia_${nextNumber}_.png&type=output`;
      
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          this.imageCount++;
          localStorage.setItem('comfyui_image_count', this.imageCount.toString());
          console.log('[ImageTracker] New image detected:', testUrl);
          return [{
            filename: `Sephia_${nextNumber}_.png`,
            subfolder: '',
            type: 'output',
            url: testUrl
          }];
        }
      } catch (error) {
        // Ignore errors, just means image doesn't exist yet
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('[ImageTracker] Timeout waiting for new image');
    return null;
  }

  // Initialize with current count based on existing files
  async syncWithExistingImages() {
    // Start from where we know images exist
    let count = 5; // We know at least 5 exist
    let found = true;

    while (found) {
      const testNumber = String(count + 1).padStart(5, '0');
      const testUrl = `${this.baseUrl}/view?filename=Sephia_${testNumber}_.png&type=output`;
      
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          count++;
        } else {
          found = false;
        }
      } catch (error) {
        found = false;
      }
    }

    this.imageCount = count;
    localStorage.setItem('comfyui_image_count', count.toString());
    console.log('[ImageTracker] Synced with existing images, count:', count);
  }
}

export default new ImageTracker();