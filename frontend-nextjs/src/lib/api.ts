export const API_ROUTES = {
  dashboard: '/api/dashboard',
  instances: '/api/instances',
  instanceQR: (id: string) => `/api/instances/${id}/qr`,
  instanceRestart: (id: string) => `/api/instances/${id}/restart`,
  instanceDisconnect: (id: string) => `/api/instances/${id}/disconnect`,
  instanceDelete: (id: string) => `/api/instances/${id}`,
};

export async function fetchApi(path: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  };

  const response = await fetch(path, defaultOptions);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error! status: ${response.status}. Body: ${text}`);
  }

  return response;
}
