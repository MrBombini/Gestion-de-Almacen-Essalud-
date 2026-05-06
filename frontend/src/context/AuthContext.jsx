import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // Tu instancia de axios configurada con el interceptor

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [shift, setShift] = useState(localStorage.getItem('current_shift') || null);
  const [loading, setLoading] = useState(true);

  // Cada vez que la app carga, si hay un token, validamos la sesión
  useEffect(() => {
    const validateSession = async () => {
      if (token) {
        try {
          // Consultamos el endpoint /auth/me para asegurar que el token es válido
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error("Token inválido o expirado", error);
          logout(); // Si el token falló, limpiamos la sesión
        }
      }
      setLoading(false);
    };

    validateSession();
  }, [token]);

  // Función de Login
  const login = async (operator_code, password, shift_selected) => {
    try {
      // Hacemos el POST al endpoint documentado
      const response = await api.post('/auth/login', {
        operator_code,
        password,
        shift: shift_selected
      });

      const { token: newToken, user: userData, current_shift } = response.data;

      // 1. Guardamos en el navegador
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('current_shift', current_shift);

      // 2. Guardamos en el estado de React
      setToken(newToken);
      setUser(userData);
      setShift(current_shift);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Credenciales incorrectas o error en el servidor.' 
      };
    }
  };

  // Función de Logout
  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error("Error cerrando sesión en el backend", error);
    } finally {
      // Siempre limpiamos el navegador, incluso si el backend falla
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_shift');
      setToken(null);
      setUser(null);
      setShift(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      shift, 
      isAuthenticated: !!token, 
      loading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);