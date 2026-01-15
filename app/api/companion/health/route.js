/**
 * AI Companion Health Check API
 *
 * GET /api/companion/health
 *
 * Health check endpoint for monitoring the AI agent system.
 * Tests agent availability, model connectivity, and system metrics.
 */

import { NextResponse } from 'next/server';
import { getInitializedOrchestrator } from '@/lib/agents';
import { getCacheStats } from '@/lib/cache/responseCache';
import { getMetricsSummary } from '@/lib/metrics/agentMetrics';
import { HumanMessage } from '@langchain/core/messages';
import logger from '@/lib/logger';

/**
 * GET /api/companion/health - System health check
 */
export async function GET() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
    metrics: {},
    cache: {},
  };

  try {
    // 1. Check orchestrator initialization
    try {
      const orchestrator = getInitializedOrchestrator();
      health.checks.orchestrator = {
        status: 'ok',
        agentsRegistered: orchestrator.agents.size,
        graphBuilt: !!orchestrator.graph,
      };
    } catch (error) {
      health.checks.orchestrator = {
        status: 'error',
        error: error.message,
      };
      health.status = 'unhealthy';
    }

    // 2. Check each agent's model
    const orchestrator = getInitializedOrchestrator();
    const agentHealthChecks = {};

    for (const [type, agent] of orchestrator.agents) {
      try {
        // Simple test invocation
        const testMessage = new HumanMessage('ping');
        await agent.model.invoke([testMessage]);
        
        agentHealthChecks[type] = {
          status: 'ok',
          name: agent.name,
        };
      } catch (error) {
        agentHealthChecks[type] = {
          status: 'error',
          name: agent.name,
          error: error.message,
        };
        health.status = 'degraded';
      }
    }

    health.checks.agents = agentHealthChecks;

    // 3. Get cache statistics
    try {
      health.cache = getCacheStats();
    } catch (error) {
      health.cache = { status: 'error', error: error.message };
    }

    // 4. Get performance metrics
    try {
      health.metrics = getMetricsSummary();
    } catch (error) {
      health.metrics = { status: 'error', error: error.message };
    }

    // 5. Environment checks
    health.checks.environment = {
      nodeEnv: process.env.NODE_ENV,
      hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
      hasMongoUri: !!process.env.MONGODB_URI,
    };

    // 6. Overall response time
    const responseTime = Date.now() - startTime;
    health.responseTime = `${responseTime}ms`;

    logger.info('Health check completed', {
      status: health.status,
      responseTime: health.responseTime,
    });

    // Set appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: `${Date.now() - startTime}ms`,
    }, { status: 503 });
  }
}

/**
 * POST /api/companion/health - Test agent with custom message
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { agent = 'general', message = 'test' } = body;

    const orchestrator = getInitializedOrchestrator();
    const agentInstance = orchestrator.getAgent(agent);

    if (!agentInstance) {
      return NextResponse.json({
        error: `Agent '${agent}' not found`,
        availableAgents: Array.from(orchestrator.agents.keys()),
      }, { status: 404 });
    }

    const startTime = Date.now();
    const result = await agentInstance.process(message, {
      history: [],
      language: 'en',
    });
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      agent,
      responseTime: `${responseTime}ms`,
      result,
    });

  } catch (error) {
    logger.error('Health check test failed', {
      error: error.message,
    });

    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
