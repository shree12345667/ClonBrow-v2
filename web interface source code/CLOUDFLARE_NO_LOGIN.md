# Cloudflare Tunnel - NO LOGIN Required

## Your Exact Command (NO LOGIN NEEDED)

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001
```

**This gives you a RANDOM temporary URL instantly - NO account needed!**

## Quick Steps

### 1. Start MCP Server
```powershell
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"
node server.js
```

### 2. Open New PowerShell Window
```powershell
# Run YOUR command exactly as you said:
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001
```

### 3. Get Your Public URL
You'll see output like:
```
INF Your quick Tunnel has been created! Visit it at:
INF https://something-random-123.trycloudflare.com
```

**Copy this URL!**

### 4. Use in Prompt Opinion
```
https://something-random-123.trycloudflare.com/mcp
```

**IMPORTANT: Add `/mcp` at the end!**

---

## Full Example

**Terminal 1 - Server:**
```powershell
PS C:\Users\ClonexxShree\Desktop\hackathon\health thing> node server.js
[INFO] Port: 3001
[INFO] MCP (Prompt Opinion): http://localhost:3001/mcp
...
```

**Terminal 2 - Tunnel:**
```powershell
PS C:\Users\ClonexxShree> & "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001

INF Your quick Tunnel has been created! Visit it at:
INF https://purple-cloud-123.trycloudflare.com
```

**Prompt Opinion Settings:**
- URL: `https://purple-cloud-123.trycloudflare.com/mcp`
- Type: Streamable HTTP

---

## How It Works

| Feature | Description |
|---------|-------------|
| `--url` | Creates temporary tunnel |
| NO login | No Cloudflare account needed |
| NO config | No files to setup |
| Random URL | Changes every restart |
| Free | Completely free |

---

## Troubleshooting

### "Cannot find cloudflared"
```powershell
# Check if file exists
Test-Path "C:\Program Files (x86)\cloudflared\cloudflared.exe"

# If false, download it:
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "C:\Program Files (x86)\cloudflared\cloudflared.exe"
```

### "Connection refused"
- Make sure server is running on port 3001
- Check: `http://localhost:3001/health` in browser

### URL doesn't work
- The URL is temporary (changes on restart)
- Get the new URL from the terminal output
- Update Prompt Opinion with new URL

---

## URLs Explained

| URL | Purpose |
|-----|---------|
| `http://localhost:3001` | Your local server |
| `https://xxx.trycloudflare.com` | Public tunnel URL |
| `/mcp` | MCP endpoint for Prompt Opinion |
| `/sse` | SSE endpoint |
| `/health` | Health check |

---

## Full Test

```powershell
# 1. Start server
node server.js

# 2. In new window, start tunnel
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001

# 3. Test locally
Invoke-RestMethod http://localhost:3001/health

# 4. Test through tunnel (replace with your URL)
Invoke-RestMethod https://purple-cloud-123.trycloudflare.com/health
```

---

## Keep URL Running

The tunnel stays active as long as:
1. The PowerShell window stays open
2. The server keeps running

**To stop:** Press `Ctrl+C` in the tunnel window

---

## Pro Tips

1. **Copy URL quickly** - It's shown once at start
2. **Pin the terminal** - Keep tunnel window open
3. **New URL every restart** - Update Prompt Opinion each time
4. **Test local first** - Make sure `localhost:3001` works

---

## Your Complete Workflow

```powershell
# Step 1: Start server (Terminal 1)
node server.js

# Step 2: Start tunnel (Terminal 2) 
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001

# Step 3: Copy the HTTPS URL from output

# Step 4: Add /mcp and use in Prompt Opinion
# Example: https://abc-123.trycloudflare.com/mcp
```

---

## Commands Summary

| Action | Command |
|--------|---------|
| Start server | `node server.js` |
| Start tunnel | `& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001` |
| Test local | `http://localhost:3001/health` |
| Test tunnel | `https://xxx.trycloudflare.com/health` |
| MCP endpoint | `https://xxx.trycloudflare.com/mcp` |

**NO LOGIN. NO CONFIG. JUST WORKS.**
