import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api'; // <-- IMPORTANTE: Usamos nuestra instancia configurada

const useFetch = (url, method = 'GET', body = null, auto = true, headers = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState(null);
  const [trigger, setTrigger] = useState(0);
  
  const prevUrlRef = useRef(null);
  // Memorizamos los headers para evitar bucles infinitos
  const headersRef = useRef(headers);

  // Actualizar la referencia de headers solo si cambian realmente
  useEffect(() => {
    headersRef.current = headers;
  }, [JSON.stringify(headers)]); 

  useEffect(() => {
    // Solo ejecutamos automáticamente si es GET y auto es true
    if (method.toUpperCase() === 'GET' && auto && url) {
      const urlChanged = prevUrlRef.current !== url;
      
      if (urlChanged || trigger > 0) {
        prevUrlRef.current = url;
        
        const fetchData = async () => {
          setLoading(true);
          try {
            // Usamos 'api' en lugar de 'axios'
            const response = await api.get(url, { headers: headersRef.current });
            setData(response.data);
            setError(null);
          } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Error en la solicitud';
            setError(errorMsg);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }
    }
  }, [url, method, auto, trigger]);

  const execute = async (options = {}) => {
    const { 
      body: newBody = null, 
      method: customMethod = method, 
      url: customUrl = url,
      headers: customHeaders = {},
      ...axiosOptions 
    } = options;

    setLoading(true);
    setError(null);
    try {
      // Usamos 'api' en lugar de 'axios'
      const response = await api({
        url: customUrl,
        method: customMethod.toUpperCase(),
        data: customMethod.toUpperCase() !== 'GET' ? newBody : undefined,
        headers: { 
            'Accept': 'application/json',
            ...headersRef.current, 
            ...customHeaders 
        },
        ...axiosOptions,
      });
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error en la solicitud';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetch = useCallback(() => setTrigger(t => t + 1), []);

  return { data, loading, error, execute, refetch };
};

export default useFetch;