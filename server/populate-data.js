// Directly populate the storage with new properties
import { storage } from './storage.js';

// Execute the population
async function populateData() {
  console.log('📝 Adding properties for each language...');

  // English Properties (3)
  await storage.createProperty({
    title: "Modern Downtown Apartment",
    description: "Luxurious 2-bedroom apartment in the heart of downtown Erbil. Features modern amenities, panoramic city views, and easy access to shopping centers.",
    type: "apartment",
    listingType: "rent",
    price: "900",
    currency: "USD",
    bedrooms: 2,
    bathrooms: 2,
    area: 120,
    address: "Gulan Street, Downtown",
    city: "Erbil",
    country: "Iraq",
    language: "en",
    latitude: "36.1911",
    longitude: "44.0093",
    images: [],
    amenities: ["Air Conditioning", "Parking", "Security System", "Gym"],
    features: ["Furnished", "Modern Kitchen", "City View"],
    contactPhone: "+964 750 123 4567",
    status: "active",
    agentId: "customer-001",
    isFeatured: true
  });

  await storage.createProperty({
    title: "Spacious Family Villa",
    description: "Beautiful 4-bedroom villa in prestigious Ainkawa neighborhood. Perfect for families with large garden, swimming pool, and premium finishes.",
    type: "villa",
    listingType: "sale",
    price: "350000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area: 300,
    address: "Ainkawa Main Road",
    city: "Erbil",
    country: "Iraq",
    language: "en",
    latitude: "36.2181",
    longitude: "44.0089",
    images: [],
    amenities: ["Swimming Pool", "Garden", "Parking", "Security System"],
    features: ["Air Conditioning", "Fireplace", "Storage Room"],
    contactPhone: "+964 750 234 5678",
    status: "active",
    agentId: "customer-001"
  });

  await storage.createProperty({
    title: "Cozy Studio Apartment",
    description: "Perfect studio apartment for students or young professionals. Located near university with all essential amenities within walking distance.",
    type: "apartment",
    listingType: "rent",
    price: "500",
    currency: "USD",
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    address: "University District",
    city: "Erbil",
    country: "Iraq",
    language: "en",
    latitude: "36.1750",
    longitude: "44.0150",
    images: [],
    amenities: ["WiFi", "Parking", "Laundry"],
    features: ["Furnished", "Compact Design", "Study Area"],
    contactPhone: "+964 750 345 6789",
    status: "active",
    agentId: "customer-001"
  });

  // Arabic Properties (3)
  await storage.createProperty({
    title: "شقة حديثة في وسط المدينة",
    description: "شقة فاخرة مكونة من غرفتي نوم في قلب أربيل. تحتوي على وسائل راحة حديثة وإطلالة رائعة على المدينة مع سهولة الوصول لمراكز التسوق.",
    type: "apartment",
    listingType: "rent",
    price: "850",
    currency: "USD",
    bedrooms: 2,
    bathrooms: 2,
    area: 110,
    address: "شارع جولان، وسط المدينة",
    city: "أربيل",
    country: "العراق",
    language: "ar",
    latitude: "36.1900",
    longitude: "44.0080",
    images: [],
    amenities: ["تكييف هواء", "مواقف سيارات", "نظام أمني", "صالة رياضية"],
    features: ["مؤثثة", "مطبخ حديث", "إطلالة على المدينة"],
    contactPhone: "+964 750 456 7890",
    status: "active",
    agentId: "customer-001",
    isFeatured: true
  });

  await storage.createProperty({
    title: "فيلا عائلية واسعة",
    description: "فيلا جميلة مكونة من 4 غرف نوم في حي عنكاوا المرموق. مثالية للعائلات مع حديقة كبيرة ومسبح وتشطيبات فاخرة.",
    type: "villa",
    listingType: "sale",
    price: "400000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area: 350,
    address: "شارع عنكاوا الرئيسي",
    city: "أربيل",
    country: "العراق",
    language: "ar",
    latitude: "36.2200",
    longitude: "44.0070",
    images: [],
    amenities: ["مسبح", "حديقة", "مواقف سيارات", "نظام أمني"],
    features: ["تكييف هواء", "موقد", "غرفة تخزين"],
    contactPhone: "+964 750 567 8901",
    status: "active",
    agentId: "customer-001"
  });

  await storage.createProperty({
    title: "بيت تقليدي مع فناء",
    description: "بيت تقليدي جميل مع فناء واسع في الحي القديم. يحتفظ بالطابع التراثي مع التحديثات العصرية للراحة.",
    type: "house",
    listingType: "sale",
    price: "180000",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area: 200,
    address: "الحي القديم",
    city: "أربيل",
    country: "العراق",
    language: "ar",
    latitude: "36.1850",
    longitude: "44.0120",
    images: [],
    amenities: ["فناء", "مواقف سيارات", "تخزين"],
    features: ["تصميم تقليدي", "فناء واسع", "محدث"],
    contactPhone: "+964 750 678 9012",
    status: "active",
    agentId: "customer-001"
  });

  // Kurdish Sorani Properties (3)
  await storage.createProperty({
    title: "ڤیلای فاخر لە هەولێر",
    description: "ڤیلایەکی جوان و گەورە لە هەولێر کە تایبەتە بە خێزانەکان. هەموو ئامرازەکانی ئاسوودەیی و جوانی هەیە.",
    type: "villa",
    listingType: "sale",
    price: "320000",
    currency: "USD",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    address: "گەڕەکی عەنکاوە",
    city: "هەولێر",
    country: "عێراق",
    language: "kur",
    latitude: "36.2150",
    longitude: "44.0100",
    images: [],
    amenities: ["مەلەوانگە", "باخچە", "پارکینگ", "سیستەمی ئاسایش"],
    features: ["کولەر", "شوێنی ئاگر", "ژووری هەڵگرتن"],
    contactPhone: "+964 750 789 0123",
    status: "active",
    agentId: "customer-001",
    isFeatured: true
  });

  await storage.createProperty({
    title: "شوقەی نوێ لە ناوەندی شار",
    description: "شوقەیەکی نوێ و جوان لە ناوەندی شاری هەولێر. گونجاوە بۆ گەنجان و خێزانە بچووکەکان.",
    type: "apartment",
    listingType: "rent",
    price: "700",
    currency: "USD",
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    address: "شەقامی گولان",
    city: "هەولێر",
    country: "عێراق",
    language: "kur",
    latitude: "36.1920",
    longitude: "44.0110",
    images: [],
    amenities: ["کولەر", "پارکینگ", "ئاسایش"],
    features: ["کەلوپەل", "چێشتخانەی نوێ", "بەرزی باش"],
    contactPhone: "+964 750 890 1234",
    status: "active",
    agentId: "customer-001"
  });

  await storage.createProperty({
    title: "خانووی خێزانی لە دهۆک",
    description: "خانوویەکی جوان و ئاسوودە لە شاری دهۆک. گونجاوە بۆ خێزانەکان کە ئارامی و جوانی دەویست.",
    type: "house",
    listingType: "sale",
    price: "250000",
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    address: "گەڕەکی نەخۆشخانە",
    city: "دهۆک",
    country: "عێراق",
    language: "kur",
    latitude: "36.8677",
    longitude: "42.9944",
    images: [],
    amenities: ["باخچە", "پارکینگ", "شوێنی یاری"],
    features: ["کولەر", "ژووری دانیشتن گەورە", "نوێکراوەتەوە"],
    contactPhone: "+964 750 901 2345",
    status: "active",
    agentId: "customer-001"
  });

  console.log('✅ Added 9 new properties (3 for each language)');
  
  // Verify the data
  const allProperties = await storage.getProperties();
  console.log(`📊 Total properties now: ${allProperties.length}`);
  
  const byLanguage = allProperties.reduce((acc, prop) => {
    acc[prop.language] = (acc[prop.language] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 Properties by language:', byLanguage);
}

populateData().catch(console.error);