// Skip Husky install in CI or if not in a git repo
if (process.env.CI || !process.env.npm_lifecycle_event?.includes('prepare')) {
  process.exit(0);
}

const husky = (await import('husky')).default;
console.log(husky());
