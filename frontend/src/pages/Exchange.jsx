import { useState, useEffect } from 'react';
import { MdSwapHoriz, MdSave, MdPerson, MdLocalHospital, MdPropaneTank, MdHotel, MdWarning, MdSettingsInputComponent, MdPrint } from 'react-icons/md';
import Select from 'react-select';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import Modal from '../components/Modal';
import api from '../services/api';

const Exchange = () => {
  const { user, shift } = useAuth();

  const { data: patients, loading: loadingP, refetch: refetchP } = useFetch('/patients');
  const { data: services, loading: loadingS } = useFetch('/services');
  const { data: cylinders, loading: loadingC, refetch: refetchC } = useFetch('/cylinders?per_page=all');

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
  const [createdMovement, setCreatedMovement] = useState(null);

  const [rxModal, setRxModal] = useState(false);
  const [rxForm, setRxForm] = useState({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
  const [rxSaving, setRxSaving] = useState(false);

  const handleRxSubmit = async (e) => {
    e.preventDefault();
    setRxSaving(true);
    try {
      await api.post('/prescriptions', { ...rxForm, patient_id: formData.patient_id });
      setRxModal(false);
      refetchP(); 
      setFormData(prev => ({ ...prev, patient_id: '' }));
      setPrescriptionAlert({ type: 'success', msg: 'Receta actualizada correctamente. Vuelve a seleccionar al paciente.' });
    } catch (err) {
      alert('Error al guardar la receta.');
    } finally {
      setRxSaving(false);
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
          const today = format(new Date(), 'yyyy-MM-dd');
          if (today > activePrescription.expires_at) {
            setPrescriptionAlert({
              type: 'error',
              msg: `¡ALERTA! La receta venció el ${format(new Date(activePrescription.expires_at), 'dd/MM/yyyy')}. El intercambio está bloqueado.`
            });
          } else {
            setPrescriptionAlert({
              type: 'success',
              msg: `Receta vigente hasta el ${format(new Date(activePrescription.expires_at), 'dd/MM/yyyy')}.`
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

    if (!formData.cylinder_in && !formData.cylinder_out) {
      return setErrorMessage('Debes seleccionar al menos un cilindro de entrada (recibido) o de salida (entregado).');
    }

    try {
      const response = await execute({
        body: { ...formData, shift }
      });

      setSuccessMessage('¡Intercambio registrado con éxito!');
      if (destinationType === 'patient' && response) {
        setCreatedMovement(response);
      }
      setFormData({
        patient_id: '', service_id: '', bed_id: '',
        prescription_id: '', cylinder_in: '', cylinder_out: '', notes: ''
      });
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

    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Control de Atención N° ${ticket.id}</title>
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
              <h3>CONTROL DE ATENCIÓN N° ${ticket.id}</h3>
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
                  <div className={`p-3 rounded-xl flex items-center justify-between text-sm font-bold border ${prescriptionAlert.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                    <div className="flex items-center gap-3">
                      <MdWarning className="text-xl shrink-0" />
                      <div>{prescriptionAlert.msg}</div>
                    </div>
                    {prescriptionAlert.type === 'error' && (
                      <button type="button" onClick={() => setRxModal(true)} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ml-2">
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><MdLocalHospital className="text-slate-400" /> Servicio</label>
                  <Select options={serviceOptions.filter(s => s.type?.toUpperCase() === 'HOSPITALIZACION' || s.type?.toLowerCase() === 'hospital')} styles={customStyles} placeholder="-- Seleccionar Servicio --" value={serviceOptions.find(o => o.value === formData.service_id) || null} onChange={(s) => setFormData({ ...formData, service_id: s?.value || '', bed_id: '' })} />
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

            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-1 font-mono uppercase tracking-wider">Cilindro ENTREGADO (Lleno)</label>
              <Select options={cylinderOutOptions} styles={customStyles} isClearable placeholder="-- Seleccionar Lleno de Almacén --" value={cylinderOutOptions.find(o => o.value === formData.cylinder_out) || null} onChange={(s) => setFormData({ ...formData, cylinder_out: s?.value || '' })} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-orange-700 mb-1 font-mono uppercase tracking-wider">Cilindro RECIBIDO (Vacío)</label>
              <Select
                options={cylinderInOptions}
                styles={customStyles}
                isClearable
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
      <Modal isOpen={rxModal} onClose={() => setRxModal(false)} title="Actualizar Receta del Paciente">
        <form onSubmit={handleRxSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dosis (Lts/min)</label>
                    <input type="number" step="0.1" required value={rxForm.dosage} onChange={e => setRxForm({ ...rxForm, dosage: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tiempo de uso (Hrs/día)</label>
                    <input type="number" required value={rxForm.usage_time} onChange={e => setRxForm({ ...rxForm, usage_time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Autorización</label>
                    <input type="date" required value={rxForm.authorization_date} onChange={e => setRxForm({ ...rxForm, authorization_date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Vencimiento</label>
                    <input type="date" required value={rxForm.expires_at} onChange={e => setRxForm({ ...rxForm, expires_at: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">N° Pagaré (Opcional)</label>
                    <input type="text" value={rxForm.promissory_note} onChange={e => setRxForm({ ...rxForm, promissory_note: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setRxModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" disabled={rxSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                    {rxSaving ? 'Guardando...' : 'Guardar Receta'}
                </button>
            </div>
        </form>
      </Modal>

    </div>
  );
};

export default Exchange;