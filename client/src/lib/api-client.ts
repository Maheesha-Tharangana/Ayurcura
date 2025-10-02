import { apiRequest } from './queryClient';

interface ApiClient {
  get: (url: string) => Promise<Response>;
  post: (url: string, data?: any) => Promise<Response>;
  put: (url: string, data?: any) => Promise<Response>;
  patch: (url: string, data?: any) => Promise<Response>;
  delete: (url: string) => Promise<Response>;
}

export const apiClient: ApiClient = {
  get: (url: string) => apiRequest('GET', url),
  post: (url: string, data?: any) => apiRequest('POST', url, data),
  put: (url: string, data?: any) => apiRequest('PUT', url, data),
  patch: (url: string, data?: any) => apiRequest('PATCH', url, data),
  delete: (url: string) => apiRequest('DELETE', url),
};

// Function to fetch articles with optional count parameter
export async function fetchArticles(count?: number) {
  const url = count ? `/api/articles?count=${count}` : '/api/articles';
  const response = await apiRequest('GET', url);
  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }
  return response.json();
}

// Export apiRequest directly for component use
export { apiRequest };