import "./polyfill";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { registerRoutes } from "./routes";
import fs from 'fs';
import { setupVite, serveStatic, log } from "./vite";
import { ensureDatabase } from "./init-db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health check endpoint for Render / load balancer health probes
// It also exercises DB connectivity via the existing ensureDatabase helper.
import { ensureDatabase } from "./init-db";
app.get("/health", async (_req, res) => {
  try {
    await ensureDatabase();
    res.json({ status: "ok", service: "VEREDICTA Backend", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "unhealthy", service: "VEREDICTA Backend", timestamp: new Date().toISOString(), error: (err as any)?.message ?? String(err) });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize routes and server asynchronously
const initPromise: Promise<void> = (async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Only set up Vite dev middleware in development, after all routes
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (!isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Setup static serving for production directly in index.ts
  // Be robust about multiple possible public output directories (Render's layout varies)
  if (isProduction) {
    const publicPaths = [
      path.resolve(__dirname, "public"), // server/public
      path.resolve(process.cwd(), "dist/public"), // dist/public
      path.resolve(process.cwd(), "server/public"), // server/public
    ];
    let served = false;
    for (const p of publicPaths) {
      try {
        if (fs.existsSync(p)) {
          app.use(express.static(p));
          app.get("*", (_req, res) => {
            res.sendFile(path.join(p, "index.html"));
          });
          log(`Serving static from ${p}`);
          served = true;
          break;
        }
      } catch {
        // ignore and try next path
      }
    }
    if (!served) {
      log("No static public path found for production; falling back to default behavior may cause 404s for SPA routes.");
    }
  }

// Bind to PORT if provided (Render/Open environments). This helps ensure the app stays alive
// in hosted environments that require a port, while allowing serverless environments to continue
// to work where PORT may not be set.
const deployPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
if (deployPort) {
  server.listen({ port: deployPort, host: "0.0.0.0" }, () => {
    log(`serving on port ${deployPort}`);
  });
} else {
  log("No PORT environment variable found; server may be running in a serverless environment or misconfigured.");
}
})();

// Async handler for Vercel serverless: waits for init before handling requests.
// This ensures the cold-start initialization completes on the first request.
export const handler = async (req: Request, res: Response) => {
  await initPromise;
  app(req, res);
};

// Export the Express app for Vercel Serverless
export default app;
