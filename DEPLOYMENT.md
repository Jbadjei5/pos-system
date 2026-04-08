# Deployment Guide

This guide will help you deploy your POS system with frontend on Vercel and backend on Render.

## Prerequisites

- GitHub repository connected to both Vercel and Render
- Node.js 14+ installed locally
- Render and Vercel accounts

## Backend Deployment (Render)

### 1. Database Setup
1. Go to Render Dashboard
2. Create a new PostgreSQL database (free tier available)
3. Note the database connection details

### 2. Backend Service Setup
1. Push your code to GitHub
2. In Render Dashboard, click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: pos-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 3. Environment Variables
Set these environment variables in your Render service:

```
NODE_ENV=production
PORT=10000
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=pos_system
JWT_SECRET=your-super-secret-jwt-key-here
PAYSTACK_PUBLIC_KEY=pk_live_ac50bb69405548b385982fc3639348a1570e0dc5
PAYSTACK_SECRET_KEY=your-paystack-secret-key
```

### 4. Update Database Configuration
Your backend is configured to use MySQL, but Render provides PostgreSQL. Update your `server.js` to use PostgreSQL:

```bash
npm install pg
```

Replace the MySQL import with:
```javascript
const { Pool } = require('pg');
```

## Frontend Deployment (Vercel)

### 1. Connect Repository
1. Go to Vercel Dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will automatically detect the static files

### 2. Configure Environment Variables
In Vercel project settings, add:
```
RENDER_API_URL=https://your-render-backend-url.onrender.com
```

### 3. Update vercel.json
After deploying your backend, update the `vercel.json` file:
```json
{
  "version": 2,
  "routes": [
    {
      "src": "/",
      "dest": "/main.html"
    },
    {
      "src": "/login",
      "dest": "/login.html"
    },
    {
      "src": "/signup", 
      "dest": "/signup.html"
    },
    {
      "src": "/api/(.*)",
      "dest": "https://your-actual-render-url.onrender.com/api/$1"
    }
  ]
}
```

## Deployment Steps

### Step 1: Deploy Backend First
1. Push your code to GitHub
2. Deploy to Render with the configuration above
3. Wait for deployment to complete and get the URL

### Step 2: Update Frontend Configuration
1. Update `vercel.json` with your actual Render backend URL
2. Update the `RENDER_API_URL` environment variable in Vercel

### Step 3: Deploy Frontend
1. Push the updated configuration
2. Vercel will automatically redeploy
3. Test the application

## Important Notes

### CORS Configuration
Your backend needs to allow requests from your Vercel domain. Update your CORS configuration in `server.js`:

```javascript
const corsOptions = {
  origin: ['https://your-vercel-domain.vercel.app', 'http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));
```

### Database Migration
After deployment, you may need to run database migrations. You can do this by:
1. Adding a migration script to your `package.json`
2. Running it manually through Render's shell access
3. Or using Render's deploy hooks

### HTTPS
Both Vercel and Render automatically provide HTTPS certificates, so no additional SSL configuration is needed.

## Testing

1. **Backend**: Test API endpoints directly at `https://your-render-url.onrender.com/api/`
2. **Frontend**: Test the full application at `https://your-vercel-domain.vercel.app`
3. **Integration**: Test login, product management, and sales functionality

## Troubleshooting

### Common Issues
- **CORS errors**: Ensure your backend allows requests from your Vercel domain
- **Database connection**: Check environment variables and database status
- **API timeouts**: Verify the backend URL is correct in frontend configuration

### Logs
- **Render**: Check logs in Render dashboard under your service
- **Vercel**: Check logs in Vercel dashboard under your project

## Cost

- **Render Free Tier**: 750 hours/month, limited bandwidth
- **Vercel Hobby Tier**: Free for personal projects with generous limits
- **Database**: Render offers free PostgreSQL tier with limitations

For production use, consider upgrading to paid plans for better performance and support.
