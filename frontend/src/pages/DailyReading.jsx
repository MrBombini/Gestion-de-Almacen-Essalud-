import { useState } from 'react';
import { MdTimeline, MdSave, MdWaterDrop, MdSpeed, MdHistory, MdDelete, MdEdit, MdClose } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';

const DailyReading = () => {
  const { shift } = useAuth();
  
  const { data: readings, loading, refetch } = useFetch('/daily-readings');
  const readingsList = Array.isArray(readings) ? readings : (readings?.data || []);
  const { execute, loading: actionLoading } = useFetch('/daily-readings', 'POST', null, false);

  const [formData, setFormData] = useState({
    reading_date: format(new Date(), 'yyyy-MM-dd'),
    shift: shift || 'Morning',
    tank_level: '',
    flow_meter_reading: ''
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // ── Estado de edición inline ──
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Consumo en vivo para el formulario de creación
  const lastReading = readingsList[0];
  const liveConsumption = (() => {
    if (lastReading && formData.flow_meter_reading) {
      const diff = parseFloat(formData.flow_meter_reading) - lastReading.flow_meter_reading;
      return diff > 0 ? diff.toFixed(2) : 0;
    }
    return 0;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await execute({ body: formData });
      setSuccessMessage('¡Lectura registrada correctamente!');
      setFormData({ ...formData, tank_level: '', flow_meter_reading: '' });
      refetch();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al guardar la lectura.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta lectura? Esta acción no se puede deshacer.')) return;
    try {
      await execute({ url: `/daily-readings/${id}`, method: 'DELETE' });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (r) => {
    setEditingId(r.id);
    setEditForm({ reading_date: r.reading_date, shift: r.shift, tank_level: r.tank_level, flow_meter_reading: r.flow_meter_reading });
    setEditError(null);
  };

  const handleCancelEdit = () => { setEditingId(null); setEditError(null); };

  const handleSaveEdit = async (id) => {
    setEditSaving(true);
    setEditError(null);
    try {
      await api.put(`/daily-readings/${id}`, editForm);
      setEditingId(null);
      refetch();
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Error al actualizar.');
    } finally {
      setEditSaving(false);
    }
  };

  const shiftLabel = (s) => ({ Morning: 'Mañana', Afternoon: 'Tarde', Night: 'Noche' }[s] || s);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Cabecera */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><MdTimeline className="text-3xl" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lectura Diaria de Tanque</h2>
          <p className="text-slate-500 text-sm mt-1">
            Monitoreo de nivel físico y consumo acumulado (Turno: <span className="text-blue-600 font-bold">{shift}</span>)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Formulario de Registro ── */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MdSave className="text-blue-600" /> Registrar Nueva Lectura
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {successMessage && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-medium">{successMessage}</div>}
              {errorMessage && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium">{errorMessage}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                <input type="date" required value={formData.reading_date}
                  onChange={(e) => setFormData({...formData, reading_date: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turno</label>
                <select required value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="Morning">Mañana</option>
                  <option value="Afternoon">Tarde</option>
                  <option value="Night">Noche</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <MdWaterDrop className="text-blue-500" /> Nivel de Tanque (%)
                </label>
                <div className="relative">
                  <input type="number" step="0.01" required placeholder="Ej: 85.5"
                    value={formData.tank_level}
                    onChange={(e) => setFormData({...formData, tank_level: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <MdSpeed className="text-orange-500" /> Lectura Flujómetro (m³)
                </label>
                <div className="relative">
                  <input type="number" step="0.01" required placeholder="Ej: 125430.2"
                    value={formData.flow_meter_reading}
                    onChange={(e) => setFormData({...formData, flow_meter_reading: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">m³</span>
                </div>
                {liveConsumption > 0 && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center">
                    <span className="text-[10px] font-bold text-orange-700 uppercase">Consumo Estimado:</span>
                    <span className="text-sm font-black text-orange-800">+{liveConsumption} m³</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={actionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:bg-slate-300">
                {actionLoading ? 'Guardando...' : 'Guardar Lectura'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Historial de Lecturas ── */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 px-2">
            <MdHistory className="text-slate-400" /> Historial de Lecturas
            <span className="text-xs text-slate-400 font-normal">(Haz clic en ✏️ para corregir una lectura)</span>
          </h3>

          {editError && <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded">{editError}</div>}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-4">Fecha / Turno</th>
                  <th className="px-4 py-4 text-center">Nivel</th>
                  <th className="px-4 py-4 text-center">Flujómetro</th>
                  <th className="px-4 py-4 text-center">Consumo</th>
                  <th className="px-4 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {readingsList.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">No hay lecturas registradas.</td></tr>
                ) : readingsList.map(r => (
                  editingId === r.id ? (
                    /* ── FILA EN MODO EDICIÓN ── */
                    <tr key={r.id} className="bg-amber-50 border-l-4 border-amber-400">
                      <td className="px-3 py-3">
                        <input type="date" value={editForm.reading_date}
                          onChange={e => setEditForm({...editForm, reading_date: e.target.value})}
                          className="w-full px-2 py-1 border border-amber-300 rounded text-xs outline-none focus:ring-1 focus:ring-amber-500 mb-1"
                        />
                        <select value={editForm.shift} onChange={e => setEditForm({...editForm, shift: e.target.value})}
                          className="w-full px-2 py-1 border border-amber-300 rounded text-xs outline-none bg-white">
                          <option value="Morning">Mañana</option>
                          <option value="Afternoon">Tarde</option>
                          <option value="Night">Noche</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input type="number" step="0.01" value={editForm.tank_level}
                          onChange={e => setEditForm({...editForm, tank_level: e.target.value})}
                          className="w-20 px-2 py-1 border border-amber-300 rounded text-xs outline-none text-center"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input type="number" step="0.01" value={editForm.flow_meter_reading}
                          onChange={e => setEditForm({...editForm, flow_meter_reading: e.target.value})}
                          className="w-28 px-2 py-1 border border-amber-300 rounded text-xs outline-none font-mono text-center"
                        />
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-slate-400 italic">recalcula al guardar</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleSaveEdit(r.id)} disabled={editSaving}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50">
                            {editSaving ? '...' : '✓ Guardar'}
                          </button>
                          <button onClick={handleCancelEdit}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                            <MdClose className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    /* ── FILA NORMAL ── */
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-slate-800">{r.reading_date}</div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                          Turno: {shiftLabel(r.shift)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md font-bold text-xs ${r.tank_level < 20 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {r.tank_level}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-xs text-slate-600">
                        {Number(r.flow_meter_reading).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm font-black text-slate-800">
                          {r.calculated_consumption > 0 ? `+${r.calculated_consumption}` : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleStartEdit(r)}
                            className="p-1.5 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded transition-colors" title="Editar lectura">
                            <MdEdit className="text-lg" />
                          </button>
                          <button onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Eliminar lectura">
                            <MdDelete className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DailyReading;