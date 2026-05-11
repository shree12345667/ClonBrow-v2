# 🔄 AUTO-DEPLOY WORKFLOW

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  YOUR COMPUTER  │────▶│    GITHUB    │────▶│    RENDER   │────▶│   LIVE URL   │
│   (Local Edit)  │     │   (Repo)     │     │   (Hosting) │     │ (24/7 Cloud) │
└─────────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
        │                       │                    │
        │ 1. Edit files         │ 2. Auto trigger    │ 3. Auto deploy
        │    in VS Code         │    GitHub Actions  │    on Render
        │                       │                    │
        ▼                       ▼                    ▼
   ┌─────────┐            ┌──────────┐         ┌──────────┐
   │ server.js│           │ Deploy   │         │ Live at: │
   │ modified │────push───▶│ Hook     │────────▶│ clonmed- │
   └─────────┘            │ called   │         │ mcp-      │
                          └──────────┘         │ server.  │
                                               │ onrender │
                                               │ .com     │
                                               └──────────┘
```

## 📝 STEP-BY-STEP

### DAILY WORKFLOW (After Setup)

```powershell
# 1. Edit your files normally in VS Code
#    (server.js, add features, etc.)

# 2. Deploy to cloud (ONE COMMAND!)
npm run deploy

#    This runs:
#    git add . 
#    git commit -m "Deploy update"
#    git push origin main

# 3. Done! Render auto-deploys in 2-3 minutes
#    Check: https://dashboard.render.com
```

---

## 🎯 ONE-TIME SETUP

### 1️⃣ Create GitHub Repo

**Option A: Using setup script**
```powershell
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"
setup-github.bat
```

**Option B: Manual**
```powershell
git init
git add .
git commit -m "Initial commit"
# Create repo on github.com first
git remote add origin https://github.com/YOUR_USERNAME/clonmed-mcp-server.git
git push -u origin main
```

### 2️⃣ Connect to Render

1. https://dashboard.render.com → Sign up with GitHub
2. New + → Web Service → Select your repo
3. Done! Auto-deploy enabled!

### 3️⃣ Add Deploy Hook Secret

1. In Render Dashboard → Settings → Deploy Hook
2. Copy URL
3. GitHub repo → Settings → Secrets → New secret
4. Name: `RENDER_DEPLOY_HOOK`
5. Value: *(paste URL)*

---

## ⚡ QUICK COMMANDS

| Command | What It Does |
|---------|-------------|
| `npm run deploy` | Push to GitHub + auto-deploy |
| `npm run status` | See what files changed |
| `npm run logs` | See commit history |
| `npm start` | Run locally for testing |

---

## 🌐 YOUR LIVE URLS

After deploy:

| Environment | URL |
|------------|-----|
| Local | http://localhost:3001/mcp |
| Cloud | https://clonmed-mcp-server.onrender.com/mcp |

Use in Prompt Opinion:
```
URL: https://clonmed-mcp-server.onrender.com/mcp
Type: Streamable HTTP
```

---

## 🔄 WHAT HAPPENS WHEN YOU PUSH

```
You: npm run deploy
  │
  ├─▶ git add . (stage changes)
  ├─▶ git commit -m "Deploy update"
  └─▶ git push origin main
           │
           ▼
    ┌──────────────┐
    │   GITHUB     │
    │   RECEIVES   │
    │    CODE      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │    GITHUB    │
    │   ACTIONS    │
    │  (deploy.yml)│
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │    CALLS     │
    │RENDER DEPLOY │
    │    HOOK      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │    RENDER    │
    │   DEPLOYS    │
    │  AUTOMATIC   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │     LIVE     │
    │     URL      │
    └──────────────┘
```

---

## ⚠️ FREE TIER NOTE

**Render Free:**
- ✅ Auto-deploy works perfectly
- ⚠️ Sleeps after 15 min idle (30-60 sec wake up)
- 💰 Upgrade to $7/mo for 24/7 uptime

**Alternative:** Railway.app ($5/mo, no sleep)

---

## 🆘 TROUBLESHOOTING

### Deploy not working?
```powershell
# Check what's happening
git status              # See uncommitted changes
git log --oneline -3    # See recent commits

# Force re-deploy
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

### Wrong file deployed?
```powershell
# Make sure you're in right folder
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"
pwd  # Should show Desktop path, NOT Downloads
```

### Want to stop auto-deploy?
In Render dashboard → Settings → Pause auto-deploy

---

**TL;DR:** Edit → `npm run deploy` → Live automatically! 🚀
