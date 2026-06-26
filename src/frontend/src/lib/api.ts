const API_URL = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || '/api/v1');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

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

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

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

    return response.json();
  }
}

export default new ApiClient(API_URL);
