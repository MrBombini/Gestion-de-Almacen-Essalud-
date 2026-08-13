import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

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

  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const header = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; }
          th, td { border: 1px solid #000; padding: 4px; text-align: center; vertical-align: middle; }
          .section-main-title { border: 2px solid #000; font-size: 14px; font-weight: bold; background-color: #f8f9fa; }
          .table-title { background-color: #b33979; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
    `;
    const sourceHTML = header + reportRef.current.innerHTML + "</body></html>";
    const source = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Reporte_Ejecutivo_Consumo_${date}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  if (loading && !reportData) {
    return <div className="p-6 text-center text-gray-500">Cargando reporte...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 pb-20 max-w-[1400px] mx-auto bg-gray-50 min-h-screen">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .report-container { box-shadow: none !important; border: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
        .report-container { width: 100%; padding: 2rem; border-radius: 4px; }
        .report-header { display: flex; align-items: stretch; border: 3px solid #000; margin-bottom: 2rem; }
        .logo-box { width: 150px; border-right: 2px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; }
        .title-box { flex: 1; display: flex; align-items: center; justify-content: center; }
        .title-box h2 { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #111; text-transform: uppercase; }
        .date-box { width: 150px; border-left: 2px solid #000; display: flex; flex-direction: column; }
        .date-title { border-bottom: 2px solid #000; text-align: center; font-weight: bold; padding: 5px; background-color: #f8f9fa; font-size: 14px; }
        .date-value { flex: 1; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
        .report-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
        @media(min-width: 1024px) { .report-grid { grid-template-columns: 1fr 1fr; gap: 0; } }
        .section-main-title { border: 3px solid #000; text-align: center; font-weight: 900; font-size: 18px; padding: 10px; letter-spacing: 1px; background-color: #f8f9fa; margin-bottom: 20px; }
        .data-table-container { width: 100%; }
        .table-title { background-color: #b33979; color: white; text-align: center; font-weight: bold; padding: 6px; font-size: 15px; letter-spacing: 1px; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table th { border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 2px solid #b33979; padding: 8px; text-align: center; font-weight: bold; color: #111; }
        .data-table td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: center; color: #333; }
        .data-table td.text-left { text-align: left; }
        .double-border-bottom { border-bottom: 4px double #b33979; }
        .bg-yellow-100 { background-color: #fef08a !important; }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reporte Ejecutivo de Consumo</h1>
          <p className="text-gray-500 text-sm">Consolidado general de Oxígeno Gaseoso y Líquido</p>
        </div>
        <div className="flex gap-3 items-center mt-4 md:mt-0">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={fetchReport}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition"
          >
            Refrescar
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!reportData}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
          <button
            onClick={() => window.print()}
            disabled={!reportData}
            className="bg-gray-800 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Imprimir
          </button>
        </div>
      </div>

      {reportData && (
        <div className="report-container bg-white shadow-xl border border-gray-200" id="printable-report" ref={reportRef}>
          {/* Header Row */}
          <div className="report-header">
            <div className="logo-box">
              <div className="h-12 w-12 rounded-full border-2 border-orange-600 flex items-center justify-center text-orange-600 font-bold text-xl">
                G
              </div>
              <span className="text-[10px] uppercase mt-1 font-bold">Gestión Logística</span>
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
            {/* COLUMN 1: GASEOSO */}
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
                      <td>{reportData.gaseoso.saldo_inicial['10']}</td>
                      <td>{reportData.gaseoso.saldo_inicial['8']}</td>
                      <td>{reportData.gaseoso.saldo_inicial['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50">TOTAL M3</td>
                      <td colSpan="3" className="text-center font-bold">{reportData.gaseoso.saldo_inicial.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Consumo */}
              <div className="data-table-container mt-6">
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
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.consumo.total_und['10']}</td>
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.consumo.total_und['8']}</td>
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.consumo.total_und['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50">TOTAL M3</td>
                      <td colSpan="3" className="text-center font-bold text-lg">{reportData.gaseoso.consumo.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ingreso */}
              <div className="data-table-container mt-6">
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
                      <td>{reportData.gaseoso.ingreso['10']}</td>
                      <td>{reportData.gaseoso.ingreso['8']}</td>
                      <td>{reportData.gaseoso.ingreso['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50">TOTAL M3</td>
                      <td colSpan="3" className="text-center font-bold text-lg">{reportData.gaseoso.ingreso.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Reserva Llenos */}
              <div className="data-table-container mt-6">
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
                      <td className="text-left font-bold bg-gray-50">PLANTA</td>
                      <td>{reportData.gaseoso.reserva_llenos.planta['10']}</td>
                      <td>{reportData.gaseoso.reserva_llenos.planta['8']}</td>
                      <td>{reportData.gaseoso.reserva_llenos.planta['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50">ALMACEN</td>
                      <td>{reportData.gaseoso.reserva_llenos.almacen['10']}</td>
                      <td>{reportData.gaseoso.reserva_llenos.almacen['8']}</td>
                      <td>{reportData.gaseoso.reserva_llenos.almacen['6']}</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold bg-gray-50 border-t-2 border-indigo-200">TOTAL UND</td>
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.reserva_llenos.total_und['10']}</td>
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.reserva_llenos.total_und['8']}</td>
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.reserva_llenos.total_und['6']}</td>
                    </tr>
                    <tr className="double-border-bottom">
                      <td className="text-left font-bold bg-gray-50">TOTAL M3</td>
                      <td colSpan="3" className="text-center font-bold text-lg">{reportData.gaseoso.reserva_llenos.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Balance General */}
              <div className="data-table-container mt-6">
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
                    <tr className="double-border-bottom bg-indigo-50">
                      <td className="font-bold text-lg text-indigo-900">{reportData.gaseoso.saldo_inicial.total_m3}</td>
                      <td className="font-bold text-lg text-red-600">{reportData.gaseoso.consumo.total_m3}</td>
                      <td className="font-bold text-lg text-green-600">{reportData.gaseoso.ingreso.total_m3}</td>
                      <td className="font-bold text-lg text-blue-700">{reportData.gaseoso.reserva_llenos.total_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Reserva Vacios */}
              <div className="data-table-container mt-6">
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
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.reserva_vacios.total_und['10']}</td>
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.reserva_vacios.total_und['8']}</td>
                      <td className="border-t-2 border-indigo-200">{reportData.gaseoso.reserva_vacios.total_und['6']}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* COLUMN 2: LIQUIDO */}
            <div className="column-liquid relative pl-0 md:pl-6">
              {/* Divider in desktop */}
              <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>

              <h3 className="section-main-title">OXIGENO LIQUIDO</h3>

              {/* Saldo Inicial Liquido */}
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
                      <td>{reportData.liquido.saldo_inicial.lectura_anterior}</td>
                      <td className="bg-yellow-100 font-bold">{reportData.liquido.saldo_inicial.lectura_actual}</td>
                      <td className="font-bold">{reportData.liquido.saldo_inicial.saldo_inicial_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Consumo Liquido */}
              <div className="data-table-container mt-6">
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
                      <td className="bg-yellow-100 font-bold">{reportData.liquido.consumo.lectura_anterior}</td>
                      <td className="bg-yellow-100 font-bold">{reportData.liquido.consumo.lectura_actual}</td>
                      <td className="font-bold">{reportData.liquido.consumo.consumo_m3}</td>
                      <td>{reportData.liquido.consumo.consumo_hora}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ingreso Liquido */}
              <div className="data-table-container mt-6">
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
                      <td>{reportData.liquido.ingreso.inicial || ''}</td>
                      <td>{reportData.liquido.ingreso.final || ''}</td>
                      <td>{reportData.liquido.ingreso.diferencia}</td>
                      <td className="font-bold text-green-700">{reportData.liquido.ingreso.recargado_m3}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Reserva Liquido */}
              <div className="data-table-container mt-6">
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
                      <td>{reportData.liquido.reserva.nivel_anterior}</td>
                      <td className="bg-yellow-100 font-bold">{reportData.liquido.reserva.nivel_actual}</td>
                      <td className="font-bold text-blue-700">{reportData.liquido.reserva.reserva_m3}</td>
                      <td className="font-bold">{reportData.liquido.reserva.proyeccion_dias}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutiveConsumptionReport;
