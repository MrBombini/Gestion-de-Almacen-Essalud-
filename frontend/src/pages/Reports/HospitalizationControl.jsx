import React, { useState, useEffect, useRef } from 'react';
import { MdLocalHospital, MdPrint, MdRefresh, MdSwapHoriz, MdHistory, MdSave, MdClose } from 'react-icons/md';
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
// Modal: Historial de lecturas de un cilindro
// ─────────────────────────────────────────────
function HistorialModal({ cylinder, onClose }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/hospitalization/readings/${cylinder.id}`)
      .then(r => setReadings(r.data))
      .catch(() => setReadings([]))
      .finally(() => setLoading(false));
  }, [cylinder.id]);

  const SHIFT_ES = { Morning: 'Mañana', Afternoon: 'Tarde', Night: 'Noche' };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <MdHistory className="text-2xl text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-800">Historial de Lecturas</h3>
              <p className="text-xs text-slate-500">Cilindro: <span className="font-mono font-bold">{cylinder.serial_number}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
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
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal: Cambio de cama
// ─────────────────────────────────────────────
function BedTransferModal({ cylinder, currentShift, onClose, onSuccess }) {
  const [services, setServices] = useState([]);
  const [beds, setBeds] = useState([]);
  const [toServiceId, setToServiceId] = useState('');
  const [toBedId, setToBedId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!toServiceId) { setBeds([]); setToBedId(''); return; }
    api.get('/beds', { params: { service_id: toServiceId } })
      .then(r => setBeds(r.data?.data || r.data || []))
      .catch(() => setBeds([]));
    setToBedId('');
  }, [toServiceId]);

  const handleSubmit = async () => {
    if (!toBedId) { alert('Selecciona la cama de destino.'); return; }
    setSaving(true);
    try {
      await api.post('/hospitalization/bed-transfer', {
        cylinder_id:   cylinder.id,
        to_bed_id:     parseInt(toBedId),
        to_service_id: toServiceId ? parseInt(toServiceId) : null,
        shift:         currentShift,
        notes,
      });
      alert(`Cilindro ${cylinder.serial_number} trasladado correctamente.`);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al trasladar el cilindro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <MdSwapHoriz className="text-2xl text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-800">Cambiar Cama</h3>
              <p className="text-xs text-slate-500">Cilindro: <span className="font-mono font-bold">{cylinder.serial_number}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
            <span className="font-bold">Cama actual:</span>{' '}
            {cylinder.current_bed?.bed_number || '-'} —{' '}
            {cylinder.current_service?.name || 'Sin servicio'}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Servicio destino:</label>
            <select
              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
              value={toServiceId}
              onChange={e => setToServiceId(e.target.value)}
            >
              <option value="">-- Seleccionar servicio --</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Cama destino: *</label>
            <select
              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 disabled:opacity-50"
              value={toBedId}
              onChange={e => setToBedId(e.target.value)}
              disabled={!toServiceId}
            >
              <option value="">-- Seleccionar cama --</option>
              {beds.map(b => (
                <option key={b.id} value={b.id}>Cama {b.bed_number}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Notas (opcional):</label>
            <textarea
              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 resize-none"
              rows={2}
              placeholder="Motivo del traslado..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !toBedId}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <MdSwapHoriz />
              )}
              Trasladar
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
  const reportRef = useRef(null);

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

  // ── Guardar lectura en el backend ──
  const handleSaveReading = async (cyl) => {
    if (!cyl.presion_psi || !cyl.flujo_lmin) {
      alert('Ingresa presión y flujo antes de guardar.');
      return;
    }
    setSavingId(cyl.id);
    try {
      await api.post('/hospitalization/readings', {
        cylinder_id:  cyl.id,
        pressure_psi: parseFloat(cyl.presion_psi),
        flow_lmin:    parseFloat(cyl.flujo_lmin),
        shift:        currentShift,
      });
      alert(`Lectura de ${cyl.serial_number} guardada. Tiempo estimado: ${cyl.tiempo_horas}h`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al guardar la lectura.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Print ──
  const handlePrint = () => {
    if (!reportRef.current) return;
    const printContent = reportRef.current.outerHTML;
    const printWindow = window.open('', '', 'width=1000,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Control de Cilindros - Hospitalización</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; padding: 10px; margin: 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; }
            th, td { border: 1px solid #000; padding: 4px; }
            th { font-weight: bold; background-color: #f1f5f9; }
            h2 { text-align: center; font-size: 16px; margin-bottom: 20px; text-transform: uppercase; }
            .no-print { display: none; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; font-size: 12px; }
            input { border: none; text-align: center; width: 100%; font-size: 11px; font-family: inherit; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
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
          onSuccess={fetchControl}
        />
      )}
    </div>
  );
};

export default HospitalizationControl;
