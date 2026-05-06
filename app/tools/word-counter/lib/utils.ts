export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function saveTolocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("localStorage save failed:", error);
  }
}

export function loadFromlocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("localStorage load failed:", error);
    return null;
  }
}
