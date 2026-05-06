import { useState } from 'react';
import { MdSwapHoriz, MdSave, MdPerson, MdLocalHospital, MdPropaneTank } from 'react-icons/md';
import Select from 'react-select';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

const Exchange = () => {
  const { shift } = useAuth();
  
  const { data: patients, loading: loadingP } = useFetch('/patients');
  const { data: services, loading: loadingS } = useFetch('/services');
  const { data: cylinders, loading: loadingC } = useFetch('/cylinders');
  
  const { execute, loading: actionLoading } = useFetch('/inventory/exchange', 'POST', null, false);

  const patientsList = Array.isArray(patients) ? patients : (patients?.data || []);
  const servicesList = Array.isArray(services) ? services : (services?.data || []);
  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);

  const fullCylinders = cylindersList.filter(c => c.status === 'full');
  
  // --- FORMATEO DE DATOS PARA REACT-SELECT ---
  // react-select necesita arreglos con el formato { value: algo, label: 'texto' }
  const patientOptions = patientsList.map(p => ({
    value: p.id,
    label: `${p.full_name} (DNI: ${p.dni || 'N/A'})`
  }));

  const serviceOptions = servicesList.map(s => ({
    value: s.id,
    label: s.name
  }));

  const cylinderOutOptions = fullCylinders.map(c => ({
    value: c.id,
    label: `${c.serial_number} - ${c.capacity}m³`
  }));

  const cylinderInOptions = cylindersList.map(c => ({
    value: c.id,
    label: `${c.serial_number} - Estado: ${c.status}`
  }));
  // -------------------------------------------

  const [formData, setFormData] = useState({
    patient_id: '',
    service_id: '',
    cylinder_in: '', 
    cylinder_out: '',
    notes: ''
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validación manual rápida porque react-select oculta el atributo 'required' nativo
    if (!formData.cylinder_in || !formData.cylinder_out) {
      setErrorMessage('Por favor, selecciona los cilindros de entrada y salida.');
      return;
    }

    try {
      await execute({
        body: {
          ...formData,
          shift: shift
        }
      });
      
      setSuccessMessage('¡Intercambio registrado con éxito!');
      setFormData({
        patient_id: '',
        service_id: '',
        cylinder_in: '',
        cylinder_out: '',
        notes: ''
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al registrar el intercambio. Revisa los datos.');
    }
  };

  const isPageLoading = loadingP || loadingS || loadingC;

  if (isPageLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Estilos personalizados básicos para que react-select combine con Tailwind
  const customStyles = {
    control: (base) => ({
      ...base,
      padding: '2px',
      borderRadius: '0.5rem',
      borderColor: '#cbd5e1',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      }
    })
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
          <MdSwapHoriz className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nuevo Intercambio</h2>
          <p className="text-slate-500 text-sm mt-1">
            Registra la entrega de un cilindro lleno y la recepción de uno vacío. Turno activo: <span className="font-bold text-blue-600">{shift}</span>
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

      {/* Formulario Principal Dividido */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA: Destino */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <MdPerson className="text-slate-400" /> 1. Destino del Cilindro
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Paciente</label>
              <Select
                options={patientOptions}
                styles={customStyles}
                isClearable
                placeholder="-- Buscar Paciente por nombre o DNI --"
                value={patientOptions.find(opt => opt.value === formData.patient_id) || null}
                onChange={(selected) => setFormData({...formData, patient_id: selected ? selected.value : ''})}
                noOptionsMessage={() => "No se encontró el paciente"}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 items-center gap-2">
                <MdLocalHospital className="text-slate-400" /> Servicio / Área
              </label>
              <Select
                options={serviceOptions}
                styles={customStyles}
                isClearable
                placeholder="-- Buscar Servicio --"
                value={serviceOptions.find(opt => opt.value === formData.service_id) || null}
                onChange={(selected) => setFormData({...formData, service_id: selected ? selected.value : ''})}
                noOptionsMessage={() => "No se encontró el servicio"}
              />
            </div>
          </div>

          {/* COLUMNA DERECHA: Cilindros */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <MdPropaneTank className="text-slate-400" /> 2. Intercambio Físico
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-1">Cilindro ENTREGADO (Lleno que sale)</label>
              <Select
                options={cylinderOutOptions}
                styles={customStyles}
                isClearable
                placeholder="-- Buscar Cilindro Lleno --"
                value={cylinderOutOptions.find(opt => opt.value === formData.cylinder_out) || null}
                onChange={(selected) => setFormData({...formData, cylinder_out: selected ? selected.value : ''})}
                noOptionsMessage={() => "Cilindro no encontrado"}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-orange-700 mb-1">Cilindro RECIBIDO (Vacío que entra)</label>
              <Select
                options={cylinderInOptions}
                styles={customStyles}
                isClearable
                placeholder="-- Buscar Cilindro Retornado --"
                value={cylinderInOptions.find(opt => opt.value === formData.cylinder_in) || null}
                onChange={(selected) => setFormData({...formData, cylinder_in: selected ? selected.value : ''})}
                noOptionsMessage={() => "Cilindro no encontrado"}
              />
            </div>
          </div>
        </div>

        {/* Observaciones y Botón */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Notas / Observaciones del Intercambio</label>
          <textarea 
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Ej: El regulador del cilindro retornado presenta un ligero golpe..."
          ></textarea>
          
          <div className="mt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={actionLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:bg-slate-400"
            >
              <MdSave className="text-xl" />
              {actionLoading ? 'Procesando...' : 'Registrar Intercambio'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Exchange;