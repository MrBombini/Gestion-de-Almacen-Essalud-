import { useState, useEffect } from 'react';
import { MdFileDownload, MdSearch, MdPersonSearch, MdHistory } from 'react-icons/md';
import api from '../services/api';
import { exportPadomiExchangeReport } from '../utils/excelExportService';
import { formatDate } from '../utils/dateUtils';

const PadomiExchanges = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [latestOnly, setLatestOnly] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/padomi-exchanges', {
        params: {
          search: searchTerm,
          latest_only: latestOnly ? 1 : 0,
          per_page: 'all'
        }
      });
      if (res.data && res.data.data) {
        setData(res.data.data);
      } else {
        setData(res.data || []);
      }
    } catch (err) {
      console.error(err);
      alert('Error al cargar los balones de pacientes PADOMI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [latestOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const reportTitle = latestOnly ? 'Último Balón Actual por Paciente' : 'Histórico de Intercambios PADOMI';
    await exportPadomiExchangeReport(data, reportTitle);
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Balones Pacientes PADOMI</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {latestOnly 
              ? 'Muestra el último balón en posesión de cada paciente (último movimiento registrado).'
              : 'Historial completo de intercambios y entregas de balones a pacientes.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Formulario de búsqueda por Paciente / DNI */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-72">
            <input 
              type="text"
              placeholder="Buscar por paciente o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <MdPersonSearch className="absolute left-3 top-3 text-slate-400 text-lg" />
            {searchTerm && (
              <button 
                type="submit" 
                className="absolute right-2 top-2 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Buscar
              </button>
            )}
          </form>

          {/* Selector para Alternar entre Último Balón e Histórico Completo */}
          <button
            onClick={() => setLatestOnly(!latestOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              latestOnly
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Alternar entre ver sólo el último balón asignado o todo el historial"
          >
            <MdHistory className="text-base" />
            {latestOnly ? 'Ver Histórico Completo' : 'Solo Último Balón Actual'}
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

      {/* Resumen de Total de Pacientes Registrados */}
      <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl px-5 py-3 text-xs font-bold text-blue-800">
        <span>Mostrando {data.length} pacientes / registros registrados</span>
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
          {latestOnly ? 'Último Movimiento por Paciente' : 'Histórico General'}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold text-[11px] bg-blue-50/50 text-blue-700">Paciente (DNI)</th>
                <th className="px-6 py-4 font-bold text-[11px] bg-green-50/50 text-green-700">Balón Lleno (Balón Actual)</th>
                <th className="px-6 py-4 font-bold text-[11px]">Receta Médica</th>
                <th className="px-6 py-4 font-bold text-[11px] bg-red-50/50 text-red-700">Balón Devuelto (Vacío)</th>
                <th className="px-6 py-4 font-bold text-[11px]">Última Fecha Mov.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                    Cargando información de pacientes y balones...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No se encontraron pacientes con movimientos registrados.
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
                      {/* Paciente */}
                      <td className="px-6 py-4 bg-blue-50/10 border-l border-blue-50/50">
                        <div className="font-extrabold text-slate-800">{p.full_name || 'Paciente No Especificado'}</div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {p.dni ? `DNI: ${p.dni}` : 'Sin DNI'} {p.phone_number ? `• Tel: ${p.phone_number}` : ''}
                        </div>
                        {p.address && <div className="text-[10px] text-slate-400 font-medium truncate max-w-[220px]">{p.address}</div>}
                      </td>

                      {/* Lleno / Balon Actual */}
                      <td className="px-6 py-4 bg-green-50/10 border-l border-green-50/50">
                        {lleno ? (
                          <>
                            <div className="font-black text-green-700 text-base">{lleno.serial_number}</div>
                            <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                              {lleno.ownership_type?.name || 'ESSALUD'} • {lleno.capacity} m³
                            </div>
                            <div className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">
                              En Posesión del Paciente
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400 font-semibold text-xs border border-dashed border-slate-200 p-2 rounded-lg text-center">
                            Sin Balón Asignado / Devuelto
                          </div>
                        )}
                      </td>

                      {/* Receta */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 truncate max-w-[180px]">{rx.diagnosis || 'Sin Dx'}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Médico: {rx.prescribing_doctor || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Vence: {rx.expires_at ? formatDate(rx.expires_at) : 'Sin fecha'}
                        </div>
                      </td>

                      {/* Vacio Devuelto */}
                      <td className="px-6 py-4 bg-red-50/10 border-l border-red-50/50">
                        {vacio ? (
                          <>
                            <div className="font-black text-red-600">{vacio.serial_number}</div>
                            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Devuelto al Almacén</div>
                          </>
                        ) : (
                          <div className="text-slate-400 font-medium text-xs">-</div>
                        )}
                      </td>

                      {/* Fecha Movimiento */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{formatDate(mov.movement_at)}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                          {new Date(mov.movement_at).toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'})}
                        </div>
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

