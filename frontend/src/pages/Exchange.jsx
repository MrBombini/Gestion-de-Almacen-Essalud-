import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import { MdSwapHoriz, MdSave, MdPerson, MdLocalHospital, MdPropaneTank, MdHotel, MdWarning, MdSettingsInputComponent, MdPrint, MdEdit } from 'react-icons/md';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import useRemoteDraft from '../hooks/useRemoteDraft';
import { format } from 'date-fns';
import Modal from '../components/Modal';
import api from '../services/api';

const Exchange = () => {
  const { user, shift } = useAuth();

  const { data: patients, loading: loadingP, refetch: refetchP } = useFetch('/patients');
  const { data: services, loading: loadingS } = useFetch('/services');
  const { data: cylinders, loading: loadingC, refetch: refetchC } = useFetch('/cylinders?per_page=all');
  const initialDraft = {
    formData: {
      patient_id: '',
      service_id: '',
      bed_id: '',
      prescription_id: '',
      cylinder_in: '',
      cylinder_out: '',
      notes: ''
    },
    destinationType: 'service',
    operationType: 'Exchange',
    selectedPatientOption: null,
    selectedCylOutOption: null,
    selectedCylInOption: null,
    selectedPatientData: null
  };

  const { draftData, setDraftData, clearDraft, saveStatus, isLoaded } = useRemoteDraft('exchange', initialDraft);

  const formData = draftData?.formData || initialDraft.formData;
  const destinationType = draftData?.destinationType || initialDraft.destinationType;
  const operationType = draftData?.operationType || initialDraft.operationType;
  const selectedPatientOption = draftData?.selectedPatientOption || initialDraft.selectedPatientOption;
  const selectedCylOutOption = draftData?.selectedCylOutOption || initialDraft.selectedCylOutOption;
  const selectedCylInOption = draftData?.selectedCylInOption || initialDraft.selectedCylInOption;
  const selectedPatientData = draftData?.selectedPatientData || initialDraft.selectedPatientData;

  const setFormData = (newData) => setDraftData(prev => ({ ...prev, formData: typeof newData === 'function' ? newData(prev.formData) : newData }));
  const setDestinationType = (newData) => setDraftData(prev => ({ ...prev, destinationType: typeof newData === 'function' ? newData(prev.destinationType) : newData }));
  const setOperationType = (newData) => setDraftData(prev => ({ ...prev, operationType: typeof newData === 'function' ? newData(prev.operationType) : newData }));
  const setSelectedPatientOption = (newData) => setDraftData(prev => ({ ...prev, selectedPatientOption: typeof newData === 'function' ? newData(prev.selectedPatientOption) : newData }));
  const setSelectedCylOutOption = (newData) => setDraftData(prev => ({ ...prev, selectedCylOutOption: typeof newData === 'function' ? newData(prev.selectedCylOutOption) : newData }));
  const setSelectedCylInOption = (newData) => setDraftData(prev => ({ ...prev, selectedCylInOption: typeof newData === 'function' ? newData(prev.selectedCylInOption) : newData }));
  const setSelectedPatientData = (newData) => setDraftData(prev => ({ ...prev, selectedPatientData: typeof newData === 'function' ? newData(prev.selectedPatientData) : newData }));

  const { execute, loading: actionLoading } = useFetch('/inventory/exchange', 'POST', null, false);

  const patientsList = Array.isArray(patients) ? patients : (patients?.data || []);
  const servicesList = Array.isArray(services) ? services : (services?.data || []);
  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);
  const [prescriptionAlert, setPrescriptionAlert] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [createdMovement, setCreatedMovement] = useState(null);

  const [rxModal, setRxModal] = useState(false);
  const [rxForm, setRxForm] = useState({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
  const [rxSaving, setRxSaving] = useState(false);
  const [rxEditId, setRxEditId] = useState(null);
  const [rxError, setRxError] = useState(null);

  const loadPatientOptions = async (inputValue) => {
    // Si escribe menos de 2 letras, no cargamos nada para evitar peticiones basura
    if (!inputValue || inputValue.length < 2) return [];

    try {
      const response = await api.get(`/patients?search=${inputValue}&per_page=15`);
      const data = response.data.data || response.data;

      return data.map(p => ({
        value: p.id,
        label: `${p.exchange_code || 'S/C'} | ${p.full_name}`,
        patientData: p
      }));
    } catch (error) {
      console.error('Error buscando pacientes:', error);
      return [];
    }
  };

  const loadCylinderOptions = async (inputValue, type) => {
    // type: 'OUT' (para llenos), 'IN' (para vacíos)
    try {
      const status = type === 'OUT' ? 'full' : 'in_use';
      const search = (inputValue || '').trim();

      const response = await api.get(`/cylinders?search=${encodeURIComponent(search)}&status=${status}&per_page=30`);
      const data = response.data.data || response.data || [];

      return data.map(c => {
        const barcodeTag = c.barcode ? ` [BC: ${c.barcode}]` : '';
        return {
          value: c.id,
          label: `${c.serial_number}${barcodeTag} | ${c.ownership_type?.name || 'S/D'} | ${Number(c.capacity)} m³`,
          serial_number: c.serial_number,
          barcode: c.barcode,
          cylinderData: c
        };
      });
    } catch (error) {
      console.error('Error buscando cilindros:', error);
      return [];
    }
  };

  const cylinderFilterOption = (candidate, input) => {
    if (!input) return true;
    const cleanInput = input.trim().toLowerCase();
    const label = (candidate.label || '').toLowerCase();
    const sn = (candidate.data?.serial_number || '').toLowerCase();
    const bc = (candidate.data?.barcode || '').toLowerCase();
    return label.includes(cleanInput) || sn.includes(cleanInput) || bc.includes(cleanInput);
  };

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
      setSelectedPatientData(res.data);
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
      setSelectedPatientData(res.data);
    } catch (err) {
      alert(err?.response?.data?.message || 'No se pudo eliminar.');
    }
  };

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
    setSelectedPatientOption(null);
    setOperationType('Exchange');
    setSelectedCylInOption(null);
    setSelectedCylOutOption(null);
    setSelectedPatientData(null);
    setPrescriptionAlert(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [destinationType]);

  // --- LOGICA DE PACIENTES Y RECETAS ---
  useEffect(() => {
    if (destinationType === 'patient' && formData.patient_id && selectedPatientData) {
      const patient = selectedPatientData;

      if (patient?.prescriptions && patient.prescriptions.length > 0) {
        const activePrescription = patient.prescriptions.find(pr => pr.status === 'active');
        if (activePrescription) {
          const today = format(new Date(), 'yyyy-MM-dd');
          const parseExpDate = (d) => new Date(d.includes('T') ? d : d + 'T00:00:00');
          if (today > activePrescription.expires_at) {
            setPrescriptionAlert({
              type: 'error',
              msg: `¡ALERTA! La receta venció el ${format(parseExpDate(activePrescription.expires_at), 'dd/MM/yyyy')}. El intercambio está bloqueado.`
            });
          } else {
            setPrescriptionAlert({
              type: 'success',
              msg: `Receta vigente hasta el ${format(parseExpDate(activePrescription.expires_at), 'dd/MM/yyyy')}.`
            });
            setFormData(prev => ({ ...prev, prescription_id: activePrescription.id }));
          }
        } else {
          setPrescriptionAlert({ type: 'error', msg: 'El paciente no tiene una receta activa.' });
        }
      } else {
        setPrescriptionAlert({ type: 'error', msg: 'El paciente no tiene recetas registradas.' });
      }
    }
  }, [formData.patient_id, destinationType, selectedPatientData]);

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

  const bedOptions = servicesList
    .filter(s => s.type?.toUpperCase() === 'HOSPITALIZACION' || s.type?.toLowerCase() === 'hospital')
    .flatMap(s => (s.beds || []).map(b => ({
      value: b.id,
      service_id: s.id,
      label: `Cama: ${b.bed_number} — ${s.name}`
    })));

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

  const cylinderInOptions = []; // Ya no se usa para filtrar en local

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

    if (operationType === 'Exchange') {
      if (!formData.cylinder_in || !formData.cylinder_out) {
        return setErrorMessage('Para un Intercambio, debes seleccionar ambos balones (el vacío que recibes y el lleno que entregas).');
      }
    } else if (operationType === 'Assignment') {
      if (!formData.cylinder_out) return setErrorMessage('Para una Asignación inicial, debes seleccionar el balón lleno a entregar.');
      if (formData.cylinder_in) return setErrorMessage('En Asignación inicial no se debe registrar balón vacío recibido.');
    }

    try {
      const response = await execute({
        body: { ...formData, shift }
      });

      setSuccessMessage('¡Intercambio registrado con éxito!');
      await clearDraft();
      
      if (destinationType === 'patient' && response) {
        setCreatedMovement(response);
      }
      setFormData({
        patient_id: '', service_id: '', bed_id: '',
        prescription_id: '', cylinder_in: '', cylinder_out: '', notes: ''
      });
      setOperationType('Exchange');
      setSelectedPatientOption(null);
      setSelectedCylInOption(null);
      setSelectedCylOutOption(null);
      setPrescriptionAlert(null);
      refetchC();
      refetchP();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error en el registro.');
    }
  };

  const handlePrintTicket = (ticket) => {
    if (!ticket) return;
    const patient = ticket.patient || {};
    const operator = ticket.user || user || {};

    const rawDate = ticket.movement_at ? new Date(ticket.movement_at) : new Date();
    const formattedDate = `${rawDate.getFullYear()}/${String(rawDate.getMonth() + 1).padStart(2, '0')}/${String(rawDate.getDate()).padStart(2, '0')}`;

    const cylinderMovements = ticket.cylinder_movements || [];
    const cylinderOut = cylinderMovements.find(m => m.action === 'Exit')?.cylinder || {};
    const cylinderIn = cylinderMovements.find(m => m.action === 'Entry')?.cylinder || {};
    const attentionNum = ticket.attention_number || ticket.id;

    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Control de Atención N° ${attentionNum}</title>
          <style>
            @page {
              size: 76mm 76mm;
              margin: 0 !important;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 4mm 4mm;
              color: #000;
              width: 74mm;
              height: 74mm;
              box-sizing: border-box;
              font-size: 11px;
              line-height: 1.3;
              overflow: hidden;
            }
            .ticket-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }
            .ticket-header { 
              text-align: center; 
              border-bottom: 1.5px solid #000; 
              margin-bottom: 5px;
              padding-bottom: 3px;
            }
            .ticket-header h3 {
              margin: 0;
              font-size: 14px;
              font-weight: bold;
            }
            .ticket-body {
              flex-grow: 1;
            }
            .line { 
              margin-bottom: 3px; 
              font-size: 11px; 
            }
            .bold { 
              font-weight: bold; 
            }
            table { 
              text-align: left; 
              border-collapse: collapse; 
              margin-top: 4px; 
              margin-bottom: 4px; 
              width: 100%; 
              font-size: 10.5px;
            }
            th { 
              border-bottom: 1px dashed #000; 
              padding-bottom: 2px; 
              font-weight: bold;
              text-decoration: underline;
            }
            td { 
              padding: 3px 0; 
            }
            .cylinder-number {
              font-weight: bold;
              font-size: 12px;
            }
            .ticket-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 4px;
            }
            .footer-info {
              font-size: 10.5px;
            }
            .signatures { 
              width: 120px; 
              font-size: 10px;
            }
            .sign-line { 
              border-top: 1px solid #000; 
              padding-top: 2px;
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="ticket-header">
              <h3>CONTROL DE ATENCIÓN N° ${attentionNum}</h3>
            </div>
            <div class="ticket-body">
              <div class="line"><span class="bold">Paciente:</span> ${patient.full_name || '-'}</div>
              <div class="line"><span class="bold">Cod. Paciente:</span> ${patient.exchange_code || patient.dni || patient.id || '-'}</div>
              <div class="line"><span class="bold">Dirección:</span> ${patient.address || '-'}</div>
              <table>
                <thead>
                  <tr>
                    <th>Cod.</th>
                    <th>Prop.</th>
                    <th>Cap.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>B. LLENO: <span class="cylinder-number">${cylinderOut.serial_number || 'N/A'}</span></td>
                    <td>${cylinderOut.ownership_type?.name || cylinderOut.ownership_type_name || 'N/A'}</td>
                    <td>${cylinderOut.capacity ? `${cylinderOut.capacity} m3` : '-'}</td>
                  </tr>
                  <tr>
                    <td>B. VACÍO: <span class="cylinder-number">${cylinderIn.serial_number || 'N/A'}</span></td>
                    <td>${cylinderIn.ownership_type?.name || cylinderIn.ownership_type_name || 'N/A'}</td>
                    <td>${cylinderIn.capacity ? `${cylinderIn.capacity} m3` : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="ticket-footer">
              <div class="footer-info">
                <div class="line"><span>Operador:</span> ${operator.name || '-'}</div>
                <div class="line"><span>Fecha:</span> ${formattedDate}</div>
              </div>
              <div class="signatures">
                <div class="sign-line">
                  <div><span>Nombre:</span></div>
                  <div><span>Cel:</span></div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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

      {isLoaded && !successMessage && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in justify-between mb-4">
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
              Carrito de Canje
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

      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <MdPerson className="text-indigo-500" /> 1. Destino y Validación
            </h3>

            <div className="flex flex-col sm:flex-row p-1 bg-slate-100 rounded-xl w-full sm:w-fit gap-1">
              <button type="button" onClick={() => setDestinationType('service')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all text-center ${destinationType === 'service' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Área / Hospital</button>
              <button type="button" onClick={() => setDestinationType('patient')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all text-center ${destinationType === 'patient' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Paciente</button>
              <button type="button" onClick={() => setDestinationType('manifold')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all text-center ${destinationType === 'manifold' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Manifold / Planta</button>
            </div>

            {destinationType === 'patient' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Buscar por Código de Canje</label>
                  <AsyncSelect
                    cacheOptions
                    loadOptions={loadPatientOptions} // Usamos la nueva función
                    isClearable
                    placeholder="-- Buscar por Nombre, Apellido o Código --"
                    value={selectedPatientOption}
                    onChange={(s) => {
                      setSelectedPatientOption(s); // Guardamos la opción completa para que el label persista
                      setFormData({ ...formData, patient_id: s?.value || '' });
                      if (s?.patientData) setSelectedPatientData(s.patientData);
                    }}
                    noOptionsMessage={({ inputValue }) => !inputValue ? "Escriba para buscar..." : "No se encontró el paciente."}
                    styles={customStyles}
                  />
                </div>
                {prescriptionAlert && (
                  <div className={`p-3 rounded-xl flex items-center justify-between text-sm font-bold border ${prescriptionAlert.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                    <div className="flex items-center gap-3">
                      <MdWarning className="text-xl shrink-0" />
                      <div>{prescriptionAlert.msg}</div>
                    </div>
                    {prescriptionAlert.type === 'error' && (
                      <button type="button" onClick={() => {
                        setRxEditId(null);
                        setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
                        setRxError(null);
                        setRxModal(true);
                      }} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ml-2">
                        + Actualizar Receta
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {destinationType === 'service' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><MdHotel className="text-slate-400" /> Buscar Cama por Número</label>
                  <Select 
                    options={bedOptions} 
                    styles={customStyles} 
                    placeholder="-- Buscar o Seleccionar Cama --" 
                    value={bedOptions.find(o => o.value === formData.bed_id) || null} 
                    onChange={(s) => setFormData({ ...formData, service_id: s?.service_id || '', bed_id: s?.value || '' })} 
                    isSearchable
                  />
                  {formData.service_id && (
                     <p className="mt-2 text-xs font-semibold text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center gap-2">
                        <MdLocalHospital className="text-blue-500" /> Servicio asignado: {servicesList.find(s => s.id === formData.service_id)?.name}
                     </p>
                  )}
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
                    options={serviceOptions.filter(s => s.type?.toLowerCase() === 'manifold' || s.label?.toUpperCase().includes('MANIFOLD'))}
                    styles={customStyles}
                    placeholder="-- Elegir Manifold Lado A o B --"
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

            <div className="flex flex-col sm:flex-row p-1 bg-slate-100 rounded-xl w-full gap-1">
              <button type="button" onClick={() => { setOperationType('Exchange'); setFormData({...formData, cylinder_in: '', cylinder_out: ''}); setSelectedCylInOption(null); setSelectedCylOutOption(null); }} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all text-center ${operationType === 'Exchange' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>🔄 Intercambio</button>
              <button type="button" onClick={() => { setOperationType('Assignment'); setFormData({...formData, cylinder_in: ''}); setSelectedCylInOption(null); }} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all text-center ${operationType === 'Assignment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>📤 Asignación</button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-1 font-mono uppercase tracking-wider">Cilindro ENTREGADO (Lleno)</label>
              <AsyncSelect
                cacheOptions
                loadOptions={(val) => loadCylinderOptions(val, 'OUT')}
                filterOption={cylinderFilterOption}
                isClearable
                placeholder="-- Buscar o escanear balón lleno (serie o código de barras) --"
                value={selectedCylOutOption}
                onChange={(s) => {
                  setSelectedCylOutOption(s);
                  setFormData({ ...formData, cylinder_out: s?.value || '' });
                }}
                noOptionsMessage={({ inputValue }) => !inputValue ? "Escriba o escanee para buscar..." : "No se encontró cilindro."}
                styles={customStyles}
              />
            </div>

            <div className={operationType === 'Assignment' ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}>
              <label className="block text-sm font-semibold text-orange-700 mb-1 font-mono uppercase tracking-wider">Cilindro RECIBIDO (Vacío)</label>
              <AsyncSelect
                cacheOptions
                loadOptions={(val) => loadCylinderOptions(val, 'IN')}
                filterOption={cylinderFilterOption}
                isClearable
                placeholder="-- Buscar o escanear balón vacío (serie o código de barras) --"
                value={selectedCylInOption}
                onChange={(s) => {
                  setSelectedCylInOption(s);
                  setFormData({ ...formData, cylinder_in: s?.value || '' });
                }}
                isDisabled={(destinationType === 'patient' && !formData.patient_id)}
                noOptionsMessage={({ inputValue }) => !inputValue ? "Escriba o escanee para buscar..." : "No se encontró cilindro."}
                styles={customStyles}
              />
              {selectedCylInOption && selectedCylInOption.cylinderData && destinationType === 'service' && formData.bed_id && (
                selectedCylInOption.cylinderData.current_bed_id !== formData.bed_id || selectedCylInOption.cylinderData.current_service_id !== formData.service_id
              ) && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-semibold flex gap-2 items-start animate-fade-in">
                  <MdWarning className="text-xl shrink-0 text-amber-500" />
                  <div>
                    ¡Aviso! Este balón no está registrado en la cama seleccionada.<br/>
                    <span className="font-normal text-amber-700">Ubicación actual: {selectedCylInOption.cylinderData.current_service?.name || 'S/D'} — Cama {selectedCylInOption.cylinderData.current_bed?.bed_number || 'S/D'}</span>
                  </div>
                </div>
              )}
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

      {/* MODAL TICKET DE ATENCION (IMPRESION RAPIDA) */}
      {createdMovement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-slate-100 space-y-6">

            {/* Cabecera */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-emerald-100 shadow-sm animate-bounce">
                ✓
              </div>
              <h3 className="text-xl font-black text-slate-800">¡Canje Registrado con Éxito!</h3>
              <p className="text-slate-500 text-sm">Operación de Intercambio N° {createdMovement.id}</p>
            </div>

            {/* Vista Previa del Ticket Simplificado */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-700 space-y-3 font-mono shadow-inner">
              <div className="border-b pb-2 text-center font-bold text-slate-600 tracking-wider">VISTA PREVIA DEL TICKET</div>
              <div className="space-y-1">
                <div><span className="font-sans font-bold text-slate-400">Paciente:</span> {createdMovement.patient?.full_name}</div>
                <div><span className="font-sans font-bold text-slate-400">Código:</span> {createdMovement.patient?.exchange_code || createdMovement.patient?.dni}</div>
                <div><span className="font-sans font-bold text-slate-400">Fecha:</span> {format(new Date(createdMovement.movement_at), 'dd/MM/yyyy HH:mm')}</div>
              </div>

              {/* Detalle de Cilindros */}
              <div className="border-t border-dashed pt-2 space-y-1">
                {createdMovement.cylinder_movements?.map((m) => (
                  <div key={m.id} className="flex justify-between">
                    <span>{m.action === 'Exit' ? 'B. LLENO:' : 'B. VACÍO:'} <strong className="font-bold text-slate-800">{m.cylinder?.serial_number}</strong></span>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">{m.cylinder?.capacity} m³</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreatedMovement(null);
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm border border-slate-200/50 flex items-center justify-center gap-1.5"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handlePrintTicket(createdMovement)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-sm shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5"
              >
                <MdPrint className="text-lg" /> Imprimir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal para Renovar Receta en Intercambio */}
      <Modal isOpen={rxModal} onClose={() => setRxModal(false)} title={`📋 Recetas de ${selectedPatientData?.full_name || ''}`} elevated maxWidth="max-w-2xl">
        {rxError && <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded">{rxError}</div>}

        {/* Historial de recetas */}
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
          {selectedPatientData?.prescriptions?.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">Sin recetas registradas.</p>
          )}
          {selectedPatientData?.prescriptions?.map(rx => (
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
                  {rx.days_remaining !== null && rx.days_remaining !== undefined && (
                    <span className={`ml-1 sm:ml-2 font-semibold ${rx.days_remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ({rx.days_remaining < 0 ? `Vencida hace ${Math.abs(rx.days_remaining)}d` : rx.days_remaining === 0 ? 'Vence hoy' : `${rx.days_remaining}d restantes`})
                    </span>
                  )}
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

export default Exchange;
