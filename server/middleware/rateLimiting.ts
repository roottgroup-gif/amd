import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

// Different rate limits for different types of endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`🚫 Rate limit exceeded for auth: ${req.ip} - ${req.get('User-Agent')}`);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 search requests per minute
  message: {
    error: 'Too many search requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`🚫 Rate limit exceeded for search: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: 'Too many search requests, please slow down.',
      retryAfter: '1 minute'
    });
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute for general API
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`🚫 Rate limit exceeded for API: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

export const adminRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit admin operations
  message: {
    error: 'Too many admin requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`🚫 Admin rate limit exceeded: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: 'Too many admin requests, please slow down.',
      retryAfter: '1 minute'
    });
  }
});

// Stricter rate limit for resource-intensive operations
export const heavyOperationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Only 10 heavy operations per 5 minutes
  message: {
    error: 'Too many resource-intensive requests, please wait before trying again.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`🚫 Heavy operation rate limit exceeded: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: 'Too many resource-intensive requests, please wait before trying again.',
      retryAfter: '5 minutes'
    });
  }
});

// Skip rate limiting for certain IPs (can be configured for development)
export function skipRateLimitForIPs(ips: string[]) {
  return (req: Request) => {
    return ips.includes(req.ip || '');
  };
}

// Custom rate limit for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 uploads per 10 minutes
  message: {
    error: 'Too many upload attempts, please wait before uploading again.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`🚫 Upload rate limit exceeded: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: 'Too many upload attempts, please wait before uploading again.',
      retryAfter: '10 minutes'
    });
  }
});