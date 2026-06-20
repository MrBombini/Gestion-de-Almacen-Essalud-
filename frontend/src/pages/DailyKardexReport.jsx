import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MdInsertChartOutlined, MdDownload, MdPrint, MdDateRange } from 'react-icons/md';
import useFetch from '../hooks/useFetch';

const DailyKardexReport = () => {
  // Use today's date in Peru as default (based on current system time: 2026-06-19)
  const today = '2026-06-19'; 
  const [selectedDate, setSelectedDate] = useState(today);

  // Fetch the specific daily matrix report from your API
  const { data: dailyData, loading, error, execute } = useFetch(`/reports/daily-kardex?date=${selectedDate}`, 'GET', null, false);
  
  const reportRef = useRef(null);

  // Re-fetch when date changes
  useEffect(() => {
    execute({ url: `/reports/daily-kardex?date=${selectedDate}` });
  }, [selectedDate]);

  // Extract data safely based on your reports.md specification
  const reportPayload = dailyData || {};
  const shiftsData = reportPayload.shifts || { MAÑANA: {}, TARDE: {}, NOCHE: {} };
  const initialBalance = reportPayload.initial_balance || [];

  // Helper to get formatted date DD/MM/YYYY
  const displayDate = selectedDate.split('-').reverse().join('/');

  // ==========================================
  // MATRIX DEFINITIONS (Hardcoded columns matching the Excel image perfectly)
  // ==========================================
  const matrixColumns = [
    { cap: '6', brand: 'ESSALUD', key: '6_ESSALUD' },
    { cap: '6', brand: 'B.PROPIO P', key: '6_BPROPIO' },
    { cap: '8', brand: 'ESSALUD', key: '8_ESSALUD' },
    { cap: '8', brand: 'OXICUSCO', key: '8_OXICUSCO' },
    { cap: '10', brand: 'ESSALUD', key: '10_ESSALUD' },
    { cap: '10', brand: 'PRAXAIR', key: '10_PRAXAIR' },
    { cap: '10', brand: 'B. PROPIO', key: '10_BPROPIO' },
    { cap: '10', brand: 'PERIFERIE', key: '10_PERIFERIE' },
  ];

  // ==========================================
  // RENDER HELPER FOR MATRIX CELLS
  // ==========================================
  const renderCellMark = (movement, colKey, type) => {
    // This is a simplified logic. It checks if the movement's cylinder matches the column capacity/brand.
    // 'Exit' = Full going out (LLENO column). 'Entry' = Empty coming in (VACIO column).
    // In a real scenario, map this precisely to your backend's cylinder payload.
    if (!movement || !movement.cylinder_movements) return '';
    
    let mark = '';
    movement.cylinder_movements.forEach(cylMov => {
      const isExit = cylMov.action === 'Exit';
      const isEntry = cylMov.action === 'Entry';
      const cap = Math.floor(cylMov.cylinder?.capacity).toString();
      const brand = (cylMov.cylinder?.ownership_type?.name || 'ESSALUD').toUpperCase();
      
      const matchKey = `${cap}_${brand}`;
      
      // We do a loose match since DB names might differ slightly from Excel headers
      if (colKey.includes(cap) && (colKey.includes(brand.substring(0,4)) || brand.includes(colKey.substring(2,6)))) {
        if (type === 'LLENO' && isExit) mark = 'X';
        if (type === 'VACIO' && isEntry) mark = 'X';
      }
    });

    return mark;
  };

  // ==========================================
  // EXPORT TO EXCEL
  // ==========================================
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
          th, td { border: 1px solid #000; padding: 2px 4px; text-align: center; }
          .bg-header { background-color: #fce4d6; } /* Light pink/orange header */
          .bg-gray { background-color: #e7e6e6; }
          .vertical-text { mso-rotate: 90; } /* Excel specific rotation */
        </style>
      </head>
      <body>
    `;
    const footer = "</body></html>";
    const sourceHTML = header + reportRef.current.innerHTML + footer;
    
    const source = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Kardex_Atencion_${displayDate.replace(/\//g, '-')}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // Render a single shift block (MAÑANA, TARDE, NOCHE)
  const renderShiftBlock = (shiftName, shiftData) => {
    const movements = shiftData?.movements || [];
    // Ensure we have at least a few empty rows to match the Excel look
    const displayRows = [...movements];
    while (displayRows.length < 8) displayRows.push({}); 

    // Extract signature text (Vertical name on the right)
    const operatorNames = shiftData?.operators?.join(' / ') || '_______________________';

    return (
      <tbody key={shiftName} className="border-b-4 border-black">
        {/* SHIFT TITLE ROW */}
        <tr>
          <td colSpan="5" className="bg-[#fce4d6] font-black text-lg p-2 border border-black text-center uppercase tracking-widest">
            {shiftName}
          </td>
          <td colSpan="16" className="bg-slate-200"></td> {/* Empty space for matrix columns */}
          {/* Signature Column spanning the whole shift */}
          <td rowSpan={displayRows.length + 6} className="w-12 border border-black p-0 bg-white align-middle relative">
             <div className="vertical-text whitespace-nowrap transform -rotate-90 origin-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-sm text-black tracking-widest">
                {operatorNames}
             </div>
          </td>
        </tr>

        {/* DATA ROWS */}
        {displayRows.map((mov, idx) => {
          // Find cylinder serials
          const cylOut = mov.cylinder_movements?.find(m => m.action === 'Exit')?.cylinder?.serial_number || '';
          const cylIn = mov.cylinder_movements?.find(m => m.action === 'Entry')?.cylinder?.serial_number || '';
          const codeBed = mov.patient?.exchange_code || mov.bed_id || '';
          const nameServ = mov.patient?.full_name || mov.service?.name || '';

          return (
            <tr key={`${shiftName}-${idx}`} className="h-6">
              <td className="border border-black text-center font-bold">{mov.id ? idx + 1 : ''}</td>
              <td className="border border-black text-center">{cylOut}</td>
              <td className="border border-black text-center bg-[#e7e6e6]">{cylIn}</td>
              <td className="border border-black text-center">{codeBed}</td>
              <td className="border border-black text-left px-2 text-xs font-semibold">{nameServ}</td>
              
              {/* Dynamic Matrix Checks */}
              {matrixColumns.map((col, cIdx) => (
                <React.Fragment key={`${shiftName}-${idx}-${col.key}`}>
                  <td className="border border-black text-center font-bold text-sm">{mov.id ? renderCellMark(mov, col.key, 'LLENO') : ''}</td>
                  <td className="border border-black text-center font-bold text-sm bg-[#e7e6e6]">{mov.id ? renderCellMark(mov, col.key, 'VACIO') : ''}</td>
                </React.Fragment>
              ))}
            </tr>
          );
        })}

        {/* STATIC FOOTER ROWS PER SHIFT (As seen in the Excel) */}
        {['OTROS', 'PERIFERIE', 'PLANTA', 'LINDE'].map((footerLabel) => (
          <tr key={`${shiftName}-${footerLabel}`} className="h-6 bg-white">
            <td colSpan="4" className="border border-black"></td>
            <td className="border border-black text-center font-bold text-xs">{footerLabel}</td>
            {matrixColumns.map((col) => (
              <React.Fragment key={`${footerLabel}-${col.key}`}>
                <td className="border border-black"></td>
                <td className="border border-black bg-[#e7e6e6]"></td>
              </React.Fragment>
            ))}
          </tr>
        ))}

        {/* TOTAL AND SALDO ROWS */}
        <tr className="bg-[#e7e6e6] font-bold">
          <td colSpan="4" className="border border-black bg-white"></td>
          <td className="border border-black text-center">TOTAL ATENDIDO</td>
          {matrixColumns.map((col) => (
             <React.Fragment key={`total-${col.key}`}>
               <td className="border border-black text-center">0</td>
               <td className="border border-black text-center bg-white">0</td>
             </React.Fragment>
          ))}
        </tr>
        <tr className="bg-[#e7e6e6] font-bold">
          <td colSpan="4" className="border border-black bg-white"></td>
          <td className="border border-black text-center">SALDO</td>
          {matrixColumns.map((col) => (
             <React.Fragment key={`saldo-${col.key}`}>
               <td className="border border-black text-center">0</td>
               <td className="border border-black text-center bg-white">0</td>
             </React.Fragment>
          ))}
        </tr>
      </tbody>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <MdInsertChartOutlined className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Kardex Matriz (Formato Excel)</h2>
            <p className="text-slate-500 text-sm mt-1">Control diario agrupado por turnos, capacidades y tipo de propiedad.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <MdDateRange className="text-slate-400 text-xl" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-700"
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[#1d6f42] hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
          >
            <MdDownload className="text-xl" />
            Excel
          </button>
        </div>
      </div>

      {/* MATRIX PREVIEW WRAPPER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 overflow-x-auto">
        
        {loading && (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg font-bold">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="min-w-[1200px]" ref={reportRef}>
            
            {/* CSS FOR BROWSER PREVIEW */}
            <style>{`
              .kardex-matrix table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
              .kardex-matrix th, .kardex-matrix td { border: 1px solid #000; }
              .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; }
            `}</style>

            <div className="kardex-matrix text-black">
              <table>
                
                {/* GLOBAL HEADERS (Matching Excel Top Row) */}
                <thead>
                  <tr>
                    <th colSpan="5" className="text-left p-2 text-xl bg-white border-none font-black">
                      FECHA: <span className="ml-2">{displayDate}</span>
                    </th>
                    <th colSpan="16" className="text-center text-xl font-black bg-white border-none tracking-widest pb-4">
                      KARDEX ATENCIÓN DE OXÍGENO
                    </th>
                    <th className="border-none bg-white"></th>
                  </tr>
                  
                  {/* SALDO INICIAL AND CAPACITY ROW */}
                  <tr className="bg-white">
                    <th colSpan="5" className="bg-[#fce4d6] text-right px-4 font-bold border border-black">SALDO INICIAL</th>
                    <th colSpan="4" className="text-center font-bold border border-black bg-white">6M3</th>
                    <th colSpan="4" className="text-center font-bold border border-black bg-white">8M3</th>
                    <th colSpan="8" className="text-center font-bold border border-black bg-white">10M3</th>
                    <th rowSpan="3" className="w-10 border border-black bg-white relative">
                      <span className="text-[10px] absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">NOMB<br/>RE<br/>FIRMA</span>
                    </th>
                  </tr>

                  {/* OWNERSHIP BRANDS ROW */}
                  <tr className="bg-white text-[10px]">
                    <th colSpan="5" className="border-none"></th>
                    <th colSpan="2" className="border border-black text-center font-semibold">ESSALUD</th>
                    <th colSpan="2" className="border border-black text-center font-semibold">B.PROPIO P</th>
                    <th colSpan="2" className="border border-black text-center font-semibold">ESSALUD</th>
                    <th colSpan="2" className="border border-black text-center font-semibold">OXICUSCO</th>
                    <th colSpan="2" className="border border-black text-center font-semibold">ESSALUD</th>
                    <th colSpan="2" className="border border-black text-center font-semibold">PRAXAIR</th>
                    <th colSpan="2" className="border border-black text-center font-semibold">B. PROPIO</th>
                    <th colSpan="2" className="border border-black text-center font-semibold">PERIFERIE</th>
                  </tr>

                  {/* COLUMN TITLES ROW */}
                  <tr className="bg-white text-[10px]">
                    <th className="w-6 border border-black text-center py-1">N°</th>
                    <th className="w-24 border border-black text-center py-1">B. LLENO</th>
                    <th className="w-24 border border-black text-center py-1 bg-[#e7e6e6]">B. VACIO</th>
                    <th className="w-16 border border-black text-center py-1">COD/<br/>CAMA</th>
                    <th className="w-48 border border-black text-center py-1">NOMBRE/SERVICIO</th>
                    
                    {/* Render LLENO / VACIO pairs 8 times */}
                    {[...Array(8)].map((_, i) => (
                      <React.Fragment key={`hdr-${i}`}>
                        <th className="w-8 border border-black text-center font-normal writing-mode-vertical-rl transform rotate-180 py-2">
                           <span className="vertical-text">LLENO</span>
                        </th>
                        <th className="w-8 border border-black text-center font-normal bg-[#e7e6e6] py-2">
                           <span className="vertical-text">VACÍO</span>
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                {/* DYNAMIC SHIFT BLOCKS */}
                {renderShiftBlock('MAÑANA', shiftsData.MAÑANA)}
                {renderShiftBlock('TARDE', shiftsData.TARDE)}
                {renderShiftBlock('NOCHE', shiftsData.NOCHE)}

              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyKardexReport;