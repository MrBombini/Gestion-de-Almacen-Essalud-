import axios from 'axios';

// Creamos la instancia con la URL base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.central-oxigeno.site/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // CRÍTICO para Laravel Sanctum y HTTPS:
  withCredentials: true, 
});

// Interceptor Request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 1. Limpiamos la basura que causa el bucle
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('current_shift'); // Tu context también usa esto
      
      // 2. LA SOLUCIÓN: Verificamos que NO estemos ya en el login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/') {
        // En vez de recargar toda la página a la fuerza, 
        // simplemente enviamos a la URL
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;