# 🚀 Deployment Guide - Jira Ticket Creator Tool

## 📋 Vercel Deployment (Recommended)

### Prerequisites
- GitHub/GitLab repository
- Vercel account (free tier available)
- Node.js 18+ (for local testing)

### Step-by-Step Deployment

#### 1. **Prepare Repository**
```bash
# Ensure all changes are committed
git add .
git commit -m "feat: prepare for Vercel deployment"
git push origin main
```

#### 2. **Deploy to Vercel**

**Option A: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: jira-ticket-creator (or your preferred name)
# - Directory: ./ (current directory)
# - Override settings? No
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: ./
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

#### 3. **Configure Environment Variables**
In Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Required
NODE_ENV=production
REACT_APP_API_BASE_URL=https://your-app-name.vercel.app/api

# Optional (for enhanced security)
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

#### 4. **Custom Domain (Optional)**
- Go to Vercel Dashboard → Project → Settings → Domains
- Add your custom domain
- Configure DNS records as instructed

### 🔧 **Vercel Configuration Details**

**File Structure for Vercel:**
```
JiraTool/
├── vercel.json          # Vercel configuration
├── package.json         # Build scripts
├── build/              # React build output
├── server/
│   └── server.js       # API serverless functions
└── src/                # React source code
```

**Key Configuration Files:**
- `vercel.json`: Routes and build configuration
- `src/config/api.js`: Dynamic API URL handling
- `server/server.js`: Serverless function compatibility

---

## 🌐 **Alternative Deployment Options**

### **Option 1: Netlify**
```bash
# Build command
npm run build

# Publish directory
build

# Redirects (_redirects file needed)
/api/* https://your-backend-url.com/api/:splat 200
/* /index.html 200
```

### **Option 2: Railway**
```bash
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run server",
    "healthcheckPath": "/api/health"
  }
}
```

### **Option 3: Heroku**
```bash
# Procfile
web: npm run server
release: npm run build
```

---

## 🔍 **Post-Deployment Checklist**

### ✅ **Functionality Tests**
1. **Frontend Loading**
   - [ ] App loads without errors
   - [ ] Navigation works
   - [ ] UI components render correctly

2. **API Connectivity**
   - [ ] Health check: `https://your-app.vercel.app/api/health`
   - [ ] Jira connection test works
   - [ ] File upload functionality

3. **Core Features**
   - [ ] Ticket parsing works
   - [ ] Jira ticket creation
   - [ ] Confluence page creation
   - [ ] File attachments

### 🐛 **Troubleshooting**

**Common Issues:**

1. **API Base URL Problems**
   ```bash
   # Check browser console for API calls
   # Verify REACT_APP_API_BASE_URL is set correctly
   ```

2. **File Upload Issues**
   ```bash
   # Vercel has 50MB limit for serverless functions
   # Files are stored in /tmp (temporary)
   ```

3. **CORS Errors**
   ```bash
   # Ensure API routes are properly configured in vercel.json
   # Check server/server.js CORS settings
   ```

### 📊 **Performance Monitoring**
- Vercel Analytics (built-in)
- Function logs in Vercel Dashboard
- Browser DevTools Network tab

---

## 🔒 **Security Considerations**

### **Environment Variables**
- Never commit API tokens to Git
- Use Vercel's environment variables
- Rotate tokens regularly

### **CORS Configuration**
- Configure appropriate origins
- Limit API access if needed

### **File Upload Security**
- 40MB file size limit (configured)
- File type validation (configured)
- Temporary storage in Vercel

---

## 📈 **Scaling & Optimization**

### **Vercel Limits (Free Tier)**
- 100GB bandwidth/month
- 100 serverless function invocations/day
- 10 second function timeout

### **Optimization Tips**
1. **Code Splitting**: Already implemented with React.lazy()
2. **Caching**: Vercel handles static asset caching
3. **Bundle Size**: Monitor with `npm run build`

### **Upgrade Considerations**
- Pro plan for higher limits
- Custom domains
- Advanced analytics

---

## 🎯 **Quick Commands**

```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel

# Check deployment status
vercel ls

# View logs
vercel logs your-app-name
```

---

## 📞 **Support & Resources**

- **Vercel Documentation**: https://vercel.com/docs
- **React Deployment**: https://create-react-app.dev/docs/deployment/
- **Express on Vercel**: https://vercel.com/guides/using-express-with-vercel

**Need Help?**
- Check Vercel Dashboard logs
- Review browser console errors
- Test API endpoints individually
