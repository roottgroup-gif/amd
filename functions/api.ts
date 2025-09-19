import express from 'express';
import serverless from 'serverless-http';
import compression from 'compression';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Since we're in a serverless environment, we need to handle imports carefully
// The storage and routes will be initialized on demand

const MemoryStoreSession = MemoryStore(session);

// Create app with basic middleware
const app = express();

// Basic middleware setup for serverless environment
app.use(compression({
  threshold: 1024,
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session configuration for serverless
app.use(session({
  secret: process.env.SESSION_SECRET || 'netlify-serverless-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Add CORS headers for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize the app routes
async function initializeApp() {
  try {
    // Dynamically import the routes module
    const { registerRoutes } = await import('../server/routes.js');
    
    // Register all the routes from the original server
    await registerRoutes(app);
    
    // Error handling middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    
    return app;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

// For Netlify Functions, we need to export the handler
let serverlessApp: any;

export const handler = async (event: any, context: any) => {
  // Initialize app on first request (cold start)
  if (!serverlessApp) {
    const initializedApp = await initializeApp();
    serverlessApp = serverless(initializedApp);
  }
  
  // Handle the request
  return serverlessApp(event, context);
};