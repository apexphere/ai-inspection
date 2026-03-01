/**
 * Version information for health endpoint — Issue #591
 *
 * Exposes semantic version from package.json alongside git metadata.
 * Railway auto-injects RAILWAY_GIT_COMMIT_SHA and RAILWAY_GIT_BRANCH.
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string };

const sha = process.env.GIT_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown';

export const version = {
  semver: pkg.version,
  sha,
  shortSha: sha.slice(0, 7),
  branch: process.env.GIT_BRANCH || process.env.RAILWAY_GIT_BRANCH || 'unknown',
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
};
