const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export function websocketUrl(path: string): string {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = path;
  url.search = '';
  return url.toString();
}

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path));
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}