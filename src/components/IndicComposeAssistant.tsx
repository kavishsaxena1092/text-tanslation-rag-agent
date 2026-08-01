import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { IndicTransliterate } from "../index";
import { IndicTransliterateProps } from "../interfaces/Props";
import { recordCommit } from "../personalization/recorder";
import { predict } from "../personalization/predictor";
import { backfillEmbeddings } from "../personalization/backfill";
import { embed, getEmbeddingStatus } from "../personalization/embeddings";
import { retrieve } from "../personalization/retriever";
import { GhostTextOverlay } from "./GhostTextOverlay";

export type IndicComposeAssistantProps = IndicTransliterateProps & {
  /**
   * Backend URL that proxies to the LLM. Required to enable prediction.
   * If omitted, the component behaves like a vanilla IndicTransliterate
   * (no ghost text), but commits are still recorded to IndexedDB.
   */
  completeEndpoint?: string;
  /**
   * Milliseconds of keystroke idle before requesting a prediction.
   * Default 400.
   */
  predictIdleMs?: number;
  /**
   * Minimum length of the input value (trimmed) before predictions fire.
   * Default 4.
   */
  minPredictLength?: number;
  /**
   * Whether to embed committed writing into vectors for future RAG retrieval.
   * Default true. Set to false to skip the ~118 MB model download.
   */
  enableEmbeddings?: boolean;
  /**
   * RAG mode for predictions. "on" retrieves similar past contexts and feeds
   * them as few-shot examples to the LLM; "off" sends the bare current ctx.
   * Default "on".
   */
  personalization?: "off" | "on";
};

export const IndicComposeAssistant = (
  props: IndicComposeAssistantProps,
): JSX.Element => {
  const {
    completeEndpoint,
    predictIdleMs = 400,
    minPredictLength = 4,
    enableEmbeddings = true,
    personalization = "on",
    onWordCommit: userOnWordCommit,
    onKeyDown: userOnKeyDown,
    value,
    onChangeText,
    lang,
    ...rest
  } = props;

  const [ghost, setGhost] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const triggerPrediction = useCallback(
    async (ctx: string) => {
      if (!completeEndpoint) return;
      cancelInFlight();
      const ac = new AbortController();
      abortRef.current = ac;
      setGhost("");
      try {
        let acc = "";
        for await (const token of predict(
          ctx,
          { completeEndpoint, lang, personalization },
          ac.signal,
        )) {
          acc += token;
          setGhost(acc);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.warn("[indic-compose] predict failed", err);
        }
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
      }
    },
    [completeEndpoint, lang, personalization, cancelInFlight],
  );

  useEffect(() => {
    cancelInFlight();
    setGhost("");

    if (!completeEndpoint) return;
    if (value.trim().length < minPredictLength) return;

    idleTimerRef.current = window.setTimeout(() => {
      idleTimerRef.current = null;
      triggerPrediction(value);
    }, predictIdleMs);

    return cancelInFlight;
  }, [
    value,
    completeEndpoint,
    predictIdleMs,
    minPredictLength,
    triggerPrediction,
    cancelInFlight,
  ]);

  useEffect(() => () => cancelInFlight(), [cancelInFlight]);

  // Phase 2: backfill embeddings for any rows missing them. Fire-and-forget;
  // the 118 MB model downloads lazily on the first embed() inside backfill.
  useEffect(() => {
    if (!enableEmbeddings) return;
    backfillEmbeddings(lang).catch((err) =>
      console.warn("[indic-compose] backfill failed", err),
    );
  }, [lang, enableEmbeddings]);

  // Debug surface for console-based verification of Phase 2.
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __indicCompose?: unknown }).__indicCompose = {
      embed,
      getEmbeddingStatus,
      backfillEmbeddings: () => backfillEmbeddings(lang),
      retrieve: (queryVec: Float32Array, k = 5) =>
        retrieve(queryVec, lang, k),
    };
  }, [lang]);

  const handleWordCommit: IndicTransliterateProps["onWordCommit"] = (info) => {
    recordCommit({
      lang: info.lang,
      precedingText: info.precedingText,
      committedWord: info.committedWord,
      source: "commit",
    }).catch((err) =>
      console.warn("[indic-compose] recordCommit failed", err),
    );
    userOnWordCommit?.(info);
  };

  const acceptGhost = () => {
    if (!ghost) return;
    const newValue = value + ghost;
    onChangeText(newValue);
    recordCommit({
      lang,
      precedingText: value,
      committedWord: ghost,
      source: "accept",
    }).catch((err) =>
      console.warn("[indic-compose] recordCommit (accept) failed", err),
    );
    setGhost("");
    cancelInFlight();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === "Tab" && ghost) {
      e.preventDefault();
      acceptGhost();
      return;
    }
    userOnKeyDown?.(
      e as unknown as React.KeyboardEvent<HTMLInputElement>,
    );
  };

  return (
    <div>
      <IndicTransliterate
        {...rest}
        value={value}
        onChangeText={onChangeText}
        lang={lang}
        onWordCommit={handleWordCommit}
        onKeyDown={handleKeyDown}
      />
      <GhostTextOverlay text={ghost} />
    </div>
  );
};
