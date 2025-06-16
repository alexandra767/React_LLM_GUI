// Force production mode
process.env.NODE_ENV = 'production';
process.env.ELECTRON_IS_DEV = '0';

// Load the main electron file
require('./electron/main.js');