import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  MdDownload, 
  MdChevronLeft, 
  MdChevronRight, 
  MdWaterDrop, 
  MdBubbleChart,
  MdBarChart,
  MdCalendarMonth,
  MdOutlineSwipe,
  MdViewWeek,
  MdCheckCircle
} from 'react-icons/md';
import api from '../../services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getLocalYYYYMM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const fmtNum = (n) => {
  if (n === null || n === undefined || n === '') return '';
  return Number(n).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const monthLabel = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
};

const prevMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const nextMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─────────────────────────────────────────────────────────────────────────────
const MonthlyResumenReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(getLocalYYYYMM());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('both'); // 'both' | 'liquid' | 'gas'
  const reportRef = useRef(null);

  const fetchData = async (month) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/reports/monthly-summary?month=${month}`);
      setData(res.data);
    } catch (e) {
      setError('Error al cargar los datos del informe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(selectedMonth); }, [selectedMonth]);

  // Totales y KPIs calculados
  const liquid = data?.liquid_readings ?? [];
  const gas    = data?.gas_consumption ?? [];

  const metrics = useMemo(() => {
    const totalLiquidRow = liquid.find(r => r.is_total);
    const totalGasRow    = gas.find(r => r.is_total);

    const totalLiquid = totalLiquidRow?.consumo ?? 0;
    const totalGas    = totalGasRow?.total ?? 0;
    const padomi      = totalGasRow?.padomi ?? 0;
    const hnagv       = totalGasRow?.hnagv ?? 0;
    const periferia   = totalGasRow?.periferia ?? 0;

    const daysCount = liquid.filter(r => !r.is_total).length;
    const daysWithData = liquid.filter(r => !r.is_total && r.lectura_actual !== null).length;

    return { totalLiquid, totalGas, padomi, hnagv, periferia, daysCount, daysWithData };
  }, [liquid, gas]);

  // ── Exportar a Excel (mantiene formato oficial intacto) ────────────────────
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8">
      <style>
        table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10px; }
        th, td { border: 1px solid #000; padding: 3px 5px; text-align: center; vertical-align: middle; }
      </style>
      </head><body>` + reportRef.current.innerHTML + `</body></html>`;
    const src = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
    const a = document.createElement('a');
    a.href = src;
    a.download = `Resumen_${selectedMonth}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── CABECERA PRINCIPAL ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Título e Icono */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-sm shrink-0">
              <MdBubbleChart className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                Resumen Mensual de Oxígeno
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lecturas Criogénicas · Consumo Gaseoso por Red
              </p>
            </div>
          </div>

          {/* Controles de Selección de Mes + Exportar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* Selector de Mes táctil */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner flex-1 sm:flex-initial justify-between">
              <button
                onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
                className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-200 hover:text-blue-600 transition-colors active:scale-95"
                title="Mes anterior"
                aria-label="Mes anterior"
              >
                <MdChevronLeft className="text-xl" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none outline-none text-xs sm:text-sm font-bold text-slate-700 px-2 py-1.5 cursor-pointer text-center"
              />
              <button
                onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
                className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-200 hover:text-blue-600 transition-colors active:scale-95"
                title="Mes siguiente"
                aria-label="Mes siguiente"
              >
                <MdChevronRight className="text-xl" />
              </button>
            </div>

            {/* Botón Excel */}
            <button
              onClick={handleExportExcel}
              disabled={loading || !data}
              className="flex items-center justify-center gap-2 bg-[#1d6f42] hover:bg-green-800 disabled:bg-slate-300
                         text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 shrink-0"
            >
              <MdDownload className="text-lg" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* ── SELECTOR DE PESTAÑAS (Vistas en Celular / Pantallas Pequeñas) ── */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Vista:
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 gap-1 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'both'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <MdViewWeek className="text-sm" />
              <span>Ambos</span>
            </button>
            <button
              onClick={() => setActiveTab('liquid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'liquid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <MdWaterDrop className="text-sm text-blue-500" />
              <span>Oxígeno Líquido</span>
            </button>
            <button
              onClick={() => setActiveTab('gas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'gas'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <MdBubbleChart className="text-sm text-green-500" />
              <span>Consumo Gaseoso</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CARDS KPI / RESUMEN VISUAL (Instantáneo en Celular y Desktop) ── */}
      {data && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Oxígeno Líquido */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 rounded-2xl border border-blue-100 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Oxígeno Líquido</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {fmtNum(metrics.totalLiquid)} <span className="text-sm font-semibold text-slate-500">m³</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Consumo total del mes
              </p>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
              <MdWaterDrop className="text-2xl" />
            </div>
          </div>

          {/* Card 2: Oxígeno Gaseoso Total */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-2xl border border-emerald-100 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Oxígeno Gaseoso</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {fmtNum(metrics.totalGas)} <span className="text-sm font-semibold text-slate-500">m³</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Salidas en balones
              </p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <MdBubbleChart className="text-2xl" />
            </div>
          </div>

          {/* Card 3: Distribución Gaseoso */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Distribución Red</p>
            <div className="grid grid-cols-3 gap-1.5 mt-2 text-center">
              <div className="bg-indigo-50/80 rounded-lg p-1.5 border border-indigo-100/60">
                <p className="text-[9px] font-bold text-indigo-700 uppercase">PADOMI</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">{fmtNum(metrics.padomi)}</p>
              </div>
              <div className="bg-green-50/80 rounded-lg p-1.5 border border-green-100/60">
                <p className="text-[9px] font-bold text-green-700 uppercase">HNAGV</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">{fmtNum(metrics.hnagv)}</p>
              </div>
              <div className="bg-amber-50/80 rounded-lg p-1.5 border border-amber-100/60">
                <p className="text-[9px] font-bold text-amber-700 uppercase">PERIF.</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">{fmtNum(metrics.periferia)}</p>
              </div>
            </div>
          </div>

          {/* Card 4: Días con Registros */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Cobertura Mensual</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.daysWithData} <span className="text-sm font-semibold text-slate-400">/ {metrics.daysCount}</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <MdCheckCircle className="text-emerald-500 text-sm" />
                Días con lecturas registradas
              </p>
            </div>
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
              <MdCalendarMonth className="text-2xl" />
            </div>
          </div>

        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL / TABLAS ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando reporte...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 font-bold">{error}</div>
        ) : (
          <div className="p-3 sm:p-5">

            {/* Aviso de deslizamiento para móviles */}
            <div className="flex lg:hidden items-center justify-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200/60 mb-3">
              <MdOutlineSwipe className="text-base text-blue-600" />
              <span>Desliza horizontalmente la tabla para ver todos los valores</span>
            </div>

            {/* Contenedor referenciado para exportar a Excel (siempre contiene la estructura de 2 tablas) */}
            <div ref={reportRef}>
              
              {/* Encabezado formal */}
              <div className="text-center mb-4 sm:mb-5">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">EsSalud — Central de Oxígeno</p>
                <h1 className="text-base sm:text-lg font-black text-slate-800 uppercase mt-0.5">
                  Resumen Mensual de Oxígeno
                </h1>
                <h2 className="text-xs sm:text-base font-bold text-slate-600">{monthLabel(selectedMonth)}</h2>
              </div>

              {/* ── TABLAS (Se apilan en móvil si es "both", o se muestran lado a lado en lg) ── */}
              <div className={`flex ${activeTab === 'both' ? 'flex-col lg:flex-row gap-5' : 'flex-col'} items-start`}>

                {/* TABLA IZQUIERDA — Oxígeno Líquido */}
                {(activeTab === 'both' || activeTab === 'liquid') && (
                  <div className="w-full flex-1 overflow-x-auto rounded-xl border border-slate-300">
                    <table className="w-full min-w-[340px] text-[10px] sm:text-[11px] border-collapse">
                      <thead>
                        <tr>
                          <th colSpan="4"
                              className="border-b border-black bg-blue-100 font-black py-2 px-2 text-blue-900 text-xs uppercase tracking-wide text-center">
                            OXÍGENO LÍQUIDO — LECTURAS CONTÓMETRO
                          </th>
                        </tr>
                        <tr className="bg-blue-50 text-slate-800">
                          <th className="border border-black px-2 py-1.5 font-bold sticky left-0 bg-blue-50 z-10">FECHA</th>
                          <th className="border border-black px-2 py-1.5 font-bold">LECTURA<br/>ANTERIOR</th>
                          <th className="border border-black px-2 py-1.5 font-bold">LECTURA<br/>ACTUAL</th>
                          <th className="border border-black px-2 py-1.5 font-bold bg-blue-100/50">CONSUMO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liquid.map((row, i) => {
                          const isTotal = row.is_total;
                          const hasData = row.lectura_actual !== null;
                          return (
                            <tr
                              key={i}
                              className={
                                isTotal
                                  ? 'bg-blue-900 text-white font-black'
                                  : hasData
                                  ? 'hover:bg-blue-50/50 transition-colors'
                                  : 'bg-slate-50/40'
                              }
                            >
                              <td className={`border border-black px-2 py-1 text-left font-bold whitespace-nowrap ${
                                isTotal ? 'sticky left-0 bg-blue-900 text-white' : 'sticky left-0 bg-white text-slate-700 shadow-[1px_0_3px_rgba(0,0,0,0.05)]'
                              }`}>
                                {row.fecha}
                              </td>
                              <td className={`border border-black px-2 py-1 text-right font-mono ${!hasData && !isTotal ? 'text-slate-300' : ''}`}>
                                {fmtNum(row.lectura_anterior)}
                              </td>
                              <td className={`border border-black px-2 py-1 text-right font-mono ${!hasData && !isTotal ? 'text-slate-300' : ''}`}>
                                {fmtNum(row.lectura_actual)}
                              </td>
                              <td className={`border border-black px-2 py-1 text-right font-bold ${
                                isTotal ? 'text-white' : row.consumo > 0 ? 'text-blue-700 bg-blue-50/30' : 'text-slate-300'
                              }`}>
                                {row.consumo > 0 || isTotal ? fmtNum(row.consumo) : '0'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TABLA DERECHA — Consumo Gaseoso */}
                {(activeTab === 'both' || activeTab === 'gas') && (
                  <div className="w-full flex-1 overflow-x-auto rounded-xl border border-slate-300">
                    <table className="w-full min-w-[340px] text-[10px] sm:text-[11px] border-collapse">
                      <thead>
                        <tr>
                          <th colSpan="5"
                              className="border-b border-black bg-emerald-100 font-black py-2 px-2 text-emerald-900 text-xs uppercase tracking-wide text-center">
                            CONSUMO OXÍGENO GASEOSO (m³ por día)
                          </th>
                        </tr>
                        <tr className="bg-green-50 text-slate-800">
                          <th className="border border-black px-2 py-1.5 font-bold sticky left-0 bg-green-50 z-10">FECHA</th>
                          <th className="border border-black px-2 py-1.5 font-bold">PADOMI</th>
                          <th className="border border-black px-2 py-1.5 font-bold">HNAGV</th>
                          <th className="border border-black px-2 py-1.5 font-bold">PERIFERIA</th>
                          <th className="border border-black px-2 py-1.5 font-bold bg-emerald-100/50">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gas.map((row, i) => {
                          const isTotal = row.is_total;
                          const hasAny  = row.total > 0;
                          return (
                            <tr
                              key={i}
                              className={
                                isTotal
                                  ? 'bg-emerald-900 text-white font-black'
                                  : hasAny
                                  ? 'hover:bg-emerald-50/50 transition-colors'
                                  : 'bg-slate-50/40'
                              }
                            >
                              <td className={`border border-black px-2 py-1 text-left font-bold whitespace-nowrap ${
                                isTotal ? 'sticky left-0 bg-emerald-900 text-white' : 'sticky left-0 bg-white text-slate-700 shadow-[1px_0_3px_rgba(0,0,0,0.05)]'
                              }`}>
                                {row.fecha}
                              </td>
                              <td className={`border border-black px-2 py-1 text-center font-bold ${
                                isTotal ? 'text-white' : row.padomi > 0 ? 'text-indigo-700' : 'text-slate-300'
                              }`}>
                                {row.padomi > 0 || isTotal ? fmtNum(row.padomi) : ''}
                              </td>
                              <td className={`border border-black px-2 py-1 text-center font-bold ${
                                isTotal ? 'text-white' : row.hnagv > 0 ? 'text-green-700' : 'text-slate-300'
                              }`}>
                                {row.hnagv > 0 || isTotal ? fmtNum(row.hnagv) : ''}
                              </td>
                              <td className={`border border-black px-2 py-1 text-center font-bold ${
                                isTotal ? 'text-white' : row.periferia > 0 ? 'text-amber-600' : 'text-slate-300'
                              }`}>
                                {row.periferia > 0 || isTotal ? fmtNum(row.periferia) : ''}
                              </td>
                              <td className={`border border-black px-2 py-1 text-center font-black ${
                                isTotal ? 'text-white' : hasAny ? 'text-slate-900 bg-emerald-50/30' : 'text-slate-300'
                              }`}>
                                {row.total > 0 || isTotal ? fmtNum(row.total) : '0'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default MonthlyResumenReport;
