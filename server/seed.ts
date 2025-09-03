import { db } from "./db";
import { properties, users } from "@shared/schema";

async function seedData() {
  try {
    console.log("🌱 Seeding database...");

    // Create a sample agent
    const [agent] = await db.insert(users).values([{
      username: "john_agent",
      email: "john@estateai.com",
      password: "hashedpassword123",
      role: "agent",
      firstName: "John",
      lastName: "Smith",
      phone: "+964 750 123 4567",
      isVerified: true
    }]).returning();

    console.log("✅ Created sample agent:", agent.username);

    // Create sample properties
    const sampleProperties = [
      {
        title: "Luxury Villa in Erbil",
        description: "A stunning 4-bedroom villa with modern amenities, located in the heart of Erbil. Features include a spacious living area, modern kitchen, garden, and parking.",
        type: "villa",
        listingType: "sale" as const,
        price: "450000",
        currency: "USD",
        bedrooms: 4,
        bathrooms: 3,
        area: 3200,
        address: "Gulan Street, Erbil City Center",
        city: "Erbil",
        country: "Iraq",
        latitude: "36.1911",
        longitude: "44.0093",
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Swimming Pool", "Garden", "Parking", "Security System"],
        features: ["Central AC", "Modern Kitchen", "Balcony", "Storage Room"],
        agentId: agent.id,
        isFeatured: true
      },
      {
        title: "Modern Apartment in Baghdad",
        description: "A beautiful 2-bedroom apartment in a prime location in Baghdad. Perfect for young professionals or small families.",
        type: "apartment",
        listingType: "rent" as const,
        price: "800",
        currency: "USD",
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        address: "Al-Mansour District, Baghdad",
        city: "Baghdad",
        country: "Iraq",
        latitude: "33.3152",
        longitude: "44.3661",
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Elevator", "Parking", "24/7 Security"],
        features: ["Modern Kitchen", "Balcony", "Internet Ready"],
        agentId: agent.id,
        isFeatured: true
      },
      {
        title: "Family House in Sulaymaniyah",
        description: "A comfortable 3-bedroom family house with a beautiful garden. Located in a quiet neighborhood.",
        type: "house",
        listingType: "sale" as const,
        price: "180000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 2,
        area: 2000,
        address: "Azadi Street, Sulaymaniyah",
        city: "Sulaymaniyah",
        country: "Iraq",
        latitude: "35.5651",
        longitude: "45.4305",
        images: [
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Garden", "Parking", "Basement"],
        features: ["Fireplace", "Large Windows", "Storage"],
        agentId: agent.id,
        isFeatured: false
      },
      {
        title: "Commercial Land in Erbil",
        description: "Prime commercial land perfect for business development. Located on a main road with high traffic.",
        type: "land",
        listingType: "sale" as const,
        price: "250000",
        currency: "USD",
        bedrooms: null,
        bathrooms: null,
        area: 5000,
        address: "100 Meter Road, Erbil",
        city: "Erbil",
        country: "Iraq",
        latitude: "36.2000",
        longitude: "44.0200",
        images: [
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Main Road Access", "Utilities Available"],
        features: ["Corner Lot", "High Traffic Area", "Development Ready"],
        agentId: agent.id,
        isFeatured: false
      },
      {
        title: "Cozy Studio Apartment",
        description: "A modern studio apartment perfect for students or young professionals. Fully furnished and ready to move in.",
        type: "apartment",
        listingType: "rent" as const,
        price: "400",
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
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Furnished", "WiFi", "Utilities Included"],
        features: ["Compact Design", "Modern Appliances", "Near University"],
        agentId: agent.id,
        isFeatured: true
      }
    ];

    await db.insert(properties).values(sampleProperties);
    
    console.log("✅ Created", sampleProperties.length, "sample properties");
    console.log("🎉 Database seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

seedData();