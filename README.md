# Sephia - Local LLM Chat Interface

A modern, elegant chat interface for interacting with local Large Language Models (LLMs) through Ollama. Built with React and Electron, Sephia provides a beautiful UI for conversations with AI models running on your machine.

![Sephia Interface](public/images/brain-computer.svg)

## ✨ Latest Updates (v2.0)

### Major Features Implemented
- **🎯 Auto-generating chat titles** - Automatically creates meaningful titles from first message
- **📊 Enhanced live metrics** - Real-time display: "(29s · 8.5k tokens · esc to interrupt)"
- **📁 Project management system** - Organize chats into projects with isolated contexts
- **🎨 Modern UI redesign** - Discord-inspired interface with purple accents
- **💬 Advanced markdown support** - Full GitHub Flavored Markdown with syntax highlighting
- **📋 Always-visible copy buttons** - Easy copying of AI responses
- **🔄 Improved streaming** - Fixed chunk handling for complete responses
- **💾 Enhanced persistence** - Session storage for UI state, localStorage for data

## Features

### 🎨 Modern UI Design
- **Clean, Discord-inspired interface** with dark theme
- **Responsive design** that works on desktop and mobile
- **Beautiful message bubbles** with proper alignment and styling
- **Syntax highlighting** for code blocks with line numbers
- **Markdown support** with GitHub Flavored Markdown (tables, strikethrough, etc.)
- **Purple gradient status bar** with live metrics
- **Hover effects** and smooth transitions

### 💬 Chat Features
- **Real-time streaming** responses with live token counting
- **Auto-generating chat titles** from first message content
- **Message history** with starred and recent chats
- **Copy functionality** for messages and code blocks
- **Delete messages** with confirmation
- **Interrupt streaming** with ESC key
- **DeepSeek R1 thinking support** - Displays reasoning process

### 📁 Project Management
- **Create projects** to organize related conversations
- **Project isolation** - each project maintains its own chat history
- **Project cards** with metadata (file count, message count, last updated)
- **Private/Public projects** with visual indicators
- **Quick project switching** from the sidebar
- **Per-project model settings** - projects remember their model

### 🤖 Model Support
- **Multiple model support** through Ollama integration
- **Model selection** dropdown in header
- **Automatic model detection** from Ollama
- **Fallback models** when Ollama is unavailable
- **Model warmup** on selection
- **Terminal fallback** for Electron environment

### 📊 Live Statistics
- **Real-time token counting** during streaming
- **Response time tracking** in seconds
- **Tokens per second** calculation
- **Formatted display**: "(29s · 8.5k tokens · esc to interrupt)"
- **Number formatting** with k suffix for thousands

### 🛠️ Technical Features
- **Electron app** for desktop deployment
- **React 18** with modern hooks and context
- **Emotion styled components** for styling
- **Material-UI components** for consistent design
- **Local storage persistence** for chats and projects
- **Session storage** for maintaining UI state
- **Error boundaries** and comprehensive error handling
- **Abort signal support** for canceling requests

## Prerequisites

- Node.js 18+ and npm/yarn
- [Ollama](https://ollama.ai/) installed and running locally
- At least one model installed in Ollama (e.g., `ollama pull deepseek-r1:8b-m4`)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/alexandra767/React_LLM_GUI.git
cd React_LLM_GUI
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Or run as an Electron app:
```bash
npm run electron-dev
```

## Usage

### Starting a Chat
1. Click "New Chat" in the sidebar or press the + button
2. Type your message in the rounded input field
3. Press Enter or click the purple send button
4. Watch as the AI responds with live streaming
5. The chat title updates automatically based on your first message

### Creating a Project
1. Click "Projects" in the sidebar
2. Click the "New Project" card with dashed border
3. Enter a project name and description
4. Click "Create Project"
5. Start chatting within your project context

### Managing Chats
- **Star important chats** by clicking the star icon (always visible on hover)
- **Delete chats** with the trash icon
- **Copy AI responses** with the copy button (always visible on assistant messages)
- **View chat history** in the sidebar under "Recent Chats" and "Starred"

### Keyboard Shortcuts
- `Enter` - Send message
- `Shift + Enter` - New line in message
- `ESC` - Interrupt streaming response
- `Cmd/Ctrl + C` - Copy selected text

## Configuration

### Ollama Connection
By default, Sephia connects to Ollama at `http://localhost:11434`. The service includes:
- Automatic retry with exponential backoff
- Terminal fallback for Electron environment
- Mock responses when Ollama is unavailable

### Available Models
The app automatically detects models installed in Ollama. To add more models:

```bash
ollama pull model-name
```

Popular models:
- `deepseek-r1:8b-m4` - Fast reasoning model with thinking process
- `deepseek-r1:32b` - Larger, more capable version
- `llama2` - General purpose
- `mistral` - Efficient and capable
- `codellama` - Optimized for coding

## Development

### Project Structure
```
React_LLM_GUI/
├── src/
│   ├── components/      # React components
│   │   ├── Chat/       # Chat-related components
│   │   │   ├── ChatInput.js      # Message input with send button
│   │   │   ├── ChatView.js       # Main chat container
│   │   │   ├── Message.js        # Individual message display
│   │   │   ├── MessageList.js    # Message container with scrolling
│   │   │   ├── TokenDisplay.js   # Live metrics display
│   │   │   └── BrainIcon.js      # Custom brain icon component
│   │   ├── Layout/     # Layout components
│   │   │   ├── Header.js         # Top bar with model selector
│   │   │   ├── MainLayout.js     # Main app layout
│   │   │   └── Sidebar.js        # Left sidebar navigation
│   │   └── Projects/   # Project management
│   │       └── ProjectsView.js   # Project cards and management
│   ├── context/        # React context providers
│   │   ├── AppContext.js         # Global app state
│   │   └── ThemeContext.js       # Theme management
│   ├── services/       # API services
│   │   ├── LLMService.js         # Ollama integration
│   │   └── OllamaService.js      # Direct Ollama API
│   └── utils/          # Utility functions
│       └── clipboard.js          # Clipboard operations
├── electron/           # Electron main process
│   ├── main.js                   # Main electron file
│   └── preload.js               # Preload script
└── public/            # Static assets
    └── images/                   # Icons and images
```

### Key Technologies
- **React 18** - UI framework with hooks
- **Electron 36** - Desktop app framework
- **Emotion** - CSS-in-JS styling
- **Material-UI v5** - Component library
- **Axios** - HTTP client with interceptors
- **React Markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown
- **Prism** - Syntax highlighting
- **DOMPurify** - HTML sanitization

### State Management
The app uses React Context for state management:
- **AppContext** - Manages chats, projects, models, and UI state
- **ThemeContext** - Handles theme switching and persistence

## Building for Production

### Web Build
```bash
npm run build
```

### Electron Build
```bash
# For macOS
npm run electron-pack-mac

# For Windows
npm run electron-pack-win

# For Linux
npm run electron-pack-linux
```

## Troubleshooting

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama service
ollama serve

# Verify models are installed
ollama list

# Pull a model if needed
ollama pull deepseek-r1:8b-m4
```

### Common Issues
1. **"setImmediate is not defined"** - Fixed in latest version
2. **"Cannot read properties of undefined (reading 'inTable')"** - Update remark-gfm to v3.0.1
3. **Messages not showing** - Check browser console for errors
4. **Project crashes on message send** - Fixed with enhanced error handling

### Performance Tips
- Use quantized models (8b versions) for faster responses
- Close other resource-intensive applications
- Ensure at least 8GB RAM is available
- For M4 Macs: Models are optimized for Apple Silicon

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Update README for new features
- Test on multiple platforms
- Ensure Ollama compatibility

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Ollama](https://ollama.ai/) for providing local LLM capabilities
- [Anthropic](https://anthropic.com/) for Claude AI assistance in development
- [DeepSeek](https://deepseek.ai/) for the R1 reasoning models
- React and Electron communities for excellent documentation
- All contributors and testers

## Roadmap

### Coming Soon
- 🔜 Search functionality across all chats
- 🔜 Export conversations (PDF, Markdown, JSON)
- 🔜 Custom theme editor
- 🔜 Multi-language support
- 🔜 Plugin system for extensions
- 🔜 Voice input/output
- 🔜 Image support for multimodal models
- 🔜 Collaborative projects

---

Built with ❤️ by Alexandra

For support, please open an issue on [GitHub](https://github.com/alexandra767/React_LLM_GUI/issues)