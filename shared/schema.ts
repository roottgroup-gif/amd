import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "user" | "admin" | "super_admin"
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  avatar: text("avatar"),
  isVerified: boolean("is_verified").default(false),
  waveBalance: integer("wave_balance").default(10), // Number of waves user can assign to properties
  expiresAt: timestamp("expires_at"), // User account expiration date
  isExpired: boolean("is_expired").default(false), // Computed or manual flag for expiration status
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "house" | "apartment" | "villa" | "land"
  listingType: text("listing_type").notNull(), // "sale" | "rent"
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  area: integer("area"), // in square feet
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  images: jsonb("images").$type<string[]>().default([]),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  features: jsonb("features").$type<string[]>().default([]),
  status: text("status").default("active"), // "active" | "sold" | "rented" | "pending"
  agentId: varchar("agent_id").references(() => users.id),
  contactPhone: text("contact_phone"), // Contact phone number for this property (WhatsApp and calls)
  waveId: varchar("wave_id").references(() => waves.id), // Wave assignment
  views: integer("views").default(0),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: text("status").default("pending"), // "pending" | "replied" | "closed"
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  propertyId: varchar("property_id").references(() => properties.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  query: text("query").notNull(),
  filters: jsonb("filters").$type<Record<string, any>>().default({}),
  results: integer("results").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerActivity = pgTable("customer_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: text("activity_type").notNull(), // "property_view" | "search" | "favorite_add" | "favorite_remove" | "inquiry_sent" | "login" | "profile_update"
  propertyId: varchar("property_id").references(() => properties.id),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  points: integer("points").default(0), // Points earned for this activity
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerPoints = pgTable("customer_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  totalPoints: integer("total_points").default(0),
  currentLevel: text("current_level").default("Bronze"), // Bronze, Silver, Gold, Platinum
  pointsThisMonth: integer("points_this_month").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wave management tables
export const waves = pgTable("waves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"), // Hex color for map display
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerWavePermissions = pgTable("customer_wave_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  waveId: varchar("wave_id").references(() => waves.id).notNull(),
  maxProperties: integer("max_properties").notNull().default(1), // How many properties customer can assign to this wave
  usedProperties: integer("used_properties").default(0), // How many properties customer has already assigned
  grantedBy: varchar("granted_by").references(() => users.id), // Super admin who granted permission
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  properties: many(properties),
  inquiries: many(inquiries),
  favorites: many(favorites),
  searchHistory: many(searchHistory),
  customerActivity: many(customerActivity),
  customerPoints: one(customerPoints),
  wavePermissions: many(customerWavePermissions),
  createdWaves: many(waves),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  agent: one(users, {
    fields: [properties.agentId],
    references: [users.id],
  }),
  wave: one(waves, {
    fields: [properties.waveId],
    references: [waves.id],
  }),
  inquiries: many(inquiries),
  favorites: many(favorites),
}));

export const wavesRelations = relations(waves, ({ one, many }) => ({
  properties: many(properties),
  permissions: many(customerWavePermissions),
  createdBy: one(users, {
    fields: [waves.createdBy],
    references: [users.id],
  }),
}));

export const customerWavePermissionsRelations = relations(customerWavePermissions, ({ one }) => ({
  user: one(users, {
    fields: [customerWavePermissions.userId],
    references: [users.id],
  }),
  wave: one(waves, {
    fields: [customerWavePermissions.waveId],
    references: [waves.id],
  }),
  grantedBy: one(users, {
    fields: [customerWavePermissions.grantedBy],
    references: [users.id],
  }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  property: one(properties, {
    fields: [inquiries.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [inquiries.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [favorites.propertyId],
    references: [properties.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

export const customerActivityRelations = relations(customerActivity, ({ one }) => ({
  user: one(users, {
    fields: [customerActivity.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [customerActivity.propertyId],
    references: [properties.id],
  }),
}));

export const customerPointsRelations = relations(customerPoints, ({ one }) => ({
  user: one(users, {
    fields: [customerPoints.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isExpired: true, // This will be computed based on expiresAt
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerActivitySchema = createInsertSchema(customerActivity).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerPointsSchema = createInsertSchema(customerPoints).omit({
  id: true,
  lastActivity: true,
  updatedAt: true,
});

export const insertWaveSchema = createInsertSchema(waves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerWavePermissionSchema = createInsertSchema(customerWavePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type CustomerActivity = typeof customerActivity.$inferSelect;
export type InsertCustomerActivity = z.infer<typeof insertCustomerActivitySchema>;
export type CustomerPoints = typeof customerPoints.$inferSelect;
export type InsertCustomerPoints = z.infer<typeof insertCustomerPointsSchema>;
export type Wave = typeof waves.$inferSelect;
export type InsertWave = z.infer<typeof insertWaveSchema>;
export type CustomerWavePermission = typeof customerWavePermissions.$inferSelect;
export type InsertCustomerWavePermission = z.infer<typeof insertCustomerWavePermissionSchema>;

// Property with relations
export type PropertyWithAgent = Property & {
  agent: User | null;
  wave: Wave | null;
  customerContact?: {
    name: string;
    phone: string | null;
    email: string;
  } | null;
};

export type PropertyWithDetails = PropertyWithAgent & {
  inquiries: Inquiry[];
  favorites: Favorite[];
};

// Wave with permissions
export type WaveWithPermissions = Wave & {
  permissions: CustomerWavePermission[];
  properties: Property[];
};

// Property filters type
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
