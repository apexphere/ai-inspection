/**
 * Version information for health endpoint
 * 
 * Railway auto-injects RAILWAY_GIT_COMMIT_SHA and RAILWAY_GIT_BRANCH
 * For local dev, falls back to 'unknown'
 */

const sha = process.env.GIT_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown';

export const version = {
  sha,
  shortSha: sha.slice(0, 7),
  branch: process.env.GIT_BRANCH || process.env.RAILWAY_GIT_BRANCH || 'unknown',
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
};
