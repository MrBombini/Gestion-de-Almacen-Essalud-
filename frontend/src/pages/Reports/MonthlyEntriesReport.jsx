import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  MdDownload, 
  MdChevronLeft, 
  MdChevronRight, 
  MdLocalShipping,
  MdCheckCircle,
  MdWarningAmber,
  MdOutlineSwipe,
  MdCalendarMonth,
  MdFilterList
} from 'react-icons/md';
import api from '../../services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getLocalYYYYMM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const fmtN = (n) => (n === 0 || !n ? '' : n);

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
const MonthlyEntriesReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(getLocalYYYYMM());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [onlyWithMovement, setOnlyWithMovement] = useState(false);
  const reportRef = useRef(null);

  const fetchData = async (month) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/reports/monthly-entries?month=${month}`);
      setData(res.data);
    } catch (e) {
      setError('Error al cargar los datos del informe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(selectedMonth); }, [selectedMonth]);

  const entries = data?.entries ?? [];

  // Métricas calculadas para tarjetas KPI
  const metrics = useMemo(() => {
    const totalRow = entries.find(r => r.is_total);
    const dayRows  = entries.filter(r => !r.is_total);

    const totalIngresos = totalRow?.total_ingreso_cilindros ?? 0;
    const totalSalidas  = totalRow?.total_salida_cilindros ?? 0;
    const totalRechazos = totalRow?.total_no_aceptados ?? 0;

    const daysWithMovement = dayRows.filter(r => 
      (r.total_ingreso_cilindros > 0 || r.total_salida_cilindros > 0)
    ).length;

    const il = totalRow?.ingreso_lleno ?? {};
    const sv = totalRow?.salida_vacio ?? {};

    return {
      totalIngresos,
      totalSalidas,
      totalRechazos,
      daysWithMovement,
      totalDays: dayRows.length,
      il,
      sv
    };
  }, [entries]);

  // Filas a mostrar según filtro móvil
  const displayedEntries = useMemo(() => {
    if (!onlyWithMovement) return entries;
    return entries.filter(r => r.is_total || (r.total_ingreso_cilindros > 0 || r.total_salida_cilindros > 0));
  }, [entries, onlyWithMovement]);

  // ── Exportar a Excel (siempre exporta todos los 31 días oficial) ───────────
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8">
      <style>
        table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9px; }
        th, td { border: 1px solid #000; padding: 2px 4px; text-align: center; vertical-align: middle; }
        .h-lleno    { background-color: #bfdbfe; font-weight: bold; }
        .h-vacio    { background-color: #fecaca; font-weight: bold; }
        .h-rechazo  { background-color: #e9d5ff; font-weight: bold; }
        .h-total    { background-color: #d1fae5; font-weight: bold; }
        .total-row  { background-color: #1e3a5f; color: #fff; font-weight: bold; }
        .val-red    { color: #b91c1c; font-weight: bold; }
        .val-green  { color: #15803d; font-weight: bold; }
        .obs-cell   { font-size: 8px; color: #6b7280; font-style: italic; }
      </style>
      </head><body>` + reportRef.current.innerHTML + `</body></html>`;
    const src = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
    const a = document.createElement('a');
    a.href = src;
    a.download = `Ingresos_${selectedMonth}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Clases CSS de celdas y cabeceras
  const thLleno  = 'border border-black px-1.5 py-1 font-bold bg-blue-200 text-blue-900 text-[9px] sm:text-[10px] whitespace-nowrap';
  const thVacio  = 'border border-black px-1.5 py-1 font-bold bg-red-200 text-red-900 text-[9px] sm:text-[10px] whitespace-nowrap';
  const thRechaz = 'border border-black px-1.5 py-1 font-bold bg-purple-200 text-purple-900 text-[9px] sm:text-[10px] whitespace-nowrap';
  const thTotal  = 'border border-black px-1.5 py-1 font-bold bg-emerald-100 text-emerald-900 text-[9px] sm:text-[10px] whitespace-nowrap';
  const thBase   = 'border border-black px-1.5 py-1 font-bold bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] whitespace-nowrap';

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── CABECERA PRINCIPAL ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Título e Icono */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-sm shrink-0">
              <MdLocalShipping className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                Control de Ingresos de Cilindros
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingreso Llenos · Salida Vacíos OM2 · Devoluciones
              </p>
            </div>
          </div>

          {/* Selector de Mes + Botón Excel */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner flex-1 sm:flex-initial justify-between">
              <button
                onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
                className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-200 hover:text-green-600 transition-colors active:scale-95"
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
                className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-200 hover:text-green-600 transition-colors active:scale-95"
                title="Mes siguiente"
                aria-label="Mes siguiente"
              >
                <MdChevronRight className="text-xl" />
              </button>
            </div>

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

        {/* ── FILTRO RÁPIDO PARA CELULARES (Evita tener que bajar 31 filas vacías) ── */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <MdFilterList className="text-base text-slate-400" />
            <span>Filtrar filas:</span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 gap-1">
            <button
              onClick={() => setOnlyWithMovement(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !onlyWithMovement
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              Todos ({metrics.totalDays})
            </button>
            <button
              onClick={() => setOnlyWithMovement(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                onlyWithMovement
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <MdCheckCircle className="text-green-600 text-sm" />
              <span>Con Movimiento ({metrics.daysWithMovement})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CARDS KPI / RESUMEN VISUAL (Instantáneo en Celular y Desktop) ── */}
      {data && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Total Ingresos Llenos */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 rounded-2xl border border-blue-100 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Ingreso Llenos</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.totalIngresos} <span className="text-sm font-semibold text-slate-500">balones</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Linde 10m³: <span className="font-bold text-slate-700">{metrics.il?.linde_10 || 0}</span> · EsSalud: <span className="font-bold text-slate-700">{(metrics.il?.essalud_10 || 0) + (metrics.il?.essalud_8 || 0) + (metrics.il?.essalud_6 || 0)}</span>
              </p>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
              <MdLocalShipping className="text-2xl" />
            </div>
          </div>

          {/* Card 2: Total Salida Vacíos */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50/40 rounded-2xl border border-red-100 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-red-700 uppercase tracking-wide">Salida Vacíos</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.totalSalidas} <span className="text-sm font-semibold text-slate-500">balones</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                EsSalud: <span className="font-bold text-slate-700">{metrics.sv?.essalud || 0}</span> · Linde: <span className="font-bold text-slate-700">{metrics.sv?.linde || 0}</span>
              </p>
            </div>
            <div className="p-2.5 bg-red-500/10 text-red-600 rounded-xl">
              <MdLocalShipping className="text-2xl" />
            </div>
          </div>

          {/* Card 3: Rechazados / No Aceptados */}
          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50/40 rounded-2xl border border-purple-100 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">Rechazados / Dañados</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.totalRechazos} <span className="text-sm font-semibold text-slate-500">balones</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Balones observados devueltos
              </p>
            </div>
            <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl">
              <MdWarningAmber className="text-2xl" />
            </div>
          </div>

          {/* Card 4: Días Operativos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Días de Despacho</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.daysWithMovement} <span className="text-sm font-semibold text-slate-400">/ {metrics.totalDays}</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <MdCheckCircle className="text-emerald-500 text-sm" />
                Días con ingresos o salidas
              </p>
            </div>
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
              <MdCalendarMonth className="text-2xl" />
            </div>
          </div>

        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL: TABLA RESPONSIVA ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando datos de ingresos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 font-bold">{error}</div>
        ) : (
          <div className="p-3 sm:p-5">

            {/* Hint táctil para deslizar en móviles */}
            <div className="flex lg:hidden items-center justify-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200/60 mb-3">
              <MdOutlineSwipe className="text-base text-green-600" />
              <span>Desliza la tabla hacia la derecha para ver las columnas de vacíos y totales</span>
            </div>

            {/* Referencia exportable a Excel */}
            <div ref={reportRef}>
              
              {/* Encabezado formal */}
              <div className="text-center mb-4 sm:mb-5">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">EsSalud — Central de Oxígeno</p>
                <h1 className="text-base sm:text-lg font-black text-slate-800 uppercase mt-0.5">
                  Control de Ingresos Mensuales de Cilindros
                </h1>
                <h2 className="text-xs sm:text-base font-bold text-slate-600">{monthLabel(selectedMonth)}</h2>
              </div>

              {/* Leyenda de grupos */}
              <div className="flex gap-3 sm:gap-4 flex-wrap justify-center mb-3 sm:mb-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded-sm border border-blue-400"/><span className="text-slate-600">Ingreso Lleno</span></span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded-sm border border-red-400"/><span className="text-slate-600">Salida Vacío</span></span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-200 rounded-sm border border-purple-400"/><span className="text-slate-600">Rechazados</span></span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 rounded-sm border border-emerald-400"/><span className="text-slate-600">Totales</span></span>
              </div>

              {/* ── TABLA COMPLETA CON SCROLL HORIZONTAL Y COLUMNAS FIJAS ── */}
              <div className="overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-[9px] sm:text-[10px] border-collapse border border-black min-w-[1000px]">
                  <thead>
                    {/* Fila 1: Grupos Principales */}
                    <tr>
                      <th rowSpan="2" className={thBase + ' w-20 sticky left-0 bg-slate-100 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.06)]'}>
                        FECHA
                      </th>
                      <th rowSpan="2" className={thBase + ' w-24 sticky left-[65px] sm:left-[72px] bg-slate-100 z-20 shadow-[2px_0_3px_rgba(0,0,0,0.06)]'}>
                        DIST/PROV
                      </th>

                      {/* INGRESO LLENO */}
                      <th colSpan="5" className="border border-black py-1 font-black bg-blue-200 text-blue-900 text-[10px] sm:text-[11px] uppercase tracking-wide text-center">
                        INGRESO LLENO
                      </th>

                      {/* SALIDA VACÍO */}
                      <th colSpan="4" className="border border-black py-1 font-black bg-red-200 text-red-900 text-[10px] sm:text-[11px] uppercase tracking-wide text-center">
                        SALIDA VACÍO
                      </th>

                      {/* RECHAZADOS */}
                      <th colSpan="2" className="border border-black py-1 font-black bg-purple-200 text-purple-900 text-[10px] sm:text-[11px] uppercase tracking-wide text-center">
                        INGRESO VACÍOS (RECHAZADOS)
                      </th>

                      {/* TOTALES */}
                      <th rowSpan="2" className={thTotal}>TOTAL<br/>INGRESO</th>
                      <th rowSpan="2" className={thTotal}>TOTAL<br/>SALIDA</th>
                      <th rowSpan="2" className={thTotal}>TOTAL<br/>RECHAZO</th>
                      <th rowSpan="2" className={thBase + ' w-32'}>OBSERVACIÓN</th>
                    </tr>

                    {/* Fila 2: Sub-columnas */}
                    <tr>
                      {/* Llenos */}
                      <th className={thLleno}>ESSALUD<br/>8m³</th>
                      <th className={thLleno}>ESSALUD<br/>6m³</th>
                      <th className={thLleno}>ESSALUD<br/>10m³</th>
                      <th className={thLleno}>PERIFERIE<br/>10m³</th>
                      <th className={thLleno}>LINDE<br/>10m³</th>

                      {/* Vacíos */}
                      <th className={thVacio}>OM2<br/>ESSALUD</th>
                      <th className={thVacio}>OM2<br/>LINDE</th>
                      <th className={thVacio}>OM2<br/>PERIFERIE</th>
                      <th className={thVacio}>TOTAL<br/>OM2</th>

                      {/* Rechazados */}
                      <th className={thRechaz}>MALOGRADOS</th>
                      <th className={thRechaz}>NO ACEPT.</th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedEntries.map((row, i) => {
                      const isTotal = row.is_total;
                      const hasMovement = row.total_ingreso_cilindros > 0 || row.total_salida_cilindros > 0;
                      const isNoMovement = !hasMovement && !isTotal;

                      const il = row.ingreso_lleno  ?? {};
                      const sv = row.salida_vacio   ?? {};
                      const rc = row.rechazados     ?? {};
                      const totalOm2 = (sv.essalud ?? 0) + (sv.linde ?? 0) + (sv.periferie ?? 0);

                      const cellGreen = (v) => v ? (
                        <span className="font-bold text-green-700">{v}</span>
                      ) : '';
                      const cellRed = (v) => v ? (
                        <span className="font-bold text-red-600">{v}</span>
                      ) : '';

                      if (isTotal) {
                        return (
                          <tr key={i} className="bg-slate-800 text-white font-black text-[10px] sm:text-[11px]">
                            <td className="border border-black px-2 py-1.5 font-bold sticky left-0 bg-slate-800 z-20 whitespace-nowrap">
                              {row.fecha}
                            </td>
                            <td className="border border-black px-2 py-1.5 sticky left-[65px] sm:left-[72px] bg-slate-800 z-20 whitespace-nowrap">
                              {row.dist_prov}
                            </td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(il.essalud_8)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(il.essalud_6)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(il.essalud_10)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(il.periferie_10)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(il.linde_10)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(sv.essalud)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(sv.linde)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(sv.periferie)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(totalOm2)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(rc.malogrados)}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{fmtN(rc.no_aceptados)}</td>
                            <td className="border border-black px-2 py-1.5 text-center bg-emerald-900 text-white font-bold">{fmtN(row.total_ingreso_cilindros)}</td>
                            <td className="border border-black px-2 py-1.5 text-center bg-red-900 text-white font-bold">{fmtN(row.total_salida_cilindros)}</td>
                            <td className="border border-black px-2 py-1.5 text-center bg-purple-900 text-white font-bold">{fmtN(row.total_no_aceptados)}</td>
                            <td className="border border-black px-2 py-1.5"></td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={i}
                          className={`transition-colors ${
                            hasMovement
                              ? 'hover:bg-slate-100/60'
                              : 'bg-slate-50/40'
                          }`}
                        >
                          <td className="border border-black px-2 py-1 font-bold text-slate-700 text-left sticky left-0 bg-white z-10 whitespace-nowrap shadow-[1px_0_3px_rgba(0,0,0,0.06)]">
                            {row.fecha}
                          </td>
                          <td className="border border-black px-2 py-1 text-slate-600 text-left sticky left-[65px] sm:left-[72px] bg-white z-10 whitespace-nowrap shadow-[2px_0_3px_rgba(0,0,0,0.06)]">
                            {row.dist_prov}
                          </td>

                          {/* INGRESO LLENO */}
                          <td className="border border-black px-2 py-1 text-center bg-blue-50/20">{cellGreen(fmtN(il.essalud_8))}</td>
                          <td className="border border-black px-2 py-1 text-center bg-blue-50/20">{cellGreen(fmtN(il.essalud_6))}</td>
                          <td className="border border-black px-2 py-1 text-center bg-blue-50/20">{cellGreen(fmtN(il.essalud_10))}</td>
                          <td className="border border-black px-2 py-1 text-center bg-blue-50/20">{cellGreen(fmtN(il.periferie_10))}</td>
                          <td className="border border-black px-2 py-1 text-center bg-blue-50/20">{cellGreen(fmtN(il.linde_10))}</td>

                          {/* SALIDA VACÍO */}
                          <td className="border border-black px-2 py-1 text-center bg-red-50/20">{cellRed(fmtN(sv.essalud))}</td>
                          <td className="border border-black px-2 py-1 text-center bg-red-50/20">{cellRed(fmtN(sv.linde))}</td>
                          <td className="border border-black px-2 py-1 text-center bg-red-50/20">{cellRed(fmtN(sv.periferie))}</td>
                          <td className="border border-black px-2 py-1 text-center bg-red-50/30 font-bold text-red-700">{fmtN(totalOm2) || ''}</td>

                          {/* RECHAZADOS */}
                          <td className="border border-black px-2 py-1 text-center bg-purple-50/20">{fmtN(rc.malogrados) || ''}</td>
                          <td className="border border-black px-2 py-1 text-center bg-purple-50/20">{fmtN(rc.no_aceptados) || ''}</td>

                          {/* TOTALES */}
                          <td className="border border-black px-2 py-1 text-center font-bold text-green-700 bg-emerald-50/40">{fmtN(row.total_ingreso_cilindros) || ''}</td>
                          <td className="border border-black px-2 py-1 text-center font-bold text-red-600 bg-red-50/30">{fmtN(row.total_salida_cilindros) || ''}</td>
                          <td className="border border-black px-2 py-1 text-center font-bold text-purple-700 bg-purple-50/20">{fmtN(row.total_no_aceptados) || ''}</td>

                          {/* OBSERVACIÓN */}
                          <td className={`border border-black px-2 py-1 text-left text-[9px] ${
                            isNoMovement ? 'text-slate-400 italic' : 'text-slate-600'
                          }`}>
                            {row.observacion}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default MonthlyEntriesReport;
