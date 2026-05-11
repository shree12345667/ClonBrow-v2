# 🚀 Deploy CLONMED MCP Server 24/7 (FREE)

## Option 1: Render.com (Recommended - FREE)

### Step 1: Sign Up
1. Go to https://render.com
2. Sign up with GitHub
3. It's FREE forever for 1 web service

### Step 2: Deploy
1. Fork/Upload this repo to GitHub
2. In Render dashboard, click "New +" → "Web Service"
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` and deploy!

### Step 3: Get Your URL
After deployment, you'll get a URL like:
```
https://clonmed-mcp-server.onrender.com
```

### Step 4: Use in Prompt Opinion
```
URL: https://clonmed-mcp-server.onrender.com/mcp
Type: Streamable HTTP
```

### ⚠️ Free Tier Limitations
- Sleeps after 15 min inactivity (wakes up in 30-60 sec)
- For true 24/7, upgrade to $7/month

---

## Option 2: Railway.app (FREE)

### Step 1: Sign Up
https://railway.app

### Step 2: Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# In your project folder
railway init
railway up
```

### Step 3: Get URL
```bash
railway domain
```

---

## Option 3: Fly.io (PAYG - Cheap)

### Step 1: Install
```powershell
# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Step 2: Deploy
```powershell
fly launch
fly deploy
```

### Cost: ~$2-5/month for low usage

---

## Option 4: VPS (Full Control)

### Cheap VPS Options:
| Provider | Price | Link |
|----------|-------|------|
| DigitalOcean | $4/month | https://digitalocean.com |
| Linode | $5/month | https://linode.com |
| Vultr | $2.50/month | https://vultr.com |

### Deploy Script:
```bash
# On your VPS
sudo apt update
sudo apt install nodejs npm git -y

git clone https://github.com/YOUR_USERNAME/clonmed-mcp-server
cd clonmed-mcp-server
npm install

# Create systemd service
sudo nano /etc/systemd/system/clonmed.service
```

Paste this:
```ini
[Unit]
Description=CLONMED MCP Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/clonmed-mcp-server
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=3001
Environment=CLONMED_AUTO_OPEN=false

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable clonmed
sudo systemctl start clonmed

# Check status
sudo systemctl status clonmed
```

---

## 🌐 Your URL After Deployment

### For Render/Railway/Fly:
```
https://your-app-name.onrender.com/mcp
https://your-app-name.up.railway.app/mcp
https://your-app-name.fly.dev/mcp
```

### For VPS (with domain):
```
https://your-domain.com/mcp
```

---

## 🔧 Cloudflare Tunnel (Alternative)

If you want to keep running from your computer but more reliable:

### Permanent Tunnel (with login)
```powershell
# 1. Login once
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel login

# 2. Create tunnel
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel create clonmed

# 3. Get tunnel ID and route
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel route dns clonmed your-subdomain.your-domain.com

# 4. Run tunnel (this keeps running)
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel run clonmed
```

---

## ✅ Recommendation

**For Demo/Testing:** Use Render.com FREE tier
**For Production:** Use VPS ($5/month) or Fly.io
**For Personal Use:** Keep local + Cloudflare temporary tunnel

---

## 📊 Comparison

| Option | Cost | Uptime | Setup | Best For |
|--------|------|--------|-------|----------|
| Render Free | $0 | 90% (sleeps) | Easy | Testing |
| Render Paid | $7/mo | 99.9% | Easy | Production |
| Railway Free | $0 | 90% | Easy | Testing |
| VPS | $5/mo | 99.9% | Medium | Production |
| Fly.io | ~$3/mo | 99.9% | Medium | Production |
| Local + Cloudflare | $0 | When PC on | Easy | Personal |

---

## 🚀 QUICK START: Render (FREE)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/clonmed-mcp-server.git
git push -u origin main

# 2. Go to https://dashboard.render.com
# 3. Click "New Web Service"
# 4. Select your repo
# 5. Done! Copy the URL and use in Prompt Opinion
```

---

**Want me to help you deploy to any of these?** Just tell me which one!
