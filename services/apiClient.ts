// services/apiClient.ts
import { API_BASE_URL } from '../config';

interface ApiOptions extends RequestInit {
  token?: string;
  data?: unknown;
}

async function apiClient<T>(
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

  const responseText = await response.text();

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch (e) {
      errorData = { message: responseText || `Request failed with status ${response.status}` };
    }
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204 || !responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText);
}

export default apiClient;
