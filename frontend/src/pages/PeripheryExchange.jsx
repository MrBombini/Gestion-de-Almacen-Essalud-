import { useState } from 'react';
import { MdLocalHospital, MdSave, MdHistory, MdSwapCalls, MdAssignment, MdQrCodeScanner } from 'react-icons/md';
import Select from 'react-select';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

const PeripheryExchange = () => {
  const { shift } = useAuth();
  
  const { data: services, loading: loadingS } = useFetch('/services');
  const { data: cylinders, loading: loadingC, refetch: refetchC } = useFetch('/cylinders?per_page=all');
  
  const { execute, loading: actionLoading } = useFetch('/inventory/periphery-exchange', 'POST', null, false);

  const servicesList = Array.isArray(services) ? services : (services?.data || []);
  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);

  const [formData, setFormData] = useState({
    service_id: '',
    reference_document: '',
    shift: shift || 'Morning',
    cylinders_in: [],  // Balones que el periférico DEJA en Almacén
    cylinders_out: [], // Balones que el periférico SE LLEVA a su sede
    notes: ''
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // --- FORMATEO DE OPCIONES ---
  const serviceOptions = servicesList
    .filter(s => s.type === 'PERIFERIE')
    .map(s => ({
      value: s.id,
      label: s.name
    }));

  // Balones para RECIBIR (Deben estar asociados al servicio o ser de su propiedad)
  const cylindersInOptions = cylindersList
    .filter(c => c.gas_type === 'OXÍGENO MEDICINAL' && !(c.ownership_type?.name?.toLowerCase().includes('propio') || c.ownership_type?.name?.toLowerCase().includes('paciente')) && Number(c.capacity) === 10)
    .filter(c => c.status !== 'full' || c.current_service_id === formData.service_id)
    .map(c => ({
      value: c.id,
      label: `${c.serial_number} (${Number(c.capacity)}m³) [${c.ownership_type?.name || 'S/D'}]`
    }));

  // Balones para ENTREGAR (Deben estar llenos en el almacén)
  const cylindersOutOptions = cylindersList
    .filter(c => c.gas_type === 'OXÍGENO MEDICINAL' && !(c.ownership_type?.name?.toLowerCase().includes('propio') || c.ownership_type?.name?.toLowerCase().includes('paciente')) && Number(c.capacity) === 10)
    .filter(c => c.status === 'full' && !c.current_service_id)
    .map(c => ({
      value: c.id,
      label: `${c.serial_number} (${Number(c.capacity)}m³) [${c.ownership_type?.name || 'S/D'}]`
    }));

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
      setFormData({
        service_id: '',
        reference_document: '',
        shift: shift || 'Morning',
        cylinders_in: [],
        cylinders_out: [],
        notes: ''
      });
      refetchC();
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

  if (loadingS || loadingC) {
    return <div className="flex h-full items-center justify-center animate-pulse text-indigo-600 font-bold text-xl">Cargando Módulo de Periferia...</div>;
  }

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

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* INFO GENERAL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hospital de Origen (Red)</label>
              <Select 
                options={serviceOptions} 
                styles={customStyles} 
                placeholder="-- Seleccionar Hospital --"
                value={serviceOptions.find(o => o.value === formData.service_id)}
                onChange={(s) => setFormData({...formData, service_id: s?.value || ''})}
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
                placeholder="Estado de los balones, quien retira, etc."
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
            <Select 
              isMulti
              options={cylindersInOptions}
              styles={customStyles}
              placeholder="-- Buscar balones recibidos --"
              value={formData.cylinders_in}
              onChange={(s) => setFormData({...formData, cylinders_in: s || []})}
              closeMenuOnSelect={false}
              noOptionsMessage={() => "No hay balones disponibles para recibir."}
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
            <Select 
              isMulti
              options={cylindersOutOptions}
              styles={customStyles}
              placeholder="-- Buscar balones para enviar --"
              value={formData.cylinders_out}
              onChange={(s) => setFormData({...formData, cylinders_out: s || []})}
              closeMenuOnSelect={false}
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
            className="group relative px-20 py-5 bg-indigo-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-indigo-950 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:scale-100 overflow-hidden"
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
