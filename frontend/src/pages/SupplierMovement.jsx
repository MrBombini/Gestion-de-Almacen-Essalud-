import { useState, useEffect } from 'react';
import { MdSave, MdLibraryAdd, MdHistory, MdAssignment, MdLocalShipping } from 'react-icons/md';
import AsyncSelect from 'react-select/async';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SupplierMovement = () => {
  const { shift } = useAuth();
  
  // Mantenemos solo el useFetch para guardar la transacción
  const { execute, loading: actionLoading } = useFetch('/inventory/supplier', 'POST', null, false);

  const [formData, setFormData] = useState({
    supplier_id: '',
    reference_document: '',
    shift: shift || 'Morning',
    cylinders_in: [],  // Array de objetos { value, label }
    cylinders_out: [], // Array de objetos { value, label }
    notes: ''
  });

  const [selectedSupplierOption, setSelectedSupplierOption] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [restoredDraft, setRestoredDraft] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('supplier_movement_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData.supplier_id || parsed.formData.reference_document || parsed.formData.cylinders_in?.length > 0 || parsed.formData.cylinders_out?.length > 0) {
          setFormData(parsed.formData);
          if (parsed.selectedSupplierOption) setSelectedSupplierOption(parsed.selectedSupplierOption);
          setRestoredDraft(true);
        }
      } catch (e) {
        console.error('Error parsing draft', e);
      }
    }
  }, []);

  useEffect(() => {
    if (formData.supplier_id || formData.reference_document || formData.cylinders_in.length > 0 || formData.cylinders_out.length > 0) {
      localStorage.setItem('supplier_movement_draft', JSON.stringify({ formData, selectedSupplierOption }));
    }
  }, [formData, selectedSupplierOption]);

  // ==========================================
  // CARGA ASÍNCRONA DE PROVEEDORES
  // ==========================================
  const loadSupplierOptions = async (inputValue) => {
    try {
      const searchParam = inputValue && inputValue.length >= 2 ? `?search=${inputValue}` : '';
      const response = await api.get(`/suppliers${searchParam}`);
      const data = response.data.data || response.data || [];
      
      return data.map(s => ({ value: s.id, label: s.name }));
    } catch (error) {
      console.error('Error buscando proveedores:', error);
      return [];
    }
  };

  // ==========================================
  // CARGA ASÍNCRONA DE CILINDROS (Inteligente)
  // ==========================================
  const loadCylinderOptions = async (inputValue, type) => {
    try {
      // Reglas de negocio del backend para optimizar la búsqueda
      const status = type === 'OUT' ? 'empty' : 'in_transit';
      const location = type === 'OUT' ? 'CENTRAL' : 'PROVEEDOR';
      
      const params = { status, location, per_page: 30 }; // Pedimos un lote moderado
      
      if (inputValue && inputValue.length >= 2) {
        params.search = inputValue;
      }

      const response = await api.get('/cylinders', { params });
      const data = response.data.data || response.data || [];

      // Filtros locales adicionales (solo 10m3 y excluyendo los propios/paciente)
      const filteredData = data.filter(c => {
        const cap = Number(c.capacity);
        const isOwn = c.ownership_type?.name?.toLowerCase().includes('propio') || 
                      c.ownership_type?.name?.toLowerCase().includes('paciente');
        return cap === 10 && !isOwn;
      });

      return filteredData.map(c => ({
        value: c.id,
        label: `${c.serial_number} | ${c.ownership_type?.name || 'S/D'} | ${Number(c.capacity)}m³ ${type === 'IN' ? '[EN PROVEEDOR]' : ''}`
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

    if (!formData.supplier_id) return setErrorMessage('Selecciona un proveedor.');
    if (!formData.reference_document) return setErrorMessage('Ingresa el número de Guía de Remisión.');
    if (formData.cylinders_in.length === 0 && formData.cylinders_out.length === 0) {
      return setErrorMessage('Debes seleccionar al menos un balón de entrada o salida.');
    }

    try {
      await execute({
        body: {
          ...formData,
          // Mapeamos los arrays de objetos para enviar solo los IDs al backend
          cylinders_in: formData.cylinders_in.map(c => c.value),
          cylinders_out: formData.cylinders_out.map(c => c.value)
        }
      });

      setSuccessMessage('¡Movimiento de proveedor registrado con éxito!');
      localStorage.removeItem('supplier_movement_draft');
      setRestoredDraft(false);
      
      // Limpieza de formulario y selects
      setFormData({
        supplier_id: '',
        reference_document: '',
        shift: shift || 'Morning',
        cylinders_in: [],
        cylinders_out: [],
        notes: ''
      });
      setSelectedSupplierOption(null);
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
          <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <MdLocalShipping className="text-3xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Entrada/Salida de Proveedores</h2>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <MdAssignment /> Registro masivo por Guía de Remisión
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turno Actual</span>
          <span className="px-3 py-1 bg-white text-blue-600 rounded-lg text-sm font-black shadow-sm">{shift}</span>
        </div>
      </div>

      {(successMessage || errorMessage) && (
        <div className={`p-4 rounded-xl font-medium border-l-4 animate-fade-in ${successMessage ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
          {successMessage || errorMessage}
        </div>
      )}

      {restoredDraft && !successMessage && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-700 rounded-xl font-medium flex justify-between items-center animate-fade-in">
          <span>Se ha recuperado un registro pendiente (Borrador).</span>
          <button type="button" onClick={() => {
            localStorage.removeItem('supplier_movement_draft');
            setFormData({ supplier_id: '', reference_document: '', shift: shift || 'Morning', cylinders_in: [], cylinders_out: [], notes: '' });
            setSelectedSupplierOption(null);
            setRestoredDraft(false);
          }} className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-lg text-sm font-bold transition-colors">
            Descartar Borrador
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* INFO GENERAL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Proveedor</label>
              <AsyncSelect 
                cacheOptions
                defaultOptions
                loadOptions={loadSupplierOptions}
                styles={customStyles} 
                isClearable
                placeholder="-- Buscar Empresa --"
                value={selectedSupplierOption}
                onChange={(s) => {
                  setSelectedSupplierOption(s);
                  setFormData({...formData, supplier_id: s?.value || ''});
                }}
                noOptionsMessage={({ inputValue }) => !inputValue ? "Sugerencias cargando..." : "No se encontró proveedor."}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nro Guía de Remisión</label>
              <div className="relative">
                <MdLocalShipping className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.reference_document}
                  onChange={(e) => setFormData({...formData, reference_document: e.target.value.toUpperCase()})}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="Ej: GR-001-12345"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Notas / Observaciones</label>
              <input 
                type="text" 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Estado del camión, sellos, etc."
              />
            </div>
          </div>
        </div>

        {/* CARGA Y DESCARGA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SALIDA (LO QUE SE LLEVA EL CAMIÓN) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <MdHistory className="rotate-180" /> SALIDA (Hacia Proveedor)
              </h3>
              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold">VACÍOS</span>
            </div>
            <p className="text-slate-500 text-xs italic">Busca y selecciona todos los balones que el camión está cargando para llevarse.</p>
            <AsyncSelect 
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={(val) => loadCylinderOptions(val, 'OUT')}
              styles={customStyles}
              placeholder="-- Escribir series para enviar --"
              value={formData.cylinders_out} // isMulti acepta el array completo de objetos
              onChange={(s) => setFormData({...formData, cylinders_out: s || []})}
              closeMenuOnSelect={false}
              noOptionsMessage={({ inputValue }) => !inputValue ? "Escriba al menos 2 letras..." : "No se encontró el balón."}
            />
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-between">
               <span className="text-sm text-slate-600 font-medium">Total a entregar:</span>
               <span className="text-2xl font-black text-slate-800">{formData.cylinders_out.length}</span>
            </div>
          </div>

          {/* ENTRADA (LO QUE NOS DEJA EL CAMIÓN) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                <MdLibraryAdd /> ENTRADA (Desde Proveedor)
              </h3>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">LLENOS</span>
            </div>
            <p className="text-slate-500 text-xs italic">Selecciona los balones que el proveedor está descargando en el almacén.</p>
            <AsyncSelect 
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={(val) => loadCylinderOptions(val, 'IN')}
              styles={customStyles}
              placeholder="-- Escribir series recibidas --"
              value={formData.cylinders_in} // isMulti acepta el array completo de objetos
              onChange={(s) => setFormData({...formData, cylinders_in: s || []})}
              closeMenuOnSelect={false}
              noOptionsMessage={({ inputValue }) => !inputValue ? "Escriba al menos 2 letras..." : "No se encontró el balón."}
            />
            <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-dashed border-emerald-300 flex items-center justify-between">
               <span className="text-sm text-emerald-700 font-medium">Total a recibir:</span>
               <span className="text-2xl font-black text-emerald-800">{formData.cylinders_in.length}</span>
            </div>
          </div>

        </div>

        {/* ACCION FINAL */}
        <div className="flex justify-center pt-4">
          <button 
            type="submit" 
            disabled={actionLoading}
            className="group relative px-20 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:scale-100 overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-3">
              {actionLoading ? 'Procesando...' : (
                <>
                  <MdSave className="text-2xl group-hover:animate-bounce" />
                  REGISTRAR MOVIMIENTO COMPLETO
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
        </div>

      </form>
    </div>
  );
};

export default SupplierMovement;