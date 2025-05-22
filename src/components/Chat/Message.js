import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ContentCopy as CopyIcon, Check as CheckIcon } from '@mui/icons-material';
import { Tooltip, IconButton, Box, styled } from '@mui/material';
import BrainIcon from './BrainIcon';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import copyToClipboard from '../../utils/clipboard';

// Styled component for code block container
const CodeBlock = styled(Box)(({ theme }) => ({
  position: 'relative',
  margin: '1rem 0',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[900],
  '&:hover .copy-button': {
    opacity: 1,
  },
}));

// Inline styles
const styles = {
  container: {
    display: 'flex',
    padding: '8px 16px',
    gap: '16px',
    position: 'relative',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(245, 245, 245, 0.125)',
    },
    '@media (max-width: 600px)': {
      padding: '4px 8px',
    },
  },
  avatar: (role) => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: role === 'user' ? '#1976d2' : '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    border: `2px solid ${role === 'user' ? '#1976d2' : '#e0e0e0'}`,
  }),
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarLetter: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  messageActions: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '2px',
    zIndex: 1,
  },
  messageBubble: (role) => ({
    position: 'relative',
    padding: '16px',
    borderRadius: '12px',
    maxWidth: '85%',
    wordWrap: 'break-word',
    lineHeight: 1.5,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    fontSize: '1rem',
    ...(role === 'user' 
      ? {
          backgroundColor: '#1976d2',
          color: 'white',
          marginLeft: 'auto',
          borderBottomRightRadius: '4px',
        }
      : {
          backgroundColor: '#f5f5f5',
          color: '#333',
          marginRight: 'auto',
          borderBottomLeftRadius: '4px',
        }),
    '@media (max-width: 600px)': {
      maxWidth: '90%',
      padding: '8px 16px',
      fontSize: '0.95em',
    },
  }),
  messageContent: {
    flex: 1,
    maxWidth: '100%',
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
  },
  codeBlock: {
    margin: '16px 0',
    borderRadius: '8px',
    overflow: 'auto',
    position: 'relative',
  },
};

// Helper to handle responsive styles
const getStyle = (styleObj, ...args) => {
  const baseStyle = typeof styleObj === 'function' ? styleObj(...args) : styleObj;
  const { '@media': mediaQueries, ...restStyle } = baseStyle;
  
  if (!mediaQueries) return restStyle;
  
  const mediaStyles = {};
  Object.entries(mediaQueries).forEach(([query, styles]) => {
    mediaStyles[`@media ${query}`] = styles;
  });
  
  return { ...restStyle, ...mediaStyles };
};


// Styled components removed in favor of inline styles

const Message = ({ message, isLastInGroup }) => {
  const { profile } = useApp();
  const { theme } = useTheme();
  const [copyStatus, setCopyStatus] = useState({});
  
  // Ensure message has required fields
  const safeMessage = React.useMemo(() => ({
    id: message?.id || `msg-${Date.now()}`,
    role: message?.role || 'assistant',
    content: message?.content || '',
    timestamp: message?.timestamp || new Date().toISOString(),
    ...(message || {})
  }), [message]);
  
  const isUser = safeMessage.role === 'user';
  
  // Debug logs
  React.useEffect(() => {
    console.log('Message component mounted/updated:', { 
      id: safeMessage.id, 
      role: safeMessage.role, 
      contentLength: safeMessage.content?.length || 0,
      hasContent: !!safeMessage.content,
      isUser,
      isLastInGroup
    });
    
    return () => {
      console.log('Message component unmounting:', { id: safeMessage.id });
    };
  }, [safeMessage, isUser, isLastInGroup]);
  
  const handleCopyCode = (code, index) => {
    copyToClipboard(String(code))
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
    let contentToCopy = message.content;
    
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
          <CodeBlock theme={theme}>
            <div style={{ position: 'relative' }}>
              <SyntaxHighlighter
                style={atomDark}
                language={language}
                PreTag="div"
                wrapLines={true}
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem 1rem 1rem',
                  fontSize: '0.9em',
                  lineHeight: 1.5,
                  backgroundColor: '#1e1e1e',
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
                  onClick={() => handleCopyCode(codeString, codeIndex)}
                  sx={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    color: 'text.secondary',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  {copyStatus[codeIndex] ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </div>
          </CodeBlock>
        );
      }
      
      // Inline code
      return (
        <code 
          className={className} 
          style={{
            backgroundColor: theme.colors.secondaryBg,
            padding: '0.2em 0.4em',
            borderRadius: theme.borderRadius.small,
            fontSize: '0.9em',
            fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
            color: '#f8f8f2',
          }} 
          {...props}
        >
          {children}
        </code>
      );
    },
    pre({ node, children, ...props }) {
      return (
        <div style={{ position: 'relative' }}>
          <pre style={{
            backgroundColor: '#1e1e1e',
            borderRadius: theme.borderRadius.medium,
            padding: '1rem',
            overflow: 'auto',
            margin: '1rem 0',
          }} {...props}>
            {children}
          </pre>
        </div>
      );
    },
    table({ node, children, ...props }) {
      return (
        <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
          <table style={{
            borderCollapse: 'collapse',
            width: '100%',
            border: `1px solid ${theme.colors.border}`,
          }} {...props}>
            {children}
          </table>
        </div>
      );
    },
    th({ node, children, ...props }) {
      return (
        <th style={{
          border: `1px solid ${theme.colors.border}`,
          padding: '0.5rem',
          textAlign: 'left',
          backgroundColor: theme.colors.secondaryBg,
        }} {...props}>
          {children}
        </th>
      );
    },
    td({ node, children, ...props }) {
      return (
        <td style={{
          border: `1px solid ${theme.colors.border}`,
          padding: '0.5rem',
        }} {...props}>
          {children}
        </td>
      );
    },
  };
  
  // Safely render message content
  const renderContent = () => {
    try {
      if (!safeMessage.content) {
        console.log('No content in message, showing loading state');
        return <p>Loading...</p>;
      }
      
      // Check if content appears to be HTML
      const isHtml = safeMessage.content.includes('<') && safeMessage.content.includes('>');
      
      if (isHtml) {
        console.log('Rendering HTML content');
        try {
          const sanitized = DOMPurify.sanitize(safeMessage.content);
          return parse(sanitized);
        } catch (htmlError) {
          console.error('Error parsing HTML content:', htmlError);
          return <div dangerouslySetInnerHTML={{ __html: safeMessage.content }} />;
        }
      } else {
        // Render as Markdown
        console.log('Rendering Markdown content');
        return (
          <ReactMarkdown 
            components={components}
            remarkPlugins={[]}
          >
            {safeMessage.content}
          </ReactMarkdown>
        );
      }
    } catch (error) {
      console.error('Error rendering message content:', error);
      return <p>Error rendering message: {error.message}</p>;
    }
  };

  return (
    <div style={getStyle(styles.container)} data-message-id={safeMessage.id} data-role={safeMessage.role}>
      <div style={getStyle(styles.avatar, safeMessage.role)}>
        {safeMessage.role === 'assistant' ? (
          <BrainIcon size={32} />
        ) : profile?.picture ? (
          <img 
            src={profile.picture} 
            alt={profile?.name || "User"} 
            style={styles.avatarImage} 
            onError={(e) => {
              console.log('Failed to load profile image, falling back to letter');
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {(!profile?.picture || safeMessage.role !== 'assistant') && (
          <div style={styles.avatarLetter}>
            {(profile?.name || "User").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <Box sx={{ 
        flex: 1, 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0 // Ensure text can shrink below its content size
      }}>
        <div style={getStyle(styles.messageActions)} className="message-actions">
          <Tooltip title={copyStatus.message ? 'Copied!' : 'Copy message'} arrow>
            <IconButton 
              size="small" 
              onClick={handleCopyMessage}
              sx={{
                color: isUser ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  backgroundColor: isUser ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              {copyStatus.message ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </div>
        
        <div style={getStyle(styles.messageBubble, safeMessage.role)}>
          <div style={{
            ...styles.messageContent,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {renderContent()}
          </div>
        </div>
      </Box>
    </div>
  );
};

export default Message;