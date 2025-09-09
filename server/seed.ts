import { db } from "./db";
import { properties, users } from "@shared/schema";

async function seedData() {
  try {
    console.log("🌱 Seeding database...");

    // Create a sample agent
    const [agent] = await db().insert(users).values([{
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

    // Create exactly 10 sample properties, each with exactly 3 photos
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
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
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
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
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
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Garden", "Parking", "Basement"],
        features: ["Fireplace", "Large Windows", "Storage"],
        agentId: agent.id,
        isFeatured: false
      },
      {
        title: "Elegant Penthouse in Baghdad",
        description: "Stunning penthouse with panoramic city views, rooftop terrace, and luxury finishes throughout.",
        type: "apartment",
        listingType: "sale" as const,
        price: "320000",
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
        agentId: agent.id,
        isFeatured: true
      },
      {
        title: "Traditional House in Mosul",
        description: "Beautifully restored traditional house with modern amenities, courtyard, and authentic architecture.",
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
        agentId: agent.id,
        isFeatured: false
      },
      {
        title: "Modern Villa with Pool in Duhok",
        description: "Contemporary villa featuring swimming pool, landscaped gardens, and mountain views.",
        type: "villa",
        listingType: "sale" as const,
        price: "380000",
        currency: "USD",
        bedrooms: 5,
        bathrooms: 4,
        area: 3500,
        address: "Nakhla District, Duhok",
        city: "Duhok",
        country: "Iraq",
        latitude: "36.8628",
        longitude: "42.9782",
        images: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Swimming Pool", "Garden", "Mountain Views", "Garage"],
        features: ["Open Plan Living", "Master Suite", "Entertainment Area"],
        agentId: agent.id,
        isFeatured: true
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
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1555854877-bab0e00b7ceb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Furnished", "WiFi", "Utilities Included"],
        features: ["Compact Design", "Modern Appliances", "Near University"],
        agentId: agent.id,
        isFeatured: true
      },
      {
        title: "Countryside House in Kirkuk",
        description: "Peaceful countryside home with large garden, fruit trees, and traditional charm.",
        type: "house",
        listingType: "sale" as const,
        price: "95000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 2,
        area: 1600,
        address: "Countryside Road, Kirkuk",
        city: "Kirkuk",
        country: "Iraq",
        latitude: "35.4681",
        longitude: "44.3922",
        images: [
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Large Garden", "Fruit Trees", "Peaceful Location"],
        features: ["Country Style", "Natural Setting", "Private Well"],
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
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Main Road Access", "Utilities Available"],
        features: ["Corner Lot", "High Traffic Area", "Development Ready"],
        agentId: agent.id,
        isFeatured: false
      },
      {
        title: "Luxury Duplex with Private Garden",
        description: "Spectacular duplex with private garden, modern design, and premium amenities.",
        type: "house",
        listingType: "sale" as const,
        price: "285000",
        currency: "USD",
        bedrooms: 4,
        bathrooms: 3,
        area: 2800,
        address: "Dream City, Erbil",
        city: "Erbil",
        country: "Iraq",
        latitude: "36.2156",
        longitude: "44.0378",
        images: [
          "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Private Garden", "Duplex Design", "Premium Location"],
        features: ["Modern Architecture", "Open Concept", "Designer Finishes"],
        agentId: agent.id,
        isFeatured: true
      },
      {
        title: "Waterfront Apartment with Marina Views",
        description: "Spectacular waterfront apartment with stunning marina views, luxury finishes, and resort-style amenities.",
        type: "apartment",
        listingType: "rent" as const,
        price: "1200",
        currency: "USD",
        bedrooms: 2,
        bathrooms: 2,
        area: 1400,
        address: "Marina District, Basra",
        city: "Basra",
        country: "Iraq",
        latitude: "30.5234",
        longitude: "47.8077",
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Marina Views", "Swimming Pool", "Fitness Center", "Concierge"],
        features: ["Floor-to-Ceiling Windows", "Premium Appliances", "Waterfront Balcony"],
        agentId: agent.id,
        isFeatured: true
      },
      {
        title: "Mountain View Villa in Zakho",
        description: "Breathtaking mountain view villa with panoramic vistas, spacious terraces, and premium mountain location.",
        type: "villa",
        listingType: "sale" as const,
        price: "520000",
        currency: "USD",
        bedrooms: 6,
        bathrooms: 5,
        area: 4200,
        address: "Mountain Heights, Zakho",
        city: "Zakho",
        country: "Iraq",
        latitude: "37.1436",
        longitude: "42.6822",
        images: [
          "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Mountain Views", "Private Driveway", "Landscaped Gardens", "Security System"],
        features: ["Panoramic Terraces", "Luxury Finishes", "Multiple Living Areas"],
        agentId: agent.id,
        isFeatured: true
      },
      {
        title: "Historic Townhouse in Najaf",
        description: "Beautifully renovated historic townhouse blending traditional architecture with modern comfort and convenience.",
        type: "house",
        listingType: "sale" as const,
        price: "165000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 3,
        area: 1900,
        address: "Heritage Quarter, Najaf",
        city: "Najaf",
        country: "Iraq",
        latitude: "32.0000",
        longitude: "44.3333",
        images: [
          "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Historic Character", "Renovated Kitchen", "Private Courtyard", "Guest Parking"],
        features: ["Original Architectural Details", "Modern Updates", "Cultural Heritage"],
        agentId: agent.id,
        isFeatured: false
      }
    ];

    await db().insert(properties).values(sampleProperties);
    
    console.log("✅ Created", sampleProperties.length, "sample properties");
    console.log("🎉 Database seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

seedData();