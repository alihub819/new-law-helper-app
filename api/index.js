import app, { handler } from "../dist/server.js";

// Export the async handler for Vercel serverless functions.
// The handler waits for the server initialization promise before processing requests,
// which is critical for cold starts on Vercel.
export default handler || app;
