import { Language } from "../types/Language";
import { HistoryEntry } from "./types";
import { insertEntry, evictOldest, updateEmbedding } from "./db";
import { embed } from "./embeddings";

const CONTEXT_CHARS = 80;
const PER_LANG_CAP = 10000;

const uuid = (): string => {
  const c = typeof crypto !== "undefined" ? (crypto as Crypto & { randomUUID?: () => string }) : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const recordCommit = async (args: {
  lang: Language;
  precedingText: string;
  committedWord: string;
  source?: "commit" | "accept";
}): Promise<void> => {
  if (!args.committedWord) return;

  const entry: HistoryEntry = {
    id: uuid(),
    lang: args.lang,
    contextText: args.precedingText.slice(-CONTEXT_CHARS),
    continuationText: args.committedWord,
    embedding: null,
    ts: Date.now(),
    source: args.source ?? "commit",
  };

  await insertEntry(entry);

  // fire-and-forget: embed the context and persist the vector; typing should
  // never wait on this. Failure leaves the row with embedding: null and the
  // next backfill on assistant mount will pick it up.
  const embedSource = entry.contextText || entry.continuationText;
  if (embedSource) {
    embed(embedSource)
      .then((vec) => updateEmbedding(entry.id, vec))
      .catch((err) =>
        console.warn("[indic-compose] new-row embed failed", err),
      );
  }

  evictOldest(args.lang, PER_LANG_CAP).catch((err) =>
    console.warn("[indic-compose] eviction failed", err),
  );
};
