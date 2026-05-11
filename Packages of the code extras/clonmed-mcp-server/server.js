import express from "express";
import cors from "cors";
import fs from "fs";
import { spawn } from "child_process";
import { promisify } from "util";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json());

// --- LAB METADATA FOR CONTEXTUAL RESPONSES ---
const LAB_CATEGORIES = {
  "physics": ["2d-vectors", "3d-nets", "3d-planes", "bicep-torque-calculator", "buoyancy", "concussion-momentum-lab", "gait-pendulum-lab", "poiseuilles-law-lab", "radiation-physics-lab", "refractive-optics-lab", "spirometry-boyles-law-lab", "stability-cog-lab", "surface-tension-alveoli-lab"],
  "biology": ["bohr-model", "cell-membrane-simulation", "dna-structure", "gene-drive-evolution", "pcr-thermal-cycling", "phagocytosis-lab", "protein-synthesis-factory", "punnett-square-sim"],
  "chemistry": ["antacid-neutralization", "blood-buffer-equilibrium", "chromatography-lab", "half-life-visualizer", "spectrophotometer-simulation"],
  "medical": ["antibiotic-resistance-lab", "antigen-antibody-fit-lab", "asthma-airflow-lab", "blood-agglutination-simulation", "burn-degree-estimator", "crispr-gene-splicer", "defibrillator-lab", "elisa-microplate-simulator", "endoscopy-fiber-optics-lab", "histamine-response-simulation", "iv-titration-engine", "laparoscopic-precision-lab", "lock-key-visualizer", "mri-proton-alignment-lab", "neural-resection-simulator", "organ-compatibility-lab", "pulse-oximetry-lab", "suture-tension-lab", "telemedicine-latency-lab"],
  "neuroscience": ["eeg-wave-superposition-lab", "dopamine-reward-lab", "neuroplasticity-lab", "myelin-insulation-lab", "na-k-action-potential", "synaptic-delay-lab", "reflex-arc-timer-lab"],
  "pharmacology": ["antivenom-simulator", "carbon-monoxide-binding-simulation", "cyanide-blockade-simulation", "cytochrome-p450-lab", "heavy-metal-chelation", "lead-poisoning-lab", "sustained-release-tablet"],
  "surgical": ["3d-bioprinting-lab", "3d-surgery-simulator", "blood-cancer-surgery", "clinical-protocol-bariatric-resection-gastric-sleeve", "cryosurgery-lab", "neural-resection-simulator", "radioactive-seed-implant-lab"],
  "diagnostics": ["audiology-lab", "breathalyzer-simulation", "color-blindness-lab", "eeg-wave-superposition-lab", "kidney-filtration", "lymph-node-filtration-lab", "melanin-photoprotection-lab", "pulse-oximetry-lab"]
};

function getLabCategory(labName) {
  const normalized = labName.toLowerCase().replace(/\.html$/, "").replace(/[_-]/g, "-");
  for (const [category, labs] of Object.entries(LAB_CATEGORIES)) {
    if (labs.some(l => normalized.includes(l) || l.includes(normalized))) return category;
  }
  return "simulation";
}

function getCategoryIcon(category) {
  const icons = {
    physics: "⚛️",
    biology: "🧬",
    chemistry: "⚗️",
    medical: "🏥",
    neuroscience: "🧠",
    pharmacology: "💊",
    surgical: "🔬",
    diagnostics: "📊",
    simulation: "🔬"
  };
  return icons[category] || "🔬";
}

// --- SERVER CONFIGURATION ---
const CONFIG = {
  name: "clonmed-engine",
  version: "2.0.0",
  timeout: 30000 // 30 second timeout for operations
};

const server = new Server(
  { name: CONFIG.name, version: CONFIG.version },
  { 
    capabilities: { 
      tools: {},
      fhir: {}, 
      experimental: { fhir: true }
    } 
  }
);

// --- UTILITY FUNCTIONS ---
function formatTimestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function sanitizeLabName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "").trim();
}

function validateLabExists(labName, availableLabs) {
  const sanitized = sanitizeLabName(labName);
  return availableLabs.includes(`${sanitized}.html`) || availableLabs.includes(sanitized);
}

function getAvailableLabs() {
  try {
    return fs.readdirSync(process.cwd())
      .filter(f => f.endsWith(".html"))
      .map(f => f.replace(".html", ""));
  } catch (e) {
    console.error(`[${formatTimestamp()}] ERROR: Failed to scan labs:`, e.message);
    return [];
  }
}

// --- EXEC WITH TIMEOUT ---
function execWithTimeout(command, args, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    let proc;
    
    if (isWindows) {
      proc = spawn("cmd", ["/c", "start", "", command], { 
        detached: true,
        windowsHide: false
      });
    } else {
      proc = spawn("xdg-open", [command], { detached: true });
    }

    const timeoutId = setTimeout(() => {
      try {
        process.kill(-proc.pid, "SIGTERM");
      } catch (e) {}
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);

    proc.on("error", (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    proc.on("exit", (code) => {
      clearTimeout(timeoutId);
      if (code === 0 || code === null) {
        resolve({ success: true, code });
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    // Unref to prevent hanging the process
    proc.unref();
  });
}

// --- TOOL HANDLERS ---
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const labs = getAvailableLabs();
  
  console.log(`[${formatTimestamp()}] INFO: Discovered ${labs.length} simulation labs`);
  
  return {
    tools: [{
      name: "launch_lab",
      description: "Launch an interactive medical or scientific simulation laboratory. Provides hands-on virtual experiments for education, diagnostics, and surgical training.",
      inputSchema: {
        type: "object",
        properties: {
          patientId: { 
            type: "string", 
            description: "FHIR Patient ID for clinical context (optional, default: 'SIM-PATIENT-001')"
          },
          lab_name: { 
            type: "string", 
            enum: labs.length ? labs : ["default"],
            description: "Name of the simulation lab to launch (must be an available HTML lab file)"
          },
          context: {
            type: "string",
            description: "Optional clinical or educational context for the simulation session"
          }
        },
        required: ["lab_name"]
      }
    }]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  
  if (request.params.name !== "launch_lab") {
    return {
      content: [{
        type: "text",
        text: `## ⚠️ Tool Not Found\n\nThe requested tool \"${request.params.name}\" is not available.\n\n**Available tools:**\n- \`launch_lab\` - Launch medical/scientific simulations`
      }],
      isError: true
    };
  }

  try {
    const { lab_name, patientId = "SIM-PATIENT-001", context = "" } = request.params.arguments || {};
    
    // Input validation
    if (!lab_name || typeof lab_name !== "string") {
      return {
        content: [{
          type: "text",
          text: `## ❌ Invalid Input\n\n**Error:** Lab name is required and must be a string.\n\n**Usage:**\n\`\`\`json\n{\n  "lab_name": "bohr-model",\n  "patientId": "PAT-001"\n}\n\`\`\``
        }],
        isError: true
      };
    }

    const availableLabs = getAvailableLabs();
    const sanitizedName = sanitizeLabName(lab_name);
    
    if (!validateLabExists(sanitizedName, availableLabs)) {
      const suggestions = availableLabs
        .filter(l => l.toLowerCase().includes(sanitizedName.toLowerCase().slice(0, 3)))
        .slice(0, 3);
      
      return {
        content: [{
          type: "text",
          text: `## ❌ Lab Not Found\n\n**\"${sanitizedName}\"** is not available in the simulation library.\n\n**Available categories:**\n${Object.entries(LAB_CATEGORIES).map(([cat, labs]) => `- **${getCategoryIcon(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}**: ${labs.slice(0, 3).join(", ")}...`).join("\n")}\n\n${suggestions.length > 0 ? `**Did you mean:** ${suggestions.join(", ")}?` : ""}`
        }],
        isError: true
      };
    }

    const category = getLabCategory(sanitizedName);
    const icon = getCategoryIcon(category);
    
    console.log(`[${formatTimestamp()}] INFO: Launching ${category} lab "${sanitizedName}" for patient ${patientId}`);

    // Launch with timeout
    await execWithTimeout(`${sanitizedName}.html`, [], 5000);

    const duration = Date.now() - startTime;
    
    // Professional markdown response
    const responseText = `## ${icon} Simulation Launched Successfully

| **Parameter** | **Value** |
|--------------|-----------|
| **Lab** | \`${sanitizedName}\` |
| **Category** | ${category.charAt(0).toUpperCase() + category.slice(1)} |
| **Patient ID** | \`${patientId}\` |
| **Launch Time** | ${duration}ms |
| **Timestamp** | ${formatTimestamp()} |
${context ? `| **Context** | ${context} |` : ""}

---

### 🎯 What This Simulation Covers

This ${category} simulation provides interactive visualization and experimentation capabilities.

### 📋 Next Steps

1. The simulation has opened in your default browser
2. Use the interactive controls to explore the scenario
3. Document observations in the patient record if applicable
4. Close the tab when finished to end the session

---

*ClonMedic Engine v${CONFIG.version} | Session Active*`;

    console.log(`[${formatTimestamp()}] SUCCESS: Lab "${sanitizedName}" launched in ${duration}ms`);
    
    return { content: [{ type: "text", text: responseText }] };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${formatTimestamp()}] ERROR: Launch failed after ${duration}ms -`, error.message);
    
    return {
      content: [{
        type: "text",
        text: `## ❌ Launch Failed\n\n**Error:** ${error.message}\n\n**Troubleshooting:**\n- Ensure the HTML file exists and is accessible\n- Check browser permissions for opening local files\n- Verify the lab name is spelled correctly\n\n*If the issue persists, verify the lab file is not corrupted.*`
      }],
      isError: true
    };
  }
});

// --- SESSION MANAGEMENT ---
const transports = new Map();

app.get("/sse", async (req, res) => {
  console.log(`[${formatTimestamp()}] CONNECT: New SSE connection attempt`);

  const transport = new SSEServerTransport("/message", res);
  
  try {
    await server.connect(transport);
    transports.set(transport.sessionId, transport);
    
    console.log(`[${formatTimestamp()}] SUCCESS: Session [${transport.sessionId}] established`);

    res.on("close", () => {
      console.log(`[${formatTimestamp()}] DISCONNECT: Session [${transport.sessionId}] closed`);
      transports.delete(transport.sessionId);
    });

  } catch (err) {
    console.error(`[${formatTimestamp()}] ERROR: SSE connection failed -`, err.message);
    res.status(500).end();
  }
});

app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);

  if (!transport) {
    console.warn(`[${formatTimestamp()}] WARN: Unknown session [${sessionId}]`);
    return res.status(404).json({ error: "Session not found. Please reconnect." });
  }

  await transport.handlePostMessage(req, res);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "operational",
    version: CONFIG.version,
    labs: getAvailableLabs().length,
    uptime: process.uptime()
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log(`\n[${formatTimestamp()}] SHUTDOWN: ClonMedic Engine stopping...`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(`\n[${formatTimestamp()}] SHUTDOWN: ClonMedic Engine stopping...`);
  process.exit(0);
});

app.listen(3000, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║          CLONMEDIC ENGINE v${CONFIG.version}                ║
║     Medical & Scientific Simulation Platform          ║
╠════════════════════════════════════════════════════════╣
║  Port: 3000                                           ║
║  SSE:  http://localhost:3000/sse                      ║
║  Health: http://localhost:3000/health                  ║
╚════════════════════════════════════════════════════════╝
[${formatTimestamp()}] READY: ${getAvailableLabs().length} simulations available
`);
});