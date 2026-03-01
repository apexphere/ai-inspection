/**
 * Logger Tests — Issue #572
 */

import { describe, it, expect } from 'vitest';
import { logger } from '../lib/logger.js';

describe('Logger — #572', () => {
  it('exports a pino logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.fatal).toBe('function');
  });

  it('has service base field set to api', () => {
    // pino stores base bindings internally
    const bindings = logger.bindings();
    expect(bindings.service).toBe('api');
  });

  it('has default level of info', () => {
    expect(logger.level).toBe('info');
  });

  it('can create child loggers', () => {
    const child = logger.child({ module: 'test' });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
    const bindings = child.bindings();
    expect(bindings.module).toBe('test');
  });
});
