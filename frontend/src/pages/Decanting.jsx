import { useState, useEffect } from 'react';
import { MdSave, MdCompress, MdPropaneTank, MdLocalHospital, MdPerson } from 'react-icons/md';
import Select from 'react-select';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Decanting = () => {
  const { shift } = useAuth();

  const { data: cylinders, loading: loadingC, refetch: refetchC } = useFetch('/cylinders');
  const { data: services, loading: loadingS } = useFetch('/services');
  const { data: patients, loading: loadingP, refetch: refetchP } = useFetch('/patients');

  const { execute, loading: actionLoading } = useFetch('/inventory/decanting', 'POST', null, false);

  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);
  const servicesList = Array.isArray(services) ? services : (services?.data || []);
  const patientsList = Array.isArray(patients) ? patients : (patients?.data || []);

  const [destinationType, setDestinationType] = useState('service'); // 'service' o 'patient'

  const [formData, setFormData] = useState({
    service_id: '',
    patient_id: '',
    prescription_id: '',
    cylinder_id: '',
    refilled_amount: ''
  });

  const [selectedCylinderData, setSelectedCylinderData] = useState(null);
  const [prescriptionAlert, setPrescriptionAlert] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Opciones de Destino
  const serviceOptions = servicesList.map(s => ({ value: s.id, label: s.name }));
  const patientOptions = patientsList
    .filter(p => p.trasiego_code) // Solo pacientes con código de trasiego
    .map(p => ({
      value: p.id,
      label: `${p.trasiego_code} | ${p.full_name}`,
      prescriptions: p.prescriptions || []
    }));

  // Opciones Dinámicas de Balón (Dependen del destino)
  const cylinderOptions = cylindersList
    .filter(c => (c.status === 'empty' || c.status === 'in_use') && Number(c.capacity) >= 1 && Number(c.capacity) <= 10)
    .filter(c => {
      if (destinationType === 'service') return c.ownership_type?.name?.toLowerCase().includes('essalud');
      if (destinationType === 'patient') return c.ownership_type?.name?.toLowerCase().includes('propio') && c.patient_id === formData.patient_id;
      return false;
    })
    .map(c => ({
      value: c.id,
      label: `${c.serial_number} | ${c.ownership_type?.name || 'S/D'} | ${Number(c.capacity)}m³`,
      capacity: c.capacity,
      ownership: c.ownership_type?.name
    }));

  // Efecto para verificar receta cuando selecciona paciente
  useEffect(() => {
    setPrescriptionAlert(null);
    setFormData(prev => ({ ...prev, prescription_id: '', cylinder_id: '' })); // Limpiar cilindro al cambiar paciente
    setSelectedCylinderData(null);

    if (destinationType === 'patient' && formData.patient_id) {
      const patient = patientOptions.find(p => p.value === formData.patient_id);
      if (patient) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const validPrescription = patient.prescriptions.find(
          rx => rx.status === 'active' && rx.expires_at >= today
        );

        if (validPrescription) {
          setFormData(prev => ({ ...prev, prescription_id: validPrescription.id }));
          setPrescriptionAlert({
            type: 'success',
            message: `Receta activa detectada (Expira: ${validPrescription.expires_at}). Dosis: ${validPrescription.dosage}`
          });
        } else {
          setPrescriptionAlert({
            type: 'error',
            message: 'El paciente no cuenta con una receta vigente o ha expirado. Regularice la receta antes de trasegar.'
          });
        }
      }
    }
  }, [formData.patient_id, destinationType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validaciones estrictas
    if (destinationType === 'service' && !formData.service_id) {
      setErrorMessage('Selecciona un servicio válido de EsSalud.');
      return;
    }

    if (destinationType === 'patient' && (!formData.patient_id || !formData.prescription_id)) {
      setErrorMessage('El paciente debe estar seleccionado y contar con receta válida.');
      return;
    }

    if (!formData.cylinder_id) {
      setErrorMessage('Por favor, selecciona el balón a recargar.');
      return;
    }

    try {
      await execute({
        body: {
          ...formData,
          shift: shift
        }
      });

      setSuccessMessage('¡Recarga de balón registrada con éxito!');
      setFormData({
        service_id: '',
        patient_id: '',
        prescription_id: '',
        cylinder_id: '',
        refilled_amount: ''
      });
      setSelectedCylinderData(null);
      setPrescriptionAlert(null);
      refetchC();
      refetchP();
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
    })
  };

  if (loadingC || loadingS || loadingP) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Cabecera */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
          <MdCompress className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Trasiego (Llenado de Balón)</h2>
          <p className="text-slate-500 text-sm mt-1">
            Registro de recarga. Turno: <span className="font-bold text-blue-600">{shift}</span>
          </p>
        </div>
      </div>

      {successMessage && <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md text-emerald-700 font-medium">{successMessage}</div>}
      {errorMessage && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium">{errorMessage}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">

          {/* SECCIÓN 1: DESTINO */}
          <div className="p-8 space-y-6 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MdLocalHospital className="text-orange-600" /> 1. Autorización y Destino
            </h3>

            <div className="flex gap-4 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="destType" value="service" checked={destinationType === 'service'} onChange={() => { setDestinationType('service'); setFormData({ ...formData, patient_id: '', cylinder_id: '' }); setSelectedCylinderData(null); }} className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700 font-medium">Área / Servicio (Balones EsSalud)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="destType" value="patient" checked={destinationType === 'patient'} onChange={() => { setDestinationType('patient'); setFormData({ ...formData, service_id: '', cylinder_id: '' }); setSelectedCylinderData(null); }} className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700 font-medium">Paciente Directo (Balones Propios)</span>
              </label>
            </div>

            <div>
              {destinationType === 'service' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccione el Servicio de Destino</label>
                  <Select
                    options={serviceOptions}
                    styles={customStyles}
                    isClearable
                    placeholder="-- Buscar Servicio (Ej. Emergencia) --"
                    value={serviceOptions.find(opt => opt.value === formData.service_id) || null}
                    onChange={(selected) => setFormData({ ...formData, service_id: selected ? selected.value : '' })}
                  />
                </div>
              )}

              {destinationType === 'patient' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccione el Paciente (Búsqueda por Código PAC)</label>
                    <Select
                      options={patientOptions}
                      styles={customStyles}
                      isClearable
                      placeholder="-- Buscar Paciente por Código de Trasiego --"
                      value={patientOptions.find(opt => opt.value === formData.patient_id) || null}
                      onChange={(selected) => setFormData({ ...formData, patient_id: selected ? selected.value : '' })}
                    />
                  </div>

                  {prescriptionAlert && (
                    <div className={`p-4 rounded-lg border flex gap-3 text-sm ${prescriptionAlert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800 font-bold'}`}>
                      <MdPerson className="text-xl shrink-0" />
                      <p>{prescriptionAlert.message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: BALÓN */}
          <div className="p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MdPropaneTank className="text-blue-600" /> 2. Balón a Recargar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {destinationType === 'service' ? 'Balones Disponibles (EsSalud)' : 'Balones Propiedad del Paciente'}
                </label>
                <Select
                  options={cylinderOptions}
                  styles={customStyles}
                  isClearable
                  isDisabled={(destinationType === 'patient' && !formData.patient_id) || (destinationType === 'service' && !formData.service_id)}
                  placeholder={(destinationType === 'patient' && !formData.patient_id) || (destinationType === 'service' && !formData.service_id) ? 'Seleccione destino primero' : '-- Buscar código de balón --'}
                  value={cylinderOptions.find(opt => opt.value === formData.cylinder_id) || null}
                  onChange={(selected) => {
                    setFormData({ ...formData, cylinder_id: selected ? selected.value : '' });
                    setSelectedCylinderData(selected || null);
                  }}
                  noOptionsMessage={() => destinationType === 'patient' ? "El paciente seleccionado no tiene balones vacíos registrados." : "El servicio seleccionado no tiene balones vacíos exclusivos."}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cantidad a inyectar (m³)</label>
                <div className="relative">
                  <input
                    type="number" step="0.01" required min="0.01"
                    value={formData.refilled_amount}
                    onChange={(e) => setFormData({ ...formData, refilled_amount: e.target.value })}
                    className="w-full pl-4 pr-16 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    placeholder="Ej: 8.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-l pl-3">m³</span>
                </div>
                {selectedCylinderData && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Capacidad de esta botella: {selectedCylinderData.capacity} m³
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading || (destinationType === 'patient' && !formData.prescription_id)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed"
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