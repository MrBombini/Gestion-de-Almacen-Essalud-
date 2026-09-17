import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

/**
 * Custom hook para sincronizar borradores (carrito) en la nube.
 * @param {string} moduleName - Nombre único del módulo (ej. 'supplier_movement')
 * @param {object} initialData - Estructura de datos inicial
 * @param {number} debounceMs - Retraso antes de guardar automáticamente
 * @returns {object} { draftData, setDraftData, clearDraft, saveStatus }
 */
const useRemoteDraft = (moduleName, initialData, debounceMs = 1000) => {
    const [draftData, setDraftData] = useState(initialData);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Usamos una ref para saber si es el primer render y no sobreescribir el borrador del servidor con initialData
    const isFirstRender = useRef(true);
    const timerRef = useRef(null);

    // Cargar el borrador desde el servidor al montar
    useEffect(() => {
        const fetchDraft = async () => {
            try {
                const res = await api.get(`/drafts/${moduleName}`);
                if (res.data && Object.keys(res.data).length > 0) {
                    // Asegurar que si falta algo importante como formData, se tome de initialData
                    setDraftData(prev => ({ ...prev, ...res.data }));
                }
            } catch (error) {
                console.error(`Error loading draft for ${moduleName}:`, error);
            } finally {
                setIsLoaded(true);
            }
        };

        fetchDraft();
    }, [moduleName]);

    // Autoguardado con debounce
    useEffect(() => {
        if (!isLoaded) return; // No guardar antes de haber cargado
        
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        setSaveStatus('saving');

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(async () => {
            try {
                await api.post(`/drafts/${moduleName}`, { draft_data: draftData });
                setSaveStatus('saved');
                
                // Volver a idle después de unos segundos
                setTimeout(() => {
                    setSaveStatus(currentStatus => currentStatus === 'saved' ? 'idle' : currentStatus);
                }, 2000);
            } catch (error) {
                console.error(`Error saving draft for ${moduleName}:`, error);
                setSaveStatus('error');
            }
        }, debounceMs);

        return () => clearTimeout(timerRef.current);
        // Deshabilitamos el lint para dependencias aquí porque solo queremos que se active cuando cambia draftData
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftData]); 

    // Función para descartar explícitamente el borrador
    const clearDraft = async () => {
        try {
            await api.delete(`/drafts/${moduleName}`);
            setDraftData(initialData);
            setSaveStatus('idle');
        } catch (error) {
            console.error(`Error clearing draft for ${moduleName}:`, error);
        }
    };

    return {
        draftData,
        setDraftData,
        clearDraft,
        saveStatus,
        isLoaded
    };
};

export default useRemoteDraft;
