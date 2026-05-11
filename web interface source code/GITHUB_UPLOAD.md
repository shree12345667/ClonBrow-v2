# 📦 Upload ALL 150 HTML Files to GitHub (Commands)

**GitHub web has 100 file limit, but GIT COMMANDS have NO LIMIT!**

---

## 🚀 STEP 1: Create GitHub Repo (Web)

1. Go to https://github.com/new
2. **Repository name:** `clonmed-mcp-server`
3. **Public**
4. Click **"Create repository"**
5. **DON'T** check any boxes (no README, no .gitignore)

---

## 🚀 STEP 2: Upload ALL Files (Commands)

**Open PowerShell in your folder:**

```powershell
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"

# 1. Initialize git
git init

# 2. Add ALL files (including all 150 HTML files!)
git add .

# 3. Commit
git commit -m "Initial commit with all labs"

# 4. Connect to GitHub
#    (Replace YOUR_USERNAME with your actual GitHub username!)
git remote add origin https://github.com/YOUR_USERNAME/clonmed-mcp-server.git

# 5. Push ALL files to GitHub
git branch -M main
git push -u origin main
```

**Wait 1-2 minutes... All 150+ files uploaded! ✅**

---

## 🚀 STEP 3: Connect to Render (Web)

1. Go to https://dashboard.render.com
2. Sign up with **GitHub**
3. Click **"New +"** → **"Web Service"**
4. Find `clonmed-mcp-server` repo
5. Click **"Create Web Service"**

**Render pulls ALL files including 150 HTML labs!**

---

## 🔄 UPDATE CODE LATER

When you change code locally:

```powershell
cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"

git add .
git commit -m "Your changes"
git push origin main
```

**Render auto-deploys in 2-3 minutes!**

---

## ⚠️ IF PUSH FAILS (Large files)

If you have files >100MB:

```powershell
# Check what's big
find . -type f -size +100M

# If needed, remove from git tracking
git rm --cached "BigFile.html"
git commit -m "Remove large files"
git push origin main
```

---

## ✅ QUICK COMMANDS CHEAT SHEET

| Command | What it does |
|---------|-------------|
| `git init` | Start git repo |
| `git add .` | Stage ALL files |
| `git commit -m "msg"` | Save changes |
| `git push origin main` | Upload to GitHub |
| `git status` | See what changed |

---

## 🎯 YOUR LIVE URL AFTER RENDER

```
https://clonmed-mcp-server.onrender.com/mcp
```

**Use in Prompt Opinion:**
```
URL: https://clonmed-mcp-server.onrender.com/mcp
Type: Streamable HTTP
```

---

## 💡 IMPORTANT

- **Git commands = NO file limit** (web upload has 100 file limit)
- **Total repo limit** = ~1GB (your files are probably <50MB)
- **Render pulls everything** including all HTML files
- **Auto-deploy works** on every push

---

**Replace `YOUR_USERNAME` with your GitHub username in step 2!**
