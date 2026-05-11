#!/usr/bin/env node

import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const timestamp = () => new Date().toISOString().replace("T", " ").slice(0, 19);

function log(type, message) {
  const icons = { info: "ℹ️", success: "✅", error: "❌", warn: "⚠️" };
  console.log(`[${timestamp()}] ${icons[type] || "•"} ${message}`);
}

console.log(`
╔════════════════════════════════════════════════════════╗
║     CLONMEDIC MCP SERVER v2.0.0                        ║
║     Medical Simulation Command Interface               ║
╚════════════════════════════════════════════════════════╝
`);

const command = process.argv[2];

if (command === 'start') {
    log("info", "Initializing MCP Server...");
    
    // Import and start the server
    await import('./server.js');
    
    log("success", "MCP Server is running on port 3000");
    log("info", "SSE endpoint: http://localhost:3000/sse");
    
    // Optionally open the dashboard
    try {
        const { default: open } = await import('open');
        await open('https://polite-lamington-b8d87d.netlify.app/');
        log("success", "Dashboard opened in browser");
    } catch (e) {
        log("warn", "Could not open browser automatically");
    }

} else if (command === 'inspect') {
    log("info", "Starting MCP Inspector for debugging...");
    
    const inspector = spawn('npx', ['@modelcontextprotocol/inspector', 'node', 'server.js'], {
        stdio: 'inherit', 
        shell: true
    });

    inspector.on('error', (err) => {
        log("error", `Inspector failed: ${err.message}`);
        process.exit(1);
    });

} else if (command === 'health') {
    // Quick health check
    try {
        const response = await fetch('http://localhost:3000/health');
        const data = await response.json();
        log("success", `Server status: ${data.status}`);
        log("info", `Available labs: ${data.labs}`);
        log("info", `Uptime: ${Math.floor(data.uptime)}s`);
    } catch (e) {
        log("error", "Server is not running. Start it with 'clonmedic start'");
        process.exit(1);
    }

} else {
    console.log(`
Usage: clonmedic <command>

Commands:
  start    Start the MCP server (runs on port 3000)
  inspect  Launch MCP Inspector for debugging
  health   Check if server is running and get status

Examples:
  $ clonmedic start
  $ clonmedic inspect
  $ clonmedic health
`);
    process.exit(1);
}