import { API_BASE_URL } from '../config';

interface ApiOptions extends RequestInit {
  token?: string;
  data?: unknown;
}

async function api<T>(
  endpoint: string,
  { data, token, headers: customHeaders, ...customConfig }: ApiOptions = {},
): Promise<T> {
  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(data && { 'Content-Type': 'application/json' }),
      ...customHeaders,
    },
    ...customConfig,
  };

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: `Request failed with status ${response.status}` };
    }
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export default api;
