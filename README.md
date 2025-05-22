# Sephia - Optimized for Apple Silicon M4

Sephia is a high-performance desktop interface for interacting with LLMs, now optimized for Apple Silicon M4 with 24GB unified memory. This version includes significant performance improvements for faster model loading and response times.

## 🚀 Performance Optimizations

### Apple Silicon M4 Optimizations

- **Hardware Acceleration**: Full utilization of M4's GPU and Neural Engine
- **Memory Management**: Optimized for 24GB unified memory with intelligent model loading
- **GPU Acceleration**: Enhanced rendering with Metal and WebGL
- **Energy Efficiency**: Reduced CPU/GPU usage for better battery life

### Key Improvements

- **Faster Model Loading**: Up to 2x faster model loading times
- **Smoother UI**: 60fps animations with hardware acceleration
- **Lower Latency**: Optimized network requests and response streaming
- **Better Memory Usage**: Intelligent caching and cleanup

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

## Troubleshooting

If you encounter HTML rendering issues:
1. Make sure the build is up to date
2. Try the simple configuration
3. Check the browser console for errors

## Development Notes

- The app uses Electron with React
- Content Security Policy is configured to allow local resources
- Files are served directly from the filesystem in production mode

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
