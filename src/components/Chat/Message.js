import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ContentCopy as CopyIcon, Check as CheckIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, Psychology as PsychologyIcon } from '@mui/icons-material';
import { Tooltip, IconButton, Box, styled, keyframes, useTheme as useMuiTheme, Collapse, Chip } from '@mui/material';
import BrainIcon from './BrainIcon';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import copyToClipboard from '../../utils/clipboard';
import { useStreamingContent } from '../../hooks/useStreamingContent';

// Keyframe animation for pulse effect
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
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
    maxWidth: '70%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  avatar: (role) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: role === 'user' ? '#7c3aed' : '#FF643D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    color: 'white',
    order: role === 'user' ? 2 : 1,
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
    padding: role === 'user' ? '12px 18px' : '12px 48px 12px 18px', // Add right padding for assistant messages
    wordBreak: 'break-word',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    color: '#FFFFFF',
  }),
  messageContent: {
    fontSize: '15px',
    lineHeight: 1.6,
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
  const { profile } = useApp();
  const [copyStatus, setCopyStatus] = useState({});
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  
  // Ensure message has required properties
  const safeMessage = React.useMemo(() => ({
    id: message.id || `msg-${Date.now()}`,
    role: message.role || 'assistant',
    content: message.content || '',
    timestamp: message.timestamp || new Date().toISOString(),
    ...message
  }), [message]);
  
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
  const displayContent = (isStreamingMessage || safeMessage.isStreaming) ? (streamingContent || safeMessage.content) : safeMessage.content;
  
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
    p: ({ children }) => <p style={{ marginBottom: '1em', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{children}</p>,
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
    // Check for complete thinking tags
    const thinkRegex = /<think>([\s\S]*?)<\/think>/;
    const match = content.match(thinkRegex);
    
    if (match) {
      const thinkingContent = match[1].trim();
      const answerContent = content.replace(thinkRegex, '').trim();
      return {
        hasThinking: true,
        thinking: thinkingContent,
        answer: answerContent,
        isComplete: true
      };
    }
    
    // Check for incomplete thinking tag (still streaming)
    const incompleteThinkMatch = content.match(/<think>([\s\S]*)/);
    if (incompleteThinkMatch && (isStreamingMessage || safeMessage.isStreaming)) {
      const thinkingContent = incompleteThinkMatch[1].trim();
      return {
        hasThinking: true,
        thinking: thinkingContent + '...',
        answer: '', // No answer yet while thinking
        isComplete: false
      };
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
      const { hasThinking, thinking, answer } = parseThinkingContent(displayContent);
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
        
        // If answer is empty after removing thinking tags, show a placeholder
        if (!answer || answer.trim() === '') {
          if (isStreamingMessage) {
            return <span style={{ color: '#888' }}>Generating response...</span>;
          }
          return <span style={{ color: '#888' }}>No response content</span>;
        }
        
        if (isHtml) {
          // Sanitize and render HTML
          const cleanHTML = DOMPurify.sanitize(answer, {
            ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'style', 'class']
          });
          
          if (cleanHTML.trim()) {
            return parse(cleanHTML);
          } else {
            return <p>Unable to display content</p>;
          }
        } else {
          // Render as Markdown
          console.log('Message.renderContent - Rendering as Markdown');
          return (
            <ReactMarkdown 
              components={components}
              remarkPlugins={[remarkGfm]}
            >
              {answer}
            </ReactMarkdown>
          );
        }
      };
      
      return (
        <>
          {renderThinkingSection()}
          {renderMainContent()}
        </>
      );
    } catch (error) {
      console.error('Error rendering message content:', error);
      return <p>Error rendering message: {error.message}</p>;
    }
  };

  return (
    <div 
      style={getStyle(styles.container, safeMessage.role)}
      className="message-container">
      {!isUser && (
        <div style={getStyle(styles.avatar, safeMessage.role)}>
          <BrainIcon size={20} color="#FFFFFF" />
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
                  backgroundColor: '#a855f7',
                  marginLeft: '4px',
                  animation: 'blink 1s infinite'
                }} />
              )}
            </div>
          </div>
          
          {/* Show copy button for assistant messages */}
          {!isUser && (
            <div style={{
              ...getStyle(styles.messageActions),
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              padding: 0,
            }} className="message-actions">
              <Box sx={{ display: 'flex', gap: '4px' }}>
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