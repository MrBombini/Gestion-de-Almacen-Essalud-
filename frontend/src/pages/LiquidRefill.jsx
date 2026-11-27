import { useState, useEffect } from 'react';
import { MdLocalShipping, MdSave, MdWaterDrop, MdReceipt } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

const LiquidRefill = () => {
  const { shift } = useAuth();

  // 1. Fetch de proveedores para el selector
  const { data: suppliers, loading: loadingS } = useFetch('/suppliers');
  const suppliersList = Array.isArray(suppliers) ? suppliers : (suppliers?.data || []);

  const { data: refillsData, execute: fetchRefills, loading: loadingR } = useFetch('/liquid/refills');
  const refillsList = Array.isArray(refillsData) ? refillsData : (refillsData?.data || []);

  // 2. Hook para el POST
  const { execute, loading: actionLoading } = useFetch('/liquid/refill', 'POST', null, false);

  // Obtener fecha y hora actual en Perú para el valor por defecto
  const getPeruDateTime = () => {
    const peruTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    const yyyy = peruTime.getFullYear();
    const mm = String(peruTime.getMonth() + 1).padStart(2, '0');
    const dd = String(peruTime.getDate()).padStart(2, '0');
    const hh = String(peruTime.getHours()).padStart(2, '0');
    const min = String(peruTime.getMinutes()).padStart(2, '0');
    // El input datetime-local de HTML5 requiere este formato: YYYY-MM-DDTHH:mm
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [formData, setFormData] = useState({
    supplier_id: '',
    reference_document: '',
    refilled_at: getPeruDateTime(),
    level_before: '',
    level_after: '',
    weight_before: '',
    weight_after: '',
    ticket_amount: ''
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [calculatedRefill, setCalculatedRefill] = useState(0);
  const [calculatedWeight, setCalculatedWeight] = useState(0);

  // Efecto visual: Calcular automáticamente cuánto entró al tanque (Volumen)
  useEffect(() => {
    const before = parseFloat(formData.level_before) || 0;
    const after = parseFloat(formData.level_after) || 0;
    if (after > before) {
      setCalculatedRefill((after - before).toFixed(2));
    } else {
      setCalculatedRefill(0);
    }
  }, [formData.level_before, formData.level_after]);

  // Efecto visual: Calcular kilos descargados (Peso Inicial - Peso Final del camión)
  useEffect(() => {
    const wBefore = parseFloat(formData.weight_before) || 0;
    const wAfter = parseFloat(formData.weight_after) || 0;
    if (wBefore > wAfter) {
      setCalculatedWeight((wBefore - wAfter).toFixed(2));
    } else {
      setCalculatedWeight(0);
    }
  }, [formData.weight_before, formData.weight_after]);

  // Automatización de Cantidad Facturada (Peso Neto * 0.754)
  useEffect(() => {
    if (calculatedWeight > 0) {
      const amount = (calculatedWeight * 0.754).toFixed(2);
      setFormData(prev => ({ ...prev, ticket_amount: amount }));
    }
  }, [calculatedWeight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Formatear la fecha para Laravel (Cambiar la "T" por un espacio y añadir segundos)
    // De: 2026-04-22T15:30 -> A: 2026-04-22 15:30:00
    const formattedDate = formData.refilled_at.replace('T', ' ') + ':00';

    try {
      await execute({
        body: {
          ...formData,
          refilled_at: formattedDate
        }
      });

      setSuccessMessage('¡Recarga de cisterna registrada con éxito!');
      setFormData({
        supplier_id: '',
        reference_document: '',
        refilled_at: getPeruDateTime(), // Reseteamos a la hora actual
        level_before: '',
        level_after: '',
        weight_before: '',
        weight_after: '',
        ticket_amount: ''
      });
      fetchRefills(); // Actualizar tabla
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al registrar la recarga. Revisa los datos.');
    }
  };

  if (loadingS || loadingR) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      {/* Cabecera */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-cyan-50 text-cyan-600 rounded-xl">
          <MdLocalShipping className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Recarga de Tanque Criogénico</h2>
          <p className="text-slate-500 text-sm mt-1">
            Registro y control de abastecimiento de oxígeno líquido por camión cisterna. Turno: <span className="font-bold text-blue-600">{shift}</span>
          </p>
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md text-emerald-700 font-medium">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Proveedor / Empresa</label>
            <select
              required
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="" disabled>-- Selecciona el proveedor --</option>
              {suppliersList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha y Hora de Carga</label>
            <input
              type="datetime-local"
              required
              value={formData.refilled_at}
              onChange={(e) => setFormData({ ...formData, refilled_at: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Lado Izquierdo: Niveles Físicos */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <MdWaterDrop className="text-slate-400" /> Niveles del Tanque
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nivel ANTES de la carga</label>
              <div className="relative">
                <input
                  type="number" step="0.01" required
                  value={formData.level_before}
                  onChange={(e) => setFormData({ ...formData, level_before: e.target.value })}
                  className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-medium"
                  placeholder="Ej: 45.50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">% / L</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nivel DESPUÉS de la carga</label>
              <div className="relative">
                <input
                  type="number" step="0.01" required
                  value={formData.level_after}
                  onChange={(e) => setFormData({ ...formData, level_after: e.target.value })}
                  className="w-full pl-4 pr-12 py-3 border border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  placeholder="Ej: 95.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">% / L</span>
              </div>
            </div>

            {/* Cálculo Visual Niveles */}
            {calculatedRefill > 0 && (
              <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-100 flex justify-between items-center">
                <span className="text-cyan-800 font-medium text-sm">Entrada Calculada (Volumen):</span>
                <span className="text-cyan-700 font-black text-xl">+{calculatedRefill}</span>
              </div>
            )}

            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2 mt-8">
              <MdLocalShipping className="text-slate-400" /> Pesos de la Cisterna
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Peso ANTES de descargar</label>
              <div className="relative">
                <input
                  type="number" step="0.01" required
                  value={formData.weight_before}
                  onChange={(e) => setFormData({ ...formData, weight_before: e.target.value })}
                  className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-medium"
                  placeholder="Ej: 25000.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Kg</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Peso DESPUÉS de descargar</label>
              <div className="relative">
                <input
                  type="number" step="0.01" required
                  value={formData.weight_after}
                  onChange={(e) => setFormData({ ...formData, weight_after: e.target.value })}
                  className="w-full pl-4 pr-12 py-3 border border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  placeholder="Ej: 15000.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">Kg</span>
              </div>
            </div>

            {/* Cálculo Visual Pesos */}
            {calculatedWeight > 0 && (
              <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-100 flex justify-between items-center">
                <span className="text-cyan-800 font-medium text-sm">Descarga Calculada (Peso):</span>
                <span className="text-cyan-700 font-black text-xl">+{calculatedWeight} Kg</span>
              </div>
            )}
          </div>

          {/* Lado Derecho: Documentación del Camión */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <MdReceipt className="text-slate-400" /> Documentación (Ticket)
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Guía de Remisión / Ticket N°</label>
              <input
                type="text" required
                value={formData.reference_document}
                onChange={(e) => setFormData({ ...formData, reference_document: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none uppercase font-medium"
                placeholder="Ej: GR-0932"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad Facturada (Según Ticket)</label>
              <div className="relative">
                <input
                  type="number" step="0.01" required
                  value={formData.ticket_amount}
                  onChange={(e) => setFormData({ ...formData, ticket_amount: e.target.value })}
                  className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none font-medium"
                  placeholder="Ej: 1500.25"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">m³ / L</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Ingresa exactamente lo que marca el Contometro del camión para futuras auditorías.
              </p>
            </div>
          </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={actionLoading}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:bg-slate-400"
          >
            <MdSave className="text-xl" />
            {actionLoading ? 'Procesando...' : 'Guardar Recarga'}
          </button>
        </div>
      </form>

      {/* Historial de Recargas (Módulo de vistas) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">Historial de Guías y Recargas</h3>
          <p className="text-sm text-slate-500">Registro histórico de las descargas de oxígeno líquido al tanque criogénico.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-bold">Fecha / Hora</th>
                <th className="p-4 font-bold">Proveedor</th>
                <th className="p-4 font-bold">N° Guía/Ticket</th>
                <th className="p-4 font-bold">Nivel (% / L)</th>
                <th className="p-4 font-bold">Peso (Kg)</th>
                <th className="p-4 font-bold">Facturado (m³)</th>
                <th className="p-4 font-bold">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refillsList.length > 0 ? refillsList.map((refill) => (
                <tr key={refill.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-800">{new Date(refill.refilled_at).toLocaleDateString()}</span>
                    <br />
                    <span className="text-xs text-slate-500">{new Date(refill.refilled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{refill.supplier?.name || 'S/D'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg">{refill.reference_document || '-'}</span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-slate-400">Antes: {refill.level_before}</span>
                      <span className="font-bold text-emerald-600">Desp: {refill.level_after}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-slate-400">Lleno: {refill.weight_before}</span>
                      <span className="font-bold text-emerald-600">Vacío: {refill.weight_after}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{refill.ticket_amount || '-'}</td>
                  <td className="p-4 text-slate-600">{refill.user?.name || 'S/D'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">No hay recargas registradas aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default LiquidRefill;