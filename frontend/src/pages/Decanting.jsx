import { useState, useEffect } from 'react';
import { MdSave, MdCompress, MdPropaneTank, MdLocalHospital, MdPerson } from 'react-icons/md';
import AsyncSelect from 'react-select/async';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import api from '../services/api';

const Decanting = () => {
  const { shift } = useAuth();

  // Mantenemos solo el useFetch para guardar el trasiego
  const { execute, loading: actionLoading } = useFetch('/inventory/decanting', 'POST', null, false);

  const [destinationType, setDestinationType] = useState('service'); // 'service' o 'patient'

  const [formData, setFormData] = useState({
    service_id: '',
    patient_id: '',
    prescription_id: '',
    cylinder_id: '',
    refilled_amount: ''
  });

  // Estados para mantener los objetos seleccionados visibles en los Selects
  const [selectedServiceOption, setSelectedServiceOption] = useState(null);
  const [selectedPatientOption, setSelectedPatientOption] = useState(null);
  const [selectedCylinderOption, setSelectedCylinderOption] = useState(null);
  
  const [prescriptionAlert, setPrescriptionAlert] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // ==========================================
  // CARGA ASÍNCRONA DE SERVICIOS
  // ==========================================
  const loadServiceOptions = async (inputValue) => {
    try {
      const searchParam = inputValue && inputValue.length >= 2 ? `?search=${inputValue}` : '';
      const response = await api.get(`/services${searchParam}`);
      const data = response.data.data || response.data || [];
      
      return data.map(s => ({ value: s.id, label: s.name }));
    } catch (error) {
      console.error('Error buscando servicios:', error);
      return [];
    }
  };

  // ==========================================
  // CARGA ASÍNCRONA DE PACIENTES
  // ==========================================
  const loadPatientOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      const response = await api.get('/patients', { params: { search: inputValue, per_page: 15 } });
      const data = response.data.data || response.data || [];
      
      // Filtramos solo pacientes con código de trasiego
      return data.filter(p => p.trasiego_code).map(p => ({
        value: p.id,
        label: `${p.trasiego_code} | ${p.full_name}`,
        prescriptions: p.prescriptions || [] // Vital para validar la receta luego
      }));
    } catch (error) {
      console.error('Error buscando pacientes:', error);
      return [];
    }
  };

  // ==========================================
  // CARGA ASÍNCRONA DE CILINDROS (Filtro Dinámico)
  // ==========================================
  const loadCylinderOptions = async (inputValue) => {
    try {
      const params = { per_page: 30 };
      if (inputValue && inputValue.length >= 2) params.search = inputValue;

      const response = await api.get('/cylinders', { params });
      const data = response.data.data || response.data || [];

      return data
        // 1. Debe estar vacío o en uso, y capacidad entre 1 y 10
        .filter(c => (c.status === 'empty' || c.status === 'in_use') && Number(c.capacity) >= 1 && Number(c.capacity) <= 10)
        // 2. Filtro estricto según el destino seleccionado
        .filter(c => {
          if (destinationType === 'service') {
            return c.ownership_type?.name?.toLowerCase().includes('essalud');
          }
          if (destinationType === 'patient') {
            // El balón propio debe pertenecer al paciente seleccionado
            return c.ownership_type?.name?.toLowerCase().includes('propio') && 
                   (c.patient_id === formData.patient_id || c.current_patient_id === formData.patient_id);
          }
          return false;
        })
        .map(c => ({
          value: c.id,
          label: `${c.serial_number} | ${c.ownership_type?.name || 'S/D'} | ${Number(c.capacity)}m³`,
          capacity: c.capacity,
          ownership: c.ownership_type?.name
        }));
    } catch (error) {
      console.error('Error buscando cilindros:', error);
      return [];
    }
  };

  // Efecto para verificar receta cuando selecciona un paciente
  useEffect(() => {
    setPrescriptionAlert(null);
    setFormData(prev => ({ ...prev, prescription_id: '', cylinder_id: '' })); 
    setSelectedCylinderOption(null);

    if (destinationType === 'patient' && formData.patient_id && selectedPatientOption) {
      const patient = selectedPatientOption; // Usamos el objeto completo guardado
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const validPrescription = patient.prescriptions?.find(
        rx => rx.status === 'active' && rx.expires_at >= today
      );

      if (validPrescription) {
        setFormData(prev => ({ ...prev, prescription_id: validPrescription.id }));
        setPrescriptionAlert({
          type: 'success',
          message: `Receta activa (Expira: ${validPrescription.expires_at}). Dosis: ${validPrescription.dosage}`
        });
      } else {
        setPrescriptionAlert({
          type: 'error',
          message: 'El paciente no cuenta con una receta vigente o ha expirado.'
        });
      }
    }
  }, [formData.patient_id, destinationType, selectedPatientOption]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (destinationType === 'service' && !formData.service_id) {
      return setErrorMessage('Selecciona un servicio válido de EsSalud.');
    }

    if (destinationType === 'patient' && (!formData.patient_id || !formData.prescription_id)) {
      return setErrorMessage('El paciente debe estar seleccionado y contar con receta válida.');
    }

    if (!formData.cylinder_id) {
      return setErrorMessage('Por favor, selecciona el balón a recargar.');
    }

    try {
      await execute({
        body: { ...formData, shift }
      });

      setSuccessMessage('¡Recarga de balón registrada con éxito!');
      
      // Limpieza de formulario y selectores
      setFormData({ service_id: '', patient_id: '', prescription_id: '', cylinder_id: '', refilled_amount: '' });
      setSelectedServiceOption(null);
      setSelectedPatientOption(null);
      setSelectedCylinderOption(null);
      setPrescriptionAlert(null);

    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al registrar el trasiego. Verifica los datos.');
    }
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      padding: '4px',
      borderRadius: '0.75rem',
      borderColor: '#cbd5e1',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3b82f6' }
    }),
    menu: (base) => ({ ...base, zIndex: 9999 })
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-10">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-3 sm:p-4 bg-orange-50 text-orange-600 rounded-xl shrink-0">
          <MdCompress className="text-2xl sm:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Trasiego (Llenado de Balón)</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Registro de recarga. Turno: <span className="font-bold text-blue-600">{shift}</span>
          </p>
        </div>
      </div>

      {successMessage && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md text-emerald-700 font-medium text-sm sm:text-base">{successMessage}</div>}
      {errorMessage && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium text-sm sm:text-base">{errorMessage}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">

          {/* SECCIÓN 1: DESTINO */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-slate-50">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <MdLocalHospital className="text-orange-600 text-xl" /> 1. Autorización y Destino
            </h3>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-4 sm:mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="destType" value="service" checked={destinationType === 'service'} 
                  onChange={() => { 
                    setDestinationType('service'); 
                    setFormData({ ...formData, patient_id: '', cylinder_id: '' }); 
                    setSelectedPatientOption(null);
                    setSelectedCylinderOption(null); 
                  }} className="w-4 h-4 text-blue-600" />
                <span className="text-sm sm:text-base text-slate-700 font-medium">Área / Servicio (Balones EsSalud)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="destType" value="patient" checked={destinationType === 'patient'} 
                  onChange={() => { 
                    setDestinationType('patient'); 
                    setFormData({ ...formData, service_id: '', cylinder_id: '' }); 
                    setSelectedServiceOption(null);
                    setSelectedCylinderOption(null); 
                  }} className="w-4 h-4 text-blue-600" />
                <span className="text-sm sm:text-base text-slate-700 font-medium">Paciente Directo (Balones Propios)</span>
              </label>
            </div>

            <div>
              {destinationType === 'service' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccione el Servicio de Destino</label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadServiceOptions}
                    styles={customStyles}
                    isClearable
                    placeholder="-- Buscar Servicio (Ej. Emergencia) --"
                    value={selectedServiceOption}
                    onChange={(s) => {
                      setSelectedServiceOption(s);
                      setFormData({ ...formData, service_id: s ? s.value : '' });
                    }}
                    noOptionsMessage={() => "Escriba para buscar o no hay servicios."}
                  />
                </div>
              )}

              {destinationType === 'patient' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccione el Paciente (Búsqueda por Código PAC)</label>
                    <AsyncSelect
                      cacheOptions
                      loadOptions={loadPatientOptions}
                      styles={customStyles}
                      isClearable
                      placeholder="-- Buscar Paciente por Nombre o Código --"
                      value={selectedPatientOption}
                      onChange={(s) => {
                        setSelectedPatientOption(s);
                        setFormData({ ...formData, patient_id: s ? s.value : '' });
                      }}
                      noOptionsMessage={({ inputValue }) => !inputValue ? "Escriba al menos 2 letras..." : "No se encontró paciente."}
                    />
                  </div>

                  {prescriptionAlert && (
                    <div className={`p-4 rounded-lg border flex flex-col sm:flex-row gap-2 sm:gap-3 text-sm ${prescriptionAlert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800 font-bold'}`}>
                      <MdPerson className="text-xl shrink-0 hidden sm:block" />
                      <p>{prescriptionAlert.message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: BALÓN */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <MdPropaneTank className="text-blue-600 text-xl" /> 2. Balón a Recargar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {destinationType === 'service' ? 'Balones Disponibles (EsSalud)' : 'Balones Propiedad del Paciente'}
                </label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={loadCylinderOptions}
                  styles={customStyles}
                  isClearable
                  isDisabled={(destinationType === 'patient' && !formData.patient_id) || (destinationType === 'service' && !formData.service_id)}
                  placeholder={(destinationType === 'patient' && !formData.patient_id) || (destinationType === 'service' && !formData.service_id) ? 'Seleccione destino primero' : '-- Buscar código de balón --'}
                  value={selectedCylinderOption}
                  onChange={(s) => {
                    setSelectedCylinderOption(s);
                    setFormData({ ...formData, cylinder_id: s ? s.value : '' });
                  }}
                  noOptionsMessage={() => destinationType === 'patient' ? "escribe el código del balón" : "escribe el código del balón o no hay balones."}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cantidad a inyectar (m³)</label>
                <div className="relative">
                  <input
                    type="number" step="0.01" required min="0.01"
                    value={formData.refilled_amount}
                    onChange={(e) => setFormData({ ...formData, refilled_amount: e.target.value })}
                    className="w-full pl-4 pr-16 py-2 sm:py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    placeholder="Ej: 8.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-l pl-3 text-sm">m³</span>
                </div>
                {selectedCylinderOption && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Capacidad de esta botella: {selectedCylinderOption.capacity} m³
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 flex justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={actionLoading || (destinationType === 'patient' && !formData.prescription_id)}
              className="w-full sm:w-auto flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              <MdSave className="text-xl" />
              {actionLoading ? 'Guardando...' : 'Registrar Trasiego'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Decanting;