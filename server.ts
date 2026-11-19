import express from "express";
import path from "path";
import fs from "fs";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import { getApp as getAdminApp, getApps as getAdminApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import firebaseConfig from "./firebase-applet-config.json";
import { createApiRouter, createFirestoreRestClient } from "./serverApi";
import { buildRobotsTxt, buildSitemapXml, injectServerMetadata } from "./src/lib/seoMeta";

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.disable("x-powered-by");

function getFirebaseAdminAuth() {
  if (!firebaseConfig?.projectId || firebaseConfig.projectId === "remixed-project-id") {
    return null;
  }
  const adminApp = getAdminApps().length
    ? getAdminApp()
    : initializeAdminApp({ projectId: firebaseConfig.projectId });
  return getAdminAuth(adminApp);
}

const adminAuth = getFirebaseAdminAuth();
const firestoreRest =
  firebaseConfig?.projectId && firebaseConfig?.firestoreDatabaseId
    ? createFirestoreRestClient(firebaseConfig.projectId, firebaseConfig.firestoreDatabaseId)
    : null;

app.use(
  "/api",
  createApiRouter({
    verifyIdToken: adminAuth ? (token) => adminAuth.verifyIdToken(token) : null,
    firestore: firestoreRest,
  })
);

app.get("/robots.txt", (_req, res) => {
  res.status(200).set({ "Content-Type": "text/plain; charset=utf-8" }).send(buildRobotsTxt());
});

app.get("/sitemap.xml", (_req, res) => {
  res.status(200).set({ "Content-Type": "application/xml; charset=utf-8" }).send(buildSitemapXml());
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
        const { html: seoHtml, status } = injectServerMetadata(rawHtml, req.originalUrl);
        const html = await vite.transformIndexHtml(req.originalUrl, seoHtml);
        if (req.path.startsWith("/admin")) {
          res.setHeader("X-Robots-Tag", "noindex, nofollow");
        }
        res.status(status).set({ "Content-Type": "text/html; charset=utf-8" }).end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/") || path.extname(req.path)) {
        return next();
      }
      try {
        const rawHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
        const { html, status } = injectServerMetadata(rawHtml, req.originalUrl);
        if (req.path.startsWith("/admin")) {
          res.setHeader("X-Robots-Tag", "noindex, nofollow");
        }
        res.status(status).set({ "Content-Type": "text/html; charset=utf-8" }).end(html);
      } catch (err) {
        next(err);
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MaqAmir Piano Studio listening on http://0.0.0.0:${PORT}`);
  });
}

start();
