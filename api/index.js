export default async function (req, res) {
  try {
    const serverModule = await import("../dist/server.js");
    const handler = serverModule.handler || serverModule.default;
    
    if (handler) {
      await handler(req, res);
    } else {
      res.status(500).json({ error: "No handler found in server.js" });
    }
  } catch (error) {
    console.error("Vercel Function Initialization Error:", error);
    res.status(500).json({
      error: "Vercel Function Initialization Error",
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}
