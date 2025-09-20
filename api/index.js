import express from "express";
import compression from "compression";
import session from "express-session";
import bcrypt from "bcryptjs";

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

// Simple in-memory storage for demo (replace with database in production)
let users = [];
let properties = [];
let favorites = [];
let inquiries = [];

// Utility functions
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Middleware to populate user
const populateUser = async (req, res, next) => {
  if (req.session.userId) {
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
      req.user = user;
    }
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

app.use(populateUser);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running on Vercel' });
});

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await hashPassword(password);
    const user = {
      id: generateId(),
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    req.session.userId = user.id;
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValidPassword = await comparePassword(password, user.password);
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

// Properties routes
app.get('/api/properties', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    
    const { type, country, city, minPrice, maxPrice, bedrooms, bathrooms, listingType, sortBy, order, search } = req.query;
    
    let filteredProperties = [...properties];
    
    // Apply filters
    if (type) filteredProperties = filteredProperties.filter(p => p.type === type);
    if (country) filteredProperties = filteredProperties.filter(p => p.country === country);
    if (city) filteredProperties = filteredProperties.filter(p => p.city === city);
    if (minPrice) filteredProperties = filteredProperties.filter(p => parseFloat(p.price) >= parseFloat(minPrice));
    if (maxPrice) filteredProperties = filteredProperties.filter(p => parseFloat(p.price) <= parseFloat(maxPrice));
    if (bedrooms) filteredProperties = filteredProperties.filter(p => p.bedrooms >= parseInt(bedrooms));
    if (bathrooms) filteredProperties = filteredProperties.filter(p => p.bathrooms >= parseInt(bathrooms));
    if (listingType) filteredProperties = filteredProperties.filter(p => p.listingType === listingType);
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredProperties = filteredProperties.filter(p => 
        p.title?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.address?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    if (sortBy === 'price') {
      filteredProperties.sort((a, b) => {
        const priceA = parseFloat(a.price);
        const priceB = parseFloat(b.price);
        return order === 'desc' ? priceB - priceA : priceA - priceB;
      });
    }
    
    const totalCount = filteredProperties.length;
    const paginatedProperties = filteredProperties.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      properties: paginatedProperties,
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
    
    // Try to find by slug first, then by id
    let property = properties.find(p => p.slug === identifier) || properties.find(p => p.id === identifier);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Failed to fetch property' });
  }
});

// Favorites routes
app.get('/api/favorites', requireAuth, async (req, res) => {
  try {
    const userFavorites = favorites.filter(f => f.userId === req.user.id);
    const favoriteProperties = userFavorites.map(f => {
      const property = properties.find(p => p.id === f.propertyId);
      return property;
    }).filter(Boolean);
    
    res.json(favoriteProperties);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

app.post('/api/favorites', requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }
    
    // Check if already favorited
    const existingFavorite = favorites.find(f => f.userId === req.user.id && f.propertyId === propertyId);
    if (existingFavorite) {
      return res.status(409).json({ message: 'Property already in favorites' });
    }
    
    const favorite = {
      id: generateId(),
      userId: req.user.id,
      propertyId,
      createdAt: new Date().toISOString()
    };
    
    favorites.push(favorite);
    res.status(201).json(favorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

app.delete('/api/favorites/:propertyId', requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const initialLength = favorites.length;
    favorites = favorites.filter(f => !(f.userId === req.user.id && f.propertyId === propertyId));
    
    if (favorites.length === initialLength) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

// Inquiries routes
app.post('/api/inquiries', requireAuth, async (req, res) => {
  try {
    const { propertyId, message, contactInfo } = req.body;
    
    if (!propertyId || !message) {
      return res.status(400).json({ message: 'Property ID and message are required' });
    }
    
    const inquiry = {
      id: generateId(),
      userId: req.user.id,
      propertyId,
      message,
      contactInfo: contactInfo || req.user.email,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    inquiries.push(inquiry);
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

// Handle 404 for API routes
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Export the Express app for Vercel
export default app;