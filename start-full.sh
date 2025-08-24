#!/bin/bash

# Full Jira Ticket Creator Tool with Backend Proxy
echo "🎯 Starting Jira Ticket Creator Tool with Backend Proxy..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting both backend proxy server and frontend..."
echo ""
echo "Backend server: http://localhost:3001"
echo "Frontend app: http://localhost:3000"
echo ""
echo "🔧 Backend proxy server handles CORS and Jira API calls"
echo "🎯 Frontend communicates with real Jira through the proxy"
echo ""
echo "📋 Demo Steps:"
echo "1. Load sample data or enter your ticket text"
echo "2. Parse tickets to extract information"
echo "3. Configure real Jira credentials (URL, email, API token)"
echo "4. Test connection using the 'Test Jira Connection' button"
echo "5. Create real tickets in your Jira instance!"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers concurrently
npm run dev
