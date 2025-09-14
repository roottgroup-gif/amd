import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { createHash } from 'node:crypto';

// Performance metrics storage (in-memory for development)
interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: Date;
  statusCode: number;
  userId?: string;
  userAgent?: string;
  ip: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics
  
  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only the latest metrics to prevent memory issues
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }
  
  getMetrics(hours = 1): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }
  
  getAverageResponseTime(endpoint?: string, hours = 1): number {
    const metrics = this.getMetrics(hours);
    const filtered = endpoint 
      ? metrics.filter(m => m.endpoint === endpoint)
      : metrics;
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round(total / filtered.length);
  }
  
  getSlowRequests(thresholdMs = 1000, hours = 1): PerformanceMetric[] {
    return this.getMetrics(hours)
      .filter(metric => metric.responseTime > thresholdMs)
      .sort((a, b) => b.responseTime - a.responseTime);
  }
  
  getEndpointStats(hours = 1): Record<string, {
    count: number;
    avgResponseTime: number;
    slowRequests: number;
  }> {
    const metrics = this.getMetrics(hours);
    const stats: Record<string, {
      count: number;
      totalTime: number;
      slowRequests: number;
    }> = {};
    
    metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!stats[key]) {
        stats[key] = { count: 0, totalTime: 0, slowRequests: 0 };
      }
      
      stats[key].count++;
      stats[key].totalTime += metric.responseTime;
      if (metric.responseTime > 1000) {
        stats[key].slowRequests++;
      }
    });
    
    // Convert to final format
    return Object.entries(stats).reduce((result, [key, data]) => {
      result[key] = {
        count: data.count,
        avgResponseTime: Math.round(data.totalTime / data.count),
        slowRequests: data.slowRequests
      };
      return result;
    }, {} as Record<string, { count: number; avgResponseTime: number; slowRequests: number; }>);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Enhanced performance logging middleware
export function performanceLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  
  // Skip non-API routes for performance tracking
  if (!path.startsWith("/api")) {
    return next();
  }
  
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const user = (req as any).user as User | undefined;
    
    // Store detailed performance metrics
    performanceMonitor.addMetric({
      endpoint: path,
      method: req.method,
      responseTime: duration,
      timestamp: new Date(),
      statusCode: res.statusCode,
      userId: user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown'
    });
    
    // Create log line
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    // Color code based on response time
    if (duration > 2000) {
      console.log(`🔴 SLOW: ${logLine}`);
    } else if (duration > 1000) {
      console.log(`🟡 WARN: ${logLine}`);
    } else {
      console.log(logLine);
    }
    
    // Log warning for slow requests
    if (duration > 2000) {
      console.warn(`⚠️ Slow API request detected: ${req.method} ${path} took ${duration}ms`);
    }
  });

  next();
}

// Cache control middleware for different types of content
export function cacheControl(options: {
  maxAge?: number;
  sMaxAge?: number;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  immutable?: boolean;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheDirectives: string[] = [];
    
    if (options.noCache) {
      cacheDirectives.push('no-cache');
    }
    
    if (options.noStore) {
      cacheDirectives.push('no-store');
    }
    
    if (options.mustRevalidate) {
      cacheDirectives.push('must-revalidate');
    }
    
    if (options.maxAge !== undefined) {
      cacheDirectives.push(`max-age=${options.maxAge}`);
    }
    
    if (options.sMaxAge !== undefined) {
      cacheDirectives.push(`s-maxage=${options.sMaxAge}`);
    }
    
    if (options.immutable) {
      cacheDirectives.push('immutable');
    }
    
    if (cacheDirectives.length > 0) {
      res.set('Cache-Control', cacheDirectives.join(', '));
    }
    
    next();
  };
}

// ETag generation for cacheable content with stable hashing
export function generateETag(data: any): string {
  try {
    // Stable JSON serialization with sorted keys
    const stableStringify = (obj: any): string => {
      if (obj === null || typeof obj !== 'object') {
        if (obj instanceof Date) {
          return obj.toISOString();
        }
        if (typeof obj === 'bigint') {
          return obj.toString();
        }
        return String(obj);
      }
      
      if (Array.isArray(obj)) {
        return '[' + obj.map(stableStringify).join(',') + ']';
      }
      
      // Sort object keys for consistency
      const sortedKeys = Object.keys(obj).sort();
      const pairs = sortedKeys.map(key => 
        '"' + key + '":' + stableStringify(obj[key])
      );
      return '{' + pairs.join(',') + '}';
    };
    
    const stableString = stableStringify(data);
    return createHash('md5')
      .update(stableString)
      .digest('hex');
  } catch (error) {
    console.warn('ETag generation failed:', error);
    // Fallback to timestamp-based ETag
    return createHash('md5')
      .update(Date.now().toString())
      .digest('hex');
  }
}

// Conditional request handling
export function handleConditionalRequest(req: Request, res: Response, data: any, lastModified?: Date): boolean {
  const etag = generateETag(data);
  
  // Set ETag header
  res.set('ETag', `"${etag}"`);
  
  // Set Last-Modified if provided
  if (lastModified) {
    res.set('Last-Modified', lastModified.toUTCString());
  }
  
  // Check If-None-Match (ETag)
  const ifNoneMatch = req.get('If-None-Match');
  if (ifNoneMatch === `"${etag}"`) {
    res.status(304).end();
    return true;
  }
  
  // Check If-Modified-Since
  if (lastModified) {
    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince) {
      const ifModifiedSinceDate = new Date(ifModifiedSince);
      if (lastModified <= ifModifiedSinceDate) {
        res.status(304).end();
        return true;
      }
    }
  }
  
  return false;
}

// Request size monitoring
export function requestSizeMonitor(maxSizeMB = 10) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    if (contentLength) {
      const sizeMB = parseInt(contentLength) / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        console.warn(`⚠️ Large request detected: ${req.method} ${req.path} - ${sizeMB.toFixed(2)}MB`);
      }
    }
    next();
  };
}

// Database query performance tracking
export function trackQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      
      if (duration > 500) {
        console.warn(`🐌 Slow database query: ${queryName} took ${duration}ms`);
      } else if (duration > 100) {
        console.log(`📊 Query: ${queryName} completed in ${duration}ms`);
      }
      
      resolve(result);
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ Query failed: ${queryName} after ${duration}ms:`, error);
      reject(error);
    }
  });
}