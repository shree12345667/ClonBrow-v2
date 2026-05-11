# 🚀 AUTO-DEPLOY: Push to GitHub → Live on Render

**NO MORE RESTARTING!** Just push code → Auto deploys to cloud.

---

## 📋 ONE-TIME SETUP

### Step 1: Create GitHub Repo

```powershell
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial CLONMED MCP Server"

# Create GitHub repo (do this on github.com first, then run):
git remote add origin https://github.com/YOUR_USERNAME/clonmed-mcp-server.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy to Render (Free)

1. Go to https://dashboard.render.com
2. Sign up with **GitHub**
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo: `clonmed-mcp-server`
5. Render will auto-detect settings from `render.yaml`
6. Click **Deploy**

---

### Step 3: Get Deploy Hook (For Auto-Deploy)

In Render Dashboard:
1. Click your service
2. Go to **Settings**
3. Scroll to **Deploy Hook**
4. Copy the URL (looks like: `https://api.render.com/deploy/xxx`)

---

### Step 4: Add Secret to GitHub

In GitHub repo:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `RENDER_DEPLOY_HOOK`
4. Value: *(paste the URL from Step 3)*
5. Click **Add secret**

✅ **Done! Now every push auto-deploys!**

---

## 🔄 DAILY WORKFLOW (After Setup)

### Make Changes Locally
Edit your files in VS Code like normal.

### Push to GitHub
```powershell
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"

# Check what changed
git status

# Add changes
git add .

# Commit with message
git commit -m "Updated report design and tab opening"

# Push to GitHub (auto-triggers Render deploy!)
git push origin main
```

### Watch Auto-Deploy
1. Go to https://dashboard.render.com
2. Click your service
3. See **Deploying...** → **Live**
4. Done! No restart needed!

---

## 📁 Files Added for Auto-Deploy

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | GitHub Actions - triggers Render deploy |
| `render.yaml` | Render config (already created) |
| `package.json` | Node dependencies |

---

## 🌐 Your Live URL

After deploy, you get:
```
https://clonmed-mcp-server.onrender.com
```

Use in Prompt Opinion:
```
URL: https://clonmed-mcp-server.onrender.com/mcp
Type: Streamable HTTP
```

---

## 🧪 Test Auto-Deploy

1. Edit `server.js` locally (add a comment)
2. Run:
   ```powershell
   git add .
   git commit -m "Test auto deploy"
   git push origin main
   ```
3. Go to https://dashboard.render.com
4. Watch it auto-deploy!

---

## ⚠️ FREE TIER LIMITS (Render)

- Sleeps after 15 min idle (wakes up in 30-60 sec)
- For **24/7 uptime**, upgrade to $7/month
- Or use **Railway** ($5/month, no sleep)

---

## 🆘 Troubleshooting

### Deploy Failed?
```powershell
# Check Render logs in dashboard
# Common fixes:
npm install  # update dependencies
node --check server.js  # check syntax
git push origin main  # push again
```

### Git Push Rejected?
```powershell
# If "updates were rejected"
git pull origin main --rebase
git push origin main
```

### Want to Deploy Manually?
In Render dashboard → Click **Manual Deploy** → **Deploy Latest Commit**

---

## 💡 PRO TIPS

1. **Always commit with good messages:**
   ```
   git commit -m "Fixed tab opening in Chrome"
   ```

2. **See what's changing:**
   ```
   git status
   git diff
   ```

3. **Revert bad changes:**
   ```
   git checkout -- server.js
   ```

4. **View commit history:**
   ```
   git log --oneline
   ```

---

## 🎯 SUMMARY

| You Do | What Happens |
|--------|--------------|
| Edit files locally | Nothing yet |
| `git push origin main` | 1. Code goes to GitHub<br>2. GitHub Actions triggers<br>3. Render auto-deploys<br>4. Live in 2-3 minutes |

**Just push → Live automatically!**

---

## 📞 Quick Commands Cheat Sheet

```powershell
# Setup (one time)
git init
git remote add origin https://github.com/YOUR_USERNAME/clonmed-mcp-server.git

# Daily workflow
git add .
git commit -m "Your changes"
git push origin main

# Check status
git status
git log --oneline -5
```

---

**Want me to help you set this up step by step?** Just tell me!
