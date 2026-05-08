const SAFE_METHODS = /^(GET|HEAD|OPTIONS|TRACE)$/i;

function getCsrfToken(): string | null {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue ? decodeURIComponent(cookieValue) : null;
}

async function refreshToken(): Promise<boolean> {
    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * A custom fetch wrapper that handles cookie-based JWT authentication.
 * - Sends credentials (cookies) with every request
 * - Injects the CSRF token header for all mutating requests
 * - Automatically attempts a token refresh on 401 and retries once
 */
export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    options.credentials = 'include';
    options.headers = { ...(options.headers as Record<string, string>) };

    if (!(options.body instanceof FormData)) {
        (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    if (!SAFE_METHODS.test(options.method || 'GET')) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            (options.headers as Record<string, string>)['X-CSRFToken'] = csrfToken;
        }
    }

    let response = await fetch(url, options);

    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            response = await fetch(url, options);
        } else {
            window.dispatchEvent(new Event('auth-failure'));
        }
    }

    return response;
}
