import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertInquirySchema, insertFavoriteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Properties routes
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

  app.post("/api/properties", async (req, res) => {
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

  app.put("/api/properties/:id", async (req, res) => {
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

  app.delete("/api/properties/:id", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
