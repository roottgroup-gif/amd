# MapEstate - AI-Powered Real Estate Finder

## Overview

MapEstate is a modern, multilingual real estate web application designed for the Kurdistan/Iraq market. The platform combines intelligent property search with AI-powered recommendations to help users find their perfect home. Built with a full-stack TypeScript architecture, it features property listings with interactive maps, advanced filtering capabilities, agent management, and multilingual support (English, Arabic, Kurdish).

The application serves multiple user types: property seekers who can browse and search listings, real estate agents who can manage their property portfolios, and includes AI-driven features for personalized property recommendations and natural language search queries.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API architecture with centralized route handling
- **Request Handling**: Express middleware for JSON parsing, error handling, and request logging
- **Development**: Hot reload with tsx for TypeScript execution

### Data Storage & Management
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database interactions
- **Schema**: Centralized schema definitions in shared directory
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Connection pooling with Neon serverless driver

### Key Data Models
- **Users**: Authentication, roles (user/agent/admin), profile information
- **Properties**: Complete property details including location, pricing, images, and amenities
- **Inquiries**: User-to-agent communication system
- **Favorites**: User property bookmarking functionality
- **Search History**: AI-powered search tracking and recommendations

### Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL storage
- **Role-Based Access**: Multi-role system supporting users, agents, and administrators
- **Data Security**: Prepared statements via Drizzle ORM prevent SQL injection

### Map Integration
- **Service**: Leaflet.js with OpenStreetMap tiles (free alternative to Google Maps)
- **Features**: Interactive property markers, clustering, GPS location detection
- **Performance**: Optimized marker rendering for large property datasets

### Internationalization
- **Languages**: English, Arabic, and Kurdish support
- **Implementation**: Custom translation system with language switching
- **RTL Support**: Proper text direction handling for Arabic content

### External Dependencies

- **Database Hosting**: Neon PostgreSQL serverless platform
- **Map Service**: OpenStreetMap with Leaflet.js for interactive maps
- **Font Service**: Google Fonts for typography (Inter font family)
- **Icon Library**: Font Awesome for consistent iconography
- **CDN Services**: Unpkg for client-side library delivery
- **Development Tools**: Replit integration for development environment

The application uses a monorepo structure with shared TypeScript types and schemas, enabling full-stack type safety and code reuse across client and server components.