import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // Tu instancia de axios configurada con el interceptor

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [shift, setShift] = useState(localStorage.getItem('current_shift') || null);
  const [loading, setLoading] = useState(true);

  // Cada vez que la app carga, si hay un token, validamos la sesión y configuramos auto-logout
  useEffect(() => {
    let timeoutId;

    const validateSession = async () => {
      if (token) {
        try {
          // Consultamos el endpoint /auth/me para asegurar que el token es válido
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          scheduleAutoLogout(); // Programamos el cierre de sesión automático
        } catch (error) {
          console.error("Token inválido o expirado", error);
          logout(); // Si el token falló, limpiamos la sesión
        }
      }
      setLoading(false);
    };

    const scheduleAutoLogout = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const currentTotalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      const boundaries = [
        7 * 3600,       // 07:00:00
        14 * 3600,      // 14:00:00
        22 * 3600,      // 22:00:00
        24 * 3600 + 7 * 3600 // 07:00:00 del día siguiente
      ];

      // Encontrar la próxima frontera
      const nextBoundarySeconds = boundaries.find(b => b > currentTotalSeconds);
      
      const timeUntilLogout = (nextBoundarySeconds - currentTotalSeconds) * 1000;

      timeoutId = setTimeout(() => {
        alert("Tu sesión ha finalizado automáticamente por término de turno. Por favor, vuelve a iniciar sesión para continuar.");
        logout();
      }, timeUntilLogout);
    };

    validateSession();

    // Limpiar el timeout cuando se desmonta o cambia el token
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
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