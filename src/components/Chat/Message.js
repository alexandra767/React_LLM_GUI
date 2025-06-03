import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ContentCopy as CopyIcon, Check as CheckIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, Psychology as PsychologyIcon, VolumeUp as SpeakerIcon, Stop as StopIcon, Download as DownloadIcon } from '@mui/icons-material';
import { Tooltip, IconButton, Box, styled, keyframes, useTheme as useMuiTheme, Collapse, Chip } from '@mui/material';
import BrainIcon from './BrainIcon';
import BrainLightningIcon from './BrainLightningIcon';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import copyToClipboard from '../../utils/clipboard';
import { useStreamingContent } from '../../hooks/useStreamingContent';
import voiceService from '../../services/VoiceService';

// Global Set to track which messages have already been spoken to prevent duplicates
const spokenMessageIds = new Set();

// Export function to clear spoken messages (useful for new conversations)
export const clearSpokenMessages = () => {
  console.log('[Message] Clearing spoken messages cache, previous count:', spokenMessageIds.size);
  spokenMessageIds.clear();
  
  // CRITICAL FIX: Also clear any lingering global streaming content that might cause voice conflicts
  if (window.__streamingContent) {
    console.log('[Message] Clearing lingering streaming content to prevent voice conflicts');
    window.__streamingContent = '';
    window.__streamingMessageId = null;
    window.__isStreaming = false;
  }
};

// Export function to check if message was spoken (for debugging)
export const wasMessageSpoken = (messageId) => {
  return spokenMessageIds.has(messageId);
};

// Keyframe animation for pulse effect
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

// Styled component for thinking section
const ThinkingSection = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(138, 180, 248, 0.08)',
  border: '1px solid rgba(138, 180, 248, 0.2)',
  borderRadius: '12px',
  padding: '12px 16px',
  marginBottom: '16px',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-1px',
    left: '-1px',
    right: '-1px',
    bottom: '-1px',
    background: 'linear-gradient(45deg, rgba(138, 180, 248, 0.2) 0%, rgba(171, 196, 255, 0.1) 100%)',
    borderRadius: '12px',
    zIndex: -1,
  },
}));

// Styled component for expand button
const ExpandButton = styled(IconButton)(({ theme }) => ({
  transition: 'transform 0.3s ease',
  marginLeft: '8px',
  padding: '4px',
  color: 'rgba(138, 180, 248, 0.8)',
  '&:hover': {
    backgroundColor: 'rgba(138, 180, 248, 0.1)',
  },
}));

// Styled component for code block container
const CodeBlock = styled(Box)({
  position: 'relative',
  margin: '1rem 0',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#1e1e1e',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    '& .copy-button': {
      opacity: 1,
      visibility: 'visible',
    },
    '& .code-language': {
      opacity: 1,
    }
  },
  '& pre': {
    margin: 0,
    padding: '1.5rem 1rem 1rem',
    fontSize: '0.9em',
    lineHeight: 1.5,
    backgroundColor: 'transparent !important',
  },
  '& code': {
    fontFamily: '"Fira Code", "Fira Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
  },
});

// Inline styles
const styles = {
  container: (role) => ({
    display: 'flex',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
    padding: '8px 24px',
    gap: '12px',
    position: 'relative',
    alignItems: 'flex-start',
    '&:hover .message-actions': {
      opacity: 1,
    }
  }),
  messageWrapper: {
    maxWidth: '85%', // Increased from 70% to 85% to allow more space for long-form content like stories
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  avatar: (role) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: role === 'user' ? '#7c3aed' : '#252525',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    color: 'white',
    order: role === 'user' ? 2 : 1,
    '& img': {
      width: '24px',
      height: '24px',
      objectFit: 'contain'
    }
  }),
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarLetter: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1,
  },
  messageBubble: (role) => ({
    backgroundColor: role === 'user' ? '#7c3aed' : '#2A2A2A',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    padding: role === 'user' ? '12px 18px' : '12px 18px', // Same padding for both user and assistant messages
    wordBreak: 'break-word',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    color: '#FFFFFF',
  }),
  messageContent: {
    fontSize: '15px',
    lineHeight: 1.6,
    wordBreak: 'break-word', // Ensure long words wrap properly
    overflowWrap: 'break-word', // Additional word wrapping support
    hyphens: 'auto', // Enable hyphenation for better text flow
    maxWidth: '100%', // Ensure content doesn't overflow container
    '& p': {
      margin: 0,
      marginBottom: '8px',
      '&:last-child': {
        marginBottom: 0,
      },
    },
    '& pre': {
      borderRadius: '8px',
      overflow: 'auto',
      backgroundColor: '#1e1e1e',
      padding: '16px',
      fontSize: '14px',
      lineHeight: 1.5,
      margin: '8px 0',
    },
    '& code': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.9em',
      fontFamily: '"Fira Code", "Fira Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
    },
    '& ul, & ol': {
      paddingLeft: '24px',
      margin: '8px 0',
    },
    '& li': {
      marginBottom: '4px',
    },
    '& blockquote': {
      borderLeft: '4px solid #666',
      margin: '1em 0',
      padding: '0.5em 0 0.5em 1em',
      color: '#AAA',
      fontStyle: 'italic',
    },
    '& h1, & h2, & h3': {
      marginTop: '16px',
      marginBottom: '8px',
      fontWeight: 600,
    },
    '& h1': { fontSize: '1.5em' },
    '& h2': { fontSize: '1.3em' },
    '& h3': { fontSize: '1.1em' },
  },
  messageActions: {
    position: 'absolute',
    top: '-32px',
    right: '0',
    display: 'flex',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    backgroundColor: '#1E1E1E',
    borderRadius: '4px',
    padding: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  timestamp: (role) => ({
    fontSize: '11px',
    color: '#888888',
    marginTop: '4px',
    textAlign: role === 'user' ? 'right' : 'left',
  }),
};

const Message = React.memo(({ message, onDelete }) => {
  const theme = useTheme();
  const muiTheme = useMuiTheme();
  const { profile, companionMode } = useApp();
  const [copyStatus, setCopyStatus] = useState({});
  const [downloadStatus, setDownloadStatus] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAutoSpeaking, setIsAutoSpeaking] = useState(false);
  const hasBeenSpokenRef = useRef(false);
  
  // Ensure message has required properties
  const safeMessage = React.useMemo(() => ({
    id: message.id || `msg-${Date.now()}`,
    role: message.role || 'assistant',
    content: message.content || '',
    timestamp: message.timestamp || new Date().toISOString(),
    ...message
  }), [message]);
  
  // Debug image URL
  React.useEffect(() => {
    if (safeMessage.imageUrl) {
      console.log('[Message] Message has imageUrl:', safeMessage.imageUrl, 'for message:', safeMessage.id);
    }
  }, [safeMessage.imageUrl, safeMessage.id]);
  
  // Use streaming content hook to get live updates
  const { streamingContent, isStreamingMessage } = useStreamingContent(safeMessage.id);
  
  // Debug logging
  if (safeMessage.role === 'assistant') {
    console.log('[Message] Rendering assistant message:', {
      id: safeMessage.id,
      isStreamingMessage,
      streamingContentLength: streamingContent?.length || 0,
      messageContentLength: safeMessage.content?.length || 0,
      windowStreamingId: window.__streamingMessageId,
      windowIsStreaming: window.__isStreaming
    });
  }
  
  // Use streaming content if this is the actively streaming message, otherwise use message content
  // Also check if message has isStreaming flag set
  const displayContent = React.useMemo(() => {
    if (isStreamingMessage || safeMessage.isStreaming) {
      // For streaming messages, use the streaming content or fall back to message content
      return streamingContent || safeMessage.content || '';
    }
    // For non-streaming messages, use the message content
    return safeMessage.content || '';
  }, [isStreamingMessage, safeMessage.isStreaming, streamingContent, safeMessage.content]);
  
  // Debug what we're displaying
  React.useEffect(() => {
    if (safeMessage.role === 'assistant') {
      console.log('[Message] Display update:', {
        id: safeMessage.id,
        isStreamingMessage,
        messageIsStreaming: safeMessage.isStreaming,
        displayContentLength: displayContent?.length || 0,
        preview: displayContent?.substring(0, 100),
        streamingContentLength: streamingContent?.length || 0,
        messageContentLength: safeMessage.content?.length || 0
      });
    }
  }, [displayContent, isStreamingMessage, safeMessage.id, safeMessage.role, safeMessage.isStreaming, streamingContent, safeMessage.content]);
  
  // Auto-speak for assistant messages in companion mode
  React.useEffect(() => {
    // Only trigger voice for assistant messages in companion mode
    if (safeMessage.role === 'assistant' && companionMode && displayContent && !hasBeenSpokenRef.current) {
      // Check if this message has already been spoken globally
      if (spokenMessageIds.has(safeMessage.id)) {
        console.log('[Message] Message already spoken globally, skipping:', safeMessage.id);
        hasBeenSpokenRef.current = true;
        return;
      }
      
      // CRITICAL: Validate that displayContent is actually for THIS message
      // Don't speak cached content from previous messages
      const isValidContent = displayContent === safeMessage.content || 
                           (isStreamingMessage && window.__streamingMessageId === safeMessage.id);
      
      if (!isValidContent) {
        console.log('[Message] Skipping voice - content validation failed:', {
          messageId: safeMessage.id,
          isStreamingMessage,
          streamingMessageId: window.__streamingMessageId,
          contentMatch: displayContent === safeMessage.content
        });
        return;
      }
      
      // Check voice settings for wait-for-complete preference
      const voiceSettings = JSON.parse(localStorage.getItem('sephia_voice_settings') || '{}');
      const waitForComplete = voiceSettings.waitForCompleteResponse !== false; // Default to true
      
      // Only start voice when streaming is complete or content has enough words
      const wordCount = displayContent.split(/\s+/).filter(word => word.length > 0).length;
      const isStreamingComplete = !isStreamingMessage && !safeMessage.isStreaming;
      
      // Trigger voice based on settings
      const shouldSpeak = waitForComplete 
        ? isStreamingComplete  // Wait for complete response
        : (isStreamingComplete || wordCount >= 10); // Allow early speaking with 10+ words
      
      if (shouldSpeak) {
        console.log('[Message] Auto-speaking for companion mode:', {
          messageId: safeMessage.id,
          isStreamingComplete,
          wordCount,
          contentPreview: displayContent.substring(0, 100),
          globalSpokenCount: spokenMessageIds.size
        });
        
        // Mark as spoken both locally and globally to prevent duplicate attempts
        hasBeenSpokenRef.current = true;
        spokenMessageIds.add(safeMessage.id);
        setIsAutoSpeaking(true);
        
        // Clean text for speech
        let textToSpeak = displayContent;
        
        // Remove thinking tags - more aggressive removal
        textToSpeak = textToSpeak.replace(/<think>[\s\S]*?<\/think>/gi, '');
        textToSpeak = textToSpeak.replace(/<think[\s\S]*?<\/think>/gi, '');
        textToSpeak = textToSpeak.replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/gi, '');
        
        // Remove any remaining think content that might be malformed
        textToSpeak = textToSpeak.replace(/^<think>.*$/gm, '');
        textToSpeak = textToSpeak.replace(/^.*<think>.*$/gm, '');
        textToSpeak = textToSpeak.replace(/^.*<\/think>.*$/gm, '');
        
        // If it's HTML content, extract text
        if (textToSpeak.includes('<') && textToSpeak.includes('>')) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = textToSpeak;
          textToSpeak = tempDiv.textContent || tempDiv.innerText || '';
        }
        
        // Clean up markdown syntax
        textToSpeak = textToSpeak
          .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
          .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic
          .replace(/#+\s/g, '') // Remove headers
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
          .trim();
        
        if (textToSpeak && textToSpeak.length > 0) {
          console.log('[Message] Starting auto-speak for text:', textToSpeak.substring(0, 100));
          console.log('[Message] FULL TEXT TO SPEAK:', textToSpeak);
          console.log('[Message] TEXT LENGTH:', textToSpeak.length);
          
          voiceService.speak(textToSpeak, {
            onStart: () => {
              console.log('[Message] Auto-speak started for message:', safeMessage.id);
            },
            onEnd: () => {
              console.log('[Message] Auto-speak ended for message:', safeMessage.id);
              setIsAutoSpeaking(false);
            },
            onError: (error) => {
              console.error('[Message] Auto-speak error for message:', safeMessage.id, error);
              setIsAutoSpeaking(false);
              // Remove from spoken set on error so it can be retried
              spokenMessageIds.delete(safeMessage.id);
              hasBeenSpokenRef.current = false;
            }
          }).catch(error => {
            console.error('[Message] Auto-speak failed for message:', safeMessage.id, error);
            setIsAutoSpeaking(false);
            // Remove from spoken set on error so it can be retried
            spokenMessageIds.delete(safeMessage.id);
            hasBeenSpokenRef.current = false;
          });
        } else {
          setIsAutoSpeaking(false);
          // Remove from spoken set if no text to speak
          spokenMessageIds.delete(safeMessage.id);
          hasBeenSpokenRef.current = false;
        }
      }
    }
  }, [displayContent, safeMessage.role, companionMode, isStreamingMessage, safeMessage.isStreaming, safeMessage.id]);
  
  const isUser = safeMessage.role === 'user';
  
  // Get style with theme support
  const getStyle = (styleFunc, ...args) => {
    if (typeof styleFunc === 'function') {
      return styleFunc(...args);
    }
    return styleFunc;
  };
  
  const handleCopyCode = (code, index) => {
    copyToClipboard(code)
      .then(() => {
        setCopyStatus(prev => ({ ...prev, [index]: true }));
        setTimeout(() => {
          setCopyStatus(prev => ({ ...prev, [index]: false }));
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
      });
  };
  
  const handleCopyMessage = () => {
    // If the message contains HTML, we need to extract text content
    let contentToCopy = displayContent;
    
    // If it's HTML content, create a temporary element to extract text
    if (contentToCopy.includes('<') && contentToCopy.includes('>')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentToCopy;
      contentToCopy = tempDiv.textContent || tempDiv.innerText || '';
    }
    
    copyToClipboard(contentToCopy.trim())
      .then(() => {
        setCopyStatus(prev => ({ ...prev, message: true }));
        setTimeout(() => {
          setCopyStatus(prev => ({ ...prev, message: false }));
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy message:', err);
      });
  };

  const handleSpeakMessage = async () => {
    // Check if voice is enabled
    const savedSettings = localStorage.getItem('sephia_voice_settings');
    let voiceEnabled = true;
    let ttsProvider = 'browser';
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        voiceEnabled = parsed.voiceEnabled !== false;
        ttsProvider = parsed.voiceSynthesisProvider || parsed.ttsProvider || 'browser';
      } catch (e) {
        console.error('Failed to load voice settings:', e);
      }
    }
    
    if (!voiceEnabled) {
      alert('Voice features are disabled. Enable them in Settings → Voice.');
      return;
    }
    
    if (isSpeaking) {
      // Stop speaking - but be very conservative with Bark
      try {
        console.log('[Message] 🛑 Manual stop requested');
        await voiceService.stop();
        // Give Bark time to clean up properly
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error stopping speech:', error);
      }
      setIsSpeaking(false);
    } else {
      // Start speaking
      try {
        // Extract text content from the message
        let textToSpeak = displayContent;
        
        // Remove thinking tags - more aggressive removal (same as auto-voice)
        textToSpeak = textToSpeak.replace(/<think>[\s\S]*?<\/think>/gi, '');
        textToSpeak = textToSpeak.replace(/<think[\s\S]*?<\/think>/gi, '');
        textToSpeak = textToSpeak.replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/gi, '');
        
        // Remove any remaining think content that might be malformed
        textToSpeak = textToSpeak.replace(/^<think>.*$/gm, '');
        textToSpeak = textToSpeak.replace(/^.*<think>.*$/gm, '');
        textToSpeak = textToSpeak.replace(/^.*<\/think>.*$/gm, '');
        
        // If it's HTML content, extract text
        if (textToSpeak.includes('<') && textToSpeak.includes('>')) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = textToSpeak;
          textToSpeak = tempDiv.textContent || tempDiv.innerText || '';
        }
        
        // Clean up markdown syntax
        textToSpeak = textToSpeak
          .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
          .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic
          .replace(/#+\s/g, '') // Remove headers
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
          .trim();
        
        if (!textToSpeak) {
          console.warn('No text to speak');
          return;
        }
        
        setIsSpeaking(true);
        
        console.log('[Message] 🎤 Starting speech with provider:', voiceService.currentProvider);
        console.log('[Message] Text to speak:', textToSpeak.substring(0, 100) + '...');
        
        await voiceService.speak(textToSpeak, {
          onStart: () => {
            console.log('[Message] ✅ Started speaking');
            if (ttsProvider === 'bark') {
              console.log('[Message] 🐕 Using Bark AI voice');
            } else {
              console.log('[Message] 🔊 Using browser voice');
            }
          },
          onEnd: () => {
            setIsSpeaking(false);
            console.log('[Message] ✅ Finished speaking');
          },
          onError: (error) => {
            console.error('[Message] ❌ Speech error:', error);
            setIsSpeaking(false);
            
            // More helpful error messages
            let errorMessage = 'Text-to-speech error: ';
            if (error.message && error.message.includes('models not loaded')) {
              errorMessage = 'Bark AI models are still loading. Try again in a few minutes, or switch to Browser TTS in Settings.';
            } else if (error.message && error.message.includes('server not running')) {
              errorMessage = 'Bark AI server is not running. Voice will use browser TTS instead.';
            } else {
              errorMessage += error.message || 'Unknown error occurred';
            }
            
            alert(errorMessage);
          }
        });
      } catch (error) {
        console.error('Failed to speak message:', error);
        setIsSpeaking(false);
      }
    }
  };
  
  const handleCopyImage = async (imageUrl) => {
    try {
      console.log('[Message] Copying image from URL:', imageUrl);
      
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      
      // Check if we're in Electron
      if (window.electron && window.electron.copyImageToClipboard) {
        // Use Electron API to copy image
        const buffer = await blob.arrayBuffer();
        const result = await window.electron.copyImageToClipboard(buffer);
        if (result) {
          setCopyStatus(prev => ({ ...prev, image: true }));
          setTimeout(() => {
            setCopyStatus(prev => ({ ...prev, image: false }));
          }, 2000);
        } else {
          throw new Error('Failed to copy image to clipboard');
        }
      } else if (navigator.clipboard && window.ClipboardItem) {
        // Use web clipboard API
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        
        setCopyStatus(prev => ({ ...prev, image: true }));
        setTimeout(() => {
          setCopyStatus(prev => ({ ...prev, image: false }));
        }, 2000);
      } else {
        // Fallback: Copy the image URL instead
        await copyToClipboard(imageUrl);
        setCopyStatus(prev => ({ ...prev, image: true }));
        setTimeout(() => {
          setCopyStatus(prev => ({ ...prev, image: false }));
        }, 2000);
        console.log('[Message] Copied image URL as fallback');
      }
    } catch (error) {
      console.error('[Message] Failed to copy image:', error);
      // Try to copy the URL as a fallback
      try {
        await copyToClipboard(imageUrl);
        setCopyStatus(prev => ({ ...prev, image: true }));
        setTimeout(() => {
          setCopyStatus(prev => ({ ...prev, image: false }));
        }, 2000);
        console.log('[Message] Copied image URL as fallback');
      } catch (fallbackError) {
        console.error('[Message] Failed to copy even URL:', fallbackError);
        alert('Failed to copy image. Try right-clicking and selecting "Copy Image".');
      }
    }
  };

  const handleDownloadImage = async (imageUrl) => {
    try {
      console.log('[Message] Downloading image from URL:', imageUrl);
      setDownloadStatus(true);
      
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      
      // Check if we're in Electron environment
      if (window.electron && window.electron.saveImageDialog) {
        // Use Electron's save dialog
        const buffer = await blob.arrayBuffer();
        const result = await window.electron.saveImageDialog(buffer, 'sephia-image.png');
        if (result) {
          console.log('[Message] Image saved successfully via Electron');
        } else {
          console.log('[Message] User cancelled save dialog');
        }
      } else {
        // Use browser download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `sephia-image-${timestamp}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        console.log('[Message] Image downloaded via browser');
      }
      
      // Reset download status after delay
      setTimeout(() => {
        setDownloadStatus(false);
      }, 2000);
      
    } catch (error) {
      console.error('[Message] Failed to download image:', error);
      alert('Failed to download image. Please try again.');
      setDownloadStatus(false);
    }
  };

  const handleDownloadVideo = async (videoUrl) => {
    try {
      console.log('[Message] Downloading video from URL:', videoUrl);
      setDownloadStatus(true);
      
      // Fetch the video
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      
      const blob = await response.blob();
      
      // Check if we're in Electron environment
      if (window.electron && window.electron.saveVideoDialog) {
        // Use Electron's save dialog for video
        const buffer = await blob.arrayBuffer();
        const result = await window.electron.saveVideoDialog(buffer, 'sephia-video.webp');
        if (result) {
          console.log('[Message] Video saved successfully via Electron');
        } else {
          console.log('[Message] User cancelled save dialog');
        }
      } else {
        // Use browser download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `sephia-video-${timestamp}.webp`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        console.log('[Message] Video downloaded via browser');
      }
      
      // Reset download status after delay
      setTimeout(() => {
        setDownloadStatus(false);
      }, 2000);
      
    } catch (error) {
      console.error('[Message] Failed to download video:', error);
      alert('Failed to download video. Please try again.');
      setDownloadStatus(false);
    }
  };
  
  // Custom renderer for code blocks
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      const codeString = String(children).replace(/\n$/, '');
      const codeIndex = Math.floor(Math.random() * 1000); // Simple unique ID for each code block
      
      if (!inline) {
        return (
          <CodeBlock theme={theme} className="code-block">
            <div style={{ position: 'relative' }}>
              <div 
                className="code-language"
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  color: '#fff',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderBottomLeftRadius: '4px',
                  borderTopRightRadius: '8px',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                  zIndex: 2,
                }}
              >
                {language}
              </div>
              <SyntaxHighlighter
                style={atomDark}
                language={language}
                PreTag="div"
                wrapLines={true}
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  padding: '2.5rem 1rem 1rem',
                  fontSize: '0.9em',
                  lineHeight: 1.5,
                  backgroundColor: 'transparent',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: '\'Fira Code\', \'Fira Mono\', Menlo, Monaco, Consolas, "Courier New", monospace',
                    lineHeight: 1.5,
                  },
                }}
                {...props}
              >
                {codeString}
              </SyntaxHighlighter>
              <Tooltip 
                title={copyStatus[codeIndex] ? 'Copied!' : 'Copy code'}
                placement="left"
                arrow
              >
                <IconButton 
                  className="copy-button"
                  size="small"
                  aria-label="Copy code"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode(codeString, codeIndex);
                  }}
                  sx={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    opacity: 0,
                    visibility: 'hidden',
                    transition: 'all 0.2s ease',
                    color: '#ffffff',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    width: '32px',
                    height: '32px',
                    '&:hover, &:focus-visible': {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)',
                      '& .MuiSvgIcon-root': {
                        transform: 'scale(1.1)',
                      }
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                    }
                  }}
                >
                  {copyStatus[codeIndex] ? (
                    <CheckIcon 
                      fontSize="inherit" 
                      sx={{ 
                        color: '#4caf50',
                        filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.8))',
                        animation: `${pulse} 0.5s ease-in-out`,
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }} 
                    />
                  ) : (
                    <CopyIcon 
                      fontSize="inherit"
                      sx={{
                        color: '#fff',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          </CodeBlock>
        );
      }
      
      // Inline code
      return (
        <code 
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.9em',
            fontFamily: '"Fira Code", "Fira Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    p: ({ children }) => <p style={{ 
      marginBottom: '1em', 
      lineHeight: 1.6, 
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      maxWidth: '100%'
    }}>{children}</p>,
    ul: ({ children }) => <ul style={{ marginBottom: '1em', paddingLeft: '1.5em' }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ marginBottom: '1em', paddingLeft: '1.5em' }}>{children}</ol>,
    li: ({ children }) => <li style={{ marginBottom: '0.5em' }}>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote style={{
        borderLeft: '4px solid #666',
        margin: '1em 0',
        padding: '0.5em 0 0.5em 1em',
        color: '#AAA',
        fontStyle: 'italic',
        whiteSpace: 'pre-wrap' // Preserve whitespace in quotes
      }}>
        {children}
      </blockquote>
    ),
    h1: ({ children }) => <h1 style={{ fontSize: '1.5em', fontWeight: 600, marginBottom: '0.5em' }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: '1.3em', fontWeight: 600, marginBottom: '0.5em' }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: '1.1em', fontWeight: 600, marginBottom: '0.5em' }}>{children}</h3>,
    strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
    em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
    hr: () => <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '1.5em 0' }} />,
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          color: '#FF643D', 
          textDecoration: 'none',
          borderBottom: '1px dotted #FF643D',
          '&:hover': {
            borderBottomStyle: 'solid'
          }
        }}
      >
        {children}
      </a>
    ),
    table: ({ children }) => (
      <table style={{ 
        borderCollapse: 'collapse', 
        margin: '1em 0',
        fontSize: '0.9em'
      }}>
        {children}
      </table>
    ),
    thead: ({ children }) => <thead style={{ borderBottom: '2px solid #444' }}>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr style={{ borderBottom: '1px solid #333' }}>{children}</tr>,
    th: ({ children }) => (
      <th style={{ 
        padding: '0.5em 1em', 
        textAlign: 'left',
        fontWeight: 600
      }}>
        {children}
      </th>
    ),
    td: ({ children }) => <td style={{ padding: '0.5em 1em' }}>{children}</td>
  };

  // Parse content to extract thinking and answer sections
  const parseThinkingContent = (content) => {
    if (!content || typeof content !== 'string') {
      return {
        hasThinking: false,
        thinking: null,
        answer: content || '',
        isComplete: true
      };
    }
    
    // Check for complete thinking tags - be more flexible with whitespace and formats
    const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
    const altThinkRegex = /<think>([\s\S]*?)think>/i; // Handle malformed closing tags
    
    let match = content.match(thinkRegex);
    if (!match) {
      match = content.match(altThinkRegex);
    }
    
    if (match) {
      const thinkingContent = match[1].trim();
      const answerContent = content.replace(match[0], '').trim();
      
      console.log('[Message] Thinking content parsed (tagged):', {
        hasThinking: true,
        thinkingLength: thinkingContent.length,
        answerLength: answerContent.length,
        answerPreview: answerContent.substring(0, 50)
      });
      
      return {
        hasThinking: true,
        thinking: thinkingContent,
        answer: answerContent,
        isComplete: true
      };
    }
    
    // Check for incomplete thinking tag (still streaming)
    const incompleteThinkMatch = content.match(/<think>([\s\S]*)/i);
    if (incompleteThinkMatch && (isStreamingMessage || safeMessage.isStreaming)) {
      const thinkingContent = incompleteThinkMatch[1].trim();
      return {
        hasThinking: true,
        thinking: thinkingContent + '...',
        answer: '', // No answer yet while thinking
        isComplete: false
      };
    }
    
    // NEW: Check for untagged thinking content followed by actual story/response
    // Look for patterns that indicate AI reasoning followed by actual content
    // Enhanced pattern to catch more thinking indicators and story markers
    const untaggedThinkingPattern = /^(Okay, the user|Let me start by thinking|I need to|I should|Since .+ didn't specify|Let me think about|Looking at this|The user .+ wants|I'll start by considering|Maybe something|I should start|Conflict is important|Make sure)([\s\S]*?)(\*\*[^*]+\*\*|#{1,6}\s|Title:|Story:|Response:|Here's|Let me provide|Based on|^\s*\*\*)/im;
    const untaggedMatch = content.match(untaggedThinkingPattern);
    
    console.log('[Message] Checking untagged thinking pattern:', {
      contentStart: content.substring(0, 100),
      patternMatched: !!untaggedMatch,
      matchDetails: untaggedMatch ? {
        fullMatch: untaggedMatch[0].substring(0, 100),
        startPattern: untaggedMatch[1],
        endPattern: untaggedMatch[3]
      } : null
    });
    
    if (untaggedMatch) {
      // Extract the thinking part (everything before the actual content)
      const thinkingStart = untaggedMatch[0];
      const thinkingEnd = untaggedMatch[3];
      const thinkingPortion = content.substring(0, content.indexOf(thinkingEnd));
      const answerPortion = content.substring(content.indexOf(thinkingEnd)).trim();
      
      console.log('[Message] Thinking content parsed (untagged):', {
        hasThinking: true,
        thinkingLength: thinkingPortion.length,
        answerLength: answerPortion.length,
        answerPreview: answerPortion.substring(0, 50),
        detectedPattern: untaggedMatch[1]
      });
      
      return {
        hasThinking: true,
        thinking: thinkingPortion.trim(),
        answer: answerPortion,
        isComplete: true
      };
    }
    
    // Alternative pattern: Look for planning language followed by story content
    // Enhanced to catch the specific pattern from the user's example
    const planningPattern = /(.*?)(\*\*[^*]+\*\*|Title:\s*[^\n]+|^[A-Z][^.]*?story[^.]*?\.|^\s*\*\*)/im;
    const planningMatch = content.match(planningPattern);
    
    console.log('[Message] Planning pattern check:', {
      hasMatch: !!planningMatch,
      contentPreview: content.substring(0, 200),
      planningTextLength: planningMatch ? planningMatch[1].length : 0
    });
    
    if (planningMatch && planningMatch[1].length > 100) {
      // If there's substantial planning text before the story
      const planningText = planningMatch[1].trim();
      const storyContent = (planningMatch[2] + planningMatch[3]).trim();
      
      // Check if the planning text contains thinking indicators
      const hasThinkingIndicators = /\b(I need|I should|maybe|let me|perhaps|I'll|since.*didn't specify|I want to|the user|alexandra|conflict is important|make sure|outline|structure)\b/gi.test(planningText);
      
      console.log('[Message] Planning text analysis:', {
        planningLength: planningText.length,
        storyLength: storyContent.length,
        hasThinkingIndicators,
        planningPreview: planningText.substring(0, 100),
        storyPreview: storyContent.substring(0, 100)
      });
      
      if (hasThinkingIndicators) {
        console.log('[Message] Thinking content parsed (planning pattern):', {
          hasThinking: true,
          thinkingLength: planningText.length,
          answerLength: storyContent.length,
          answerPreview: storyContent.substring(0, 50)
        });
        
        return {
          hasThinking: true,
          thinking: planningText,
          answer: storyContent,
          isComplete: true
        };
      }
    }
    
    return {
      hasThinking: false,
      thinking: null,
      answer: content,
      isComplete: true
    };
  };

  const renderContent = () => {
    console.log('Message.renderContent - START', {
      displayContent: displayContent?.substring(0, 100),
      displayContentLength: displayContent?.length || 0,
      role: safeMessage.role,
      messageId: safeMessage.id,
      isStreamingMessage,
      messageIsStreaming: safeMessage.isStreaming,
      streamingContent: streamingContent?.substring(0, 100),
      streamingContentLength: streamingContent?.length || 0,
      originalContent: safeMessage.content?.substring(0, 100),
      originalContentLength: safeMessage.content?.length || 0
    });
    
    // Enhanced logging for long content (like stories)
    if (displayContent && displayContent.length > 3000) {
      console.log('[Message] 📖 Long content detected:', {
        messageId: safeMessage.id,
        totalLength: displayContent.length,
        isComplete: !isStreamingMessage && !safeMessage.isStreaming,
        contentType: displayContent.includes('<think>') ? 'thinking+response' : 'response-only',
        preview: displayContent.substring(0, 200) + '...',
        ending: '...' + displayContent.substring(displayContent.length - 200)
      });
    }
    
    // Handle empty or undefined content
    if (!displayContent || displayContent.trim() === '') {
      console.log('[Message] renderContent - empty content, isStreaming:', isStreamingMessage, 'messageIsStreaming:', safeMessage.isStreaming);
      if (isStreamingMessage || safeMessage.isStreaming) {
        return (
          <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </span>
            Thinking...
          </span>
        );
      }
      // Don't return null for assistant messages - show a placeholder
      if (safeMessage.role === 'assistant') {
        return <span style={{ color: '#888' }}>No content</span>;
      }
      return null;
    }
    
    try {
      // Cache parsing results to prevent redundant processing, but don't cache streaming content
      const isCurrentlyStreaming = isStreamingMessage || safeMessage.isStreaming;
      const cacheKey = `${safeMessage.id}-${displayContent.length}-${isCurrentlyStreaming ? 'streaming' : 'complete'}`;
      let parsed = Message._parseCache?.get(cacheKey);
      
      // Don't use cache for streaming content to ensure real-time updates
      if (!parsed || isCurrentlyStreaming) {
        parsed = parseThinkingContent(displayContent);
        if (!isCurrentlyStreaming) {
          // Only cache complete (non-streaming) content
          if (!Message._parseCache) {
            Message._parseCache = new Map();
          }
          Message._parseCache.set(cacheKey, parsed);
          
          // Clear any old streaming cache entries for this message
          if (Message._parseCache) {
            for (const key of Message._parseCache.keys()) {
              if (key.startsWith(`${safeMessage.id}-`) && key.includes('streaming')) {
                Message._parseCache.delete(key);
              }
            }
          }
          
          // Limit cache size to prevent memory leaks
          if (Message._parseCache.size > 100) {
            const firstKey = Message._parseCache.keys().next().value;
            Message._parseCache.delete(firstKey);
          }
        }
      }
      
      const { hasThinking, thinking, answer } = parsed;
      console.log('Message.renderContent - parsed:', { hasThinking, thinkingLength: thinking?.length, answerLength: answer?.length });
      
      // Render thinking section if present
      const renderThinkingSection = () => {
        if (!hasThinking || !thinking) return null;
        
        return (
          <ThinkingSection>
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: thinkingExpanded ? '12px' : '0' }}>
              <PsychologyIcon sx={{ color: 'rgba(138, 180, 248, 0.8)', marginRight: '8px', fontSize: '20px' }} />
              <Chip 
                label="Thinking Process" 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(138, 180, 248, 0.1)',
                  color: 'rgba(138, 180, 248, 1)',
                  border: '1px solid rgba(138, 180, 248, 0.2)',
                  fontSize: '0.75rem',
                  height: '24px',
                }} 
              />
              <ExpandButton
                onClick={() => setThinkingExpanded(!thinkingExpanded)}
                size="small"
                aria-label="expand thinking"
                style={{ transform: thinkingExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <ExpandMoreIcon fontSize="small" />
              </ExpandButton>
            </Box>
            <Collapse in={thinkingExpanded}>
              <Box sx={{ 
                color: 'rgba(200, 200, 200, 0.9)', 
                fontSize: '0.9em',
                lineHeight: 1.6,
                fontStyle: 'italic',
                paddingTop: '8px',
                borderTop: '1px solid rgba(138, 180, 248, 0.1)',
              }}>
                <ReactMarkdown 
                  components={components}
                  remarkPlugins={[remarkGfm]}
                >
                  {thinking}
                </ReactMarkdown>
              </Box>
            </Collapse>
          </ThinkingSection>
        );
      };
      
      // Only treat as HTML if it contains actual HTML tags, not just < or > characters
      const htmlTagRegex = /<\/?[a-zA-Z][\s\S]*?>/;
      const isHtml = htmlTagRegex.test(answer) && 
                     !answer.includes('```') && // Don't treat markdown code blocks as HTML
                     !answer.includes('<think>'); // Don't treat thinking tags as HTML
      
      // Render main content
      const renderMainContent = () => {
        console.log('Message.renderMainContent - isHtml:', isHtml, 'answer preview:', answer.substring(0, 100));
        
        // Handle voice-first mode display logic
        if (safeMessage.isPreparingVoice && !safeMessage.showContentNow) {
          return (
            <div style={{ 
              color: '#10B981', 
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              🎤 Preparing to speak...
            </div>
          );
        }
        
        // If answer is empty after removing thinking tags, show a placeholder
        if (!answer || answer.trim() === '') {
          if (isStreamingMessage) {
            return <span style={{ color: '#888' }}>Generating response...</span>;
          }
          return <span style={{ color: '#888' }}>No response content</span>;
        }
        
        if (isHtml) {
          // Check if this is email content from @gmail command
          const isEmailContent = answer.includes('From:') || answer.includes('Subject:') || answer.includes('Date:');
          // Check if this is web search content
          const isWebSearchContent = answer.includes('search results') || answer.includes('Search Results') || 
                                    (answer.includes('Title:') && answer.includes('URL:')) ||
                                    answer.includes('Web search for');
          // Check if this is Google Drive content
          const isDriveContent = answer.includes('Google Drive') || answer.includes('Drive files') || 
                               answer.includes('File:') || answer.includes('Modified:') ||
                               answer.includes('drive.google.com');
          // Check if this is calendar content
          const isCalendarContent = answer.includes('Calendar') || answer.includes('Event:') || 
                                  answer.includes('Start:') || answer.includes('End:') ||
                                  answer.includes('Location:') || answer.includes('Attendees:');
          
          if (isEmailContent) {
            // Parse email content and format nicely
            const emailEntries = answer.split(/(?=From:|Subject:|Date:)/).filter(entry => entry.trim());
            
            return (
              <div style={{ color: '#FFFFFF' }}>
                {emailEntries.map((email, index) => {
                  const cleanEmail = DOMPurify.sanitize(email, {
                    ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'u'],
                    ALLOWED_ATTR: []
                  }).replace(/style="[^"]*"/g, '');
                  
                  return (
                    <div 
                      key={index}
                      style={{
                        backgroundColor: 'rgba(66, 133, 244, 0.1)', // Gmail blue tint
                        border: '1px solid rgba(66, 133, 244, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: index < emailEntries.length - 1 ? '12px' : '0',
                        color: '#FFFFFF'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: cleanEmail }} />
                    </div>
                  );
                })}
              </div>
            );
          } else if (isWebSearchContent) {
            // Parse web search results
            const searchEntries = answer.split(/(?=Title:|URL:|Source:)/).filter(entry => entry.trim());
            
            return (
              <div style={{ color: '#FFFFFF' }}>
                {searchEntries.map((result, index) => {
                  const cleanResult = DOMPurify.sanitize(result, {
                    ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'u', 'a'],
                    ALLOWED_ATTR: ['href', 'target', 'rel']
                  }).replace(/style="[^"]*"/g, '');
                  
                  return (
                    <div 
                      key={index}
                      style={{
                        backgroundColor: 'rgba(52, 168, 83, 0.1)', // Google green tint
                        border: '1px solid rgba(52, 168, 83, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: index < searchEntries.length - 1 ? '12px' : '0',
                        color: '#FFFFFF'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: cleanResult }} />
                    </div>
                  );
                })}
              </div>
            );
          } else if (isDriveContent) {
            // Parse Google Drive content
            const driveEntries = answer.split(/(?=File:|Name:|Modified:|Created:)/).filter(entry => entry.trim());
            
            return (
              <div style={{ color: '#FFFFFF' }}>
                {driveEntries.map((file, index) => {
                  const cleanFile = DOMPurify.sanitize(file, {
                    ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'u', 'a'],
                    ALLOWED_ATTR: ['href', 'target', 'rel']
                  }).replace(/style="[^"]*"/g, '');
                  
                  return (
                    <div 
                      key={index}
                      style={{
                        backgroundColor: 'rgba(255, 193, 7, 0.1)', // Google Drive yellow tint
                        border: '1px solid rgba(255, 193, 7, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: index < driveEntries.length - 1 ? '12px' : '0',
                        color: '#FFFFFF'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: cleanFile }} />
                    </div>
                  );
                })}
              </div>
            );
          } else if (isCalendarContent) {
            // Parse calendar events
            const calendarEntries = answer.split(/(?=Event:|Title:|Start:|End:)/).filter(entry => entry.trim());
            
            return (
              <div style={{ color: '#FFFFFF' }}>
                {calendarEntries.map((event, index) => {
                  const cleanEvent = DOMPurify.sanitize(event, {
                    ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'u'],
                    ALLOWED_ATTR: []
                  }).replace(/style="[^"]*"/g, '');
                  
                  return (
                    <div 
                      key={index}
                      style={{
                        backgroundColor: 'rgba(234, 67, 53, 0.1)', // Google Calendar red tint
                        border: '1px solid rgba(234, 67, 53, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: index < calendarEntries.length - 1 ? '12px' : '0',
                        color: '#FFFFFF'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: cleanEvent }} />
                    </div>
                  );
                })}
              </div>
            );
          } else {
            // Regular HTML content
            const cleanHTML = DOMPurify.sanitize(answer, {
              ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img'],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel']
            });
            
            if (cleanHTML.trim()) {
              return (
                <div 
                  style={{
                    color: '#FFFFFF',
                    backgroundColor: 'transparent'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: cleanHTML.replace(/style="[^"]*"/g, '').replace(/background[^;]*;?/gi, '')
                  }}
                />
              );
            } else {
              return <p>Unable to display content</p>;
            }
          }
        } else {
          // Render as Markdown
          console.log('Message.renderContent - Rendering as Markdown');
          console.log('[Message] 📝 Markdown content length:', answer.length);
          
          // Additional logging for very long content to help debug story truncation
          if (answer.length > 5000) {
            console.log('[Message] 📚 Very long content detected (likely a story):', {
              messageId: safeMessage.id,
              answerLength: answer.length,
              wordCount: answer.split(/\s+/).length,
              hasThinking: answer !== displayContent,
              isComplete: !isStreamingMessage && !safeMessage.isStreaming,
              firstLine: answer.split('\n')[0],
              lastLine: answer.split('\n').slice(-1)[0]
            });
          }
          
          return (
            <div style={{ 
              maxWidth: '100%', 
              wordBreak: 'break-word', 
              overflowWrap: 'break-word',
              width: '100%' // Ensure full width utilization
            }}>
              <ReactMarkdown 
                components={components}
                remarkPlugins={[remarkGfm]}
              >
                {answer}
              </ReactMarkdown>
            </div>
          );
        }
      };
      
      return (
        <>
          {renderThinkingSection()}
          {renderMainContent()}
          {/* Render video if present */}
          {safeMessage.videoUrl && (
            <Box sx={{ 
              marginTop: 2, 
              position: 'relative',
              display: 'inline-block',
              maxWidth: '768px',
              '&:hover .video-action-button': {
                opacity: 1,
                visibility: 'visible',
              }
            }}>
              <video 
                src={safeMessage.videoUrl} 
                controls
                autoPlay={false}
                loop={false}
                muted={false}
                style={{
                  width: '100%',
                  maxWidth: '768px',
                  height: 'auto',
                  display: 'block',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  backgroundColor: '#000'
                }}
                onError={(e) => {
                  console.error('[Message] Video failed to load:', {
                    src: e.target.src,
                    error: e.type,
                    message: e.message
                  });
                  e.target.style.display = 'none';
                }}
                onLoadedData={(e) => {
                  console.log('[Message] Video loaded successfully:', e.target.src);
                }}
              />
              
              {/* Video action buttons */}
              <Box className="video-action-button" sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 0.5,
                opacity: 0,
                visibility: 'hidden',
                transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '6px',
                padding: '4px'
              }}>
                
                {/* Download video button */}
                <Tooltip title="Download Video" arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleDownloadVideo(safeMessage.videoUrl)}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                      }
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {/* Render video frame sequence if present */}
          {safeMessage.isFrameSequence && safeMessage.videoFrames && (
            <Box sx={{ marginTop: 2 }}>
              <Box sx={{ 
                marginBottom: 2,
                padding: 2,
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#FFC107', fontWeight: 600, marginBottom: '8px' }}>
                  🎬 Video Generated ({safeMessage.videoFrames.length} frames)
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '14px', marginBottom: '12px' }}>
                  Your video has been generated as {safeMessage.videoFrames.length} individual frames. 
                  You can view them in sequence below, or use external tools to combine them into a video file.
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '13px', opacity: 0.8 }}>
                  💡 Tip: You can download all frames and use tools like FFmpeg to create an MP4: 
                  <code style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px', marginLeft: '4px' }}>
                    ffmpeg -framerate 6 -i frame_%05d.png output.mp4
                  </code>
                </div>
              </Box>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 1,
                maxHeight: '400px',
                overflowY: 'auto',
                padding: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px'
              }}>
                {safeMessage.videoFrames.map((frame, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    <img 
                      src={frame.url}
                      alt={`Frame ${index + 1}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        // Open frame in new tab for full view
                        window.open(frame.url, '_blank');
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      fontSize: '10px',
                      padding: '1px 4px',
                      borderRadius: '2px'
                    }}>
                      {index + 1}
                    </div>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Render image if present */}
          {safeMessage.imageUrl && (
            <Box sx={{ 
              marginTop: 2, 
              position: 'relative',
              display: 'inline-block',
              maxWidth: '512px',
              '&:hover .image-action-button': {
                opacity: 1,
                visibility: 'visible',
              }
            }}>
              <img 
                src={safeMessage.imageUrl} 
                alt="Generated image"
                style={{
                  width: '100%',
                  maxWidth: '512px',
                  height: 'auto',
                  display: 'block',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                onError={(e) => {
                  console.error('[Message] Image failed to load:', {
                    src: e.target.src,
                    error: e.type,
                    message: e.message
                  });
                  e.target.style.display = 'none';
                  e.target.alt = 'Failed to load image';
                }}
                onLoad={(e) => {
                  console.log('[Message] Image loaded successfully:', e.target.src);
                }}
              />
              {/* Copy Button */}
              <Tooltip 
                title={copyStatus.image ? 'Copied!' : 'Copy image'}
                placement="left"
                arrow
              >
                <IconButton 
                  className="image-action-button"
                  size="small"
                  aria-label="Copy image"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyImage(safeMessage.imageUrl);
                  }}
                  sx={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '3rem',
                    opacity: 0,
                    visibility: 'hidden',
                    transition: 'all 0.2s ease',
                    color: '#ffffff',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    width: '32px',
                    height: '32px',
                    '&:hover, &:focus-visible': {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)',
                      '& .MuiSvgIcon-root': {
                        transform: 'scale(1.1)',
                      }
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                    }
                  }}
                >
                  {copyStatus.image ? (
                    <CheckIcon 
                      fontSize="inherit" 
                      sx={{ 
                        color: '#4caf50',
                        filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.8))',
                        animation: `${pulse} 0.5s ease-in-out`,
                      }} 
                    />
                  ) : (
                    <CopyIcon 
                      fontSize="inherit"
                      sx={{
                        color: '#fff',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>
              
              {/* Download Button */}
              <Tooltip 
                title={downloadStatus ? 'Downloaded!' : 'Download image'}
                placement="left"
                arrow
              >
                <IconButton 
                  className="image-action-button"
                  size="small"
                  aria-label="Download image"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadImage(safeMessage.imageUrl);
                  }}
                  sx={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    opacity: 0,
                    visibility: 'hidden',
                    transition: 'all 0.2s ease',
                    color: '#ffffff',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    width: '32px',
                    height: '32px',
                    '&:hover, &:focus-visible': {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)',
                      '& .MuiSvgIcon-root': {
                        transform: 'scale(1.1)',
                      }
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                    }
                  }}
                >
                  {downloadStatus ? (
                    <CheckIcon 
                      fontSize="inherit" 
                      sx={{ 
                        color: '#4caf50',
                        filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.8))',
                        animation: `${pulse} 0.5s ease-in-out`,
                      }} 
                    />
                  ) : (
                    <DownloadIcon 
                      fontSize="inherit"
                      sx={{
                        color: '#fff',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </>
      );
    } catch (error) {
      console.error('Error rendering message content:', error);
      return <p>Error rendering message: {error.message}</p>;
    }
  };

  return (
    <div 
      style={{
        ...getStyle(styles.container, safeMessage.role),
        '&:hover .message-actions': {
          opacity: 1,
          visibility: 'visible'
        }
      }}
      className="message-container"
      onMouseEnter={(e) => {
        const actions = e.currentTarget.querySelector('.message-actions');
        if (actions) {
          actions.style.opacity = '1';
          actions.style.visibility = 'visible';
        }
      }}
      onMouseLeave={(e) => {
        const actions = e.currentTarget.querySelector('.message-actions');
        if (actions) {
          actions.style.opacity = '0'; // Hide when not hovering
          actions.style.visibility = 'hidden';
        }
      }}
    >
      {!isUser && (
        <div style={getStyle(styles.avatar, safeMessage.role)}>
          <BrainLightningIcon size={24} />
        </div>
      )}
      
      <div style={styles.messageWrapper}>
        <div style={{ position: 'relative' }} data-message-id={safeMessage.id}>
          <div style={getStyle(styles.messageBubble, safeMessage.role)}>
            <div style={styles.messageContent} className="message-content">
              {renderContent()}
              {(isStreamingMessage || safeMessage.isStreaming) && (
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '16px',
                  backgroundColor: isAutoSpeaking ? '#10B981' : '#a855f7', // Green for voice, purple for text
                  marginLeft: '4px',
                  animation: 'blink 1s infinite'
                }} />
              )}
              {isAutoSpeaking && (
                <span style={{
                  display: 'inline-block',
                  marginLeft: '8px',
                  fontSize: '12px',
                  color: '#10B981',
                  fontWeight: '500',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}>
                  🎤 Aria is speaking...
                </span>
              )}
              {companionMode && safeMessage.role === 'assistant' && !isAutoSpeaking && !(isStreamingMessage || safeMessage.isStreaming) && (
                <span style={{
                  display: 'inline-block',
                  marginLeft: '8px',
                  fontSize: '12px',
                  color: '#888',
                  fontWeight: '400'
                }}>
                  ✓ Voice ready
                </span>
              )}
            </div>
          </div>
          
          {/* Show action buttons for assistant messages - always visible */}
          {!isUser && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '6px',
              padding: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              opacity: 0, // Hide by default
              visibility: 'hidden', // Hide by default
              transition: 'all 0.2s ease',
            }} className="message-actions">
              <Box sx={{ display: 'flex', gap: '4px' }}>
                {/* Hide speaker icon for assistant messages when companion mode is on to prevent conflicts with auto-speak */}
                {!(message.sender === 'assistant' && companionMode) && (
                  <Tooltip title={isSpeaking ? 'Stop speaking' : 'Read aloud'} arrow>
                    <IconButton 
                      size="small" 
                      onClick={handleSpeakMessage}
                      sx={{
                        color: isSpeaking ? '#ef4444' : 'rgba(255, 255, 255, 0.8)',
                        backgroundColor: isSpeaking ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          color: isSpeaking ? '#dc2626' : 'rgba(255, 255, 255, 1)',
                          backgroundColor: isSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                        },
                      }}
                    >
                      {isSpeaking ? <StopIcon fontSize="small" /> : <SpeakerIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title={copyStatus.message ? 'Copied!' : 'Copy message'} arrow>
                  <IconButton 
                    size="small" 
                    onClick={handleCopyMessage}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    }}
                  >
                    {copyStatus.message ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                
                {onDelete && (
                  <Tooltip title="Delete message" arrow>
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(safeMessage.id);
                      }}
                      sx={{
                        color: muiTheme.palette.error.main,
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.2)',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </div>
          )}
        </div>
        
        {safeMessage.timestamp && (
          <div style={getStyle(styles.timestamp, safeMessage.role)}>
            {new Date(safeMessage.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
      
      {isUser && (
        <div style={getStyle(styles.avatar, safeMessage.role)}>
          {profile?.picture ? (
            <img 
              src={profile.picture} 
              alt={profile?.name || "User"} 
              style={styles.avatarImage} 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          
          {(!profile?.picture || safeMessage.role !== 'assistant') && (
            <div style={styles.avatarLetter}>
              {(profile?.name || "You").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if message content or id changes
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.role === nextProps.message.role &&
    prevProps.message.isStreaming === nextProps.message.isStreaming &&
    prevProps.onDelete === nextProps.onDelete
  );
});

export default Message;