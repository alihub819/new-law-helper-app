export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API routes - use external worker or configure inline
    if (url.pathname.startsWith("/api")) {
      return new Response(JSON.stringify({ 
        message: "API endpoint - deploy Express worker separately or use inline",
        endpoint: url.pathname 
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve static frontend
    try {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status === 404) {
        return await env.ASSETS.fetch(new Request(url.origin + "/index.html"));
      }
      return asset;
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  },
};
