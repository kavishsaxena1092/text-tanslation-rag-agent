import { Language } from "../types/Language";
import { toSarvamLang } from "../constants/SarvamLangMap";

type Config = {
  showCurrentWordAsLastSuggestion?: boolean;
  lang?: Language;
};

type CacheEntry = {
  suggestions: string[];
  frequency: number;
};

const MAX_CACHE_SIZE = 10000;
const SAVE_THRESHOLD = 20;
const CACHE_KEY = "transliterationCache";

const cache: Record<string, Record<string, CacheEntry>> = loadCacheFromLocalStorage();
let newEntriesCount = 0;

function loadCacheFromLocalStorage(): Record<string, Record<string, CacheEntry>> {
  const cachedData = localStorage.getItem(CACHE_KEY);
  return cachedData ? JSON.parse(cachedData) : {};
}

function saveCacheToLocalStorage() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

const getWordWithLowestFrequency = (
  dictionary: Record<string, CacheEntry>,
): string | null => {
  let lowestFreqWord: string | null = null;
  let lowestFreq = Infinity;

  for (const word in dictionary) {
    if (dictionary[word].frequency < lowestFreq) {
      lowestFreq = dictionary[word].frequency;
      lowestFreqWord = word;
    }
  }

  return lowestFreqWord;
};

export const getTransliterateSuggestions = async (
  word: string,
  customApiURL: string,
  apiKey: string,
  config?: Config,
): Promise<string[] | undefined> => {
  const { showCurrentWordAsLastSuggestion = true, lang = "hi" } = config || {};

  const sarvamLang = toSarvamLang(lang);
  if (!sarvamLang) {
    return showCurrentWordAsLastSuggestion ? [word] : [];
  }

  if (!cache[lang]) {
    cache[lang] = {};
  }

  const cacheKey = word.toLowerCase();
  if (cache[lang][cacheKey]) {
    cache[lang][cacheKey].frequency += 1;
    return cache[lang][cacheKey].suggestions;
  }

  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: word,
      source_language_code: "en-IN",
      target_language_code: sarvamLang,
    }),
  };

  try {
    const res = await fetch(customApiURL, requestOptions);
    const data = await res.json();
    const transliterated: string | undefined = data?.transliterated_text;

    if (!transliterated) {
      return showCurrentWordAsLastSuggestion ? [word] : [];
    }

    const found = showCurrentWordAsLastSuggestion
      ? [transliterated, word]
      : [transliterated];

    if (Object.keys(cache[lang]).length >= MAX_CACHE_SIZE) {
      const lowestFreqWord = getWordWithLowestFrequency(cache[lang]);
      if (lowestFreqWord) {
        delete cache[lang][lowestFreqWord];
      }
    }

    cache[lang][cacheKey] = {
      suggestions: found,
      frequency: 1,
    };

    newEntriesCount += 1;
    if (newEntriesCount >= SAVE_THRESHOLD) {
      saveCacheToLocalStorage();
      newEntriesCount = 0;
    }

    return found;
  } catch (e) {
    console.error("There was an error with transliteration", e);
    return showCurrentWordAsLastSuggestion ? [word] : [];
  }
};

window.addEventListener("beforeunload", saveCacheToLocalStorage);
