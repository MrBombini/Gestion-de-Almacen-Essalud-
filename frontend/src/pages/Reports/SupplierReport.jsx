import { useState, useRef } from 'react';
import { MdPrint, MdDownload, MdSearch, MdLocalShipping } from 'react-icons/md';
import useFetch from '../../hooks/useFetch';

const SupplierReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchUrl, setSearchUrl] = useState('/reports/kardex?per_page=all');

  // 1. Traemos el historial del Kardex
  const { data: kardexData, loading, error } = useFetch(searchUrl);
  const kardexList = Array.isArray(kardexData) ? kardexData : (kardexData?.data || []);

  const handleFetchDates = () => {
    const params = new URLSearchParams();
    params.append('per_page', 'all');
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    setSearchUrl(`/reports/kardex?${params.toString()}`);
  };

  // 2. Filtramos SOLO los movimientos de proveedores (SupplierMovement)
  const supplierMovements = kardexList.filter(mov => mov.type === 'SupplierMovement');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const reportRef = useRef(null);

  // Filtramos la lista de la izquierda
  const filteredMovements = supplierMovements.filter(mov => 
    mov.id.toString().includes(searchTerm) || 
    mov.reference_document?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // EXTRACCIÓN Y CÁLCULO DE DATOS DEL REPORTE
  // ==========================================
  const operatorName = selectedReport?.user?.name || '-';
  const rawDate = selectedReport?.movement_at ? new Date(selectedReport.movement_at) : new Date();
  // Formato m/d/yyyy
  const reportDate = `${rawDate.getMonth() + 1}/${rawDate.getDate()}/${rawDate.getFullYear()}`;

  // Separamos los cilindros que salieron (Vacíos) y los que entraron (Llenos)
  const cylinderMovements = selectedReport?.cylinder_movements || [];
  
  const salidas = cylinderMovements
    .filter(m => m.action === 'Exit')
    .map(m => ({
      brand: m.cylinder?.supplier?.name || 'Desconocido',
      code: m.cylinder?.serial_number || 'N/A',
      capacity: 0
    }));

  const ingresos = cylinderMovements
    .filter(m => m.action === 'Entry')
    .map(m => ({
      brand: m.cylinder?.supplier?.name || 'Desconocido',
      code: m.cylinder?.serial_number || 'N/A',
      capacity: parseFloat(m.cylinder?.capacity) || 0 // Los llenos sí suman m3
    }));

  // Para dibujar la tabla simétrica, necesitamos saber qué lado tiene más filas
  const maxRows = Math.max(salidas.length, ingresos.length);
  const rowsArray = Array.from({ length: maxRows });

  const totalIngresosM3 = ingresos.reduce((sum, item) => sum + item.capacity, 0);

  // ==========================================
  // FUNCIÓN 1: IMPRIMIR (Formato A4 Horizontal)
  // ==========================================
  const handlePrint = () => {
    if (!reportRef.current) return;
    const printContent = reportRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=1000,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte Ingreso y Salida</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; color: #000; }
            .report-title { text-align: center; color: #2e7d32; font-weight: bold; font-size: 20px; margin: 0; }
            .report-subtitle { text-align: center; color: #43a047; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th, td { border: 1px solid #000; padding: 4px 6px; }
            .bold { font-weight: bold; }
            .no-border-bottom { border-bottom: none; }
            .signatures { margin-top: 50px; width: 100%; text-align: center; }
            .sign-box { border-top: 1px solid #000; width: 60%; margin: 0 auto; padding-top: 5px; text-align: left;}
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // ==========================================
  // FUNCIÓN 2: EXPORTAR A EXCEL (.xls)
  // ==========================================
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const header = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        </head>
      <body>
    `;
    const footer = "</body></html>";
    const sourceHTML = header + reportRef.current.innerHTML + footer;
    
    const source = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Reporte_Proveedor_${selectedReport.id}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="space-y-6">
      
      {/* Cabecera Principal */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
          <MdLocalShipping className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reportes de Proveedor</h2>
          <p className="text-slate-500 text-sm mt-1">
            Generación de hojas de ingreso y salida de cilindros para impresión y auditoría.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* COLUMNA IZQUIERDA: Buscador y Lista de Reportes */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500 transition-shadow">
              <MdSearch className="text-slate-400 text-xl" />
              <input 
                type="text" 
                placeholder="Buscar Guía o ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
              />
            </div>
            <div className="flex gap-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500" 
                title="Fecha Desde" 
              />
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500" 
                title="Fecha Hasta" 
              />
              <button 
                onClick={handleFetchDates} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                title="Filtrar por Fechas"
              >
                <MdSearch className="text-lg" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {loading && <div className="text-center p-4 text-slate-500">Cargando movimientos...</div>}
            {error && <div className="text-center p-4 text-red-500">{error}</div>}
            {!loading && filteredMovements.map(mov => (
              <button
                key={mov.id}
                onClick={() => setSelectedReport(mov)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedReport?.id === mov.id 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-white border-slate-100 hover:border-emerald-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800">Op. #{mov.id}</span>
                  <span className="text-xs font-semibold text-slate-500">{new Date(mov.movement_at).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="text-sm text-slate-600 line-clamp-1 font-medium">Guía: {mov.reference_document || 'S/N'}</div>
              </button>
            ))}
            {!loading && filteredMovements.length === 0 && (
              <div className="text-center p-4 text-slate-400 text-sm">No se encontraron registros de proveedor.</div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Visualizador del Reporte Excel */}
        <div className="xl:col-span-3 bg-slate-100 rounded-2xl border border-slate-200 p-4 lg:p-8 flex flex-col items-center min-h-[700px] overflow-x-auto relative">
          
          {!selectedReport ? (
            <div className="text-slate-400 text-center my-auto">
              <MdLocalShipping className="text-6xl mx-auto mb-4 opacity-50" />
              <p>Selecciona una operación con proveedor para ver el formato.</p>
            </div>
          ) : (
            <>
              {/* Botonera de Acción */}
              <div className="w-full max-w-5xl flex justify-end gap-3 mb-4">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                  <MdPrint className="text-lg" /> Imprimir (A4)
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                  <MdDownload className="text-lg" /> Exportar Excel
                </button>
              </div>

              {/* REPORTE FÍSICO (Idéntico a tu captura de pantalla de Excel) */}
              <div className="bg-white p-8 rounded-sm shadow-xl w-full max-w-5xl border border-slate-200" style={{ minWidth: '800px' }}>
                <div ref={reportRef} className="text-black font-sans text-xs">
                  
                  {/* Encabezados Principales */}
                  <h1 className="text-center text-green-700 font-bold text-2xl uppercase m-0">GLAES SAC</h1>
                  <h2 className="text-center text-green-600 font-bold text-xl mb-4 uppercase m-0">INGRESO Y SALIDA DE CILINDROS</h2>

                  <table className="w-full border-collapse border border-black table-fixed text-xs">
                    <thead>
                      <tr>
                        <th colSpan="4" className="border border-black p-1 text-center font-bold bg-white w-1/2">SALIDA<br/>CILINDROS</th>
                        <th colSpan="4" className="border border-black p-1 text-center font-bold bg-white w-1/2">INGRESO<br/>CILINDROS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fila separadora blanca */}
                      <tr><td colSpan="8" className="h-4 border-none border-x border-black"></td></tr>
                      
                      {/* Datos de Cabecera Izquierda / Derecha */}
                      <tr>
                        <td className="border-none border-l border-black p-1">CONDICION</td>
                        <td colSpan="3" className="border-none border-r border-black p-1">SALIDA</td>
                        <td className="border-none p-1">CONDICION</td>
                        <td colSpan="3" className="border-none border-r border-black p-1">INGRESO</td>
                      </tr>
                      <tr>
                        <td className="border-none border-l border-black p-1">OPERARIO ATENCION</td>
                        <td colSpan="3" className="border-none border-r border-black p-1">{operatorName}</td>
                        <td className="border-none p-1">OPERARIO ATENCION</td>
                        <td colSpan="3" className="border-none border-r border-black p-1">{operatorName}</td>
                      </tr>
                      <tr>
                        <td className="border-none border-l border-black p-1 pb-4">FECHA</td>
                        <td colSpan="3" className="border-none border-r border-black p-1 pb-4">{reportDate}</td>
                        <td className="border-none p-1 pb-4">FECHA</td>
                        <td colSpan="3" className="border-none border-r border-black p-1 pb-4">{reportDate}</td>
                      </tr>

                      {/* Títulos de Columnas Dinámicas */}
                      <tr className="border border-black font-bold">
                        <td className="border border-black p-1">CILINDROS VACIOS</td>
                        <td className="border border-black p-1">COD. CILINDROS</td>
                        <td className="border border-black p-1 text-center">UND.</td>
                        <td className="border border-black p-1 text-center">TOTAL-M3</td>
                        <td className="border border-black p-1">CILINDROS LLENOS</td>
                        <td className="border border-black p-1">COD. CILINDROS</td>
                        <td className="border border-black p-1 text-center">UND.</td>
                        <td className="border border-black p-1 text-center">TOTAL -M3</td>
                      </tr>

                      {/* Bucle de Filas de Cilindros */}
                      {rowsArray.map((_, index) => (
                        <tr key={index}>
                          <td className="border border-black p-1">{salidas[index]?.brand || ''}</td>
                          <td className="border border-black p-1">{salidas[index]?.code || ''}</td>
                          <td className="border border-black p-1 text-center">{salidas[index] ? '1' : ''}</td>
                          <td className="border border-black p-1 text-center">{salidas[index] ? '0' : ''}</td>
                          
                          <td className="border border-black p-1">{ingresos[index]?.brand || ''}</td>
                          <td className="border border-black p-1">{ingresos[index]?.code || ''}</td>
                          <td className="border border-black p-1 text-center">{ingresos[index] ? '1' : ''}</td>
                          <td className="border border-black p-1 text-center">{ingresos[index]?.capacity || ''}</td>
                        </tr>
                      ))}

                      {/* Subtotales (Opcional, si hay más proveedores, pero el formato lo engloba así) */}
                      <tr>
                        <td className="border border-black p-1 font-bold">Total Linde Perú</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1 text-center font-bold">{salidas.length}</td>
                        <td className="border border-black p-1 text-center font-bold">0</td>
                        
                        <td className="border border-black p-1 font-bold">Total Linde Perú</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1 text-center font-bold">{ingresos.length}</td>
                        <td className="border border-black p-1 text-center font-bold">{totalIngresosM3}</td>
                      </tr>

                      {/* Totales Generales */}
                      <tr>
                        <td colSpan="2" className="border border-black p-1 font-bold">Total general</td>
                        <td className="border border-black p-1 text-center font-bold">{salidas.length}</td>
                        <td className="border border-black p-1 text-center font-bold">0</td>
                        
                        <td colSpan="2" className="border border-black p-1 font-bold">Total general</td>
                        <td className="border border-black p-1 text-center font-bold">{ingresos.length}</td>
                        <td className="border border-black p-1 text-center font-bold">{totalIngresosM3}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Firmas en la parte inferior */}
                  <table className="w-full mt-16 text-xs text-left" style={{ border: 'none' }}>
                    <tbody>
                      <tr>
                        <td className="w-1/2 p-4 align-top" style={{ border: 'none' }}>
                          <div className="border-t border-black w-3/4 mx-auto pt-2 font-bold leading-relaxed">
                            RESPONSABLE DE LA RECEPCION<br/>
                            NOMBRE:<br/>
                            DNI:
                          </div>
                        </td>
                        <td className="w-1/2 p-4 align-top" style={{ border: 'none' }}>
                          <div className="border-t border-black w-3/4 mx-auto pt-2 font-bold leading-relaxed">
                            RESPONSABLE DE LA ENTREGA<br/>
                            NOMBRE:<br/>
                            DNI:
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierReport;