import { useState, useEffect } from 'react';
import { MdLocalHospital, MdSave, MdHistory, MdSwapCalls, MdAssignment, MdQrCodeScanner } from 'react-icons/md';
import AsyncSelect from 'react-select/async';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import useRemoteDraft from '../hooks/useRemoteDraft';
import api from '../services/api';

const PeripheryExchange = () => {
  const { shift } = useAuth();
  
  // Mantenemos solo el useFetch para guardar la transacción
  const { execute, loading: actionLoading } = useFetch('/inventory/periphery-exchange', 'POST', null, false);

  const initialDraft = {
    formData: {
      service_id: '',
      reference_document: '',
      shift: shift || 'Morning',
      cylinders_in: [],
      cylinders_out: [],
      notes: ''
    },
    selectedServiceOption: null
  };

  const { draftData, setDraftData, clearDraft, saveStatus, isLoaded } = useRemoteDraft('periphery_exchange', initialDraft);

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Derivar formData y selectedServiceOption del draft
  const formData = draftData?.formData || initialDraft.formData;
  const selectedServiceOption = draftData?.selectedServiceOption || initialDraft.selectedServiceOption;

  // Funciones para actualizar el draft en lugar de setState
  const setFormData = (newData) => {
    setDraftData(prev => ({
      ...prev,
      formData: typeof newData === 'function' ? newData(prev.formData) : newData
    }));
  };

  const setSelectedServiceOption = (newOption) => {
    setDraftData(prev => ({
      ...prev,
      selectedServiceOption: newOption
    }));
  };

  // ==========================================
  // CARGA ASÍNCRONA DE SERVICIOS (PERIFERIE)
  // ==========================================
  const loadServiceOptions = async (inputValue) => {
    try {
      const searchParam = inputValue && inputValue.length >= 2 ? `?search=${inputValue}` : '';
      const response = await api.get(`/services${searchParam}`);
      const data = response.data.data || response.data || [];
      
      return data
        .filter(s => s.type === 'PERIFERIE')
        .map(s => ({ value: s.id, label: s.name }));
    } catch (error) {
      console.error('Error buscando servicios periféricos:', error);
      return [];
    }
  };

  // Funciones auxiliares de reglas de negocio
  const isValidOwnership = (name) => {
    if (!name) return true; 
    const upperName = name.toUpperCase();
    return !upperName.includes('PROPIO') && !upperName.includes('PACIENTE');
  };

  const isOxygen = (gasType) => {
    if (!gasType) return false;
    const lower = gasType.toLowerCase();
    return lower.includes('oxi') || lower.includes('oxí');
  };

  // ==========================================
  // CARGA ASÍNCRONA DE CILINDROS (Filtro Estricto)
  // ==========================================
  const loadCylinderOptions = async (inputValue, type) => {
    try {
      // Optimizamos la consulta al backend según lo que estemos buscando
      let statusParam = '';
      if (type === 'OUT') statusParam = '&status=full'; // Para enviar, deben estar llenos en almacén

      const searchParam = inputValue && inputValue.length >= 2 ? `&search=${inputValue}` : '';
      const response = await api.get(`/cylinders?per_page=40${statusParam}${searchParam}`);
      const data = response.data.data || response.data || [];

      const filteredData = data.filter(c => {
        // Reglas Universales de Periferia
        if (!isOxygen(c.gas_type)) return false;
        if (!isValidOwnership(c.ownership_type?.name)) return false;
        
        const cap = Number(c.capacity);
        if (cap < 8 || cap > 10) return false;

        // Reglas Específicas por Dirección (In/Out)
        if (type === 'IN') {
          // Deben ser balones que actualmente están asignados a ese hospital
          return c.current_service_id === formData.service_id;
        } else {
          // OUT: Deben estar llenos y no estar asignados a ningún hospital actualmente (en almacén libre)
          return c.status === 'full' && !c.current_service_id;
        }
      });

      return filteredData.map(c => ({
        value: c.id,
        label: `${c.serial_number} (${Number(c.capacity)}m³) [${c.ownership_type?.name || 'S/D'}]`
      }));
    } catch (error) {
      console.error('Error buscando cilindros:', error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!formData.service_id) return setErrorMessage('Selecciona el Hospital Periférico.');
    if (formData.cylinders_in.length === 0 && formData.cylinders_out.length === 0) {
      return setErrorMessage('Debes registrar al menos una entrada o salida.');
    }

    try {
      await execute({
        body: {
          ...formData,
          cylinders_in: formData.cylinders_in.map(c => c.value),
          cylinders_out: formData.cylinders_out.map(c => c.value)
        }
      });

      setSuccessMessage('¡Canje de red registrado con éxito!');
      await clearDraft();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error en el registro.');
    }
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      padding: '5px',
      borderRadius: '0.75rem',
      borderColor: '#cbd5e1',
      boxShadow: 'none',
      '&:hover': { borderColor: '#6366f1' }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#f5f3ff',
      borderRadius: '0.5rem',
      color: '#4338ca',
      fontWeight: 'bold'
    })
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <MdSwapCalls className="text-3xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Canje de Red (Periferia)</h2>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <MdAssignment /> Despacho masivo para hospitales externos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
           <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Turno Actual</span>
           <span className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-sm font-black shadow-sm">{shift}</span>
        </div>
      </div>

      {(successMessage || errorMessage) && (
        <div className={`p-4 rounded-xl font-medium border-l-4 animate-fade-in ${successMessage ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
          {successMessage || errorMessage}
        </div>
      )}

      {isLoaded && !successMessage && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              saveStatus === 'saving' ? 'bg-amber-100 text-amber-700' :
              saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-700' :
              saveStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-500'
            }`}>
              {saveStatus === 'saving' ? 'Guardando en la nube...' :
               saveStatus === 'saved' ? 'Guardado en la nube' :
               saveStatus === 'error' ? 'Error al guardar' :
               'Borrador sincronizado'}
            </span>
            <span className="text-sm font-medium text-slate-500">
              Carrito de Periferia
            </span>
          </div>
          <button
            type="button"
            onClick={() => clearDraft()}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors"
          >
            Descartar Borrador
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="space-y-6">
        
        {/* INFO GENERAL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hospital de Origen (Red)</label>
              <AsyncSelect 
                cacheOptions
                defaultOptions
                loadOptions={loadServiceOptions}
                styles={customStyles} 
                isClearable
                placeholder="-- Buscar Hospital Periférico --"
                value={selectedServiceOption}
                onChange={(s) => {
                  setSelectedServiceOption(s);
                  // Si cambiamos de hospital, limpiamos los balones entrantes porque dependen del hospital seleccionado
                  setFormData({...formData, service_id: s?.value || '', cylinders_in: []});
                }}
                noOptionsMessage={({ inputValue }) => !inputValue ? "Sugerencias cargando..." : "No se encontró un hospital de red con ese nombre."}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Documento / Vale de Salida</label>
              <div className="relative">
                <MdAssignment className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.reference_document}
                  onChange={(e) => setFormData({...formData, reference_document: e.target.value.toUpperCase()})}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  placeholder="Ej: VALE-2024-001"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Notas / Observaciones</label>
              <input 
                type="text" 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Estado de los balones, chofer, etc."
              />
            </div>
          </div>
        </div>

        {/* MOVIMIENTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LO QUE EL PERIFÉRICO DEJA (ENTRADA) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                <MdHistory className="rotate-180" /> ENTREGA (Recibimos de Periferia)
              </h3>
              <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">VACÍOS / LLENOS</span>
            </div>
            <p className="text-slate-500 text-xs italic">Escanea o busca los balones que el hospital de red está dejando en el almacén central.</p>
            <AsyncSelect 
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={(val) => loadCylinderOptions(val, 'IN')}
              styles={customStyles}
              isDisabled={!formData.service_id} // No puede entregar si no se seleccionó el hospital primero
              placeholder={!formData.service_id ? "Seleccione hospital primero" : "-- Buscar balones recibidos --"}
              value={formData.cylinders_in}
              onChange={(s) => setFormData({...formData, cylinders_in: s || []})}
              closeMenuOnSelect={false}
              noOptionsMessage={({ inputValue }) => !inputValue ? "Sugerencias cargando..." : "No se encontró el balón o no pertenece a este hospital."}
            />
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-between">
               <span className="text-sm text-slate-600 font-medium">Balones ingresados:</span>
               <span className="text-2xl font-black text-slate-800">{formData.cylinders_in.length}</span>
            </div>
          </div>

          {/* LO QUE EL PERIFÉRICO SE LLEVA (SALIDA) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                <MdQrCodeScanner /> DESPACHO (Se llevan a su sede)
              </h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">SOLO LLENOS</span>
            </div>
            <p className="text-slate-500 text-xs italic">Selecciona los balones cargados con oxígeno que se enviarán al hospital periférico.</p>
            <AsyncSelect 
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={(val) => loadCylinderOptions(val, 'OUT')}
              styles={customStyles}
              placeholder="-- Buscar balones para enviar --"
              value={formData.cylinders_out}
              onChange={(s) => setFormData({...formData, cylinders_out: s || []})}
              closeMenuOnSelect={false}
              noOptionsMessage={({ inputValue }) => !inputValue ? "Sugerencias cargando..." : "No se encontró balón o no cumple los requisitos (8-10m³, Lleno)."}
            />
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-dashed border-blue-300 flex items-center justify-between">
               <span className="text-sm text-blue-700 font-medium">Balones salientes:</span>
               <span className="text-2xl font-black text-blue-800">{formData.cylinders_out.length}</span>
            </div>
          </div>

        </div>

        {/* BOTÓN FINAL */}
        <div className="flex justify-center pt-4">
          <button 
            type="submit" 
            disabled={actionLoading}
            className="group relative w-full sm:w-auto px-6 sm:px-20 py-5 bg-indigo-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-indigo-950 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:scale-100 overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-3">
              {actionLoading ? 'Procesando...' : (
                <>
                  <MdSave className="text-2xl group-hover:animate-bounce" />
                  CONFIRMAR CANJE DE RED
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
        </div>

      </form>
    </div>
  );
};

export default PeripheryExchange;
