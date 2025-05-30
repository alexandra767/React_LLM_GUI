import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TypingMessage = ({ content, onComplete, typingSpeed = 30 }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!content) return;

    // Clean content for display (remove thinking blocks)
    const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    if (!cleanContent) {
      setDisplayedContent('');
      setIsTyping(false);
      onComplete && onComplete();
      return;
    }

    let currentIndex = 0;
    setDisplayedContent('');

    const typeInterval = setInterval(() => {
      if (currentIndex < cleanContent.length) {
        setDisplayedContent(cleanContent.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
        onComplete && onComplete();
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, [content, typingSpeed, onComplete]);

  if (!displayedContent && !isTyping) {
    return null;
  }

  return (
    <div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedContent}
      </ReactMarkdown>
      {isTyping && (
        <span style={{
          animation: 'blink 1s infinite',
          marginLeft: '2px',
          color: '#7c3aed'
        }}>
          |
        </span>
      )}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TypingMessage;