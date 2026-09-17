import { useState, useEffect } from 'react';
import { MdFileDownload, MdSearch, MdSwapHoriz } from 'react-icons/md';
import api from '../services/api';
import { exportPadomiExchangeReport } from '../utils/excelExportService';
import { formatDate } from '../utils/dateUtils';

const PadomiExchanges = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/padomi-exchanges', {
        params: {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          per_page: 'all'
        }
      });
      // The API returns paginated structure (e.g. res.data.data) because of paginate()
      if (res.data && res.data.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Error al cargar los intercambios PADOMI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const rangeText = `${dateRange.start_date} al ${dateRange.end_date}`;
    await exportPadomiExchangeReport(data, rangeText);
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Intercambios PADOMI</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Historial de balones entregados y devueltos por pacientes.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white shadow-sm"
          />
          <span className="text-slate-400 font-bold">a</span>
          <input 
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white shadow-sm"
          />
          <button 
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <MdSearch className="text-xl" />
          </button>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <MdFileDownload className="text-lg" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold text-[11px]">Fecha y Hora</th>
                <th className="px-6 py-4 font-bold text-[11px] bg-green-50/50 text-green-700">Lleno (Llevó)</th>
                <th className="px-6 py-4 font-bold text-[11px] bg-blue-50/50 text-blue-700">Paciente</th>
                <th className="px-6 py-4 font-bold text-[11px] bg-blue-50/50 text-blue-700">Receta (Venc.)</th>
                <th className="px-6 py-4 font-bold text-[11px] bg-red-50/50 text-red-700">Vacío (Devolvió)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                    Cargando movimientos...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No se encontraron intercambios en estas fechas.
                  </td>
                </tr>
              ) : (
                data.map((mov) => {
                  let lleno = null;
                  let vacio = null;

                  if (mov.cylinder_movements) {
                    mov.cylinder_movements.forEach(cm => {
                      if (cm.action === 'Exit') lleno = cm.cylinder;
                      if (cm.action === 'Entry') vacio = cm.cylinder;
                    });
                  }

                  const p = mov.patient || {};
                  const rx = mov.prescription || {};

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{formatDate(mov.movement_at)}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{new Date(mov.movement_at).toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      
                      {/* Lleno */}
                      <td className="px-6 py-4 bg-green-50/10 border-l border-green-50/50">
                        <div className="font-black text-green-700">{lleno?.serial_number || '-'}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{lleno?.ownership_type?.name} • {lleno?.capacity}m³</div>
                      </td>

                      {/* Paciente */}
                      <td className="px-6 py-4 bg-blue-50/10 border-l border-blue-50/50">
                        <div className="font-bold text-slate-800">{p.full_name || '-'}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">{p.dni ? `DNI: ${p.dni}` : '-'}</div>
                      </td>

                      {/* Receta */}
                      <td className="px-6 py-4 bg-blue-50/10">
                        <div className="font-bold text-slate-700 truncate max-w-[150px]">{rx.diagnosis || 'Sin Dx'}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Exp: {rx.expires_at ? formatDate(rx.expires_at) : '-'}
                        </div>
                      </td>

                      {/* Vacio */}
                      <td className="px-6 py-4 bg-red-50/10 border-l border-red-50/50">
                        <div className="font-black text-red-600">{vacio?.serial_number || '-'}</div>
                        {vacio && <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Entregado al Almacén</div>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PadomiExchanges;
