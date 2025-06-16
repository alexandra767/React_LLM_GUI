import React, { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { 
  Add as AddIcon, 
  InsertDriveFile as FileIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  Description as TextIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { extractTextFromPDF } from '../../utils/pdfExtractor';

const KnowledgeContainer = styled.div`
  background-color: #252525;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

const KnowledgeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const KnowledgeTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #F0F0F0;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FileCount = styled.span`
  font-size: 14px;
  color: #AAAAAA;
  font-weight: 400;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1E1E1E;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #444444;
    border-radius: 3px;
    
    &:hover {
      background: #555555;
    }
  }
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #1E1E1E;
  border-radius: 8px;
  border: 1px solid #333333;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #2A2A2A;
    border-color: #404040;
    
    .remove-button {
      opacity: 1;
    }
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const FileIconWrapper = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color || '#AAAAAA'};
`;

const FileDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 14px;
  color: #F0F0F0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 12px;
  color: #888888;
  margin-top: 2px;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #AAAAAA;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  border-radius: 4px;
  
  &:hover {
    background-color: #FF4444;
    color: #FFFFFF;
  }
`;

const UploadArea = styled.div`
  border: 2px dashed #404040;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;
  
  &:hover {
    border-color: #FF643D;
    background-color: rgba(255, 100, 61, 0.05);
  }
  
  &.dragging {
    border-color: #FF643D;
    background-color: rgba(255, 100, 61, 0.1);
  }
`;

const UploadText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #AAAAAA;
  
  svg {
    font-size: 32px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #888888;
  text-align: center;
`;

const EmptyStateText = styled.p`
  font-size: 14px;
  margin: 8px 0 0 0;
  max-width: 300px;
  line-height: 1.5;
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadButton = styled.label`
  display: inline-block;
  padding: 8px 16px;
  background-color: #FF643D;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #FF8C6B;
  }
`;

const TextInputModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const TextInputContent = styled.div`
  background-color: #252525;
  border-radius: 12px;
  padding: 24px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const TextInputTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #F0F0F0;
  margin: 0 0 16px 0;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 300px;
  padding: 12px;
  background-color: #1E1E1E;
  border: 1px solid #333333;
  border-radius: 8px;
  color: #F0F0F0;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #FF643D;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background-color: #1E1E1E;
  border: 1px solid #333333;
  border-radius: 8px;
  color: #F0F0F0;
  font-size: 14px;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #FF643D;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
`;

const Button = styled.button`
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  &.primary {
    background-color: #FF643D;
    color: #FFFFFF;
    
    &:hover {
      background-color: #FF8C6B;
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: #F0F0F0;
    border: 1px solid #333333;
    
    &:hover {
      background-color: #333333;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  
  // Code files
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift'].includes(ext)) {
    return { icon: CodeIcon, color: '#61DAFB' };
  }
  
  // Image files
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return { icon: ImageIcon, color: '#4CAF50' };
  }
  
  // Text/Document files
  if (['txt', 'md', 'doc', 'docx', 'pdf', 'rtf'].includes(ext)) {
    return { icon: TextIcon, color: '#FF9800' };
  }
  
  // Default
  return { icon: FileIcon, color: '#AAAAAA' };
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ProjectKnowledge = ({ project, onUpdateProject }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualFileName, setManualFileName] = useState('');
  const fileInputRef = useRef(null);
  
  const files = project?.knowledgeFiles || [];
  
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };
  
  const processFiles = async (selectedFiles) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    const validFiles = [];
    const errors = [];
    
    setIsProcessing(true);
    
    for (const file of selectedFiles) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} is too large (max 10MB)`);
        continue;
      }
      
      try {
        // Read file content
        let fileData = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          addedAt: new Date().toISOString()
        };
        
        // Check if it's a text-based file we can read directly
        const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.json', '.xml', '.yaml', '.yml', '.css', '.scss', '.html', '.htm', '.csv', '.log', '.sh', '.bash', '.zsh', '.env', '.gitignore', '.dockerfile', '.sql', '.r', '.m', '.dart', '.vue', '.svelte'];
        const isTextFile = textExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) || 
                          file.type.startsWith('text/') || 
                          file.type === 'application/json' ||
                          file.type === 'application/xml';
        
        // Check if it's a CSV file (can be read as text)
        const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
        
        if (isTextFile) {
          // Read as text for text files
          const text = await fileToText(file);
          fileData.content = text;
          fileData.isText = true;
        } else {
          // For binary files (including PDFs), store as base64
          const base64 = await fileToBase64(file);
          fileData.content = base64;
          fileData.isText = false;
          
          // For PDFs, extract text content
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            fileData.isPDF = true;
            console.log('[ProjectKnowledge] Extracting text from PDF:', file.name);
            
            try {
              const pdfText = await extractTextFromPDF(file);
              if (pdfText && pdfText.trim().length > 0) {
                // Store both the base64 (for download) and extracted text
                fileData.extractedText = pdfText;
                console.log('[ProjectKnowledge] Successfully extracted', pdfText.length, 'characters from PDF');
              } else {
                console.log('[ProjectKnowledge] No text could be extracted from PDF');
              }
            } catch (pdfError) {
              console.error('[ProjectKnowledge] Error extracting PDF text:', pdfError);
            }
          }
        }
        
        validFiles.push(fileData);
      } catch (error) {
        console.error('[ProjectKnowledge] Error processing file:', file.name, error);
        errors.push(`Failed to process ${file.name}`);
      }
    }
    
    if (errors.length > 0) {
      alert('Some files could not be added:\n' + errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      onUpdateProject(project.id, { 
        knowledgeFiles: updatedFiles,
        fileCount: updatedFiles.length
      });
    }
    
    setIsProcessing(false);
  };
  
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };
  
  const fileToText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };
  
  const handleRemoveFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onUpdateProject(project.id, { 
      knowledgeFiles: updatedFiles,
      fileCount: updatedFiles.length
    });
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };
  
  const handleAddManualText = () => {
    if (!manualText.trim() || !manualFileName.trim()) {
      alert('Please provide both a filename and content');
      return;
    }
    
    const newFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: manualFileName.endsWith('.txt') ? manualFileName : `${manualFileName}.txt`,
      size: new Blob([manualText]).size,
      type: 'text/plain',
      lastModified: Date.now(),
      content: manualText,
      isText: true,
      isManual: true,
      addedAt: new Date().toISOString()
    };
    
    const updatedFiles = [...files, newFile];
    onUpdateProject(project.id, { 
      knowledgeFiles: updatedFiles,
      fileCount: updatedFiles.length
    });
    
    // Reset form
    setManualText('');
    setManualFileName('');
    setShowTextInput(false);
  };
  
  return (
    <KnowledgeContainer>
      <KnowledgeHeader>
        <KnowledgeTitle>
          Project knowledge
          {files.length > 0 && <FileCount>({files.length})</FileCount>}
        </KnowledgeTitle>
      </KnowledgeHeader>
      
      <ActionButtons>
        <Button 
          className="secondary" 
          onClick={() => setShowTextInput(true)}
          style={{ fontSize: 13, padding: '6px 12px' }}
        >
          <AddIcon style={{ fontSize: 16, marginRight: 4 }} />
          Add Text Manually
        </Button>
      </ActionButtons>
      
      {files.length === 0 ? (
        <EmptyState>
          <FileIcon style={{ fontSize: 48, opacity: 0.5 }} />
          <EmptyStateText>
            Add files to give the AI context about your project
          </EmptyStateText>
        </EmptyState>
      ) : (
        <FileList>
          {files.map((file) => {
            const { icon: IconComponent, color } = getFileIcon(file.name);
            return (
              <FileItem key={file.id}>
                <FileInfo>
                  <FileIconWrapper color={color}>
                    <IconComponent />
                  </FileIconWrapper>
                  <FileDetails>
                    <FileName title={file.name}>{file.name}</FileName>
                    <FileSize>{formatFileSize(file.size)}</FileSize>
                  </FileDetails>
                </FileInfo>
                <RemoveButton
                  className="remove-button"
                  onClick={() => handleRemoveFile(file.id)}
                  title="Remove file"
                >
                  <CloseIcon style={{ fontSize: 18 }} />
                </RemoveButton>
              </FileItem>
            );
          })}
        </FileList>
      )}
      
      <UploadArea
        className={isDragging ? 'dragging' : ''}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'wait' : 'pointer' }}
      >
        <UploadText>
          {isProcessing ? (
            <>
              <div style={{ fontSize: 16, marginBottom: 8 }}>Processing files...</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Extracting text from PDFs and preparing files
              </div>
            </>
          ) : (
            <>
              <UploadIcon />
              <div>Drop files here or click to upload</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                All file types accepted • Max 10MB per file
              </div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                PDFs, images, documents, code files, etc.
              </div>
            </>
          )}
        </UploadText>
      </UploadArea>
      
      <HiddenInput
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
      />
      
      {showTextInput && (
        <TextInputModal onClick={() => setShowTextInput(false)}>
          <TextInputContent onClick={(e) => e.stopPropagation()}>
            <TextInputTitle>Add Text Content</TextInputTitle>
            
            <Input
              type="text"
              placeholder="Filename (e.g., abraham-lincoln-essay.txt)"
              value={manualFileName}
              onChange={(e) => setManualFileName(e.target.value)}
              autoFocus
            />
            
            <TextArea
              placeholder="Paste or type your text content here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
            />
            
            <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
              Tip: Copy text from your PDF and paste it here if automatic extraction isn't working
            </div>
            
            <ButtonGroup>
              <Button className="secondary" onClick={() => setShowTextInput(false)}>
                Cancel
              </Button>
              <Button 
                className="primary" 
                onClick={handleAddManualText}
                disabled={!manualText.trim() || !manualFileName.trim()}
              >
                Add to Knowledge
              </Button>
            </ButtonGroup>
          </TextInputContent>
        </TextInputModal>
      )}
    </KnowledgeContainer>
  );
};

export default ProjectKnowledge;