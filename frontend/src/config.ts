// Environment-aware API configuration
// In development, defaults to http://localhost:8000
// In production (Vercel), uses VITE_API_URL pointing to Render backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
