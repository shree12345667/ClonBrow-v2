/**
 * ClonMedic MCP Edge Function
 * Serverless MCP endpoint for Netlify Edge
 * Version: 2.0.0
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-ID"
};

const CONFIG = {
  version: "2.0.0",
  netlifyBase: "https://taupe-druid-86622d.netlify.app",
  heartbeatInterval: 15000
};

// Lab routing configuration
const LAB_ROUTES = {
  trauma: "/trauma_lab.html",
  cardiac: "/cardiac_sim.html",
  surgical: "/surgical_lab.html",
  default: "/default.html"
};

export default async (request, context) => {
  const url = new URL(request.url);
  const timestamp = new Date().toISOString();

  // 1. CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: CORS_HEADERS 
    });
  }

  // 2. SSE Endpoint - Server-Sent Events for MCP
  if (url.pathname.endsWith("/sse") && request.method === "GET") {
    let timerId;
    const sessionId = crypto.randomUUID();
    
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send MCP Tool Manifest
        const manifest = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            tools: [{
              name: "get_clinical_lab",
              description: "Retrieves a secure, context-appropriate clinical simulation laboratory link based on medical condition or specialty.",
              inputSchema: {
                type: "object",
                properties: {
                  condition: { 
                    type: "string", 
                    enum: ["trauma", "cardiac", "surgical", "default"],
                    description: "Medical condition or specialty area for the simulation"
                  },
                  patientId: {
                    type: "string",
                    description: "Optional patient identifier for session tracking"
                  }
                },
                required: ["condition"]
              }
            }]
          }
        };
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(manifest)}\n\n`));
        
        // Log connection
        console.log(`[${timestamp}] SSE Connection: ${sessionId}`);

        // Keep-alive heartbeat
        timerId = setInterval(() => {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }, CONFIG.heartbeatInterval);
      },
      cancel() {
        clearInterval(timerId);
        console.log(`[${timestamp}] SSE Disconnected: ${sessionId}`);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...CORS_HEADERS
      }
    });
  }

  // 3. RPC Endpoint - Tool Execution
  if (url.pathname.endsWith("/rpc") && request.method === "POST") {
    try {
      const body = await request.json();
      const { method, params, id = 1 } = body;

      if (!method) {
        return Response.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32600, message: "Invalid Request: method required" }
        }, { status: 400, headers: CORS_HEADERS });
      }

      if (method === "get_clinical_lab") {
        const condition = params?.condition?.toLowerCase() || "default";
        const patientId = params?.patientId || "EDGE-ANON-001";
        
        // Validate condition
        if (!LAB_ROUTES[condition]) {
          return Response.json({
            jsonrpc: "2.0",
            id,
            error: { 
              code: -32602, 
              message: `Invalid params: condition must be one of ${Object.keys(LAB_ROUTES).join(", ")}` 
            }
          }, { status: 400, headers: CORS_HEADERS });
        }
        
        const labPath = LAB_ROUTES[condition];
        const labUrl = `${CONFIG.netlifyBase}${labPath}?patient=${encodeURIComponent(patientId)}&ts=${Date.now()}`;
        
        console.log(`[${timestamp}] Lab Request: ${condition} -> ${labPath} (Patient: ${patientId})`);
        
        return Response.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{
              type: "text",
              text: `## 🏥 Clinical Simulation Ready\n\n| **Parameter** | **Value** |\n|--------------|-----------|\n| **Condition** | \`${condition}\` |\n| **Patient ID** | \`${patientId}\` |\n| **Lab URL** | [Open Simulation](${labUrl}) |\n| **Session** | \`${crypto.randomUUID().slice(0, 8)}\` |\n\n**Direct Link:** ${labUrl}`
            }]
          }
        }, { headers: CORS_HEADERS });
      }
      
      return Response.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      }, { status: 404, headers: CORS_HEADERS });
      
    } catch (err) {
      console.error(`[${timestamp}] RPC Error:`, err.message);
      return Response.json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: Invalid JSON payload" }
      }, { status: 400, headers: CORS_HEADERS });
    }
  }

  // 4. Health Check
  if (url.pathname === "/health" || url.pathname === "/") {
    return Response.json({
      status: "operational",
      version: CONFIG.version,
      region: context.geo?.region || "unknown",
      timestamp,
      endpoints: ["/sse", "/rpc", "/health"]
    }, { headers: CORS_HEADERS });
  }

  // 404 Fallback
  return Response.json({
    error: "Not Found",
    available_endpoints: ["/sse", "/rpc", "/health"]
  }, { status: 404, headers: CORS_HEADERS });
};