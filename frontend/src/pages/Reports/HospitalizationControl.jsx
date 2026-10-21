import React, { useState, useEffect, useRef } from 'react';
import { 
  MdLocalHospital, 
  MdPrint, 
  MdRefresh, 
  MdSwapHoriz, 
  MdHistory, 
  MdSave, 
  MdClose,
  MdCheckCircle,
  MdWarning,
  MdErrorOutline,
  MdArrowForward,
  MdInfo
} from 'react-icons/md';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';

// ─────────────────────────────────────────────
// Mapa de capacidad → volumen water (L)
// ─────────────────────────────────────────────
const VOLUME_MAP = { 2: 12, 4: 23, 6: 35, 8: 47, 10: 58, 14: 80, 40: 200 };

function calcEstimatedHours(pressurePsi, flowLmin, capacityM3) {
  if (!pressurePsi || !flowLmin || flowLmin <= 0) return '';
  const caps = Object.keys(VOLUME_MAP).map(Number);
  const closest = caps.reduce((a, b) =>
    Math.abs(a - capacityM3) < Math.abs(b - capacityM3) ? a : b
  );
  const volL = VOLUME_MAP[closest] ?? 50;
  const pressureBar = pressurePsi / 14.5038;
  return Math.round((volL * pressureBar) / (flowLmin * 60) * 10) / 10;
}

// ─────────────────────────────────────────────
// Semáforo de colores por horas estimadas
// ─────────────────────────────────────────────
function getTimeStyle(hours) {
  if (hours === '' || hours === null || hours === undefined) return '';
  if (hours <= 1)  return 'bg-red-100 text-red-700 font-black animate-pulse ring-1 ring-red-400';
  if (hours <= 3)  return 'bg-amber-100 text-amber-700 font-bold ring-1 ring-amber-400';
  return 'bg-green-100 text-green-700 ring-1 ring-green-400';
}

// ─────────────────────────────────────────────
// Modal: Historial de lecturas Y traslados
// ─────────────────────────────────────────────
function HistorialModal({ cylinder, onClose }) {
  const [activeTab, setActiveTab]   = useState('readings');   // 'readings' | 'transfers'
  const [readings, setReadings]     = useState([]);
  const [transfers, setTransfers]   = useState([]);
  const [loadingR, setLoadingR]     = useState(true);
  const [loadingT, setLoadingT]     = useState(true);

  useEffect(() => {
    // Cargar lecturas de presión
    api.get(`/hospitalization/readings/${cylinder.id}`)
      .then(r => setReadings(r.data))
      .catch(() => setReadings([]))
      .finally(() => setLoadingR(false));
    // Cargar historial de traslados de cama
    api.get(`/hospitalization/bed-transfer/${cylinder.id}`)
      .then(r => setTransfers(r.data))
      .catch(() => setTransfers([]))
      .finally(() => setLoadingT(false));
  }, [cylinder.id]);

  const SHIFT_ES = { Morning: 'Mañana', Afternoon: 'Tarde', Night: 'Noche' };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <MdHistory className="text-2xl text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-800">Historial del Cilindro</h3>
              <p className="text-xs text-slate-500">Serie: <span className="font-mono font-bold">{cylinder.serial_number}</span> — Cama actual: <span className="font-bold text-blue-600">{cylinder.current_bed?.bed_number || '-'}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-5 pt-2 gap-1">
          <button
            onClick={() => setActiveTab('readings')}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
              activeTab === 'readings'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            📊 Lecturas de presión ({readings.length})
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
              activeTab === 'transfers'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            🔄 Traslados de cama ({transfers.length})
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-5">
          {/* ── TAB: Lecturas ── */}
          {activeTab === 'readings' && (
            loadingR ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : readings.length === 0 ? (
              <p className="text-center text-slate-400 py-8 italic">Sin lecturas registradas aún.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 p-2 text-left">Fecha y Hora</th>
                    <th className="border border-slate-200 p-2">Turno</th>
                    <th className="border border-slate-200 p-2">PSI</th>
                    <th className="border border-slate-200 p-2">L/min</th>
                    <th className="border border-slate-200 p-2">Horas Est.</th>
                    <th className="border border-slate-200 p-2">Cama</th>
                    <th className="border border-slate-200 p-2 text-left">Operario</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-2 text-slate-600">
                        {r.read_at ? new Date(r.read_at).toLocaleString('es-PE') : '-'}
                      </td>
                      <td className="border border-slate-200 p-2 text-center">{SHIFT_ES[r.shift] || r.shift}</td>
                      <td className="border border-slate-200 p-2 text-center font-mono">{r.pressure_psi}</td>
                      <td className="border border-slate-200 p-2 text-center font-mono">{r.flow_lmin}</td>
                      <td className={`border border-slate-200 p-2 text-center font-bold ${getTimeStyle(r.estimated_hours)}`}>
                        {r.estimated_hours ?? '-'}h
                      </td>
                      <td className="border border-slate-200 p-2 text-center">{r.bed_number || '-'}</td>
                      <td className="border border-slate-200 p-2 text-slate-600">{r.user_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* ── TAB: Traslados de cama ── */}
          {activeTab === 'transfers' && (
            loadingT ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : transfers.length === 0 ? (
              <p className="text-center text-slate-400 py-8 italic">Sin traslados registrados aún.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-slate-200 p-2 text-left">Fecha</th>
                    <th className="border border-slate-200 p-2">Turno</th>
                    <th className="border border-slate-200 p-2">Cama Origen</th>
                    <th className="border border-slate-200 p-2">Servicio Origen</th>
                    <th className="border border-slate-200 p-2">Cama Destino</th>
                    <th className="border border-slate-200 p-2">Servicio Destino</th>
                    <th className="border border-slate-200 p-2 text-left">Operario</th>
                    <th className="border border-slate-200 p-2 text-left">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50">
                      <td className="border border-slate-200 p-2 text-slate-600">
                        {t.transferred_at ? new Date(t.transferred_at).toLocaleString('es-PE') : '-'}
                      </td>
                      <td className="border border-slate-200 p-2 text-center">{SHIFT_ES[t.shift] || t.shift}</td>
                      <td className="border border-slate-200 p-2 text-center font-bold text-orange-600">{t.from_bed || '—'}</td>
                      <td className="border border-slate-200 p-2 text-center text-slate-500 text-[10px]">{t.from_service || '—'}</td>
                      <td className="border border-slate-200 p-2 text-center font-bold text-green-600">{t.to_bed || '—'}</td>
                      <td className="border border-slate-200 p-2 text-center text-slate-500 text-[10px]">{t.to_service || '—'}</td>
                      <td className="border border-slate-200 p-2 text-slate-600">{t.user_name || '-'}</td>
                      <td className="border border-slate-200 p-2 text-slate-500 italic">{t.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Notificación Toast flotante premium
// ─────────────────────────────────────────────
function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
        isSuccess 
          ? 'bg-slate-900/95 text-white border-emerald-500/50 shadow-emerald-950/20' 
          : isWarning 
            ? 'bg-slate-900/95 text-white border-amber-500/50 shadow-amber-950/20' 
            : 'bg-slate-900/95 text-white border-rose-500/50 shadow-rose-950/20'
      }`}>
        <div className={`p-2 rounded-xl shrink-0 ${
          isSuccess 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : isWarning 
              ? 'bg-amber-500/20 text-amber-400' 
              : 'bg-rose-500/20 text-rose-400'
        }`}>
          {isSuccess && <MdCheckCircle className="text-2xl" />}
          {isWarning && <MdWarning className="text-2xl" />}
          {!isSuccess && !isWarning && <MdErrorOutline className="text-2xl" />}
        </div>
        <div className="flex-1 pr-1">
          <div className="font-bold text-sm tracking-wide text-white">{toast.title}</div>
          <div className="text-xs mt-1 text-slate-300 leading-relaxed">{toast.message}</div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <MdClose className="text-lg" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal: Cambio de cama con UX Premium
// ─────────────────────────────────────────────
function BedTransferModal({ cylinder, currentShift, onClose, onSuccess }) {
  const [services, setServices] = useState([]);
  const [beds, setBeds] = useState([]);
  const [toServiceId, setToServiceId] = useState('');
  const [toBedId, setToBedId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!toServiceId) { setBeds([]); setToBedId(''); return; }
    api.get('/beds', { params: { service_id: toServiceId } })
      .then(r => setBeds(r.data?.data || r.data || []))
      .catch(() => setBeds([]));
    setToBedId('');
    setErrorMsg('');
  }, [toServiceId]);

  const selectedBedObj = beds.find(b => String(b.id) === String(toBedId));
  const selectedServiceObj = services.find(s => String(s.id) === String(toServiceId));

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!toBedId) {
      setErrorMsg('Por favor, selecciona la cama de destino.');
      return;
    }
    // Validar que la cama destino sea diferente a la actual
    if (parseInt(toBedId) === cylinder.current_bed_id) {
      setErrorMsg('La cama seleccionada es la misma que la cama actual. Selecciona una cama diferente.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/hospitalization/bed-transfer', {
        cylinder_id:   cylinder.id,
        to_bed_id:     parseInt(toBedId),
        to_service_id: toServiceId ? parseInt(toServiceId) : null,
        shift:         currentShift,
        notes,
      });

      // Notificar éxito con los datos para la experiencia de usuario
      onSuccess({
        cyl: cylinder,
        bedNumber: selectedBedObj?.bed_number || toBedId,
        serviceName: selectedServiceObj?.name || 'Servicio'
      });
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Error al trasladar el cilindro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden scale-100 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-blue-50/50 to-indigo-50/30">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <MdSwapHoriz className="text-2xl" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg tracking-tight">Cambiar Cama de Cilindro</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Balón serie: <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">{cylinder.serial_number}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Visualizador de Traslado (Origen -> Destino) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ubicación Actual</div>
              <div className="font-black text-slate-800 text-sm flex items-center gap-1.5 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <span className="truncate">Cama {cylinder.current_bed?.bed_number || '-'}</span>
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                {cylinder.current_service?.name || 'Sin servicio'}
              </div>
            </div>

            <div className="shrink-0 p-2.5 bg-blue-100/70 text-blue-700 rounded-full">
              <MdArrowForward className="text-lg" />
            </div>

            <div className="flex-1 min-w-0 text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nueva Ubicación</div>
              <div className="font-black text-emerald-700 text-sm flex items-center justify-end gap-1.5 mt-1">
                <span className="truncate">{selectedBedObj ? `Cama ${selectedBedObj.bed_number}` : 'Por definir'}</span>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedBedObj ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                {selectedServiceObj?.name || 'Selecciona servicio'}
              </div>
            </div>
          </div>

          {/* Banner de error inline */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5 font-medium animate-in fade-in">
              <MdErrorOutline className="text-lg shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selector de Servicio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Servicio de Destino: <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700"
              value={toServiceId}
              onChange={e => setToServiceId(e.target.value)}
            >
              <option value="">-- Seleccionar servicio --</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Selector de Cama */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Cama de Destino: <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 disabled:bg-slate-100 disabled:opacity-60"
              value={toBedId}
              onChange={e => {
                setToBedId(e.target.value);
                setErrorMsg('');
              }}
              disabled={!toServiceId}
            >
              <option value="">-- {toServiceId ? 'Seleccionar cama disponible' : 'Primero elige un servicio'} --</option>
              {beds.map(b => {
                const isSameBed = b.id === cylinder.current_bed_id;
                const isOccupied = b.status === 'occupied' && !isSameBed;
                return (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={isSameBed}
                    style={isSameBed ? { color: '#9ca3af' } : isOccupied ? { color: '#ea580c' } : { color: '#16a34a' }}
                  >
                    Cama {b.bed_number} {isSameBed ? '(Ubicación actual)' : isOccupied ? '● En uso' : '○ Libre'}
                  </option>
                );
              })}
            </select>
            {selectedBedObj && selectedBedObj.id !== cylinder.current_bed_id && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                <MdCheckCircle /> Cama {selectedBedObj.bed_number} seleccionada correctamente.
              </p>
            )}
          </div>

          {/* Notas u observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Motivo o Notas (opcional):</label>
            <textarea
              className="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none text-slate-700 placeholder-slate-400"
              rows={2}
              placeholder="Ej. Traslado por indicación médica, reubicación de sala, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !toBedId}
              className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Reubicando...</span>
                </>
              ) : (
                <>
                  <MdSwapHoriz className="text-lg" />
                  <span>Confirmar Traslado</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const HospitalizationControl = () => {
  const { data, loading, error, execute } = useFetch('/hospitalization/cylinders', 'GET', null, false);
  const [localData, setLocalData]         = useState([]);
  const [savingId, setSavingId]           = useState(null);
  const [historialCyl, setHistorialCyl]   = useState(null);
  const [transferCyl, setTransferCyl]     = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBed, setSelectedBed]         = useState('');
  const [searchCylinder, setSearchCylinder]   = useState('');
  const [toast, setToast]                 = useState(null);
  const reportRef = useRef(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  const SHIFT_ES = { Morning: 'Mañana', Afternoon: 'Tarde', Night: 'Noche' };

  // Turno actual basado en la hora
  const getCurrentShift = () => {
    const h = new Date().getHours();
    if (h >= 7 && h < 15) return 'Morning';
    if (h >= 15 && h < 23) return 'Afternoon';
    return 'Night';
  };
  const currentShift = getCurrentShift();

  const fetchControl = () => execute();

  useEffect(() => { fetchControl(); }, []);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Filtrar para mostrar SOLO los cilindros asignados a una cama
      const assignedCylinders = data.filter(cyl => cyl.current_bed || cyl.current_bed_id);

      const initialized = assignedCylinders.map(cyl => ({
        ...cyl,
        presion_psi: cyl.last_reading?.pressure_psi ?? '',
        flujo_lmin:  cyl.last_reading?.flow_lmin ?? '',
        tiempo_horas: cyl.last_reading?.estimated_hours ?? '',
      }));
      setLocalData(initialized);
    }
  }, [data]);

  // ── Calcular autonomía local al cambiar inputs ──
  const handleInputChange = (id, field, value) => {
    const updated = [...localData];
    const idx = updated.findIndex(c => c.id === id);
    if (idx === -1) return;
    updated[idx][field] = value;

    const psi   = parseFloat(updated[idx].presion_psi) || 0;
    const lmin  = parseFloat(updated[idx].flujo_lmin)  || 0;
    const cap   = parseFloat(updated[idx].capacity)     || 10;
    updated[idx].tiempo_horas = psi > 0 && lmin > 0 ? calcEstimatedHours(psi, lmin, cap) : '';

    setLocalData(updated);
  };

  // ── Guardar lectura en el backend con Toast ──
  const handleSaveReading = async (cyl) => {
    if (!cyl.presion_psi || !cyl.flujo_lmin) {
      showToast('warning', 'Lectura Incompleta', 'Por favor ingresa la presión (PSI) y el flujo (L/min) antes de guardar.');
      return;
    }
    setSavingId(cyl.id);
    try {
      const res = await api.post('/hospitalization/readings', {
        cylinder_id:  cyl.id,
        pressure_psi: parseFloat(cyl.presion_psi),
        flow_lmin:    parseFloat(cyl.flujo_lmin),
        shift:        currentShift,
      });
      const horas = res?.data?.estimated_hours ?? cyl.tiempo_horas;
      // Actualizar localData con las horas confirmadas por el backend
      setLocalData(prev => prev.map(c =>
        c.id === cyl.id ? { ...c, tiempo_horas: horas } : c
      ));
      showToast(
        'success', 
        '¡Lectura Guardada Exitosamente!', 
        `Cilindro ${cyl.serial_number}: Presión registrada. Autonomía estimada: ${horas} horas.`
      );
    } catch (err) {
      showToast('error', 'Error al Guardar', err?.response?.data?.message || 'Error al guardar la lectura de presión.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Notificación de traslado exitoso ──
  const handleTransferSuccess = ({ cyl, bedNumber, serviceName }) => {
    fetchControl();
    showToast(
      'success',
      '¡Cambio de Cama Exitoso!',
      `El cilindro ${cyl.serial_number} fue reubicado correctamente a la Cama ${bedNumber} (${serviceName}).`
    );
  };

  // ── Print: Formato ultra-compacto garantizado en 1 sola hoja (hasta 100 balones) ──
  const handlePrint = () => {
    if (!filteredData || filteredData.length === 0) {
      showToast('warning', 'Sin datos', 'No hay cilindros para imprimir.');
      return;
    }

    const totalCylinders = filteredData.length;
    // Adaptar número de columnas para que hasta 100 cilindros quepan en 1 sola hoja
    // <= 35: 2 columnas, 36-70: 3 columnas, > 70: 4 columnas
    const numCols = totalCylinders > 70 ? 4 : totalCylinders > 35 ? 3 : 2;
    const perCol = Math.ceil(totalCylinders / numCols);

    // Dividir los cilindros en las columnas
    const columns = [];
    for (let c = 0; c < numCols; c++) {
      columns.push(filteredData.slice(c * perCol, (c + 1) * perCol));
    }

    const fontSize = totalCylinders > 70 ? '7.5px' : totalCylinders > 40 ? '8px' : '8.5px';
    const cellPadding = totalCylinders > 70 ? '1px 1.5px' : '1.5px 2.5px';

    const printWindow = window.open('', '', 'width=1250,height=750');
    if (!printWindow) {
      alert('Por favor habilita las ventanas emergentes en tu navegador para imprimir.');
      return;
    }

    const columnsHtml = columns.map((colData, colIdx) => {
      const startIndex = colIdx * perCol;
      const rowsHtml = colData.map((cyl, i) => {
        const globalIdx = startIndex + i + 1;
        const bed = cyl.current_bed?.bed_number || '-';
        const service = cyl.current_service?.name || '-';
        const serial = cyl.serial_number || '-';
        const psi = cyl.presion_psi !== '' && cyl.presion_psi !== null && cyl.presion_psi !== undefined ? cyl.presion_psi : '';
        const flujo = cyl.flujo_lmin !== '' && cyl.flujo_lmin !== null && cyl.flujo_lmin !== undefined ? cyl.flujo_lmin : '';
        const tiempo = cyl.tiempo_horas !== '' && cyl.tiempo_horas !== null && cyl.tiempo_horas !== undefined ? `${cyl.tiempo_horas}h` : '';

        // Estilo de semáforo sutil para la celda de tiempo
        let timeStyle = '';
        if (tiempo && parseFloat(cyl.tiempo_horas) <= 1) {
          timeStyle = 'background-color: #fee2e2; font-weight: bold; color: #991b1b;';
        } else if (tiempo && parseFloat(cyl.tiempo_horas) <= 3) {
          timeStyle = 'background-color: #fef3c7; font-weight: bold; color: #92400e;';
        } else if (tiempo) {
          timeStyle = 'background-color: #dcfce7; color: #166534;';
        }

        return `
          <tr>
            <td style="width: 16px; font-weight: bold; background-color: #f8fafc;">${globalIdx}</td>
            <td style="font-weight: bold; color: #1d4ed8;">${bed}</td>
            <td style="max-width: 65px; overflow: hidden; text-overflow: ellipsis;" title="${service}">${service}</td>
            <td style="font-family: monospace; font-weight: bold;">${serial}</td>
            <td style="width: 32px; font-weight: 600;">${psi}</td>
            <td style="width: 30px; font-weight: 600;">${flujo}</td>
            <td style="width: 32px; ${timeStyle}">${tiempo}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="print-col">
          <table>
            <thead>
              <tr>
                <th style="width: 16px;">N°</th>
                <th>CAMA</th>
                <th>SERVICIO</th>
                <th>CILINDRO</th>
                <th style="width: 32px;">PSI</th>
                <th style="width: 30px;">L/MIN</th>
                <th style="width: 32px;">TIEMPO</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Control de Recorrido de Cilindros - Hospitalización</title>
          <style>
            @page {
              size: landscape;
              margin: 4mm 4mm 3mm 4mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              font-size: ${fontSize};
              color: #000;
              background: #fff;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            .header {
              border-bottom: 1.2px solid #000;
              padding-bottom: 2px;
              margin-bottom: 3px;
            }
            .header-title {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .header-title h1 {
              font-size: 10.5px;
              font-weight: 900;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.2px;
            }
            .header-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8px;
              font-weight: bold;
              margin-top: 2px;
            }
            .header-info span {
              margin-right: 10px;
            }
            .header-info span b {
              font-weight: 900;
            }
            .print-grid {
              display: flex;
              gap: 2.5mm;
              width: 100%;
              align-items: flex-start;
            }
            .print-col {
              flex: 1;
              min-width: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th, td {
              border: 0.8px solid #000;
              padding: ${cellPadding};
              text-align: center;
              font-size: ${fontSize};
              line-height: 1.1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            th {
              background-color: #e2e8f0 !important;
              font-weight: bold;
              font-size: 7px;
              text-transform: uppercase;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              font-size: 6.5px;
              color: #475569;
              margin-top: 2px;
              border-top: 0.5px solid #cbd5e1;
              padding-top: 1px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-title">
              <h1>HNAGV ESSALUD CUSCO — FORMATO DE CONTROL DE CILINDROS POR RECORRIDO EN HOSPITALIZACIÓN</h1>
              <span style="font-size: 7.5px; font-weight: bold; color: #475569;">SISTEMA CENTRAL DE OXÍGENO</span>
            </div>
            <div class="header-info">
              <div>
                <span>FECHA: <b>${getLocalDate()}</b></span>
                <span>TURNO: <b>${SHIFT_ES[currentShift] || currentShift}</b></span>
                <span>HORA: <b>${getLocalTime()}</b></span>
              </div>
              <div>
                <span>OPERARIO: <b>____________________________</b></span>
                <span>TOTAL RECORRIDO: <b>${totalCylinders} cilindros</b></span>
              </div>
            </div>
          </div>

          <div class="print-grid">
            ${columnsHtml}
          </div>

          <div class="footer">
            <span>Fórmula de autonomía: (Vol_L × P_bar) / (Flujo × 60) | Sistema de Gestión de Almacén de Oxígeno Medicinal - EsSalud</span>
            <span>Generado el ${getLocalDate()} ${getLocalTime()}</span>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  const getLocalDate = () => new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const getLocalTime = () => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  // ── Filtros ──
  const filteredData = localData.filter(cyl => {
    const matchService  = !selectedService || cyl.current_service?.name === selectedService;
    const matchBed      = !selectedBed || String(cyl.current_bed?.bed_number) === selectedBed;
    const matchCylinder = !searchCylinder || cyl.serial_number?.toLowerCase().includes(searchCylinder.toLowerCase());
    return matchService && matchBed && matchCylinder;
  });

  const uniqueServices = Array.from(new Set(localData.map(c => c.current_service?.name).filter(Boolean))).sort();
  const uniqueBeds     = Array.from(new Set(
    localData
      .filter(c => !selectedService || c.current_service?.name === selectedService)
      .map(c => c.current_bed?.bed_number)
      .filter(Boolean)
  )).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  const half    = Math.ceil(filteredData.length / 2);
  const leftCol  = filteredData.slice(0, half);
  const rightCol = filteredData.slice(half);

  const renderTable = (columnData, startIndex) => (
    <table className="w-full text-xs bg-white border-collapse border border-black text-center shadow-sm">
      <thead>
        <tr>
          <th className="border border-black p-1 w-6 bg-slate-100">N°</th>
          <th className="border border-black p-1 bg-slate-100">CAMA</th>
          <th className="border border-black p-1 bg-slate-100">SERVICIO</th>
          <th className="border border-black p-1 bg-slate-100">CILINDRO</th>
          <th className="border border-black p-1 bg-slate-100">MODELO</th>
          <th className="border border-black p-1 w-16 bg-slate-100 no-print">PRESIÓN (PSI)</th>
          <th className="border border-black p-1 w-16 bg-slate-100 no-print">FLUJO (L/min)</th>
          <th className="border border-black p-1 w-20 bg-slate-100">TIEMPO (H)</th>
          <th className="border border-black p-1 bg-slate-100 no-print">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        {columnData.map((cyl, i) => {
          const globalIdx = startIndex + i;
          const isSaving  = savingId === cyl.id;
          return (
            <tr key={cyl.id} className="hover:bg-slate-50 transition-colors">
              <td className="border border-black p-1">{globalIdx + 1}</td>
              <td className="border border-black p-1 text-[10px] uppercase font-bold text-blue-700">
                {cyl.current_bed?.bed_number || '-'}
              </td>
              <td className="border border-black p-1 text-[10px] uppercase truncate max-w-[100px]">
                {cyl.current_service?.name || '-'}
              </td>
              {/* Click en serie → historial */}
              <td
                className="border border-black p-1 uppercase font-mono cursor-pointer text-indigo-700 hover:underline no-print"
                title="Ver historial de lecturas"
                onClick={() => setHistorialCyl(cyl)}
              >
                {cyl.serial_number}
              </td>
              <td className="border border-black p-1 uppercase print-only hidden">{cyl.serial_number}</td>
              <td className="border border-black p-1 text-[10px] truncate max-w-[80px] uppercase">
                {cyl.ownership_type?.name || 'ESSALUD'}
              </td>

              {/* Presión */}
              <td className="border border-black p-0 no-print">
                <input
                  type="number"
                  className="w-full h-full text-center outline-none bg-transparent p-1"
                  value={cyl.presion_psi}
                  onChange={e => handleInputChange(cyl.id, 'presion_psi', e.target.value)}
                  placeholder="PSI"
                  min="0"
                />
              </td>

              {/* Flujo */}
              <td className="border border-black p-0 no-print">
                <input
                  type="number"
                  className="w-full h-full text-center outline-none bg-transparent p-1"
                  value={cyl.flujo_lmin}
                  onChange={e => handleInputChange(cyl.id, 'flujo_lmin', e.target.value)}
                  placeholder="L/min"
                  min="0.01"
                  step="0.1"
                />
              </td>

              {/* Tiempo estimado con semáforo */}
              <td className={`border border-black p-1 font-bold rounded-sm ${getTimeStyle(cyl.tiempo_horas)}`}>
                {cyl.tiempo_horas !== '' ? `${cyl.tiempo_horas}h` : '—'}
              </td>

              {/* Acciones */}
              <td className="border border-black p-1 no-print">
                <div className="flex items-center justify-center gap-1">
                  {/* Guardar lectura */}
                  <button
                    onClick={() => handleSaveReading(cyl)}
                    disabled={isSaving || !cyl.presion_psi || !cyl.flujo_lmin}
                    title="Guardar lectura"
                    className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-40 transition-colors"
                  >
                    {isSaving
                      ? <span className="animate-spin inline-block h-3 w-3 border border-green-700 border-t-transparent rounded-full" />
                      : <MdSave className="text-sm" />
                    }
                  </button>
                  {/* Historial */}
                  <button
                    onClick={() => setHistorialCyl(cyl)}
                    title="Ver historial"
                    className="p-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors"
                  >
                    <MdHistory className="text-sm" />
                  </button>
                  {/* Cambiar cama */}
                  <button
                    onClick={() => setTransferCyl(cyl)}
                    title="Cambiar de cama"
                    className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                  >
                    <MdSwapHoriz className="text-sm" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // Estadísticas de urgencia
  const critical = localData.filter(c => c.tiempo_horas !== '' && c.tiempo_horas <= 1).length;
  const caution  = localData.filter(c => c.tiempo_horas !== '' && c.tiempo_horas > 1 && c.tiempo_horas <= 3).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
            <MdLocalHospital className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Control de Hospitalización</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Turno actual: <span className="font-bold text-indigo-600">{SHIFT_ES[currentShift]}</span>
              {' · '}{localData.length} cilindros
              {critical > 0 && <span className="ml-2 text-red-600 font-bold animate-pulse">⚠ {critical} crítico{critical > 1 ? 's' : ''}</span>}
              {caution > 0  && <span className="ml-2 text-amber-600 font-bold">· {caution} en precaución</span>}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchControl}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold transition-colors"
          >
            <MdRefresh className="text-xl" /> Actualizar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
          >
            <MdPrint className="text-xl" /> Imprimir
          </button>
        </div>
      </div>

      {/* Leyenda semáforo */}
      <div className="flex flex-wrap gap-3 text-xs font-semibold">
        <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" /> ≤ 1h — Crítico
        </span>
        <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> 1h–3h — Precaución
        </span>
        <span className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> {'> 3h'} — OK
        </span>
        <span className="text-slate-400 text-[11px] ml-2 self-center">
          Fórmula: (Vol_L × P_bar) / (Flujo × 60)
        </span>
      </div>

      {loading && (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
        </div>
      )}
      {error && (
        <div className="p-4 text-red-500 bg-red-50 font-bold text-center rounded-lg">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Filtrar por Servicio:</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                value={selectedService}
                onChange={e => { setSelectedService(e.target.value); setSelectedBed(''); }}
              >
                <option value="">-- Todos los servicios --</option>
                {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Filtrar por Cama:</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                value={selectedBed}
                onChange={e => setSelectedBed(e.target.value)}
                disabled={!selectedService}
              >
                <option value="">-- Todas las camas --</option>
                {uniqueBeds.map(b => <option key={b} value={String(b)}>Cama {b}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Buscar Cilindro:</label>
              <input
                type="text"
                placeholder="Ej. SN-1234"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 uppercase"
                value={searchCylinder}
                onChange={e => setSearchCylinder(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla imprimible */}
          <div ref={reportRef} className="min-w-[900px] text-black">
            <h2 className="text-center font-black text-xl mb-6 tracking-wide">
              FORMATO DE CONTROL DE CILINDROS POR SERVICIO HNAGV ESSALUD CUSCO
            </h2>

            <div className="flex justify-between items-center mb-4 text-sm font-bold px-2">
              <div>FECHA: <span className="ml-2 font-normal">{getLocalDate()}</span></div>
              <div>TURNO: <span className="ml-2 font-normal">{SHIFT_ES[currentShift]}</span></div>
              <div>OPERARIO: <span className="ml-2 font-normal">________________________</span></div>
              <div>HORA: <span className="ml-2 font-normal">{getLocalTime()}</span></div>
            </div>

            <div className="flex gap-6">
              <div className="w-1/2">{renderTable(leftCol, 0)}</div>
              <div className="w-1/2">{renderTable(rightCol, half)}</div>
            </div>

            {localData.length === 0 && (
              <div className="text-center p-8 text-slate-500 italic mt-4">
                No hay cilindros registrados en uso en Hospitalización.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modales */}
      {historialCyl && (
        <HistorialModal cylinder={historialCyl} onClose={() => setHistorialCyl(null)} />
      )}
      {transferCyl && (
        <BedTransferModal
          cylinder={transferCyl}
          currentShift={currentShift}
          onClose={() => setTransferCyl(null)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {/* Toast de Notificaciones */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default HospitalizationControl;
