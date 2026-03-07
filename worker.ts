import { getAssetFromKV, NotFoundError } from "@cloudflare/kv-asset-handler";
import { fetchRetry } from "@cloudflare/retry";

import manifest from "__STATIC_CONTENT_MANIFEST";
import type { App } from "express";

declare const __STATIC_CONTENT: string;

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);

      // API routes - forward to Express app
      if (url.pathname.startsWith("/api")) {
        // Import the Express app dynamically
        const { default: app } = await import("./api/index");
        
        // Convert Request to Node-like request
        const headers: Headers = new Headers();
        request.headers.forEach((value, key) => {
          headers.set(key, value);
        });

        // Simple fetch adapter for Express
        const nodeReq = {
          method: request.method,
          headers: headers,
          url: request.url,
          body: request.body ? request.text() : undefined,
        } as any;

        // Create a mock response
        let status = 200;
        let responseHeaders: Record<string, string> = {};
        let responseBody = "";

        const mockRes = {
          statusCode: 200,
          setHeader: (key: string, value: string) => {
            responseHeaders[key] = value;
          },
          send: (body: string) => {
            responseBody = body;
          },
          json: (body: any) => {
            responseBody = JSON.stringify(body);
          },
        } as any;

        // For GET requests without body
        if (request.method === "GET" || request.method === "HEAD") {
            // Try the Express app
            return fetch(request.url, {
                method: request.method,
                headers: request.headers,
            });
        }

        // For other methods, we'd need a full adapter
        // For now, return a simple response
        return new Response(JSON.stringify({ error: "API temporarily unavailable on Cloudflare" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Serve static assets from KV
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      return await getAssetFromKV(
        { request: new Request(`https://example.com${path}`), waitUntil: Promise.resolve() },
        { ASSET_NAMESPACE: __STATIC_CONTENT, ASSET_MANIFEST: manifest }
      );
    } catch (e) {
      if (e instanceof NotFoundError) {
        // Serve index.html for SPA routes
        return await getAssetFromKV(
          { request: new Request("https://example.com/index.html"), waitUntil: Promise.resolve() },
          { ASSET_NAMESPACE: __STATIC_CONTENT, ASSET_MANIFEST: manifest }
        );
      }
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<{ ASSET_NAMESPACE: any }>;
