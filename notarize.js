// This is a placeholder notarization script
// For a production app, you would need to implement proper notarization
// which requires an Apple Developer ID

module.exports = async function (params) {
  // Skip notarization if not on macOS
  if (process.platform !== 'darwin') {
    return;
  }
  
  console.log('Skipping notarization - not configured');
};
