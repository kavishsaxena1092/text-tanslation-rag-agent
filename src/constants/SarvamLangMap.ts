import { Language } from "../types/Language";
import { LangObject } from "../types/LangObject";

export const SARVAM_LANG_MAP: Record<string, string> = {
  hi: "hi-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  or: "od-IN",
  pa: "pa-IN",
  ta: "ta-IN",
  te: "te-IN",
};

export const toSarvamLang = (lang: Language): string | null =>
  SARVAM_LANG_MAP[lang] ?? null;

export const SARVAM_LANGUAGES: LangObject[] = [
  { LangCode: "hi", Identifier: "hi", DisplayName: "Hindi - हिंदी",     Direction: "ltr", GoogleFont: "Noto Sans Devanagari", FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "bn", Identifier: "bn", DisplayName: "Bangla - বাংলা",     Direction: "ltr", GoogleFont: "Noto Sans Bengali",    FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "gu", Identifier: "gu", DisplayName: "Gujarati - ગુજરાતી", Direction: "ltr", GoogleFont: "Noto Sans Gujarati",   FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "kn", Identifier: "kn", DisplayName: "Kannada - ಕನ್ನಡ",    Direction: "ltr", GoogleFont: "Noto Sans Kannada",    FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "ml", Identifier: "ml", DisplayName: "Malayalam - മലയാളം", Direction: "ltr", GoogleFont: "Noto Sans Malayalam",  FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "mr", Identifier: "mr", DisplayName: "Marathi - मराठी",   Direction: "ltr", GoogleFont: "Noto Sans Devanagari", FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "or", Identifier: "or", DisplayName: "Odia - ଓଡ଼ିଆ",       Direction: "ltr", GoogleFont: "Noto Sans Oriya",      FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "pa", Identifier: "pa", DisplayName: "Punjabi - ਪੰਜਾਬੀ",   Direction: "ltr", GoogleFont: "Noto Sans Gurmukhi",   FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "ta", Identifier: "ta", DisplayName: "Tamil - தமிழ்",     Direction: "ltr", GoogleFont: "Noto Sans Tamil",      FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
  { LangCode: "te", Identifier: "te", DisplayName: "Telugu - తెలుగు",   Direction: "ltr", GoogleFont: "Noto Sans Telugu",     FallbackFont: "sans-serif", Author: "Sarvam AI", CompiledDate: "", IsStable: true },
];
