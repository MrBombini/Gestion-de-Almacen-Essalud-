import { useState, useEffect } from 'react';
import { MdSave, MdCompress, MdPropaneTank, MdLocalHospital, MdPerson, MdEdit } from 'react-icons/md';
import Modal from '../components/Modal';
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

  const [rxModal, setRxModal] = useState(false);
  const [rxForm, setRxForm] = useState({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
  const [rxSaving, setRxSaving] = useState(false);
  const [rxEditId, setRxEditId] = useState(null);
  const [rxError, setRxError] = useState(null);

  const openRxEdit = (rx) => {
    setRxEditId(rx.id);
    setRxForm({ dosage: rx.dosage || '', usage_time: rx.usage_time || '', expires_at: rx.expires_at || '', authorization_date: rx.authorization_date || '', promissory_note: rx.promissory_note || '', status: rx.status });
  };

  const handleRxSubmit = async (e) => {
    e.preventDefault();
    setRxSaving(true);
    setRxError(null);
    try {
      if (rxEditId) {
        await api.put(`/prescriptions/${rxEditId}`, rxForm);
      } else {
        await api.post('/prescriptions', { ...rxForm, patient_id: formData.patient_id });
      }
      setRxEditId(null);
      setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
      
      const res = await api.get(`/patients/${formData.patient_id}`);
      setSelectedPatientOption({...selectedPatientOption, prescriptions: res.data.prescriptions});
    } catch (err) {
      setRxError(err?.response?.data?.message || 'Error al guardar la receta.');
    } finally {
      setRxSaving(false);
    }
  };

  const handleRxDelete = async (rxId) => {
    if (!window.confirm('¿Eliminar esta receta?')) return;
    try {
      await api.delete(`/prescriptions/${rxId}`);
      const res = await api.get(`/patients/${formData.patient_id}`);
      setSelectedPatientOption({...selectedPatientOption, prescriptions: res.data.prescriptions});
    } catch (err) {
      alert(err?.response?.data?.message || 'No se pudo eliminar.');
    }
  };

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
      if (inputValue && inputValue.length >= 2) {
         params.search = inputValue;
      } else if (destinationType === 'service' && formData.service_id) {
         params.status = 'in_use';
         params.current_service_id = formData.service_id;
      }

      const response = await api.get('/cylinders', { params });
      const data = response.data.data || response.data || [];

      return data
        // 1. Debe estar vacío o en uso, y capacidad entre 1 y 10
        .filter(c => (c.status === 'empty' || c.status === 'in_use') && Number(c.capacity) >= 1 && Number(c.capacity) <= 10)
        // 2. Filtro estricto según el destino seleccionado
        .filter(c => {
          if (destinationType === 'service') {
             const isEssalud = c.ownership_type?.name?.toLowerCase().includes('essalud');
             const inService = c.current_service_id === formData.service_id;
             const emptyCentral = c.status === 'empty' && c.location === 'CENTRAL';
             return isEssalud && (inService || emptyCentral);
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
                      placeholder="-- Buscar Paciente por Nombre, Apellido o Código --"
                      value={selectedPatientOption}
                      onChange={(s) => {
                        setSelectedPatientOption(s);
                        setFormData({ ...formData, patient_id: s ? s.value : '' });
                      }}
                      noOptionsMessage={({ inputValue }) => !inputValue ? "Escriba al menos 2 letras..." : "No se encontró paciente."}
                    />
                  </div>

                  {prescriptionAlert && (
                    <div className={`p-4 rounded-lg border flex flex-col sm:flex-row gap-2 sm:gap-3 text-sm items-center justify-between ${prescriptionAlert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800 font-bold'}`}>
                      <div className="flex items-center gap-2">
                        <MdPerson className="text-xl shrink-0 hidden sm:block" />
                        <p>{prescriptionAlert.message}</p>
                      </div>
                      {prescriptionAlert.type === 'error' && (
                        <button type="button" onClick={() => {
                          setRxEditId(null);
                          setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
                          setRxError(null);
                          setRxModal(true);
                        }} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          + Actualizar Receta
                        </button>
                      )}
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

      {/* Modal para Renovar Receta */}
      <Modal isOpen={rxModal} onClose={() => setRxModal(false)} title={`📋 Recetas de ${selectedPatientOption?.label?.split(' | ')[1] || 'Paciente'}`} elevated maxWidth="max-w-2xl">
        {rxError && <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded">{rxError}</div>}

        {/* Historial de recetas */}
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
          {selectedPatientOption?.prescriptions?.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">Sin recetas registradas.</p>
          )}
          {selectedPatientOption?.prescriptions?.map(rx => (
            <div key={rx.id} className={`flex flex-col sm:flex-row sm:items-start justify-between p-3 rounded-xl border text-xs gap-3 ${rx.status === 'active' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase shrink-0 ${rx.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : rx.status === 'expired' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {rx.status === 'active' ? 'Activa' : rx.status === 'expired' ? 'Vencida' : 'Inactiva'}
                  </span>
                  <span className="font-bold text-slate-700">{rx.dosage} L/min · {rx.usage_time} hrs</span>
                </div>
                <div className="text-slate-500 break-words">
                  Autorización: {rx.authorization_date || '—'} · Vence: <span className={rx.days_remaining < 0 ? 'text-red-600 font-bold' : ''}>{rx.expires_at || '—'}</span>
                </div>
                {rx.promissory_note && <div className="text-slate-400">Pagaré: {rx.promissory_note}</div>}
              </div>
              <div className="flex gap-2 sm:ml-3 shrink-0 self-end sm:self-auto border-t sm:border-none pt-2 sm:pt-0 w-full sm:w-auto justify-end border-slate-200">
                <button type="button" onClick={() => openRxEdit(rx)} className="px-3 py-1.5 sm:p-1 bg-white sm:bg-transparent border sm:border-none border-slate-200 text-blue-500 hover:text-blue-700 rounded transition-colors flex items-center gap-1 font-semibold sm:font-normal"><MdEdit className="text-base" /> <span className="sm:hidden">Editar</span></button>
                <button type="button" onClick={() => handleRxDelete(rx.id)} className="px-3 py-1.5 sm:p-1 bg-white sm:bg-transparent border sm:border-none border-slate-200 text-red-400 hover:text-red-600 rounded transition-colors flex items-center gap-1 font-semibold sm:font-normal"> <span className="sm:hidden">Eliminar</span></button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulario nueva/editar receta */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-700">{rxEditId ? '✏️ Editar Receta' : '➕ Nueva Receta'}</p>
            {rxEditId && <button type="button" onClick={() => { setRxEditId(null); setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' }); }} className="text-slate-400 hover:text-red-500 transition-colors p-1"><span className="text-xl">✕</span></button>}
          </div>
          <form onSubmit={handleRxSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dosificación</label>
                <input type="text" value={rxForm.dosage} onChange={e => setRxForm({...rxForm, dosage: e.target.value})}
                  placeholder="Ej: 3 L/min" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tiempo Uso</label>
                <input type="text" value={rxForm.usage_time} onChange={e => setRxForm({...rxForm, usage_time: e.target.value})}
                  placeholder="Ej: 24 hrs" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Autorización *</label>
                <input type="date" required value={rxForm.authorization_date} onChange={e => setRxForm({...rxForm, authorization_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Vencimiento *</label>
                <input type="date" required value={rxForm.expires_at} onChange={e => setRxForm({...rxForm, expires_at: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Pagaré</label>
                <input type="text" value={rxForm.promissory_note} onChange={e => setRxForm({...rxForm, promissory_note: e.target.value})}
                  placeholder="PAG-2024-001" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
                <select value={rxForm.status} onChange={e => setRxForm({...rxForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="active">Activa</option>
                  <option value="expired">Vencida</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={rxSaving} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm">
                {rxSaving ? 'Guardando...' : rxEditId ? 'Actualizar Receta' : 'Agregar Receta'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};

export default Decanting;