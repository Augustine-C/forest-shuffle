export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
        ...options,
        credentials: 'same-origin',
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || `Request failed (${response.status})`);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}
