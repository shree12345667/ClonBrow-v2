# 🚂 RAILWAY.APP - Deploy ALL 150 Files (NO GitHub!)

**Why Railway?**
- ✅ $5/month (cheaper than Render $7)
- ✅ **NO SLEEP MODE** - Always on!
- ✅ Deploy FOLDER directly (all 150 files at once)
- ✅ NO GitHub needed
- ✅ Better than Render

---

## 🚀 DEPLOY IN 3 STEPS

### Step 1: Sign Up (Web)
1. Go to https://railway.app
2. Click **"Start for Free"**
3. Sign up with **email** (not GitHub)
4. Verify email

### Step 2: Install Railway CLI (One Time)

**Open PowerShell as Administrator:**
```powershell
npm install -g @railway/cli
```

**Then login:**
```powershell
railway login
```
This opens browser → Click **"Authorize"** → Done!

### Step 3: Deploy (ONE Command!)

```powershell
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"
railway init
railway up
```

**That's it!** Railway uploads ALL 150 files automatically!

You'll get URL:
```
https://clonmed-mcp-server.up.railway.app/mcp
```

---

## 💰 Pricing

| Feature | Free | Pro ($5/mo) |
|---------|------|-------------|
| Always On | ✅ Yes | ✅ Yes |
| Deploy | ✅ Unlimited | ✅ Unlimited |
| Bandwidth | 10GB | 100GB |

**For your use case: Free tier works!**

---

## 🔄 UPDATE CODE (When You Want Changes)

Just run again:
```powershell
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"
railway up
```

Uploads new version instantly!

---

## 🆚 Railway vs Render

| Feature | Railway | Render |
|---------|---------|--------|
| GitHub needed? | ❌ NO | ✅ YES |
| Sleep mode? | ❌ NO | ✅ YES (free) |
| Price | $5/mo | $7/mo |
| File upload | CLI drag-drop | Git only |
| Easier? | ✅ YES | ❌ NO |

---

## 📋 TROUBLESHOOTING

### "railway: command not found"
```powershell
# Reinstall
npm install -g @railway/cli

# Or use npx (no install)
npx railway@latest login
npx railway@latest init
npx railway@latest up
```

### Deploy failed?
```powershell
# Check what's wrong
railway logs

# Redeploy
railway up
```

### Want custom domain?
1. Railway dashboard → your project
2. Settings → Domains
3. Add your domain

---

## 🎯 YOUR LIVE URL

After deploy:
```
https://clonmed-mcp-server.up.railway.app/mcp
```

Use in **Prompt Opinion**:
```
URL: https://clonmed-mcp-server.up.railway.app/mcp
Type: Streamable HTTP
```

---

## ✅ ADVANTAGES

1. **PC can be OFF** - Server runs 24/7 in cloud
2. **One command deploy** - `railway up`
3. **All 150 files upload** - No file limit
4. **Always awake** - No sleep mode
5. **Cheap** - $5/month if you upgrade

---

## 🔗 IMPORTANT LINKS

- **Railway:** https://railway.app
- **CLI Docs:** https://docs.railway.app/develop/cli
- **Dashboard:** https://railway.app/dashboard

---

## 💡 PRO TIP

Add to PowerShell profile for quick deploy:
```powershell
# Run once:
notepad $PROFILE

# Add this line:
function clonmed-deploy { cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"; railway up }

# Now just type:
clonmed-deploy
```

---

**GO TO https://railway.app NOW AND SIGN UP!**

Then run:
```powershell
npm install -g @railway/cli
railway login
railway init
railway up
```

**Done in 5 minutes!**
