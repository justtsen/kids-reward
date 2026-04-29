import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SITE_PASSWORD = process.env.SITE_PASSWORD || "318611";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-password");

  if (req.method === "OPTIONS") return res.status(200).end();

  // 驗證密碼
  const pwd = req.headers["x-password"];
  if (pwd !== SITE_PASSWORD) {
    return res.status(401).json({ error: "密碼錯誤" });
  }

  const { kidId } = req.query;
  if (!kidId) return res.status(400).json({ error: "缺少 kidId" });

  const key = `kid:${kidId}`;

  if (req.method === "GET") {
    const data = await redis.get(key);
    return res.status(200).json({ data });
  }

  if (req.method === "POST") {
    await redis.set(key, req.body);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
