import { useState, useCallback, useEffect } from "react";
import { formatDate } from '../utils/dateUtils';
import {
  MdBusiness, MdSave, MdAssignment, MdQrCodeScanner, MdHistory,
  MdPersonOff, MdSearch, MdWarning, MdLocalHospital, MdPersonAdd,
  MdPrint, MdDescription
} from "react-icons/md";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import useFetch from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { printReturnReceipt, printThermalReturnLabel } from "../utils/printTemplates";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    padding: "4px",
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#7c3aed" : "#cbd5e1",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
    "&:hover": { borderColor: "#7c3aed" }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#f5f3ff",
    borderRadius: "0.5rem",
    color: "#4338ca",
    fontWeight: "bold"
  })
};

const SHIFTS = [
  { value: "Morning", label: "Mañana" },
  { value: "Afternoon", label: "Tarde" },
  { value: "Night", label: "Noche" },
];

/* ════════════════════════════════════════════
   TAB 1 — Prestamo a Paciente
════════════════════════════════════════════ */
const PatientLoan = ({ shift }) => {
  const { execute, loading: actionLoading } = useFetch("/inventory/patient-loan", "POST", null, false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [hasValidPrescription, setHasValidPrescription] = useState(false);

  const [formData, setFormData] = useState({
    prescription_id: "",
    cylinder_id: "",
    shift: shift || "Morning",
    expected_return_date: "",
    has_defined_time: false,
    notes: ""
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadPatientOptions = useCallback(async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      const response = await api.get(`/patients?search=${inputValue}&per_page=20`);
      const data = response.data.data || response.data || [];
      return data.map(p => ({
        value: p.id,
        label: `${p.full_name} — DNI: ${p.dni || "S/D"}`,
        patient: p
      }));
    } catch {
      return [];
    }
  }, []);

  const handlePatientSelect = async (option) => {
    setSelectedPatient(option);
    setPrescriptions([]);
    setFormData(prev => ({ ...prev, prescription_id: "", cylinder_id: "" }));
    setSuccessMessage(null);
    setErrorMessage(null);
    setHasValidPrescription(false);

    if (!option) return;

    setLoadingPrescriptions(true);
    try {
      const res = await api.get(`/prescriptions?patient_id=${option.value}&per_page=all`);
      const data = res.data.data || res.data || [];
      const today = new Date().toISOString().split("T")[0];
      const validPrescriptions = data.filter(p => p.expires_at >= today);
      setPrescriptions(validPrescriptions);
      
      if (validPrescriptions.length > 0) {
        setHasValidPrescription(true);
        // Autoseleccionar si solo hay una
        if (validPrescriptions.length === 1) {
          setFormData(prev => ({ ...prev, prescription_id: validPrescriptions[0].id }));
        }
      }
    } catch {
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const loadCylinderOptions = async (inputValue) => {
    if (!hasValidPrescription) return [];
    try {
      let queryParams = "?status=full&location=CENTRAL&per_page=40";
      if (inputValue && inputValue.trim().length >= 1) {
        queryParams += `&search=${encodeURIComponent(inputValue.trim())}`;
      }
      const response = await api.get(`/cylinders${queryParams}`);
      const data = response.data.data || response.data || [];
      // Filtrar doble verificacion
      const filtered = data.filter(c => c.status === "full" && (c.location || "").toUpperCase() === "CENTRAL" && !c.current_patient_id);
      return filtered.map(c => {
        const barcodeTag = c.barcode ? ` [BC: ${c.barcode}]` : '';
        return {
          value: c.id,
          label: `${c.serial_number}${barcodeTag} (${Number(c.capacity)}m3) [${c.ownership_type?.name || c.ownership_type_name || "S/D"}]`,
          serial_number: c.serial_number,
          barcode: c.barcode
        };
      });
    } catch {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedPatient) return setErrorMessage("Selecciona un paciente.");
    if (!formData.prescription_id) return setErrorMessage("Selecciona una receta vigente.");
    if (!formData.cylinder_id) return setErrorMessage("Selecciona un balon lleno.");

    try {
      await execute({
        body: {
          patient_id: selectedPatient.value,
          cylinder_id: formData.cylinder_id,
          prescription_id: formData.prescription_id,
          shift: formData.shift,
          expected_return_date: formData.has_defined_time ? formData.expected_return_date : null,
          notes: formData.notes
        }
      });
      setSuccessMessage(`✅ Prestamo registrado. El balon ha sido asignado al paciente.`);
      setSelectedPatient(null);
      setPrescriptions([]);
      setHasValidPrescription(false);
      setFormData({ prescription_id: "", cylinder_id: "", shift: shift || "Morning", expected_return_date: "", has_defined_time: false, notes: "" });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Error al registrar el prestamo.");
    }
  };

  const prescriptionOptions = prescriptions.map(p => ({
    value: p.id,
    label: `Receta #${p.id} - Vence: ${formatDate(p.expires_at)}`
  }));

  return (
    <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} className="space-y-6">
      {(successMessage || errorMessage) && (
        <div className={`p-4 rounded-xl font-medium border-l-4 ${successMessage ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-red-50 border-red-500 text-red-700"}`}>
          {successMessage || errorMessage}
        </div>
      )}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <h3 className="text-base font-bold text-slate-700 flex items-center gap-2"><MdSearch /> Buscar Paciente PADOMI</h3>
        <AsyncSelect loadOptions={loadPatientOptions} styles={selectStyles} isClearable
          placeholder="Escribe nombre o DNI del paciente..." value={selectedPatient}
          onChange={handlePatientSelect}
          noOptionsMessage={({ inputValue }) => !inputValue ? "Escribe al menos 2 caracteres..." : "No se encontro paciente."}
          loadingMessage={() => "Buscando..."} />
        
        {selectedPatient && (
          <div className="mt-4 p-4 rounded-xl border bg-slate-50 border-slate-200">
            <h4 className="font-bold text-sm text-slate-700 mb-2">Receta Medica Vigente</h4>
            {loadingPrescriptions ? (
              <p className="text-sm text-slate-500">Verificando recetas...</p>
            ) : !hasValidPrescription ? (
              <div className="flex items-center gap-2 text-sm text-red-600 font-bold bg-red-100 p-3 rounded-lg">
                <MdWarning className="text-xl" /> El paciente NO tiene recetas medicas vigentes. No se puede realizar el prestamo.
              </div>
            ) : (
              <Select options={prescriptionOptions} styles={selectStyles} placeholder="Seleccionar receta..."
                value={prescriptionOptions.find(o => o.value === formData.prescription_id) || null}
                onChange={(s) => setFormData(prev => ({ ...prev, prescription_id: s?.value || "" }))} />
            )}
          </div>
        )}
      </div>

      {hasValidPrescription && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <h3 className="text-base font-bold text-slate-700 flex items-center gap-2"><MdQrCodeScanner /> Detalles del Prestamo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Balon a Prestar (Solo LLENOS en CENTRAL) *</label>
              <AsyncSelect cacheOptions loadOptions={loadCylinderOptions} filterOption={cylinderFilterOption} styles={selectStyles}
                placeholder="-- Buscar por serie o escanear código de barras --"
                value={formData.cylinder_id ? { value: formData.cylinder_id, label: "Balon Seleccionado" } : null}
                onChange={(s) => setFormData(prev => ({ ...prev, cylinder_id: s?.value || "" }))}
                noOptionsMessage={({ inputValue }) => !inputValue ? "Escribe o escanea la serie del balon..." : "No se encontro."} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-3">Duracion del Prestamo</label>
              <div className="flex gap-3 mb-3">
                <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${!formData.has_defined_time ? 'border-violet-500 bg-violet-50 text-violet-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" checked={!formData.has_defined_time} onChange={() => setFormData(prev => ({...prev, has_defined_time: false, expected_return_date: ""}))} className="accent-violet-600" /> Indefinido
                </label>
                <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${formData.has_defined_time ? 'border-violet-500 bg-violet-50 text-violet-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" checked={formData.has_defined_time} onChange={() => setFormData(prev => ({...prev, has_defined_time: true}))} className="accent-violet-600" /> Tiempo Definido
                </label>
              </div>
              {formData.has_defined_time && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Esperada de Devolucion *</label>
                  <input type="date" value={formData.expected_return_date} onChange={(e) => setFormData(prev => ({...prev, expected_return_date: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-violet-500" required={formData.has_defined_time} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Turno</label>
              <Select options={SHIFTS} styles={selectStyles}
                value={SHIFTS.find(s => s.value === formData.shift) || null}
                onChange={(s) => setFormData(prev => ({ ...prev, shift: s?.value || "Morning" }))} />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Notas / Autorizado por</label>
              <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-violet-400 resize-none text-sm"
                placeholder="Ej. Autorizado por Dra. Maria, o cualquier otra observacion." />
            </div>
          </div>
        </div>
      )}

      {hasValidPrescription && (
        <div className="flex justify-center pt-2">
          <button type="submit" disabled={actionLoading || !formData.cylinder_id || !formData.prescription_id || (formData.has_defined_time && !formData.expected_return_date)}
            className="group relative w-full sm:w-auto px-8 sm:px-16 py-5 bg-violet-700 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-violet-800 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:scale-100 overflow-hidden">
            <div className="relative z-10 flex items-center gap-3">
              {actionLoading ? "Registrando..." : <><MdPersonAdd className="text-2xl group-hover:animate-bounce" /> REGISTRAR PRESTAMO</>}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </div>
      )}
    </form>
  );
};


/* ════════════════════════════════════════════
   TAB 2 — Devolucion Paciente PADOMI
════════════════════════════════════════════ */
const RETURN_REASONS = [
  { value: "Fallecimiento", label: "Fallecimiento del paciente" },
  { value: "Alta médica", label: "Alta médica" },
  { value: "Viaje", label: "Viaje / Cambio de domicilio" },
  { value: "Baja voluntaria", label: "Baja voluntaria" },
  { value: "Otro", label: "Otro motivo" },
];

const PatientReturn = ({ shift }) => {
  const { execute, loading: actionLoading } = useFetch("/inventory/patient-return", "POST", null, false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientCylinders, setPatientCylinders] = useState([]);
  const [loadingCylinders, setLoadingCylinders] = useState(false);
  const [formData, setFormData] = useState({
    cylinder_id: "",
    reason: "",
    return_status: "empty",
    shift: shift || "Morning",
    notes: ""
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [createdReturn, setCreatedReturn] = useState(null);
  const { user } = useAuth();

  const loadPatientOptions = useCallback(async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      const response = await api.get(`/patients?search=${inputValue}&per_page=20`);
      const data = response.data.data || response.data || [];
      return data.map(p => ({
        value: p.id,
        label: `${p.full_name} — DNI: ${p.dni || "S/D"}`,
        patient: p
      }));
    } catch {
      return [];
    }
  }, []);

  const handlePatientSelect = async (option) => {
    setSelectedPatient(option);
    setPatientCylinders([]);
    setFormData(prev => ({ ...prev, cylinder_id: "" }));
    setSuccessMessage(null);
    setErrorMessage(null);
    if (!option) return;
    setLoadingCylinders(true);
    try {
      const response = await api.get(`/cylinders?patient_id=${option.value}&per_page=50`);
      const data = response.data.data || response.data || [];
      const assigned = data.filter(c => 
        String(c.current_patient_id) === String(option.value) &&
        c.ownership_type?.name?.toUpperCase() !== "PROPIO"
      );
      setPatientCylinders(assigned);
    } catch {
      setPatientCylinders([]);
    } finally {
      setLoadingCylinders(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    if (!selectedPatient) return setErrorMessage("Selecciona un paciente.");
    if (!formData.cylinder_id) return setErrorMessage("Selecciona el balon a devolver.");
    if (!formData.reason) return setErrorMessage("Selecciona el motivo de la devolucion.");
    try {
      const res = await execute({
        body: {
          patient_id: selectedPatient.value,
          cylinder_id: formData.cylinder_id,
          reason: formData.reason,
          return_status: formData.return_status,
          shift: formData.shift,
          notes: formData.notes
        }
      });
      setSuccessMessage(`Devolucion registrada. Motivo: ${formData.reason}. El balon regreso a CENTRAL.`);
      setCreatedReturn(res);
      setSelectedPatient(null);
      setPatientCylinders([]);
      setFormData({ cylinder_id: "", reason: "", return_status: "empty", shift: shift || "Morning", notes: "" });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Error al registrar la devolucion.");
    }
  };

  const selectedCylinder = patientCylinders.find(c => String(c.id) === String(formData.cylinder_id));

  return (
    <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} className="space-y-6">
      {(successMessage || errorMessage) && (
        <div className={`p-4 rounded-xl font-medium border-l-4 ${successMessage ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-red-50 border-red-500 text-red-700"}`}>
          {successMessage || errorMessage}
        </div>
      )}
      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
        <MdPersonOff className="text-2xl mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">Devolucion de Balon — Paciente PADOMI</p>
          <p className="mt-1 text-rose-600">Use este formulario cuando un paciente autorizado para intercambio PADOMI ya no necesita el balon (fallecimiento, alta medica, viaje u otra razon). El balon regresara al almacen central.</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <h3 className="text-base font-bold text-slate-700 flex items-center gap-2"><MdSearch /> Buscar Paciente PADOMI</h3>
        <AsyncSelect loadOptions={loadPatientOptions} styles={selectStyles} isClearable
          placeholder="Escribe nombre o DNI del paciente..." value={selectedPatient}
          onChange={handlePatientSelect}
          noOptionsMessage={({ inputValue }) => !inputValue ? "Escribe al menos 2 caracteres..." : "No se encontro paciente."}
          loadingMessage={() => "Buscando..."} />
        {selectedPatient && (
          <div className="mt-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Balones asignados a <span className="text-violet-600">{selectedPatient.label.split("—")[0].trim()}</span>
            </label>
            {loadingCylinders && <div className="text-sm text-slate-400 italic py-3">Cargando balones asignados...</div>}
            {!loadingCylinders && patientCylinders.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4">
                <MdWarning className="text-amber-500 text-xl" />
                Este paciente no tiene balones asignados actualmente.
              </div>
            )}
            {!loadingCylinders && patientCylinders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {patientCylinders.map(c => (
                  <label key={c.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${String(formData.cylinder_id) === String(c.id) ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:border-rose-300 bg-white"}`}>
                    <input type="radio" name="cylinder_id" value={c.id}
                      checked={String(formData.cylinder_id) === String(c.id)}
                      onChange={() => setFormData(prev => ({ ...prev, cylinder_id: String(c.id) }))}
                      className="accent-rose-500 w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">Balon: {c.serial_number}</p>
                      <p className="text-xs text-slate-500">{Number(c.capacity)}m3 - {c.ownership_type_name || "S/D"}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.status === "full" ? "bg-green-100 text-green-700" : c.status === "in_use" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.status === "full" ? "Lleno" : c.status === "in_use" ? "En uso" : c.status}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {formData.cylinder_id && selectedCylinder && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <h3 className="text-base font-bold text-slate-700 flex items-center gap-2"><MdLocalHospital /> Detalles de la Devolucion</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Motivo de Devolucion *</label>
              <Select options={RETURN_REASONS} styles={selectStyles} placeholder="-- Seleccionar motivo --"
                value={RETURN_REASONS.find(r => r.value === formData.reason) || null}
                onChange={(s) => setFormData(prev => ({ ...prev, reason: s?.value || "" }))} isClearable />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Turno</label>
              <Select options={SHIFTS} styles={selectStyles}
                value={SHIFTS.find(s => s.value === formData.shift) || null}
                onChange={(s) => setFormData(prev => ({ ...prev, shift: s?.value || "Morning" }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-3">Estado en que regresa el balon *</label>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.return_status === "empty" ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-red-300"}`}>
                  <input type="radio" name="return_status" value="empty" checked={formData.return_status === "empty"}
                    onChange={() => setFormData(prev => ({ ...prev, return_status: "empty" }))} className="accent-red-500 w-4 h-4" />
                  <div>
                    <p className="font-bold text-slate-800">Vacio</p>
                    <p className="text-xs text-slate-500">El paciente consumio el oxigeno</p>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.return_status === "full" ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-green-300"}`}>
                  <input type="radio" name="return_status" value="full" checked={formData.return_status === "full"}
                    onChange={() => setFormData(prev => ({ ...prev, return_status: "full" }))} className="accent-green-500 w-4 h-4" />
                  <div>
                    <p className="font-bold text-slate-800">Lleno</p>
                    <p className="text-xs text-slate-500">El balon no fue utilizado</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Notas / Observaciones</label>
              <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 resize-none text-sm"
                placeholder="Observaciones adicionales, nombre del familiar que entrega, etc." />
            </div>
          </div>
        </div>
      )}
      {selectedPatient && (
        <div className="flex justify-center pt-2">
          <button type="submit" disabled={actionLoading || !formData.cylinder_id || !formData.reason}
            className="group relative w-full sm:w-auto px-8 sm:px-16 py-5 bg-rose-700 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-rose-800 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:scale-100 overflow-hidden">
            <div className="relative z-10 flex items-center gap-3">
              {actionLoading ? "Registrando..." : <><MdPersonOff className="text-2xl group-hover:animate-bounce" /> REGISTRAR DEVOLUCION PADOMI</>}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-600 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </div>
      )}

      {/* MODAL IMPRIMIR CONSTANCIA Y/O ETIQUETA TÉRMICA */}
      {createdReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-slate-100 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-emerald-100 shadow-sm animate-bounce">
                ✓
              </div>
              <h3 className="text-xl font-black text-slate-800">¡Devolución Registrada!</h3>
              <p className="text-indigo-600 font-bold text-sm">
                Control de Atención N° {createdReturn.attention_number || createdReturn.id}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-700 space-y-2.5 font-mono shadow-inner">
              <div className="border-b pb-1.5 text-center font-bold text-slate-600 tracking-wider">RESUMEN DE DEVOLUCIÓN</div>
              <div className="space-y-1">
                <div><span className="font-sans font-bold text-slate-400">Paciente:</span> {createdReturn.patient?.full_name}</div>
                <div><span className="font-sans font-bold text-slate-400">Motivo:</span> <span className="font-bold text-rose-600">{createdReturn.reason || createdReturn.notes}</span></div>
              </div>
              <div className="border-t border-dashed pt-2">
                <div className="flex justify-between items-center">
                  <span>BALÓN DEVUELTO: <strong className="font-bold text-slate-800">{createdReturn.cylinder_movements?.[0]?.cylinder?.serial_number}</strong></span>
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold">{createdReturn.cylinder_movements?.[0]?.cylinder?.capacity} m³</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => printThermalReturnLabel(createdReturn, user)}
                  className="py-3 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                >
                  <MdPrint className="text-base" /> Etiqueta (76×76)
                </button>
                <button
                  type="button"
                  onClick={() => printReturnReceipt(createdReturn, user)}
                  className="py-3 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all text-xs shadow-md shadow-rose-100 flex items-center justify-center gap-1.5"
                >
                  <MdDescription className="text-base" /> Constancia A4
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCreatedReturn(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all text-xs border border-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

// PAGINA PRINCIPAL
const LoanReturn = () => {
  const { shift } = useAuth();
  const [activeTab, setActiveTab] = useState("loan");

  const tabs = [
    { id: "loan", label: "Prestamo a Paciente", subtitle: "Autorizacion para paciente sin balon" },
    { id: "return", label: "Devolucion Paciente", subtitle: "Paciente ya no necesita el balon" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-200">
            <MdBusiness className="text-3xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Prestamos a Pacientes</h2>
            <p className="text-slate-500 text-sm flex items-center gap-2"><MdAssignment /> Prestamos autorizados y devoluciones PADOMI</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-4 text-left transition-all ${activeTab === tab.id ? "border-b-2 border-violet-600 bg-violet-50" : "hover:bg-slate-50 border-b-2 border-transparent"}`}>
              <p className={`font-bold text-sm ${activeTab === tab.id ? "text-violet-700" : "text-slate-600"}`}>{tab.label}</p>
              <p className={`text-xs mt-0.5 ${activeTab === tab.id ? "text-violet-500" : "text-slate-400"}`}>{tab.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
      {activeTab === "loan" ? <PatientLoan shift={shift} /> : <PatientReturn shift={shift} />}
    </div>
  );
};

export default LoanReturn;
