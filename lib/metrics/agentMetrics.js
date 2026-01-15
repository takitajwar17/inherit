/**
 * Agent Performance Metrics
 * 
 * Tracks and logs performance metrics for the AI agent system.
 * Monitors response times, routing accuracy, and agent usage.
 * 
 * @module lib\metrics\agentMetrics
 */

import logger from '@/lib/logger';

// Metrics storage
const metrics = {
  totalRequests: 0,
  totalErrors: 0,
  agentUsage: {
    learning: 0,
    task: 0,
    code: 0,
    roadmap: 0,
    general: 0,
  },
  responseTimes: [],
  routingConfidence: [],
  languageUsage: {
    en: 0,
    bn: 0,
  },
  errors: [],
};

// Configuration
const METRICS_CONFIG = {
  maxResponseTimesSamples: 100,
  maxErrorsSamples: 50,
  logIntervalMs: 300000, // Log summary every 5 minutes
};

/**
 * Record a request
 * @param {Object} data - Request metadata
 */
export function recordRequest(data) {
  const {
    agent,
    language = 'en',
    responseTime,
    confidence,
    error = null,
  } = data;

  metrics.totalRequests++;

  if (error) {
    metrics.totalErrors++;
    metrics.errors.push({
      agent,
      error: error.message,
      timestamp: Date.now(),
    });

    // Keep only recent errors
    if (metrics.errors.length > METRICS_CONFIG.maxErrorsSamples) {
      metrics.errors.shift();
    }
  }

  if (agent && metrics.agentUsage[agent] !== undefined) {
    metrics.agentUsage[agent]++;
  }

  if (language && metrics.languageUsage[language] !== undefined) {
    metrics.languageUsage[language]++;
  }

  if (responseTime !== undefined) {
    metrics.responseTimes.push(responseTime);

    // Keep only recent response times
    if (metrics.responseTimes.length > METRICS_CONFIG.maxResponseTimesSamples) {
      metrics.responseTimes.shift();
    }
  }

  if (confidence !== undefined) {
    metrics.routingConfidence.push(confidence);

    // Keep only recent confidence scores
    if (metrics.routingConfidence.length > METRICS_CONFIG.maxResponseTimesSamples) {
      metrics.routingConfidence.shift();
    }
  }
}

/**
 * Calculate average from array
 * @param {Array<number>} arr - Array of numbers
 * @returns {number} Average
 */
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate percentile from array
 * @param {Array<number>} arr - Sorted array of numbers
 * @param {number} p - Percentile (0-100)
 * @returns {number} Percentile value
 */
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get current metrics summary
 * @returns {Object} Metrics summary
 */
export function getMetricsSummary() {
  const errorRate = metrics.totalRequests > 0
    ? (metrics.totalErrors / metrics.totalRequests) * 100
    : 0;

  const avgResponseTime = average(metrics.responseTimes);
  const p50ResponseTime = percentile(metrics.responseTimes, 50);
  const p95ResponseTime = percentile(metrics.responseTimes, 95);
  const p99ResponseTime = percentile(metrics.responseTimes, 99);

  const avgConfidence = average(metrics.routingConfidence);

  return {
    summary: {
      totalRequests: metrics.totalRequests,
      totalErrors: metrics.totalErrors,
      errorRate: errorRate.toFixed(2) + '%',
    },
    performance: {
      avgResponseTime: avgResponseTime.toFixed(0) + 'ms',
      p50ResponseTime: p50ResponseTime.toFixed(0) + 'ms',
      p95ResponseTime: p95ResponseTime.toFixed(0) + 'ms',
      p99ResponseTime: p99ResponseTime.toFixed(0) + 'ms',
    },
    routing: {
      avgConfidence: avgConfidence.toFixed(2),
      samples: metrics.routingConfidence.length,
    },
    agentUsage: metrics.agentUsage,
    languageUsage: metrics.languageUsage,
    recentErrors: metrics.errors.slice(-10).map(e => ({
      agent: e.agent,
      error: e.error,
      time: new Date(e.timestamp).toISOString(),
    })),
  };
}

/**
 * Log metrics summary
 */
export function logMetricsSummary() {
  const summary = getMetricsSummary();
  logger.info('Agent Metrics Summary', summary);
}

/**
 * Reset all metrics
 */
export function resetMetrics() {
  metrics.totalRequests = 0;
  metrics.totalErrors = 0;
  metrics.agentUsage = {
    learning: 0,
    task: 0,
    code: 0,
    roadmap: 0,
    general: 0,
  };
  metrics.responseTimes = [];
  metrics.routingConfidence = [];
  metrics.languageUsage = { en: 0, bn: 0 };
  metrics.errors = [];

  logger.info('Metrics reset');
}

// Auto-log metrics periodically in production
if (process.env.NODE_ENV === 'production') {
  setInterval(logMetricsSummary, METRICS_CONFIG.logIntervalMs);
}

export default {
  recordRequest,
  getMetricsSummary,
  logMetricsSummary,
  resetMetrics,
};
