import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { exportExecutiveConsumptionReport } from '../utils/excelExportService';
import { MdSave, MdRefresh, MdFileDownload, MdPrint, MdCheckCircle, MdErrorOutline } from 'react-icons/md';

function ExecutiveConsumptionReport() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return `${yyyy}-${mm}-${dd}`;
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/reports/executive-consumption?date=${date}`);
      setReportData(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el reporte gerencial.');
    } finally {
      setLoading(false);
    }
  };

  const reportRef = useRef(null);

  useEffect(() => {
    fetchReport();
  }, [date]);

  const handleExportExcel = async () => {
    if (!reportData) return;
    try {
      const dateText = date.split('-').reverse().join('/');
      await exportExecutiveConsumptionReport(reportData, dateText);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Hubo un error al generar el archivo Excel.');
    }
  };

  if (loading && !reportData) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-gray-500 font-medium text-sm">Cargando reporte ejecutivo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-50 rounded-xl font-bold m-6 border border-red-200">
        {error}
      </div>
    );
  }

  const liquid = reportData ? reportData.liquido : null;

  return (
    <div className="p-4 md:p-6 pb-20 max-w-[1400px] mx-auto bg-gray-50 min-h-screen">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .report-container { box-shadow: none !important; border: none !important; }
          @page { size: A4 landscape; margin: 8mm; }
        }
        .report-container { width: 100%; padding: 1.5rem; border-radius: 4px; }
        .report-header { display: flex; align-items: stretch; border: 2.5px solid #000; margin-bottom: 1.5rem; }
        .logo-box { width: 140px; border-right: 2px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; }
        .title-box { flex: 1; display: flex; align-items: center; justify-content: center; }
        .title-box h2 { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #111; text-transform: uppercase; margin: 0; }
        .date-box { width: 140px; border-left: 2px solid #000; display: flex; flex-direction: column; }
        .date-title { border-bottom: 2px solid #000; text-align: center; font-weight: bold; padding: 4px; background-color: #f8f9fa; font-size: 13px; }
        .date-value { flex: 1; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
        .report-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media(min-width: 1024px) { .report-grid { grid-template-columns: 1fr 1fr; gap: 1.5rem; } }
        .section-main-title { border: 2.5px solid #000; text-align: center; font-weight: 900; font-size: 16px; padding: 8px; letter-spacing: 1px; background-color: #f8f9fa; margin-bottom: 14px; }
        .data-table-container { width: 100%; }
        .table-title { background-color: #b33979; color: white; text-align: center; font-weight: bold; padding: 5px; font-size: 13px; letter-spacing: 0.5px; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 2px solid #b33979; padding: 6px; text-align: center; font-weight: bold; color: #111; }
        .data-table td { border: 1px solid #e5e7eb; padding: 5px 6px; text-align: center; color: #333; }
        .data-table td.text-left { text-align: left; }
        .double-border-bottom { border-bottom: 3px double #b33979; }
      `}</style>

      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Reporte Ejecutivo de Consumo</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Consolidado general de Oxígeno Gaseoso y Líquido (Corte 07:00 AM)</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-slate-300 rounded-xl shadow-sm px-3.5 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          
          <button
            onClick={fetchReport}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors"
            title="Refrescar datos"
          >
            <MdRefresh className="text-lg" /> Refrescar
          </button>

          <button
            onClick={handleExportExcel}
            disabled={!reportData}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <MdFileDownload className="text-lg" /> Excel
          </button>

          <button
            onClick={() => window.print()}
            disabled={!reportData}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <MdPrint className="text-lg" /> Imprimir
          </button>
        </div>
      </div>



      {reportData && (
        <div className="report-container bg-white shadow-xl border border-gray-200" id="printable-report" ref={reportRef}>
          {/* Header Row */}
          <div className="report-header">
            <div className="logo-box">
              <div className="h-10 w-10 rounded-full border-2 border-orange-600 flex items-center justify-center text-orange-600 font-bold text-lg">
                G
              </div>
              <span className="text-[9px] uppercase mt-1 font-bold">Gestión Logística</span>
            </div>
            <div className="title-box">
              <h2>REPORTE DE CONSUMO DE OXIGENO</h2>
            </div>
            <div className="date-box">
              <div className="date-title">FECHA</div>
              <div className="date-value">{date.split('-').reverse().join('/')}</div>
            </div>
          </div>

          <div className="report-grid">
            
            {/* COLUMNA 1: GASEOSO */}
            <div className="column-gas">
              <h3 className="section-main-title">OXIGENO GASEOSO</h3>

              {/* Saldo Inicial */}
              <div className="data-table-container">
                <h4 className="table-title">SALDO INICIAL</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-left w-32">CAPACIDAD</th>
                      <th>10 M3</th>
                      <th>8 M3</th>
                      <th>6 M3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">TOTAL UND</td>
                      <td className="font-bold">{reportData.gaseoso.saldo_inicial['10']}</td>
                      <td className="font-bold">{reportData.gaseoso.saldo_inicial['8']}</td>
                      <td className="font-bold">{reportData.gaseoso.saldo_inicial['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50">TOTAL M3</td>
                      <td colSpan="3" className="text-center font-bold text-sm text-indigo-900">{reportData.gaseoso.saldo_inicial.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Consumo */}
              <div className="data-table-container mt-4">
                <h4 className="table-title">CONSUMO DE OXIGENO GASEOSO</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-left w-32">CAPACIDAD</th>
                      <th>10 M3</th>
                      <th>8 M3</th>
                      <th>6 M3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">PADOMI</td>
                      <td>{reportData.gaseoso.consumo.padomi['10']}</td>
                      <td>{reportData.gaseoso.consumo.padomi['8']}</td>
                      <td>{reportData.gaseoso.consumo.padomi['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">HNAGV</td>
                      <td>{reportData.gaseoso.consumo.hnagv['10']}</td>
                      <td>{reportData.gaseoso.consumo.hnagv['8']}</td>
                      <td>{reportData.gaseoso.consumo.hnagv['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">CCAA PERIFERIC</td>
                      <td>{reportData.gaseoso.consumo.perifericos['10']}</td>
                      <td>{reportData.gaseoso.consumo.perifericos['8']}</td>
                      <td>{reportData.gaseoso.consumo.perifericos['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50 text-indigo-900 border-t-2 border-indigo-200">TOTAL UND</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.consumo.total_und['10']}</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.consumo.total_und['8']}</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.consumo.total_und['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50">TOTAL M3</td>
                      <td colSpan="3" className="text-center font-bold text-sm text-red-600">{reportData.gaseoso.consumo.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ingreso */}
              <div className="data-table-container mt-4">
                <h4 className="table-title">INGRESO DE CILINDROS DE OXIGENO</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-left w-32">CAPACIDAD</th>
                      <th>10 M3</th>
                      <th>8 M3</th>
                      <th>6 M3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">TOTAL UND</td>
                      <td className="font-bold">{reportData.gaseoso.ingreso['10']}</td>
                      <td className="font-bold">{reportData.gaseoso.ingreso['8']}</td>
                      <td className="font-bold">{reportData.gaseoso.ingreso['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50">TOTAL M3</td>
                      <td colSpan="3" className="text-center font-bold text-sm text-emerald-700">{reportData.gaseoso.ingreso.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Reserva Llenos */}
              <div className="data-table-container mt-4">
                <h4 className="table-title">RESERVA DE CILINDROS DE OXIGENO</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-left w-32">CAPACIDAD</th>
                      <th>10 M3</th>
                      <th>8 M3</th>
                      <th>6 M3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">CENTRAL</td>
                      <td>{reportData.gaseoso.reserva_llenos.central['10']}</td>
                      <td>{reportData.gaseoso.reserva_llenos.central['8']}</td>
                      <td>{reportData.gaseoso.reserva_llenos.central['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">ALMACEN</td>
                      <td>{reportData.gaseoso.reserva_llenos.almacen['10']}</td>
                      <td>{reportData.gaseoso.reserva_llenos.almacen['8']}</td>
                      <td>{reportData.gaseoso.reserva_llenos.almacen['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50 border-t-2 border-indigo-200">TOTAL UND</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.reserva_llenos.total_und['10']}</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.reserva_llenos.total_und['8']}</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.reserva_llenos.total_und['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50">TOTAL M3</td>
                      <td className="text-center font-bold text-sm text-blue-700">{reportData.gaseoso.reserva_llenos.total_m3}</td>
                      <td className="text-right font-bold bg-gray-50 text-[10px] leading-tight">PROYEC. DIAS</td>
                      <td className="text-center font-bold text-sm text-indigo-900 bg-yellow-50">
                        {parseFloat(reportData.gaseoso.consumo.total_m3) > 0 
                          ? (parseFloat(reportData.gaseoso.reserva_llenos.total_m3) / parseFloat(reportData.gaseoso.consumo.total_m3)).toFixed(2) 
                          : 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Balance General */}
              <div className="data-table-container mt-4">
                <h4 className="table-title bg-indigo-900 text-white">BALANCE GENERAL</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SALDO INICIAL</th>
                      <th>CONSUMO</th>
                      <th>INGRESO</th>
                      <th>SALDO FINAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="double-border-bottom bg-indigo-50/50">
                      <td className="font-bold text-base text-indigo-900">{reportData.gaseoso.saldo_inicial.total_m3}</td>
                      <td className="font-bold text-base text-red-600">{reportData.gaseoso.consumo.total_m3}</td>
                      <td className="font-bold text-base text-green-600">{reportData.gaseoso.ingreso.total_m3}</td>
                      <td className="font-bold text-base text-blue-700">{reportData.gaseoso.reserva_llenos.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Reserva Vacíos */}
              <div className="data-table-container mt-4">
                <h4 className="table-title">RESERVA DE CILINDROS VACIOS DE OXIGENO</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-left w-32">CAPACIDAD</th>
                      <th>10 M3</th>
                      <th>8 M3</th>
                      <th>6 M3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">LINDE</td>
                      <td>{reportData.gaseoso.reserva_vacios.linde['10']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.linde['8']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.linde['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">ESSALUD</td>
                      <td>{reportData.gaseoso.reserva_vacios.essalud['10']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.essalud['8']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.essalud['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">PERIFERIA</td>
                      <td>{reportData.gaseoso.reserva_vacios.periferia['10']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.periferia['8']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.periferia['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">MANTENIMIENTO</td>
                      <td>{reportData.gaseoso.reserva_vacios.mantenimiento['10']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.mantenimiento['8']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.mantenimiento['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">DESCONOCIDOS</td>
                      <td>{reportData.gaseoso.reserva_vacios.desconocidos['10']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.desconocidos['8']}</td>
                      <td>{reportData.gaseoso.reserva_vacios.desconocidos['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50 text-indigo-900 border-t-2 border-indigo-200">TOTAL UND</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.reserva_vacios.total_und['10']}</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.reserva_vacios.total_und['8']}</td>
                      <td className="border-t-2 border-indigo-200 font-bold">{reportData.gaseoso.reserva_vacios.total_und['6']}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* COLUMNA 2: LÍQUIDO */}
            <div className="column-liquid relative">
              <h3 className="section-main-title">OXIGENO LIQUIDO</h3>

              {liquid && (
                <>
                  {/* Saldo Inicial Líquido */}
                  <div className="data-table-container">
                    <h4 className="table-title">SALDO INICIAL</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>LECTURA ANTERIOR</th>
                          <th>LECTURA ACTUAL</th>
                          <th>SALDO INICIAL M3</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="double-border-bottom">
                          <td className="font-semibold">{liquid.saldo_inicial.lectura_anterior}</td>
                          <td className="font-semibold">{liquid.saldo_inicial.lectura_actual}</td>
                          <td className="font-bold text-sm text-indigo-900">{liquid.saldo_inicial.saldo_inicial_m3}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Consumo Líquido */}
                  <div className="data-table-container mt-4">
                    <h4 className="table-title">CONSUMO DE OXIGENO LIQUIDO</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>LECTURA ANTERIOR</th>
                          <th>LECTURA ACTUAL</th>
                          <th>CONSUMO DE OXIGENO LIQUIDO M3</th>
                          <th>CONSUMO / HORA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="double-border-bottom">
                          <td className="font-semibold">{liquid.consumo.lectura_anterior}</td>
                          <td className="font-semibold">{liquid.consumo.lectura_actual}</td>
                          <td className="font-bold text-sm text-red-600">{liquid.consumo.consumo_m3}</td>
                          <td className="font-mono text-xs">{liquid.consumo.consumo_hora}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Ingreso Líquido */}
                  <div className="data-table-container mt-4">
                    <h4 className="table-title">INGRESO DE OXIGENO LIQUIDO</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>INICIAL</th>
                          <th>FINAL</th>
                          <th>DIFERENCIA</th>
                          <th>RECARGADO M3</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="double-border-bottom">
                          <td className="font-semibold">{liquid.ingreso.inicial}</td>
                          <td className="font-semibold">{liquid.ingreso.final}</td>
                          <td className="font-bold">{liquid.ingreso.diferencia}</td>
                          <td className="font-bold text-sm text-emerald-700">{liquid.ingreso.recargado_m3}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Reserva Líquido */}
                  <div className="data-table-container mt-4">
                    <h4 className="table-title">RESERVA DE OXIGENO LIQUIDO</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>NIVEL ANTERIOR</th>
                          <th>NIVEL ACTUAL</th>
                          <th>RESERVA DE OXIGENO LIQUIDO M3</th>
                          <th>PROYECCION DE CONSUMO (DIAS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="double-border-bottom">
                          <td className="font-semibold">{liquid.reserva.nivel_anterior}</td>
                          <td className="font-semibold">{liquid.reserva.nivel_actual}</td>
                          <td className="font-bold text-sm text-blue-700">{liquid.reserva.reserva_m3}</td>
                          <td className="font-bold text-sm text-indigo-900">{liquid.reserva.proyeccion_dias}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutiveConsumptionReport;
