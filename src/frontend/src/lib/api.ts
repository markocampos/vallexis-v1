const API_URL = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || '/api/v1');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401 && !isRetry && endpoint !== 'auth/login' && endpoint !== 'auth/register' && endpoint !== 'auth/refresh') {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, true);
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody && errBody.error) {
          errorMessage = errBody.error;
        } else if (errBody && Array.isArray(errBody.errors)) {
          errorMessage = errBody.errors.join(', ');
        }
      } catch {
        // Not a JSON response or parsing failed, fallback to default status error
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async upload<T>(endpoint: string, formData: FormData, isRetry = false): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers: Record<string, string> = {};
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (response.status === 401 && !isRetry) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.upload<T>(endpoint, formData, true);
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody && errBody.error) {
          errorMessage = errBody.error;
        } else if (errBody && Array.isArray(errBody.errors)) {
          errorMessage = errBody.errors.join(', ');
        }
      } catch {
        // Not a JSON response
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }
    return response.json();
  }
}

export default new ApiClient(API_URL);
