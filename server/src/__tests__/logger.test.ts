/**
 * MCP Server Logger Tests — Issue #574
 */

import { describe, it, expect } from 'vitest';
import { logger } from '../lib/logger.js';

describe('MCP Server Logger — #574', () => {
  it('has service binding set to mcp-server', () => {
    const bindings = logger.bindings();
    expect(bindings.service).toBe('mcp-server');
  });

  it('has default level of info', () => {
    expect(logger.level).toBe('info');
  });

  it('creates child loggers with additional context', () => {
    const child = logger.child({ tool: 'create_finding' });
    const bindings = child.bindings();
    expect(bindings.tool).toBe('create_finding');
    expect(bindings.service).toBe('mcp-server');
  });

  it('is a pino logger instance', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.child).toBe('function');
  });
});
