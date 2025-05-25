// Export all Sephia data to a file
export const exportAllData = () => {
  const data = {
    profile: localStorage.getItem('sephia_profile') ? JSON.parse(localStorage.getItem('sephia_profile')) : null,
    chats: localStorage.getItem('sephia_chats') ? JSON.parse(localStorage.getItem('sephia_chats')) : [],
    projects: localStorage.getItem('sephia_projects') ? JSON.parse(localStorage.getItem('sephia_projects')) : [],
    currentModel: localStorage.getItem('sephia_current_model'),
    theme: localStorage.getItem('sephia_theme'),
    voiceSettings: localStorage.getItem('sephia_voice_settings') ? JSON.parse(localStorage.getItem('sephia_voice_settings')) : null,
    settings: localStorage.getItem('sephia_settings') ? JSON.parse(localStorage.getItem('sephia_settings')) : null,
    apiKeys: {
      googleClientId: localStorage.getItem('google_client_id'),
      googleApiKey: localStorage.getItem('google_api_key'),
      appleUsername: localStorage.getItem('apple_calendar_username'),
      applePassword: localStorage.getItem('apple_calendar_password')
    }
  };
  
  // Create a blob and download
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sephia-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  console.log('Data exported successfully!');
  console.log('Exported data:', data);
  
  return data;
};

// Make it available globally
window.exportSephiaData = exportAllData;