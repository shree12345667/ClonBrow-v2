# Cloudflare Tunnel Setup for CLONMED

## Step 1: Install cloudflared

### Windows (PowerShell as Admin)
```powershell
# Download cloudflared
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "$env:TEMP\cloudflared.exe"

# Move to PATH
Move-Item "$env:TEMP\cloudflared.exe" "$env:LOCALAPPDATA\Microsoft\WindowsApps\cloudflared.exe" -Force

# Verify
cloudflared --version
```

### Or use winget
```powershell
winget install Cloudflare.cloudflared
```

## Step 2: Authenticate with Cloudflare
```powershell
cloudflared tunnel login
```
- This opens browser - select your domain
- Download certificate automatically

## Step 3: Create a Tunnel
```powershell
# Create tunnel (name it anything)
cloudflared tunnel create clonmed-server

# Save the tunnel ID shown (looks like: 12345abc-6789-def0-1234-567890abcdef)
```

## Step 4: Configure the Tunnel

Create config file at `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID_HERE
credentials-file: C:\Users\YOUR_USERNAME\.cloudflared\YOUR_TUNNEL_ID_HERE.json

ingress:
  - hostname: clonmed.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

## Step 5: Add DNS Record
```powershell
# Replace with your actual subdomain and tunnel ID
cloudflared tunnel route dns clonmed-server clonmed.yourdomain.com
```

## Step 6: Run the Tunnel

### Option A: Run manually (testing)
```powershell
# In one terminal - start your MCP server first
node server.js

# In another terminal - start the tunnel
cloudflared tunnel run clonmed-server
```

### Option B: Run as Windows Service (production)
```powershell
# Install as service
cloudflared service install

# Start service
net start cloudflared

# Or use Services app to manage
```

## Step 7: Update MCP Server for Public URL

Add to your environment or modify server.js:
```javascript
const publicBaseUrl = process.env.PUBLIC_URL || 'https://clonmed.yourdomain.com';
```

## Verify It's Working
```powershell
# Test local
curl http://localhost:3001/health

# Test through Cloudflare
curl https://clonmed.yourdomain.com/health
```

## Quick Commands Reference
```powershell
# List tunnels
cloudflared tunnel list

# Delete tunnel
cloudflared tunnel delete clonmed-server

# View logs
cloudflared tunnel tail clonmed-server

# Stop tunnel (if running manually)
Ctrl + C
```

## Troubleshooting

### Port already in use
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill it
taskkill /PID <PID> /F
```

### Tunnel not connecting
1. Check firewall - allow cloudflared
2. Verify DNS record created: `cloudflared tunnel route dns list`
3. Check config file syntax (spaces not tabs)

### MCP not responding
1. Server must be running on localhost:3001 BEFORE tunnel starts
2. Check `http://localhost:3001/health` works locally first

## Free vs Paid Cloudflare
- **Free**: Works perfectly for MCP, 100ms tunnel timeout
- **Paid**: Longer timeouts, better analytics, load balancing

Your MCP server will be accessible at: `https://clonmed.yourdomain.com`
