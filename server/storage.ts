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
  language?: string;
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
      wave: null,
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
    if (filters.language) {
      conditions.push(eq(properties.language, filters.language));
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
      wave: null,
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
      wave: null,
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

  async clearAllProperties(): Promise<number> {
    // Use transaction to ensure atomic deletion
    return await db().transaction(async (tx) => {
      // First, get the count of properties before deletion
      const countResult = await tx.select({ count: sql<number>`count(*)` }).from(properties);
      const count = countResult[0]?.count || 0;

      // Delete all related data first (due to foreign key constraints)
      // Order matters: delete child records before parent records
      await tx.delete(favorites); // Clear all favorites
      await tx.delete(inquiries); // Clear all inquiries  
      await tx.delete(searchHistory); // Clear all search histories (fixed table name)
      await tx.delete(properties); // Clear all properties

      console.log(`Cleared ${count} properties and related data`);
      return count;
    });
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
      wave: null,
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
      const newTotal = (existing.totalPoints || 0) + activityPoints;
      const newLevel = this.calculateLevel(newTotal);
      
      await db()
        .update(customerPoints)
        .set({
          totalPoints: newTotal,
          currentLevel: newLevel,
          pointsThisMonth: (existing.pointsThisMonth || 0) + activityPoints,
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
  private waves: Wave[] = [];

  constructor() {
    // Initialize with admin and customer users
    this.initializeDefaultUsers();
    this.initializeDefaultWaves();
    this.initializeDefaultProperties();
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
      allowedLanguages: ['en', 'ar', 'ku'],
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
      allowedLanguages: ['en'], // Example: only English allowed for this user
      createdAt: new Date(),
      expiresAt: null,
      isExpired: false
    });
  }

  private async initializeDefaultWaves() {
    // Create default waves for users to select from
    const defaultWaves = [
      { name: "Premium Wave", description: "Premium properties with special circle motion effect", color: "#F59E0B" },
      { name: "Luxury Homes", description: "High-end luxury properties", color: "#9333EA" },
      { name: "Budget Friendly", description: "Affordable housing options", color: "#059669" },
      { name: "Family Homes", description: "Perfect for families with children", color: "#DC2626" },
      { name: "City Center", description: "Properties in prime city locations", color: "#2563EB" },
      { name: "Suburban Living", description: "Quiet suburban properties", color: "#EA580C" },
      { name: "Investment Properties", description: "Great for rental income", color: "#7C2D12" },
      { name: "New Construction", description: "Recently built properties", color: "#0D9488" }
    ];

    defaultWaves.forEach((wave, index) => {
      this.waves.push({
        id: `wave-${index + 1}`,
        name: wave.name,
        description: wave.description,
        color: wave.color,
        isActive: true,
        createdBy: 'admin-001', // Admin user creates these waves
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }

  private async initializeDefaultProperties() {
    // Add an agent user for properties
    const agentUser: User = {
      id: 'agent-001',
      username: 'john_agent',
      email: 'john@estateai.com',
      password: 'hashedpassword123',
      role: 'agent',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+964 750 123 4567',
      isVerified: true,
      avatar: null,
      waveBalance: 50,
      allowedLanguages: ['en', 'ar'],
      createdAt: new Date(),
      expiresAt: null,
      isExpired: false
    };
    this.users.push(agentUser);

    // Create sample properties - 3 Kurdish, 3 Arabic, 3 English
    const sampleProperties = [
      // Kurdish Properties
      {
        title: "ڤیلای فاخر لە هەولێر",
        description: "ڤیلایەکی جوانی ٤ ژووری نوستن لە هەولێر لەگەڵ تایبەتمەندییە مۆدێڕنەکان. بەستی بەرفراوانی ژیان، مەتبەخی مۆدێڕن، باخچە، و پارکینگ.",
        type: "villa",
        listingType: "sale" as const,
        price: "450000",
        currency: "USD",
        bedrooms: 4,
        bathrooms: 3,
        area: 3200,
        address: "شەقامی گولان، ناوەندی شاری هەولێر",
        city: "Erbil",
        country: "Iraq",
        latitude: "36.1911",
        longitude: "44.0093",
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["حەوزی مەلەوانی", "باخچە", "پارکینگ", "سیستەمی ئاسایش"],
        features: ["ئیر کەندیشەنەری ناوەندی", "مەتبەخی مۆدێڕن", "بالکۆن", "ژووری کۆگا"],
        language: "kur",
        agentId: 'agent-001',
        isFeatured: true
      },
      {
        title: "ماڵی خێزان لە سلێمانی",
        description: "ماڵێکی ئارام بۆ خێزان لەگەڵ ٣ ژووری نوستن و باخچەیەکی جوان. لە گەڕەکێکی هێمن دەکەوێتەوە.",
        type: "house",
        listingType: "sale" as const,
        price: "180000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 2,
        area: 2000,
        address: "شەقامی ئازادی، سلێمانی",
        city: "Sulaymaniyah",
        country: "Iraq",
        latitude: "35.5651",
        longitude: "45.4305",
        images: [
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["باخچە", "پارکینگ", "ژێرزەوی"],
        features: ["بخاری", "پەنجەرەی گەورە", "کۆگا"],
        language: "kur",
        agentId: 'agent-001',
        isFeatured: false
      },
      {
        title: "شوقەی مۆدێڕن لە دهۆک",
        description: "شوقەیەکی مۆدێڕن لە دهۆک بۆ خاوەن پیشە گەنج یان خێزانی بچووک. هەموو کەلوپەلێکی پێویست هەیە.",
        type: "apartment",
        listingType: "rent" as const,
        price: "600",
        currency: "USD",
        bedrooms: 2,
        bathrooms: 1,
        area: 900,
        address: "ناحیەی نەخلە، دهۆک",
        city: "Duhok",
        country: "Iraq",
        latitude: "36.8628",
        longitude: "42.9782",
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["پارکینگ", "ئاسایش", "لیفت"],
        features: ["مەتبەخی مۆدێڕن", "بالکۆن", "ئامادەیی ئینتەرنێت"],
        language: "kur",
        agentId: 'agent-001',
        isFeatured: true
      },
      // Arabic Properties
      {
        title: "فيلا فاخرة في بغداد",
        description: "فيلا رائعة بـ 5 غرف نوم مع حديقة خاصة ومسبح. تقع في منطقة راقية في بغداد مع جميع وسائل الراحة الحديثة.",
        type: "villa",
        listingType: "sale" as const,
        price: "520000",
        currency: "USD",
        bedrooms: 5,
        bathrooms: 4,
        area: 3800,
        address: "منطقة المنصور، بغداد",
        city: "Baghdad",
        country: "Iraq",
        latitude: "33.3152",
        longitude: "44.3661",
        images: [
          "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["مسبح خاص", "حديقة مُنسقة", "مرآب خاص", "نظام أمان"],
        features: ["تصميم معاصر", "مطبخ مجهز", "شرفات واسعة", "إضاءة طبيعية"],
        language: "ar",
        agentId: 'agent-001',
        isFeatured: true
      },
      {
        title: "بيت تقليدي في النجف",
        description: "منزل تقليدي جميل مُرمم بعناية مع فناء داخلي وهندسة معمارية أصيلة. يجمع بين التراث والراحة العصرية.",
        type: "house",
        listingType: "sale" as const,
        price: "165000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 3,
        area: 1900,
        address: "الحي التراثي، النجف",
        city: "Najaf",
        country: "Iraq",
        latitude: "32.0000",
        longitude: "44.3333",
        images: [
          "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["فناء داخلي", "طراز تراثي", "مطبخ مُحدث", "موقف سيارات"],
        features: ["تفاصيل معمارية أصيلة", "أسقف عالية", "تحديثات عصرية"],
        language: "ar",
        agentId: 'agent-001',
        isFeatured: false
      },
      {
        title: "شقة عصرية في البصرة",
        description: "شقة أنيقة بغرفتي نوم تطل على المارينا مع إطلالات مائية خلابة ووسائل راحة فاخرة.",
        type: "apartment",
        listingType: "rent" as const,
        price: "1000",
        currency: "USD",
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        address: "منطقة المارينا، البصرة",
        city: "Basra",
        country: "Iraq",
        latitude: "30.5234",
        longitude: "47.8077",
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["إطلالة على المارينا", "مسبح", "صالة رياضة", "خدمة حراسة"],
        features: ["نوافذ بانورامية", "أجهزة فاخرة", "شرفة مطلة على الماء"],
        language: "ar",
        agentId: 'agent-001',
        isFeatured: true
      },
      // English Properties
      {
        title: "Modern Penthouse in Baghdad",
        description: "Stunning penthouse with panoramic city views, rooftop terrace, and luxury finishes throughout. Located in a prime area with excellent amenities.",
        type: "apartment",
        listingType: "sale" as const,
        price: "350000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 3,
        area: 2200,
        address: "Al-Karrada District, Baghdad",
        city: "Baghdad",
        country: "Iraq",
        latitude: "33.3128",
        longitude: "44.4025",
        images: [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Rooftop Terrace", "Elevator", "Concierge", "Parking"],
        features: ["City Views", "High Ceilings", "Floor-to-Ceiling Windows"],
        language: "en",
        agentId: 'agent-001',
        isFeatured: true
      },
      {
        title: "Traditional House in Mosul",
        description: "Beautifully restored traditional house with modern amenities, courtyard, and authentic architecture. Perfect blend of heritage and comfort.",
        type: "house",
        listingType: "sale" as const,
        price: "145000",
        currency: "USD",
        bedrooms: 4,
        bathrooms: 2,
        area: 1800,
        address: "Old City, Mosul",
        city: "Mosul",
        country: "Iraq",
        latitude: "36.3489",
        longitude: "43.1189",
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Courtyard", "Traditional Architecture", "Parking"],
        features: ["Restored Historic Building", "High Ceilings", "Natural Light"],
        language: "en",
        agentId: 'agent-001',
        isFeatured: false
      },
      {
        title: "Studio Apartment Near University",
        description: "Modern studio apartment perfect for students or young professionals. Fully furnished and ready to move in with all utilities included.",
        type: "apartment",
        listingType: "rent" as const,
        price: "450",
        currency: "USD",
        bedrooms: 1,
        bathrooms: 1,
        area: 600,
        address: "University Street, Erbil",
        city: "Erbil",
        country: "Iraq",
        latitude: "36.1800",
        longitude: "44.0000",
        images: [
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1555854877-bab0e00b7ceb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Furnished", "WiFi", "Utilities Included"],
        features: ["Compact Design", "Modern Appliances", "Near University"],
        language: "en",
        agentId: 'agent-001',
        isFeatured: true
      }
    ];

    // Add each property to memory storage
    for (let i = 0; i < sampleProperties.length; i++) {
      const property = sampleProperties[i];
      const newProperty: Property = {
        id: `prop-${1000 + i}`,
        ...property,
        description: property.description || null,
        currency: property.currency || 'USD',
        status: 'active',
        bedrooms: property.bedrooms || null,
        bathrooms: property.bathrooms || null,
        area: property.area || null,
        latitude: property.latitude || null,
        longitude: property.longitude || null,
        contactPhone: null,
        waveId: null,
        isFeatured: property.isFeatured || false,
        images: property.images || [],
        amenities: property.amenities || [],
        features: property.features || [],
        language: 'en',
        views: Math.floor(Math.random() * 100) + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.properties.push(newProperty);
    }

    console.log(`✅ Initialized ${this.properties.length} sample properties in memory storage`);
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
      role: user.role || 'user',
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      phone: user.phone || null,
      avatar: user.avatar || null,
      isVerified: user.isVerified || null,
      waveBalance: user.waveBalance || null,
      allowedLanguages: user.allowedLanguages || ["en"],
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
      agent: agent || null,
      wave: null
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
      if (filters.language) {
        filteredProperties = filteredProperties.filter(p => p.language === filters.language);
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
        agent: agent || null,
        wave: null
      };
    });
  }
  
  async getFeaturedProperties(): Promise<PropertyWithAgent[]> { 
    const featuredProperties = this.properties.filter(p => p.isFeatured && p.status === 'active').slice(0, 6);
    
    return featuredProperties.map(property => {
      const agent = this.users.find(u => u.id === property.agentId);
      return {
        ...property,
        agent: agent || null,
        wave: null
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
      bedrooms: property.bedrooms || null,
      bathrooms: property.bathrooms || null,
      area: property.area || null,
      latitude: property.latitude || null,
      longitude: property.longitude || null,
      contactPhone: property.contactPhone || null,
      waveId: property.waveId || null,
      isFeatured: property.isFeatured || null,
      images: property.images || [],
      amenities: property.amenities || [],
      features: property.features || [],
      language: property.language || 'en',
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
      propertyId: inquiry.propertyId || null,
      userId: inquiry.userId || null,
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
        agent: agent || null,
        wave: null
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
  async removeFromFavorites(userId: string, propertyId: string): Promise<boolean> {
    const index = this.favorites.findIndex(f => f.userId === userId && f.propertyId === propertyId);
    if (index !== -1) {
      this.favorites.splice(index, 1);
      return true;
    }
    return false;
  }
  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    return this.favorites.some(f => f.userId === userId && f.propertyId === propertyId);
  }

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
  async getWaves(): Promise<Wave[]> { return this.waves.filter(w => w.isActive); }
  async getWave(id: string): Promise<Wave | undefined> { return this.waves.find(w => w.id === id && w.isActive); }
  async createWave(wave: InsertWave): Promise<Wave> {
    const newWave: Wave = {
      id: `wave-${Date.now()}`,
      ...wave,
      description: wave.description || null,
      color: wave.color || null,
      createdBy: wave.createdBy || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.waves.push(newWave);
    return newWave;
  }
  async updateWave(id: string, updateData: Partial<InsertWave>): Promise<Wave | undefined> {
    const waveIndex = this.waves.findIndex(w => w.id === id);
    if (waveIndex === -1) return undefined;
    
    this.waves[waveIndex] = {
      ...this.waves[waveIndex],
      ...updateData,
      updatedAt: new Date()
    };
    return this.waves[waveIndex];
  }
  async deleteWave(id: string): Promise<boolean> {
    const waveIndex = this.waves.findIndex(w => w.id === id);
    if (waveIndex === -1) return false;
    
    // Soft delete by marking as inactive
    this.waves[waveIndex].isActive = false;
    this.waves[waveIndex].updatedAt = new Date();
    return true;
  }

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

  // Method to clear all properties
  async clearAllProperties(): Promise<number> {
    const count = this.properties.length;
    this.properties = [];
    this.favorites = []; // Also clear favorites since they reference properties
    this.inquiries = []; // Also clear inquiries since they reference properties
    this.searchHistories = []; // Also clear search histories
    console.log(`Cleared ${count} properties and related data`);
    return count;
  }
}

// Use database storage for wave management
// Use MemStorage when database is not available
export const storage = new MemStorage();

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
    language: "en",
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
    language: "en",
    latitude: "36.2181",
    longitude: "44.0089",
    images: [],
    amenities: ["Swimming Pool", "Garden", "Parking", "Security System", "Gym"],
    features: ["Air Conditioning", "Heating", "Fireplace", "High Ceilings", "Storage Room"],
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
    language: "en",
    latitude: "36.8677",
    longitude: "42.9944",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Private Garden", "Garage", "Central Heating", "Security System"],
    features: ["Hardwood Floors", "Granite Countertops", "Walk-in Closets", "Patio"],
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
    status: "active",
    agentId: "customer-001",
    language: "en",
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
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: true
  });

  // TURKEY PROPERTIES (3)
  // Property 6: Modern Apartment in Istanbul
  await storage.createProperty({
    title: "Modern Apartment in Istanbul",
    description: "Stunning 2-bedroom apartment in the heart of Istanbul with Bosphorus views. Located in a modern complex with excellent amenities and close to public transportation.",
    type: "apartment",
    listingType: "rent",
    price: "1500",
    currency: "USD",
    bedrooms: 2,
    bathrooms: 2,
    area: 120,
    address: "Besiktas District, Istanbul",
    city: "Istanbul",
    country: "Turkey",
    latitude: "41.0082",
    longitude: "28.9784",
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1571055107669-63c7d25e6d08?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Sea View", "Gym", "Concierge", "Parking"],
    features: ["Modern Kitchen", "High Ceilings", "Balcony", "Smart Home"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: true
  });

  // Property 7: Executive Villa in Ankara
  await storage.createProperty({
    title: "Executive Villa in Ankara",
    description: "Prestigious 4-bedroom villa in Ankara's diplomatic district. Perfect for executives and diplomats, featuring luxury finishes and premium location.",
    type: "villa",
    listingType: "sale",
    price: "650000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 4,
    area: 380,
    address: "Cankaya District, Ankara",
    city: "Ankara",
    country: "Turkey",
    latitude: "39.9334",
    longitude: "32.8597",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Private Garden", "Swimming Pool", "Security", "Garage"],
    features: ["Marble Floors", "Central AC", "Master Suite", "Office Room"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // Property 8: Coastal House in Izmir
  await storage.createProperty({
    title: "Coastal House in Izmir",
    description: "Beautiful 3-bedroom house near the Aegean coast in Izmir. Enjoy Mediterranean lifestyle with modern amenities and sea breeze.",
    type: "house",
    listingType: "sale",
    price: "320000",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area: 200,
    address: "Alsancak District, Izmir",
    city: "Izmir",
    country: "Turkey",
    latitude: "38.4237",
    longitude: "27.1428",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Sea Access", "Terrace", "Parking", "Storage"],
    features: ["Open Plan", "Large Windows", "Hardwood Floors", "Garden"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // JORDAN PROPERTIES (3)
  // Property 9: Luxury Apartment in Amman
  await storage.createProperty({
    title: "Luxury Apartment in Amman",
    description: "Elegant 3-bedroom apartment in Amman's upscale Abdoun area. Features modern design, premium finishes, and stunning city views.",
    type: "apartment",
    listingType: "rent",
    price: "1200",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    address: "Abdoun Circle, Amman",
    city: "Amman",
    country: "Jordan",
    latitude: "31.9454",
    longitude: "35.9284",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["City Views", "Elevator", "Parking", "24/7 Security"],
    features: ["Modern Kitchen", "Walk-in Closet", "Balcony", "Central AC"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: true
  });

  // Property 10: Family Villa in Irbid
  await storage.createProperty({
    title: "Family Villa in Irbid",
    description: "Spacious 4-bedroom family villa in Irbid's residential area. Perfect for large families with beautiful garden and traditional architecture.",
    type: "villa",
    listingType: "sale",
    price: "280000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    address: "University Street, Irbid",
    city: "Irbid",
    country: "Jordan",
    latitude: "32.5556",
    longitude: "35.8500",
    images: [
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Large Garden", "Parking", "Storage", "Guest Room"],
    features: ["Traditional Design", "High Ceilings", "Natural Light", "Patio"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // Property 11: Beachfront Condo in Aqaba
  await storage.createProperty({
    title: "Beachfront Condo in Aqaba",
    description: "Stunning 2-bedroom condo with direct Red Sea access in Aqaba. Perfect for vacation rental or permanent residence with amazing sea views.",
    type: "apartment",
    listingType: "sale",
    price: "220000",
    currency: "USD",
    bedrooms: 2,
    bathrooms: 2,
    area: 110,
    address: "South Beach, Aqaba",
    city: "Aqaba",
    country: "Jordan",
    latitude: "29.5197",
    longitude: "35.0073",
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1571055107669-63c7d25e6d08?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Beach Access", "Swimming Pool", "Resort Facilities", "Concierge"],
    features: ["Sea View", "Modern Finishes", "Balcony", "Resort Living"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: true
  });

  // LEBANON PROPERTIES (3)
  // Property 12: Penthouse in Beirut
  await storage.createProperty({
    title: "Penthouse in Beirut",
    description: "Luxurious penthouse in Beirut's trendy Gemmayzeh district. Features panoramic Mediterranean views, modern amenities, and rooftop terrace.",
    type: "apartment",
    listingType: "rent",
    price: "2500",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 3,
    area: 200,
    address: "Gemmayzeh Street, Beirut",
    city: "Beirut",
    country: "Lebanon",
    latitude: "33.8938",
    longitude: "35.5018",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Rooftop Terrace", "Sea Views", "Elevator", "Parking"],
    features: ["Open Plan", "Modern Kitchen", "Floor-to-Ceiling Windows", "Terrace"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: true
  });

  // Property 13: Mountain House in Tripoli
  await storage.createProperty({
    title: "Mountain House in Tripoli",
    description: "Charming 3-bedroom house in Tripoli with mountain views. Traditional Lebanese architecture with modern comfort and beautiful landscape.",
    type: "house",
    listingType: "sale",
    price: "180000",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    address: "Old City, Tripoli",
    city: "Tripoli",
    country: "Lebanon",
    latitude: "34.4367",
    longitude: "35.8497",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Mountain Views", "Traditional Architecture", "Garden", "Storage"],
    features: ["Stone Walls", "High Ceilings", "Natural Light", "Courtyard"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // Property 14: Coastal Villa in Sidon
  await storage.createProperty({
    title: "Coastal Villa in Sidon",
    description: "Elegant 4-bedroom villa near Sidon's historic port. Combines traditional Lebanese charm with modern amenities and sea proximity.",
    type: "villa",
    listingType: "sale",
    price: "420000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area: 320,
    address: "Sea Castle Road, Sidon",
    city: "Sidon",
    country: "Lebanon",
    latitude: "33.5631",
    longitude: "35.3689",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Sea Proximity", "Historic Location", "Garden", "Parking"],
    features: ["Traditional Design", "Modern Kitchen", "Large Rooms", "Balcony"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // SYRIA PROPERTIES (3)
  // Property 15: Classic Apartment in Damascus
  await storage.createProperty({
    title: "Classic Apartment in Damascus",
    description: "Beautiful 3-bedroom apartment in Damascus Old City. Features traditional Syrian architecture with modern renovations and historical charm.",
    type: "apartment",
    listingType: "rent",
    price: "600",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area: 140,
    address: "Straight Street, Old Damascus",
    city: "Damascus",
    country: "Syria",
    latitude: "33.5138",
    longitude: "36.2765",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Historical Location", "Traditional Courtyard", "Central Location", "Parking"],
    features: ["Arched Ceilings", "Traditional Tiles", "Natural Light", "Courtyard View"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // Property 16: Family Home in Aleppo
  await storage.createProperty({
    title: "Family Home in Aleppo",
    description: "Spacious 4-bedroom family home in Aleppo's residential district. Traditional Syrian architecture with modern amenities and large garden.",
    type: "house",
    listingType: "sale",
    price: "150000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    address: "Al-Furqan District, Aleppo",
    city: "Aleppo",
    country: "Syria",
    latitude: "36.2021",
    longitude: "37.1343",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Large Garden", "Traditional Design", "Family Friendly", "Storage"],
    features: ["High Ceilings", "Natural Stone", "Multiple Rooms", "Courtyard"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // Property 17: Modern Apartment in Homs
  await storage.createProperty({
    title: "Modern Apartment in Homs",
    description: "Contemporary 2-bedroom apartment in Homs city center. Recently renovated with modern amenities and excellent location near amenities.",
    type: "apartment",
    listingType: "rent",
    price: "450",
    currency: "USD",
    bedrooms: 2,
    bathrooms: 1,
    area: 100,
    address: "Clock Square, Homs",
    city: "Homs",
    country: "Syria",
    latitude: "34.7394",
    longitude: "36.7163",
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1571055107669-63c7d25e6d08?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Central Location", "Modern Finishes", "Elevator", "Nearby Shopping"],
    features: ["Open Plan", "Modern Kitchen", "Good Natural Light", "Updated Bathrooms"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // IRAN PROPERTIES (3)
  // Property 18: Luxury Apartment in Tehran
  await storage.createProperty({
    title: "Luxury Apartment in Tehran",
    description: "Sophisticated 3-bedroom apartment in Tehran's upscale Elahiyeh district. Modern amenities, city views, and premium location near embassies.",
    type: "apartment",
    listingType: "rent",
    price: "1800",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area: 160,
    address: "Elahiyeh District, Tehran",
    city: "Tehran",
    country: "Iran",
    latitude: "35.6892",
    longitude: "51.3890",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Mountain Views", "Parking", "Security", "Elevator"],
    features: ["Modern Design", "Large Windows", "Built-in Storage", "Central AC"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: true
  });

  // Property 19: Traditional House in Isfahan
  await storage.createProperty({
    title: "Traditional House in Isfahan",
    description: "Historic 4-bedroom house in Isfahan's cultural district. Beautiful Persian architecture with traditional courtyard and modern updates.",
    type: "house",
    listingType: "sale",
    price: "200000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 2,
    area: 220,
    address: "Naqsh-e Jahan Square Area, Isfahan",
    city: "Isfahan",
    country: "Iran",
    latitude: "32.6546",
    longitude: "51.6680",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Historic Value", "Traditional Courtyard", "Cultural Location", "Garden"],
    features: ["Persian Architecture", "Traditional Tiles", "High Ceilings", "Courtyard"],
    status: "active",
    agentId: "customer-001",
    language: "en",
    isFeatured: false
  });

  // Property 20: Garden Villa in Shiraz
  await storage.createProperty({
    title: "Garden Villa in Shiraz",
    description: "Elegant 3-bedroom villa in Shiraz with beautiful Persian garden. Perfect blend of traditional design and modern comfort in the city of poets.",
    type: "villa",
    listingType: "sale",
    price: "350000",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 3,
    area: 260,
    address: "Hafez Gardens, Shiraz",
    city: "Shiraz",
    country: "Iran",
    latitude: "29.5918",
    longitude: "52.5837",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    amenities: ["Persian Garden", "Cultural Heritage", "Private Pool", "Fountain"],
    features: ["Traditional Design", "Modern Kitchen", "Garden Views", "Artistic Details"],
    status: "active",
    agentId: "customer-001",
    language: "en",
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

    // Create multiple useful waves for customers
    const defaultWaves = [
      { name: "Premium Wave", description: "Premium properties with special circle motion effect", color: "#F59E0B" },
      { name: "Luxury Homes", description: "High-end luxury properties", color: "#9333EA" },
      { name: "Budget Friendly", description: "Affordable housing options", color: "#059669" },
      { name: "Family Homes", description: "Perfect for families with children", color: "#DC2626" },
      { name: "City Center", description: "Properties in prime city locations", color: "#2563EB" },
      { name: "Suburban Living", description: "Quiet suburban properties", color: "#EA580C" },
      { name: "Investment Properties", description: "Great for rental income", color: "#7C2D12" },
      { name: "New Construction", description: "Recently built properties", color: "#0D9488" }
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

// Initialize database for non-memory storage
if (!(storage instanceof MemStorage)) {
  // Initialize database without loading sample properties
  initializeDatabase().then(() => {
    return initializeWaves();
  }).then(() => {
    console.log("✅ Database initialized - starting with empty property data");
  }).catch(console.error);
}
