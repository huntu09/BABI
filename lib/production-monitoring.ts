// 🔍 PRODUCTION MONITORING & ANALYTICS

export class ProductionMonitoring {
  // Error Tracking
  static logError(error: Error, context: any = {}) {
    console.error("🚨 Application Error:", {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "server",
    })

    // In production, send to monitoring service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === "production") {
      // Sentry.captureException(error, { extra: context })
    }
  }

  // Performance Monitoring
  static trackPerformance(metric: string, value: number, tags: Record<string, string> = {}) {
    console.log("📊 Performance Metric:", {
      metric,
      value,
      tags,
      timestamp: new Date().toISOString(),
    })

    // In production, send to analytics service
    if (process.env.NODE_ENV === "production") {
      // analytics.track(metric, { value, ...tags })
    }
  }

  // User Activity Tracking
  static trackUserActivity(userId: string, action: string, metadata: any = {}) {
    console.log("👤 User Activity:", {
      userId,
      action,
      metadata,
      timestamp: new Date().toISOString(),
    })

    // In production, send to analytics
    if (process.env.NODE_ENV === "production") {
      // analytics.track("user_activity", { userId, action, ...metadata })
    }
  }

  // Business Metrics
  static trackBusinessMetric(metric: string, value: number, userId?: string) {
    const data = {
      metric,
      value,
      userId,
      timestamp: new Date().toISOString(),
    }

    console.log("💼 Business Metric:", data)

    // In production, send to business intelligence tools
    if (process.env.NODE_ENV === "production") {
      // mixpanel.track(metric, data)
    }
  }

  // Security Events
  static trackSecurityEvent(event: string, severity: "low" | "medium" | "high" | "critical", details: any) {
    const data = {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
    }

    console.warn("🛡️ Security Event:", data)

    // In production, send to security monitoring
    if (process.env.NODE_ENV === "production") {
      // securityMonitoring.alert(event, data)
    }
  }
}

// Performance monitoring hooks
export function usePerformanceMonitoring() {
  const trackPageLoad = (pageName: string) => {
    if (typeof window !== "undefined") {
      const loadTime = performance.now()
      ProductionMonitoring.trackPerformance("page_load_time", loadTime, { page: pageName })
    }
  }

  const trackApiCall = (endpoint: string, duration: number, status: number) => {
    ProductionMonitoring.trackPerformance("api_call_duration", duration, {
      endpoint,
      status: status.toString(),
    })
  }

  return { trackPageLoad, trackApiCall }
}
