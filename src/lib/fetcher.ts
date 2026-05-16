export class FetchError extends Error {
  status: number;
  info: unknown;
  constructor(message: string, status: number, info: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let info: unknown;
    try {
      info = await res.json();
    } catch {
      info = null;
    }
    throw new FetchError(`Fetch failed: ${res.status}`, res.status, info);
  }
  return res.json() as Promise<T>;
}
