#!/usr/bin/env node
/**
 * Build validation script for tradingview-agent.
 * This is a pure Node.js package — no compilation needed.
 * This script validates that all entry points are importable and the package is ready.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const checks = [];
let failed = false;

function pass(msg) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); checks.push({ ok: true, msg }); }
function fail(msg) { console.error(`  \x1b[31m✗\x1b[0m ${msg}`); checks.push({ ok: false, msg }); failed = true; }

console.log(`\n\x1b[1mBuilding ${pkg.name} v${pkg.version}\x1b[0m\n`);

// 1. Verify main entry point loads
try {
  await import('../src/index.js');
  pass('Main entry point (src/index.js) loads without errors');
} catch (e) {
  fail(`Main entry point failed: ${e.message}`);
}

// 2. Verify CLI entry point loads
try {
  // Only check syntax — don't execute main()
  const { createRequire: _cr } = await import('node:module');
  await import('../src/pine/analyzer.js');
  pass('Pine analyzer (src/pine/analyzer.js) loads without errors');
} catch (e) {
  fail(`Pine analyzer failed: ${e.message}`);
}

// 3. Verify all required fields in package.json
for (const field of ['name', 'version', 'main', 'type', 'engines']) {
  if (pkg[field]) {
    pass(`package.json has required field: ${field}`);
  } else {
    fail(`package.json missing field: ${field}`);
  }
}

// 4. Check Node.js version requirement
const [major] = process.versions.node.split('.').map(Number);
const required = parseInt(pkg.engines?.node?.replace('>=', '') || '18');
if (major >= required) {
  pass(`Node.js ${process.versions.node} meets requirement (>=${required})`);
} else {
  fail(`Node.js ${process.versions.node} does not meet requirement (>=${required})`);
}

console.log('');
console.log(`  ${checks.filter(c => c.ok).length}/${checks.length} checks passed`);

if (failed) {
  console.error('\n\x1b[31mBuild failed.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\n\x1b[32mBuild succeeded.\x1b[0m\n');
}
