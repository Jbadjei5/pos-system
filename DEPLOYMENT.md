# 🚀 Vercel Deployment Guide

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
node deploy.js

# 3. Deploy to Vercel
vercel --prod
```

## What Gets Deployed
- ✅ Frontend: main.html (static site)
- ✅ Backend: server-sqlite.js (serverless functions)
- ✅ Database: SQLite with demo users
- ✅ All 8 products with categories
- ✅ User authentication system
- ✅ Modern responsive UI

## Live URL
After deployment, your POS will be available at:
`https://your-app-name.vercel.app`

## Features
- User login/signup with JWT
- Product management
- Sales processing
- Inventory tracking
- Customer management
- Reporting
- User profile modal
- Remember me functionality
- Responsive design

## Production vs Development
- **Development**: localhost:3000 with local SQLite
- **Production**: Vercel serverless with online database

## Support
For deployment issues, check Vercel dashboard or run `vercel logs`
