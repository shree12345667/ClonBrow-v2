# CLONMED MCP Server - Response Formats & Tools

## Server Info
- **Name:** CLONMED Clinical Intelligence System
- **Version:** 3.1.0
- **Port:** 3001 (default)
- **Portal:** https://super-crisp-af6236.netlify.app/

---

## Available Tools (4 Total)

### 1. `analyze_and_recommend` - PRIMARY TOOL
**Purpose:** Analyzes clinical query and recommends best simulation lab

#### Input Parameters:
```json
{
  "query": "blood cancer surgery",        // REQUIRED: Clinical query/condition
  "auto_open": true,                      // OPTIONAL: Force open browser
  "output_mode": "json",                  // OPTIONAL: "text" (default) or "json"
  "include_related": true                   // OPTIONAL: Include similar labs
}
```

#### JSON Response Format (`output_mode: "json"`):
```json
{
  "request_id": "req_1746250123456_abc12",
  "timestamp": "2026-05-03T09:15:23.456Z",
  "query": {
    "original": "blood cancer surgery",
    "normalized": "blood cancer surgery",
    "detected_type": "clinical",
    "confidence": "high"
  },
  "recommendation": {
    "primary": {
      "id": "blood_cancer_surgery",
      "title": "Blood Cancer Surgery",
      "file": "Blood Cancer Surgery.html",
      "category": "cancer",
      "keywords": ["blood", "cancer", "surgery", "leukemia", "tumor", "oncology"],
      "urls": {
        "local": "http://localhost:3001/labs/Blood%20Cancer%20Surgery.html",
        "file": "file:///C:/Users/.../labs/Blood%20Cancer%20Surgery.html",
        "cloudflare": null
      },
      "match_score": 95,
      "relevance": "primary"
    },
    "related": [
      {
        "rank": 1,
        "title": "Defibrillator Surgery",
        "file": "Defibrillator Surgery.html",
        "category": "cardiac",
        "url": "http://localhost:3001/labs/Defibrillator%20Surgery.html",
        "match_score": 42,
        "relevance": "related"
      }
    ],
    "total_available": 50
  },
  "actions": {
    "browser_opened": true,
    "tabs_opened": [
      { "type": "lab", "title": "Blood Cancer Surgery", "url": "http://localhost:3001/labs/..." },
      { "type": "portal", "title": "CLONMED Portal", "url": "https://super-crisp-af6236.netlify.app/" }
    ],
    "portal_url": "https://super-crisp-af6236.netlify.app/",
    "timestamp_opened": "2026-05-03T09:15:24.123Z"
  },
  "metadata": {
    "server_version": "3.1.0",
    "processing_time_ms": 45,
    "auto_open_triggered": true,
    "environment": {
      "auto_open_env": false,
      "platform": "win32",
      "node_version": "v20.12.0"
    }
  },
  "educational_disclaimer": "This recommendation is for educational purposes only..."
}
```

#### TEXT Response Format (`output_mode: "text"` - Default):
```
╔════════════════════════════════════════════════════════════════════╗
║           🏥 CLONMED CLINICAL INTELLIGENCE SYSTEM v3.1.0              ║
╚════════════════════════════════════════════════════════════════════╝

📋 REQUEST: req_1746250123456_abc12
🕐 TIMESTAMP: 2026-05-03T09:15:23.456Z

┌────────────────────────────────────────────────────────────────────┐
│  QUERY ANALYSIS                                                    │
├────────────────────────────────────────────────────────────────────┤
│  📝 Input: "blood cancer surgery"                                    │
│  🎯 Type: CLINICAL                                                  │
│  📊 Confidence: HIGH                                                │
└────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════╗
║                     🏆 PRIMARY RECOMMENDATION                      ║
╚════════════════════════════════════════════════════════════════════╝
  📌 ID: blood_cancer_surgery
  🏥 Title: Blood Cancer Surgery
  📁 File: Blood Cancer Surgery.html
  🏷️ Category: cancer
  🎯 Match Score: 95%

  🔗 ACCESS LINKS:
     • Local: http://localhost:3001/labs/Blood%20Cancer%20Surgery.html
     • File: file:///C:/Users/.../labs/Blood%20Cancer%20Surgery.html

  🔑 KEYWORDS:
     blood, cancer, surgery, leukemia, tumor, oncology

┌────────────────────────────────────────────────────────────────────┐
│  📚 RELATED SIMULATIONS (Ranked by Relevance)                     │
├────────────────────────────────────────────────────────────────────┤
│  1. Defibrillator Surgery                                          │
│     Category: cardiac | Match: 42%                                │
│     http://localhost:3001/labs/Defibrillator%20Surgery.html       │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  🚀 ACTIONS TAKEN                                                  │
├────────────────────────────────────────────────────────────────────┤
│  ✅ Chrome Tabs Auto-Opened:                                     │
     📄 Blood Cancer Surgery
     🌐 CLONMED Portal
│  🌐 Portal: https://super-crisp-af6236.netlify.app/                │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  📊 SYSTEM METADATA                                                │
├────────────────────────────────────────────────────────────────────┤
│  🕐 Processing Time: 45ms                                          │
│  📦 Server Version: 3.1.0                                          │
│  🗄️  Total Labs Available: 50                                       │
│  🖥️  Platform: win32                                                │
└────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════╗
║  ⚠️  EDUCATIONAL DISCLAIMER                                        ║
║                                                                    ║
║  This recommendation is for educational purposes only. Always     ║
║  consult qualified healthcare professionals for clinical          ║
║  decisions and patient care.                                       ║
╚════════════════════════════════════════════════════════════════════╝
```

---

### 2. `find_lab` - Search Tool
**Purpose:** Search for labs by keyword

#### Input Parameters:
```json
{
  "keyword": "heart",
  "limit": 5
}
```

#### Response Format:
```
🔍 SEARCH RESULTS: "heart"
Found 3 matching simulations:

1. Defibrillator Surgery
   📁 Defibrillator Surgery.html | 🏷️ cardiac
   🔗 http://localhost:3001/labs/Defibrillator%20Surgery.html

2. Open Heart Surgery
   📁 Open Heart Surgery.html | 🏷️ cardiac
   🔗 http://localhost:3001/labs/Open%20Heart%20Surgery.html
```

---

### 3. `open_lab_workspace` - Browser Opener
**Purpose:** Opens lab + portal in Chrome automatically

#### Input Parameters:
```json
{
  "condition": "blood cancer"
}
```

#### Response Format:
```
✅ Opened Chrome tabs:
📄 Lab: Blood Cancer Surgery
🌐 Portal: https://super-crisp-af6236.netlify.app/
🔗 /labs/Blood%20Cancer%20Surgery.html
```

---

### 4. `get_server_info` - Server Status
**Purpose:** Returns complete server information

#### Input Parameters:
```json
{
  "output_mode": "json"  // or "text"
}
```

#### JSON Response:
```json
{
  "server": {
    "name": "CLONMED Clinical Intelligence System",
    "version": "3.1.0",
    "status": "operational",
    "uptime_seconds": 3600,
    "start_time": "2026-05-03T08:15:23.456Z"
  },
  "labs": {
    "total": 50,
    "categories": ["cancer", "cardiac", "surgery", "general"],
    "recent": [
      { "title": "Blood Cancer Surgery", "file": "Blood Cancer Surgery.html" }
    ]
  },
  "configuration": {
    "port": 3001,
    "auto_open": false,
    "portal_url": "https://super-crisp-af6236.netlify.app/",
    "root_directory": "C:/Users/.../health thing",
    "platform": "win32",
    "node_version": "v20.12.0"
  },
  "endpoints": {
    "mcp": "http://localhost:3001/mcp",
    "sse": "http://localhost:3001/sse",
    "health": "http://localhost:3001/health",
    "api_recommend": "http://localhost:3001/api/recommend?q=cardiac",
    "dashboard": "http://localhost:3001/"
  },
  "resources": {
    "memory_mb": 45,
    "cpu_usage": { "user": 123456, "system": 78901 },
    "pid": 12345
  },
  "timestamp": "2026-05-03T09:15:23.456Z"
}
```

---

## API Endpoints (REST)

### GET /health
```json
{
  "status": "operational",
  "version": "3.1.0",
  "name": "CLONMED Clinical Intelligence System",
  "labs": 50,
  "uptime": 3600,
  "memory": { "heapUsed": 45000000, ... },
  "timestamp": "2026-05-03T09:15:23.456Z"
}
```

### GET /api/recommend?q=heart
```json
{
  "query": "heart",
  "recommended": "Defibrillator Surgery",
  "file": "Defibrillator Surgery.html",
  "category": "cardiac",
  "url": "http://localhost:3001/labs/Defibrillator%20Surgery.html",
  "timestamp": "2026-05-03T09:15:23.456Z"
}
```

### GET /api/search?q=cancer&limit=3
```json
{
  "query": "cancer",
  "count": 5,
  "total": 50,
  "results": [
    { "title": "Blood Cancer Surgery", "file": "...", "category": "cancer", "url": "..." }
  ]
}
```

### POST /mcp (Prompt Opinion)
Streamable HTTP endpoint for MCP clients.

---

## Disease Keywords (Auto-trigger browser open)

These words automatically trigger browser tabs to open:
- `disease`, `condition`, `disorder`, `syndrome`, `infection`
- `cancer`, `tumor`, `pain`, `ache`, `symptom`
- `patient`, `diagnosis`, `diagnose`, `treatment`
- `fever`, `cough`, `breathing`, `heart`, `blood`
- `brain`, `surgery`, `fracture`, `wound`, `injury`
- `emergency`, `acute`, `chronic`, `inflammation`
- `virus`, `bacterial`, `trauma`, `seizure`, `stroke`

**Environment Variable:** `CLONMED_AUTO_OPEN=true` to always auto-open

---

## Tool Summary

| Tool | Purpose | Auto-Browser | Format Options |
|------|---------|--------------|----------------|
| `analyze_and_recommend` | Main analysis tool | ✅ Yes (disease keywords) | text, json |
| `find_lab` | Search labs | ❌ No | text only |
| `open_lab_workspace` | Open browser | ✅ Yes | text only |
| `get_server_info` | Server stats | ❌ No | text, json |

---

## Cloudflare Tunnel Setup

```powershell
# Your exact command
& "C:|Program Files (x86)|cloudflared|cloudflared.exe" tunnel --url http://localhost:3001

# Prompt Opinion URL format:
https://YOUR-URL.trycloudflare.com/mcp
```

See `cloudflare-promptopinion.md` for full guide.
