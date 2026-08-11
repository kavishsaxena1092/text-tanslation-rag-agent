/* eslint-disable @typescript-eslint/camelcase */
import express from "express";
import cors from "cors";
import { Readable } from "node:stream";
import "dotenv/config";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const SARVAM_KEY = process.env.SARVAM_API_KEY;
const SARVAM_CHAT_URL =
  process.env.SARVAM_CHAT_URL || "https://api.sarvam.ai/v1/chat/completions";
const MODEL = process.env.SARVAM_MODEL || "sarvam-30b";

if (!SARVAM_KEY) {
  console.warn(
    "[indic-compose-backend] SARVAM_API_KEY not set — /complete will 500",
  );
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(SARVAM_KEY), model: MODEL });
});

app.post("/complete", async (req, res) => {
  if (!SARVAM_KEY) {
    return res.status(500).json({ error: "SARVAM_API_KEY missing on server" });
  }

  const { system, messages } = req.body ?? {};
  if (!system || !Array.isArray(messages)) {
    return res
      .status(400)
      .json({ error: "expected { system, messages: Array }" });
  }

  let upstream;
  try {
    upstream = await fetch(SARVAM_CHAT_URL, {
      method: "POST",
      headers: {
        // Sarvam Chat is OpenAI-compatible — uses Bearer auth
        // (transliterate uses api-subscription-key; chat does not)
        Authorization: `Bearer ${SARVAM_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: 32,
        temperature: 0.4,
      }),
    });
  } catch (err) {
    console.error("[/complete] upstream fetch failed", err);
    return res.status(502).json({ error: "upstream unreachable" });
  }

  if (!upstream.ok) {
    const body = await upstream.text();
    console.error("[/complete] upstream", upstream.status, body);
    return res.status(upstream.status).json({ error: "upstream error", body });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (!upstream.body) return res.end();

  // pipe Sarvam's SSE stream straight to the browser
  Readable.fromWeb(upstream.body).pipe(res);
  req.on("close", () => {
    try {
      upstream.body?.cancel();
    } catch {
      /* ignore */
    }
  });
});

app.listen(PORT, () => {
  console.log(
    `[indic-compose-backend] listening on http://localhost:${PORT}  (model=${MODEL})`,
  );
});
