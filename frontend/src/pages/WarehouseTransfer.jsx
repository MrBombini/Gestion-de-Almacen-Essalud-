import { useState, useEffect } from 'react';
import { MdSave, MdSyncAlt, MdAssignment } from 'react-icons/md';
import AsyncSelect from 'react-select/async';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const WarehouseTransfer = () => {
  const { shift } = useAuth();
  
  const { execute, loading: actionLoading } = useFetch('/inventory/warehouse-transfer', 'POST', null, false);

  const [formData, setFormData] = useState({
    direction: 'CENTRAL_TO_ALMACEN',
    cylinders: [],
    notes: ''
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // ==========================================
  // CARGA ASÍNCRONA DE CILINDROS
  // ==========================================
  const loadCylinderOptions = async (inputValue) => {
    try {
      const location = formData.direction === 'CENTRAL_TO_ALMACEN' ? 'CENTRAL' : 'ALMACEN';
      
      const params = { location, per_page: 30 };
      
      if (inputValue && inputValue.length >= 2) {
        params.search = inputValue;
      }

      const response = await api.get('/cylinders', { params });
      const data = response.data.data || response.data || [];

      return data.map(c => ({
        value: c.id,
        label: `${c.serial_number} | ${c.ownership_type?.name || 'S/D'} | ${Number(c.capacity)}m³ | ${c.status === 'full' ? 'Lleno' : 'Vacío'}`
      }));
    } catch (error) {
      console.error('Error buscando cilindros:', error);
      return [];
    }
  };

  // Limpiar seleccionados al cambiar dirección
  useEffect(() => {
    setFormData(prev => ({ ...prev, cylinders: [] }));
  }, [formData.direction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (formData.cylinders.length === 0) {
      return setErrorMessage('Debes seleccionar al menos un balón para trasladar.');
    }

    try {
      await execute({
        body: {
          direction: formData.direction,
          cylinders: formData.cylinders.map(c => c.value),
          notes: formData.notes
        }
      });

      setSuccessMessage('¡Traslado interno registrado con éxito!');
      
      // Limpieza de formulario
      setFormData({
        direction: formData.direction,
        cylinders: [],
        notes: ''
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error en el registro del traslado.');
    }
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      padding: '5px',
      borderRadius: '0.75rem',
      borderColor: '#cbd5e1',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3b82f6' }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#eff6ff',
      borderRadius: '0.5rem',
      color: '#1e40af',
      fontWeight: 'bold'
    })
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-200">
            <MdSyncAlt className="text-3xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Traslado Interno</h2>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <MdAssignment /> Movimiento de Planta a Central (y viceversa)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turno Actual</span>
          <span className="px-3 py-1 bg-white text-purple-600 rounded-lg text-sm font-black shadow-sm">{shift}</span>
        </div>
      </div>

      {(successMessage || errorMessage) && (
        <div className={`p-4 rounded-xl font-medium border-l-4 animate-fade-in ${successMessage ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
          {successMessage || errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="space-y-6">
        
        {/* INFO GENERAL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Dirección del Traslado</label>
              <select 
                value={formData.direction}
                onChange={(e) => setFormData({...formData, direction: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
              >
                <option value="CENTRAL_TO_ALMACEN">De CENTRAL hacia ALMACÉN</option>
                <option value="ALMACEN_TO_CENTRAL">De ALMACÉN hacia CENTRAL</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Notas / Observaciones</label>
              <input 
                type="text" 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Motivo del traslado interno..."
              />
            </div>
          </div>
        </div>

        {/* CILINDROS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MdSyncAlt className="text-purple-600" /> Balones a Trasladar
            </h3>
            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold">
              DESDE {formData.direction === 'CENTRAL_TO_ALMACEN' ? 'CENTRAL' : 'ALMACÉN'}
            </span>
          </div>
          <p className="text-slate-500 text-xs italic">Busca y selecciona los balones (Llenos o Vacíos) que deseas mover.</p>
          <AsyncSelect 
            key={formData.direction} /* Forzar recarga si cambia la dirección */
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadCylinderOptions}
            styles={customStyles}
            placeholder="-- Escribir series de los balones --"
            value={formData.cylinders}
            onChange={(s) => setFormData({...formData, cylinders: s || []})}
            closeMenuOnSelect={false}
            noOptionsMessage={({ inputValue }) => !inputValue ? "Escriba al menos 2 letras..." : "No se encontró el balón en la ubicación de origen."}
          />
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">Total a mover:</span>
              <span className="text-2xl font-black text-slate-800">{formData.cylinders.length}</span>
          </div>
        </div>

        {/* ACCION FINAL */}
        <div className="flex justify-center pt-4">
          <button 
            type="submit" 
            disabled={actionLoading}
            className="group relative w-full sm:w-auto px-6 sm:px-20 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:scale-100 overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-3">
              {actionLoading ? 'Procesando...' : (
                <>
                  <MdSave className="text-2xl group-hover:animate-bounce" />
                  REGISTRAR TRASLADO
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
        </div>

      </form>
    </div>
  );
};

export default WarehouseTransfer;
