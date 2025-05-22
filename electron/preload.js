const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of valid channels for IPC communication
const validSendChannels = [
  'terminal:write',
  'terminal:resize',
  'terminal:start',
  'terminal:stop'
];

const validReceiveChannels = [
  'terminal:data',
  'terminal:exit'
];

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Send messages to the main process
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`Attempted to send on invalid channel: ${channel}`);
    }
  },
  
  // Receive messages from the main process
  receive: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      // Strip event as it includes `sender` which we don't want to expose
      const newCallback = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, newCallback);
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(channel, newCallback);
      };
    } else {
      console.warn(`Attempted to receive on invalid channel: ${channel}`);
    }
  },
  
  // Invoke methods and wait for the result
  invoke: async (channel, data) => {
    if (validSendChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
    console.warn(`Attempted to invoke on invalid channel: ${channel}`);
    return null;
  }
});

// Log that preload script has loaded
console.log('Preload script loaded with contextBridge enabled');
