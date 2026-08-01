import { Language } from "../types/Language";
import { HistoryEntry } from "./types";

const DB_NAME = "indic-compose";
const DB_VERSION = 1;
const STORE = "writing_history";

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by_lang", "lang", { unique: false });
        store.createIndex("by_ts", "ts", { unique: false });
        store.createIndex("by_lang_ts", ["lang", "ts"], { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
};

const tx = async (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  const db = await openDb();
  return db.transaction(STORE, mode).objectStore(STORE);
};

export const insertEntry = async (entry: HistoryEntry): Promise<void> => {
  const store = await tx("readwrite");
  return new Promise((resolve, reject) => {
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const updateEmbedding = async (
  id: string,
  vec: Float32Array,
): Promise<void> => {
  const store = await tx("readwrite");
  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const row = getReq.result as HistoryEntry | undefined;
      if (!row) return resolve();
      row.embedding = vec;
      const putReq = store.put(row);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const getAllByLang = async (
  lang: Language,
): Promise<HistoryEntry[]> => {
  const store = await tx("readonly");
  return new Promise((resolve, reject) => {
    const req = store.index("by_lang").getAll(lang);
    req.onsuccess = () => resolve(req.result as HistoryEntry[]);
    req.onerror = () => reject(req.error);
  });
};

export const getRecentByLang = async (
  lang: Language,
  limit: number,
): Promise<HistoryEntry[]> => {
  const store = await tx("readonly");
  return new Promise((resolve, reject) => {
    const out: HistoryEntry[] = [];
    const req = store
      .index("by_lang_ts")
      .openCursor(IDBKeyRange.bound([lang, -Infinity], [lang, Infinity]), "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= limit) return resolve(out);
      out.push(cursor.value as HistoryEntry);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
};

export const countByLang = async (lang: Language): Promise<number> => {
  const store = await tx("readonly");
  return new Promise((resolve, reject) => {
    const req = store.index("by_lang").count(lang);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const evictOldest = async (
  lang: Language,
  cap: number,
): Promise<number> => {
  const count = await countByLang(lang);
  if (count <= cap) return 0;
  const toRemove = count - cap;
  const store = await tx("readwrite");
  return new Promise((resolve, reject) => {
    let removed = 0;
    const req = store.index("by_lang_ts").openCursor(
      IDBKeyRange.bound([lang, -Infinity], [lang, Infinity]),
      "next",
    );
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || removed >= toRemove) return resolve(removed);
      cursor.delete();
      removed += 1;
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
};

export const clearWritingHistory = async (): Promise<void> => {
  const store = await tx("readwrite");
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};
