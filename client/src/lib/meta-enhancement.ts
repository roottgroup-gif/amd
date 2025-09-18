import { getLanguageInfo, type Language } from './i18n';

export interface EnhancedMetaData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  twitterCard: {
    type: 'summary_large_image' | 'summary';
    image?: string;
    imageAlt?: string;
  };
  additionalTags?: Record<string, string>;
  structuredData?: object;
}

// Enhanced keyword sets for different property contexts
const PROPERTY_KEYWORDS = {
  general: [
    'real estate', 'property', 'Kurdistan', 'Iraq', 'Erbil', 'Sulaymaniyah', 'Dohuk',
    'Middle East real estate', 'Iraq property market', 'Kurdistan region property'
  ],
  types: {
    apartment: ['apartment', 'flat', 'condo', 'residential unit', 'multi-family'],
    house: ['house', 'home', 'residential property', 'single-family', 'villa'],
    villa: ['villa', 'luxury home', 'executive property', 'premium residence'],
    land: ['land', 'plot', 'lot', 'development land', 'residential land', 'commercial land']
  },
  actions: {
    sale: ['for sale', 'buy', 'purchase', 'investment property', 'property investment'],
    rent: ['for rent', 'rental', 'lease', 'tenant', 'monthly rent', 'residential rental']
  },
  features: [
    'modern amenities', 'parking', 'security', 'garden', 'balcony', 'furnished',
    'unfurnished', 'city center', 'residential area', 'commercial district'
  ],
  locations: [
    'Ankawa', 'Downtown Erbil', 'Sami Abdulrahman Park area', 'Hawler',
    'Sulaymaniyah city', 'Dohuk center', 'Kurdistan mountains', 'urban area'
  ]
};

// Generate location-specific keywords based on city
export function generateLocationKeywords(city?: string, country?: string): string[] {
  const keywords: string[] = [];
  
  if (city) {
    keywords.push(
      `${city} real estate`,
      `${city} property`,
      `${city} homes`,
      `properties in ${city}`,
      `${city} rentals`,
      `${city} property market`
    );
  }
  
  if (country) {
    keywords.push(
      `${country} real estate`,
      `property ${country}`,
      `${country} property investment`
    );
  }
  
  return keywords;
}

// Generate property-specific meta data
export function generatePropertyMeta(
  property: {
    title: string;
    description?: string;
    type: string;
    listingType: 'sale' | 'rent';
    price: string;
    currency: string;
    city: string;
    country: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    images?: string[];
  },
  language: Language
): EnhancedMetaData {
  
  const langInfo = getLanguageInfo(language);
  const propertyTypeKeywords = PROPERTY_KEYWORDS.types[property.type as keyof typeof PROPERTY_KEYWORDS.types] || [property.type];
  const actionKeywords = PROPERTY_KEYWORDS.actions[property.listingType];
  const locationKeywords = generateLocationKeywords(property.city, property.country);
  
  // Enhanced title with property specifics
  const title = `${property.title} - ${property.type} for ${property.listingType} in ${property.city} | MapEstate`;
  
  // Enhanced description with more details
  const bedroomInfo = property.bedrooms ? `${property.bedrooms} bedroom ` : '';
  const bathroomInfo = property.bathrooms ? `${property.bathrooms} bathroom ` : '';
  const areaInfo = property.area ? `${property.area} sq ft ` : '';
  
  const description = property.description || 
    `${bedroomInfo}${bathroomInfo}${property.type} ${areaInfo}for ${property.listingType} in ${property.city}, ${property.country}. ` +
    `Premium real estate in Kurdistan region with modern amenities. Contact our expert agents for viewing and more information.`;
  
  // Comprehensive keyword set
  const keywords = [
    ...PROPERTY_KEYWORDS.general,
    ...propertyTypeKeywords,
    ...actionKeywords,
    ...locationKeywords,
    ...PROPERTY_KEYWORDS.features.slice(0, 5), // Top 5 features
    ...(property.bedrooms ? [`${property.bedrooms} bedroom`] : []),
    ...(property.bathrooms ? [`${property.bathrooms} bathroom`] : []),
    `${property.city} ${property.type}`,
    `${property.listingType} ${property.city}`,
    'AI property search',
    'real estate agent Kurdistan'
  ];
  
  return {
    title,
    description,
    keywords: Array.from(new Set(keywords)), // Remove duplicates
    ogImage: property.images?.[0],
    twitterCard: {
      type: 'summary_large_image',
      image: property.images?.[0],
      imageAlt: `${property.type} in ${property.city} - ${property.title}`
    },
    additionalTags: {
      'property:price:amount': property.price,
      'property:price:currency': property.currency,
      'property:type': property.type,
      'property:status': property.listingType,
      'geo:region': `IQ-${property.city === 'Erbil' ? 'KR' : 'IQ'}`,
      'geo:placename': `${property.city}, ${property.country}`,
    }
  };
}

// Generate search page meta data
export function generateSearchMeta(
  filters: {
    type?: string;
    listingType?: 'sale' | 'rent';
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
  },
  resultCount: number,
  language: Language
): EnhancedMetaData {
  
  const propertyType = filters.type || 'properties';
  const listingType = filters.listingType || 'sale and rent';
  const city = filters.city || 'Kurdistan';
  
  // Improve title phrasing - avoid showing "0 properties"  
  const countText = resultCount > 0 ? `${resultCount} ` : '';
  const listingText = listingType === 'sale' ? 'for Sale' : 
                      listingType === 'rent' ? 'for Rent' : 
                      'for Sale & Rent';
  const title = `${countText}${propertyType} ${listingText} in ${city} | MapEstate`;
  
  const priceRange = filters.minPrice || filters.maxPrice ? 
    ` (${filters.minPrice ? `from $${filters.minPrice}` : ''}${filters.minPrice && filters.maxPrice ? ' - ' : ''}${filters.maxPrice ? `to $${filters.maxPrice}` : ''})` : '';
  
  const bedroomFilter = filters.bedrooms ? ` with ${filters.bedrooms}+ bedrooms` : '';
  
  const description = `Discover ${countText}premium ${propertyType} ${listingText.toLowerCase()} in ${city}, Iraq${priceRange}${bedroomFilter}. ` +
    `Browse our comprehensive listings with detailed photos, property information, and expert real estate agent support. ` +
    `Find your perfect home with AI-powered search in Kurdistan region.`;
  
  // Limit keywords to most relevant (better for SEO)
  const keywords = [
    ...PROPERTY_KEYWORDS.general.slice(0, 8), // Top 8 general keywords
    ...generateLocationKeywords(filters.city, 'Iraq').slice(0, 6), // Top 6 location keywords
    `${propertyType} ${city}`,
    `${listingType === 'sale' ? 'buy' : listingType === 'rent' ? 'rent' : 'buy rent'} ${propertyType}`,
    `${city} real estate listings`,
    ...(filters.bedrooms ? [`${filters.bedrooms} bedroom ${propertyType}`] : []),
    'property search Kurdistan',
    'AI real estate finder'
  ];
  
  return {
    title,
    description,
    keywords: Array.from(new Set(keywords)),
    twitterCard: {
      type: 'summary_large_image',
      imageAlt: `${propertyType} for ${listingType} in ${city}`
    },
    additionalTags: {
      'search:type': propertyType,
      'search:listing-type': listingType,
      'search:location': city,
      'search:results': resultCount.toString()
    }
  };
}

// Generate homepage meta data
export function generateHomeMeta(
  featuredCount: number,
  language: Language
): EnhancedMetaData {
  
  const title = 'MapEstate - AI-Powered Real Estate in Kurdistan, Iraq | Find Your Perfect Home';
  
  const description = `Find your perfect home in Kurdistan, Iraq with AI-powered property search. ` +
    `Browse ${featuredCount > 0 ? `over ${featuredCount}` : ''} premium properties for sale and rent including houses, apartments, villas, and land. ` +
    `Expert real estate agents, advanced search filters, and intelligent recommendations. Start your property journey today.`;
  
  const keywords = [
    ...PROPERTY_KEYWORDS.general,
    'AI real estate platform',
    'smart property search',
    'Kurdistan property portal',
    'Iraq real estate marketplace',
    'intelligent property finder',
    'expert real estate agents Kurdistan',
    'premium properties Iraq',
    'residential commercial property',
    'property investment opportunities',
    'modern real estate platform',
    'digital property search'
  ];
  
  return {
    title,
    description,
    keywords: Array.from(new Set(keywords)),
    twitterCard: {
      type: 'summary_large_image',
      imageAlt: 'MapEstate - AI-Powered Real Estate Platform for Kurdistan, Iraq'
    },
    additionalTags: {
      'application-name': 'MapEstate',
      'apple-mobile-web-app-title': 'MapEstate',
      'msapplication-tooltip': 'Find real estate in Kurdistan, Iraq',
      'website:type': 'real estate platform'
    }
  };
}

// Generate FAQ structured data
export function generateFAQStructuredData(language: Language) {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does AI property search work on MapEstate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapEstate uses artificial intelligence to understand your property preferences and requirements in natural language. Simply describe what you're looking for, and our AI will find matching properties in Kurdistan, Iraq based on location, budget, size, and other criteria."
        }
      },
      {
        "@type": "Question",
        "name": "What types of properties are available in Kurdistan, Iraq?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MapEstate offers a comprehensive range of properties including apartments, houses, villas, and land plots for both sale and rent across major Kurdistan cities like Erbil, Sulaymaniyah, and Dohuk."
        }
      },
      {
        "@type": "Question",
        "name": "How can I contact real estate agents through MapEstate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can contact verified real estate agents directly through our platform using the contact forms on property listings, phone calls, or messaging system. All agents are vetted professionals with local market expertise."
        }
      }
    ]
  };
  
  return faqData;
}

// Enhanced organization structured data
export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MapEstate",
    "description": "AI-Powered Real Estate Platform for Kurdistan, Iraq",
    "url": "https://mapestate.com",
    "logo": "https://mapestate.com/logo_1757848527935.png",
    "foundingDate": "2024",
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["English", "Arabic", "Kurdish"],
        "areaServed": "Kurdistan Region, Iraq"
      }
    ],
    "areaServed": {
      "@type": "Country",
      "name": "Iraq"
    },
    "serviceArea": {
      "@type": "AdministrativeArea",
      "name": "Kurdistan Region"
    },
    "knowsAbout": [
      "Real Estate",
      "Property Management",
      "Property Search",
      "Real Estate Investment",
      "Kurdistan Property Market"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Real Estate Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Property Search",
            "description": "AI-powered property search and recommendations"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Real Estate Agent Services",
            "description": "Professional real estate agent support and consultation"
          }
        }
      ]
    }
  };
}