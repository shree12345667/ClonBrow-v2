import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { z } from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const rootDir = process.cwd();
const shouldAutoOpenTabs = process.env.CLONMED_AUTO_OPEN_TABS === 'true';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '4mb' }));
app.use('/labs', express.static(rootDir, { extensions: ['html'] }));

const transports = new Map();
const reports = new Map();
let labCatalog = [];

function createServer(publicBaseUrl = '') {
  const server = new McpServer(
    {
      name: 'ClonMed-Ultimate',
      version: '4.2.0',
    },
    {
      capabilities: {
        extensions: {
          'ai.promptopinion/fhir-context': {
            scopes: [
              { name: 'patient/Patient.rs', required: true },
              { name: 'offline_access' },
              { name: 'patient/Observation.rs' },
              { name: 'patient/Condition.rs' },
            ],
          },
        },
      },
    },
  );

  server.registerTool(
    'get_clinical_lab',
    {
      title: 'Get CLONMED Clinical Lab',
      description: 'Recommends the best CLONMED HTML lab for a medical topic.',
      inputSchema: {
        condition: z.string().min(1).describe('Medical topic, symptom, condition, body system, or procedure.'),
        patient_context: z.string().optional().describe('Optional patient details such as age, symptoms, vitals, or chief complaint.'),
      },
    },
    async ({ condition, patient_context }) => {
      const query = [condition, patient_context].filter(Boolean).join(' ');
      const lab = recommendLab(query);
      const visual = buildVisualPayload(lab, query, publicBaseUrl);
      const nearby = lab.alternatives
        .slice(0, 2)
        .map((item) => item.title)
        .join(', ');

      const message = [
        'CLONMED Patient Learning Card',
        '',
        `Analysis: ${buildAnalysis(condition, patient_context, lab)}`,
        `Recommended tool: ${lab.title}`,
        `Why it fits: ${lab.reason}`,
        'How to use it: You can play with this CLONMED interactive tool to understand it visually and perform it step by step.',
        nearby ? `Other useful CLONMED tools nearby: ${nearby}.` : '',
        '',
        'Open items:',
        'Visual card: available as a resource link below',
        'Related image: available in the API response',
        'Powered by CLONMED.',
      ].filter(Boolean).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: message,
          },
          {
            type: 'resource_link',
            uri: visual.cardUrl,
            name: `${lab.title} CLONMED Visual Card`,
            mimeType: 'text/html',
            description: 'Open this card to show the related image and embedded CLONMED lab.',
          },
        ],
      };
    },
  );

  server.registerTool(
    'get_clonmed_visual_card',
    {
      title: 'Get CLONMED Visual Card',
      description: 'Returns a CLONMED visual card link for a medical topic.',
      inputSchema: {
        query: z.string().min(1).describe('Medical topic, symptom, condition, patient situation, or lab need.'),
      },
    },
    async ({ query }) => {
      const lab = recommendLab(query);
      const visual = buildVisualPayload(lab, query, publicBaseUrl);

      return {
        content: [
          {
            type: 'text',
            text: [
              `Quick analysis: ${buildAnalysis(query, '', lab)}`,
              `Relevant CLONMED tool: ${lab.title}.`,
              `You can play with this CLONMED interactive tool directly in the chat section.`,
              'Visual card: available as a resource link below.',
              'Related image: available in the API response.',
              `Powered by CLONMED.`,
            ].join('\n'),
          },
          {
            type: 'resource_link',
            uri: visual.cardUrl,
            name: `${lab.title} CLONMED Visual Card`,
            mimeType: 'text/html',
            description: 'Open this card to show the related image and embedded CLONMED lab.',
          },
        ],
      };
    },
  );

  server.registerTool(
    'diagnose_patient',
    {
      title: 'Diagnose Patient',
      description: 'Use for patient symptoms, age, diagnosis, vitals, or history. Returns a short assessment and CLONMED recommendation.',
      inputSchema: {
        patient_info: z.string().min(1).describe('All available patient information: age, gender, symptoms, duration, vitals, history, meds, allergies, and concern.'),
        patient_name: z.string().optional().describe('Patient name if known.'),
        patient_age: z.string().optional().describe('Patient age if known.'),
        message_count: z.number().optional().describe('How many user/assistant messages have occurred in this patient conversation. If 10 or more, a report link is generated.'),
        session_id: z.string().optional().describe('Stable conversation/session id if known.'),
      },
    },
    async ({ patient_info, patient_name, patient_age, message_count = 1, session_id }) => {
      const combinedInfo = [
        patient_name ? `Name: ${patient_name}` : '',
        patient_age ? `Age: ${patient_age}` : '',
        patient_info,
      ].filter(Boolean).join('\n');
      const diagnosis = analyzePatient(combinedInfo);
      const lab = recommendLab(combinedInfo);
      const visual = buildVisualPayload(lab, combinedInfo, publicBaseUrl);
      const openedTabs = shouldAutoOpenTabs
        ? openClonmedWorkspaceTabs({ lab, visual, query: combinedInfo })
        : [];
      const report = message_count >= 10
        ? createPatientReport({ sessionId: session_id, patientInfo: combinedInfo, diagnosis, lab, visual, baseUrl: publicBaseUrl })
        : null;
      const platformLinks = message_count >= 20 ? getPlatformLinks() : null;
      const message = formatDiagnosis(diagnosis, lab, visual, report, message_count, platformLinks, openedTabs);

      return {
        content: [
          {
            type: 'text',
            text: message,
          },
          {
            type: 'resource_link',
            uri: visual.cardUrl,
            name: `${lab.title} CLONMED Visual Card`,
            mimeType: 'text/html',
            description: 'Open this card to show the related image and embedded CLONMED lab.',
          },
          ...(report ? [{
            type: 'resource_link',
            uri: report.pdfUrl,
            name: 'CLONMED Patient Report PDF',
            mimeType: 'application/pdf',
            description: 'Download the generated CLONMED educational patient report.',
          }] : []),
        ],
      };
    },
  );

  server.registerTool(
    'open_clonmed_workspace',
    {
      title: 'Open CLONMED Workspace',
      description: 'Opens the matched CLONMED visual lab tabs on this computer.',
      inputSchema: {
        query: z.string().min(1).describe('Disease, symptom, patient condition, or lab topic to open.'),
      },
    },
    async ({ query }) => {
      const lab = recommendLab(query);
      const visual = buildVisualPayload(lab, query, publicBaseUrl);
      const openedTabs = openClonmedWorkspaceTabs({ lab, visual, query });

      return {
        content: [
          {
            type: 'text',
            text: [
              'CLONMED workspace opened on this computer.',
              '',
              `Disease/topic: ${query}`,
              `Recommended tool: ${lab.title}`,
              'Opened tabs:',
              ...openedTabs.map((tab) => tab.label),
              '',
              'Why opened: these pages let you visualize the condition, interact with the matching lab, and access the native CLONMED download portal.',
              'Powered by CLONMED.',
            ].join('\n'),
          },
        ],
      };
    },
  );

  server.registerTool(
    'generate_patient_report',
    {
      title: 'Generate Patient Report',
      description: 'Generates a CLONMED educational patient report.',
      inputSchema: {
        patient_info: z.string().min(1).describe('Collected patient information and conversation summary.'),
        patient_name: z.string().optional().describe('Patient name if known.'),
        patient_age: z.string().optional().describe('Patient age if known.'),
        session_id: z.string().optional().describe('Stable conversation/session id if known.'),
      },
    },
    async ({ patient_info, patient_name, patient_age, session_id }) => {
      const combinedInfo = [
        patient_name ? `Name: ${patient_name}` : '',
        patient_age ? `Age: ${patient_age}` : '',
        patient_info,
      ].filter(Boolean).join('\n');
      const diagnosis = analyzePatient(combinedInfo);
      const lab = recommendLab(combinedInfo);
      const visual = buildVisualPayload(lab, combinedInfo, publicBaseUrl);
      const report = createPatientReport({ sessionId: session_id, patientInfo: combinedInfo, diagnosis, lab, visual, baseUrl: publicBaseUrl });

      return {
        content: [
          {
            type: 'text',
            text: [
              'CLONMED report generated.',
              'PDF report: available as a resource link below.',
              'HTML report: available in the API response.',
              `Recommended tool: ${lab.title}`,
              'Powered by CLONMED.',
            ].join('\n'),
          },
          {
            type: 'resource_link',
            uri: report.pdfUrl,
            name: 'CLONMED Patient Report PDF',
            mimeType: 'application/pdf',
            description: 'Download the generated CLONMED educational patient report.',
          },
        ],
      };
    },
  );

  server.registerTool(
    'list_clonmed_labs',
    {
      title: 'List CLONMED Labs',
      description: 'Lists available local CLONMED medical HTML labs.',
      inputSchema: {
        search: z.string().optional().describe('Optional search text to filter the lab database.'),
      },
    },
    async ({ search }) => {
      const labs = search
        ? rankLabs(search).slice(0, 10)
        : labCatalog.slice(0, 25);

      const lines = labs.map((lab, index) => `${index + 1}. ${lab.title} - ${lab.url}`);

      return {
        content: [
          {
            type: 'text',
            text: [
              `CLONMED found ${labCatalog.length} local interactive medical tools.`,
              search ? `Top matches for "${search}":` : 'Here are some available tools:',
              ...lines,
              'Powered by CLONMED.',
            ].join('\n'),
          },
        ],
      };
    },
  );

  return server;
}

function buildLabCatalog() {
  const htmlFiles = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => entry.name)
    .filter(isLikelyMedicalLab)
    .sort((a, b) => a.localeCompare(b));

  const catalog = htmlFiles.map((file) => {
    const title = titleFromFile(file);
    const lowerTitle = title.toLowerCase();
    const keywords = unique([
      ...tokenize(title),
      ...tokenize(file),
      ...synonymsForTitle(lowerTitle),
      ...categoryKeywords(lowerTitle),
    ]);

    return {
      file,
      title,
      url: `/labs/${encodeURIComponent(file)}`,
      keywords,
      category: inferCategory(lowerTitle),
    };
  });

  const dashboard = catalog.find((lab) => lab.file === 'clonmed_dashboard.html');
  if (!dashboard && fs.existsSync(path.join(rootDir, 'clonmed_dashboard.html'))) {
    catalog.unshift({
      file: 'clonmed_dashboard.html',
      title: 'CLONMED Dashboard',
      url: '/labs/clonmed_dashboard.html',
      keywords: ['clonmed', 'dashboard', 'medical', 'tools', 'simulation', 'library'],
      category: 'general',
    });
  }

  return catalog;
}

function recommendLab(query) {
  const ranked = rankLabs(query);
  const best = ranked[0] || fallbackLab();
  const alternatives = ranked.filter((lab) => lab.file !== best.file).slice(0, 3);

  return {
    ...best,
    alternatives,
    reason: best.score > 0
      ? `The CLONMED database matched your request to this tool using ${best.matchedTerms.slice(0, 5).join(', ')}.`
      : 'I could not find one exact match, so I am opening the CLONMED dashboard for the full medical tool library.',
  };
}

function analyzePatient(patientInfo) {
  const text = normalize(patientInfo);
  const redFlags = [];

  for (const rule of RED_FLAG_RULES) {
    if (rule.terms.some((term) => termPresent(text, term))) {
      redFlags.push(rule.label);
    }
  }

  const urgency = redFlags.length > 0
    ? 'emergency'
    : URGENT_TERMS.some((term) => text.includes(term))
      ? 'urgent'
      : 'routine';

  const possibleAreas = [];
  for (const area of DIAGNOSTIC_AREAS) {
    const hits = area.terms.filter((term) => termPresent(text, term));
    if (hits.length) {
      possibleAreas.push({
        name: area.name,
        hits,
      });
    }
  }

  const missing = [];
  if (!/\b(age|year|yr|yo|old|\d{1,3})\b/.test(text)) missing.push('age');
  if (!/(since|for|day|days|hour|hours|week|weeks|duration|started|onset)/.test(text)) missing.push('duration/onset');
  if (!/(mild|moderate|severe|pain|score|\/10|high|low)/.test(text)) missing.push('severity');
  if (!/(bp|blood pressure|pulse|heart rate|spo2|oxygen|temperature|fever|vitals)/.test(text)) missing.push('vitals');

  const extracted = extractPatientBasics(patientInfo);

  return {
    urgency,
    redFlags: unique(redFlags),
    possibleAreas,
    missing,
    extracted,
  };
}

function extractPatientBasics(patientInfo) {
  const original = String(patientInfo || '');
  const text = normalize(patientInfo);
  const ageMatch = original.match(/\b(?:age[:\s]*)?(\d{1,3})\s*(?:years?|yrs?|yo|old)?\b/i);
  const nameMatch = original.match(/\bname[:\s]+([a-zA-Z][a-zA-Z\s]{0,40}?)(?=\s+(?:age|gender|sex|symptom|diagnosis|complaint|with|has)\b|[,.;\n]|$)/i);
  const genderMatch = text.match(/\b(male|female|boy|girl|man|woman|transgender|nonbinary|non-binary)\b/);

  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    age: ageMatch ? ageMatch[1] : '',
    gender: genderMatch ? genderMatch[1] : '',
  };
}

function termPresent(text, term) {
  if (!text.includes(term)) return false;

  const negationPatterns = [
    `no ${term}`,
    `not ${term}`,
    `without ${term}`,
    `denies ${term}`,
    `denied ${term}`,
    `negative for ${term}`,
  ];

  return !negationPatterns.some((pattern) => text.includes(pattern));
}

function formatDiagnosis(diagnosis, lab, visual, report = null, messageCount = 1, platformLinks = null, openedTabs = []) {
  const lines = ['CLONMED Patient Assessment', ''];

  const patientBits = [
    diagnosis.extracted?.name ? `Name: ${diagnosis.extracted.name}` : '',
    diagnosis.extracted?.age ? `Age: ${diagnosis.extracted.age}` : '',
    diagnosis.extracted?.gender ? `Gender: ${diagnosis.extracted.gender}` : '',
  ].filter(Boolean);

  if (patientBits.length) {
    lines.push('Patient details found:');
    lines.push(...patientBits);
    lines.push('');
  }

  if (diagnosis.urgency === 'emergency') {
    lines.push(`Urgency: emergency warning signs are present (${diagnosis.redFlags.join(', ')}). Please seek emergency medical care immediately.`);
  } else if (diagnosis.urgency === 'urgent') {
    lines.push('Urgency: this may need prompt medical attention, especially if symptoms are worsening or persistent.');
  } else {
    lines.push('Urgency: based on the information provided, this sounds suitable for educational guidance, but more details are needed for safer triage.');
  }

  if (diagnosis.possibleAreas.length) {
    const areas = diagnosis.possibleAreas
      .slice(0, 3)
      .map((area) => `${area.name} clues: ${area.hits.slice(0, 4).join(', ')}`)
      .join('; ');
    lines.push(`Clinical pattern: ${areas}.`);
  } else {
    lines.push('Clinical pattern: I need more symptom details before narrowing the likely body system or topic.');
  }

  if (diagnosis.missing.length) {
    lines.push(`Helpful missing details: ${diagnosis.missing.join(', ')}.`);
  }

  lines.push('');
  lines.push('CLONMED recommendation');
  lines.push(`Recommended tool: ${lab.title}`);
  lines.push('How to use it: You can play with this CLONMED interactive tool to understand the situation visually and perform it step by step.');
  lines.push('Visual card: available as a resource link below');
  lines.push('HTML lab: available inside the visual card');
  lines.push('Related image: available in the API response');
  if (openedTabs.length) {
    lines.push('');
    lines.push('Opened on your screen');
    lines.push('Visual disease card');
    lines.push('Interactive HTML lab');
    lines.push('Native download portal');
    lines.push('Why opened: CLONMED opened these so you can visualize the disease instead of only reading text.');
  }
  if (report) {
    lines.push('');
    lines.push('Generated report');
    lines.push(`Conversation has ${messageCount} messages, so I generated a CLONMED patient report.`);
    lines.push('PDF report: available as a resource link below');
    lines.push('HTML report: available in the API response');
  } else {
    lines.push('');
    lines.push(`Report status: ${Math.max(0, 10 - Number(messageCount || 1))} more message(s) before automatic report generation.`);
  }

  if (platformLinks) {
    lines.push('');
    lines.push('More CLONMED access');
    lines.push('Main web browser: available in platform_links.mainWeb');
    lines.push('Web simulation hub: available in platform_links.simulationHub');
    lines.push('Native download portal: available in platform_links.downloadPortal');
  }

  lines.push('');
  lines.push('Educational note: this is not a diagnosis or replacement for a qualified clinician.');
  lines.push('Powered by CLONMED.');

  return lines.join('\n');
}

function getPlatformLinks() {
  return {
    mainWeb: 'https://polite-lamington-b8d87d.netlify.app/',
    simulationHub: 'https://taupe-druid-86622d.netlify.app/',
    downloadPortal: 'https://super-crisp-af6236.netlify.app/',
  };
}

function openClonmedWorkspaceTabs({ lab, visual, query }) {
  const tabs = [
    { label: 'Visual disease card', url: visual.cardUrl },
    { label: 'Interactive HTML lab', url: visual.labUrl },
    { label: 'Native download portal', url: getPlatformLinks().downloadPortal },
  ];

  openUrlsInBrowser(tabs.map((tab) => tab.url));
  console.log(`Opened CLONMED workspace for ${query}: ${lab.title}`);
  return tabs;
}

function openUrlsInBrowser(urls) {
  const cleanUrls = unique(urls.filter(Boolean));
  if (!cleanUrls.length) return;

  const chromeCandidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ].filter(Boolean);

  const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

  try {
    if (chromePath) {
      spawn(chromePath, ['--new-window', ...cleanUrls], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      }).unref();
      return;
    }

    for (const url of cleanUrls) {
      spawn('cmd', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      }).unref();
    }
  } catch (error) {
    console.error('Could not open CLONMED browser tabs:', error);
  }
}

function createPatientReport({ sessionId, patientInfo, diagnosis, lab, visual, baseUrl = '' }) {
  const id = safeReportId(sessionId || randomUUID());
  const createdAt = new Date().toISOString();
  const report = {
    id,
    createdAt,
    patientInfo,
    diagnosis,
    lab,
    visual,
  };

  reports.set(id, report);

  return {
    id,
    htmlUrl: absoluteUrl(`/report/${id}.html`, baseUrl),
    pdfUrl: absoluteUrl(`/report/${id}.pdf`, baseUrl),
  };
}

function safeReportId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || randomUUID();
}

function reportHtml(report) {
  const areas = report.diagnosis.possibleAreas
    .map((area) => `<li><strong>${escapeHtml(area.name)}</strong>: ${escapeHtml(area.hits.join(', '))}</li>`)
    .join('') || '<li>More symptom details needed.</li>';
  const redFlags = report.diagnosis.redFlags.join(', ') || 'None detected from supplied text';
  const missing = report.diagnosis.missing.join(', ') || 'No major intake fields missing';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CLONMED Patient Report</title>
  <style>
    body { margin:0; padding:28px; background:#f4f8fb; color:#102033; font-family:Arial, sans-serif; }
    main { max-width:900px; margin:auto; background:white; border-radius:22px; padding:30px; box-shadow:0 20px 60px #1234; }
    h1 { margin:0 0 6px; color:#0c4a6e; }
    h2 { color:#0f766e; margin-top:28px; }
    pre { white-space:pre-wrap; background:#eef6ff; border-radius:14px; padding:16px; }
    .badge { display:inline-block; padding:8px 12px; border-radius:999px; background:#dff7ed; color:#065f46; font-weight:700; }
    a { color:#0369a1; }
  </style>
</head>
<body>
  <main>
    <span class="badge">Powered by CLONMED</span>
    <h1>Educational Patient Report</h1>
    <p>Generated: ${escapeHtml(report.createdAt)}</p>
    <h2>Patient Information</h2>
    <pre>${escapeHtml(report.patientInfo)}</pre>
    <h2>Educational Triage Summary</h2>
    <p><strong>Urgency:</strong> ${escapeHtml(report.diagnosis.urgency)}</p>
    <p><strong>Red flags:</strong> ${escapeHtml(redFlags)}</p>
    <p><strong>Missing details:</strong> ${escapeHtml(missing)}</p>
    <h2>Possible Clinical Areas</h2>
    <ul>${areas}</ul>
    <h2>Recommended CLONMED Tool</h2>
    <p><strong>${escapeHtml(report.lab.title)}</strong></p>
    <p><a href="${report.visual.cardUrl}">Open visual card</a></p>
    <p><a href="${report.visual.labUrl}">Open HTML lab</a></p>
    <h2>Safety Note</h2>
    <p>This report is educational only. It is not a diagnosis and does not replace a qualified clinician.</p>
  </main>
</body>
</html>`;
}

function reportPdfBuffer(report) {
  const lines = [
    'CLONMED Educational Patient Report',
    `Generated: ${report.createdAt}`,
    '',
    'Patient Information:',
    report.patientInfo,
    '',
    `Urgency: ${report.diagnosis.urgency}`,
    `Red flags: ${report.diagnosis.redFlags.join(', ') || 'None detected from supplied text'}`,
    `Missing details: ${report.diagnosis.missing.join(', ') || 'No major intake fields missing'}`,
    '',
    `Recommended CLONMED Tool: ${report.lab.title}`,
    `Visual Card: ${report.visual.cardUrl}`,
    `HTML Lab: ${report.visual.labUrl}`,
    '',
    'Educational only. Not a diagnosis or replacement for a qualified clinician.',
    'Powered by CLONMED.',
  ].join('\n');

  return makeSimplePdf(lines);
}

function makeSimplePdf(text) {
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .split('\n')
    .slice(0, 42);
  const content = [
    'BT',
    '/F1 11 Tf',
    '50 790 Td',
    ...escaped.map((line, index) => `${index === 0 ? '' : '0 -16 Td '}(${line.slice(0, 95)}) Tj`),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

function buildAnalysis(condition, patientContext, lab) {
  const context = patientContext ? ` The patient context adds: ${patientContext}.` : '';
  return `This appears most related to ${lab.category} learning and simulation.${context} The best next step is to connect the explanation with an interactive CLONMED lab rather than only reading text.`;
}

function buildVisualPayload(lab, query, baseUrl = '') {
  const absoluteLabUrl = absoluteUrl(lab.url, baseUrl);
  const imageUrl = getMedicalImageUrl(query, lab);
  const cardUrl = absoluteUrl(`/card?search=${encodeURIComponent(query || lab.title)}`, baseUrl);
  const embedHtml = `<section class="clonmed-card" style="border:1px solid #1f6feb33;border-radius:18px;overflow:hidden;background:#07111f;color:#eaf2ff;font-family:Inter,system-ui,sans-serif;max-width:760px"><img src="${imageUrl}" alt="${escapeHtml(lab.title)} visual" style="width:100%;height:190px;object-fit:cover;display:block"><div style="padding:14px 16px"><strong style="font-size:18px">${escapeHtml(lab.title)}</strong><p style="margin:8px 0 12px;color:#b8c7dc">Powered by CLONMED. Use the simulation below to explore the concept interactively.</p></div><iframe title="${escapeHtml(lab.title)}" src="${absoluteLabUrl}" style="width:100%;height:520px;border:0;background:white" loading="lazy" allowfullscreen></iframe></section>`;

  return {
    imageUrl,
    labUrl: absoluteLabUrl,
    cardUrl,
    embedHtml,
  };
}

function getMedicalImageUrl(query, lab) {
  const keywords = unique([
    lab.category,
    ...tokenize(query),
    ...lab.keywords,
  ]).slice(0, 4);

  const topic = encodeURIComponent(['medical', ...keywords].join(','));
  return `https://source.unsplash.com/1200x700/?${topic}`;
}

function absoluteUrl(url, baseUrl = '') {
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function rankLabs(query) {
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(normalizedQuery);
  const expandedTokens = unique([
    ...queryTokens,
    ...expandQueryTerms(normalizedQuery),
  ]);

  return labCatalog
    .map((lab) => {
      const haystack = normalize(`${lab.title} ${lab.file} ${lab.keywords.join(' ')} ${lab.category}`);
      const matchedTerms = [];
      let score = 0;

      if (haystack.includes(normalizedQuery) && normalizedQuery.length > 2) {
        score += 80;
        matchedTerms.push(normalizedQuery);
      }

      for (const token of expandedTokens) {
        if (token.length < 2) continue;

        if (normalize(lab.title).includes(token)) {
          score += 15;
          matchedTerms.push(token);
        } else if (lab.keywords.includes(token)) {
          score += 10;
          matchedTerms.push(token);
        } else if (haystack.includes(token)) {
          score += 4;
          matchedTerms.push(token);
        }
      }

      if (lab.title.toLowerCase().includes('lab') || lab.title.toLowerCase().includes('simulation')) {
        score += 2;
      }

      return {
        ...lab,
        score,
        matchedTerms: unique(matchedTerms),
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

function isLikelyMedicalLab(file) {
  const title = titleFromFile(file).toLowerCase();
  if (file === 'index.html' || file === 'integration.html') return false;
  if (title.includes('math lab dashboard') || title.includes('physics lab dashboard')) return false;

  const nonMedicalTerms = [
    'algebra', 'angles', 'area', 'argand', 'arithmetic', 'bar graphs', 'bohr model',
    'buoyancy', 'circle', 'clock', 'conic', 'coordinate', 'coulombs', 'derivatives',
    '2d vectors', '3d nets', '3d planes', 'newtons', 'density tower',
    'distance', 'dot and cross', 'dynamics', 'educationist', 'electromagnetism',
    'energy', 'eulers', 'exponents', 'fractions', 'friction', 'galtons', 'gravity',
    'heat basics', 'human eye', 'integration', 'light dispersion', 'limits', 'linear programming', 'magnets',
    'matrices', 'momentum', 'multiplication', 'number line', 'parabola', 'parametric',
    'place values', 'polarization', 'probability', 'projectile', 'pythagorean',
    'quadratic', 'ratios', 'shadows', 'simple circuits', 'simple machines', 'solar system',
    'states of matter', 'statistics', 'surface area', 'symmetry', 'tessellations',
    'total internal reflection', 'transformations', 'trigonometry',
    'unit circle', 'velocity', 'venn', 'visualized pi', 'volume', 'waves',
  ];

  return !nonMedicalTerms.some((term) => title.includes(term));
}

function titleFromFile(file) {
  return file
    .replace(/\.html$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/'S\b/g, "'s");
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function expandQueryTerms(query) {
  const expansions = [];
  for (const [term, related] of Object.entries(MEDICAL_SYNONYMS)) {
    if (query.includes(term)) {
      expansions.push(term, ...related);
    }
  }
  return expansions;
}

function synonymsForTitle(title) {
  const synonyms = [];
  for (const [term, related] of Object.entries(MEDICAL_SYNONYMS)) {
    if (title.includes(term)) {
      synonyms.push(term, ...related);
    }
  }
  return synonyms;
}

function categoryKeywords(title) {
  const categories = {
    cardiovascular: ['heart', 'cardiac', 'blood', 'vascular', 'embolization', 'defibrillator', 'clotting', 'hemoglobin', 'tourniquet'],
    respiratory: ['asthma', 'lung', 'alveoli', 'spirometry', 'oxygen', 'breath', 'pm2.5'],
    neurology: ['brain', 'neural', 'neuro', 'synaptic', 'myelin', 'reflex', 'eeg'],
    renal: ['kidney', 'renal', 'glomerular', 'urinalysis'],
    immune: ['antigen', 'antibody', 'vaccine', 'viral', 'phagocytosis', 'lymph', 'histamine'],
    genetics: ['crispr', 'gene', 'dna', 'pcr', 'telomere', 'protein', 'punnett'],
    pharmacology: ['drug', 'tablet', 'iv', 'titration', 'cytochrome', 'antacid', 'absorption'],
    toxicology: ['poisoning', 'cyanide', 'carbon monoxide', 'venom', 'heavy metal', 'lead'],
    surgery: ['surgery', 'suture', 'laparoscopic', 'endoscopy', 'resection', 'cryosurgery'],
    imaging: ['mri', 'x-ray', 'ultrasound', 'radiation', 'radioactive'],
    endocrine: ['serotonin', 'dopamine', 'cortisol', 'metabs'],
  };

  const hits = [];
  for (const [category, terms] of Object.entries(categories)) {
    if (terms.some((term) => title.includes(term))) {
      hits.push(category, ...terms);
    }
  }
  return hits;
}

function inferCategory(title) {
  return categoryKeywords(title)[0] || 'general';
}

function fallbackLab() {
  return labCatalog.find((lab) => lab.file === 'clonmed_dashboard.html') || {
    file: 'clonmed_dashboard.html',
    title: 'CLONMED Dashboard',
    url: '/labs/clonmed_dashboard.html',
    keywords: [],
    category: 'general',
    score: 0,
    matchedTerms: [],
  };
}

function isInitializeRequest(body) {
  return body?.jsonrpc === '2.0' && body?.method === 'initialize';
}

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  }

  const forwardedHost = req.get('x-forwarded-host');
  const forwardedProto = req.get('x-forwarded-proto');
  const host = forwardedHost || req.get('host');
  const protocol = forwardedProto || req.protocol || 'http';

  return host ? `${protocol}://${host}` : '';
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'ClonMed-Ultimate',
    catalogSize: labCatalog.length,
    transports: {
      streamableHttp: '/mcp',
      legacySse: '/sse',
      legacyMessages: '/messages',
    },
  });
});

app.get('/catalog', (req, res) => {
  const search = String(req.query.search || '');
  const labs = search ? rankLabs(search).slice(0, 25) : labCatalog;
  res.json({
    count: labs.length,
    labs: labs.map(({ title, file, url, category, score }) => ({ title, file, url, category, score })),
  });
});

app.get('/api/recommendation', (req, res) => {
  const search = String(req.query.search || req.query.q || '');
  const includeEmbed = String(req.query.include_embed || '').toLowerCase() === 'true';
  const lab = recommendLab(search);
  const baseUrl = getPublicBaseUrl(req);
  const visual = buildVisualPayload(lab, search || lab.title, baseUrl);

  res.json({
    answer: buildAnalysis(search || lab.title, '', lab),
    recommended_tool: lab.title,
    category: lab.category,
    matched_terms: lab.matchedTerms || [],
    image_url: visual.imageUrl,
    lab_url: visual.labUrl,
    card_url: visual.cardUrl,
    embed_html: includeEmbed ? visual.embedHtml : '',
    powered_by: 'CLONMED',
  });
});

app.get('/api/diagnose', (req, res) => {
  const patientInfo = String(req.query.patient || req.query.q || '');
  const messageCount = Number(req.query.message_count || req.query.messages || 1);
  const openTabs = String(req.query.open_tabs || '').toLowerCase() === 'true';
  const includeEmbed = String(req.query.include_embed || '').toLowerCase() === 'true';
  const diagnosis = analyzePatient(patientInfo);
  const lab = recommendLab(patientInfo);
  const baseUrl = getPublicBaseUrl(req);
  const visual = buildVisualPayload(lab, patientInfo || lab.title, baseUrl);
  const openedTabs = openTabs ? openClonmedWorkspaceTabs({ lab, visual, query: patientInfo }) : [];
  const report = messageCount >= 10
    ? createPatientReport({ sessionId: String(req.query.session_id || ''), patientInfo, diagnosis, lab, visual, baseUrl })
    : null;
  const platformLinks = messageCount >= 20 ? getPlatformLinks() : null;

  res.json({
    answer: formatDiagnosis(diagnosis, lab, visual, report, messageCount, platformLinks, openedTabs),
    patient_details: diagnosis.extracted,
    urgency: diagnosis.urgency,
    red_flags: diagnosis.redFlags,
    possible_areas: diagnosis.possibleAreas,
    missing_details: diagnosis.missing,
    recommended_tool: lab.title,
    image_url: visual.imageUrl,
    card_url: visual.cardUrl,
    embed_html: includeEmbed ? visual.embedHtml : '',
    report_pdf_url: report?.pdfUrl || '',
    report_html_url: report?.htmlUrl || '',
    platform_links: platformLinks || {},
    opened_tabs: openedTabs,
    safety_note: 'Educational only. Not a medical diagnosis or replacement for a qualified clinician.',
    powered_by: 'CLONMED',
  });
});

app.get('/api/open-workspace', (req, res) => {
  const query = String(req.query.search || req.query.q || req.query.patient || '');
  const lab = recommendLab(query);
  const baseUrl = getPublicBaseUrl(req);
  const visual = buildVisualPayload(lab, query || lab.title, baseUrl);
  const openedTabs = openClonmedWorkspaceTabs({ lab, visual, query });

  res.json({
    ok: true,
    message: 'CLONMED workspace opened on this computer.',
    recommended_tool: lab.title,
    opened_tabs: openedTabs,
    why_opened: 'These tabs show the visual disease card, the matching interactive HTML lab, and the CLONMED native download portal.',
    powered_by: 'CLONMED',
  });
});

app.get('/report/:id.html', (req, res) => {
  const report = reports.get(req.params.id);
  if (!report) {
    res.status(404).send('Report not found or server was restarted.');
    return;
  }

  res.type('html').send(reportHtml(report));
});

app.get('/report/:id.pdf', (req, res) => {
  const report = reports.get(req.params.id);
  if (!report) {
    res.status(404).send('Report not found or server was restarted.');
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="clonmed-report-${report.id}.pdf"`);
  res.send(reportPdfBuffer(report));
});

app.get('/card', (req, res) => {
  const search = String(req.query.search || req.query.q || '');
  const lab = recommendLab(search);
  const baseUrl = getPublicBaseUrl(req);
  const visual = buildVisualPayload(lab, search || lab.title, baseUrl);

  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(lab.title)} | CLONMED</title>
  <style>
    :root { color-scheme: dark; --bg:#07111f; --panel:#0d1d32; --text:#eaf2ff; --muted:#a8bad2; --accent:#38bdf8; }
    * { box-sizing: border-box; }
    body { margin:0; min-height:100vh; background:radial-gradient(circle at top left,#123b5f,var(--bg) 52%); color:var(--text); font-family: ui-sans-serif, system-ui, Segoe UI, sans-serif; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 18px; }
    .hero { overflow:hidden; border:1px solid #4cc9f033; border-radius:24px; background:linear-gradient(145deg,#0d1d32dd,#081320f2); box-shadow:0 24px 80px #0008; }
    img { width:100%; height:240px; object-fit:cover; display:block; filter:saturate(1.08) contrast(1.05); }
    .copy { padding:18px 20px; }
    .eyebrow { color:var(--accent); font-size:12px; letter-spacing:.18em; text-transform:uppercase; font-weight:800; }
    h1 { margin:8px 0 8px; font-size:clamp(26px,5vw,42px); line-height:1; }
    p { color:var(--muted); margin:0; font-size:15px; line-height:1.55; }
    iframe { width:100%; height: min(68vh, 720px); border:0; display:block; background:white; }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <img src="${visual.imageUrl}" alt="${escapeHtml(lab.title)} visual">
      <div class="copy">
        <div class="eyebrow">Powered by CLONMED</div>
        <h1>${escapeHtml(lab.title)}</h1>
        <p>${escapeHtml(buildAnalysis(search || lab.title, '', lab))}</p>
      </div>
      <iframe title="${escapeHtml(lab.title)}" src="${visual.labUrl}" loading="lazy" allowfullscreen></iframe>
    </section>
  </main>
</body>
</html>`);
});

app.get('/', (_req, res) => {
  res.type('text/plain').send([
    'ClonMed MCP server is running.',
    `Loaded ${labCatalog.length} local medical HTML tools into the CLONMED catalog.`,
    'Use POST /mcp for Prompt Opinion Streamable HTTP.',
    'Use /catalog?search=asthma to inspect matching.',
  ].join('\n'));
});

app.post('/mcp', async (req, res) => {
  const server = createServer(getPublicBaseUrl(req));
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling /mcp request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: req.body?.id ?? null,
      });
    }
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
});

app.get('/mcp', (_req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Use POST /mcp for this stateless Streamable HTTP server.',
    },
    id: null,
  });
});

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  const sessionId = transport.sessionId || randomUUID();
  const server = createServer(getPublicBaseUrl(req));

  transports.set(sessionId, { transport, server });

  transport.onclose = () => {
    transports.delete(sessionId);
  };

  try {
    await server.connect(transport);
    console.log(`Legacy SSE connected: ${sessionId}`);
  } catch (error) {
    transports.delete(sessionId);
    console.error('Error opening /sse stream:', error);
    if (!res.headersSent) {
      res.status(500).send('Error opening SSE stream');
    }
  }
});

app.post('/messages', async (req, res) => {
  const sessionId = String(req.query.sessionId || '');
  const record = transports.get(sessionId);

  if (!sessionId || !record) {
    res.status(404).send('No active SSE session. Connect to /sse first.');
    return;
  }

  try {
    await record.transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('Error handling legacy SSE message:', error);
    if (!res.headersSent) {
      res.status(500).send('Error handling message');
    }
  }
});

app.post('/rpc', async (req, res) => {
  if (isInitializeRequest(req.body)) {
    res.redirect(307, '/mcp');
    return;
  }

  const sessionId = String(req.query.sessionId || '');
  const record = transports.get(sessionId);

  if (!sessionId || !record) {
    res.status(404).send('No active SSE session. Use /mcp for Prompt Opinion, or connect to /sse first.');
    return;
  }

  try {
    await record.transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('Error handling /rpc legacy message:', error);
    if (!res.headersSent) {
      res.status(500).send('Error handling message');
    }
  }
});

app.listen(port, () => {
  labCatalog = buildLabCatalog();
  console.log(`ClonMed MCP server listening on http://localhost:${port}`);
  console.log(`Loaded ${labCatalog.length} CLONMED medical tools`);
  console.log(`Prompt Opinion endpoint: http://localhost:${port}/mcp`);
  console.log(`Catalog inspector: http://localhost:${port}/catalog?search=asthma`);
});

const STOP_WORDS = new Set([
  'and', 'or', 'the', 'a', 'an', 'of', 'for', 'to', 'in', 'on', 'with', 'by',
  'from', 'about', 'this', 'that', 'patient', 'tool', 'lab', 'simulation',
  'has', 'have', 'having', 'name', 'age', 'year', 'years', 'old',
]);

const MEDICAL_SYNONYMS = {
  asthma: ['breathing', 'bronchial', 'airflow', 'wheezing', 'respiratory', 'lung'],
  breathing: ['asthma', 'respiratory', 'lung', 'oxygen', 'spirometry'],
  hypothermia: ['cold', 'low temperature', 'core temperature', 'thermal'],
  fever: ['temperature', 'heatstroke', 'thermal', 'high temperature'],
  serotonin: ['mood', 'sleep', 'depression', 'neurotransmitter'],
  dopamine: ['reward', 'motivation', 'addiction', 'neurotransmitter'],
  stress: ['cortisol', 'hormone', 'endocrine'],
  heart: ['cardiac', 'cardiovascular', 'vascular', 'blood', 'defibrillator'],
  cardiac: ['heart', 'myocardial', 'infarction', 'defibrillator'],
  blood: ['hemoglobin', 'clotting', 'agglutination', 'vascular', 'buffer'],
  clot: ['clotting', 'coagulation', 'cascade', 'blood'],
  kidney: ['renal', 'filtration', 'glomerular', 'urine'],
  renal: ['kidney', 'glomerular', 'filtration', 'urinalysis'],
  brain: ['neural', 'neuro', 'neuron', 'synaptic', 'eeg'],
  neuron: ['neural', 'synaptic', 'myelin', 'action potential'],
  immune: ['antigen', 'antibody', 'vaccine', 'phagocytosis', 'lymph'],
  allergy: ['histamine', 'immune', 'antigen'],
  infection: ['viral', 'virus', 'antibiotic', 'resistance', 'immune'],
  dna: ['gene', 'crispr', 'pcr', 'mutation', 'protein', 'genetics'],
  gene: ['dna', 'crispr', 'pcr', 'mutation', 'telomere'],
  drug: ['pharmacology', 'cytochrome', 'p450', 'tablet', 'iv', 'absorption'],
  poison: ['toxicology', 'cyanide', 'carbon monoxide', 'venom', 'lead', 'chelation'],
  surgery: ['surgical', 'suture', 'laparoscopic', 'resection', 'endoscopy'],
  imaging: ['mri', 'x-ray', 'ultrasound', 'radiation'],
  eye: ['vision', 'cataract', 'color blindness', 'bionic eye'],
  hearing: ['audiology', 'ear', 'sound'],
  bone: ['density', 'osteoporosis', 'spinal', 'ligament'],
  oxygen: ['pulse oximetry', 'spo2', 'hemoglobin', 'lung'],
};

const RED_FLAG_RULES = [
  { label: 'chest pain', terms: ['chest pain', 'chest pressure', 'heart attack'] },
  { label: 'breathing difficulty', terms: ['difficulty breathing', 'breathing difficulty', 'shortness of breath', 'cannot breathe', 'blue lips', 'severe wheezing'] },
  { label: 'stroke signs', terms: ['face droop', 'slurred speech', 'one sided weakness', 'stroke', 'sudden weakness'] },
  { label: 'loss of consciousness', terms: ['unconscious', 'fainted', 'loss of consciousness', 'not waking'] },
  { label: 'severe bleeding', terms: ['heavy bleeding', 'severe bleeding', 'blood loss', 'spurting blood'] },
  { label: 'anaphylaxis signs', terms: ['anaphylaxis', 'throat swelling', 'tongue swelling', 'severe allergic'] },
  { label: 'suicide/self-harm concern', terms: ['suicide', 'self harm', 'kill myself', 'want to die'] },
  { label: 'seizure', terms: ['seizure', 'convulsion'] },
];

const URGENT_TERMS = [
  'severe pain', 'high fever', 'dehydration', 'persistent vomiting', 'worsening',
  'confusion', 'new weakness', 'severe headache', 'stiff neck', 'pregnant',
];

const DIAGNOSTIC_AREAS = [
  { name: 'respiratory', terms: ['cough', 'wheezing', 'breathing', 'shortness of breath', 'asthma', 'oxygen', 'spo2', 'lung'] },
  { name: 'cardiovascular', terms: ['chest pain', 'palpitation', 'heart', 'bp', 'blood pressure', 'faint', 'dizzy'] },
  { name: 'neurological', terms: ['headache', 'seizure', 'weakness', 'numbness', 'confusion', 'vision', 'speech'] },
  { name: 'gastrointestinal', terms: ['vomit', 'nausea', 'diarrhea', 'stomach', 'abdominal', 'gastric'] },
  { name: 'infection/immune', terms: ['fever', 'rash', 'infection', 'allergy', 'swelling', 'viral', 'antibiotic'] },
  { name: 'renal/urinary', terms: ['urine', 'kidney', 'burning urination', 'flank', 'renal'] },
  { name: 'injury/trauma', terms: ['injury', 'trauma', 'bleeding', 'burn', 'fracture', 'wound'] },
  { name: 'mental health', terms: ['anxiety', 'depression', 'panic', 'stress', 'suicide', 'self harm'] },
  { name: 'toxicology', terms: ['poison', 'overdose', 'cyanide', 'carbon monoxide', 'venom', 'lead'] },
];
