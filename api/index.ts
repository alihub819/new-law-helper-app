let app: any;
try {
  const mod = await import("../server/index.js");
  app = mod.default || (mod as any).app || mod;
} catch (e: any) {
  console.error("Function load error:", e);
  app = (req: any, res: any) => {
    res.status(500).json({ error: "Function failed to load", details: e?.message || String(e), stack: e?.stack });
  };
}
export default app;