import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { getApp as getAdminApp, getApps as getAdminApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import firebaseConfig from "./firebase-applet-config.json";
import { validateProofImageDataUrl } from "./src/lib/instapayDomain";

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json({ limit: "25mb" }));

const PROOFS_DIR = path.join(process.cwd(), "uploads", "proofs");
fs.mkdirSync(PROOFS_DIR, { recursive: true });

function getFirebaseAdminAuth() {
  if (!firebaseConfig?.projectId || firebaseConfig.projectId === "remixed-project-id") {
    return null;
  }
  const adminApp = getAdminApps().length
    ? getAdminApp()
    : initializeAdminApp({ projectId: firebaseConfig.projectId });
  return getAdminAuth(adminApp);
}

const mocks = [
  {
    id: "mock-1",
    url: "/api/v1/user/profile",
    method: "GET",
    description: "User profile and authentication session payload",
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    delayMs: 120,
    enabled: true,
    responseBody: JSON.stringify({
      status: "success",
      user: {
        id: "usr_98241",
        name: "Studio Musician",
        email: "musician@maqamir.local",
        role: "creator",
        permissions: ["read", "write", "record", "export"],
      },
      sessionExpiresAt: "2026-12-31T23:59:59Z",
    }),
    sourceType: "SIMULATED_MOCK",
  },
  {
    id: "mock-2",
    url: "/api/v1/analytics/metrics",
    method: "GET",
    description: "System traffic telemetry and crawl stats",
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    delayMs: 80,
    enabled: true,
    responseBody: JSON.stringify({
      totalRequests: 14290,
      interceptedCount: 842,
      cacheHitRate: "94.2%",
      activeSessions: 38,
      bandwidthSavedKb: 45290,
    }),
    sourceType: "SIMULATED_MOCK",
  },
  {
    id: "mock-3",
    url: "/api/v1/checkout/session",
    method: "POST",
    description: "Simulated checkout response",
    statusCode: 201,
    headers: { "Content-Type": "application/json" },
    delayMs: 250,
    enabled: true,
    responseBody: JSON.stringify({
      status: "completed",
      transactionId: "tx_77391942",
      currency: "ILS",
      amount: 39,
    }),
    sourceType: "SIMULATED_MOCK",
  },
];

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    mode: "maqamir-piano-studio",
    aiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY),
    activeMocks: mocks.length,
  });
});

app.get("/api/mocks", (_req, res) => {
  res.json({ success: true, source: "SIMULATED_MOCK_REGISTRY", mocks });
});

app.get("/api/reports", (_req, res) => {
  const safeRead = (rel: string) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
    } catch {
      return null;
    }
  };
  res.json({
    project: safeRead("project-metadata.json"),
    sitemap: safeRead("sitemap.json"),
    assetManifestSummary: (() => {
      const m = safeRead("asset-manifest.json");
      return m
        ? { totalDiscovered: m.totalDiscovered, downloadedCount: m.downloadedCount, byCategory: m.byCategory }
        : null;
    })(),
    interceptedRequestsCount: (safeRead("intercepted-network.json") || []).length,
    comparisonsCount: (safeRead("visual-comparisons.json") || []).length,
  });
});

app.post("/api/ai/assist", async (req, res) => {
  const { prompt, currentScale, currentInstrument, currentRealm } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "A prompt string is required." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured in environment variables.",
    });
  }

  const startedAt = Date.now();

  try {
    const baseContents = `User request: "${prompt}"
Current studio context:
- Scale: ${currentScale || "Rast"}
- Instrument: ${currentInstrument || "Grand Piano"}
- Realm: ${currentRealm || "play"}`;

    const systemInstruction = `You are Amir, the MaqAmir Piano Studio AI music producer & microtonal sound designer.
Help the musician with scale choices (Arabic Maqam, Turkish Makam, Persian Dastgah, Indian Raga, Western modes, K-EDO), instrument selection, realm ideas, and real-time Sonic Engine sound design.
Available instruments: "Grand Piano", "Warm Oud", "Electric Rhodes", "Ney Flute", "Analog Synth", "Sitar & Tanpura", "Bowed Cello", "Crystal Bowls".
Available realms: "play", "piano", "dj", "qiano", "mandala", "guitouch", "cellomir", "silk_river", "sitabla", "vortex", "arabesque", "meend_spiral", "aura_bowls".
Common scales: "Rast", "Bayati", "Hijaz", "Saba", "Nahawand", "Kurd", "Ajam", "Sikah", "Huzam", "Hijaz Kar", "Ussak", "Huseyni", "Segah", "Shur", "Homayun", "Chahargah", "Bhairav", "Yaman", "Bhairavi", "Todi", "Malkauns", "Equal 12-TET", "Dorian", "Phrygian Dominant", "Harmonic Minor", "Pelog Selisir", "24-EDO Quarter-Tone".
Return valid JSON matching the schema. Include numeric sound design values in sonicPatch such as reverbMix (0-100), reverbSize (0.5-10), delayMix (0-100), cutoff (200-18000), tapeDrive (0-100), chorusDepth (0-100), stereoWidth (0-100).`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: "Friendly, concise musical explanation and playing tips (2-4 sentences).",
        },
        recommendedScale: {
          type: Type.STRING,
          description: "Suggested world scale or maqam name.",
        },
        recommendedRoot: {
          type: Type.STRING,
          description: "Suggested root note like C, D, E, F, G, A, B.",
        },
        recommendedInstrument: {
          type: Type.STRING,
          description: "One of the available studio instruments.",
        },
        recommendedRealm: {
          type: Type.STRING,
          description: "One of the available realm IDs.",
        },
        suggestedBpm: {
          type: Type.INTEGER,
          description: "Suggested tempo BPM between 55 and 160.",
        },
        presetName: {
          type: Type.STRING,
          description: "Short evocative name for this sound patch.",
        },
        sonicPatch: {
          type: Type.OBJECT,
          description: "Key Sonic Engine numeric parameter values.",
          properties: {
            reverbMix: { type: Type.NUMBER },
            reverbSize: { type: Type.NUMBER },
            delayMix: { type: Type.NUMBER },
            cutoff: { type: Type.NUMBER },
            tapeDrive: { type: Type.NUMBER },
            chorusDepth: { type: Type.NUMBER },
            stereoWidth: { type: Type.NUMBER },
          },
        },
      },
      required: ["reply", "recommendedScale", "recommendedInstrument", "presetName"],
    };

    const attemptSpecs: Array<{ model: string; thinkingLevel: ThinkingLevel; timeoutMs: number }> = [
      { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW, timeoutMs: 18000 },
      { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 18000 },
      { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 18000 },
    ];

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let lastErr: any = null;
    for (let attempt = 0; attempt < attemptSpecs.length; attempt++) {
      const spec = attemptSpecs[attempt];
      const attemptCtrl = new AbortController();
      const attemptTimer = setTimeout(() => attemptCtrl.abort(), spec.timeoutMs);
      try {
        response = await ai.models.generateContent({
          model: spec.model,
          contents: baseContents,
          config: {
            abortSignal: attemptCtrl.signal,
            thinkingConfig: { thinkingLevel: spec.thinkingLevel },
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
          },
        });
        clearTimeout(attemptTimer);
        break;
      } catch (err: any) {
        clearTimeout(attemptTimer);
        lastErr = err;
        const msg = String(err?.message || "");
        const isTransient =
          err?.name === "AbortError" ||
          err?.status === 503 ||
          err?.status === 429 ||
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("429");
        if (!isTransient || attempt === attemptSpecs.length - 1) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    if (!response) throw lastErr || new Error("No response from Gemini API.");

    const text = (response.text || "{}").trim();
    const parsed = JSON.parse(text);
    return res.json({ ok: true, suggestion: parsed, elapsedMs: Date.now() - startedAt });
  } catch (err: any) {
    const elapsedMs = Date.now() - startedAt;
    const causeMsg = err?.cause?.code || err?.cause?.message || "";
    console.error("Gemini /api/ai/assist error:", elapsedMs, err?.name, err?.message || err, causeMsg);
    let cleanError = err?.message || "Failed to generate AI recommendation.";
    try {
      const inner = JSON.parse(cleanError);
      if (inner?.error?.message) cleanError = inner.error.message;
    } catch {
      // keep raw message
    }
    const status = err?.name === "AbortError" ? 504 : err?.status === 503 ? 503 : 502;
    return res.status(status).json({
      error:
        err?.name === "AbortError"
          ? `Ask Amir timed out waiting for the Gemini API (${elapsedMs}ms).`
          : cleanError,
      elapsedMs,
    });
  }
});

app.post("/api/uploads/proof", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Missing Authorization Bearer token." });
  }
  const adminAuth = getFirebaseAdminAuth();
  if (!adminAuth) {
    return res.status(503).json({ error: "Firebase project is not configured." });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    if (!decoded?.uid || !decoded.email_verified) {
      return res.status(403).json({ error: "Verified user account is required." });
    }
    uid = decoded.uid.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }

  const { dataUrl } = req.body || {};
  const validated = validateProofImageDataUrl(dataUrl);
  if (!validated.ok) {
    const errMsg = "error" in validated ? validated.error : "Invalid proof image.";
    return res.status(400).json({ error: errMsg });
  }

  const safeRand = crypto.randomBytes(6).toString("hex");
  const filename = `proof_${uid}_${Date.now()}_${safeRand}.${validated.ext}`;
  const outPath = path.join(PROOFS_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(validated.bytes));

  return res.json({
    ok: true,
    proofImageUrl: `/api/uploads/proofs/${filename}`,
    mimeType: validated.mimeType,
    sizeBytes: validated.bytes.length,
  });
});

app.get("/api/uploads/proofs/:filename", (req, res) => {
  const raw = req.params.filename || "";
  if (!/^[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(raw)) {
    return res.status(400).json({ error: "Invalid proof filename." });
  }
  const candidate = path.join(PROOFS_DIR, path.basename(raw));
  if (!fs.existsSync(candidate)) {
    return res.status(404).json({ error: "Proof image not found." });
  }
  const ext = path.extname(candidate).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  res.setHeader("Content-Type", mime);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, max-age=86400");
  return res.sendFile(candidate);
});

app.all("/api/mock/*", async (req, res) => {
  const reqPath = req.path.replace(/^\/api\/mock/, "") || "/";
  const method = req.method.toUpperCase();
  const matched = mocks.find(
    (m: any) => m.enabled !== false && m.method === method && (m.url === reqPath || m.url === "/" + reqPath)
  );
  if (!matched) {
    return res.status(404).json({ error: "No mock route matched", method, path: reqPath, simulated: true });
  }
  if (matched.delayMs > 0) await new Promise((r) => setTimeout(r, matched.delayMs));
  res.setHeader("X-Response-Origin", "SIMULATED_MOCK_SERVER");
  try {
    return res.status(matched.statusCode || 200).json(JSON.parse(matched.responseBody));
  } catch {
    return res.status(matched.statusCode || 200).send(matched.responseBody);
  }
});

app.get("/project-files/:id/assets/fonts/:font", (req, res, next) => {
  const safeName = path.basename(req.params.font);
  const candidate = path.join(process.cwd(), "public", safeName);
  if (fs.existsSync(candidate)) {
    return res.sendFile(candidate);
  }
  return next();
});

app.use(express.static(path.join(process.cwd(), "public")));

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom" });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      if (req.path.startsWith("/api/") || path.extname(req.path)) {
        return next();
      }
      try {
        const indexPath = path.join(process.cwd(), "index.html");
        const rawHtml = fs.readFileSync(indexPath, "utf8");
        const html = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MaqAmir Piano Studio listening on http://0.0.0.0:${PORT}`);
  });
}

start();
