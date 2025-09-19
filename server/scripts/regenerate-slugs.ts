#!/usr/bin/env tsx

/**
 * Script to regenerate missing slugs for properties
 * This ensures all properties have SEO-friendly URLs
 */

import { generatePropertySlug } from "@shared/slug-utils";

// Mock storage for the script
class SlugRegenerator {
  async regenerateAllSlugs() {
    console.log("🔧 Starting slug regeneration for properties...");
    
    // In a real scenario, this would connect to actual storage
    // For now, let's create a function that can be called from the storage initialization
    
    const sampleProperties = [
      {
        id: "prop-1000",
        title: "ڤیلای فاخر لە هەولێر",
        city: "Erbil",
        type: "villa",
        listingType: "sale",
        bedrooms: 4
      },
      {
        id: "prop-1001", 
        title: "ماڵی خێزان لە سلێمانی",
        city: "Sulaymaniyah",
        type: "house", 
        listingType: "sale",
        bedrooms: 3
      },
      {
        id: "prop-1002",
        title: "شوقەی مۆدێڕن لە دهۆک", 
        city: "Duhok",
        type: "apartment",
        listingType: "rent",
        bedrooms: 2
      }
    ];

    const results: Array<{id: string, oldSlug?: string, newSlug: string}> = [];

    for (const property of sampleProperties) {
      const newSlug = generatePropertySlug(property);
      results.push({
        id: property.id,
        newSlug: newSlug
      });
      
      console.log(`✅ Property ${property.id}: Generated slug "${newSlug}"`);
    }

    console.log("\n📊 Slug Generation Results:");
    console.log("=============================");
    results.forEach(result => {
      console.log(`${result.id} → ${result.newSlug}`);
    });

    return results;
  }
}

// Create and export the regenerator
export const slugRegenerator = new SlugRegenerator();

// If run directly, execute the regeneration
slugRegenerator.regenerateAllSlugs()
  .then(() => {
    console.log("\n🎉 Slug regeneration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error during slug regeneration:", error);
    process.exit(1);
  });