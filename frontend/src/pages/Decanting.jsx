import { useState } from 'react';
import { formatDate } from '../utils/dateUtils';
import { MdSave, MdCompress, MdPropaneTank, MdLocalHospital, MdPerson, MdEdit, MdWarning, MdInfo } from 'react-icons/md';
import Modal from '../components/Modal';
import AsyncSelect from 'react-select/async';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import useRemoteDraft from '../hooks/useRemoteDraft';
import { format } from 'date-fns';
import api from '../services/api';

const Decanting = () => {
  const { shift } = useAuth();

  const { execute, loading: actionLoading } = useFetch('/inventory/decanting', 'POST', null, false);

  const initialDraft = {
    formData: {
      service_id: '',
      patient_id: '',
      prescription_id: '',
      cylinder_id: '',
      refilled_amount: ''
    },
    selectedCylinderOption: null,
    detectedDestination: null,
    prescriptionAlert: null
  };

  const { draftData, setDraftData, clearDraft, saveStatus, isLoaded } = useRemoteDraft('decanting', initialDraft);

  const formData = draftData?.formData || initialDraft.formData;
  const selectedCylinderOption = draftData?.selectedCylinderOption || initialDraft.selectedCylinderOption;
  const detectedDestination = draftData?.detectedDestination || initialDraft.detectedDestination;
  const prescriptionAlert = draftData?.prescriptionAlert || initialDraft.prescriptionAlert;

  const setFormData = (newData) => {
    setDraftData(prev => ({
      ...prev,
      formData: typeof newData === 'function' ? newData(prev.formData) : newData
    }));
  };

  const setSelectedCylinderOption = (newOption) => {
    setDraftData(prev => ({ ...prev, selectedCylinderOption: newOption }));
  };

  const setDetectedDestination = (newData) => {
    setDraftData(prev => ({ 
      ...prev, 
      detectedDestination: typeof newData === 'function' ? newData(prev.detectedDestination) : newData 
    }));
  };

  const setPrescriptionAlert = (newAlert) => {
    setDraftData(prev => ({ ...prev, prescriptionAlert: newAlert }));
  };

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modal Receta
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
      
      // Actualizar paciente y re-validar
      const res = await api.get(`/patients/${formData.patient_id}`);
      const updatedPatient = res.data;
      setDetectedDestination(prev => ({ ...prev, patientObject: updatedPatient }));
      validatePrescription(updatedPatient);
      
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
      const updatedPatient = res.data;
      setDetectedDestination(prev => ({ ...prev, patientObject: updatedPatient }));
      validatePrescription(updatedPatient);
    } catch (err) {
      alert(err?.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  const validatePrescription = (patient) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const validPrescription = patient.prescriptions?.find(
      rx => rx.status === 'active' && rx.expires_at >= today
    );

    if (validPrescription) {
      setFormData(prev => ({ ...prev, prescription_id: validPrescription.id }));
      setPrescriptionAlert({
        type: 'success',
        message: `Receta activa (Expira: ${formatDate(validPrescription.expires_at)}). Dosis: ${validPrescription.dosage}`
      });
    } else {
      setFormData(prev => ({ ...prev, prescription_id: '' }));
      setPrescriptionAlert({
        type: 'error',
        message: 'El paciente no cuenta con una receta vigente o ha expirado.'
      });
    }
  };

  // ==========================================
  // CARGA ASÍNCRONA DE CILINDROS
  // ==========================================
  const loadCylinderOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      const response = await api.get('/cylinders', { params: { search: inputValue, per_page: 30 } });
      const data = response.data.data || response.data || [];

      return data
        // Solo balones que están vacíos o en uso (que es lo normal para recargar)
        .filter(c => (c.status === 'empty' || c.status === 'in_use'))
        .map(c => ({
          value: c.id,
          label: `${c.serial_number} | ${c.ownership_type?.name || 'S/D'} | ${Number(c.capacity)}m³`,
          cylinder: c
        }));
    } catch (error) {
      console.error('Error buscando cilindros:', error);
      return [];
    }
  };

  const handleCylinderSelect = (selectedOption) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setPrescriptionAlert(null);
    setDetectedDestination(null);
    setFormData({ service_id: '', patient_id: '', prescription_id: '', cylinder_id: '', refilled_amount: '' });

    if (!selectedOption) {
      setSelectedCylinderOption(null);
      return;
    }

    const cyl = selectedOption.cylinder;
    
    // 1. Verificar si está asignado a algún lugar
    let isAssigned = false;
    let serviceId = null;
    let patientId = null;
    let patientObj = null;

    if (cyl.current_service_id) {
      isAssigned = true;
      serviceId = cyl.current_service_id;
      setDetectedDestination({ type: 'service', name: cyl.current_service?.name || 'Servicio Desconocido' });
    } else if (cyl.current_patient_id) {
      isAssigned = true;
      patientId = cyl.current_patient_id;
      patientObj = cyl.current_patient;
      setDetectedDestination({ type: 'patient', name: patientObj?.full_name || 'Paciente', patientObject: patientObj });
    } else if (cyl.patient_id) { // Balón propio del paciente que quizás figura vacío
      isAssigned = true;
      patientId = cyl.patient_id;
      patientObj = cyl.patient;
      setDetectedDestination({ type: 'patient', name: patientObj?.full_name || 'Paciente', patientObject: patientObj });
    }

    if (!isAssigned) {
      setErrorMessage('Este balón no está asignado a ningún paciente ni servicio (estado VACÍO en CENTRAL). Debe estar asignado para poder realizarle un trasiego.');
      setSelectedCylinderOption(null);
      return;
    }

    // 2. Setear data
    setSelectedCylinderOption(selectedOption);
    setFormData(prev => ({ 
      ...prev, 
      cylinder_id: cyl.id,
      service_id: serviceId || '',
      patient_id: patientId || ''
    }));

    // 3. Si es paciente, validar receta
    if (patientId && patientObj) {
      validatePrescription(patientObj);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!formData.cylinder_id) {
      return setErrorMessage('Por favor, selecciona o escanea el balón a recargar.');
    }

    if (detectedDestination?.type === 'patient' && !formData.prescription_id) {
      return setErrorMessage('El paciente detectado debe contar con una receta médica vigente.');
    }

    if (!formData.refilled_amount || formData.refilled_amount <= 0) {
      return setErrorMessage('Por favor, ingresa una cantidad válida a inyectar.');
    }

    try {
      await execute({
        body: { ...formData, shift }
      });

      setSuccessMessage('¡Recarga de balón registrada con éxito!');
      await clearDraft();

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
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-10">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-3 sm:p-4 bg-orange-50 text-orange-600 rounded-xl shrink-0">
          <MdCompress className="text-2xl sm:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Trasiego (Llenado Rápido)</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Escanea el balón y registra la recarga automáticamente. Turno: <span className="font-bold text-blue-600">{shift}</span>
          </p>
        </div>
      </div>

      {isLoaded && !successMessage && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in justify-between mb-4 mt-2">
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
              Carrito de Trasiego
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

      {successMessage && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md text-emerald-700 font-medium text-sm sm:text-base mb-4 mt-2">{successMessage}</div>}
      {errorMessage && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium text-sm sm:text-base mb-4 mt-2">{errorMessage}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="divide-y divide-slate-100">

          {/* SECCIÓN 1: ESCANEO DE BALÓN */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-slate-50">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <MdPropaneTank className="text-blue-600 text-xl" /> 1. Escanear Balón
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Código de Balón
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadCylinderOptions}
                  styles={customStyles}
                  isClearable
                  placeholder="Escanea o escribe..."
                  value={selectedCylinderOption}
                  onChange={handleCylinderSelect}
                  noOptionsMessage={({ inputValue }) => !inputValue ? "Escribe el código..." : "No encontrado o inactivo."}
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
                {selectedCylinderOption?.cylinder && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Capacidad máxima: {selectedCylinderOption.cylinder.capacity} m³
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DESTINO DETECTADO (SOLO LECTURA) */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <MdInfo className="text-orange-600 text-xl" /> 2. Destino Detectado
            </h3>

            {!detectedDestination ? (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 font-medium">
                Escanea un balón para detectar automáticamente a dónde pertenece.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  {detectedDestination.type === 'service' ? (
                    <MdLocalHospital className="text-3xl text-blue-600" />
                  ) : (
                    <MdPerson className="text-3xl text-purple-600" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      {detectedDestination.type === 'service' ? 'Pertenece al Servicio:' : 'Pertenece al Paciente:'}
                    </p>
                    <p className="text-lg font-bold text-slate-800">{detectedDestination.name}</p>
                  </div>
                </div>

                {detectedDestination.type === 'patient' && prescriptionAlert && (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-3 text-sm items-center justify-between ${prescriptionAlert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800 font-bold'}`}>
                    <div className="flex items-center gap-2">
                      <MdWarning className="text-xl shrink-0" />
                      <p>{prescriptionAlert.message}</p>
                    </div>
                    {prescriptionAlert.type === 'error' && (
                      <button type="button" onClick={() => {
                        setRxEditId(null);
                        setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
                        setRxError(null);
                        setRxModal(true);
                      }} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors whitespace-nowrap shadow-sm shadow-red-200">
                        + Renovar Receta
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 flex justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={actionLoading || !selectedCylinderOption || (detectedDestination?.type === 'patient' && !formData.prescription_id)}
              className="w-full sm:w-auto flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              <MdSave className="text-xl" />
              {actionLoading ? 'Guardando...' : 'Registrar Trasiego'}
            </button>
          </div>

        </form>
      </div>

      {/* Modal para Renovar Receta (Sin Cambios Visuales) */}
      <Modal isOpen={rxModal} onClose={() => setRxModal(false)} title={`📋 Recetas de ${detectedDestination?.name || 'Paciente'}`} elevated maxWidth="max-w-2xl">
        {rxError && <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded">{rxError}</div>}

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
          {detectedDestination?.patientObject?.prescriptions?.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">Sin recetas registradas.</p>
          )}
          {detectedDestination?.patientObject?.prescriptions?.map(rx => (
            <div key={rx.id} className={`flex flex-col sm:flex-row sm:items-start justify-between p-3 rounded-xl border text-xs gap-3 ${rx.status === 'active' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase shrink-0 ${rx.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : rx.status === 'expired' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {rx.status === 'active' ? 'Activa' : rx.status === 'expired' ? 'Vencida' : 'Inactiva'}
                  </span>
                  <span className="font-bold text-slate-700">{rx.dosage} L/min · {rx.usage_time} hrs</span>
                </div>
                <div className="text-slate-500 break-words">
                  Autorización: {formatDate(rx.authorization_date)} · Vence: <span className={rx.days_remaining < 0 ? 'text-red-600 font-bold' : ''}>{formatDate(rx.expires_at)}</span>
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