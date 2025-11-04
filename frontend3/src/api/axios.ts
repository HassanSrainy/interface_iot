import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Export the root backend base so other modules can call root endpoints (csrf, login)
export const rootBase = baseURL.replace(/\/$/, '');

// Root axios instance (for root endpoints like /sanctum/csrf-cookie, /login)
export const rootApi = axios.create({
  baseURL: rootBase,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  headers: { 
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
});

// Attach Authorization header from localStorage token if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('api_token');
    if (token) {
      // Don't reassign headers to a plain object (Axios types expect AxiosHeaders).
      if (!config.headers) {
        // safe cast when headers may be undefined in the incoming config
        (config as any).headers = {};
      }
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore localStorage errors
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('API Response:', { 
      url: response.config.url, 
      status: response.status,
      data: response.data 
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Central helper to ensure CSRF cookie is present for root backend domain.
// Other modules (login, register, etc.) should call this before issuing write requests
// that require VerifyCsrfToken. It is idempotent and returns once the cookie exists.
export async function ensureCsrf(): Promise<void> {
  try {
    if (typeof document !== 'undefined' && document.cookie.includes('XSRF-TOKEN')) {
      return;
    }

    // Try primary host
    let res = await rootApi.get('/sanctum/csrf-cookie');

    // If no cookie is visible in document.cookie after the request, try an alternate host
    // (handles 127.0.0.1 vs localhost mismatches in dev).
    if (typeof document !== 'undefined' && !document.cookie.includes('XSRF-TOKEN')) {
      const altHost = rootBase.includes('127.0.0.1') ? rootBase.replace('127.0.0.1', 'localhost') : rootBase.replace('localhost', '127.0.0.1');
      try {
        await axios.get(`${altHost}/sanctum/csrf-cookie`, { withCredentials: true });
      } catch (err) {
        // ignore - we'll surface error below if cookie still missing
      }
    }

    // small pause to allow browser to populate cookie store (defensive)
    await new Promise(resolve => setTimeout(resolve, 50));
  } catch (err) {
    console.error('ensureCsrf() failed:', err);
    throw err;
  }
}

export default api;
