#!/bin/bash

# Enhanced Slack Workflow Local Development Setup
echo "🚀 Starting Enhanced Slack Workflow Local Development..."
echo ""

# Function to kill processes on a given port
kill_port() {
    PORT=$1
    echo "Attempting to kill processes on port $PORT..."
    lsof -t -i:$PORT | xargs -r kill -9
    if [ $? -eq 0 ]; then
        echo "Killed processes on port $PORT."
    else
        echo "No processes found or failed to kill on port $PORT."
    fi
}

# Stop existing processes if any
kill_port 3000 # Frontend
kill_port 3001 # Backend
kill_port 4040 # Ngrok admin UI

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first:"
    echo "   brew install ngrok"
    exit 1
fi

echo "🔧 Setting up local development environment..."
echo ""

# Start the backend server in background
echo "🖥️  Starting backend server on port 3001..."
# Load environment variables explicitly
source env
export SLACK_BOT_TOKEN
npm run server &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start ngrok tunnel for backend
echo "🌐 Creating ngrok tunnel for backend (port 3001)..."
ngrok http 3001 --log=stdout > ngrok.log &
NGROK_PID=$!

# Wait for ngrok to start up and log its URL
sleep 10 # Initial wait for ngrok process to start and write to log

# Get ngrok URL from log file (retry a few times)
ATTEMPTS=0
MAX_ATTEMPTS=12 # 12 retries with 5 second sleep = 60 seconds total
NGROK_URL=""
while [ -z "$NGROK_URL" ] && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    echo "Attempting to get ngrok URL from log (attempt $((ATTEMPTS+1))/$MAX_ATTEMPTS)..."
    NGROK_URL=$(grep -o 'https://[^ ]*\.ngrok-free\.dev' ngrok.log | head -n 1)
    if [ -z "$NGROK_URL" ]; then
        sleep 5
    fi
    ATTEMPTS=$((ATTEMPTS+1))
done

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL after multiple attempts. Please check ngrok status and logs (ngrok.log)."
    kill $BACKEND_PID $NGROK_PID 2>/dev/null
    exit 1
fi

# Start the frontend app in background
echo "🌐 Starting frontend app on port 3000..."
CI=true npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 10 # Frontend usually takes a bit longer to compile and start

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔗 Your public URL: $NGROK_URL"
echo "🖥️  Backend server: http://localhost:3001"
echo "🌐 Ngrok dashboard: http://localhost:4040"
echo ""
echo "📋 Slack App Configuration:"
echo "   Request URL: $NGROK_URL/api/slack/interactive"
echo ""
echo "🎯 Next steps:"
echo "1. Copy the Request URL above"
echo "2. Go to your Slack App settings"
echo "3. Navigate to 'Interactivity & Shortcuts'"
echo "4. Paste the Request URL"
echo "5. Save changes"
echo "6. Access frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    kill $BACKEND_PID $NGROK_PID $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait
