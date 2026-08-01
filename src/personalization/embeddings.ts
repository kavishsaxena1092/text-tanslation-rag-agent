// Lazy-loaded embedding pipeline. The 30 MB `@xenova/transformers` library
// only loads when an embedding is actually requested, so consumers using just
// `IndicTransliterate` (no personalization) pay zero cost.
//
// On first call, the multilingual-e5-small model (~118 MB) is downloaded from
// the HuggingFace CDN and cached by the browser. Subsequent calls in the same
// session reuse the in-memory pipeline; subsequent sessions reuse the cache.

export type EmbeddingStatus = "idle" | "loading" | "ready" | "error";

// `Pipeline` is the type of a transformers.js inference function. We avoid
// importing the type statically so consumers don't need the package in their
// build graph; we treat the pipeline as a callable returning {data: Float32Array | number[]}.
type EmbedderFn = (
  text: string,
  options: { pooling: "mean" | "cls"; normalize: boolean },
) => Promise<{ data: ArrayLike<number> }>;

let pipelinePromise: Promise<EmbedderFn> | null = null;
let status: EmbeddingStatus = "idle";

const getEmbedder = async (): Promise<EmbedderFn> => {
  if (pipelinePromise) return pipelinePromise;
  status = "loading";
  pipelinePromise = (async () => {
    // Load transformers.js from a CDN as a native browser ESM. This bypasses
    // CRA 4's Babel pass entirely — CRA's webpack can't transpile the package's
    // class-field syntax (neither the `src/` nor the minified `dist/` works
    // through CRA 4's node_modules Babel preset). The `webpackIgnore: true`
    // magic comment tells webpack to leave this import alone; the browser
    // executes it as a native dynamic import against the URL.
    const CDN_URL = "https://esm.sh/@xenova/transformers@2.17.2";
    const transformers = (await import(
      /* webpackIgnore: true */ /* @vite-ignore */
      CDN_URL
    )) as {
      pipeline: (task: string, model: string) => Promise<EmbedderFn>;
      env?: {
        allowLocalModels?: boolean;
        allowRemoteModels?: boolean;
        remoteHost?: string;
        useBrowserCache?: boolean;
        backends?: { onnx?: { wasm?: { wasmPaths?: string } } };
      };
    };

    // Force transformers.js to load model files only from HuggingFace's CDN.
    // Default `allowLocalModels: true` makes it probe `<origin>/Xenova/...`
    // first; the dev server's SPA fallback returns index.html for unknown
    // paths, transformers.js tries to JSON.parse the HTML, and crashes.
    if (transformers.env) {
      transformers.env.allowLocalModels = false;
      transformers.env.allowRemoteModels = true;
      transformers.env.remoteHost = "https://huggingface.co/";
      transformers.env.useBrowserCache = true;
      if (transformers.env.backends?.onnx?.wasm) {
        transformers.env.backends.onnx.wasm.wasmPaths =
          "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/";
      }
    }

    const pipe = await transformers.pipeline(
      "feature-extraction",
      "Xenova/multilingual-e5-small",
    );
    status = "ready";
    return pipe;
  })();
  pipelinePromise.catch(() => {
    status = "error";
  });
  return pipelinePromise;
};

export const embed = async (text: string): Promise<Float32Array> => {
  const pipe = await getEmbedder();
  // e5 family expects "query: " prefix for retrieval queries
  const out = await pipe(`query: ${text}`, {
    pooling: "mean",
    normalize: true,
  });
  return new Float32Array(out.data as ArrayLike<number>);
};

export const getEmbeddingStatus = (): EmbeddingStatus => status;
