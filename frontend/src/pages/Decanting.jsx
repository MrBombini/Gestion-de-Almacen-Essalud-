import { useState } from 'react';
import { MdSave, MdPropaneTank, MdCompress } from 'react-icons/md';
import Select from 'react-select';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

const Decanting = () => {
  const { shift } = useAuth();

  // Fetch de cilindros disponibles en el almacén
  const { data: cylinders, loading: loadingC } = useFetch('/cylinders');
  
  const { execute, loading: actionLoading } = useFetch('/inventory/decanting', 'POST', null, false);

  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);

  // --- FORMATEO PARA REACT-SELECT ---
  // Filtramos: Solo cilindros que NO estén vacíos pueden ser Fuente (Source)
  const sourceOptions = cylindersList
    .filter(c => c.status !== 'empty')
    .map(c => ({
      value: c.id,
      label: `Cód: ${c.serial_number} - Capacidad: ${c.capacity}m³ (${c.status})`
    }));

  // Filtramos: Solo cilindros vacíos o en uso pueden ser Destino (Target)
  const targetOptions = cylindersList
    .filter(c => c.status !== 'full')
    .map(c => ({
      value: c.id,
      label: `Cód: ${c.serial_number} - Propiedad: ${c.ownership_type?.name || 'Desconocida'}`
    }));

  // Estado del formulario
  const [formData, setFormData] = useState({
    source_cylinder_id: '',
    target_cylinder_id: ''
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validación rápida
    if (!formData.source_cylinder_id || !formData.target_cylinder_id) {
      setErrorMessage('Por favor, selecciona ambos cilindros para el trasiego.');
      return;
    }

    if (formData.source_cylinder_id === formData.target_cylinder_id) {
      setErrorMessage('El cilindro fuente no puede ser el mismo que el destino.');
      return;
    }

    try {
      await execute({
        body: {
          ...formData,
          shift: shift
        }
      });
      
      setSuccessMessage('¡Trasiego en cascada registrado con éxito!');
      setFormData({
        source_cylinder_id: '',
        target_cylinder_id: ''
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al registrar el trasiego. Verifica los datos.');
    }
  };

  // Estilos de Tailwind para los react-select
  const customStyles = {
    control: (base) => ({
      ...base,
      padding: '4px',
      borderRadius: '0.75rem',
      borderColor: '#cbd5e1',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      }
    })
  };

  if (loadingC) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Cabecera del Módulo */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
          <MdCompress className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Trasiego (Llenado en Cascada)</h2>
          <p className="text-slate-500 text-sm mt-1">
            Transfiere oxígeno a alta presión desde un cilindro mayor hacia uno menor. Turno: <span className="font-bold text-blue-600">{shift}</span>
          </p>
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md text-emerald-700 font-medium">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Formulario Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            
            {/* Ícono conector visual (Solo visible en pantallas grandes) */}
            <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
               <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shadow-inner z-10 text-slate-400">
                 <MdSave className="text-xl rotate-90" />
               </div>
               {/* Línea conectora */}
               <div className="absolute h-1 bg-slate-100 w-full top-1/2 -translate-y-1/2"></div>
            </div>

            {/* SECCIÓN 1: Fuente (Tanque Mayor) */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 relative z-20">
              <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold border-b border-blue-200 pb-2">
                <MdPropaneTank className="text-xl" />
                <span>1. Cilindro Fuente (Manifold)</span>
              </div>
              <p className="text-xs text-blue-600 mb-3">Selecciona el cilindro lleno desde donde saldrá el oxígeno.</p>
              <Select
                options={sourceOptions}
                styles={customStyles}
                isClearable
                placeholder="-- Buscar Cilindro Fuente --"
                value={sourceOptions.find(opt => opt.value === formData.source_cylinder_id) || null}
                onChange={(selected) => setFormData({...formData, source_cylinder_id: selected ? selected.value : ''})}
                noOptionsMessage={() => "No hay cilindros llenos disponibles"}
              />
            </div>

            {/* SECCIÓN 2: Destino (Cilindro Menor) */}
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 relative z-20">
              <div className="flex items-center gap-2 mb-4 text-orange-800 font-bold border-b border-orange-200 pb-2">
                <MdPropaneTank className="text-xl" />
                <span>2. Cilindro Destino (A Recargar)</span>
              </div>
              <p className="text-xs text-orange-600 mb-3">Selecciona el cilindro vacío (o del paciente) que se llenará.</p>
              <Select
                options={targetOptions}
                styles={customStyles}
                isClearable
                placeholder="-- Buscar Cilindro Destino --"
                value={targetOptions.find(opt => opt.value === formData.target_cylinder_id) || null}
                onChange={(selected) => setFormData({...formData, target_cylinder_id: selected ? selected.value : ''})}
                noOptionsMessage={() => "No hay cilindros vacíos registrados"}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={actionLoading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:bg-slate-400"
            >
              <MdCompress className="text-xl" />
              {actionLoading ? 'Procesando Trasiego...' : 'Registrar Trasiego (Cascada)'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Decanting;