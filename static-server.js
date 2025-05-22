const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3030;
const BUILD_DIR = path.join(__dirname, 'build');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Get the file path based on the URL
  let filePath = path.join(BUILD_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If the file doesn't exist, serve index.html for client-side routing
      if (req.url !== '/favicon.ico') {
        filePath = path.join(BUILD_DIR, 'index.html');
      } else {
        res.statusCode = 404;
        res.end('File not found');
        return;
      }
    }
    
    // Get the file extension
    const extname = path.extname(filePath);
    
    // Set content type based on file extension
    let contentType = 'text/html';
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.statusCode = 404;
          res.end('File not found');
        } else {
          res.statusCode = 500;
          res.end('Server error');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Open this URL in your browser to view the app');
});