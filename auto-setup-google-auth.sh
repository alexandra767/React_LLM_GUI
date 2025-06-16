#!/bin/bash

echo "🧠⚡ Setting up Google Authentication for Sephia"
echo ""

# First, let's check if the app is running
if ! pgrep -f "electron.*electron-prod.js" > /dev/null; then
    echo "Starting Sephia app..."
    /Applications/Sephia.app/Contents/MacOS/Sephia &
    sleep 5
fi

echo "Opening Developer Console setup instructions..."
echo ""
echo "IMPORTANT: A browser window will open with instructions."
echo ""

# Create an HTML file with instructions and auto-setup
cat > /tmp/sephia-google-auth-setup.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Sephia Google Auth Setup</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        h1 { color: #00ff88; }
        .step {
            background: #2a2a2a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid #00ff88;
        }
        code {
            background: #000;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 14px;
        }
        pre {
            background: #000;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 0;
        }
        button:hover { background: #00cc77; }
        .warning {
            background: #ff6b6b;
            color: #fff;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>🧠⚡ Sephia Google Authentication Setup</h1>
    
    <div class="step">
        <h2>Step 1: Open Developer Console in Sephia</h2>
        <p>1. Make sure Sephia is running</p>
        <p>2. Press <code>Cmd + Option + I</code> to open Developer Tools</p>
        <p>3. Click on the "Console" tab</p>
    </div>

    <div class="step">
        <h2>Step 2: Load the Setup Script</h2>
        <p>Copy and paste this entire code block into the Console:</p>
        <pre id="setupScript"></pre>
        <button onclick="copySetupScript()">Copy Setup Script</button>
    </div>

    <div class="step">
        <h2>Step 3: Run Setup</h2>
        <p>After pasting the script, run this command in the console:</p>
        <pre>setupGoogleAuth()</pre>
        <p>Follow the instructions that appear in the console.</p>
    </div>

    <div class="step">
        <h2>Need Google OAuth Credentials?</h2>
        <button onclick="window.open('https://console.cloud.google.com/apis/credentials', '_blank')">
            Open Google Cloud Console
        </button>
        <p>Create OAuth 2.0 credentials with:</p>
        <ul>
            <li>Application type: Web application</li>
            <li>Authorized redirect URIs: <code>http://localhost</code></li>
        </ul>
    </div>

    <div class="step">
        <h2>Get Tokens from OAuth Playground</h2>
        <button onclick="window.open('https://developers.google.com/oauthplayground/', '_blank')">
            Open OAuth Playground
        </button>
        <p>Required scopes:</p>
        <ul>
            <li>https://www.googleapis.com/auth/drive.readonly</li>
            <li>https://www.googleapis.com/auth/gmail.readonly</li>
            <li>https://www.googleapis.com/auth/calendar.readonly</li>
        </ul>
    </div>

    <script>
        // Load the setup script content
        fetch('/setup-google-auth.js')
            .then(r => r.text())
            .then(content => {
                document.getElementById('setupScript').textContent = content;
            })
            .catch(() => {
                // Fallback content
                document.getElementById('setupScript').textContent = `// Paste the content from setup-google-auth.js here`;
            });

        function copySetupScript() {
            const script = document.getElementById('setupScript').textContent;
            navigator.clipboard.writeText(script).then(() => {
                alert('Setup script copied to clipboard! Now paste it in the Sephia console.');
            });
        }
    </script>
</body>
</html>
EOF

# Start a simple server to serve the setup files
cd /Users/alexandratitus767/Developer/ReactProjects/React_LLM_GUI
python3 -m http.server 8888 > /dev/null 2>&1 &
SERVER_PID=$!

# Open the setup page
sleep 1
open "http://localhost:8888/tmp/sephia-google-auth-setup.html"

echo "Setup page opened in your browser!"
echo ""
echo "Follow the instructions to set up Google authentication."
echo ""
echo "Press Enter when you're done to close the setup server..."
read

# Clean up
kill $SERVER_PID 2>/dev/null
rm /tmp/sephia-google-auth-setup.html

echo "✅ Setup complete!"