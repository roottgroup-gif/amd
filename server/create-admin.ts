import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";

async function createAdminUser() {
  try {
    console.log("🔧 Creating admin user...");

    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    
    const [admin] = await db().insert(users).values([{
      username: "admin",
      email: "admin@estateai.com", 
      password: hashedPassword,
      role: "super_admin",
      firstName: "System",
      lastName: "Admin",
      phone: "+964 750 000 0000",
      isVerified: true
    }]).returning();

    console.log("✅ Created admin user:", admin.username);
    console.log("📧 Email:", admin.email);
    console.log("🔑 Username: admin");
    console.log("🔑 Password: admin123");
    console.log("👤 Role:", admin.role);

    // Create sample agent
    const hashedAgentPassword = await hashPassword("agent123");
    
    const [agent] = await db().insert(users).values([{
      username: "john_agent",
      email: "john@estateai.com",
      password: hashedAgentPassword,
      role: "agent", 
      firstName: "John",
      lastName: "Smith",
      phone: "+964 750 123 4567",
      isVerified: true
    }]).returning();

    console.log("✅ Created agent user:", agent.username);
    console.log("📧 Email:", agent.email);
    console.log("🔑 Username: john_agent");
    console.log("🔑 Password: agent123");
    console.log("👤 Role:", agent.role);

    console.log("🎉 Users created successfully!");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
}

createAdminUser();