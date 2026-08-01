import { Language } from "../types/Language";
import { getAllByLang, updateEmbedding } from "./db";
import { embed } from "./embeddings";

// Serial loop, re-entrancy-guarded. Backfills embeddings for any rows in
// writing_history whose `embedding` field is null. Runs on assistant mount.
//
// We pick contextText as the embedding source (falling back to continuationText
// if context is empty, e.g. start-of-document commits) — this matches how the
// retriever in Phase 3 will query: "find past contexts that look like the
// current context".

let inFlight = false;

export const backfillEmbeddings = async (lang: Language): Promise<number> => {
  if (inFlight) return 0;
  inFlight = true;
  let filled = 0;
  try {
    const rows = await getAllByLang(lang);
    const pending = rows.filter((r) => !r.embedding);
    for (let i = 0; i < pending.length; i++) {
      const row = pending[i];
      try {
        const text = row.contextText || row.continuationText;
        if (!text) continue;
        const vec = await embed(text);
        await updateEmbedding(row.id, vec);
        filled++;
      } catch (err) {
        console.warn("[indic-compose] backfill row failed", row.id, err);
      }
    }
  } finally {
    inFlight = false;
  }
  return filled;
};
