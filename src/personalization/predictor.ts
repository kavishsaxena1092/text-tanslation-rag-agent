import { Language } from "../types/Language";
import { buildPrompt } from "./prompt";
import { PredictorConfig, RetrievedEntry } from "./types";
import { embed } from "./embeddings";
import { retrieve } from "./retriever";

const MAX_CTX_CHARS = 200;
const MIN_CTX_FOR_RAG = 6; // skip retrieval for very short contexts
const MIN_RETRIEVED_CTX = 4; // filter empty/near-empty past contexts

/**
 * Extract token deltas from an SSE chunk produced by an OpenAI-compatible
 * chat-completions stream. Sarvam Chat follows the OpenAI shape:
 *   data: {"choices":[{"delta":{"content":"..."}}]}\n\n
 *   data: [DONE]\n\n
 */
const parseSseDeltas = (chunk: string): string[] => {
  const out: string[] = [];
  const lines = chunk.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.indexOf || line.indexOf("data:") !== 0) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const obj = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const delta = obj.choices && obj.choices[0] && obj.choices[0].delta && obj.choices[0].delta.content;
      if (typeof delta === "string" && delta.length > 0) out.push(delta);
    } catch (_e) {
      /* ignore malformed lines */
    }
  }
  return out;
};

export async function* predict(
  currentCtx: string,
  config: PredictorConfig,
  signal: AbortSignal,
): AsyncIterable<string> {
  const trimmedCtx = currentCtx.slice(-MAX_CTX_CHARS);

  // Phase 4: when personalization is on, retrieve the user's most similar past
  // (context, continuation) pairs and inject them as few-shot examples below.
  // Fail-open: if embed or retrieve fail (model still loading, network issue,
  // empty history), we silently fall through with retrieved = [] and the LLM
  // gets the baseline prompt.
  let retrieved: RetrievedEntry[] = [];
  if (
    config.personalization === "on" &&
    trimmedCtx.trim().length >= MIN_CTX_FOR_RAG
  ) {
    try {
      const queryVec = await embed(trimmedCtx);
      const hits = await retrieve(queryVec, config.lang, config.topK ?? 5, {
        minSim: config.minSimilarity,
      });
      // Drop empty/near-empty past contexts — they cluster in embedding space
      // and don't tell the LLM anything useful as few-shot examples.
      retrieved = hits.filter(
        (r) => r.contextText.trim().length >= MIN_RETRIEVED_CTX,
      );
    } catch (err) {
      console.warn(
        "[indic-compose] retrieve failed, falling back to baseline prompt",
        err,
      );
    }
  }

  const { system, messages } = buildPrompt(trimmedCtx, retrieved, config.lang);

  const res = await fetch(config.completeEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, lang: config.lang }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`/complete returned ${res.status}: ${body.slice(0, 200)}`);
  }
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by \n\n — process complete frames, retain partial in buffer
    let sepIdx: number;
    while ((sepIdx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);
      const tokens = parseSseDeltas(frame);
      for (let i = 0; i < tokens.length; i++) yield tokens[i];
    }
  }
  // flush trailing partial (rare but possible)
  if (buffer.length > 0) {
    for (const token of parseSseDeltas(buffer)) {
      yield token;
    }
  }
}

export type { Language };
