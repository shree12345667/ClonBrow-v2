# 🔗 CONNECT GITHUB TO RENDER (NO LOCAL COMMANDS!)

**YOU DON'T RUN ANYTHING ON YOUR PC!**

Just connect GitHub → Render → Cloud runs 24/7

---

## ✅ STEP 1: Upload to GitHub (Web Only)

### Option A: GitHub Web Interface (NO Commands!)

1. Go to https://github.com/new
2. **Repository name:** `clonmed-mcp-server`
3. **Public** or **Private** (your choice)
4. Click **"Create repository"**
5. On the next page, click **"uploading an existing file"**
6. Drag & drop these files from your folder:
   - `server.js`
   - `package.json`
   - `render.yaml`
   - `.github/workflows/deploy.yml`
   - All your `.html` lab files
7. Click **"Commit changes"**

✅ **Done! Code is now on GitHub.**

---

## ✅ STEP 2: Connect to Render (Web Only)

1. Go to https://dashboard.render.com
2. Click **"Sign Up"** → **"Sign up with GitHub"**
3. Authorize Render to access your repos
4. Click **"New +"** (top right)
5. Click **"Web Service"**
6. Find and click your repo: `clonmed-mcp-server`
7. Render auto-detects settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
8. Click **"Create Web Service"**

✅ **Done! Deploying automatically...**

---

## ✅ STEP 3: Wait 2-3 Minutes

In Render dashboard, you'll see:
```
Building → Deploying → Live
```

When it says **"Live"**, your server is running 24/7!

---

## 🌐 YOUR LIVE URL

After deploy, you get:
```
https://clonmed-mcp-server.onrender.com
```

**Use in Prompt Opinion:**
```
URL: https://clonmed-mcp-server.onrender.com/mcp
Type: Streamable HTTP
```

---

## 🔄 AUTO-DEPLOY (No Commands!)

After setup, when you want to update:

### Method: GitHub Web Editor

1. Go to https://github.com/YOUR_USERNAME/clonmed-mcp-server
2. Click on file you want to edit (e.g., `server.js`)
3. Click ** pencil icon** (Edit)
4. Make changes
5. Scroll down, add commit message
6. Click **"Commit changes"**
7. ✅ **Render auto-deploys in 2-3 minutes!**

**That's it! No terminal, no commands, no PC needed!**

---

## 📁 FILES TO UPLOAD TO GITHUB

Upload these to your GitHub repo:

| File | Purpose |
|------|---------|
| `server.js` | Main server code |
| `package.json` | Dependencies |
| `render.yaml` | Render config |
| `.github/workflows/deploy.yml` | Auto-deploy setup |
| All `.html` files | Lab simulations |
| `index.html` | Dashboard |

---

## ⚠️ 404 ERROR FIX

If you get 404, check:

1. **Wrong URL?** Should be:
   ```
   https://clonmed-mcp-server.onrender.com/mcp
   ```

2. **Server still building?** Wait 3-5 minutes after first deploy

3. **Check Render logs:**
   - Go to https://dashboard.render.com
   - Click your service
   - Click **"Logs"** tab
   - Look for errors

4. **Free tier sleeping?** First request after idle takes 30-60 sec

---

## 💡 FREE TIER LIMITS

| Feature | Free | Paid ($7/mo) |
|---------|------|--------------|
| Auto-deploy | ✅ Yes | ✅ Yes |
| 24/7 uptime | ❌ Sleeps after 15min | ✅ Always on |
| Wake up time | 30-60 sec | Instant |

**For true 24/7:** Upgrade to $7/month or use Railway.app ($5/mo)

---

## 🆘 NEED HELP?

### Error in Render logs?

Common fixes:
1. Check `package.json` has all dependencies
2. Make sure `server.js` starts server on `process.env.PORT || 3001`
3. Check for syntax errors

### Can't connect to MCP?

Test these URLs in browser:
```
https://clonmed-mcp-server.onrender.com/health
https://clonmed-mcp-server.onrender.com/labs
```

If those work, MCP should work.

---

## 🎯 SUMMARY

| You Do | Where | What Happens |
|--------|-------|--------------|
| Upload files | github.com (web) | Code stored in cloud |
| Connect Render | dashboard.render.com | Server deploys automatically |
| Edit code | github.com (web editor) | Auto-deploys to cloud |
| Use in Prompt Opinion | Their app | Connects to your cloud URL |

**Zero commands on your PC! Everything in browser!**

---

## 🔗 IMPORTANT LINKS

- **GitHub:** https://github.com/new
- **Render Dashboard:** https://dashboard.render.com
- **Your Repo (after):** https://github.com/YOUR_USERNAME/clonmed-mcp-server
- **Your Live URL (after):** https://clonmed-mcp-server.onrender.com

---

**Go to https://github.com/new and create the repo now!**
