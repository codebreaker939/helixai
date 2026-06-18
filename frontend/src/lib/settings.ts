export interface Settings {
  refreshInterval: number;
  notifications: boolean;
  compactMode: boolean;
}

const KEY = "helixai-settings";
const defaults: Settings = { refreshInterval: 15_000, notifications: true, compactMode: false };

export function getSettings(): Settings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("helixai-settings", { detail: settings }));
}
