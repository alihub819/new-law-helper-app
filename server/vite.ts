import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Hard dynamic imports for dev-only dependencies to prevent production crashes
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { nanoid } = await import("nanoid");
  const viteConfig = (await import("../vite.config")).default;
  const viteLogger = createLogger();

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const possiblePaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public")
  ];

  let finalPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      finalPath = p;
      break;
    }
  }

  try {
    log(`DEBUG: /var/task contents: ${fs.readdirSync("/var/task").join(", ")}`, "vite");
    if (fs.existsSync("/var/task/server")) {
      log(`DEBUG: /var/task/server contents: ${fs.readdirSync("/var/task/server").join(", ")}`, "vite");
    }
  } catch (e) {
    log(`DEBUG: Error listing directories: ${e}`, "vite");
  }

  if (!finalPath) {
    log(`Warning: Could not find static build directory after checking: ${possiblePaths.join(", ")}`, "vite");
    // Fallback for API-only operation or debug
    app.get("/", (_req, res) => {
      res.send("<h1>Server is running</h1><p>Static assets missing. Check logs.</p>");
    });
    return;
  }

  log(`Serving static files from: ${finalPath}`, "vite");
  app.use(express.static(finalPath));

  app.use("*", (_req, res) => {
    const indexPath = path.resolve(finalPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend build not found.");
    }
  });
}
