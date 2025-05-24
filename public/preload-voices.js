// Preload voices workaround for Electron
// This helps ensure system voices are available

if (window.speechSynthesis) {
  // Create a dummy utterance to trigger voice loading
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  
  // Function to load voices
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('[Preload] System voices loaded:', voices.length);
    return voices;
  };
  
  // Try multiple methods to ensure voices are loaded
  window.speechSynthesis.speak(utterance);
  window.speechSynthesis.cancel();
  
  // Load immediately
  loadVoices();
  
  // Also set up the event handler
  window.speechSynthesis.onvoiceschanged = loadVoices;
  
  // Try again after delays
  setTimeout(loadVoices, 100);
  setTimeout(loadVoices, 500);
  setTimeout(loadVoices, 1000);
}