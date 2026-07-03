import { app } from "../server/server.js";
import { connectDB } from "../server/config/db.js";

function normalizeRequestUrl(req) {
  const url = req.url || "/";
  if (url.startsWith("/api") || url.startsWith("/uploads")) return;

  req.url = `/api${url.startsWith("/") ? url : `/${url}`}`;
}

export default async function handler(req, res) {
  normalizeRequestUrl(req);
  await connectDB();
  return app(req, res);
}
