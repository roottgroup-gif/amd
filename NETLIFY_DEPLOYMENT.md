# Netlify Deployment Guide

Your project has been configured for Netlify deployment with the following setup:

## Files Created/Modified:
- `functions/api.ts` - Serverless function wrapping your Express backend
- `netlify.toml` - Deployment configuration
- `package.json` - Added serverless-http dependency

## Deployment Steps:

### 1. Prepare Your Repository
1. Commit all changes to your Git repository
2. Push to GitHub/GitLab

### 2. Deploy to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Connect your repository
4. Build settings should be auto-detected from `netlify.toml`
5. Click "Deploy site"

### 3. Configure Environment Variables
In your Netlify site dashboard → Environment variables, add:
```
SESSION_SECRET=your-secure-random-string-here
FRONTEND_URL=https://your-site-name.netlify.app
NODE_ENV=production
```

If using an external database:
```
DATABASE_URL=your-database-connection-string
```

## Important Limitations for Serverless:

### ⚠️ Known Issues:
1. **Real-time features (SSE)**: Server-Sent Events may not work reliably due to function timeouts
2. **Session persistence**: Sessions use in-memory storage and may not persist across function instances
3. **Meta tag injection**: Property-specific social media tags won't work with static deployment

### 🔧 Recommended Solutions:
1. **For real-time updates**: Consider using polling or a managed service like Pusher/Ably
2. **For authentication**: Consider JWT tokens instead of sessions for better serverless compatibility
3. **For SEO**: Use Netlify's On-demand Builders or Edge Functions for dynamic meta tags

## Testing Your Deployment:
1. Visit your Netlify site URL
2. Test API endpoints: `https://your-site.netlify.app/api/properties`
3. Test authentication and data persistence
4. Check browser console for any CORS or session issues

## Custom Domain:
1. In Netlify dashboard → Domain settings
2. Add your custom domain
3. Update `FRONTEND_URL` environment variable

Your site will be available at: `https://your-site-name.netlify.app`