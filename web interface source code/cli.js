#!/usr/bin/env node

import { spawn } from 'node:child_process';

console.log('=======================================');
console.log('CLONMEDIC SYSTEM');
console.log('=======================================');

const command = process.argv[2];

if (command === 'start') {
  console.log('--> Initializing MCP bridge...');
  await import('./server.js');

  console.log('--> MCP bridge active.');
  console.log('--> Web app URL: https://polite-lamington-b8d87d.netlify.app/');

  try {
    const open = await import('open');
    await open.default('https://polite-lamington-b8d87d.netlify.app/');
  } catch {
    console.log('--> Optional package "open" is not installed, so open the URL manually if needed.');
  }
} else if (command === 'inspect') {
  console.log('--> Initializing MCP Inspector sandbox...');

  const inspector = spawn('npx', ['@modelcontextprotocol/inspector', 'node', 'server.js'], {
    stdio: 'inherit',
    shell: true,
  });

  inspector.on('error', (err) => {
    console.error('Critical error booting Inspector:', err);
  });
} else {
  console.log('Unknown command.');
  console.log('Available commands:');
  console.log('  node cli.js start    - Boots the main MCP bridge');
  console.log('  node cli.js inspect  - Boots the MCP Inspector');
}
