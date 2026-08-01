// Brute-force cosine-similarity retrieval over the user's recent writing
// history. Vectors stored in `writing_history.embedding` are L2-normalized at
// write time (see `embeddings.ts`), so cosine similarity reduces to a plain
// dot product — no sqrt/divide in the inner loop.
//
// The scan is capped to the most recent MAX_SCAN rows per language to keep the
// sweep fast on the main thread (~5ms at 500 rows × 384 dims). Older rows are
// ignored once the user has accumulated more than MAX_SCAN; recency is the
// right bias for a personalization layer.

import { Language } from "../types/Language";
import { getRecentByLang } from "./db";
import { RetrievedEntry } from "./types";

const MAX_SCAN = 500;
const MIN_SIM_DEFAULT = 0.75;

const cosineSim = (a: Float32Array, b: Float32Array): number => {
  // a and b are L2-normalized → cosine == dot product
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
};

export type RetrieveOptions = {
  minSim?: number;
  maxScan?: number;
};

export const retrieve = async (
  queryVec: Float32Array,
  lang: Language,
  k: number,
  opts: RetrieveOptions = {},
): Promise<RetrievedEntry[]> => {
  const minSim = opts.minSim ?? MIN_SIM_DEFAULT;
  const maxScan = opts.maxScan ?? MAX_SCAN;

  const rows = await getRecentByLang(lang, maxScan);
  const scored: RetrievedEntry[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.embedding) continue;
    const s = cosineSim(queryVec, r.embedding);
    if (s >= minSim) scored.push({ ...r, similarity: s });
  }
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
};
