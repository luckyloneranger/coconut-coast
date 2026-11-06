// Settings saved in the browser. Storage can be blocked (private mode), so every
// read and write is guarded and the game simply forgets between visits then.

const PREFIX = 'cc:';

export function loadSetting(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(PREFIX + key) ?? null;
  } catch {
    return null;
  }
}

export function saveSetting(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, value);
  } catch {
    // Not saved this visit; nothing else to do.
  }
}
