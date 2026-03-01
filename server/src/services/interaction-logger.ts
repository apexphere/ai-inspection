import { logger } from "../lib/logger.js";
/**
 * Interaction Logger Service
 * Issue #512 - Interaction Observability
 * 
 * Logs AI interactions for session replay and quality analysis.
 * Logs are fire-and-forget (non-blocking) to avoid impacting tool performance.
 */

import { interactionLogsApi, type InteractionEventType, type CreateInteractionLogInput } from '../api/client.js';

// Buffer for batching logs
const logBuffer: CreateInteractionLogInput[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 1000;
const BATCH_SIZE = 20;

/**
 * Flush buffered logs to the API
 */
async function flushLogs(): Promise<void> {
  if (logBuffer.length === 0) return;
  
  const logsToSend = logBuffer.splice(0, logBuffer.length);
  
  try {
    await interactionLogsApi.createBatch(logsToSend);
  } catch (error) {
    // Log failure but don't throw - logging should not break tools
    logger.error({ err: error }, 'Failed to flush interaction logs');
  }
}

/**
 * Schedule a flush if not already scheduled
 */
function scheduleFlush(): void {
  if (flushTimeout) return;
  
  flushTimeout = setTimeout(async () => {
    flushTimeout = null;
    await flushLogs();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Log an interaction event
 * Non-blocking - returns immediately and logs async
 */
export function logInteraction(
  sessionId: string,
  eventType: InteractionEventType,
  content: Record<string, unknown>,
  metadata?: Record<string, unknown>
): void {
  logBuffer.push({
    sessionId,
    eventType,
    content,
    metadata,
  });
  
  // Flush immediately if buffer is large
  if (logBuffer.length >= BATCH_SIZE) {
    flushLogs();
  } else {
    scheduleFlush();
  }
}

/**
 * Log user input
 */
export function logUserInput(
  sessionId: string,
  input: { text?: string; hasPhoto?: boolean; photoCount?: number },
  metadata?: Record<string, unknown>
): void {
  logInteraction(sessionId, 'USER_INPUT', input, metadata);
}

/**
 * Log tool call
 */
export function logToolCall(
  sessionId: string,
  toolName: string,
  params: Record<string, unknown>,
  metadata?: Record<string, unknown>
): void {
  logInteraction(sessionId, 'TOOL_CALL', { tool: toolName, params }, metadata);
}

/**
 * Log tool result
 */
export function logToolResult(
  sessionId: string,
  toolName: string,
  result: Record<string, unknown>,
  isError: boolean = false,
  metadata?: Record<string, unknown>
): void {
  logInteraction(sessionId, 'TOOL_RESULT', { tool: toolName, result, isError }, metadata);
}

/**
 * Log AI response
 */
export function logAiResponse(
  sessionId: string,
  response: { text: string },
  metadata?: Record<string, unknown>
): void {
  logInteraction(sessionId, 'AI_RESPONSE', response, metadata);
}

/**
 * Force flush all buffered logs (for graceful shutdown)
 */
export async function forceFlush(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  await flushLogs();
}

/**
 * Wrap a tool handler to automatically log calls and results
 */
export function withLogging<TParams extends Record<string, unknown>, TResult>(
  toolName: string,
  handler: (params: TParams) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>,
  getSessionId: (params: TParams) => string | undefined
): (params: TParams) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  return async (params: TParams) => {
    const sessionId = getSessionId(params);
    
    // Log tool call (if we have a session ID)
    if (sessionId) {
      logToolCall(sessionId, toolName, params);
    }
    
    // Execute the actual handler
    const result = await handler(params);
    
    // Log tool result (if we have a session ID)
    if (sessionId) {
      // Parse the result content
      const textContent = result.content.find(c => c.type === 'text');
      let resultData: Record<string, unknown> = {};
      
      if (textContent?.text) {
        try {
          resultData = JSON.parse(textContent.text);
        } catch {
          resultData = { text: textContent.text };
        }
      }
      
      logToolResult(sessionId, toolName, resultData, result.isError ?? false);
    }
    
    return result;
  };
}
