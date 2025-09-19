import express from "express";
import compression from "compression";
import { storage } from "../server/storage.js";
import { 
  insertPropertySchema, updatePropertySchema, insertInquirySchema, insertFavoriteSchema, insertUserSchema,
  insertWaveSchema, insertCustomerWavePermissionSchema, insertCurrencyRateSchema, updateCurrencyRateSchema
} from "../shared/schema.js";
import { extractPropertyIdentifier } from "../shared/slug-utils.js";
import { hashPassword, requireAuth, requireRole, requireAnyRole, populateUser, validateLanguagePermission } from "../server/auth.js";
import session from "express-session";
import { z } from "zod";

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Enable compression
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session configuration for Vercel
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Add user to all requests
app.use(populateUser);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running on Vercel' });
});

// Properties routes
app.get('/api/properties', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    
    const { type, country, city, minPrice, maxPrice, bedrooms, bathrooms, listingType, sortBy, order, search, language } = req.query;
    
    const filters = {
      type: type,
      country: country,
      city: city,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      listingType: listingType,
      search: search,
      language: language
    };
    
    const properties = await storage.getProperties(filters, {
      offset,
      limit,
      sortBy: sortBy,
      order: order
    });
    
    const totalCount = await storage.getPropertiesCount(filters);
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      properties,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
});

app.get('/api/properties/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let property = await storage.getPropertyBySlug(identifier);
    
    if (!property) {
      property = await storage.getProperty(identifier);
    }
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Failed to fetch property' });
  }
});

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const hashedPassword = await hashPassword(userData.password);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });
    
    req.session.userId = user.id;
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message?.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(400).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
app.get('/api/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Favorites routes
app.get('/api/favorites', requireAuth, async (req, res) => {
  try {
    const favorites = await storage.getUserFavorites(req.user.id);
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

app.post('/api/favorites', requireAuth, async (req, res) => {
  try {
    const favoriteData = insertFavoriteSchema.parse({
      ...req.body,
      userId: req.user.id
    });
    
    const favorite = await storage.addFavorite(favoriteData);
    res.status(201).json(favorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

app.delete('/api/favorites/:propertyId', requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    await storage.removeFavorite(req.user.id, propertyId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

// Inquiries routes
app.post('/api/inquiries', requireAuth, async (req, res) => {
  try {
    const inquiryData = insertInquirySchema.parse({
      ...req.body,
      userId: req.user.id
    });
    
    const inquiry = await storage.createInquiry(inquiryData);
    res.status(201).json(inquiry);
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ message: 'Failed to create inquiry' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Export the Express app for Vercel
export default app;