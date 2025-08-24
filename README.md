# 🎯 Jira Ticket Creator Tool

A React-based tool for parsing unstructured text into Jira tickets using intelligent regex patterns. Perfect for QA engineers and development teams who need to quickly create multiple tickets from bug reports, feature requests, or test case descriptions.

## ✨ Features

- **Smart Text Parsing**: Regex-based extraction of ticket information from unstructured text
- **Bulk Processing**: Handle multiple tickets at once with progress tracking
- **Interactive Preview**: Edit and validate parsed data before creation
- **Secure Jira Integration**: Direct integration with Jira Cloud API with encrypted credential storage
- **File Attachments**: Upload and attach files to tickets during creation
- **Demo Mode**: Test the tool without real Jira connection
- **Translation Support**: Built-in Vietnamese to English translation

## 🚀 Quick Start

### Prerequisites
- **Node.js 16+** (Recommended: Node.js 18 or later)
- **npm** package manager
- **Jira Cloud account** with API access (for production use)

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd JiraTool
npm install

# Start full application (recommended)
./start-full.sh
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📝 How to Use

### Step 1: Jira Configuration
1. Get your Jira API credentials (URL, email, API token)
2. Configure connection in the app
3. Test connection and save configuration

### Step 2: Input & Parse Text
1. Enter bug reports, feature requests, or task descriptions
2. Add multiple inputs for bulk processing
3. Click "Parse Tickets" to extract structured data

### Step 3: Preview & Edit
1. Review parsed ticket information in the table
2. Edit any fields that need correction
3. Select/deselect tickets for creation

### Step 4: Create Tickets
1. Set metadata (sprint, assignee, fix version)
2. Create selected tickets in Jira
3. View results and export if needed

## 🎯 Supported Text Patterns

The parser recognizes common patterns:

**Bug Reports:**
```
Bug: Login fails on mobile app
Environment: iPhone 14, iOS 16.5
Priority: High
Steps:
1. Open the app
2. Enter credentials
3. Tap login button
Expected: User logs in successfully
Actual: Error message appears
```

**Feature Requests:**
```
Feature: Add dark mode toggle
Priority: Medium
Definition of Done:
- Toggle switch in settings
- Dark theme for all components
- User preference persistence
```

## 🏗️ Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Jira Cloud    │
│   (React)       │◄──►│   Proxy         │◄──►│   REST API      │
│   Port: 3000    │    │   (Express)     │    │   atlassian.net │
└─────────────────┘    │   Port: 3001    │    └─────────────────┘
                       └─────────────────┘
```

### Project Structure
```
JiraTool/
├── src/
│   ├── components/          # React components
│   ├── services/           # API services
│   ├── utils/              # Text parser
│   └── App.js              # Main application
├── server/
│   └── server.js           # Express proxy server
├── uploads/                # File storage
└── start-full.sh          # Startup script
```

## 🛠️ Development

### Available Scripts
```bash
npm start              # Frontend only (port 3000)
npm run server         # Backend only (port 3001)
npm run dev            # Both frontend and backend
./start-full.sh        # Full setup with checks
npm test               # Run tests
```

### Adding New Parsing Patterns
Edit `src/utils/textParser.js`:

```javascript
static extractNewPattern(text) {
  const pattern = /your-regex-pattern/i;
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}
```

## 🐛 Common Issues

**Connection Issues:**
- Ensure backend server is running on port 3001
- Check Jira URL format: `https://yourcompany.atlassian.net`
- Verify API token has proper permissions

**Parsing Issues:**
- Use explicit keywords: "Bug:", "Feature:", "Task:"
- Check text format matches supported patterns
- Try sample data to verify parser functionality

**File Upload Issues:**
- Check file size (10MB limit)
- Verify supported file types
- Ensure backend server is running

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Submit a pull request

### Areas for Contribution
- **Text Parsing**: Add new language support or improve patterns
- **UI/UX**: Enhance user interface and experience
- **Integrations**: Add support for other project management tools
- **Testing**: Increase test coverage

## 📄 License

MIT License - see LICENSE file for details

---

## 🎯 Quick Reference

### Essential Commands
```bash
./start-full.sh        # Start full application
npm run dev            # Development mode
npm test               # Run tests
```

### Key Features
- Smart text parsing with regex patterns
- Bulk ticket creation with progress tracking
- Secure credential storage with AES-256 encryption
- File attachment support
- Real-time Jira integration

**Happy ticket creating! 🎯**

*Built with ❤️ for QA engineers and development teams.*