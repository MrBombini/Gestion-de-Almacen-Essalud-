import { useState, useEffect } from 'react';
import { MdSwapHoriz, MdSave, MdPerson, MdLocalHospital, MdPropaneTank, MdHotel, MdWarning, MdSettingsInputComponent } from 'react-icons/md';
import Select from 'react-select';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Exchange = () => {
  const { shift } = useAuth();

  const { data: patients, loading: loadingP } = useFetch('/patients');
  const { data: services, loading: loadingS } = useFetch('/services');
  const { data: cylinders, loading: loadingC } = useFetch('/cylinders');

  const { execute, loading: actionLoading } = useFetch('/inventory/exchange', 'POST', null, false);

  const patientsList = Array.isArray(patients) ? patients : (patients?.data || []);
  const servicesList = Array.isArray(services) ? services : (services?.data || []);
  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);

  const [destinationType, setDestinationType] = useState('service');

  const [formData, setFormData] = useState({
    patient_id: '',
    service_id: '',
    bed_id: '',
    prescription_id: '',
    cylinder_in: '',
    cylinder_out: '',
    notes: ''
  });

  const [selectedPatientData, setSelectedPatientData] = useState(null);
  const [prescriptionAlert, setPrescriptionAlert] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Limpiar campos al cambiar de tipo de destino
  useEffect(() => {
    setFormData({
      patient_id: '',
      service_id: '',
      bed_id: '',
      prescription_id: '',
      cylinder_in: '',
      cylinder_out: '',
      notes: ''
    });
    setSelectedPatientData(null);
    setPrescriptionAlert(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [destinationType]);

  // --- LOGICA DE PACIENTES Y RECETAS ---
  useEffect(() => {
    if (destinationType === 'patient' && formData.patient_id) {
      const patient = patientsList.find(p => p.id === formData.patient_id);
      setSelectedPatientData(patient);

      if (patient?.prescriptions && patient.prescriptions.length > 0) {
        const activePrescription = patient.prescriptions.find(pr => pr.status === 'active');
        if (activePrescription) {
          const today = new Date().toISOString().split('T')[0];
          if (today > activePrescription.expires_at) {
            setPrescriptionAlert({
              type: 'error',
              message: `¡ALERTA! La receta venció el ${format(new Date(activePrescription.expires_at), 'dd/MM/yyyy')}. El intercambio está bloqueado.`
            });
          } else {
            setPrescriptionAlert({
              type: 'success',
              message: `Receta vigente hasta el ${format(new Date(activePrescription.expires_at), 'dd/MM/yyyy')}.`
            });
            setFormData(prev => ({ ...prev, prescription_id: activePrescription.id }));
          }
        } else {
          setPrescriptionAlert({ type: 'error', message: 'El paciente no tiene una receta activa.' });
        }
      } else {
        setPrescriptionAlert({ type: 'error', message: 'El paciente no tiene recetas registradas.' });
      }
    }
  }, [formData.patient_id, destinationType, patientsList]);

  // --- FORMATEO Y FILTRADO DE DATOS ---
  const patientOptions = patientsList
    .filter(p => p.exchange_code) // Solo pacientes con código de intercambio
    .map(p => ({
      value: p.id,
      label: `${p.exchange_code} | ${p.full_name}`
    }));

  const serviceOptions = servicesList.map(s => ({
    value: s.id,
    label: s.name,
    type: s.type // Guardamos el tipo para filtrar en el JSX
  }));

  const bedOptions = formData.service_id
    ? servicesList.find(s => s.id === formData.service_id)?.beds?.map(b => ({
      value: b.id,
      label: `Cama: ${b.bed_number}`
    })) || []
    : [];

  const cylinderOutOptions = cylindersList
    .filter(c => {
      const isFull = c.status === 'full';
      if (destinationType === 'patient') return isFull; 
      return isFull && Number(c.capacity) === 10; 
    })
    .filter(c => {
      if (c.location === 'CENTRAL' && c.status === 'full') return true;
      return c.ownership_type_id !== 3; 
    })
    .map(c => ({
      value: c.id,
      label: `${c.serial_number} | ${c.ownership_type?.name || 'S/D'} | ${Number(c.capacity)}m³`
    }));

  const cylinderInOptions = cylindersList
    .filter(c => {
      const isInUse = c.status === 'in_use';
      if (destinationType === 'patient') return isInUse; 
      return isInUse && Number(c.capacity) === 10; 
    })
    .filter(c => {
      if (destinationType === 'patient' && formData.patient_id) {
        return c.current_patient_id === formData.patient_id;
      }
      if ((destinationType === 'service' || destinationType === 'manifold') && formData.service_id) {
        if (destinationType === 'service' && formData.bed_id) {
          return c.current_bed_id === formData.bed_id;
        }
        return c.current_service_id === formData.service_id;
      }
      return false;
    })
    .map(c => ({
      value: c.id,
      label: `${c.serial_number} | ${c.ownership_type?.name || 'S/D'} | ${Number(c.capacity)}m³`
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (destinationType === 'patient') {
      if (!formData.patient_id) return setErrorMessage('Selecciona un paciente.');
      if (prescriptionAlert?.type === 'error') return setErrorMessage('No se puede realizar el intercambio con una receta vencida o inexistente.');
    } else if (destinationType === 'service') {
      if (!formData.service_id) return setErrorMessage('Selecciona un servicio.');
      if (!formData.bed_id) return setErrorMessage('Selecciona una cama para el servicio.');
    } else if (destinationType === 'manifold') {
      if (!formData.service_id) return setErrorMessage('No se encontró el servicio de Manifold en la base de datos.');
    }

    if (!formData.cylinder_in) {
      return setErrorMessage('Debes seleccionar al menos el cilindro que se RECIBE (entrada).');
    }

    try {
      await execute({
        body: { ...formData, shift }
      });

      setSuccessMessage('¡Intercambio registrado con éxito!');
      setFormData({
        patient_id: '', service_id: '', bed_id: '',
        prescription_id: '', cylinder_in: '', cylinder_out: '', notes: ''
      });
      setPrescriptionAlert(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error en el registro.');
    }
  };

  if (loadingP || loadingS || loadingC) {
    return <div className="flex h-full items-center justify-center animate-pulse text-blue-600 font-bold text-xl">Cargando Módulo de Intercambio...</div>;
  }

  const customStyles = {
    control: (base) => ({
      ...base,
      padding: '2px',
      borderRadius: '0.75rem',
      borderColor: '#cbd5e1',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3b82f6' }
    })
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
          <MdSwapHoriz className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Canje de Balones</h2>
          <p className="text-slate-500 text-sm">Gestión de oxígeno para pacientes, servicios y estación de trasiego.</p>
        </div>
      </div>

      {(successMessage || errorMessage) && (
        <div className={`p-4 rounded-xl font-medium border-l-4 animate-fade-in ${successMessage ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
          {successMessage || errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <MdPerson className="text-indigo-500" /> 1. Destino y Validación
            </h3>

            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
              <button type="button" onClick={() => setDestinationType('service')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${destinationType === 'service' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Área / Hospital</button>
              <button type="button" onClick={() => setDestinationType('patient')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${destinationType === 'patient' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Paciente</button>
              <button type="button" onClick={() => setDestinationType('manifold')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${destinationType === 'manifold' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Manifold / Planta</button>
            </div>

            {destinationType === 'patient' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Buscar por Código de Canje</label>
                  <Select options={patientOptions} styles={customStyles} isClearable placeholder="-- Ingrese Código de Intercambio --" value={patientOptions.find(o => o.value === formData.patient_id) || null} onChange={(s) => setFormData({ ...formData, patient_id: s?.value || '' })} />
                </div>
                {prescriptionAlert && (
                  <div className={`p-3 rounded-xl flex items-center gap-3 text-sm font-bold border ${prescriptionAlert.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                    <MdWarning className="text-xl shrink-0" />
                    {prescriptionAlert.message}
                  </div>
                )}
              </div>
            )}

            {destinationType === 'service' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><MdLocalHospital className="text-slate-400" /> Servicio</label>
                  <Select options={serviceOptions.filter(s => s.type === 'HOSPITALIZACION')} styles={customStyles} placeholder="-- Seleccionar Servicio --" value={serviceOptions.find(o => o.value === formData.service_id) || null} onChange={(s) => setFormData({ ...formData, service_id: s?.value || '', bed_id: '' })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><MdHotel className="text-slate-400" /> Cama Específica</label>
                  <Select options={bedOptions} styles={customStyles} isDisabled={!formData.service_id} placeholder="-- Seleccionar Cama --" value={bedOptions.find(o => o.value === formData.bed_id) || null} onChange={(s) => setFormData({ ...formData, bed_id: s?.value || '' })} />
                </div>
              </div>
            )}

            {destinationType === 'manifold' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md">
                    <MdSettingsInputComponent className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">Estación de Trasiego</h4>
                    <p className="text-blue-700 text-xs">Canje de balones matriz para abastecimiento de planta.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Seleccione el Manifold (Lado)</label>
                  <Select 
                    options={serviceOptions.filter(s => s.label.includes('MANIFOLD'))} 
                    styles={customStyles} 
                    placeholder="-- Elegir Manifold 1 o 2 --" 
                    value={serviceOptions.find(o => o.value === formData.service_id) || null} 
                    onChange={(s) => setFormData({ ...formData, service_id: s?.value || '' })} 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <MdPropaneTank className="text-indigo-500" /> 2. Movimiento de Balones
            </h3>

            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-1 font-mono uppercase tracking-wider">Cilindro ENTREGADO (Lleno)</label>
              <Select options={cylinderOutOptions} styles={customStyles} placeholder="-- Seleccionar Lleno de Almacén --" value={cylinderOutOptions.find(o => o.value === formData.cylinder_out) || null} onChange={(s) => setFormData({ ...formData, cylinder_out: s?.value || '' })} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-orange-700 mb-1 font-mono uppercase tracking-wider">Cilindro RECIBIDO (Vacío)</label>
              <Select
                options={cylinderInOptions}
                styles={customStyles}
                isDisabled={(destinationType === 'patient' && !formData.patient_id) || (destinationType === 'service' && !formData.bed_id) || (destinationType === 'manifold' && !formData.service_id)}
                placeholder="-- Seleccionar Balón que el destino devuelve --"
                value={cylinderInOptions.find(o => o.value === formData.cylinder_in) || null}
                onChange={(s) => setFormData({ ...formData, cylinder_in: s?.value || '' })}
                noOptionsMessage={() => "No se encontraron balones asignados a esta ubicación."}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Notas del Intercambio</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" placeholder="Estado de los precintos, golpes, etc..."></textarea>
          </div>
          <button type="submit" disabled={actionLoading} className="w-full md:w-auto px-10 py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:bg-slate-400">
            <MdSave className="text-xl" /> {actionLoading ? 'Procesando...' : 'Finalizar Canje'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Exchange;