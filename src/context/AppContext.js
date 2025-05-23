import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import llmService from '../services/LLMService';

export const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    console.warn('useApp must be used within an AppProvider');
    return { appState: { activeSection: 'ollama' } };
  }
  return context;
};

// Load chats from localStorage
const loadChats = () => {
  try {
    const savedChats = localStorage.getItem('sephia_chats');
    return savedChats ? JSON.parse(savedChats) : [];
  } catch (error) {
    console.error('Failed to load chats from localStorage:', error);
    return [];
  }
};

// Load projects from localStorage
const loadProjects = () => {
  try {
    const savedProjects = localStorage.getItem('sephia_projects');
    return savedProjects ? JSON.parse(savedProjects) : [];
  } catch (error) {
    console.error('Failed to load projects from localStorage:', error);
    return [];
  }
};

// Load profile from localStorage
const loadProfile = () => {
  try {
    const savedProfile = localStorage.getItem('sephia_profile');
    return savedProfile ? JSON.parse(savedProfile) : {
      name: 'User',
      picture: null,
      bio: '',
    };
  } catch (error) {
    console.error('Failed to load profile from localStorage:', error);
    return {
      name: 'User',
      picture: null,
      bio: '',
    };
  }
};

export const AppProvider = ({ children }) => {
  // Initialize theme
  const theme = useTheme();
  // State declarations first
  const [currentModel, setCurrentModel] = useState('deepseek-r1:8b-m4');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appState, setAppState] = useState({
    sidebarCollapsed: false,
    activeSection: 'ollama',
    connectionStatus: 'disconnected',
    ollamaStatus: 'disconnected'
  });
  const [chats, setChats] = useState(loadChats);
  const [projects, setProjects] = useState(loadProjects);
  const [currentChat, setCurrentChat] = useState(null);
  const [profile, setProfile] = useState(loadProfile);
  const [tokenCount, setTokenCount] = useState({ input: 0, output: 0, total: 0 });
  const [messageDuration, setMessageDuration] = useState(0);
  
  // Function declarations next
  const updateTokenCount = (newCount) => {
    if (typeof newCount === 'function') {
      setTokenCount(prev => {
        const updated = newCount(prev);
        return { ...prev, ...updated };
      });
    } else {
      // For streaming, we want to set the output tokens directly, not add to them
      setTokenCount(prev => ({
        input: newCount?.input !== undefined ? newCount.input : prev.input,
        output: newCount?.output !== undefined ? newCount.output : prev.output,
        total: (newCount?.input !== undefined ? newCount.input : prev.input) + 
               (newCount?.output !== undefined ? newCount.output : prev.output)
      }));
    }
  };
  
  const setMessageTime = (time) => {
    setMessageDuration(time);
  };
  
  const resetTokenCount = () => {
    setTokenCount({ input: 0, output: 0, total: 0 });
  };
  

  
  // Define other functions that will be used in the context value
  const toggleSidebar = () => {
    setAppState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  };
  
  const setActiveSection = (section) => {
    setAppState(prev => ({
      ...prev,
      activeSection: section
    }));
  };
  
  const updateProfile = (newProfileData) => {
    setProfile(prev => ({
      ...prev,
      ...newProfileData
    }));
  };
  
  // Handle chat selection and apply theme
  const handleChatSelect = (chat) => {
    setCurrentChat(chat);
    // Don't save current chat ID - app should always start fresh
    
    try {
      // Apply the chat's theme if it has one
      if (chat.theme) {
        // Update the theme in localStorage
        localStorage.setItem('sephia_theme', chat.theme);
        
        // Update the document attribute for CSS variables
        document.documentElement.setAttribute('data-theme', chat.theme);
        
        // If the theme context is available, update it as well
        if (typeof window !== 'undefined' && window.__themeContext) {
          window.__themeContext.setTheme(chat.theme);
        }
      }
      
      // Keep the current section instead of switching to 'chat'
      // setAppState(prev => ({
      //   ...prev,
      //   activeSection: 'chat'
      // }));
    } catch (error) {
      console.error('Error in handleChatSelect:', error);
    }
  };

  // Generate a description from the first message content
  const generateChatDescription = (message) => {
    if (!message) return 'New chat';
    
    try {
      // Extract text from message (handling both string and object messages)
      let text = '';
      if (typeof message === 'string') {
        text = message;
      } else if (typeof message === 'object') {
        // Handle different message formats
        if (Array.isArray(message.content)) {
          // Handle array content (e.g., from OpenAI format)
          text = message.content
            .filter(part => typeof part === 'string' || (part && typeof part.text === 'string'))
            .map(part => typeof part === 'string' ? part : part.text)
            .join(' ');
        } else if (message.content) {
          text = message.content;
        } else if (message.text) {
          text = message.text;
        } else if (message.message) {
          text = message.message;
        } else if (message.parts && Array.isArray(message.parts)) {
          text = message.parts
            .filter(part => typeof part === 'string' || (part && typeof part.text === 'string'))
            .map(part => typeof part === 'string' ? part : part.text)
            .join(' ');
        }
      }
      
      // If we still don't have text, return a default description
      if (!text || typeof text !== 'string') {
        return 'New chat';
      }
      
      // Clean up the text for the description
      let description = text.trim();
      
      // Remove markdown formatting, code blocks, etc.
      description = description
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '')        // Remove inline code
        .replace(/[#*_~]/g, '')         // Remove markdown formatting
        .replace(/\n+/g, ' ')           // Replace newlines with spaces
        .replace(/\s+/g, ' ')           // Collapse multiple spaces
        .trim();
      
      // Truncate if needed (shorter for mobile, longer for desktop)
      const maxLength = window.innerWidth < 768 ? 30 : 50;
      if (description.length > maxLength) {
        // Try to truncate at a sentence or word boundary
        const truncated = description.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        const lastPunctuation = Math.max(
          truncated.lastIndexOf('.'),
          truncated.lastIndexOf('!'),
          truncated.lastIndexOf('?')
        );
        
        if (lastPunctuation > 0 && (maxLength - lastPunctuation) < 10) {
          description = truncated.substring(0, lastPunctuation + 1);
        } else if (lastSpace > 0 && (maxLength - lastSpace) < 10) {
          description = truncated.substring(0, lastSpace);
        } else {
          description = truncated;
        }
        
        // Add ellipsis if we truncated
        if (description.length < text.length) {
          description += '...';
        }
      }
      
      return description || 'New chat';
      
    } catch (error) {
      console.error('Error generating chat description:', error);
      return 'New chat';
    }
  };

  const createNewChat = (initialTitle = 'New Chat', themeName = 'dark', firstMessage = '') => {
    // Generate a timestamp for the chat
    const timestamp = new Date().toISOString();
    
    // Create the first message if provided
    const firstMessageObj = firstMessage ? [{
      id: `msg_${Date.now()}`,
      role: 'user',
      content: firstMessage,
      timestamp: timestamp,
      isUser: true
    }] : [];
    
    // Generate a description from the first message or use a default
    const description = firstMessage ? generateChatDescription(firstMessage) : 'New chat';
    
    // Use the generated description as the title if we have a first message
    const chatTitle = firstMessage ? description : initialTitle;
    
    // Create the chat object
    const newChat = {
      id: `chat_${Date.now()}`,
      title: chatTitle,
      description: description,
      messages: firstMessageObj,
      model: currentModel,
      theme: themeName,
      isStarred: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      tokenCount: 0,
      isArchived: false
    };
    
    // Update the chats array with the new chat
    setChats(prevChats => {
      const updatedChats = Array.isArray(prevChats) ? [...prevChats] : [];
      // Remove any existing chat with the same ID to avoid duplicates
      const filteredChats = updatedChats.filter(chat => chat.id !== newChat.id);
      return [newChat, ...filteredChats];
    });
    
    // Set the new chat as the current chat
    setCurrentChat(newChat);
    
    // Keep the current section instead of switching to 'chat'
    // setAppState(prev => ({
    //   ...prev,
    //   activeSection: 'chat'
    // }));
    
    // Apply the theme for the new chat if it's different from current
    if (themeName && theme?.setTheme && themeName !== theme.themeName) {
      theme.setTheme(themeName);
    }
    
    // Don't save current chat ID - app should always start fresh
    
    return newChat;
  };

  const sendMessage = async (chatId, message, options = {}) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) {
        console.error('Chat not found');
        return;
      }

      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      // Add user message to chat
      const updatedChat = {
        ...chat,
        messages: [...(chat.messages || []), userMessage],
        updatedAt: new Date().toISOString()
      };

      // Update chats state
      const updatedChats = chats.map(c => c.id === chatId ? updatedChat : c);
      setChats(updatedChats);
      setCurrentChat(updatedChat);

      // If this is the first message, update the chat title and description
      if ((updatedChat.messages || []).length === 1) {
        const description = generateChatDescription(message);
        updatedChat.description = description;
        updatedChat.title = description; // Use description as title
        
        const updatedChatsWithDescription = updatedChats.map(c => 
          c.id === chatId ? { ...c, description, title: description } : c
        );
        setChats(updatedChatsWithDescription);
        setCurrentChat(prev => ({ ...prev, description, title: description }));
      }

      // Get AI response
      const response = await llmService.sendMessage(chatId, message, {
        model: chat.model || currentModel,
        ...options
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      };

      // Add AI response to chat
      const finalChat = {
        ...updatedChat,
        messages: [...(updatedChat.messages || []), aiMessage],
        updatedAt: new Date().toISOString()
      };

      // Update chats state with AI response
      const finalChats = updatedChats.map(c => c.id === chatId ? finalChat : c);
      setChats(finalChats);
      setCurrentChat(finalChat);

      // Save to localStorage
      localStorage.setItem('sephia_chats', JSON.stringify(finalChats));

      return aiMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const streamMessage = async (chatId, message, options = {}) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) {
        console.error('Chat not found');
        return;
      }

      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      // Add user message to chat
      const updatedChat = {
        ...chat,
        messages: [...(chat.messages || []), userMessage],
        updatedAt: new Date().toISOString()
      };

      // Update chats state
      const updatedChats = chats.map(c => c.id === chatId ? updatedChat : c);
      setChats(updatedChats);
      setCurrentChat(updatedChat);

      // If this is the first message, update the chat title and description
      if ((updatedChat.messages || []).length === 1) {
        const description = generateChatDescription(message);
        updatedChat.description = description;
        updatedChat.title = description; // Use description as title
        
        const updatedChatsWithDescription = updatedChats.map(c => 
          c.id === chatId ? { ...c, description, title: description } : c
        );
        setChats(updatedChatsWithDescription);
        setCurrentChat(prev => ({ ...prev, description, title: description }));
      }

      // Create a placeholder for the AI response that will be streamed
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true
      };

      // Add placeholder AI message to chat
      const chatWithPlaceholder = {
        ...updatedChat,
        messages: [...(updatedChat.messages || []), aiMessage],
        updatedAt: new Date().toISOString()
      };

      const chatsWithPlaceholder = updatedChats.map(c => 
        c.id === chatId ? chatWithPlaceholder : c
      );
      setChats(chatsWithPlaceholder);
      setCurrentChat(chatWithPlaceholder);

      // Stream the response
      const onChunk = (chunk) => {
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id !== chatId) return chat;
            
            const updatedMessages = (chat.messages || []).map(msg => {
              if (msg.id === aiMessageId) {
                return {
                  ...msg,
                  content: msg.content + (chunk.content || '')
                };
              }
              return msg;
            });

            return {
              ...chat,
              messages: updatedMessages,
              updatedAt: new Date().toISOString()
            };
          });

          // Update current chat if it's the one being streamed to
          setCurrentChat(prev => 
            prev?.id === chatId 
              ? updatedChats.find(c => c.id === chatId)
              : prev
          );

          return updatedChats;
        });
      };

      const onComplete = () => {
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id !== chatId) return chat;
            
            const updatedMessages = (chat.messages || []).map(msg => {
              if (msg.id === aiMessageId) {
                const { isStreaming, ...rest } = msg;
                return rest; // Remove isStreaming flag
              }
              return msg;
            });

            return {
              ...chat,
              messages: updatedMessages,
              updatedAt: new Date().toISOString()
            };
          });

          // Save to localStorage when streaming is complete
          localStorage.setItem('sephia_chats', JSON.stringify(updatedChats));
          
          // Update current chat if it's the one being streamed to
          setCurrentChat(prev => 
            prev?.id === chatId 
              ? updatedChats.find(c => c.id === chatId)
              : prev
          );

          return updatedChats;
        });
      };

      // Start streaming the response
      await llmService.streamMessage(message, {
        model: chat.model || currentModel,
        ...options
      }, (chunkString) => {
        try {
          const chunk = JSON.parse(chunkString);
          if (chunk.error) {
            // Handle error responses
            console.error('Streaming error:', chunk.response);
            setChats(prevChats => {
              const updatedChats = prevChats.map(chat => {
                if (chat.id !== chatId) return chat;
                
                const updatedMessages = (chat.messages || []).map(msg => {
                  if (msg.id === aiMessageId) {
                    return {
                      ...msg,
                      content: chunk.response || 'Failed to get response from model.',
                      isError: true
                    };
                  }
                  return msg;
                });

                return {
                  ...chat,
                  messages: updatedMessages,
                  updatedAt: new Date().toISOString()
                };
              });

              // Update current chat if it's the one being streamed to
              setCurrentChat(prev => 
                prev?.id === chatId 
                  ? updatedChats.find(c => c.id === chatId)
                  : prev
              );

              return updatedChats;
            });
            
            if (chunk.done) {
              onComplete();
            }
          } else if (chunk.response) {
            // Call the onChunk from context
            onChunk({ content: chunk.response });
            
            // Also call the onChunk from options if provided
            if (options.onChunk) {
              options.onChunk({ content: chunk.response });
            }
          }
          if (chunk.done && !chunk.error) {
            onComplete();
            
            // Also call onComplete from options if provided
            if (options.onComplete) {
              options.onComplete();
            }
          }
        } catch (e) {
          console.warn('Failed to parse chunk:', e);
        }
      });

      return aiMessageId;
    } catch (error) {
      console.error('Error streaming message:', error);
      throw error;
    }
  };

  const createNewProject = (projectData) => {
    const newProject = {
      id: Date.now().toString(),
      title: projectData.title || 'New Project',
      description: projectData.description || '',
      messages: projectData.messages || [],
      fileCount: projectData.fileCount || 0,
      isPrivate: projectData.isPrivate !== undefined ? projectData.isPrivate : true,
      lastUpdated: projectData.lastUpdated || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: projectData.model || currentModel || 'deepseek-r1:8b-m4', // Store the model with the project
    };
    
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };
  
  const updateProject = (projectId, updates) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, ...updates, updatedAt: new Date().toISOString() }
        : project
    ));
  };
  
  const deleteChat = (chatId) => {
    setChats(prev => {
      if (!prev || !Array.isArray(prev)) return [];
      return prev.filter(chat => chat.id !== chatId);
    });
    
    if (currentChat && currentChat.id === chatId) {
      // If we're deleting the current chat, select the most recent chat if available
      setChats(prev => {
        if (!prev || !Array.isArray(prev) || prev.length === 0) {
          setCurrentChat(null);
          return [];
        }
        
        // Find the most recent chat that's not the one being deleted
        const otherChats = prev.filter(chat => chat.id !== chatId);
        if (otherChats.length > 0) {
          const mostRecentChat = [...otherChats].sort(
            (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
          )[0];
          setCurrentChat(mostRecentChat);
          
          // Apply the chat's theme if it has one
          if (mostRecentChat.theme) {
            localStorage.setItem('sephia_theme', mostRecentChat.theme);
            document.documentElement.setAttribute('data-theme', mostRecentChat.theme);
          }
        } else {
          setCurrentChat(null);
        }
        
        return otherChats;
      });
    }
  };
  
  const deleteProject = (projectId) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
  };
  
  const loadModel = async (modelId) => {
    try {
      // Set model first, so UI doesn't get stuck
      setCurrentModel(modelId);
      
      console.log(`Loading model: ${modelId}`);
      
      // For M4 Macs, skip the connecting state and just set to connected immediately
      // This prevents the UI from getting stuck in "connecting" state
      setAppState(prev => ({
        ...prev,
        connectionStatus: 'connected'
      }));
      
      // In the background, try to actually warm up the model without blocking UI
      setTimeout(async () => {
        try {
          // Quick tags check - more reliable than health endpoint
          const tagsResponse = await fetch('http://localhost:11434/api/tags', { 
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          }).catch(() => null);
          
          if (tagsResponse?.ok) {
            console.log("Ollama is available");
            
            // For M4 Mac optimization, setup options for best performance
            const warmupBody = {
              model: modelId,
              prompt: 'Hello',
              stream: false,
              max_tokens: 5,
              num_gpu: 1,          // Use GPU acceleration
              num_thread: 8,       // Use 8 CPU threads for M4
              num_keep: 0,         // Don't keep context in memory
              temperature: 0.7,    // Standard temperature
              repeat_penalty: 1.1, // Prevent repetition
              tfs_z: 1.0           // Top frequent sampling
            };
            
            // Start a non-blocking model warmup
            fetch('http://localhost:11434/api/generate', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(warmupBody),
              signal: AbortSignal.timeout(3000) // Short timeout for warmup
            }).catch(() => {
              console.log("Model warmup request sent in background");
            });
          }
        } catch (e) {
          // Silently continue - we don't want to block the UI
          console.warn('Background model preparation error (non-critical):', e);
        }
      }, 100); // Start the background task quickly but don't block UI
      
      return true;
    } catch (error) {
      console.error('Failed to load model:', error);
      
      // Even on error, keep the new model selected, just mark as disconnected
      setCurrentModel(modelId);
      setAppState(prev => ({
        ...prev,
        connectionStatus: 'disconnected'
      }));
      
      return false;
    }
  };
  
  const unloadModel = async (modelId) => {
    try {
      if (!modelId) {
        throw new Error('Model ID is required');
      }
      
      // Simulate unloading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If the current model is being unloaded, switch to default
      if (currentModel === modelId) {
        setCurrentModel(models[0]?.id || 'unknown');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unload model:', error);
      return false;
    }
  };
  
  // Toggle star status of a chat
  const toggleStarChat = (chatId) => {
    setChats(prevChats => {
      if (!Array.isArray(prevChats)) return [];
      
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = { 
            ...chat, 
            isStarred: !chat.isStarred,
            updatedAt: new Date().toISOString()
          };
          
          // Update current chat if it's the one being modified
          if (currentChat?.id === chatId) {
            setCurrentChat(updatedChat);
          }
          
          return updatedChat;
        }
        return chat;
      });
    });
  };
  
  // Create the context value object with all necessary values and methods
  const contextValue = {
    // State values
    currentModel,
    models,
    loading,
    error,
    appState,
    chats,
    projects,
    currentChat,
    profile,
    tokenCount,
    messageDuration,
    
    // State setters
    setCurrentModel,
    setModels,
    setLoading,
    setError,
    setAppState,
    setChats,
    setProjects,
    setCurrentChat,
    setProfile,
    setTokenCount: updateTokenCount,
    setMessageTime,
    
    // Methods
    handleChatSelect,
    sendMessage,
    streamMessage,
    updateProfile,
    resetTokenCount,
    toggleSidebar,
    setActiveSection,
    createNewChat,
    createNewProject,
    updateProject,
    deleteChat,
    deleteProject,
    loadModel,
    unloadModel,
    toggleStarChat
  };
  
  // Save chats to localStorage whenever they change
  useEffect(() => {
    try {
      if (chats && Array.isArray(chats)) {
        localStorage.setItem('sephia_chats', JSON.stringify(chats));
        // Don't save current chat ID - app should always start fresh
      }
    } catch (error) {
      console.error('Failed to save chats to localStorage:', error);
    }
  }, [chats, currentChat]);
  
  // Keep track of initial load to prevent duplicate theme application
  const initialLoad = useRef(true);
  
  // Load current chat ID on initial load - modified to not auto-select any chat
  useEffect(() => {
    // Only run this on initial app load, not when chats change
    if (!initialLoad.current) return;
    
    try {
      // Don't automatically load any previous chat
      // The app should start with a clean new chat interface
      // Users can manually select previous chats from the sidebar
      
      // Only load theme from the most recent chat if available
      const savedChatId = localStorage.getItem('sephia_current_chat_id');
      if (savedChatId && chats.length > 0) {
        const chat = chats.find(c => c.id === savedChatId);
        if (chat && chat.theme) {
          // Apply the theme from the last chat but don't select it
          localStorage.setItem('sephia_theme', chat.theme);
          document.documentElement.setAttribute('data-theme', chat.theme);
        }
      }
      
      // Clear the saved chat ID so we start fresh
      localStorage.removeItem('sephia_current_chat_id');
      setCurrentChat(null);
      
      initialLoad.current = false;
    } catch (error) {
      console.error('Failed to clear current chat on startup:', error);
    }
  }, []);
  
  // Apply theme when currentChat changes and has a theme
  useEffect(() => {
    // Skip the initial load since we handle it in the effect above
    if (initialLoad.current) return;
    
    if (currentChat?.theme && theme?.setTheme) {
      theme.setTheme(currentChat.theme);
    }
  }, [currentChat?.id]);
  
  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sephia_projects', JSON.stringify(projects));
  }, [projects]);
  
  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sephia_profile', JSON.stringify(profile));
  }, [profile]);
  
  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setAppState(prev => ({
          ...prev,
          connectionStatus: 'connecting'
        }));
        
        console.log("Fetching models from service and terminal...");
        
        // Immediately set hard-coded models that match what we know exists
        const hardcodedModels = [
          { id: 'deepseek-r1:32b', name: 'DeepSeek R1 (32B)', type: 'local' },
          { id: 'deepseek-r1:8b-m4', name: 'DeepSeek 8B-M4', type: 'local' },
          { id: 'deepseek-r1:14b-m4', name: 'DeepSeek 14B-M4', type: 'local' },
          { id: 'deepseek-r1:8b', name: 'DeepSeek 8B', type: 'local' },
          { id: 'deepseek-r1:14b', name: 'DeepSeek 14B', type: 'local' }
        ];
        
        // Set hardcoded models immediately
        setModels(hardcodedModels);
        
        // Try to get actual models from Ollama in the background
        try {
          const ollamaModels = await llmService.getAvailableModels();
          
          // Only update if we got real models back
          if (ollamaModels && ollamaModels.length > 0) {
            // Map to our format
            const mappedModels = ollamaModels.map(model => ({
              id: model.id || model.name || 'unknown',
              name: model.name || 'Unknown Model',
              type: 'local',
              size: model.size || 'Unknown size',
            }));
            
            console.log("Loaded models from Ollama:", mappedModels);
            setModels(mappedModels);
            
            setAppState(prev => ({
              ...prev,
              connectionStatus: 'connected'
            }));
          }
        } catch (apiError) {
          console.error("Error fetching models from API:", apiError);
          // We keep the hardcoded models already set
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed in model fetch process:', err);
        setError('Failed to fetch models');
        
        // Ensure we at least have the hardcoded models
        setModels([
          { id: 'deepseek-r1:32b', name: 'DeepSeek R1 (32B)', type: 'local' },
          { id: 'deepseek-r1:8b-m4', name: 'DeepSeek 8B-M4', type: 'local' },
          { id: 'deepseek-r1:14b-m4', name: 'DeepSeek 14B-M4', type: 'local' },
          { id: 'deepseek-r1:8b', name: 'DeepSeek 8B', type: 'local' },
          { id: 'deepseek-r1:14b', name: 'DeepSeek 14B', type: 'local' }
        ]);
        
        setAppState(prev => ({
          ...prev,
          connectionStatus: 'disconnected'
        }));
        
        setLoading(false);
      }
    };
    
    fetchModels();
    
    // Set up a refresh interval to periodically check for new models
    const modelRefreshInterval = setInterval(() => {
      fetchModels();
    }, 60000); // Refresh every 60 seconds
    
    return () => {
      clearInterval(modelRefreshInterval);
    };
  }, []);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Export the provider as default for better IDE support
export { AppProvider as default };