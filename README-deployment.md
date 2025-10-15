# FOLSME Backend Deployment Guide

## Overview
Your website is now hosted on Netlify (frontend) and needs a separate backend deployment for the admin dashboard and database functionality.

## Recommended Hosting Platforms

### 1. Railway (Recommended for ease of use)
- **Pros**: Easy deployment, built-in database, free tier available
- **URL**: https://railway.app

### 2. Render
- **Pros**: Free tier, PostgreSQL support, good for Node.js
- **URL**: https://render.com

### 3. Heroku
- **Pros**: Mature platform, easy scaling
- **URL**: https://heroku.com

## Deployment Steps

### Step 1: Choose a Platform
I recommend **Railway** for its simplicity and built-in database support.

### Step 2: Deploy Backend
1. Sign up for Railway account
2. Connect your GitHub repository
3. Railway will automatically detect it's a Node.js app
4. Set environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `SESSION_SECRET=your-super-secret-key`
   - `ALLOWED_ORIGINS=https://your-netlify-site.netlify.app`
   - `PAYSTACK_SECRET_KEY=your-paystack-key` (if using live payments)

### Step 3: Get Your Backend URL
After deployment, Railway will give you a URL like: `https://folsme-backend.up.railway.app`

### Step 4: Update Frontend
In your admin dashboard JavaScript (`admin/admin.js`), update the `getApiBaseUrl()` function:

```javascript
function getApiBaseUrl() {
  return window.location.hostname === 'localhost'
    ? ''
    : 'https://folsme-backend.up.railway.app'; // Replace with your actual Railway URL
}
```

### Step 5: Update CORS in Backend
In `server.js`, update the CORS configuration with your actual Netlify domain:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://your-actual-netlify-site.netlify.app'])
    : 'http://localhost:3000',
  credentials: true
}));
```

## Testing
1. Deploy backend first
2. Update frontend with backend URL
3. Redeploy frontend to Netlify
4. Test admin login at `https://your-netlify-site.netlify.app/admin/`
5. Verify all API calls work (orders, products, wallets, etc.)

## Environment Variables
Copy `.env.example` to `.env` and fill in your actual values before deployment.

## Database
Railway provides a built-in PostgreSQL database. The app will automatically create tables on first run.

## Support
If you encounter issues, check:
1. Railway deployment logs
2. Browser console for CORS errors
3. Network tab for failed API calls