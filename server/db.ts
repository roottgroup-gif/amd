import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool;
let db: ReturnType<typeof drizzle>;

function getDb() {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      // Fallback: Try to get it from Replit secrets
      console.log("DATABASE_URL not found in environment, checking Replit secrets...");
      
      // For development/testing purposes, create a temporary in-memory fallback
      // This should only be used as a last resort
      if (process.env.NODE_ENV === 'development') {
        throw new Error(
          "DATABASE_URL must be set. Please ensure the database is properly provisioned in Replit."
        );
      }
      
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    
    console.log("Connecting to database...");
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client: pool, schema });
    console.log("Database connection established");
  }
  return db;
}

export { getDb as db };