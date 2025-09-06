import { 
  users, properties, inquiries, favorites, searchHistory,
  type User, type InsertUser,
  type Property, type InsertProperty, type PropertyWithAgent,
  type Inquiry, type InsertInquiry,
  type Favorite, type InsertFavorite,
  type SearchHistory, type InsertSearchHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Authentication
  authenticateUser(username: string, password: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Properties
  getProperty(id: string): Promise<PropertyWithAgent | undefined>;
  getProperties(filters?: PropertyFilters): Promise<PropertyWithAgent[]>;
  getPropertiesByAgent(agentId: string): Promise<PropertyWithAgent[]>;
  getFeaturedProperties(): Promise<PropertyWithAgent[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  incrementPropertyViews(id: string): Promise<void>;

  // Inquiries
  getInquiry(id: string): Promise<Inquiry | undefined>;
  getInquiriesForProperty(propertyId: string): Promise<Inquiry[]>;
  getInquiriesForAgent(agentId: string): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined>;

  // Favorites
  getFavoritesByUser(userId: string): Promise<PropertyWithAgent[]>;
  addToFavorites(favorite: InsertFavorite): Promise<Favorite>;
  removeFromFavorites(userId: string, propertyId: string): Promise<boolean>;
  isFavorite(userId: string, propertyId: string): Promise<boolean>;

  // Search History
  addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistoryByUser(userId: string): Promise<SearchHistory[]>;
}

export interface PropertyFilters {
  type?: string;
  listingType?: "sale" | "rent";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  country?: string;
  features?: string[];
  search?: string;
  sortBy?: "price" | "date" | "views";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db()
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db()
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Authentication
  async authenticateUser(username: string, password: string): Promise<User | null> {
    const bcrypt = await import('bcryptjs');
    const user = await this.getUserByUsername(username);
    
    if (!user) return null;
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  async getAllUsers(): Promise<User[]> {
    return await db().select().from(users).orderBy(users.createdAt);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db().delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Properties
  async getProperty(id: string): Promise<PropertyWithAgent | undefined> {
    const [property] = await db()
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.agentId, users.id))
      .where(eq(properties.id, id));

    if (!property) return undefined;

    return {
      ...property.properties,
      agent: property.users,
    };
  }

  async getProperties(filters: PropertyFilters = {}): Promise<PropertyWithAgent[]> {
    const conditions = [];

    if (filters.type) {
      conditions.push(eq(properties.type, filters.type));
    }
    if (filters.listingType) {
      conditions.push(eq(properties.listingType, filters.listingType));
    }
    if (filters.minPrice) {
      conditions.push(gte(properties.price, filters.minPrice.toString()));
    }
    if (filters.maxPrice) {
      conditions.push(lte(properties.price, filters.maxPrice.toString()));
    }
    if (filters.bedrooms) {
      conditions.push(gte(properties.bedrooms, filters.bedrooms));
    }
    if (filters.bathrooms) {
      conditions.push(gte(properties.bathrooms, filters.bathrooms));
    }
    if (filters.city) {
      conditions.push(like(properties.city, `%${filters.city}%`));
    }
    if (filters.country) {
      conditions.push(eq(properties.country, filters.country));
    }
    if (filters.search) {
      conditions.push(
        sql`(${properties.title} ILIKE ${`%${filters.search}%`} OR ${properties.description} ILIKE ${`%${filters.search}%`} OR ${properties.address} ILIKE ${`%${filters.search}%`})`
      );
    }

    conditions.push(eq(properties.status, "active"));

    // Build base query with latest inquiry that has a phone number
    const baseQuery = db()
      .select({
        properties: properties,
        users: users,
        latestInquiry: {
          id: inquiries.id,
          name: inquiries.name,
          phone: inquiries.phone,
          email: inquiries.email,
          createdAt: inquiries.createdAt
        }
      })
      .from(properties)
      .leftJoin(users, eq(properties.agentId, users.id))
      .leftJoin(
        inquiries, 
        sql`${inquiries.propertyId} = ${properties.id} AND ${inquiries.phone} IS NOT NULL AND ${inquiries.phone} != '' AND ${inquiries.id} = (
          SELECT i2.id 
          FROM ${inquiries} i2 
          WHERE i2.property_id = ${properties.id} 
          AND i2.phone IS NOT NULL 
          AND i2.phone != ''
          ORDER BY i2.created_at DESC 
          LIMIT 1
        )`
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Determine sorting
    let orderByClause;
    if (filters.sortBy === "price") {
      orderByClause = filters.sortOrder === "desc" ? desc(properties.price) : asc(properties.price);
    } else if (filters.sortBy === "views") {
      orderByClause = filters.sortOrder === "desc" ? desc(properties.views) : asc(properties.views);
    } else {
      orderByClause = filters.sortOrder === "desc" ? desc(properties.createdAt) : asc(properties.createdAt);
    }

    // Build final query with all clauses
    const finalQuery = baseQuery
      .orderBy(orderByClause)
      .$dynamic();

    let query = finalQuery;
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;
    return results.map(row => ({
      ...row.properties,
      agent: row.users,
      customerContact: row.latestInquiry ? {
        name: row.latestInquiry.name,
        phone: row.latestInquiry.phone,
        email: row.latestInquiry.email
      } : null,
    }));
  }

  async getPropertiesByAgent(agentId: string): Promise<PropertyWithAgent[]> {
    const results = await db()
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.agentId, users.id))
      .where(eq(properties.agentId, agentId))
      .orderBy(desc(properties.createdAt));

    return results.map(row => ({
      ...row.properties,
      agent: row.users,
    }));
  }

  async getFeaturedProperties(): Promise<PropertyWithAgent[]> {
    const results = await db()
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.agentId, users.id))
      .where(and(eq(properties.isFeatured, true), eq(properties.status, "active")))
      .orderBy(desc(properties.createdAt))
      .limit(6);

    return results.map(row => ({
      ...row.properties,
      agent: row.users,
    }));
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db()
      .insert(properties)
      .values(insertProperty as any)
      .returning();
    return property;
  }

  async updateProperty(id: string, updateProperty: Partial<InsertProperty>): Promise<Property | undefined> {
    const updateData = { ...updateProperty, updatedAt: new Date() } as any;
    const [property] = await db()
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const result = await db()
      .delete(properties)
      .where(eq(properties.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementPropertyViews(id: string): Promise<void> {
    await db()
      .update(properties)
      .set({ views: sql`${properties.views} + 1` })
      .where(eq(properties.id, id));
  }

  // Inquiries
  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db().select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry || undefined;
  }

  async getInquiriesForProperty(propertyId: string): Promise<Inquiry[]> {
    return await db()
      .select()
      .from(inquiries)
      .where(eq(inquiries.propertyId, propertyId))
      .orderBy(desc(inquiries.createdAt));
  }

  async getInquiriesForAgent(agentId: string): Promise<Inquiry[]> {
    const results = await db()
      .select({
        inquiry: inquiries,
        property: properties,
      })
      .from(inquiries)
      .innerJoin(properties, eq(inquiries.propertyId, properties.id))
      .where(eq(properties.agentId, agentId))
      .orderBy(desc(inquiries.createdAt));

    return results.map(row => row.inquiry);
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db()
      .insert(inquiries)
      .values(insertInquiry)
      .returning();
    return inquiry;
  }

  async updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db()
      .update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, id))
      .returning();
    return inquiry || undefined;
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<PropertyWithAgent[]> {
    const results = await db()
      .select()
      .from(favorites)
      .innerJoin(properties, eq(favorites.propertyId, properties.id))
      .leftJoin(users, eq(properties.agentId, users.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    return results.map(row => ({
      ...row.properties,
      agent: row.users,
    }));
  }

  async addToFavorites(favorite: InsertFavorite): Promise<Favorite> {
    const [fav] = await db()
      .insert(favorites)
      .values(favorite)
      .returning();
    return fav;
  }

  async removeFromFavorites(userId: string, propertyId: string): Promise<boolean> {
    const result = await db()
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return (result.rowCount ?? 0) > 0;
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const [favorite] = await db()
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return !!favorite;
  }

  // Search History
  async addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory> {
    const [history] = await db()
      .insert(searchHistory)
      .values(search)
      .returning();
    return history;
  }

  async getSearchHistoryByUser(userId: string): Promise<SearchHistory[]> {
    return await db()
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(10);
  }
}

class MemStorage implements IStorage {
  private users: User[] = [];
  private properties: Property[] = [];
  private inquiries: Inquiry[] = [];
  private favorites: Favorite[] = [];
  private searchHistories: SearchHistory[] = [];

  constructor() {
    // Initialize with admin and customer users
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
    const bcrypt = await import('bcryptjs');
    
    // Admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    this.users.push({
      id: 'admin-001',
      username: 'admin',
      email: 'admin@estateai.com',
      password: adminPasswordHash,
      role: 'super_admin',
      firstName: 'System',
      lastName: 'Admin',
      phone: '+964 750 000 0000',
      isVerified: true,
      avatar: null,
      createdAt: new Date(),
      expiresAt: null,
      isExpired: false
    });

    // Customer user
    const customerPasswordHash = await bcrypt.hash('customer123', 12);
    this.users.push({
      id: 'customer-001',
      username: 'Jutyar',
      email: 'jutyar@estateai.com',
      password: customerPasswordHash,
      role: 'user',
      firstName: 'Jutyar',
      lastName: 'Customer',
      phone: '+964 750 111 2222',
      isVerified: true,
      avatar: null,
      createdAt: new Date(),
      expiresAt: null,
      isExpired: false
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...user,
      createdAt: new Date(),
      expiresAt: user.expiresAt ? new Date(user.expiresAt) : null,
      isExpired: false
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = { 
      ...this.users[userIndex], 
      ...userData,
      expiresAt: userData.expiresAt ? new Date(userData.expiresAt) : this.users[userIndex].expiresAt
    };
    return this.users[userIndex];
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const bcrypt = await import('bcryptjs');
    const user = await this.getUserByUsername(username);
    
    if (!user) return null;
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;
    this.users.splice(userIndex, 1);
    return true;
  }

  // Stub implementations for other methods (can be expanded as needed)
  async getProperty(id: string): Promise<PropertyWithAgent | undefined> { return undefined; }
  async getProperties(filters?: PropertyFilters): Promise<PropertyWithAgent[]> { return []; }
  async getPropertiesByAgent(agentId: string): Promise<PropertyWithAgent[]> { return []; }
  async getFeaturedProperties(): Promise<PropertyWithAgent[]> { return []; }
  async createProperty(property: InsertProperty): Promise<Property> { 
    const newProperty: Property = { 
      id: `prop-${Date.now()}`, 
      ...property, 
      status: property.status || 'active',
      views: 0, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.properties.push(newProperty);
    return newProperty;
  }
  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined> { return undefined; }
  async deleteProperty(id: string): Promise<boolean> { return false; }
  async incrementPropertyViews(id: string): Promise<void> {}

  async getInquiry(id: string): Promise<Inquiry | undefined> { return undefined; }
  async getInquiriesForProperty(propertyId: string): Promise<Inquiry[]> { return []; }
  async getInquiriesForAgent(agentId: string): Promise<Inquiry[]> { return []; }
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const newInquiry: Inquiry = { id: `inq-${Date.now()}`, ...inquiry, createdAt: new Date() };
    this.inquiries.push(newInquiry);
    return newInquiry;
  }
  async updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined> { return undefined; }

  async getFavoritesByUser(userId: string): Promise<PropertyWithAgent[]> { return []; }
  async addToFavorites(favorite: InsertFavorite): Promise<Favorite> {
    const newFavorite: Favorite = { 
      id: `fav-${Date.now()}`, 
      userId: favorite.userId || null,
      propertyId: favorite.propertyId || null,
      createdAt: new Date() 
    };
    this.favorites.push(newFavorite);
    return newFavorite;
  }
  async removeFromFavorites(userId: string, propertyId: string): Promise<boolean> { return false; }
  async isFavorite(userId: string, propertyId: string): Promise<boolean> { return false; }

  async addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory> {
    const newSearch: SearchHistory = { 
      id: `search-${Date.now()}`, 
      userId: search.userId || null,
      query: search.query,
      filters: search.filters || null,
      results: search.results || null,
      createdAt: new Date() 
    };
    this.searchHistories.push(newSearch);
    return newSearch;
  }
  async getSearchHistoryByUser(userId: string): Promise<SearchHistory[]> { return []; }
}

// Use memory storage temporarily to bypass database connection issues
export const storage = new MemStorage();
