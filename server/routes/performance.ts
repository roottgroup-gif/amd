import type { Express } from "express";
import { performanceMonitor } from "../middleware/performance";
import { requireRole } from "../auth";

export function registerPerformanceRoutes(app: Express) {
  // Performance metrics endpoint (admin only)
  app.get("/api/admin/performance", requireRole("admin"), (req, res) => {
    try {
      const { hours = 1 } = req.query;
      const hoursNumber = Math.min(parseInt(hours as string) || 1, 24); // Max 24 hours
      
      const metrics = performanceMonitor.getMetrics(hoursNumber);
      const endpointStats = performanceMonitor.getEndpointStats(hoursNumber);
      const slowRequests = performanceMonitor.getSlowRequests(1000, hoursNumber);
      const averageResponseTime = performanceMonitor.getAverageResponseTime(undefined, hoursNumber);
      
      res.json({
        timeWindow: `${hoursNumber} hour(s)`,
        totalRequests: metrics.length,
        averageResponseTime,
        endpointStats,
        slowRequests: slowRequests.slice(0, 10), // Top 10 slowest
        recentMetrics: metrics.slice(-20), // Last 20 requests
        summary: {
          fastRequests: metrics.filter(m => m.responseTime < 100).length,
          normalRequests: metrics.filter(m => m.responseTime >= 100 && m.responseTime < 1000).length,
          slowRequests: metrics.filter(m => m.responseTime >= 1000).length,
          errorRequests: metrics.filter(m => m.statusCode >= 400).length
        }
      });
    } catch (error) {
      console.error("Failed to get performance metrics:", error);
      res.status(500).json({ message: "Failed to get performance metrics" });
    }
  });
  
  // Real-time performance status
  app.get("/api/admin/performance/status", requireRole("admin"), (req, res) => {
    try {
      const recentMetrics = performanceMonitor.getMetrics(0.25); // Last 15 minutes
      const currentLoad = recentMetrics.length;
      const avgResponseTime = performanceMonitor.getAverageResponseTime(undefined, 0.25);
      const errorRate = recentMetrics.filter(m => m.statusCode >= 400).length / Math.max(recentMetrics.length, 1);
      
      let status = "healthy";
      let statusColor = "green";
      
      if (avgResponseTime > 2000 || errorRate > 0.1) {
        status = "critical";
        statusColor = "red";
      } else if (avgResponseTime > 1000 || errorRate > 0.05) {
        status = "warning";
        statusColor = "yellow";
      }
      
      res.json({
        status,
        statusColor,
        currentLoad,
        avgResponseTime,
        errorRate: Math.round(errorRate * 100),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to get performance status:", error);
      res.status(500).json({ message: "Failed to get performance status" });
    }
  });
}