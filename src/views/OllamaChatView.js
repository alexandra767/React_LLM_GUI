import React from 'react';
import ChatView from '../components/Chat/ChatView';

const OllamaChatView = React.memo(() => {
  // Use a stable key to prevent remounting
  return <ChatView key="ollama-chat" />;
});

export default OllamaChatView;