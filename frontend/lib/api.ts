import axios from 'axios'

export const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'),
  withCredentials: false,
})

// Attach access token to every request
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        const token  = parsed?.state?.token
        if (token) {
          config.headers = config.headers ?? {}
          config.headers['Authorization'] = `Bearer ${token}`
        }
      } catch { /* ignore */ }
    }
  }
  return config
})

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
