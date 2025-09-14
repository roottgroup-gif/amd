import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { performanceLogger, requestSizeMonitor } from "./middleware/performance";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

const app = express();

// Trust proxy for correct protocol detection behind reverse proxies
// Only trust first proxy for security (Replit's proxy)
app.set('trust proxy', 1);

// Enable gzip compression for all responses
app.use(compression({
  // Compress responses larger than 1kb
  threshold: 1024,
  // Set compression level (6 is good balance of speed/compression)
  level: 6,
  // Compress these MIME types
  filter: (req, res) => {
    // Don't compress responses if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter
    return compression.filter(req, res);
  }
}));

app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add request size monitoring
app.use(requestSizeMonitor(10)); // 10MB limit with warnings

// Use enhanced performance logging
app.use(performanceLogger);

// Social media meta tag injection middleware for property pages
function isSocialMediaBot(userAgent: string): boolean {
  const botPatterns = [
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'skypeuripreview',
    'discordbot',
    'slackbot',
    'telegrambot'
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUserAgent.includes(pattern));
}

// Cache HTML template in memory for performance
let htmlTemplate: string | null = null;

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

async function injectPropertyMetaTags(req: Request, res: Response, next: NextFunction) {
  const propertyMatch = req.path.match(/^\/property\/(.+)$/);
  
  if (!propertyMatch) {
    return next();
  }
  
  const userAgent = req.get('User-Agent') || '';
  
  // Only inject for social media bots to avoid affecting normal users
  if (!isSocialMediaBot(userAgent)) {
    return next();
  }
  
  const propertyId = propertyMatch[1];
  
  try {
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      return next();
    }
    
    // Load HTML template if not cached
    if (!htmlTemplate) {
      const htmlPath = path.join(process.cwd(), 'client', 'index.html');
      htmlTemplate = fs.readFileSync(htmlPath, 'utf-8');
    }
    
    let html = htmlTemplate;
    
    // Generate property-specific meta tags with HTML escaping
    const formatPrice = (price: string, currency: string, listingType: string) => {
      const amount = parseFloat(price);
      const formattedAmount = new Intl.NumberFormat().format(amount);
      const suffix = listingType === 'rent' ? '/mo' : '';
      return `${currency === 'USD' ? '$' : currency}${formattedAmount}${suffix}`;
    };
    
    // Use HTTPS for production URLs
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
    
    const propertyTitle = escapeHtml(`${property.title} - ${formatPrice(property.price, property.currency || 'USD', property.listingType)} | MapEstate`);
    const propertyDescription = escapeHtml(`${property.description || `${property.bedrooms} bedroom ${property.type} for ${property.listingType} in ${property.city}, ${property.country}.`} View details, photos, and contact information.`);
    const propertyImage = property.images && property.images.length > 0 
      ? (property.images[0].startsWith('http') ? property.images[0] : `${protocol}://${req.get('host')}${property.images[0]}`)
      : `${protocol}://${req.get('host')}/logo_1757848527935.png`;
    const propertyUrl = `${protocol}://${req.get('host')}/property/${property.id}`;
    const secureImageUrl = propertyImage.replace('http://', 'https://');
    
    // Build comprehensive meta tags for social media
    const socialMetaTags = `
    <!-- Property-specific meta tags for social media crawlers -->
    <title>${propertyTitle}</title>
    <meta name="title" content="${propertyTitle}" />
    <meta name="description" content="${propertyDescription}" />
    <link rel="canonical" href="${propertyUrl}" />
    
    <!-- Open Graph / Facebook / LinkedIn -->
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${propertyTitle}" />
    <meta property="og:description" content="${propertyDescription}" />
    <meta property="og:image" content="${propertyImage}" />
    <meta property="og:image:secure_url" content="${secureImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(property.title)}" />
    <meta property="og:url" content="${propertyUrl}" />
    <meta property="og:site_name" content="MapEstate" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${propertyTitle}" />
    <meta name="twitter:description" content="${propertyDescription}" />
    <meta name="twitter:image" content="${propertyImage}" />
    <meta name="twitter:image:alt" content="${escapeHtml(property.title)}" />
    <meta name="twitter:site" content="@MapEstate" />
    <meta name="twitter:creator" content="@MapEstate" />
    
    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="MapEstate" />
    `;
    
    // Property-specific structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": property.title,
      "description": property.description || `${property.bedrooms} bedroom ${property.type} in ${property.city}`,
      "image": propertyImage,
      "url": propertyUrl,
      "offers": {
        "@type": "Offer",
        "price": property.price,
        "priceCurrency": property.currency || "USD",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "MapEstate"
        }
      },
      "category": property.type,
      "location": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": property.address,
          "addressLocality": property.city,
          "addressCountry": property.country
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": property.latitude,
          "longitude": property.longitude
        }
      }
    };
    
    // Safely embed JSON-LD to prevent script tag termination
    const jsonLd = JSON.stringify(structuredData, null, 6).replace(/<\/script>/gi, '<\\/script>');
    const structuredDataScript = `\n    <script type="application/ld+json">\n${jsonLd}\n    </script>\n`;
    
    // Inject before </head> tag for robust insertion
    html = html.replace('</head>', `${socialMetaTags}${structuredDataScript}  </head>`);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('Error injecting property meta tags:', error);
    next();
  }
}

app.use(injectPropertyMetaTags);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
