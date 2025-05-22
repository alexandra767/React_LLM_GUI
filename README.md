# Sephia - Modern LLM Interface

Sephia is a high-performance desktop interface for interacting with LLMs through Ollama, featuring real-time streaming responses, live metrics, and a beautiful Material Design interface. Built with React, Material-UI, and Electron for a seamless desktop experience.

## ✨ Latest Updates (v1.2.0)

### New Features & Fixes

- **🚀 Real-time Streaming** - Fixed streaming responses with proper deduplication to prevent repetition during model reasoning
- **📊 Live Metrics Display** - Added real-time streaming statistics showing duration, token count, and interrupt capability
- **⚡ ESC Key Interrupt** - Implemented proper abort signal handling to cancel long-running responses instantly
- **🎯 Smooth Animation** - Added configurable streaming speed with natural typing animation (50ms delay between chunks)
- **🎨 Enhanced UI** - Beautiful purple-themed interface with Material Design components
- **💾 Persistent History** - Chat history saved to local storage with automatic theme persistence
- **🔧 M4 Mac Optimized** - Specially tuned for Apple Silicon performance

### Theme System Features

- **Dark/Light Mode**: Built-in support for multiple color schemes
- **Purple Accent Theme**: Modern, eye-friendly purple color scheme
- **Responsive Design**: Adapts to different screen sizes and preferences
- **Consistent Styling**: Unified design language across all components

## 🚀 Quick Start

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- [Ollama](https://ollama.ai/) installed and running
- At least one Ollama model installed (e.g., `ollama pull deepseek-r1:8b`)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/React_LLM_GUI.git
cd React_LLM_GUI

# Install dependencies
npm install

# Start Ollama service (in separate terminal)
ollama serve

# Start the development server
npm start
```

## 🎯 Key Features

- **Real-time Streaming**: Watch AI responses appear with smooth, natural typing animation
- **Live Metrics**: Monitor response generation with real-time duration and token count
- **Interrupt Support**: Press ESC to instantly cancel long-running responses
- **Code Highlighting**: Automatic syntax highlighting for code blocks
- **Message Management**: Copy messages, view timestamps, track conversation history
- **Model Switching**: Easily switch between different Ollama models
- **Persistent Storage**: Chat history saved locally between sessions

## 🖥️ Running the App with Electron

There are multiple ways to run the Sephia app:

### 1. Production Mode

This loads the built React app in Electron:

```bash
./run-sephia-electron.sh
```

### 2. Development Mode

This starts the React development server and opens it in Electron:

```bash
./run-sephia-dev.sh
```

### 3. Simple Mode

This uses a simplified Electron configuration that loads directly from the file system:

```bash
./run-sephia-simple.sh
```

## 🛠️ Configuration

### Adjusting Streaming Speed

To customize the text streaming speed, modify the delay in `src/services/LLMService.js` line 198:

```javascript
await new Promise(resolve => setTimeout(resolve, 50)); // Adjust this value
```

- **Faster**: Use 20-30ms for quicker streaming
- **Slower**: Use 100-150ms for more natural typing effect

### Supported Models

The app works with any Ollama model. Popular choices:
- `deepseek-r1:8b` - Fast, efficient reasoning model
- `deepseek-r1:32b` - Larger, more capable model
- `deepseek-r1:14b` - Balanced performance
- `llama3` - Meta's latest open model
- `mistral` - Fast and efficient

## 🐛 Troubleshooting

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Verify models are installed
ollama list

# Pull a model if needed
ollama pull deepseek-r1:8b
```

### Performance Tips for M4 Macs
- Use quantized models (8b versions) for faster responses
- Close other resource-intensive applications
- Ensure at least 8GB RAM is available

## 📁 Project Structure

```
src/
├── components/
│   ├── Chat/           # Chat UI components
│   │   ├── ChatInput.js
│   │   ├── ChatView.js
│   │   ├── Message.js
│   │   └── MessageList.js
│   ├── Layout/         # App layout components
│   │   ├── Header.js
│   │   ├── MainLayout.js
│   │   └── Sidebar.js
│   └── SimpleChat.js   # Main chat component
├── context/
│   ├── AppContext.js   # Global app state management
│   └── ThemeContext.js # Theme management
├── services/
│   └── LLMService.js   # Ollama API integration
└── views/              # Main view components
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
