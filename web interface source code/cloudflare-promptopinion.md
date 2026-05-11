# Cloudflare Tunnel for Prompt Opinion MCP

## Your Exact Command

```powershell
# 1. Start MCP server
node server.js

# 2. In NEW PowerShell window, run YOUR command:
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001
```

You'll get a public URL like:
```
https://something-123.trycloudflare.com
```

## Prompt Opinion Configuration

Use this URL in Prompt Opinion:
```
https://something-123.trycloudflare.com/mcp
```

**Important**: Add `/mcp` at the end!

## Full Workflow

1. **Start server:**
   ```powershell
   node server.js
   ```
   Wait for: `[INFO] MCP (Prompt Opinion): http://localhost:3001/mcp`

2. **Start tunnel** (new window):
   ```powershell
   & "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001
   ```
   Copy the HTTPS URL shown

3. **Configure Prompt Opinion:**
   - URL: `https://YOUR-URL.trycloudflare.com/mcp`
   - Method: Streamable HTTP

## Making It Permanent

The random URL changes every restart. For a fixed URL:

```powershell
# 1. Login once
cloudflared tunnel login

# 2. Create named tunnel
cloudflared tunnel create clonmed

# 3. Route DNS (replace with your domain)
cloudflared tunnel route dns clonmed mcp.yourdomain.com

# 4. Run with config
cloudflared tunnel run clonmed
```

Then use: `https://mcp.yourdomain.com/mcp`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot find cloudflared" | Check path: `Test-Path "C:\Program Files (x86)\cloudflared\cloudflared.exe"` |
| 404 on /mcp | Make sure server.js has the `/mcp` endpoint |
| Connection refused | Server not running on port 3001 |
| Timeout | Add timeout in Prompt Opinion settings (30s) |

## Verify Endpoints

```powershell
# Local
Invoke-RestMethod http://localhost:3001/health

# Through tunnel (replace with your URL)
Invoke-RestMethod https://something-123.trycloudflare.com/health
```

## All Server Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/mcp` | **Prompt Opinion MCP** (POST only) |
| `/sse` | Legacy SSE transport |
| `/message` | SSE message handler |
| `/health` | Status check |
| `/api/recommend?q=cancer` | Direct API |
| `/labs/` | Static HTML files |

## Quick Test

```powershell
# Test MCP endpoint locally
Invoke-RestMethod -Method POST http://localhost:3001/mcp -Body '{"jsonrpc":"2.0","method":"initialize","id":1}' -ContentType 'application/json'

# Test through tunnel
Invoke-RestMethod -Method POST https://YOUR-URL.trycloudflare.com/mcp -Body '{"jsonrpc":"2.0","method":"initialize","id":1}' -ContentType 'application/json'
```
