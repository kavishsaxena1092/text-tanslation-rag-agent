import { Language } from "../types/Language";

export type HistoryEntry = {
  id: string;
  lang: Language;
  contextText: string;
  continuationText: string;
  embedding: Float32Array | null;
  ts: number;
  source: "commit" | "accept";
};

export type RetrievedEntry = HistoryEntry & { similarity: number };

export type PersonalizationMode = "off" | "on";

export type PredictorConfig = {
  completeEndpoint: string;
  lang: Language;
  personalization: PersonalizationMode;
  contextWindowChars?: number;
  topK?: number;
  minSimilarity?: number;
};
