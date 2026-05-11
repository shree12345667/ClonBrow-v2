import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { z } from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 3001);
const rootDir = process.cwd();
const AUTO_OPEN = process.env.CLONMED_AUTO_OPEN === 'true';
let currentPort = DEFAULT_PORT;
let IS_CLOUD = process.env.RENDER === 'true' || process.env.RAILWAY === 'true' || DEFAULT_PORT !== 3001;
const port = currentPort; // For compatibility

// Pre-computed medical keyword mappings for fast matching
const MEDICAL_CATEGORIES = {
  cancer: ['blood cancer surgery', 'leukemia', 'tumor', 'oncology', 'metastasis', 'chemotherapy'],
  cardiac: ['defibrillator', 'heart', 'cardiac', 'ecg', 'blood pressure', 'circulation', 'clotting', 'embolization'],
  respiratory: ['asthma', 'spirometry', 'lung', 'alveoli', 'oxygen', 'breathing', 'airflow'],
  neurological: ['neural', 'brain', 'eeg', 'synaptic', 'myelin', 'reflex', 'neurosurgery', 'concussion'],
  surgical: ['surgery', 'suture', 'laparoscopic', 'endoscopy', 'resection', 'bypass', 'stent'],
  genetic: ['crispr', 'gene', 'dna', 'pcr', 'mutation', 'telomere', 'chromosome'],
  infectious: ['viral', 'antibiotic', 'vaccine', 'phagocytosis', 'antibody', 'antigen', 'immune'],
  metabolic: ['insulin', 'glucose', 'diabetes', 'thyroid', 'cortisol', 'metabolic', 'enzyme'],
  renal: ['kidney', 'renal', 'filtration', 'dialysis', 'urine', 'urinalysis', 'glomerular'],
  toxicology: ['poisoning', 'cyanide', 'venom', 'antivenom', 'carbon monoxide', 'lead', 'chelation'],
  imaging: ['mri', 'x-ray', 'ultrasound', 'radiation', 'radioactive', 'endoscopy', 'mammography'],
  pharmaceutical: ['drug', 'pharmacology', 'tablet', 'iv', 'titration', 'antacid', 'absorption'],
  orthopedic: ['bone', 'ligament', 'fracture', 'spine', 'joint', 'arthritis', 'density'],
  emergency: ['trauma', 'burn', 'defibrillator', 'tourniquet', 'cryopreservation', 'transfusion'],
  ophthalmology: ['eye', 'cataract', 'vision', 'retina', 'cornea', 'glaucoma', 'bionic'],
  dental: ['tooth', 'dental', 'oral', 'orthodontic', 'cavity'],
  dermal: ['skin', 'melanin', 'wound', 'graft', 'dermatology', 'photoprotection'],
  pediatric: ['child', 'pediatric', 'infant', 'newborn', 'growth', 'development'],
  geriatric: ['elderly', 'aging', 'telomere', 'dementia', 'alzheimer', 'fall'],
  psychiatric: ['depression', 'anxiety', 'dopamine', 'serotonin', 'mental', 'stress', 'bipolar'],
  gastro: ['stomach', 'gastric', 'intestine', 'liver', 'digestion', 'absorption', 'bile'],
  obstetric: ['pregnancy', 'maternal', 'fetal', 'delivery', 'labor', 'neonatal'],
  hematology: ['blood', 'hemoglobin', 'clotting', 'agglutination', 'anemia', 'transfusion'],
  immunology: ['immune', 'vaccine', 'antibody', 'allergy', 'histamine', 'lymph', 'inflammation'],
  endocrine: ['hormone', 'thyroid', 'adrenal', 'pituitary', 'insulin', 'cortisol', 'estrogen'],
  virology: ['virus', 'viral', 'hiv', 'hepatitis', 'influenza', 'covid', 'herpes'],
  bacteriology: ['bacteria', 'bacterial', 'antibiotic', 'culture', 'infection', 'sepsis'],
  pathology: ['biopsy', 'tissue', 'histology', 'cytology', 'pathology', 'diagnosis'],
  anesthesiology: ['anesthesia', 'sedation', 'pain', 'nerve', 'block', 'epidural', 'opioid'],
  rehabilitation: ['physical', 'therapy', 'rehab', 'exercise', 'mobility', 'gait', 'prosthetic'],
  nutrition: ['diet', 'nutrition', 'vitamin', 'mineral', 'metabolism', 'calorie', 'protein'],
  environmental: ['pm2.5', 'pollution', 'radiation', 'heatstroke', 'hypothermia', 'toxic'],
  forensic: ['forensic', 'autopsy', 'toxicology', 'identification', 'evidence'],
  sports: ['athlete', 'sports', 'injury', 'concussion', 'muscle', 'fatigue', 'performance'],
  veterinary: ['animal', 'veterinary', 'pet', 'zoonotic', 'rabies', 'parasite'],
  public_health: ['epidemic', 'pandemic', 'outbreak', 'quarantine', 'vaccination', 'screening'],
  research: ['clinical', 'trial', 'research', 'study', 'protocol', 'ethics', 'consent'],
  education: ['education', 'training', 'simulation', 'virtual', 'learning', 'anatomy'],
  biotechnology: ['biotech', 'nanobot', 'bioengineering', 'tissue', 'engineering', 'scaffold'],
  cybernetic: ['cybernetic', 'bionic', 'prosthetic', 'implant', 'neural', 'interface'],
  aerospace: ['aerospace', 'space', 'zero', 'gravity', 'altitude', 'pressure', 'hypoxia'],
  marine: ['marine', 'diving', 'decompression', 'drowning', 'saltwater', 'coral'],
  tropical: ['malaria', 'dengue', 'tropical', 'parasite', 'mosquito', 'yellow', 'fever'],
  occupational: ['workplace', 'occupational', 'ergonomic', 'repetitive', 'industrial'],
  disaster: ['disaster', 'emergency', 'triage', 'mass', 'casualty', 'earthquake', 'flood'],
  military: ['military', 'combat', 'blast', 'gunshot', 'tourniquet', 'battlefield'],
  dental_surgery: ['oral', 'surgery', 'extraction', 'implant', 'root', 'canal', 'periodontal'],
  cosmetic: ['cosmetic', 'plastic', 'aesthetic', 'reconstructive', 'rhinoplasty', 'botox'],
  alternative: ['acupuncture', 'homeopathy', 'naturopathy', 'herbal', 'traditional', 'chiropractic'],
  palliative: ['palliative', 'hospice', 'end', 'life', 'pain', 'comfort', 'terminal'],
  telemedicine: ['telemedicine', 'remote', 'virtual', 'consultation', 'digital', 'health'],
  nanomedicine: ['nanobot', 'nanoparticle', 'targeted', 'drug', 'delivery', 'nanotechnology'],
  stem_cell: ['stem', 'cell', 'regenerative', 'therapy', 'differentiation', 'pluripotent'],
  robotic: ['robotic', 'surgery', 'da', 'vinci', 'automation', 'surgical', 'robot'],
  '3d_printing': ['3d', 'printing', 'bioprinting', 'organ', 'scaffold', 'tissue', 'construct'],
  'ai_medical': ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'diagnosis', 'algorithm'],
  virtual_reality: ['virtual', 'reality', 'vr', 'augmented', 'ar', 'simulation', 'immersive'],
  blockchain: ['blockchain', 'medical', 'records', 'cryptocurrency', 'nft', 'healthcare'],
  iot_medical: ['iot', 'internet', 'things', 'wearable', 'sensor', 'monitoring', 'smart'],
  precision_medicine: ['precision', 'personalized', 'genomic', 'pharmacogenomics', 'tailored'],
  functional_medicine: ['functional', 'integrative', 'holistic', 'root', 'cause', 'systems'],
  regenerative: ['regenerative', 'platelet', 'rich', 'plasma', 'prp', 'growth', 'factor'],
  anti_aging: ['anti', 'aging', 'longevity', 'senolytics', 'nad', 'supplements'],
  biohacking: ['biohacking', 'nootropics', 'optimization', 'quantified', 'self', 'tracking'],
  cryonics: ['cryonics', 'cryopreservation', 'vitrification', 'suspended', 'animation'],
  mitochondrial: ['mitochondrial', 'atp', 'energy', 'metabolism', 'oxidative', 'stress'],
  epigenetics: ['epigenetics', 'methylation', 'histone', 'modification', 'gene', 'expression'],
  microbiome: ['microbiome', 'gut', 'bacteria', 'probiotic', 'prebiotic', 'dysbiosis'],
  circadian: ['circadian', 'sleep', 'rhythm', 'melatonin', 'chronobiology', 'shift'],
  nutrigenomics: ['nutrigenomics', 'gene', 'diet', 'interaction', 'personalized', 'nutrition'],
  pharmacogenomics: ['pharmacogenomics', 'drug', 'response', 'genetic', 'testing', 'medication'],
  exposome: ['exposome', 'environmental', 'exposure', 'toxin', 'pollutant', 'cumulative'],
  connectome: ['connectome', 'brain', 'network', 'mapping', 'neural', 'circuit'],
  proteomics: ['proteomics', 'protein', 'expression', 'profiling', 'mass', 'spectrometry'],
  metabolomics: ['metabolomics', 'metabolite', 'profiling', 'biomarker', 'metabolic'],
  lipidomics: ['lipidomics', 'lipid', 'profiling', 'fatty', 'acid', 'cholesterol'],
  glycomics: ['glycomics', 'carbohydrate', 'sugar', 'glycoprotein', 'glycan'],
  transcriptomics: ['transcriptomics', 'rna', 'sequencing', 'gene', 'expression', 'transcript'],
  genomics: ['genomics', 'genome', 'sequencing', 'whole', 'exome', 'variation'],
  phenomics: ['phenomics', 'phenotype', 'trait', 'measurement', 'characterization'],
};

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));
app.use('/labs', express.static(rootDir, { extensions: ['html'] }));

// Static route for generated reports
app.use('/reports', express.static(path.join(rootDir, 'reports')));

// Debug endpoint to test tab opening
app.get('/test-open', async (req, res) => {
  const testFile = req.query.file || 'Digital hospital.html';
  console.log(`[TEST] Opening tabs for: ${testFile}`);
  const result = await openLabWithPortal(testFile);
  res.json({
    success: result,
    file: testFile,
    path: path.join(rootDir, testFile),
    exists: fs.existsSync(path.join(rootDir, testFile)),
    rootDir: rootDir,
    timestamp: new Date().toISOString()
  });
});

const transports = new Map();
let labCatalog = [];
let keywordIndex = new Map();

const FALLBACK_LAB = {
  file: 'Digital hospital.html',
  title: 'Digital Hospital',
  keywords: ['digital', 'hospital', 'medical', 'health', 'general'],
  category: 'general',
  url: '/labs/Digital%20hospital.html'
};

// Build optimized index for fast lookup
function buildKeywordIndex() {
  const index = new Map();
  for (const lab of labCatalog) {
    for (const kw of lab.keywords) {
      if (!index.has(kw)) index.set(kw, []);
      index.get(kw).push(lab);
    }
    // Add category keywords
    if (lab.category) {
      const catKws = MEDICAL_CATEGORIES[lab.category] || [];
      for (const kw of catKws) {
        if (!index.has(kw)) index.set(kw, []);
        if (!index.get(kw).includes(lab)) index.get(kw).push(lab);
      }
    }
  }
  return index;
}

function inferCategory(fileName, title) {
  const text = (fileName + ' ' + title).toLowerCase();
  for (const [category, keywords] of Object.entries(MEDICAL_CATEGORIES)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return 'general';
}

function buildLabCatalog() {
  try {
    const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
    const excludePatterns = ['index.html', 'integration.html', 'educationist.html', 'mixofall.html'];
    
    return htmlFiles
      .filter(f => !excludePatterns.includes(f.toLowerCase()))
      .map(file => {
        const title = file.replace('.html', '').replace(/[-_]/g, ' ');
        const baseKeywords = file.toLowerCase()
          .replace('.html', '')
          .split(/[-_\s]+/)
          .filter(w => w.length > 2);
        const category = inferCategory(file, title);
        const catKeywords = MEDICAL_CATEGORIES[category] || [];
        
        return {
          file,
          title,
          keywords: [...new Set([...baseKeywords, ...catKeywords])],
          category,
          url: `/labs/${encodeURIComponent(file)}`
        };
      });
  } catch (err) {
    console.error('[ERROR] Failed to build catalog:', err.message);
    return [FALLBACK_LAB];
  }
}

// Fast relevance scoring
function recommendLab(query) {
  if (!labCatalog.length) return FALLBACK_LAB;
  if (!query || !query.trim()) return FALLBACK_LAB;
  
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(w => w.length > 2);
  
  let best = FALLBACK_LAB;
  let bestScore = 0;

  for (const lab of labCatalog) {
    let score = 0;
    const labText = (lab.title + ' ' + lab.keywords.join(' ')).toLowerCase();
    
    // Exact title match
    if (lab.title.toLowerCase().includes(q)) score += 50;
    
    // Keyword matches
    for (const qw of qWords) {
      if (lab.keywords.some(k => k.includes(qw) || qw.includes(k))) score += 10;
    }
    
    // Category match
    if (lab.category && MEDICAL_CATEGORIES[lab.category]?.some(k => q.includes(k.toLowerCase()))) {
      score += 15;
    }
    
    if (score > bestScore) {
      bestScore = score;
      best = lab;
    }
  }

  return best;
}

// Get top N matching labs
function getTopLabs(query, n = 3) {
  if (!labCatalog.length) return [FALLBACK_LAB];
  if (!query || !query.trim()) return [FALLBACK_LAB];
  
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(w => w.length > 2);
  
  // Score all labs
  const scored = labCatalog.map(lab => {
    let score = 0;
    
    // Title match (highest weight)
    if (lab.title.toLowerCase().includes(q)) score += 100;
    
    // Individual word matches
    for (const word of qWords) {
      if (lab.title.toLowerCase().includes(word)) score += 30;
      if (lab.keywords.some(k => k.includes(word))) score += 20;
      if (lab.category.toLowerCase().includes(word)) score += 15;
    }
    
    // Keyword matches
    for (const kw of lab.keywords) {
      if (q.includes(kw)) score += 25;
    }
    
    return { lab, score };
  });
  
  // Sort by score and return top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map(s => s.lab);
}

// Calculate match score for a lab against query
function calculateMatchScore(query, lab) {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  let score = 0;
  const queryTerms = [queryLower, ...words];
  
  for (const term of queryTerms) {
    // Title match (high weight)
    if (lab.title.toLowerCase().includes(term)) score += 10;
    
    // Keyword match
    if (lab.keywords.some(k => k.includes(term))) score += 5;
    
    // Category match
    if (lab.category.toLowerCase().includes(term)) score += 8;
  }
  
  // Normalize to percentage
  const maxPossible = queryTerms.length * 15;
  return Math.min(100, Math.round((score / maxPossible) * 100));
}

// Find related labs by category
function findRelatedLabs(primaryLab, limit = 3) {
  const related = labCatalog.filter(lab => 
    lab.file !== primaryLab.file && 
    (lab.category === primaryLab.category || 
     lab.keywords.some(k => primaryLab.keywords.includes(k)))
  );
  
  // Score related labs
  const scored = related.map(lab => ({
    lab,
    score: lab.category === primaryLab.category ? 10 : 5
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.lab);
}

// Portal URL
const PORTAL_URL = 'https://super-crisp-af6236.netlify.app/';

// Auto-open Chrome with multiple tabs - FIXED VERSION
async function openChromeTabs(urls) {
  try {
    const isWin = process.platform === 'win32';
    
    // Windows - try Chrome first
    if (isWin) {
      const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
      ].filter(Boolean);

      const chrome = chromePaths.find(p => fs.existsSync(p));
      
      if (chrome) {
        console.log(`[INFO] Opening ${urls.length} tabs in Chrome...`);
        console.log(`[DEBUG] Chrome path: ${chrome}`);
        console.log(`[DEBUG] URLs to open:`, urls);
        
        // Open FIRST URL with new window
        console.log(`[INFO] Opening Chrome window with first tab...`);
        const firstProc = spawn(chrome, ['--new-window', urls[0]], {
          detached: true,
          stdio: 'ignore',
          windowsHide: false
        });
        
        firstProc.on('error', (err) => {
          console.error('[ERROR] Chrome error on first tab:', err.message);
        });
        firstProc.unref();
        
        // Wait for Chrome to fully start
        console.log(`[INFO] Waiting for Chrome to start...`);
        await new Promise(r => setTimeout(r, 2000));
        
        // Open remaining URLs as new tabs
        for (let i = 1; i < urls.length; i++) {
          console.log(`[INFO] Opening tab ${i + 1}/${urls.length}...`);
          const proc = spawn(chrome, [urls[i]], {
            detached: true,
            stdio: 'ignore',
            windowsHide: false
          });
          proc.on('error', (err) => {
            console.error(`[ERROR] Tab ${i + 1} error:`, err.message);
          });
          proc.unref();
          
          // Small delay between tabs
          await new Promise(r => setTimeout(r, 500));
        }
        
        console.log(`[SUCCESS] Opened ${urls.length} tabs in Chrome`);
        return true;
      }
      
      // Fallback: Use start command for each URL
      console.log('[INFO] Chrome not found, using default browser...');
      for (let i = 0; i < urls.length; i++) {
        console.log(`[INFO] Opening tab ${i + 1}/${urls.length} in default browser`);
        spawn('cmd', ['/c', 'start', '', urls[i]], { detached: true, stdio: 'ignore' }).unref();
        await new Promise(r => setTimeout(r, 800));
      }
      return true;
    }
    
    // macOS/Linux
    for (let i = 0; i < urls.length; i++) {
      spawn('open', [urls[i]], { detached: true, stdio: 'ignore' }).unref();
      await new Promise(r => setTimeout(r, 500));
    }
    return true;
    
  } catch (err) {
    console.error('[ERROR] Tab opening failed:', err.message);
    console.error('[ERROR] Stack:', err.stack);
    return false;
  }
}

// Open lab file + portal - WITH DEBUG LOGGING
async function openLabWithPortal(filename) {
  try {
    const labPath = path.join(rootDir, filename);
    const urls = [];
    
    console.log(`[DEBUG] openLabWithPortal called for: ${filename}`);
    console.log(`[DEBUG] Full path: ${labPath}`);
    console.log(`[DEBUG] File exists: ${fs.existsSync(labPath)}`);
    console.log(`[DEBUG] rootDir: ${rootDir}`);
    
    // Add lab file if it exists
    if (fs.existsSync(labPath)) {
      const fileUrl = `file://${labPath.replace(/\\/g, '/')}`;
      urls.push(fileUrl);
      console.log(`[DEBUG] Added lab URL: ${fileUrl}`);
    } else {
      console.log(`[WARN] Lab file not found: ${labPath}`);
    }
    
    // Always add portal
    urls.push(PORTAL_URL);
    console.log(`[DEBUG] Added portal URL: ${PORTAL_URL}`);
    
    const result = await openChromeTabs(urls);
    console.log(`[DEBUG] openChromeTabs result: ${result}`);
    return result;
  } catch (err) {
    console.error('[ERROR] Failed to open lab:', err.message);
    console.error('[ERROR] Stack:', err.stack);
    return false;
  }
}

// Generate professional HTML report for download/print
function generateReportHtml(query, lab, matchScore, isDiseaseQuery, requestId) {
  const timestamp = new Date().toISOString();
  const formattedDate = new Date().toLocaleString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLONMED Clinical Report - ${lab.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      background: #f5f5f5;
      padding: 20px;
    }
    .container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white; 
      padding: 40px; 
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #2563eb; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
    }
    .header h1 { 
      color: #2563eb; 
      font-size: 28px; 
      margin-bottom: 10px;
    }
    .header p { 
      color: #666; 
      font-size: 14px;
    }
    .section { 
      margin: 25px 0; 
      padding: 20px; 
      background: #fafafa; 
      border-left: 4px solid #2563eb;
    }
    .section h2 { 
      color: #1e40af; 
      font-size: 18px; 
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px; 
    }
    .field { 
      margin: 8px 0; 
    }
    .label { 
      font-weight: bold; 
      color: #555; 
      font-size: 12px; 
      text-transform: uppercase;
    }
    .value { 
      font-size: 15px; 
      color: #000;
    }
    .badge { 
      display: inline-block; 
      padding: 4px 12px; 
      border-radius: 12px; 
      font-size: 12px; 
      font-weight: bold;
    }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-green { background: #d1fae5; color: #059669; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
    .score { 
      font-size: 32px; 
      font-weight: bold; 
      color: #2563eb; 
      text-align: center;
      padding: 15px;
      background: #eff6ff;
      border-radius: 8px;
    }
    .links { 
      margin-top: 15px; 
    }
    .link-item { 
      margin: 10px 0; 
      padding: 10px; 
      background: white; 
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .link-item a { 
      color: #2563eb; 
      text-decoration: none; 
      word-break: break-all;
    }
    .disclaimer { 
      background: #fef3c7; 
      border-left-color: #f59e0b;
      font-size: 13px;
      color: #92400e;
    }
    .disclaimer strong { 
      color: #b45309; 
    }
    .print-btn { 
      position: fixed; 
      top: 20px; 
      right: 20px; 
      padding: 12px 24px; 
      background: #2563eb; 
      color: white; 
      border: none; 
      border-radius: 6px; 
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .print-btn:hover { background: #1d4ed8; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  
  <div class="container">
    <div class="header">
      <h1>🏥 CLONMED Clinical Intelligence System</h1>
      <p>Clinical Analysis Report & Simulation Recommendation</p>
      <p style="margin-top: 10px; font-size: 12px; color: #999;">Report ID: ${requestId} | Generated: ${formattedDate}</p>
    </div>

    <div class="section">
      <h2>📋 Clinical Query Analysis</h2>
      <div class="grid">
        <div class="field">
          <div class="label">Input Query</div>
          <div class="value">${query}</div>
        </div>
        <div class="field">
          <div class="label">Query Type</div>
          <div class="value">
            <span class="badge ${isDiseaseQuery ? 'badge-red' : 'badge-green'}">
              ${isDiseaseQuery ? '🔴 CLINICAL / MEDICAL' : '🟢 GENERAL INQUIRY'}
            </span>
          </div>
        </div>
        <div class="field">
          <div class="label">Confidence Level</div>
          <div class="value">
            <span class="badge ${matchScore > 80 ? 'badge-green' : matchScore > 50 ? 'badge-blue' : 'badge-red'}">
              ${matchScore > 80 ? 'HIGH CONFIDENCE' : matchScore > 50 ? 'MODERATE CONFIDENCE' : 'LOW CONFIDENCE'}
            </span>
          </div>
        </div>
        <div class="field">
          <div class="label">Detection Method</div>
          <div class="value">Keyword Pattern Matching</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🏆 Primary Recommendation</h2>
      <div class="score">${matchScore}% Match</div>
      <div class="grid" style="margin-top: 20px;">
        <div class="field">
          <div class="label">Simulation Lab</div>
          <div class="value" style="font-size: 18px; font-weight: bold;">${lab.title}</div>
        </div>
        <div class="field">
          <div class="label">Medical Category</div>
          <div class="value">${lab.category.toUpperCase()}</div>
        </div>
        <div class="field">
          <div class="label">File Reference</div>
          <div class="value">${lab.file}</div>
        </div>
        <div class="field">
          <div class="label">Total Labs Available</div>
          <div class="value">${labCatalog.length}</div>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px;">
        <div class="label">Clinical Relevance</div>
        <p style="margin-top: 8px;">
          This simulation provides interactive visualization and step-by-step educational content for 
          <strong>${lab.title}</strong>. The lab covers pathophysiology, diagnostic approaches, and therapeutic 
          interventions in a risk-free virtual environment suitable for medical education and clinical training.
        </p>
      </div>
    </div>

    <div class="section">
      <h2>🔗 Access Links</h2>
      <div class="links">
        <div class="link-item">
          <div class="label">Lab Simulation (Web)</div>
          <a href="http://localhost:${port}${lab.url}" target="_blank">http://localhost:${port}${lab.url}</a>
        </div>
        <div class="link-item">
          <div class="label">CLONMED Portal Dashboard</div>
          <a href="${PORTAL_URL}" target="_blank">${PORTAL_URL}</a>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🔑 Keywords & Tags</h2>
      <p style="font-size: 14px;">
        ${lab.keywords.slice(0, 12).map(kw => `<span class="badge badge-blue" style="margin: 2px;">${kw}</span>`).join(' ')}
      </p>
    </div>

    <div class="section disclaimer">
      <h2>⚠️ Important Disclaimer</h2>
      <p>
        <strong>This recommendation is generated for EDUCATIONAL and TRAINING PURPOSES ONLY.</strong>
      </p>
      <p style="margin-top: 10px;">
        It does not constitute medical advice, diagnosis, or treatment recommendations. 
        Always consult qualified healthcare professionals for medical diagnoses, treatment decisions, 
        patient care protocols, and clinical procedures.
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; color: #999; font-size: 12px;">
      <p>CLONMED Clinical Intelligence System v3.1.0 © 2026</p>
      <p>Timestamp: ${timestamp}</p>
    </div>
  </div>
</body>
</html>`;
}

// Generate MINIMAL PREMIUM HTML report
function generateReportHtmlMulti(query, labs, isDiseaseQuery, requestId, primaryScore) {
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric'
  });
  
  const primaryLab = labs[0];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLONMED Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: 'Inter', -apple-system, sans-serif; 
      background: #0f0f0f;
      color: #fff;
      line-height: 1.6;
      padding: 40px 20px;
    }
    
    .container { 
      max-width: 800px; 
      margin: 0 auto; 
    }
    
    .header {
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid #333;
    }
    
    .brand {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #888;
      margin-bottom: 8px;
    }
    
    .title {
      font-size: 32px;
      font-weight: 300;
      letter-spacing: -1px;
    }
    
    .meta {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      font-size: 13px;
      color: #666;
    }
    
    .section {
      margin: 40px 0;
    }
    
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .query-box {
      background: #1a1a1a;
      border: 1px solid #333;
      padding: 24px;
      border-radius: 8px;
    }
    
    .query-text {
      font-size: 18px;
      font-weight: 300;
      color: #fff;
    }
    
    .query-type {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 12px;
      background: ${isDiseaseQuery ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
      color: ${isDiseaseQuery ? '#ef4444' : '#22c55e'};
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 4px;
    }
    
    .lab-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .lab-item {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 24px;
      transition: border-color 0.2s;
    }
    
    .lab-item:hover {
      border-color: #444;
    }
    
    .lab-item.primary {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }
    
    .lab-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .lab-name {
      font-size: 18px;
      font-weight: 500;
    }
    
    .lab-rank {
      font-size: 12px;
      color: #666;
    }
    
    .lab-meta {
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: #888;
    }
    
    .lab-link {
      display: inline-block;
      margin-top: 16px;
      padding: 10px 20px;
      background: #fff;
      color: #000;
      text-decoration: none;
      font-size: 12px;
      font-weight: 500;
      border-radius: 6px;
      transition: opacity 0.2s;
    }
    
    .lab-link:hover {
      opacity: 0.9;
    }
    
    .disclaimer {
      margin-top: 48px;
      padding: 24px;
      background: rgba(234, 179, 8, 0.05);
      border: 1px solid rgba(234, 179, 8, 0.2);
      border-radius: 8px;
      font-size: 13px;
      color: #a16207;
    }
    
    .print-btn {
      position: fixed;
      bottom: 32px;
      right: 32px;
      padding: 14px 28px;
      background: #fff;
      color: #000;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .print-btn:hover {
      transform: translateY(-2px);
    }
    
    @media print {
      body { background: #fff; color: #000; }
      .lab-item { border: 1px solid #ddd; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Save as PDF</button>
  
  <div class="container">
    <div class="header">
      <div class="brand">CLONMED Clinical Intelligence</div>
      <div class="title">Analysis Report</div>
      <div class="meta">
        <span>${dateStr}</span>
        <span>·</span>
        <span>${labs.length} Labs Matched</span>
        <span>·</span>
        <span style="color: #666;">ID: ${requestId.slice(-8)}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Query</div>
      <div class="query-box">
        <div class="query-text">${query}</div>
        <div class="query-type">${isDiseaseQuery ? 'Clinical' : 'General'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Recommended Simulations</div>
      <div class="lab-list">
        ${labs.map((lab, i) => `
        <div class="lab-item ${i === 0 ? 'primary' : ''}">
          <div class="lab-header">
            <div class="lab-name">${lab.title}</div>
            <div class="lab-rank">${i === 0 ? 'Primary' : `Rank ${i + 1}`} · ${calculateMatchScore(query, lab)}%</div>
          </div>
          <div class="lab-meta">
            <span>${lab.category}</span>
            <span>·</span>
            <span>${lab.file}</span>
          </div>
          <a href="http://localhost:${port}${lab.url}" class="lab-link" target="_blank">Open Simulation</a>
        </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Portal</div>
      <a href="${PORTAL_URL}" class="lab-link" target="_blank" style="background: transparent; border: 1px solid #444; color: #fff;">Open CLONMED Portal</a>
    </div>

    <div class="disclaimer">
      <strong>Educational Use Only</strong> — This recommendation is for training purposes. 
      Consult healthcare professionals for clinical decisions.
    </div>
  </div>
</body>
</html>`;
}

// Enhanced professional response formatter
function formatEnhancedResponse(data, openedTabs) {
  const lines = [
    '╔════════════════════════════════════════════════════════════════════╗',
    '║           🏥 CLONMED CLINICAL INTELLIGENCE SYSTEM v3.1.0              ║',
    '╚════════════════════════════════════════════════════════════════════╝',
    '',
    `📋 REQUEST: ${data.request_id}`,
    `🕐 TIMESTAMP: ${data.timestamp}`,
    '',
    '┌────────────────────────────────────────────────────────────────────┐',
    `│  QUERY ANALYSIS                                                    │`,
    '├────────────────────────────────────────────────────────────────────┤',
    `│  📝 Input: "${data.query.original}"${' '.repeat(Math.max(0, 53 - data.query.original.length))}│`,
    `│  🎯 Type: ${data.query.detected_type.toUpperCase()}${' '.repeat(Math.max(0, 58 - data.query.detected_type.length))}│`,
    `│  📊 Confidence: ${data.query.confidence.toUpperCase()}${' '.repeat(Math.max(0, 50 - data.query.confidence.length))}│`,
    '└────────────────────────────────────────────────────────────────────┘',
    '',
    '╔════════════════════════════════════════════════════════════════════╗',
    '║                     🏆 PRIMARY RECOMMENDATION                      ║',
    '╚════════════════════════════════════════════════════════════════════╝',
    `  📌 ID: ${data.recommendation.primary.id}`,
    `  🏥 Title: ${data.recommendation.primary.title}`,
    `  📁 File: ${data.recommendation.primary.file}`,
    `  🏷️ Category: ${data.recommendation.primary.category}`,
    `  🎯 Match Score: ${data.recommendation.primary.match_score}%`,
    '',
    '  🔗 ACCESS LINKS:',
    `     • Local: ${data.recommendation.primary.urls.local}`,
    `     • File: ${data.recommendation.primary.urls.file}`,
    '',
    '  🔑 KEYWORDS:',
    `     ${data.recommendation.primary.keywords.slice(0, 8).join(', ')}`
  ];
  
  // Related labs section
  if (data.recommendation.related.length > 0) {
    lines.push('');
    lines.push('┌────────────────────────────────────────────────────────────────────┐');
    lines.push('│  📚 RELATED SIMULATIONS (Ranked by Relevance)                     │');
    lines.push('├────────────────────────────────────────────────────────────────────┤');
    
    data.recommendation.related.forEach((rel, i) => {
      lines.push(`│  ${i + 1}. ${rel.title}${' '.repeat(Math.max(0, 60 - rel.title.length))}│`);
      lines.push(`│     Category: ${rel.category} | Match: ${rel.match_score}%${' '.repeat(Math.max(0, 35 - rel.category.length))}│`);
      lines.push(`│     ${rel.url}${' '.repeat(Math.max(0, 64 - rel.url.length))}│`);
      if (i < data.recommendation.related.length - 1) {
        lines.push('├────────────────────────────────────────────────────────────────────┤');
      }
    });
    
    lines.push('└────────────────────────────────────────────────────────────────────┘');
  }
  
  // Actions section
  lines.push('');
  lines.push('┌────────────────────────────────────────────────────────────────────┐');
  lines.push('│  🚀 ACTIONS TAKEN                                                  │');
  lines.push('├────────────────────────────────────────────────────────────────────┤');
  
  if (data.actions.browser_opened) {
    lines.push('│  ✅ Chrome Tabs Auto-Opened:                                     │');
    openedTabs.forEach(tab => {
      const icon = tab.type === 'lab' ? '📄' : '🌐';
      const line = `     ${icon} ${tab.title}`;
      lines.push(`│${line}${' '.repeat(Math.max(0, 66 - line.length))}│`);
    });
    lines.push(`│  🌐 Portal: ${data.actions.portal_url}${' '.repeat(Math.max(0, 54 - data.actions.portal_url.length))}│`);
  } else {
    lines.push('│  ℹ️  Browser auto-open: Disabled                                   │');
    lines.push('│  💡 Tip: Set auto_open=true or use disease keywords to enable    │');
  }
  
  lines.push('└────────────────────────────────────────────────────────────────────┘');
  
  // Metadata section
  lines.push('');
  lines.push('┌────────────────────────────────────────────────────────────────────┐');
  lines.push('│  📊 SYSTEM METADATA                                                │');
  lines.push('├────────────────────────────────────────────────────────────────────┤');
  lines.push(`│  🕐 Processing Time: ${data.metadata.processing_time_ms}ms${' '.repeat(Math.max(0, 46 - String(data.metadata.processing_time_ms).length))}│`);
  lines.push(`│  📦 Server Version: ${data.metadata.server_version}${' '.repeat(Math.max(0, 46 - data.metadata.server_version.length))}│`);
  lines.push(`│  🗄️  Total Labs Available: ${data.recommendation.total_available}${' '.repeat(Math.max(0, 40 - String(data.recommendation.total_available).length))}│`);
  lines.push(`│  🖥️  Platform: ${data.metadata.environment.platform}${' '.repeat(Math.max(0, 51 - data.metadata.environment.platform.length))}│`);
  lines.push('└────────────────────────────────────────────────────────────────────┘');
  
  // Disclaimer
  lines.push('');
  lines.push('╔════════════════════════════════════════════════════════════════════╗');
  lines.push('║  ⚠️  EDUCATIONAL DISCLAIMER                                        ║');
  lines.push('║                                                                    ║');
  lines.push('║  This recommendation is for educational purposes only. Always     ║');
  lines.push('║  consult qualified healthcare professionals for clinical          ║');
  lines.push('║  decisions and patient care.                                       ║');
  lines.push('╚════════════════════════════════════════════════════════════════════╝');
  
  return lines.join('\n');
}

// Create MCP server with optimized tools
function createServer() {
  const server = new McpServer(
    { 
      name: 'ClonMed-Clinical',
      version: '3.1.0',
      description: 'CLONMED Clinical Intelligence System - Medical simulation lab recommendation engine with auto-browser integration'
    },
    { capabilities: {} }
  );

  // Primary diagnostic tool
  server.registerTool(
    'analyze_and_recommend',
    {
      title: 'Clinical Analysis & Lab Recommendation',
      description: 'Analyzes patient information and recommends the most relevant CLONMED simulation lab. Optimized for medical education and clinical training.',
      inputSchema: {
        query: z.string().min(1).describe('Clinical query, symptoms, condition, disease, or medical topic to analyze'),
        auto_open: z.boolean().optional().describe('Set true to automatically open related lab and portal in Chrome'),
        output_mode: z.enum(['text', 'json']).optional().describe('Output format: text (pretty styled) or json (raw data)'),
        include_related: z.boolean().optional().describe('Include related/similar labs in response')
      }
    },
    async ({ query, auto_open, output_mode = 'text', include_related = true }) => {
      const startTime = Date.now();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      
      // Fast disease detection
      const diseaseKeywords = ['disease', 'condition', 'cancer', 'tumor', 'pain', 'symptom', 'diagnosis', 'fever', 'heart', 'blood', 'surgery', 'injury'];
      const queryLower = query.toLowerCase();
      const isDiseaseQuery = diseaseKeywords.some(kw => queryLower.includes(kw));
      // Don't auto-open on cloud (Render/Railway) - can't open browser on user's PC from cloud
      const shouldAutoOpen = !IS_CLOUD && (auto_open || AUTO_OPEN || isDiseaseQuery);
      
      try {
        // Get TOP 3 recommendations
        const topLabs = getTopLabs(query, 3);
        const primaryLab = topLabs[0];
        const secondaryLabs = topLabs.slice(1);
        
        // Build DETAILED response
        const elapsed = Date.now() - startTime;
        const matchScore = calculateMatchScore(query, primaryLab);
        
        // Generate report filename
        const reportId = `report_${Date.now()}`;
        const reportFilename = `${reportId}.html`;
        const reportPath = path.join(rootDir, 'reports', reportFilename);
        
        // Ensure reports directory exists
        const reportsDir = path.join(rootDir, 'reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Generate comprehensive HTML report with ALL 3 labs
        // Local file URLs (for direct Chrome open)
        const urlsToOpenLocal = [`file://${reportPath.replace(/\\/g, '/')}`];
        topLabs.forEach(lab => {
          urlsToOpenLocal.push(`file://${path.join(rootDir, lab.file).replace(/\\/g, '/')}`);
        });
        urlsToOpenLocal.push(PORTAL_URL);
        
        // HTTP URLs (for remote browser opener)
        const urlsToOpenHttp = [reportUrlHttp, ...labUrlsHttp, PORTAL_URL];
        
        // Fire and forget browser opening with ALL tabs
        let openedTabs = [];
        let remoteTriggered = false;
        
        if (shouldAutoOpen) {
          if (IS_CLOUD) {
            // On cloud: Try to open via connected WebSocket clients
            console.log(`[REMOTE] Attempting to open tabs via connected browsers...`);
            console.log(`[REMOTE] URLs to send:`, urlsToOpenHttp);
            
            // Send tab open command
            const clientsNotified = broadcastOpenTabs(urlsToOpenHttp);
            remoteTriggered = clientsNotified > 0;
            console.log(`[REMOTE] Notified ${clientsNotified} connected client(s)`);
            
            // Also send full data to viewer for display
            broadcastToViewer({
              query: query,
              report_url: reportUrlHttp,
              labs: topLabs.map((lab, i) => ({
                rank: i + 1,
                title: lab.title,
                url: `http://${req.headers.host || 'localhost:' + currentPort}/labs/${encodeURIComponent(lab.file)}`,
                match_score: calculateMatchScore(query, lab),
                category: lab.category
              })),
              timestamp: new Date().toISOString()
            });
          } else {
            // Local: Open directly
            setTimeout(() => {
              openChromeTabs(urlsToOpenLocal).then(success => {
                if (success) console.log(`[INFO] Opened Report + 3 Labs + Portal for "${query}"`);
              }).catch(err => console.error('[ERROR] Browser open failed:', err.message));
            }, 0);
          }
          openedTabs = [
            { type: 'report', title: 'Clinical Report', url: reportUrl },
            ...topLabs.map((lab, i) => ({ type: 'lab', rank: i + 1, title: lab.title })),
            { type: 'portal', url: PORTAL_URL }
          ];
        }
        
        // Build NICE JSON response
        const jsonResponse = {
          answer: `${query.includes('cancer') || query.includes('blood') ? 'Blood cancer' : 'The condition'} analysis complete. Based on clinical relevance and educational value, the TOP 3 recommended simulation labs are:\n\n1. 🏥 ${primaryLab.title} (Primary - ${matchScore}% match)\n2. 🏥 ${secondaryLabs[0]?.title || 'N/A'} (Secondary)\n3. 🏥 ${secondaryLabs[1]?.title || 'N/A'} (Tertiary)\n\nThese simulations cover pathophysiology, diagnostics, and therapeutic interventions for comprehensive medical education.`,
          recommended_tool: 'analyze_and_recommend',
          report_html_url: reportUrl,
          top_3_labs: topLabs.map((lab, i) => ({
            rank: i + 1,
            title: lab.title,
            file: lab.file,
            category: lab.category,
            match_score: calculateMatchScore(query, lab),
            url: `http://localhost:${currentPort}${lab.url}`,
            relevance: i === 0 ? 'primary' : 'secondary'
          })),
          primary_recommendation: {
            title: primaryLab.title,
            file: primaryLab.file,
            category: primaryLab.category,
            match_score: matchScore,
            url: primaryLabUrl
          },
          secondary_recommendations: secondaryLabs.map(lab => ({
            title: lab.title,
            file: lab.file,
            category: lab.category,
            match_score: calculateMatchScore(query, lab),
            url: `http://localhost:${currentPort}${lab.url}`
          })),
          query_analysis: {
            original_query: query,
            query_type: isDiseaseQuery ? 'clinical' : 'general',
            confidence: matchScore > 80 ? 'high' : matchScore > 50 ? 'moderate' : 'low',
            detected_keywords: primaryLab.keywords.slice(0, 5)
          },
          actions: {
            browser_opened: shouldAutoOpen,
            tabs_opened_count: shouldAutoOpen ? topLabs.length + 2 : 0, // report + labs + portal
            report_generated: true,
            report_path: reportPath
          },
          safety_note: 'This recommendation is for educational/training purposes only. Always consult medical professionals for actual diagnosis and treatment.',
          urgency: isDiseaseQuery ? 'medium' : 'low',
          metadata: {
            request_id: requestId,
            processing_time_ms: elapsed,
            server_version: '3.1.0',
            total_labs_available: labCatalog.length,
            timestamp: new Date().toISOString()
          }
        };
        
        // Return based on output_mode
        if (output_mode === 'json') {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(jsonResponse, null, 2)
            }]
          };
        }
        
        // Detailed professional text response
        const clinicalContext = isDiseaseQuery 
          ? `Clinical analysis indicates potential ${queryLower.includes('cancer') ? 'oncological' : queryLower.includes('heart') ? 'cardiac' : 'medical'} condition requiring educational simulation.`
          : 'General educational query processed for simulation recommendation.';
        
        const matchDetails = topLabs.map((lab, i) => {
          const score = calculateMatchScore(query, lab);
          const relevance = i === 0 ? 'Primary recommendation' : i === 1 ? 'Secondary option' : 'Tertiary option';
          return `${i + 1}. ${lab.title}
   Relevance: ${relevance}
   Match Score: ${score}%
   Category: ${lab.category}
   File: ${lab.file}
   URL: http://localhost:${port}${lab.url}
   Purpose: Educational simulation for ${lab.category} training`;
        }).join('\n\n');
        
        // Instructions based on deployment mode
        const accessInstructions = IS_CLOUD 
          ? `🎯 AUTO-OPEN VIA REMOTE (NEW!):
   Step 1: Open this page in your browser (keep it open):
   https://${req.headers.host || 'localhost:' + port}/remote
   
   Step 2: When you send an MCP query, tabs will auto-open!
   ${remoteTriggered ? '✅ Successfully triggered remote tab opening!' : 'ℹ️  No browser currently connected. Open /remote page first.'}
   
   Fallback - Manual URLs:
   - Report: ${reportUrl}
   - Primary Lab: ${primaryLabUrl}
   - Portal: ${PORTAL_URL}`
          : `AUTO-OPEN STATUS:
   ${shouldAutoOpen ? `✅ Browser tabs auto-opened locally:
   - Clinical Report (HTML)
   ${topLabs.map((lab, i) => `- ${lab.title}`).join('\n   ')}
   - CLONMED Portal` : 'ℹ️  Auto-open disabled. Set auto_open=true to enable.'}
   
   Access URLs:
   - Report: ${reportUrl}
   - Primary Lab: ${primaryLabUrl}
   - Portal: ${PORTAL_URL}`;
        
        const prettyResponse = `═══════════════════════════════════════════════════════════════════
CLONMED CLINICAL INTELLIGENCE SYSTEM v3.1.0
═══════════════════════════════════════════════════════════════════

QUERY ANALYSIS
───────────────────────────────────────────────────────────────────
Patient Query: "${query}"
Query Type: ${isDiseaseQuery ? 'CLINICAL/MEDICAL' : 'GENERAL EDUCATIONAL'}
Clinical Context: ${clinicalContext}
Match Confidence: ${matchScore > 80 ? 'HIGH' : matchScore > 50 ? 'MODERATE' : 'LOW'} (${matchScore}% match)
Processing Time: ${elapsed}ms
Request ID: ${requestId}

TOP 3 RECOMMENDED SIMULATION LABS
───────────────────────────────────────────────────────────────────

${matchDetails}

REPORT GENERATED
───────────────────────────────────────────────────────────────────
Report URL: ${reportUrl}
Report Path: ${reportPath}
Total Labs Available: ${labCatalog.length}

${accessInstructions}

EDUCATIONAL DISCLAIMER
───────────────────────────────────────────────────────────────────
This recommendation is for educational and training purposes only.
Always consult qualified healthcare professionals for medical 
diagnosis, treatment decisions, and patient care protocols.

═══════════════════════════════════════════════════════════════════
Generated: ${new Date().toLocaleString()} | Server: ${IS_CLOUD ? 'Cloud (Render)' : 'Local'}
═══════════════════════════════════════════════════════════════════`;


        return {
          content: [{
            type: 'text',
            text: prettyResponse
          }]
        };
      } catch (err) {
        console.error(`[ERROR] ${requestId}:`, err.message);
        return {
          content: [{
            type: 'text',
            text: `❌ Error: ${err.message}\nTry: "cancer", "heart", "blood" or specific lab names`
          }],
          isError: true
        };
      }
    }
  );

  // Quick lab finder
  server.registerTool(
    'find_lab',
    {
      title: 'Find Simulation Lab',
      description: 'Quickly find a specific CLONMED lab by name or keyword',
      inputSchema: {
        keyword: z.string().min(1).describe('Lab name, condition, or keyword to search'),
        limit: z.number().optional().describe('Maximum results (default: 5)')
      }
    },
    async ({ keyword, limit = 5 }) => {
      try {
        const q = keyword.toLowerCase();
        const matches = labCatalog
          .filter(lab => 
            lab.title.toLowerCase().includes(q) ||
            lab.keywords.some(k => k.includes(q))
          )
          .slice(0, limit);
        
        if (!matches.length) {
          return {
            content: [{
              type: 'text',
              text: `🔍 No labs found for "${keyword}".\nAvailable categories: ${Object.keys(MEDICAL_CATEGORIES).slice(0, 10).join(', ')}...`
            }]
          };
        }
        
        const lines = [
          `🔍 SEARCH RESULTS: "${keyword}"`,
          `Found ${matches.length} matching simulation${matches.length !== 1 ? 's' : ''}:`,
          ''
        ];
        
        matches.forEach((lab, i) => {
          lines.push(`${i + 1}. ${lab.title}`);
          lines.push(`   📁 ${lab.file} | 🏷️ ${lab.category}`);
          lines.push(`   🔗 http://localhost:${port}${lab.url}`);
          lines.push('');
        });
        
        return {
          content: [{
            type: 'text',
            text: lines.join('\n')
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: '❌ Search failed. Please try again.'
          }],
          isError: true
        };
      }
    }
  );

  // Browser tab opener
  server.registerTool(
    'open_lab_workspace',
    {
      title: 'Open Lab Workspace',
      description: 'Opens the matched simulation lab in your default browser',
      inputSchema: {
        condition: z.string().min(1).describe('Medical condition or lab to open')
      }
    },
    async ({ condition }) => {
      try {
        const lab = recommendLab(condition);
        const success = openLabWithPortal(lab.file);
        
        return {
          content: [{
            type: 'text',
            text: success 
              ? `✅ Opened Chrome tabs:\n📄 Lab: ${lab.title}\n🌐 Portal: ${PORTAL_URL}\n🔗 ${lab.url}`
              : `⚠️ Could not open browser. Lab: ${lab.title}\nPlease open manually: ${lab.url}`
          }]
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: '❌ Failed to open lab workspace'
          }],
          isError: true
        };
      }
    }
  );

  // Server info tool
  server.registerTool(
    'get_server_info',
    {
      title: 'Get Server Information',
      description: 'Returns detailed server status, available labs, and system configuration',
      inputSchema: {
        output_mode: z.enum(['text', 'json']).optional().describe('Output format: text (pretty) or json (raw)')
      }
    },
    async ({ output_mode = 'text' }) => {
      const info = {
        server: {
          name: 'CLONMED Clinical Intelligence System',
          version: '3.1.0',
          status: 'operational',
          uptime_seconds: Math.floor(process.uptime()),
          start_time: new Date(Date.now() - process.uptime() * 1000).toISOString()
        },
        labs: {
          total: labCatalog.length,
          categories: [...new Set(labCatalog.map(l => l.category))],
          recent: labCatalog.slice(0, 5).map(l => ({ title: l.title, file: l.file }))
        },
        configuration: {
          port: port,
          auto_open: AUTO_OPEN,
          portal_url: PORTAL_URL,
          root_directory: rootDir,
          platform: process.platform,
          node_version: process.version
        },
        endpoints: {
          mcp: `http://localhost:${currentPort}/mcp`,
          sse: `http://localhost:${currentPort}/sse`,
          health: `http://localhost:${currentPort}/health`,
          api_recommend: `http://localhost:${currentPort}/api/recommend?q=cardiac`,
          dashboard: `http://localhost:${currentPort}/`
        },
        resources: {
          memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          cpu_usage: process.cpuUsage(),
          pid: process.pid
        },
        timestamp: new Date().toISOString()
      };
      
      if (output_mode === 'json') {
        return {
          content: [{ type: 'text', text: JSON.stringify(info, null, 2) }]
        };
      }
      
      const lines = [
        '╔════════════════════════════════════════════════════════════════════╗',
        '║              🖥️  CLONMED SERVER INFORMATION                         ║',
        '╚════════════════════════════════════════════════════════════════════╝',
        '',
        `📦 Server: ${info.server.name} v${info.server.version}`,
        `🟢 Status: ${info.server.status}`,
        `⏱️  Uptime: ${Math.floor(info.server.uptime_seconds / 60)} minutes`,
        '',
        '📊 LAB CATALOG:',
        `   • Total Labs: ${info.labs.total}`,
        `   • Categories: ${info.labs.categories.slice(0, 5).join(', ')}${info.labs.categories.length > 5 ? '...' : ''}`,
        '',
        '🔧 CONFIGURATION:',
        `   • Port: ${info.configuration.port}`,
        `   • Auto-open: ${info.configuration.auto_open ? '✅ Enabled' : '❌ Disabled'}`,
        `   • Portal: ${info.configuration.portal_url}`,
        `   • Platform: ${info.configuration.platform}`,
        '',
        '🔗 ENDPOINTS:',
        `   • MCP: ${info.endpoints.mcp}`,
        `   • SSE: ${info.endpoints.sse}`,
        `   • Health: ${info.endpoints.health}`,
        '',
        '💾 RESOURCES:',
        `   • Memory: ${info.resources.memory_mb} MB`,
        `   • PID: ${info.resources.pid}`,
        '',
        `🕐 Timestamp: ${info.timestamp}`
      ];
      
      return {
        content: [{ type: 'text', text: lines.join('\n') }]
      };
    }
  );

  return server;
}

// Initialize catalog
labCatalog = buildLabCatalog();
keywordIndex = buildKeywordIndex();
const mcpServer = createServer();

// SSE endpoint with error handling
app.get('/sse', async (req, res) => {
  try {
    const transport = new SSEServerTransport('/message', res);
    await mcpServer.connect(transport);
    transports.set(transport.sessionId, transport);
    
    res.on('close', () => {
      transports.delete(transport.sessionId);
      console.log(`[INFO] Session closed: ${transport.sessionId.slice(0, 8)}...`);
    });
    
    console.log(`[INFO] New SSE connection: ${transport.sessionId.slice(0, 8)}...`);
  } catch (err) {
    console.error('[ERROR] SSE connection failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Connection failed', message: err.message });
    }
  }
});

// Message endpoint
app.post('/message', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);
  
  if (!transport) {
    return res.status(404).json({ error: 'Session not found', sessionId });
  }
  
  try {
    await transport.handlePostMessage(req, res);
  } catch (err) {
    console.error('[ERROR] Message handling failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Message processing failed' });
    }
  }
});

// REST API endpoints
app.get('/api/recommend', (req, res) => {
  const query = req.query.q || req.query.query || '';
  const lab = recommendLab(query);
  res.json({
    query,
    recommended: lab.title,
    file: lab.file,
    category: lab.category,
    url: `http://localhost:${currentPort}${lab.url}`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  
  const matches = labCatalog
    .filter(lab => 
      lab.title.toLowerCase().includes(q) ||
      lab.keywords.some(k => k.includes(q))
    )
    .slice(0, limit);
  
  res.json({
    query: q,
    count: matches.length,
    total: labCatalog.length,
    results: matches.map(l => ({
      title: l.title,
      file: l.file,
      category: l.category,
      url: `http://localhost:${port}${l.url}`
    }))
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    version: '3.1.0',
    name: 'CLONMED Clinical Intelligence System',
    labs: labCatalog.length,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Prompt Opinion MCP endpoint (Streamable HTTP)
app.post('/mcp', async (req, res) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[ERROR] MCP request failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal error' },
        id: req.body?.id ?? null
      });
    }
  }
});

app.get('/mcp', (_req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Use POST for MCP requests' },
    id: null
  });
});

// Dashboard redirect
app.get('/', (req, res) => {
  res.json({
    name: 'CLONMED MCP Server',
    version: '3.1.0',
    status: 'running',
    endpoints: {
      mcp: '/mcp (POST)',
      sse: '/sse (GET)',
      health: '/health',
      test_open: '/test-open',
      labs: '/labs'
    },
    labs_count: labCatalog.length,
    timestamp: new Date().toISOString()
  });
});

// Store connected WebSocket clients
const wsClients = new Set();

// Remote control client page endpoint
app.get('/remote', (req, res) => {
  const serverUrl = req.headers.host || `localhost:${currentPort}`;
  const protocol = serverUrl.includes('localhost') ? 'ws' : 'wss';
  
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>CLONMED Remote Tab Opener</title>
  <style>
    body { font-family: Arial; background: #0f0f0f; color: #fff; padding: 40px; text-align: center; }
    .status { padding: 20px; border-radius: 10px; margin: 20px 0; }
    .connected { background: #22c55e; }
    .disconnected { background: #ef4444; }
    .log { background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; max-height: 300px; overflow-y: auto; }
    .log-entry { margin: 5px 0; font-size: 14px; }
    h1 { font-weight: 300; }
    .url { color: #888; font-size: 14px; }
  </style>
</head>
<body>
  <h1>CLONMED Remote Tab Controller</h1>
  <p class="url">${protocol}://${serverUrl}</p>
  <div id="status" class="status disconnected">Disconnected</div>
  <div class="log" id="log">
    <div class="log-entry">Waiting for connection...</div>
  </div>
  <p style="color: #888; font-size: 12px;">Keep this page open to auto-open tabs from cloud server</p>
  
  <script>
    const log = document.getElementById('log');
    const status = document.getElementById('status');
    
    function addLog(msg) {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = new Date().toLocaleTimeString() + ': ' + msg;
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;
    }
    
    const ws = new WebSocket('${protocol}://${serverUrl}');
    
    ws.onopen = () => {
      status.textContent = 'Connected - Ready to open tabs!';
      status.className = 'status connected';
      addLog('Connected to server');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog('Received: ' + data.type);
      
      if (data.type === 'open-tabs' && data.urls) {
        addLog('Opening ' + data.urls.length + ' tabs...');
        data.urls.forEach((url, i) => {
          setTimeout(() => {
            window.open(url, '_blank');
            addLog('Opened: ' + url.substring(0, 50) + '...');
          }, i * 500);
        });
      }
    };
    
    ws.onclose = () => {
      status.textContent = 'Disconnected - Refresh page';
      status.className = 'status disconnected';
      addLog('Connection closed');
    };
    
    ws.onerror = (err) => {
      addLog('Error: ' + err.message);
    };
  </script>
</body>
</html>`);
});

// Function to send open-tabs command to all connected clients
export function broadcastOpenTabs(urls) {
  const message = JSON.stringify({ type: 'open-tabs', urls, timestamp: Date.now() });
  let sent = 0;
  wsClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      sent++;
    }
  });
  console.log(`[REMOTE] Sent open-tabs to ${sent} connected clients`);
  return sent;
}

// Function to update viewer with full data
function broadcastToViewer(payload) {
  const message = JSON.stringify({ type: 'update-viewer', payload, timestamp: Date.now() });
  let sent = 0;
  wsClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      sent++;
    }
  });
  console.log(`[VIEWER] Sent update to ${sent} connected viewer(s)`);
  return sent;
}

// Start HTTP server
const server = http.createServer(app);

// Start WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[REMOTE] Client connected for remote tab control');
  wsClients.add(ws);
  
  ws.on('close', () => {
    console.log('[REMOTE] Client disconnected');
    wsClients.delete(ws);
  });
  
  ws.on('error', (err) => {
    console.error('[REMOTE] WebSocket error:', err.message);
    wsClients.delete(ws);
  });
});

// Try to start server with port fallback
function startServer(tryPort) {
  server.listen(tryPort, () => {
    currentPort = tryPort;
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     🏥 CLONMED Clinical Intelligence System v3.1.0 🏥      ║');
    console.log('║          Medical Simulation Lab Recommendation Engine        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`[INFO] Port: ${currentPort}`);
    console.log(`[INFO] Labs loaded: ${labCatalog.length}`);
    console.log(`[INFO] Auto-open tabs: ${AUTO_OPEN ? 'ENABLED' : 'DISABLED'}`);
    console.log(`[INFO] Portal URL: ${PORTAL_URL}`);
    console.log(`[INFO] MCP (Prompt Opinion): http://localhost:${currentPort}/mcp`);
    console.log(`[INFO] SSE Endpoint: http://localhost:${currentPort}/sse`);
    console.log(`[INFO] Health Check: http://localhost:${currentPort}/health`);
    console.log(`[INFO] Test API: http://localhost:${currentPort}/api/recommend?q=cardiac`);
    console.log(`[INFO] 🎯 VIEWER PAGE: http://localhost:${currentPort}/viewer.html`);
    console.log(`[INFO] 🎯 REMOTE OPENER: http://localhost:${currentPort}/remote`);
    console.log('──────────────────────────────────────────────────────────────');
    console.log('[INFO] Disease keywords trigger auto-open: cancer, pain, fever, ...');
    console.log('[INFO] Or set auto_open=true to force browser launch');
    console.log('──────────────────────────────────────────────────────────────');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[WARN] Port ${tryPort} busy, trying ${tryPort + 1}...`);
      startServer(tryPort + 1);
    } else {
      console.error('[ERROR] Server failed:', err.message);
      process.exit(1);
    }
  });
}

startServer(DEFAULT_PORT);

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET /',
      'POST /mcp',
      'GET /sse',
      'GET /health',
      'GET /test-open',
      'GET /labs',
      'GET /viewer.html',
      'GET /remote'
    ]
  });
});
