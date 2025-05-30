/**
 * Google Drive Service
 * Comprehensive file upload, download, and management for Aria
 */

class GoogleDriveService {
  constructor() {
    this.clientId = localStorage.getItem('google_client_id');
    this.clientSecret = localStorage.getItem('google_client_secret');
    this.accessToken = localStorage.getItem('google_access_token');
    this.refreshToken = localStorage.getItem('google_refresh_token');
    this.isAuthenticated = false;
    this.apiEndpoint = 'https://www.googleapis.com/drive/v3';
    this.uploadEndpoint = 'https://www.googleapis.com/upload/drive/v3';
    
    // Check if we have valid credentials
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    this.isAuthenticated = !!(this.accessToken && this.clientId);
    console.log('[GoogleDriveService] Auth status:', {
      isAuthenticated: this.isAuthenticated,
      hasAccessToken: !!this.accessToken,
      hasClientId: !!this.clientId,
      hasRefreshToken: !!this.refreshToken
    });
  }

  // Enhanced authentication with proper Drive scopes
  async authenticate() {
    if (!this.clientId) {
      throw new Error('Google Client ID not configured. Please add it in Settings.');
    }

    console.log('[GoogleDriveService] Starting authentication...');
    
    // Use device flow for better Electron compatibility
    const deviceCodeResponse = await fetch('https://oauth2.googleapis.com/device/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        scope: [
          'https://www.googleapis.com/auth/drive.file',     // Upload, edit, delete files
          'https://www.googleapis.com/auth/drive.readonly', // Read files
          'https://www.googleapis.com/auth/drive.metadata.readonly' // Read metadata
        ].join(' ')
      })
    });

    if (!deviceCodeResponse.ok) {
      const errorText = await deviceCodeResponse.text();
      console.error('[GoogleDriveService] Device code request failed:', errorText);
      throw new Error('Failed to start authentication process');
    }

    const deviceData = await deviceCodeResponse.json();
    
    // Open verification URL
    if (window.electron?.shell) {
      window.electron.shell.openExternal(deviceData.verification_url);
    } else if (window.require) {
      const { shell } = window.require('electron');
      shell.openExternal(deviceData.verification_url);
    }

    // Show user code
    const userConfirmed = window.confirm(
      `Please visit ${deviceData.verification_url} and enter this code:\n\n${deviceData.user_code}\n\nClick OK after you've authorized Aria to access your Google Drive.`
    );

    if (!userConfirmed) {
      throw new Error('Authentication cancelled by user');
    }

    // Poll for token
    const tokenData = await this.pollForToken(deviceData.device_code, deviceData.interval || 5);
    
    // Store tokens
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    
    localStorage.setItem('google_access_token', this.accessToken);
    if (this.refreshToken) {
      localStorage.setItem('google_refresh_token', this.refreshToken);
    }
    
    this.isAuthenticated = true;
    console.log('[GoogleDriveService] Authentication successful!');
    
    return true;
  }

  async pollForToken(deviceCode, interval) {
    const maxAttempts = 60; // 5 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret || '',
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        })
      });

      const data = await response.json();

      if (data.access_token) {
        return data;
      }

      if (data.error === 'authorization_pending') {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
        attempts++;
      } else if (data.error) {
        throw new Error(data.error_description || data.error);
      }
    }

    throw new Error('Authentication timeout');
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Please re-authenticate.');
    }

    console.log('[GoogleDriveService] Refreshing access token...');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret || '',
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      console.error('[GoogleDriveService] Token refresh failed');
      throw new Error('Failed to refresh token. Please re-authenticate.');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    localStorage.setItem('google_access_token', this.accessToken);
    
    console.log('[GoogleDriveService] Access token refreshed');
    return this.accessToken;
  }

  async getValidAccessToken() {
    if (!this.accessToken) {
      await this.authenticate();
      return this.accessToken;
    }

    // Test if current token works
    try {
      const response = await fetch(`${this.apiEndpoint}/about?fields=user`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.ok) {
        return this.accessToken;
      } else if (response.status === 401) {
        // Token expired, try to refresh
        if (this.refreshToken) {
          await this.refreshAccessToken();
          return this.accessToken;
        } else {
          // No refresh token, need to re-authenticate
          await this.authenticate();
          return this.accessToken;
        }
      } else {
        throw new Error(`API test failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[GoogleDriveService] Token validation failed:', error);
      
      // Try refresh first, then full auth
      if (this.refreshToken) {
        try {
          await this.refreshAccessToken();
          return this.accessToken;
        } catch (refreshError) {
          console.error('[GoogleDriveService] Refresh failed:', refreshError);
          await this.authenticate();
          return this.accessToken;
        }
      } else {
        await this.authenticate();
        return this.accessToken;
      }
    }
  }

  // List files with search capability
  async listFiles(query = '', limit = 20) {
    const token = await this.getValidAccessToken();
    
    // Build search query
    let searchQuery = 'trashed = false';
    if (query) {
      searchQuery += ` and (name contains '${query}' or fullText contains '${query}')`;
    }

    console.log('[GoogleDriveService] Listing files with query:', searchQuery);

    const response = await fetch(`${this.apiEndpoint}/files?` + new URLSearchParams({
      q: searchQuery,
      pageSize: limit,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, thumbnailLink, parents)',
      orderBy: 'modifiedTime desc'
    }), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list files: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  // Upload a file to Google Drive
  async uploadFile(file, fileName = null, folderId = null) {
    const token = await this.getValidAccessToken();
    
    const actualFileName = fileName || file.name || 'untitled';
    console.log('[GoogleDriveService] Uploading file:', actualFileName, 'Size:', file.size);

    // Create metadata
    const metadata = {
      name: actualFileName,
      parents: folderId ? [folderId] : undefined
    };

    // Use multipart upload for files
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(`${this.uploadEndpoint}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const uploadedFile = await response.json();
    console.log('[GoogleDriveService] File uploaded successfully:', uploadedFile.id);
    
    return uploadedFile;
  }

  // Upload text content as a file
  async uploadTextFile(content, fileName, mimeType = 'text/plain', folderId = null) {
    const blob = new Blob([content], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    return this.uploadFile(file, fileName, folderId);
  }

  // Download a file from Google Drive
  async downloadFile(fileId) {
    const token = await this.getValidAccessToken();
    
    console.log('[GoogleDriveService] Downloading file:', fileId);

    // First get file metadata
    const metadataResponse = await fetch(`${this.apiEndpoint}/files/${fileId}?fields=id,name,mimeType,size`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!metadataResponse.ok) {
      throw new Error(`Failed to get file metadata: ${metadataResponse.status}`);
    }

    const metadata = await metadataResponse.json();
    console.log('[GoogleDriveService] File metadata:', metadata);

    // Download file content
    let downloadUrl;
    let exportMimeType = null;

    // Handle Google Workspace files (need export)
    if (metadata.mimeType.startsWith('application/vnd.google-apps.')) {
      if (metadata.mimeType.includes('document')) {
        exportMimeType = 'text/plain';
        downloadUrl = `${this.apiEndpoint}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
      } else if (metadata.mimeType.includes('spreadsheet')) {
        exportMimeType = 'text/csv';
        downloadUrl = `${this.apiEndpoint}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
      } else if (metadata.mimeType.includes('presentation')) {
        exportMimeType = 'text/plain';
        downloadUrl = `${this.apiEndpoint}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
      } else {
        throw new Error(`Cannot download ${metadata.mimeType} files`);
      }
    } else {
      // Regular file download
      downloadUrl = `${this.apiEndpoint}/files/${fileId}?alt=media`;
    }

    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!downloadResponse.ok) {
      throw new Error(`Download failed: ${downloadResponse.status}`);
    }

    const content = await downloadResponse.blob();
    
    return {
      metadata,
      content,
      contentType: exportMimeType || metadata.mimeType
    };
  }

  // Get file content as text (for text files)
  async getFileContent(fileId) {
    const downloadResult = await this.downloadFile(fileId);
    
    if (!downloadResult.contentType.startsWith('text/') && 
        !downloadResult.contentType.includes('json') &&
        !downloadResult.contentType.includes('javascript')) {
      throw new Error('File is not a text file');
    }

    const text = await downloadResult.content.text();
    return {
      metadata: downloadResult.metadata,
      content: text
    };
  }

  // Delete a file
  async deleteFile(fileId) {
    const token = await this.getValidAccessToken();
    
    console.log('[GoogleDriveService] Deleting file:', fileId);

    const response = await fetch(`${this.apiEndpoint}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    console.log('[GoogleDriveService] File deleted successfully');
    return true;
  }

  // Create a folder
  async createFolder(name, parentFolderId = null) {
    const token = await this.getValidAccessToken();
    
    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    const response = await fetch(`${this.apiEndpoint}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.status}`);
    }

    const folder = await response.json();
    console.log('[GoogleDriveService] Folder created:', folder.id);
    return folder;
  }

  // Share a file (make it public or share with specific email)
  async shareFile(fileId, email = null, role = 'reader') {
    const token = await this.getValidAccessToken();
    
    const permission = {
      role: role, // 'reader', 'writer', 'commenter'
      type: email ? 'user' : 'anyone',
      emailAddress: email
    };

    const response = await fetch(`${this.apiEndpoint}/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permission)
    });

    if (!response.ok) {
      throw new Error(`Failed to share file: ${response.status}`);
    }

    const permissionResult = await response.json();
    console.log('[GoogleDriveService] File shared successfully');
    return permissionResult;
  }

  // Get user info
  async getUserInfo() {
    const token = await this.getValidAccessToken();
    
    const response = await fetch(`${this.apiEndpoint}/about?fields=user,storageQuota`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return response.json();
  }

  // Format file list for display
  formatFileList(files) {
    if (!files || files.length === 0) {
      return 'No files found.';
    }

    return files.map(file => {
      const size = file.size ? this.formatFileSize(parseInt(file.size)) : 'Unknown size';
      const modified = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown date';
      const type = this.getFileTypeDisplay(file.mimeType);
      
      return `📄 **${file.name}**\n   Type: ${type} | Size: ${size} | Modified: ${modified}\n   ID: ${file.id}`;
    }).join('\n\n');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileTypeDisplay(mimeType) {
    if (mimeType.includes('document')) return 'Google Doc';
    if (mimeType.includes('spreadsheet')) return 'Google Sheet';
    if (mimeType.includes('presentation')) return 'Google Slides';
    if (mimeType.includes('folder')) return 'Folder';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('video')) return 'Video';
    if (mimeType.includes('audio')) return 'Audio';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('text')) return 'Text';
    return 'File';
  }

  // Helper method to create a file from text
  createFileFromText(text, fileName, mimeType = 'text/plain') {
    const blob = new Blob([text], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  // Helper method to trigger file download in browser
  downloadFileToUser(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default GoogleDriveService;