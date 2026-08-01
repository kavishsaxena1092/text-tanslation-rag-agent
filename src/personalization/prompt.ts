import { Language } from "../types/Language";
import { RetrievedEntry } from "./types";

const LANG_DISPLAY_NAMES: Record<string, string> = {
  hi: "Hindi",
  bn: "Bangla",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  or: "Odia",
  pa: "Punjabi",
  ta: "Tamil",
  te: "Telugu",
};

export type PromptMessage = { role: "user" | "assistant"; content: string };
export type PromptShape = { system: string; messages: PromptMessage[] };

export const buildPrompt = (
  currentCtx: string,
  retrieved: RetrievedEntry[],
  lang: Language,
): PromptShape => {
  const langName = LANG_DISPLAY_NAMES[lang] ?? lang;
  const system = `You are an Indic-language writing assistant. The user is composing text in ${langName}. Continue from where they leave off naturally, matching their style. Output only the continuation — no explanations, no quotes. Maximum 8 words. If unsure, output an empty string.`;

  const messages: PromptMessage[] = [];
  for (const r of retrieved) {
    messages.push({ role: "user", content: r.contextText });
    messages.push({ role: "assistant", content: r.continuationText });
  }
  messages.push({ role: "user", content: currentCtx });

  return { system, messages };
};
