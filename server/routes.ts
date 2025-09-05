import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertInquirySchema, insertFavoriteSchema, insertUserSchema } from "@shared/schema";
import { hashPassword, requireAuth, requireRole, requireAnyRole, populateUser } from "./auth";
import session from "express-session";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Add user to all requests
  app.use(populateUser);

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Admin routes - User management
  app.get("/api/admin/users", requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  // Properties routes (protected for agents and admins)
  app.get("/api/properties", async (req, res) => {
    try {
      const {
        type,
        listingType,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        city,
        country,
        search,
        sortBy,
        sortOrder,
        limit = "20",
        offset = "0"
      } = req.query;

      const filters = {
        type: type as string,
        listingType: listingType as "sale" | "rent",
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        bedrooms: bedrooms ? parseInt(bedrooms as string) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms as string) : undefined,
        city: city as string,
        country: country as string,
        search: search as string,
        sortBy: sortBy as "price" | "date" | "views",
        sortOrder: sortOrder as "asc" | "desc",
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/featured", async (req, res) => {
    try {
      const properties = await storage.getFeaturedProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Increment views
      await storage.incrementPropertyViews(id);
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", requireAnyRole(["agent", "admin"]), async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", requireAnyRole(["agent", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(id, validatedData);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", requireAnyRole(["agent", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProperty(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Agent properties
  app.get("/api/agents/:agentId/properties", async (req, res) => {
    try {
      const { agentId } = req.params;
      const properties = await storage.getPropertiesByAgent(agentId);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent properties" });
    }
  });

  // Inquiries routes
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.get("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const inquiries = await storage.getInquiriesForProperty(propertyId);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/agents/:agentId/inquiries", async (req, res) => {
    try {
      const { agentId } = req.params;
      const inquiries = await storage.getInquiriesForAgent(agentId);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent inquiries" });
    }
  });

  app.put("/api/inquiries/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "replied", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const inquiry = await storage.updateInquiryStatus(id, status);
      
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });

  // Favorites routes
  app.get("/api/users/:userId/favorites", async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites = await storage.getFavoritesByUser(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse(req.body);
      const favorite = await storage.addToFavorites(validatedData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  app.delete("/api/favorites", async (req, res) => {
    try {
      const { userId, propertyId } = req.body;
      
      if (!userId || !propertyId) {
        return res.status(400).json({ message: "userId and propertyId are required" });
      }
      
      const removed = await storage.removeFromFavorites(userId, propertyId);
      
      if (!removed) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.json({ message: "Removed from favorites" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });

  app.get("/api/favorites/check", async (req, res) => {
    try {
      const { userId, propertyId } = req.query;
      
      if (!userId || !propertyId) {
        return res.status(400).json({ message: "userId and propertyId are required" });
      }
      
      const isFavorite = await storage.isFavorite(userId as string, propertyId as string);
      res.json({ isFavorite });
    } catch (error) {
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // AI Search endpoint (basic implementation)
  app.post("/api/search/ai", async (req, res) => {
    try {
      const { query, userId } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      // Basic AI search implementation - parse common patterns
      const searchTerms = query.toLowerCase();
      const filters: any = {};

      // Extract price range
      const priceMatch = searchTerms.match(/under\s+\$?([\d,]+)|below\s+\$?([\d,]+)|less\s+than\s+\$?([\d,]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]?.replace(',', '') || priceMatch[2]?.replace(',', '') || priceMatch[3]?.replace(',', ''));
        filters.maxPrice = price;
      }

      // Extract bedrooms
      const bedroomMatch = searchTerms.match(/(\d+)\s*bed/);
      if (bedroomMatch) {
        filters.bedrooms = parseInt(bedroomMatch[1]);
      }

      // Extract property type
      if (searchTerms.includes('house')) filters.type = 'house';
      if (searchTerms.includes('apartment')) filters.type = 'apartment';
      if (searchTerms.includes('villa')) filters.type = 'villa';

      // Extract listing type
      if (searchTerms.includes('rent')) filters.listingType = 'rent';
      if (searchTerms.includes('buy') || searchTerms.includes('sale')) filters.listingType = 'sale';

      // Extract location
      const locations = ['erbil', 'baghdad', 'sulaymaniyah', 'kurdistan', 'iraq'];
      for (const location of locations) {
        if (searchTerms.includes(location)) {
          filters.city = location;
          break;
        }
      }

      // Add general search term
      filters.search = query;

      const properties = await storage.getProperties(filters);

      // Save search history if user is provided
      if (userId) {
        await storage.addSearchHistory({
          userId,
          query,
          filters,
          results: properties.length,
        });
      }

      res.json({
        query,
        filters,
        results: properties,
        count: properties.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to perform AI search" });
    }
  });

  // Search suggestions
  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const suggestions = [
        "Show me apartments under $150k in Erbil",
        "Find family homes with gardens near schools",
        "Luxury properties with mountain views",
        "3-bedroom houses under $200k",
        "Modern apartments for rent in Baghdad",
        "Villas with swimming pools in Kurdistan",
      ];
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Seed users endpoint
  app.post("/api/seed/users", async (req, res) => {
    try {
      // Check if users already exist
      const existingSuperAdmin = await storage.getUserByUsername("superadmin");
      const existingUser = await storage.getUserByUsername("john_doe");

      const createdUsers = [];

      if (!existingSuperAdmin) {
        // Create super admin
        const hashedPassword = await hashPassword("SuperAdmin123!");
        const superAdmin = await storage.createUser({
          username: "superadmin",
          email: "superadmin@estateai.com",
          password: hashedPassword,
          role: "super_admin",
          firstName: "Super",
          lastName: "Admin",
          phone: "+964-750-123-4567",
          isVerified: true,
        });
        createdUsers.push({ username: superAdmin.username, role: superAdmin.role });
      } else {
        createdUsers.push({ username: "superadmin", role: "super_admin", status: "already_exists" });
      }

      if (!existingUser) {
        // Create regular user
        const hashedPassword = await hashPassword("User123!");
        const regularUser = await storage.createUser({
          username: "john_doe",
          email: "john.doe@example.com",
          password: hashedPassword,
          role: "user",
          firstName: "John",
          lastName: "Doe",
          phone: "+964-750-987-6543",
          isVerified: true,
        });
        createdUsers.push({ username: regularUser.username, role: regularUser.role });
      } else {
        createdUsers.push({ username: "john_doe", role: "user", status: "already_exists" });
      }

      res.json({ 
        message: "Seed operation completed",
        users: createdUsers 
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
