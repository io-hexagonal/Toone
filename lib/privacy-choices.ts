const STORAGE_KEY = "toone-web-analytics-choice-v1";
const CHOICE_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

export const PRIVACY_CHOICE_SAVED_EVENT = "toone:privacy-choice-saved";
export type PrivacyChoice = "allow" | "deny";

export function savedPrivacyChoice(): PrivacyChoice | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    if (
      (record.choice !== "allow" && record.choice !== "deny") ||
      typeof record.at !== "number" ||
      record.at > Date.now() ||
      Date.now() - record.at >= CHOICE_LIFETIME_MS
    ) return null;
    return record.choice;
  } catch {
    return null;
  }
}

export function rememberPrivacyChoice(choice: PrivacyChoice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: Date.now() }));
  } catch {
    // The current choice still applies; private browsing may ask again later.
  }
  window.dispatchEvent(new Event(PRIVACY_CHOICE_SAVED_EVENT));
}
