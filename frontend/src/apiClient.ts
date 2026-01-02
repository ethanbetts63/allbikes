import { jwtDecode } from 'jwt-decode';

// Type for the decoded token to check expiration
interface DecodedToken {
    exp: number;
}

/**
 * A wrapper for the /api/token/refresh/ endpoint.
 * This function is separate to avoid circular dependencies and infinite loops.
 */
async function refreshToken(): Promise<{ access: string } | null> {
    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
        return null;
    }

    try {
        // Check if the refresh token is also expired
        const decoded: DecodedToken = jwtDecode(currentRefreshToken);
        if (decoded.exp * 1000 < Date.now()) {
            console.error("Refresh token expired.");
            return null;
        }
    } catch (e) {
        console.error("Could not decode refresh token.", e);
        return null;
    }

    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: currentRefreshToken }),
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        localStorage.setItem('accessToken', data.access);
        return data;

    } catch (error) {
        console.error("Error during token refresh:", error);
        return null;
    }
}


/**
 * A custom fetch wrapper that handles JWT authentication and token refreshing.
 * @param url The API endpoint to call.
 * @param options The fetch options.
 * @returns A Promise that resolves to the Response.
 */
export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // 1. Get token and attach it to headers
    let accessToken = localStorage.getItem('accessToken');

    options.headers = options.headers || {};
    (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
    if (accessToken) {
        (options.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    // 2. Make the initial request
    let response = await fetch(url, options);

    // 3. Check for 401 error
    if (response.status === 401) {
        // Try to refresh the token
        const newTokens = await refreshToken();

        if (newTokens) {
            // 4a. If refresh successful, retry the original request with the new token
            accessToken = newTokens.access;
            (options.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
            
            console.log("Token refreshed, retrying original request...");
            response = await fetch(url, options);
        } else {
            // 4b. If refresh fails, trigger a global logout event
            console.error("Token refresh failed. Logging out.");
            window.dispatchEvent(new Event('auth-failure'));
        }
    }

    return response;
}
