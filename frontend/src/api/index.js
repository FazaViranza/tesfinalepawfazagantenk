const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

const getToken = () => localStorage.getItem('umkm_token');

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : null;

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('umkm_token');
      window.dispatchEvent(new Event('umkm:unauthorized'));
    }

    throw new Error(
      data?.message || `HTTP Error ${res.status}`
    );
  }

  return data;
};

export const api = {
  get: (endpoint, params) => {
    const cleanParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== ''
          )
        )
      : {};

    const query = Object.keys(cleanParams).length
      ? `?${new URLSearchParams(cleanParams).toString()}`
      : '';

    return apiFetch(`${endpoint}${query}`);
  },

  post: (endpoint, body) =>
    apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    apiFetch(endpoint, {
      method: 'DELETE',
    }),
};

export default api;
