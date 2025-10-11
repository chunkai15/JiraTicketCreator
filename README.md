# 🎯 Jira Tool Suite

A modern, accessible web application for managing Jira tickets and Confluence release pages with advanced automation features. Built with React, Tailwind CSS, and comprehensive accessibility support.

## ✨ Features

- **🎫 Smart Ticket Creation**: Bulk create Jira tickets with intelligent text parsing
- **🚀 Release Management**: Generate Confluence release pages automatically  
- **⌨️ Keyboard Navigation**: Full keyboard accessibility with shortcuts
- **🌙 Dark Mode**: Beautiful light/dark theme switching
- **♿ Accessibility**: WCAG 2.1 AA compliant
- **🎬 Smooth Animations**: Polished UI with Framer Motion
- **⚡ Performance**: Optimized with lazy loading and code splitting
- **🛡️ Error Handling**: Robust error boundaries and recovery

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

#### Required Fields
To connect with your Jira instance, you need to provide the following information:

| Field | Description | Example | Required |
|-------|-------------|---------|----------|
| **Jira URL** | Your Jira instance URL | `https://your-company.atlassian.net` | ✅ Yes |
| **Email** | Your Atlassian account email | `your-email@company.com` | ✅ Yes |
| **API Token** | Personal API token for authentication | `ATATT3xFfGF0...` (72+ characters) | ✅ Yes |
| **Project Key** | Target project identifier | `PROJ` or `DEV` | ✅ Yes |
| **Issue Type** | Default ticket type | `Bug`, `Task`, `Story` | ✅ Yes |

#### Getting Your API Token
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Give it a descriptive name (e.g., "Jira Tool Suite")
4. Copy the generated token (save it securely!)

### Step 2: Create Tickets

#### Smart Text Parsing
The tool can intelligently parse unstructured text into Jira tickets:

```
Bug: Login page crashes on mobile
- Steps: Open app, go to login, enter credentials
- Expected: Should login successfully  
- Actual: App crashes with white screen
- Priority: High

Feature: Add dark mode toggle
- Description: Users want dark mode option
- Acceptance: Toggle in settings, persists across sessions
- Priority: Medium
```

#### Supported Formats
- **Bug Reports**: Automatic detection of steps, expected/actual results
- **Feature Requests**: Description and acceptance criteria parsing
- **Test Cases**: Step-by-step test procedures
- **Mixed Content**: Multiple ticket types in one input

### Step 3: Review & Create
- **Live Preview**: See parsed tickets before creation
- **Edit Inline**: Modify any field directly in the preview
- **Bulk Actions**: Create all tickets at once or individually
- **Progress Tracking**: Real-time creation status

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Go to Tool Hub |
| `Ctrl+2` | Go to Ticket Creator |
| `Ctrl+3` | Go to Release Creator |
| `Ctrl+4` | Go to Settings |
| `Ctrl+/` | Show keyboard shortcuts |
| `Ctrl+Shift+D` | Toggle dark mode |
| `Ctrl+N` | Create new (context dependent) |
| `Ctrl+Enter` | Submit form/create tickets |
| `Escape` | Close modal/cancel action |

## 🏗️ Project Structure

```
JiraTool/
├── src/
│   ├── pages/              # Main application pages
│   │   ├── ToolHub.jsx     # Dashboard/home page
│   │   ├── TicketCreator.jsx # Ticket creation tool
│   │   ├── ReleaseCreator.jsx # Release page generator
│   │   └── Settings.jsx    # Configuration settings
│   │
│   ├── components/
│   │   ├── layout/         # Layout components
│   │   ├── ui/             # Reusable UI components
│   │   └── features/       # Feature-specific components
│   │
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and external services
│   ├── lib/                # Utilities and helpers
│   └── styles/             # Global styles
│
├── server/                 # Express.js backend
├── public/                 # Static assets
└── docs/                   # Documentation
```

For detailed structure information, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

## 🎨 UI/UX Features

### Modern Design System
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **Framer Motion**: Smooth animations and transitions
- **Radix UI**: Accessible component primitives

### Accessibility (WCAG 2.1 AA)
- **Screen Reader Support**: Full ARIA implementation
- **Keyboard Navigation**: Complete keyboard accessibility
- **Focus Management**: Proper focus trapping and flow
- **Color Contrast**: Meets AA standards
- **Reduced Motion**: Respects user preferences

### Performance
- **Code Splitting**: Lazy-loaded pages and components
- **Virtual Scrolling**: Efficient large list rendering
- **Debounced Inputs**: Optimized search and API calls
- **Error Boundaries**: Graceful error handling

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Jira Configuration
REACT_APP_JIRA_URL=https://your-company.atlassian.net
REACT_APP_JIRA_EMAIL=your-email@company.com
REACT_APP_JIRA_API_TOKEN=your-api-token

# Optional: Confluence Configuration
REACT_APP_CONFLUENCE_URL=https://your-company.atlassian.net/wiki
REACT_APP_CONFLUENCE_SPACE_KEY=your-space-key

# Optional: Slack Integration
REACT_APP_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Advanced Configuration
- **Custom Parsing Rules**: Modify text parsing patterns
- **Field Mappings**: Map parsed fields to Jira fields
- **Templates**: Create reusable ticket templates
- **Automation**: Set up automated workflows

## 🚀 Development

### Development Scripts
```bash
npm start              # Start frontend only
npm run build          # Build for production
./start-full.sh        # Start full-stack development
```

### Code Quality
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (if configured)
- **TypeScript Ready**: JSDoc comments for better IntelliSense

### Testing
```bash
npm test               # Run test suite
npm run test:coverage  # Run tests with coverage
```

## 📊 Analytics & Monitoring

### Performance Monitoring
- **Vercel Analytics**: Page load times and user interactions
- **Speed Insights**: Core Web Vitals tracking
- **Error Boundaries**: Error tracking and reporting

### User Experience Metrics
- **Keyboard Usage**: Track shortcut adoption
- **Feature Usage**: Monitor tool utilization
- **Error Rates**: Track and improve reliability

## 🔒 Security

### API Security
- **Environment Variables**: Sensitive data protection
- **CORS Configuration**: Proper cross-origin handling
- **Input Validation**: Client and server-side validation
- **Error Handling**: No sensitive info in error messages

### Data Privacy
- **Local Storage**: Minimal data persistence
- **No Tracking**: Privacy-focused analytics
- **Secure Transmission**: HTTPS for all API calls

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- Follow existing code style
- Add JSDoc comments for new functions
- Ensure accessibility compliance
- Test on multiple browsers

## 📚 Documentation

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed project organization
- [PHASE_4_IMPLEMENTATION_SUMMARY.md](./PHASE_4_IMPLEMENTATION_SUMMARY.md) - Recent enhancements
- [API Documentation](./server/README.md) - Backend API reference

## 🐛 Troubleshooting

### Common Issues

#### Connection Problems
- Verify Jira URL format (include https://)
- Check API token validity (72+ characters)
- Ensure email matches Atlassian account

#### Performance Issues
- Clear browser cache
- Check network connectivity
- Verify server is running on port 3001

#### UI Issues
- Try refreshing the page
- Check browser console for errors
- Ensure JavaScript is enabled

### Getting Help
1. Check the [Issues](./issues) page
2. Review documentation
3. Contact the development team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the excellent component library
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **Radix UI** for accessible primitives
- **Vercel** for hosting and analytics

---

**Version**: 2.0  
**Last Updated**: October 11, 2025  
**Status**: ✅ Production Ready

For technical details and architecture information, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).