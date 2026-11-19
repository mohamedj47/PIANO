import express, { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  MONTHLY_DURATION_MS,
  isValidProofFilename,
  validateProofImageDataUrl,
} from './src/lib/instapayDomain';

export interface DecodedUserToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

export type VerifyIdTokenFn = (idToken: string) => Promise<DecodedUserToken>;

export interface FirestoreDocResult {
  ok: boolean;
  status: number;
  fields?: Record<string, unknown>;
  error?: string;
}

export interface FirestoreCommitResult {
  ok: boolean;
  status: number;
  error?: string;
}

export interface FirestoreRestClient {
  projectId: string;
  databaseId: string;
  getDocument: (collectionPath: string, docId: string, idToken: string) => Promise<FirestoreDocResult>;
  commitWrites: (writes: Array<Record<string, unknown>>, idToken: string) => Promise<FirestoreCommitResult>;
}

export type AiGeneratorFn = (params: {
  prompt: string;
  currentScale?: string;
  currentInstrument?: string;
  currentRealm?: string;
}) => Promise<Record<string, unknown>>;

export interface ServerApiDeps {
  verifyIdToken: VerifyIdTokenFn | null;
  firestore: FirestoreRestClient | null;
  aiGenerator?: AiGeneratorFn | null;
  proofsDir?: string;
  bootstrapAdminEmail?: string;
  nowMs?: () => number;
  disableAiRateLimitForTest?: boolean;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function isValidFirestoreId(id: string): boolean {
  return typeof id === 'string' && VALID_ID_REGEX.test(id);
}

/**
 * In-memory sliding window rate limiter keyed by caller identity / IP.
 */
export class SlidingWindowRateLimiter {
  private readonly buckets = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    private readonly nowFn: () => number = () => Date.now()
  ) {}

  consume(key: string): { allowed: boolean; retryAfterSec: number; remaining: number } {
    const now = this.nowFn();
    const cutoff = now - this.windowMs;
    const prev = this.buckets.get(key) || [];
    const active = prev.filter((ts) => ts > cutoff);

    if (active.length >= this.maxRequests) {
      this.buckets.set(key, active);
      const oldest = active[0] ?? now;
      const retryAfterSec = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      return { allowed: false, retryAfterSec, remaining: 0 };
    }

    active.push(now);
    this.buckets.set(key, active);
    if (this.buckets.size > 5000) {
      // Opportunistic sweep of stale keys
      for (const [k, list] of this.buckets.entries()) {
        if (list.length === 0 || list[list.length - 1] <= cutoff) {
          this.buckets.delete(k);
        }
      }
    }

    return {
      allowed: true,
      retryAfterSec: 0,
      remaining: Math.max(0, this.maxRequests - active.length),
    };
  }
}

export function decodeFirestoreValue(val: unknown): unknown {
  if (!val || typeof val !== 'object') return null;
  const v = val as Record<string, unknown>;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return String(v.stringValue);
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return String(v.timestampValue);
  if ('mapValue' in v) {
    const mv = (v.mapValue as { fields?: Record<string, unknown> }) || {};
    return decodeFirestoreFields(mv.fields || {});
  }
  if ('arrayValue' in v) {
    const av = (v.arrayValue as { values?: unknown[] }) || {};
    return (av.values || []).map(decodeFirestoreValue);
  }
  return null;
}

export function decodeFirestoreFields(fields: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeFirestoreValue(v);
  }
  return out;
}

export function encodeFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((item) => encodeFirestoreValue(item)) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) fields[k] = encodeFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function encodeFirestoreFields(obj: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = encodeFirestoreValue(v);
    }
  }
  return fields;
}

export function createFirestoreRestClient(projectId: string, databaseId: string): FirestoreRestClient {
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(databaseId)}/documents`;

  return {
    projectId,
    databaseId,
    async getDocument(collectionPath: string, docId: string, idToken: string): Promise<FirestoreDocResult> {
      const cleanCol = collectionPath.replace(/^\/+|\/+$/g, '');
      const url = `${baseUrl}/${cleanCol}/${encodeURIComponent(docId)}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!resp.ok) {
        let errMsg = `Firestore HTTP ${resp.status}`;
        try {
          const body = (await resp.json()) as { error?: { message?: string } };
          if (body?.error?.message) errMsg = body.error.message;
        } catch {
          // ignore
        }
        return { ok: false, status: resp.status, error: errMsg };
      }
      const docJson = (await resp.json()) as { fields?: Record<string, unknown> };
      return {
        ok: true,
        status: 200,
        fields: decodeFirestoreFields(docJson.fields || {}),
      };
    },

    async commitWrites(writes: Array<Record<string, unknown>>, idToken: string): Promise<FirestoreCommitResult> {
      const resp = await fetch(`${baseUrl}:commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ writes }),
      });
      if (!resp.ok) {
        let errMsg = `Firestore commit HTTP ${resp.status}`;
        try {
          const body = (await resp.json()) as { error?: { message?: string } };
          if (body?.error?.message) errMsg = body.error.message;
        } catch {
          // ignore
        }
        return { ok: false, status: resp.status, error: errMsg };
      }
      return { ok: true, status: 200 };
    },
  };
}

export function createDefaultAiGenerator(): AiGeneratorFn | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return async ({ prompt, currentScale, currentInstrument, currentRealm }) => {
    const baseContents = `User request: "${prompt}"
Current studio context:
- Scale: ${currentScale || 'Rast'}
- Instrument: ${currentInstrument || 'Grand Piano'}
- Realm: ${currentRealm || 'play'}`;

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
          description: 'Friendly, concise musical explanation and playing tips (2-4 sentences).',
        },
        recommendedScale: {
          type: Type.STRING,
          description: 'Suggested world scale or maqam name.',
        },
        recommendedRoot: {
          type: Type.STRING,
          description: 'Suggested root note like C, D, E, F, G, A, B.',
        },
        recommendedInstrument: {
          type: Type.STRING,
          description: 'One of the available studio instruments.',
        },
        recommendedRealm: {
          type: Type.STRING,
          description: 'One of the available realm IDs.',
        },
        suggestedBpm: {
          type: Type.INTEGER,
          description: 'Suggested tempo BPM between 55 and 160.',
        },
        presetName: {
          type: Type.STRING,
          description: 'Short evocative name for this sound patch.',
        },
        sonicPatch: {
          type: Type.OBJECT,
          description: 'Key Sonic Engine numeric parameter values.',
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
      required: ['reply', 'recommendedScale', 'recommendedInstrument', 'presetName'],
    };

    const attemptSpecs: Array<{ model: string; thinkingLevel: ThinkingLevel; timeoutMs: number }> = [
      { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, timeoutMs: 18000 },
      { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 18000 },
      { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 18000 },
    ];

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let lastErr: unknown = null;
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
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
        clearTimeout(attemptTimer);
        break;
      } catch (err: unknown) {
        clearTimeout(attemptTimer);
        lastErr = err;
        const e = err as { name?: string; status?: number; message?: string };
        const msg = String(e?.message || '');
        const isTransient =
          e?.name === 'AbortError' ||
          e?.status === 503 ||
          e?.status === 429 ||
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429');
        if (!isTransient || attempt === attemptSpecs.length - 1) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    if (!response) {
      throw lastErr instanceof Error ? lastErr : new Error('No response from Gemini API.');
    }

    const text = (response.text || '{}').trim();
    return JSON.parse(text) as Record<string, unknown>;
  };
}

export function isActiveProUserFields(fields: Record<string, unknown>, nowMs: number): boolean {
  const plan = String(fields.subscriptionPlan || 'free');
  const status = String(fields.subscriptionStatus || 'free');
  if (status !== 'active') return false;
  if (plan === 'pro_lifetime') return true;
  if (plan === 'pro_monthly') {
    const expRaw = fields.subscriptionExpiresAt;
    if (typeof expRaw !== 'string' || !expRaw) return false;
    const expMs = Date.parse(expRaw);
    return Number.isFinite(expMs) && expMs > nowMs;
  }
  return false;
}

export function createApiRouter(deps: ServerApiDeps): Router {
  const router = Router();
  const proofsDir = path.resolve(deps.proofsDir || path.join(process.cwd(), 'uploads', 'proofs'));
  fs.mkdirSync(proofsDir, { recursive: true });

  const nowFn = deps.nowMs || (() => Date.now());
  const bootstrapAdmin = (deps.bootstrapAdminEmail || 'mohamedmaqled66@gmail.com').toLowerCase();

  const uploadLimiter = new SlidingWindowRateLimiter(10, 15 * 60 * 1000, nowFn);
  const proofReadLimiter = new SlidingWindowRateLimiter(60, 5 * 60 * 1000, nowFn);
  const aiLimiter = new SlidingWindowRateLimiter(15, 5 * 60 * 1000, nowFn);
  const approveLimiter = new SlidingWindowRateLimiter(30, 5 * 60 * 1000, nowFn);

  const smallJsonParser = express.json({ limit: '64kb' });
  const uploadJsonParser = express.json({ limit: '3mb' });

  function getClientIp(req: Request): string {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.trim()) {
      return fwd.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  async function requireVerifiedAuth(
    req: Request,
    res: Response
  ): Promise<{ uid: string; email: string; token: string } | null> {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match || !match[1].trim()) {
      res.status(401).json({ error: 'Authentication required (Bearer token missing).' });
      return null;
    }
    if (!deps.verifyIdToken) {
      res.status(503).json({ error: 'Authentication service is unavailable.' });
      return null;
    }
    try {
      const decoded = await deps.verifyIdToken(match[1].trim());
      if (!decoded?.uid || !decoded.email_verified) {
        res.status(403).json({ error: 'Verified Google account is required.' });
        return null;
      }
      if (!isValidFirestoreId(decoded.uid)) {
        res.status(403).json({ error: 'Invalid authenticated user identifier.' });
        return null;
      }
      return {
        uid: decoded.uid,
        email: String(decoded.email || ''),
        token: match[1].trim(),
      };
    } catch {
      res.status(401).json({ error: 'Invalid or expired authentication token.' });
      return null;
    }
  }

  async function isCallerVerifiedAdmin(
    caller: { uid: string; email: string; token: string }
  ): Promise<boolean> {
    if (caller.email && caller.email.toLowerCase() === bootstrapAdmin) {
      return true;
    }
    if (!deps.firestore) return false;
    const adminDoc = await deps.firestore.getDocument('admins', caller.uid, caller.token);
    return adminDoc.ok;
  }

  function enforceRateLimit(
    limiter: SlidingWindowRateLimiter,
    key: string,
    res: Response
  ): boolean {
    const check = limiter.consume(key);
    if (!check.allowed) {
      res.setHeader('Retry-After', String(check.retryAfterSec));
      res.status(429).json({
        error: 'Too many requests. Please wait before retrying.',
        retryAfterSec: check.retryAfterSec,
      });
      return false;
    }
    return true;
  }

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: 'maqamir-piano-studio',
      aiConfigured: Boolean(deps.aiGenerator ?? (process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY)),
    });
  });

  // Disabled legacy mock and report endpoints
  router.all(['/mocks', '/mock', '/mock/*', '/reports'], (_req, res) => {
    res.status(404).json({ error: 'Endpoint is disabled.' });
  });

  // Pro-gated Ask Amir AI assistant
  router.post('/ai/assist', smallJsonParser, async (req, res) => {
    const ip = getClientIp(req);
    const caller = await requireVerifiedAuth(req, res);
    if (!caller) return;

    if (!deps.disableAiRateLimitForTest) {
      if (!enforceRateLimit(aiLimiter, `ai:${caller.uid}:${ip}`, res)) return;
    }

    if (!deps.firestore) {
      return res.status(503).json({ error: 'Database verification service unavailable.' });
    }

    const userDoc = await deps.firestore.getDocument('users', caller.uid, caller.token);
    if (!userDoc.ok || !userDoc.fields) {
      return res.status(403).json({
        error: 'Ask Amir AI requires an active Pro Monthly or Pro Lifetime subscription.',
        code: 'PRO_SUBSCRIPTION_REQUIRED',
      });
    }

    if (!isActiveProUserFields(userDoc.fields, nowFn())) {
      return res.status(403).json({
        error: 'Ask Amir AI requires an active non-expired Pro subscription.',
        code: 'PRO_SUBSCRIPTION_REQUIRED',
      });
    }

    const { prompt, currentScale, currentInstrument, currentRealm } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'A non-empty prompt string is required.' });
    }
    if (prompt.trim().length > 1200) {
      return res.status(400).json({ error: 'Prompt exceeds 1200 character limit.' });
    }

    const aiGen = deps.aiGenerator !== undefined ? deps.aiGenerator : createDefaultAiGenerator();
    if (!aiGen) {
      return res.status(503).json({
        error: 'AI assistant is not configured on the server.',
      });
    }

    const startedAt = nowFn();
    try {
      const suggestion = await aiGen({
        prompt: prompt.trim(),
        currentScale: typeof currentScale === 'string' ? currentScale.slice(0, 80) : undefined,
        currentInstrument: typeof currentInstrument === 'string' ? currentInstrument.slice(0, 80) : undefined,
        currentRealm: typeof currentRealm === 'string' ? currentRealm.slice(0, 80) : undefined,
      });
      return res.json({ ok: true, suggestion, elapsedMs: Math.max(0, nowFn() - startedAt) });
    } catch (err: unknown) {
      const e = err as { name?: string; status?: number; message?: string };
      const elapsedMs = Math.max(0, nowFn() - startedAt);
      console.error('AI /api/ai/assist failure:', elapsedMs, e?.name || 'Error');
      const status = e?.name === 'AbortError' ? 504 : e?.status === 503 ? 503 : 502;
      return res.status(status).json({
        error:
          e?.name === 'AbortError'
            ? `Ask Amir timed out waiting for the AI service (${elapsedMs}ms).`
            : 'Failed to generate AI recommendation.',
        elapsedMs,
      });
    }
  });

  // Upload private InstaPay proof image (outside public/, authenticated, magic-bytes validated, rate-limited)
  router.post('/uploads/proof', uploadJsonParser, async (req, res) => {
    const ip = getClientIp(req);
    const caller = await requireVerifiedAuth(req, res);
    if (!caller) return;

    if (!enforceRateLimit(uploadLimiter, `upload:${caller.uid}:${ip}`, res)) return;

    const { dataUrl } = req.body || {};
    const validated = validateProofImageDataUrl(dataUrl);
    if (!validated.ok) {
      const errMsg = 'error' in validated ? validated.error : 'Invalid proof image.';
      return res.status(400).json({ error: errMsg });
    }

    const safeRand = crypto.randomBytes(8).toString('hex');
    const filename = `proof_${caller.uid}_${nowFn()}_${safeRand}.${validated.ext}`;
    if (!isValidProofFilename(filename)) {
      return res.status(400).json({ error: 'Unable to construct valid proof filename.' });
    }

    const outPath = path.resolve(proofsDir, filename);
    if (!outPath.startsWith(proofsDir + path.sep)) {
      return res.status(400).json({ error: 'Invalid proof destination path.' });
    }
    fs.writeFileSync(outPath, Buffer.from(validated.bytes));

    const proofImageUrl = `/api/uploads/proofs/${filename}`;

    // Best-effort immutable audit log for proof upload
    if (deps.firestore && caller.email) {
      const logDocPath = `projects/${deps.firestore.projectId}/databases/${deps.firestore.databaseId}/documents/payment_audit_logs/upload_${nowFn()}_${safeRand}`;
      await deps.firestore
        .commitWrites(
          [
            {
              currentDocument: { exists: false },
              update: {
                name: logDocPath,
                fields: encodeFirestoreFields({
                  action: 'proof_uploaded',
                  requestId: filename,
                  orderNumber: '-',
                  userId: caller.uid,
                  userEmail: caller.email,
                  planType: 'proof_upload',
                  amount: validated.bytes.length,
                  currency: 'BYTES',
                  referenceNumber: '-',
                  adminUid: '',
                  adminEmail: '',
                  note: `Uploaded proof image (${validated.mimeType}, ${validated.bytes.length} bytes)`,
                }),
              },
              updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
            },
          ],
          caller.token
        )
        .catch(() => {});
    }

    return res.json({
      ok: true,
      proofImageUrl,
      mimeType: validated.mimeType,
      sizeBytes: validated.bytes.length,
    });
  });

  // Private authenticated streaming of proof images (Owner or Verified Admin ONLY)
  router.get('/uploads/proofs/:filename', async (req, res) => {
    const ip = getClientIp(req);
    const caller = await requireVerifiedAuth(req, res);
    if (!caller) return;

    if (!enforceRateLimit(proofReadLimiter, `proofread:${caller.uid}:${ip}`, res)) return;

    const rawFilename = String(req.params.filename || '');
    if (
      rawFilename.includes('..') ||
      rawFilename.includes('/') ||
      rawFilename.includes('\\') ||
      !isValidProofFilename(rawFilename)
    ) {
      return res.status(400).json({ error: 'Invalid proof filename.' });
    }

    const requestId = String(req.query.requestId || '');
    if (!isValidFirestoreId(requestId)) {
      return res.status(403).json({
        error: 'Valid payment requestId is required to authorize proof access.',
      });
    }

    if (!deps.firestore) {
      return res.status(503).json({ error: 'Database verification service unavailable.' });
    }

    // Read payment_requests/{requestId} using caller's verified JWT (Firestore rules also enforce ownership/admin)
    const reqDoc = await deps.firestore.getDocument('payment_requests', requestId, caller.token);
    if (!reqDoc.ok) {
      if (reqDoc.status === 404) {
        return res.status(404).json({ error: 'Payment request not found.' });
      }
      return res.status(403).json({ error: 'Forbidden: you are not authorized to view this proof.' });
    }

    const fields = reqDoc.fields || {};
    const expectedUrl = `/api/uploads/proofs/${rawFilename}`;
    if (String(fields.proofImageUrl || '') !== expectedUrl) {
      return res.status(403).json({
        error: 'Forbidden: requested file does not match the specified payment request.',
      });
    }

    const isOwner = String(fields.userId || '') === caller.uid;
    const isAdmin = isOwner ? false : await isCallerVerifiedAdmin(caller);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions for proof image.' });
    }

    const candidate = path.resolve(proofsDir, path.basename(rawFilename));
    if (!candidate.startsWith(proofsDir + path.sep)) {
      return res.status(400).json({ error: 'Invalid proof file path.' });
    }
    if (!fs.existsSync(candidate)) {
      return res.status(404).json({ error: 'Proof image file not found.' });
    }

    const ext = path.extname(candidate).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(candidate)}"`);
    return res.sendFile(candidate);
  });

  // Server-authoritative InstaPay payment approval (computes 30-day expiry from server clock)
  router.post('/payments/approve', smallJsonParser, async (req, res) => {
    const ip = getClientIp(req);
    const caller = await requireVerifiedAuth(req, res);
    if (!caller) return;

    if (!enforceRateLimit(approveLimiter, `approve:${caller.uid}:${ip}`, res)) return;

    if (!deps.firestore) {
      return res.status(503).json({ error: 'Database verification service unavailable.' });
    }

    const isAdmin = await isCallerVerifiedAdmin(caller);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: verified Admin access required.' });
    }

    const { requestId, adminConfirmedTransfer } = req.body || {};
    if (!isValidFirestoreId(String(requestId || ''))) {
      return res.status(400).json({ error: 'Valid requestId is required.' });
    }
    if (adminConfirmedTransfer !== true) {
      return res.status(400).json({
        error: 'Explicit admin confirmation checklist is required before approving.',
      });
    }

    const reqDoc = await deps.firestore.getDocument('payment_requests', requestId, caller.token);
    if (!reqDoc.ok || !reqDoc.fields) {
      return res.status(reqDoc.status === 404 ? 404 : 403).json({
        error: reqDoc.error || 'Payment request not found.',
      });
    }

    const reqData = reqDoc.fields;
    if (String(reqData.status || '') !== 'pending') {
      return res.status(409).json({ error: 'Payment request has already been processed.' });
    }

    const planType = String(reqData.planType || '');
    if (planType !== 'pro_monthly' && planType !== 'pro_lifetime') {
      return res.status(400).json({ error: 'Invalid subscription plan on payment request.' });
    }

    const amount = Number(reqData.amount || 0);
    const priceSnapshot =
      reqData.priceSnapshot !== undefined ? Number(reqData.priceSnapshot) : amount;
    if (!Number.isFinite(amount) || amount <= 0 || amount !== priceSnapshot) {
      return res.status(400).json({
        error: 'Payment amount mismatch against locked price snapshot.',
      });
    }

    const targetUid = String(reqData.userId || '');
    const referenceKey = String(reqData.referenceKey || '');
    const orderNumber = String(reqData.orderNumber || '');
    const userEmail = String(reqData.userEmail || '');
    const currency = String(reqData.currency || '');
    const referenceNumber = String(reqData.referenceNumber || '');

    if (!isValidFirestoreId(targetUid) || !referenceKey) {
      return res.status(400).json({ error: 'Malformed payment request target or reference key.' });
    }

    const userDoc = await deps.firestore.getDocument('users', targetUid, caller.token);
    if (!userDoc.ok || !userDoc.fields) {
      return res.status(404).json({ error: 'Target user account does not exist.' });
    }

    const existingUser = userDoc.fields;
    if (
      String(existingUser.subscriptionPlan || '') === 'pro_lifetime' &&
      String(existingUser.subscriptionStatus || '') === 'active' &&
      planType === 'pro_monthly'
    ) {
      return res.status(409).json({
        error: 'User already holds an active Pro Lifetime subscription; cannot downgrade to Monthly.',
      });
    }

    const refDoc = await deps.firestore.getDocument('used_references', referenceKey, caller.token);
    if (refDoc.ok && refDoc.fields) {
      const refStatus = String(refDoc.fields.status || 'approved');
      if (refStatus !== 'pending' || String(refDoc.fields.requestId || '') !== requestId) {
        return res.status(409).json({
          error: 'Transaction reference number has already been used for another request.',
        });
      }
    }

    // Trusted server-clock 30-day expiration calculation
    const serverNowMs = nowFn();
    let nextExpiryDate: Date | null = null;
    if (planType === 'pro_monthly') {
      const curExpStr =
        typeof existingUser.subscriptionExpiresAt === 'string'
          ? existingUser.subscriptionExpiresAt
          : '';
      const curExpMs = curExpStr ? Date.parse(curExpStr) : NaN;
      const baseMs =
        String(existingUser.subscriptionPlan || '') === 'pro_monthly' &&
        String(existingUser.subscriptionStatus || '') === 'active' &&
        Number.isFinite(curExpMs) &&
        curExpMs > serverNowMs
          ? curExpMs
          : serverNowMs;
      nextExpiryDate = new Date(baseMs + MONTHLY_DURATION_MS);
    }

    const docPrefix = `projects/${deps.firestore.projectId}/databases/${deps.firestore.databaseId}/documents`;

    const writes: Array<Record<string, unknown>> = [
      {
        currentDocument: { exists: true },
        update: {
          name: `${docPrefix}/payment_requests/${requestId}`,
          fields: encodeFirestoreFields({
            status: 'approved',
            rejectionReason: '',
            adminConfirmedTransfer: true,
            reviewedBy: caller.uid,
            reviewedByEmail: caller.email,
            priceSnapshot,
          }),
        },
        updateMask: {
          fieldPaths: [
            'status',
            'rejectionReason',
            'adminConfirmedTransfer',
            'reviewedBy',
            'reviewedByEmail',
            'priceSnapshot',
          ],
        },
        updateTransforms: [
          { fieldPath: 'reviewedAt', setToServerValue: 'REQUEST_TIME' },
          { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
        ],
      },
      refDoc.ok && refDoc.fields
        ? {
            currentDocument: { exists: true },
            update: {
              name: `${docPrefix}/used_references/${referenceKey}`,
              fields: encodeFirestoreFields({
                status: 'approved',
                approvedBy: caller.uid,
              }),
            },
            updateMask: { fieldPaths: ['status', 'approvedBy'] },
            updateTransforms: [
              { fieldPath: 'approvedAt', setToServerValue: 'REQUEST_TIME' },
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
            ],
          }
        : {
            currentDocument: { exists: false },
            update: {
              name: `${docPrefix}/used_references/${referenceKey}`,
              fields: encodeFirestoreFields({
                referenceKey,
                referenceNumber,
                requestId,
                orderNumber,
                userId: targetUid,
                status: 'approved',
                approvedBy: caller.uid,
              }),
            },
            updateTransforms: [
              { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
              { fieldPath: 'approvedAt', setToServerValue: 'REQUEST_TIME' },
            ],
          },
      {
        delete: `${docPrefix}/pending_locks/${targetUid}`,
      },
      {
        currentDocument: { exists: true },
        update: {
          name: `${docPrefix}/users/${targetUid}`,
          fields: encodeFirestoreFields({
            subscriptionPlan: planType,
            subscriptionStatus: 'active',
            subscriptionExpiresAt: nextExpiryDate,
            renewalNoticeDismissed: false,
          }),
        },
        updateMask: {
          fieldPaths: [
            'subscriptionPlan',
            'subscriptionStatus',
            'subscriptionExpiresAt',
            'renewalNoticeDismissed',
          ],
        },
        updateTransforms: [
          { fieldPath: 'subscriptionStartedAt', setToServerValue: 'REQUEST_TIME' },
          { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
        ],
      },
      {
        currentDocument: { exists: false },
        update: {
          name: `${docPrefix}/payment_audit_logs/approved_${requestId}`,
          fields: encodeFirestoreFields({
            action: 'approved',
            requestId,
            orderNumber,
            userId: targetUid,
            userEmail,
            planType,
            amount,
            currency,
            referenceNumber,
            adminUid: caller.uid,
            adminEmail: caller.email,
            note: `Verified & approved payment (${amount} ${currency}, snapshot verified)`,
          }),
        },
        updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
      },
      {
        currentDocument: { exists: false },
        update: {
          name: `${docPrefix}/payment_audit_logs/activated_${requestId}`,
          fields: encodeFirestoreFields({
            action: 'subscription_activated',
            requestId,
            orderNumber,
            userId: targetUid,
            userEmail,
            planType,
            amount,
            currency,
            referenceNumber,
            adminUid: caller.uid,
            adminEmail: caller.email,
            note:
              planType === 'pro_lifetime'
                ? 'Activated Pro Lifetime (permanent)'
                : `Activated Pro Monthly (server-clock 30d until ${nextExpiryDate?.toISOString().slice(0, 10)})`,
          }),
        },
        updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
      },
    ];

    const commitRes = await deps.firestore.commitWrites(writes, caller.token);
    if (!commitRes.ok) {
      return res.status(commitRes.status === 403 ? 403 : 400).json({
        error: commitRes.error || 'Failed to commit server-verified payment approval.',
      });
    }

    return res.json({
      ok: true,
      requestId,
      planType,
      subscriptionExpiresAt: nextExpiryDate ? nextExpiryDate.toISOString() : null,
    });
  });

  router.get('/analytics-config', (_req: Request, res: Response) => {
    const raw =
      process.env.VITE_GA4_MEASUREMENT_ID ||
      process.env.GA4_MEASUREMENT_ID ||
      '';
    const trimmed = raw.trim();
    const ga4MeasurementId = /^G-[A-Z0-9]+$/i.test(trimmed) ? trimmed : null;
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.json({ ga4MeasurementId });
  });

  return router;
}
