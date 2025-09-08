import { 
  users, properties, inquiries, favorites, searchHistory, customerActivity, customerPoints,
  waves, customerWavePermissions,
  type User, type InsertUser,
  type Property, type InsertProperty, type PropertyWithAgent,
  type Inquiry, type InsertInquiry,
  type Favorite, type InsertFavorite,
  type SearchHistory, type InsertSearchHistory,
  type CustomerActivity, type InsertCustomerActivity,
  type CustomerPoints, type InsertCustomerPoints,
  type Wave, type InsertWave,
  type CustomerWavePermission, type InsertCustomerWavePermission
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
  getFeaturedProperties(): Promise<PropertyWithAgent[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  incrementPropertyViews(id: string): Promise<void>;

  // Inquiries
  getInquiry(id: string): Promise<Inquiry | undefined>;
  getInquiriesForProperty(propertyId: string): Promise<Inquiry[]>;
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

  // Customer Analytics
  addCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity>;
  getCustomerActivities(userId: string, limit?: number): Promise<CustomerActivity[]>;
  getCustomerPoints(userId: string): Promise<CustomerPoints | undefined>;
  updateCustomerPoints(userId: string, points: Partial<InsertCustomerPoints>): Promise<CustomerPoints>;
  getCustomerAnalytics(userId: string): Promise<{
    totalActivities: number;
    activitiesByType: { activityType: string; count: number; points: number }[];
    pointsHistory: { date: string; points: number }[];
    monthlyActivity: { month: string; activities: number }[];
  }>;

  // Wave management
  getWaves(): Promise<Wave[]>;
  getWave(id: string): Promise<Wave | undefined>;
  
  // Wave balance tracking
  getUserWaveUsage(userId: string): Promise<number>;
  getUserRemainingWaves(userId: string): Promise<number>;
  validateWaveAssignment(userId: string, waveId: string | null): Promise<{ valid: boolean; message?: string }>;
  updateUsersWithZeroWaveBalance(): Promise<number>;
  createWave(wave: InsertWave): Promise<Wave>;
  updateWave(id: string, wave: Partial<InsertWave>): Promise<Wave | undefined>;
  deleteWave(id: string): Promise<boolean>;

  // Customer wave permissions
  getCustomerWavePermissions(userId: string): Promise<CustomerWavePermission[]>;
  getWavePermission(userId: string, waveId: string): Promise<CustomerWavePermission | undefined>;
  grantWavePermission(permission: InsertCustomerWavePermission): Promise<CustomerWavePermission>;
  updateWavePermission(id: string, permission: Partial<InsertCustomerWavePermission>): Promise<CustomerWavePermission | undefined>;
  revokeWavePermission(userId: string, waveId: string): Promise<boolean>;
  getPropertiesByWave(waveId: string): Promise<PropertyWithAgent[]>;
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
    // Validate wave assignment if a wave is being assigned
    if (insertProperty.agentId && insertProperty.waveId) {
      const validation = await this.validateWaveAssignment(insertProperty.agentId, insertProperty.waveId);
      if (!validation.valid) {
        throw new Error(validation.message || 'Wave assignment not allowed');
      }
    }

    const [property] = await db()
      .insert(properties)
      .values(insertProperty as any)
      .returning();
    return property;
  }

  async updateProperty(id: string, updateProperty: Partial<InsertProperty>): Promise<Property | undefined> {
    // Get current property to check if wave assignment is changing
    const currentProperty = await this.getProperty(id);
    if (!currentProperty) {
      return undefined;
    }

    // Validate wave assignment if a wave is being assigned or changed
    if (updateProperty.waveId !== undefined && currentProperty.agentId) {
      const validation = await this.validateWaveAssignment(currentProperty.agentId, updateProperty.waveId);
      if (!validation.valid) {
        throw new Error(validation.message || 'Wave assignment not allowed');
      }
    }

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

  // Customer Analytics
  async addCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    const [newActivity] = await db()
      .insert(customerActivity)
      .values(activity)
      .returning();
    
    // Update customer points
    await this.updateCustomerPointsAfterActivity(activity.userId, activity.points || 0);
    
    return newActivity;
  }

  async getCustomerActivities(userId: string, limit: number = 50): Promise<CustomerActivity[]> {
    return await db()
      .select()
      .from(customerActivity)
      .where(eq(customerActivity.userId, userId))
      .orderBy(desc(customerActivity.createdAt))
      .limit(limit);
  }

  async getCustomerPoints(userId: string): Promise<CustomerPoints | undefined> {
    const [points] = await db()
      .select()
      .from(customerPoints)
      .where(eq(customerPoints.userId, userId));
    return points || undefined;
  }

  async updateCustomerPoints(userId: string, pointsData: Partial<InsertCustomerPoints>): Promise<CustomerPoints> {
    const existing = await this.getCustomerPoints(userId);
    
    if (existing) {
      const [updated] = await db()
        .update(customerPoints)
        .set({ ...pointsData, updatedAt: new Date() })
        .where(eq(customerPoints.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db()
        .insert(customerPoints)
        .values({ userId, ...pointsData })
        .returning();
      return created;
    }
  }

  private async updateCustomerPointsAfterActivity(userId: string, activityPoints: number): Promise<void> {
    const existing = await this.getCustomerPoints(userId);
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    
    if (existing) {
      const newTotal = existing.totalPoints + activityPoints;
      const newLevel = this.calculateLevel(newTotal);
      
      await db()
        .update(customerPoints)
        .set({
          totalPoints: newTotal,
          currentLevel: newLevel,
          pointsThisMonth: existing.pointsThisMonth + activityPoints,
          lastActivity: new Date(),
          updatedAt: new Date()
        })
        .where(eq(customerPoints.userId, userId));
    } else {
      const newLevel = this.calculateLevel(activityPoints);
      
      await db()
        .insert(customerPoints)
        .values({
          userId,
          totalPoints: activityPoints,
          currentLevel: newLevel,
          pointsThisMonth: activityPoints,
          lastActivity: new Date(),
          updatedAt: new Date()
        });
    }
  }

  private calculateLevel(totalPoints: number): string {
    if (totalPoints >= 1000) return "Platinum";
    if (totalPoints >= 500) return "Gold";
    if (totalPoints >= 200) return "Silver";
    return "Bronze";
  }

  async getCustomerAnalytics(userId: string): Promise<{
    totalActivities: number;
    activitiesByType: { activityType: string; count: number; points: number }[];
    pointsHistory: { date: string; points: number }[];
    monthlyActivity: { month: string; activities: number }[];
  }> {
    // Get total activities count
    const [totalResult] = await db()
      .select({ count: sql<number>`count(*)` })
      .from(customerActivity)
      .where(eq(customerActivity.userId, userId));

    // Get activities by type
    const activitiesByType = await db()
      .select({
        activityType: customerActivity.activityType,
        count: sql<number>`count(*)`,
        points: sql<number>`sum(${customerActivity.points})`
      })
      .from(customerActivity)
      .where(eq(customerActivity.userId, userId))
      .groupBy(customerActivity.activityType);

    // Get points history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const pointsHistory = await db()
      .select({
        date: sql<string>`date(${customerActivity.createdAt})`,
        points: sql<number>`sum(${customerActivity.points})`
      })
      .from(customerActivity)
      .where(and(
        eq(customerActivity.userId, userId),
        gte(customerActivity.createdAt, thirtyDaysAgo)
      ))
      .groupBy(sql`date(${customerActivity.createdAt})`)
      .orderBy(sql`date(${customerActivity.createdAt})`);

    // Get monthly activity (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlyActivity = await db()
      .select({
        month: sql<string>`to_char(${customerActivity.createdAt}, 'YYYY-MM')`,
        activities: sql<number>`count(*)`
      })
      .from(customerActivity)
      .where(and(
        eq(customerActivity.userId, userId),
        gte(customerActivity.createdAt, twelveMonthsAgo)
      ))
      .groupBy(sql`to_char(${customerActivity.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${customerActivity.createdAt}, 'YYYY-MM')`);

    return {
      totalActivities: totalResult?.count || 0,
      activitiesByType: activitiesByType.map(row => ({
        activityType: row.activityType,
        count: row.count,
        points: row.points || 0
      })),
      pointsHistory: pointsHistory.map(row => ({
        date: row.date,
        points: row.points || 0
      })),
      monthlyActivity: monthlyActivity.map(row => ({
        month: row.month,
        activities: row.activities
      }))
    };
  }

  // Wave management
  async getWaves(): Promise<Wave[]> {
    return await db()
      .select()
      .from(waves)
      .where(eq(waves.isActive, true))
      .orderBy(waves.name);
  }

  async getWave(id: string): Promise<Wave | undefined> {
    const [wave] = await db()
      .select()
      .from(waves)
      .where(eq(waves.id, id));
    return wave || undefined;
  }

  async createWave(insertWave: InsertWave): Promise<Wave> {
    const [wave] = await db()
      .insert(waves)
      .values(insertWave)
      .returning();
    return wave;
  }

  async updateWave(id: string, updateWave: Partial<InsertWave>): Promise<Wave | undefined> {
    const [wave] = await db()
      .update(waves)
      .set({ ...updateWave, updatedAt: new Date() })
      .where(eq(waves.id, id))
      .returning();
    return wave || undefined;
  }

  async deleteWave(id: string): Promise<boolean> {
    // Soft delete by marking as inactive
    const result = await db()
      .update(waves)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(waves.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Customer wave permissions
  async getCustomerWavePermissions(userId: string): Promise<CustomerWavePermission[]> {
    const results = await db()
      .select()
      .from(customerWavePermissions)
      .innerJoin(waves, eq(customerWavePermissions.waveId, waves.id))
      .where(and(
        eq(customerWavePermissions.userId, userId),
        eq(waves.isActive, true)
      ))
      .orderBy(waves.name);

    return results.map(row => row.customer_wave_permissions);
  }

  async getWavePermission(userId: string, waveId: string): Promise<CustomerWavePermission | undefined> {
    const [permission] = await db()
      .select()
      .from(customerWavePermissions)
      .where(and(
        eq(customerWavePermissions.userId, userId),
        eq(customerWavePermissions.waveId, waveId)
      ));
    return permission || undefined;
  }

  async grantWavePermission(permission: InsertCustomerWavePermission): Promise<CustomerWavePermission> {
    // Check if permission already exists
    const existing = await this.getWavePermission(permission.userId, permission.waveId);
    
    if (existing) {
      // Update existing permission
      const [updated] = await db()
        .update(customerWavePermissions)
        .set({
          maxProperties: permission.maxProperties,
          grantedBy: permission.grantedBy,
          updatedAt: new Date()
        })
        .where(eq(customerWavePermissions.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new permission
      const [newPermission] = await db()
        .insert(customerWavePermissions)
        .values(permission)
        .returning();
      return newPermission;
    }
  }

  async updateWavePermission(id: string, permission: Partial<InsertCustomerWavePermission>): Promise<CustomerWavePermission | undefined> {
    const [updated] = await db()
      .update(customerWavePermissions)
      .set({ ...permission, updatedAt: new Date() })
      .where(eq(customerWavePermissions.id, id))
      .returning();
    return updated || undefined;
  }

  async revokeWavePermission(userId: string, waveId: string): Promise<boolean> {
    const result = await db()
      .delete(customerWavePermissions)
      .where(and(
        eq(customerWavePermissions.userId, userId),
        eq(customerWavePermissions.waveId, waveId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async getPropertiesByWave(waveId: string): Promise<PropertyWithAgent[]> {
    const results = await db()
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.agentId, users.id))
      .where(and(
        eq(properties.waveId, waveId),
        eq(properties.status, "active")
      ))
      .orderBy(desc(properties.createdAt));

    return results.map(row => ({
      ...row.properties,
      agent: row.users,
      wave: null // Will be populated by calling code if needed
    }));
  }

  // Wave balance tracking methods
  async getUserWaveUsage(userId: string): Promise<number> {
    const result = await db()
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(and(
        eq(properties.agentId, userId),
        sql`${properties.waveId} IS NOT NULL AND ${properties.waveId} != 'no-wave'`
      ));
    return result[0]?.count || 0;
  }

  async getUserRemainingWaves(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    
    // Admin and super_admin have unlimited waves
    if (user.role === 'admin' || user.role === 'super_admin') {
      return 999999; // Effectively unlimited
    }
    
    const currentUsage = await this.getUserWaveUsage(userId);
    const remaining = (user.waveBalance || 0) - currentUsage;
    return Math.max(0, remaining);
  }

  async validateWaveAssignment(userId: string, waveId: string | null): Promise<{ valid: boolean; message?: string }> {
    // If no wave is being assigned (null or 'no-wave'), it's always valid
    if (!waveId || waveId === 'no-wave') {
      return { valid: true };
    }

    const user = await this.getUser(userId);
    if (!user) {
      return { valid: false, message: 'User not found' };
    }

    // Admin and super_admin have unlimited waves
    if (user.role === 'admin' || user.role === 'super_admin') {
      return { valid: true };
    }

    const remainingWaves = await this.getUserRemainingWaves(userId);
    if (remainingWaves <= 0) {
      return { 
        valid: false, 
        message: `No wave assignments remaining. Current balance: ${user.waveBalance || 0}` 
      };
    }

    return { valid: true };
  }

  // Function to update wave balance for all users with 0 balance
  async updateUsersWithZeroWaveBalance(): Promise<number> {
    const result = await db()
      .update(users)
      .set({ waveBalance: 10 })
      .where(and(
        eq(users.waveBalance, 0),
        eq(users.role, 'user')
      ))
      .returning({ id: users.id });
    
    console.log(`Updated wave balance for ${result.length} users`);
    return result.length;
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
      role: 'super_admin' as const,
      firstName: 'System',
      lastName: 'Admin',
      phone: '+964 750 000 0000',
      isVerified: true,
      avatar: null,
      waveBalance: 999999,
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
      role: 'user' as const,
      firstName: 'Jutyar',
      lastName: 'Customer',
      phone: '+964 750 111 2222',
      isVerified: true,
      avatar: null,
      waveBalance: 10,
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

  // Property implementations
  async getProperty(id: string): Promise<PropertyWithAgent | undefined> { 
    const property = this.properties.find(p => p.id === id);
    if (!property) return undefined;
    
    const agent = this.users.find(u => u.id === property.agentId);
    return {
      ...property,
      agent: agent || null
    };
  }
  
  async getProperties(filters?: PropertyFilters): Promise<PropertyWithAgent[]> { 
    let filteredProperties = [...this.properties];
    
    // Apply filters if provided
    if (filters) {
      if (filters.type) {
        filteredProperties = filteredProperties.filter(p => p.type === filters.type);
      }
      if (filters.listingType) {
        filteredProperties = filteredProperties.filter(p => p.listingType === filters.listingType);
      }
      if (filters.minPrice) {
        filteredProperties = filteredProperties.filter(p => parseFloat(p.price) >= filters.minPrice!);
      }
      if (filters.maxPrice) {
        filteredProperties = filteredProperties.filter(p => parseFloat(p.price) <= filters.maxPrice!);
      }
      if (filters.bedrooms) {
        filteredProperties = filteredProperties.filter(p => (p.bedrooms || 0) >= filters.bedrooms!);
      }
      if (filters.bathrooms) {
        filteredProperties = filteredProperties.filter(p => (p.bathrooms || 0) >= filters.bathrooms!);
      }
      if (filters.city) {
        filteredProperties = filteredProperties.filter(p => p.city.toLowerCase().includes(filters.city!.toLowerCase()));
      }
      if (filters.country) {
        filteredProperties = filteredProperties.filter(p => p.country === filters.country);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProperties = filteredProperties.filter(p => 
          p.title.toLowerCase().includes(searchTerm) ||
          (p.description && p.description.toLowerCase().includes(searchTerm)) ||
          p.address.toLowerCase().includes(searchTerm)
        );
      }
      
      // Only show active properties
      filteredProperties = filteredProperties.filter(p => p.status === 'active');
      
      // Apply limit
      if (filters.limit) {
        filteredProperties = filteredProperties.slice(0, filters.limit);
      }
    }
    
    // Add agent information
    return filteredProperties.map(property => {
      const agent = this.users.find(u => u.id === property.agentId);
      return {
        ...property,
        agent: agent || null
      };
    });
  }
  
  async getFeaturedProperties(): Promise<PropertyWithAgent[]> { 
    const featuredProperties = this.properties.filter(p => p.isFeatured && p.status === 'active').slice(0, 6);
    
    return featuredProperties.map(property => {
      const agent = this.users.find(u => u.id === property.agentId);
      return {
        ...property,
        agent: agent || null
      };
    });
  }
  async createProperty(property: InsertProperty): Promise<Property> { 
    const newProperty: Property = { 
      id: `prop-${Date.now()}`, 
      ...property,
      description: property.description || null,
      currency: property.currency || 'USD',
      status: property.status || 'active',
      views: 0, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.properties.push(newProperty);
    return newProperty;
  }
  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const propertyIndex = this.properties.findIndex(p => p.id === id);
    if (propertyIndex === -1) return undefined;
    
    this.properties[propertyIndex] = {
      ...this.properties[propertyIndex],
      ...property,
      updatedAt: new Date()
    };
    return this.properties[propertyIndex];
  }
  
  async deleteProperty(id: string): Promise<boolean> {
    const propertyIndex = this.properties.findIndex(p => p.id === id);
    if (propertyIndex === -1) return false;
    
    this.properties.splice(propertyIndex, 1);
    return true;
  }
  async incrementPropertyViews(id: string): Promise<void> {}

  async getInquiry(id: string): Promise<Inquiry | undefined> { return undefined; }
  async getInquiriesForProperty(propertyId: string): Promise<Inquiry[]> { return []; }
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const newInquiry: Inquiry = { 
      id: `inq-${Date.now()}`, 
      ...inquiry,
      phone: inquiry.phone || null,
      status: 'pending',
      createdAt: new Date() 
    };
    this.inquiries.push(newInquiry);
    return newInquiry;
  }
  async updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined> { return undefined; }

  async getFavoritesByUser(userId: string): Promise<PropertyWithAgent[]> { 
    const userFavorites = this.favorites.filter(f => f.userId === userId);
    const favoriteProperties = userFavorites.map(fav => 
      this.properties.find(p => p.id === fav.propertyId)
    ).filter(Boolean) as Property[];
    
    return favoriteProperties.map(property => {
      const agent = this.users.find(u => u.id === property.agentId);
      return {
        ...property,
        agent: agent || null
      };
    });
  }
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

  // Customer Analytics stubs
  async addCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    return {
      id: `activity-${Date.now()}`,
      ...activity,
      createdAt: new Date()
    } as CustomerActivity;
  }
  async getCustomerActivities(userId: string, limit?: number): Promise<CustomerActivity[]> { return []; }
  async getCustomerPoints(userId: string): Promise<CustomerPoints | undefined> { return undefined; }
  async updateCustomerPoints(userId: string, points: Partial<InsertCustomerPoints>): Promise<CustomerPoints> {
    return {
      id: `points-${userId}`,
      userId,
      totalPoints: points.totalPoints || 0,
      currentLevel: points.currentLevel || "Bronze",
      pointsThisMonth: points.pointsThisMonth || 0,
      lastActivity: new Date(),
      updatedAt: new Date()
    } as CustomerPoints;
  }
  async getCustomerAnalytics(userId: string): Promise<{
    totalActivities: number;
    activitiesByType: { activityType: string; count: number; points: number }[];
    pointsHistory: { date: string; points: number }[];
    monthlyActivity: { month: string; activities: number }[];
  }> {
    return {
      totalActivities: 0,
      activitiesByType: [],
      pointsHistory: [],
      monthlyActivity: []
    };
  }

  // Wave management stubs
  async getWaves(): Promise<Wave[]> { return []; }
  async getWave(id: string): Promise<Wave | undefined> { return undefined; }
  async createWave(wave: InsertWave): Promise<Wave> {
    return {
      id: `wave-${Date.now()}`,
      ...wave,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Wave;
  }
  async updateWave(id: string, wave: Partial<InsertWave>): Promise<Wave | undefined> { return undefined; }
  async deleteWave(id: string): Promise<boolean> { return false; }

  // Customer wave permissions stubs
  async getCustomerWavePermissions(userId: string): Promise<CustomerWavePermission[]> { return []; }
  async getWavePermission(userId: string, waveId: string): Promise<CustomerWavePermission | undefined> { return undefined; }
  async grantWavePermission(permission: InsertCustomerWavePermission): Promise<CustomerWavePermission> {
    return {
      id: `perm-${Date.now()}`,
      ...permission,
      createdAt: new Date(),
      updatedAt: new Date()
    } as CustomerWavePermission;
  }
  async updateWavePermission(id: string, permission: Partial<InsertCustomerWavePermission>): Promise<CustomerWavePermission | undefined> { return undefined; }
  async revokeWavePermission(userId: string, waveId: string): Promise<boolean> { return false; }
  async getPropertiesByWave(waveId: string): Promise<PropertyWithAgent[]> { return []; }

  // Wave balance tracking methods
  async getUserWaveUsage(userId: string): Promise<number> {
    return this.properties.filter(p => 
      p.agentId === userId && 
      p.waveId && 
      p.waveId !== 'no-wave'
    ).length;
  }

  async getUserRemainingWaves(userId: string): Promise<number> {
    const user = this.users.find(u => u.id === userId);
    if (!user) return 0;
    
    // Admin and super_admin have unlimited waves
    if (user.role === 'admin' || user.role === 'super_admin') {
      return 999999;
    }
    
    const currentUsage = await this.getUserWaveUsage(userId);
    const remaining = (user.waveBalance || 0) - currentUsage;
    return Math.max(0, remaining);
  }

  async validateWaveAssignment(userId: string, waveId: string | null): Promise<{ valid: boolean; message?: string }> {
    if (!waveId || waveId === 'no-wave') {
      return { valid: true };
    }

    const user = this.users.find(u => u.id === userId);
    if (!user) {
      return { valid: false, message: 'User not found' };
    }

    // Admin and super_admin have unlimited waves
    if (user.role === 'admin' || user.role === 'super_admin') {
      return { valid: true };
    }

    const remainingWaves = await this.getUserRemainingWaves(userId);
    if (remainingWaves <= 0) {
      return { 
        valid: false, 
        message: `No wave assignments remaining. Current balance: ${user.waveBalance || 0}` 
      };
    }

    return { valid: true };
  }

  // Function to update wave balance for all users with 0 balance (in-memory)
  async updateUsersWithZeroWaveBalance(): Promise<number> {
    let updatedCount = 0;
    this.users.forEach(user => {
      if (user.role === 'user' && (user.waveBalance || 0) === 0) {
        user.waveBalance = 10;
        updatedCount++;
      }
    });
    
    console.log(`Updated wave balance for ${updatedCount} users`);
    return updatedCount;
  }
}

// Use database storage for wave management
export const storage = new DatabaseStorage();

// Initialize database with default users if they don't exist
async function initializeDatabase() {
  try {
    // Check if users already exist
    const existingUsers = await db().select({ count: sql<number>`count(*)` }).from(users);
    
    if (existingUsers[0]?.count > 0) {
      console.log("Users already exist, skipping initialization");
      return;
    }

    console.log("Initializing database with default users...");

    // Hash passwords
    const bcrypt = await import('bcryptjs');
    const hashedAdminPassword = await bcrypt.hash("admin123", 12);
    const hashedCustomerPassword = await bcrypt.hash("customer123", 12);

    // Create admin user
    const [admin] = await db().insert(users).values({
      id: "admin-001",
      username: "admin",
      email: "admin@estateai.com",
      password: hashedAdminPassword,
      role: "super_admin",
      firstName: "System",
      lastName: "Admin",
      phone: "+964 750 000 0000",
      isVerified: true,
      waveBalance: 999999
    }).returning();

    console.log("✅ Created admin user:", admin.username);

    // Create customer user for testing
    const [customer] = await db().insert(users).values({
      id: "customer-001",
      username: "Jutyar",
      email: "jutyar@estateai.com", 
      password: hashedCustomerPassword,
      role: "user",
      firstName: "Jutyar",
      lastName: "Customer",
      phone: "+964 750 111 2222",
      isVerified: true,
      waveBalance: 10
    }).returning();

    console.log("✅ Created customer user:", customer.username);

    // Waves will be created by the initializeWaves function

  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

// Add example properties for demonstration
async function addExampleProperties() {
  // Example Property 1
  await storage.createProperty({
    title: "Modern Apartment in Erbil City Center",
    description: "Beautiful 2-bedroom apartment located in the heart of Erbil. Perfect for young professionals or small families. Features modern amenities and easy access to shopping centers and restaurants.",
    type: "apartment",
    listingType: "rent",
    price: "800",
    currency: "USD",
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    address: "Gulan Street, Downtown",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.1911",
    longitude: "44.0093",
    images: [],
    amenities: ["Air Conditioning", "Parking", "Security System"],
    features: ["Furnished", "Modern Kitchen", "High Ceilings"],
    contactPhone: "+964 750 123 4567",
    status: "active",
    agentId: "customer-001"
  });

  // Example Property 2
  await storage.createProperty({
    title: "Spacious Villa in Ainkawa",
    description: "Luxurious 4-bedroom villa in the prestigious Ainkawa area. This property features a large garden, swimming pool, and high-end finishes throughout. Perfect for families looking for comfort and privacy.",
    type: "villa",
    listingType: "sale",
    price: "450000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area: 350,
    address: "Ainkawa Main Road",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.2181",
    longitude: "44.0089",
    images: [],
    amenities: ["Swimming Pool", "Garden", "Parking", "Security System", "Gym"],
    features: ["Air Conditioning", "Heating", "Fireplace", "High Ceilings", "Storage Room"],
    contactPhone: "+964 750 987 6543",
    status: "active",
    agentId: "customer-001"
  });

  // Add 3 new properties with 3 photos each
  // Property 3: Elegant Townhouse in Duhok
  await storage.createProperty({
    title: "Elegant Townhouse in Duhok",
    description: "A stunning 3-bedroom townhouse in Duhok's premium residential area. Features include spacious living areas, modern finishes, private garden, and excellent location near schools and shopping centers. Perfect for families seeking comfort and style.",
    type: "house",
    listingType: "sale",
    price: "220000",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    address: "Nakhoshkhana Road, Premium District",
    city: "Duhok",
    country: "Iraq",
    latitude: "36.8677",
    longitude: "42.9944",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Private Garden", "Garage", "Central Heating", "Security System"],
    features: ["Hardwood Floors", "Granite Countertops", "Walk-in Closets", "Patio"],
    contactPhone: "+964 750 456 7890",
    status: "active",
    agentId: "customer-001",
    isFeatured: true
  });

  // Property 4: Luxury Penthouse in Zakho
  await storage.createProperty({
    title: "Luxury Penthouse in Zakho",
    description: "Exclusive penthouse apartment with panoramic city views in Zakho's most prestigious building. Features high-end finishes, spacious terraces, and premium amenities. This is sophisticated urban living at its finest.",
    type: "apartment",
    listingType: "rent",
    price: "1200",
    currency: "USD",
    bedrooms: 2,
    bathrooms: 2,
    area: 120,
    address: "City Center Tower, Main Boulevard",
    city: "Zakho",
    country: "Iraq",
    latitude: "37.1433",
    longitude: "42.6816",
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Rooftop Terrace", "Concierge Service", "Gym Access", "Valet Parking"],
    features: ["Floor-to-Ceiling Windows", "Designer Kitchen", "Smart Home Technology", "City Views"],
    contactPhone: "+964 750 789 0123",
    status: "active",
    agentId: "customer-001",
    isFeatured: true
  });

  // Property 5: Countryside Villa in Amedi
  await storage.createProperty({
    title: "Countryside Villa in Amedi",
    description: "Magnificent villa surrounded by nature in the beautiful mountain town of Amedi. This 4-bedroom property offers tranquility, fresh mountain air, and breathtaking views. Perfect retreat for those seeking peace and natural beauty.",
    type: "villa",
    listingType: "sale",
    price: "380000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    address: "Mountain View Road, Amedi Heights",
    city: "Amedi",
    country: "Iraq",
    latitude: "37.0897",
    longitude: "43.4905",
    images: [
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Mountain Views", "Large Garden", "Fireplace", "Outdoor Kitchen"],
    features: ["Stone Construction", "Wooden Beams", "Multiple Terraces", "Wine Cellar"],
    contactPhone: "+964 750 234 5678",
    status: "active",
    agentId: "customer-001",
    isFeatured: true
  });
}

// Create default waves if they don't exist
async function initializeWaves() {
  try {
    // Clear existing waves and create only the orange premium wave
    // First, remove wave assignments from properties
    await db().update(properties).set({ waveId: null });
    console.log("Cleared wave assignments from properties");
    
    // Then delete all waves
    await db().delete(waves);
    console.log("Cleared existing waves");

    console.log("Creating default waves...");

    // Get admin user to set as creator
    const adminUser = await db().select().from(users).where(eq(users.role, 'super_admin')).limit(1);
    const adminId = adminUser[0]?.id;

    // Create only one orange premium wave
    const defaultWaves = [
      { name: "Premium Wave", description: "Premium properties with special circle motion effect", color: "#F59E0B" }
    ];

    for (const wave of defaultWaves) {
      await db().insert(waves).values({
        ...wave,
        createdBy: adminId,
        isActive: true
      });
    }
    console.log("✅ Created default waves for customers to use");

  } catch (error) {
    console.error("Failed to initialize waves:", error);
  }
}

// Initialize database and example properties
initializeDatabase().then(() => {
  return initializeWaves();
}).then(() => {
  addExampleProperties().catch(console.error);
}).catch(console.error);
