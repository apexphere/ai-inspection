/**
 * Startup validation and diagnostics
 * 
 * Validates required configuration and logs diagnostics on startup.
 */

import { PrismaClient } from '@prisma/client';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate required environment variables
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required in production');
    }
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production');
    }
    if (!process.env.AUTH_PASSWORD) {
      warnings.push('AUTH_PASSWORD not set - auth is disabled');
    }
    if (!process.env.APP_DOMAIN) {
      warnings.push('APP_DOMAIN not set - using default CORS/cookie config');
    }
  }

  // Always check DATABASE_URL format if present
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Test database connection
 */
export async function checkDatabase(): Promise<{ connected: boolean; error?: string }> {
  if (!process.env.DATABASE_URL) {
    return { connected: false, error: 'DATABASE_URL not configured' };
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { connected: false, error: message };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Log startup diagnostics
 */
export async function logStartupDiagnostics(): Promise<void> {
  console.log('=== API Startup Diagnostics ===');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Node version: ${process.version}`);
  
  // Validate env vars
  const envResult = validateEnv();
  if (envResult.errors.length > 0) {
    console.error('❌ Configuration errors:');
    envResult.errors.forEach(e => console.error(`   - ${e}`));
  }
  if (envResult.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    envResult.warnings.forEach(w => console.warn(`   - ${w}`));
  }
  if (envResult.valid && envResult.warnings.length === 0) {
    console.log('✅ Configuration valid');
  }

  // Check database
  console.log('Checking database connection...');
  const dbResult = await checkDatabase();
  if (dbResult.connected) {
    console.log('✅ Database connected');
  } else {
    console.error(`❌ Database connection failed: ${dbResult.error}`);
  }

  console.log('===============================');
}
