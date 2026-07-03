import { app } from "../server/server.js";
import { connectDB } from "../server/config/db.js";

/**
 * Vercel Serverless Function — catch-all handler.
 *
 * Every request to /api/* and /uploads/* is routed here by vercel.json.
 * The Express app in server/server.js handles the actual routing.
 */

function normalizeRequestUrl(req) {
  const url = req.url || "/";
  // Already correctly prefixed — leave as-is
  if (url.startsWith("/api") || url.startsWith("/uploads")) return;

  // Prefix bare paths with /api so Express routing matches
  req.url = `/api${url.startsWith("/") ? url : `/${url}`}`;
}

function isHealthCheck(req) {
  const pathname = (req.url || "").split("?")[0];
  return pathname === "/" || pathname === "/health" || pathname === "/api/health";
}

export default async function handler(req, res) {
  normalizeRequestUrl(req);

  // Health checks skip the database connection for faster responses
  if (isHealthCheck(req)) {
    return app(req, res);
  }

  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection failed", error);
    return res.status(500).json({
      message:
        "Database connection failed. Check MONGO_URI and MongoDB Atlas network access in Vercel.",
      code: "DATABASE_CONNECTION_FAILED",
    });
  }

  return app(req, res);
}
