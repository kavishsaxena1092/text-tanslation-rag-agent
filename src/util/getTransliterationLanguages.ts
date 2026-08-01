import { LangObject } from "../types/LangObject";
import { SARVAM_LANGUAGES } from "../constants/SarvamLangMap";

export const getTransliterationLanguages = async (): Promise<
  LangObject[] | undefined
> => {
  return SARVAM_LANGUAGES;
};
