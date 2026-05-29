import { useState, useRef } from 'react';
import { MdPrint, MdDownload, MdSearch, MdLocalHospital } from 'react-icons/md';
import useFetch from '../../hooks/useFetch';

const PeripheryReport = () => {
  // 1. Fetch Kardex history
  const { data: kardexData, loading, error } = useFetch('/reports/kardex');
  const kardexList = Array.isArray(kardexData) ? kardexData : (kardexData?.data || []);

  // 2. Filter ONLY periphery/hospital movements (ServiceBulkExchange or movements with a service but no patient)
  const peripheryMovements = kardexList.filter(mov => 
    mov.type === 'ServiceBulkExchange' || (mov.service && !mov.patient)
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const reportRef = useRef(null);

  // Filter list by ID or Service Name
  const filteredMovements = peripheryMovements.filter(mov => 
    mov.id.toString().includes(searchTerm) || 
    mov.service?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // DATA EXTRACTION & CALCULATION
  // ==========================================
  const operatorName = selectedReport?.user?.name || '-';
  const serviceName = selectedReport?.service?.name || 'HOSPITAL / U.P.S.';
  
  const rawDate = selectedReport?.movement_at ? new Date(selectedReport.movement_at) : new Date();
  const reportDate = `${rawDate.getMonth() + 1}/${rawDate.getDate()}/${rawDate.getFullYear()}`;

  const cylinderMovements = selectedReport?.cylinder_movements || [];
  
  // OUT (Left Side): Full cylinders going TO the hospital (Exit from central warehouse)
  const fullCylindersOut = cylinderMovements
    .filter(m => m.action === 'Exit')
    .map(m => ({
      brand: m.cylinder?.ownership_type?.name || 'EsSalud00',
      code: m.cylinder?.serial_number || 'N/A',
      capacity: parseFloat(m.cylinder?.capacity) || 0 // Full cylinders have volume
    }));

  // IN (Right Side): Empty cylinders coming FROM the hospital (Entry to central warehouse)
  const emptyCylindersIn = cylinderMovements
    .filter(m => m.action === 'Entry')
    .map(m => ({
      brand: m.cylinder?.ownership_type?.name || 'EsSalud',
      code: m.cylinder?.serial_number || 'N/A',
      capacity: 0 // Empty cylinders count as 0 m3
    }));

  const maxRows = Math.max(fullCylindersOut.length, emptyCylindersIn.length);
  const rowsArray = Array.from({ length: maxRows });

  const totalFullM3 = fullCylindersOut.reduce((sum, item) => sum + item.capacity, 0);

  // ==========================================
  // FUNCTION 1: PRINT (A4 Landscape)
  // ==========================================
  const handlePrint = () => {
    if (!reportRef.current) return;
    const printContent = reportRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=1000,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte Periferia UPS</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; color: #000; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th, td { border: 1px solid #000; padding: 4px 6px; }
            .no-border { border: none !important; }
            .border-bottom { border-bottom: 1px solid #000; }
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
  // FUNCTION 2: EXPORT TO EXCEL (.xls)
  // ==========================================
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const header = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Reporte UPS</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
    `;
    const footer = "</body></html>";
    const sourceHTML = header + reportRef.current.innerHTML + footer;
    
    const source = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Reporte_Periferia_${selectedReport.id}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
          <MdLocalHospital className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reportes de Periferia (U.P.S.)</h2>
          <p className="text-slate-500 text-sm mt-1">
            Generación de control de atención para hospitales periféricos y servicios.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: List & Search */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
              <MdSearch className="text-slate-400 text-xl" />
              <input 
                type="text" 
                placeholder="Buscar U.P.S. o ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
              />
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
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800">Op. #{mov.id}</span>
                  <span className="text-xs font-semibold text-slate-500">{new Date(mov.movement_at).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="text-sm text-slate-600 line-clamp-1 font-medium">U.P.S: {mov.service?.name || 'S/N'}</div>
              </button>
            ))}
            {!loading && filteredMovements.length === 0 && (
              <div className="text-center p-4 text-slate-400 text-sm">No se encontraron registros a periferia.</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Excel Preview */}
        <div className="xl:col-span-3 bg-slate-100 rounded-2xl border border-slate-200 p-4 lg:p-8 flex flex-col items-center min-h-[700px] overflow-x-auto relative">
          
          {!selectedReport ? (
            <div className="text-slate-400 text-center my-auto">
              <MdLocalHospital className="text-6xl mx-auto mb-4 opacity-50" />
              <p>Selecciona una operación de periferia para ver el formato.</p>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="w-full max-w-5xl flex justify-end gap-3 mb-4">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                  <MdPrint className="text-lg" /> Imprimir (A4)
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                  <MdDownload className="text-lg" /> Exportar Excel
                </button>
              </div>

              {/* PHYSICAL REPORT (Matches Excel structure exactly) */}
              <div className="bg-white p-8 rounded-sm shadow-xl w-full max-w-5xl border border-slate-200" style={{ minWidth: '900px' }}>
                <div ref={reportRef} className="text-black font-sans text-xs">
                  
                  {/* Main Headers */}
                  <h1 className="text-center text-[#548235] font-bold text-2xl uppercase m-0">ATENCION DE ÓXIGENO MEDICINAL</h1>
                  <h2 className="text-center text-[#548235] font-bold text-xl mb-4 uppercase m-0">SALIDA</h2>

                  <table className="w-full border-collapse border border-black table-fixed text-xs">
                    <thead>
                      <tr>
                        {/* Blue borders matching the screenshot */}
                        <th colSpan="4" className="border-t-2 border-b-2 border-l border-r border-[#2e528f] p-1 text-center font-bold bg-white w-1/2">SALIDA CILINDROS</th>
                        <th colSpan="4" className="border-t-2 border-b-2 border-l border-r border-[#2e528f] p-1 text-center font-bold bg-white w-1/2">INGRESO CILINDROS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* White separator row */}
                      <tr><td colSpan="8" className="h-4 border-none border-x border-black"></td></tr>
                      
                      {/* Header Data Left / Right */}
                      <tr>
                        <td className="border-none border-l border-black p-1">CONDICION</td>
                        <td colSpan="3" className="border-none border-r border-black p-1">SALIDA</td>
                        <td className="border-none p-1">CONDICION</td>
                        <td colSpan="3" className="border-none border-r border-black p-1">INGRESO</td>
                      </tr>
                      <tr>
                        <td className="border-none border-l border-black p-1">U.P.S.</td>
                        {/* Specific blue box styling for UPS in screenshot */}
                        <td colSpan="3" className="border-none border-r border-black p-1"><span className=" px-1 inline-block min-w-[200px] uppercase">{serviceName}</span></td>
                        <td className="border-none p-1">U.P.S.</td>
                        <td colSpan="3" className="border-none border-r border-black p-1 uppercase">{serviceName}</td>
                      </tr>
                      <tr>
                        <td className="border-none border-l border-black p-1">FECHA</td>
                        <td colSpan="3" className="border-none border-r border-black p-1">{reportDate}</td>
                        <td className="border-none p-1">FECHA</td>
                        <td colSpan="3" className="border-none border-r border-black p-1">{reportDate}</td>
                      </tr>
                      <tr>
                        <td className="border-none border-l border-black p-1 pb-4">OPERARIO ATENCION</td>
                        <td colSpan="3" className="border-none border-r border-black p-1 pb-4">{operatorName}</td>
                        <td className="border-none border-l border-black p-1 pb-4">OPERARIO ATENCION</td>
                        <td colSpan="3" className="border-none border-r border-black p-1 pb-4">{operatorName}</td>
                      </tr>

                      {/* Dynamic Column Titles (Notice the inverted logic vs Supplier) */}
                      <tr className="border border-black font-bold">
                        <td className="border border-black p-1">CILINDROS LLENOS</td>
                        <td className="border border-black p-1">CILINDRO</td>
                        <td className="border border-black p-1 text-center">T. M3</td>
                        <td className="border border-black p-1 text-center">UND.</td>
                        
                        <td className="border border-black p-1">CILINDROS VACIOS</td>
                        <td className="border border-black p-1">CILINDRO</td>
                        <td className="border border-black p-1 text-center">UND.</td>
                        <td className="border border-black p-1 text-center">Suma de TOTAL M3</td>
                      </tr>

                      {/* Cylinder Rows Loop */}
                      {rowsArray.map((_, index) => (
                        <tr key={index}>
                          <td className="border border-black p-1">{fullCylindersOut[index]?.brand || ''}</td>
                          <td className="border border-black p-1">{fullCylindersOut[index]?.code || ''}</td>
                          <td className="border border-black p-1 text-center">{fullCylindersOut[index]?.capacity || ''}</td>
                          <td className="border border-black p-1 text-center">{fullCylindersOut[index] ? '1' : ''}</td>
                          
                          <td className="border border-black p-1">{emptyCylindersIn[index]?.brand || ''}</td>
                          <td className="border border-black p-1">{emptyCylindersIn[index]?.code || ''}</td>
                          <td className="border border-black p-1 text-center">{emptyCylindersIn[index] ? '1' : ''}</td>
                          <td className="border border-black p-1 text-center">{emptyCylindersIn[index] ? '0' : ''}</td>
                        </tr>
                      ))}

                      {/* Subtotals & Grand Totals */}
                      <tr>
                        <td className="border border-black p-1 font-bold">Total EsSalud Cusco</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1 text-center font-bold">{totalFullM3}</td>
                        <td className="border border-black p-1 text-center font-bold">{fullCylindersOut.length}</td>
                        
                        <td className="border border-black p-1 font-bold">Total EsSalud Cusco</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1 text-center font-bold">{emptyCylindersIn.length}</td>
                        <td className="border border-black p-1 text-center font-bold">0</td>
                      </tr>

                      <tr>
                        <td colSpan="2" className="border border-black p-1 font-bold">Total general</td>
                        <td className="border border-black p-1 text-center font-bold">{totalFullM3}</td>
                        <td className="border border-black p-1 text-center font-bold">{fullCylindersOut.length}</td>
                        
                        <td colSpan="2" className="border border-black p-1 font-bold">Total general</td>
                        <td className="border border-black p-1 text-center font-bold">{emptyCylindersIn.length}</td>
                        <td className="border border-black p-1 text-center font-bold">0</td>
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

export default PeripheryReport;