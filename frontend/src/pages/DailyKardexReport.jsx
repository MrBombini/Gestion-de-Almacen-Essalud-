import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MdInsertChartOutlined, MdDownload, MdDateRange } from 'react-icons/md';
import useFetch from '../hooks/useFetch';

// ==========================================
// FUNCIÓN ESCUDO
// ==========================================
const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Object.values(data);
};

// Obtiene la fecha local exacta
const getLocalYYYYMMDD = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
};

const DailyKardexReport = ({ externalDate, isEmbedded = false }) => {
  const [internalDate, setInternalDate] = useState(getLocalYYYYMMDD());
  const selectedDate = externalDate || internalDate;
  const setSelectedDate = setInternalDate;

  const { data: dailyData, loading, error, execute } = useFetch(`/reports/daily-kardex?date=${selectedDate}`, 'GET', null, false);
  const reportRef = useRef(null);

  useEffect(() => {
    execute({ url: `/reports/daily-kardex?date=${selectedDate}` });
  }, [selectedDate]);

  const reportPayload = dailyData || {};
  const shiftsData = reportPayload.shifts || { MAÑANA: {}, TARDE: {}, NOCHE: {} };
  const initialBalance = ensureArray(reportPayload.initial_balance);
  const displayDate = String(selectedDate).split('-').reverse().join('/');

  // ==========================================
  // 1. DEFINICIÓN DE COLUMNAS MATRICIALES
  // ==========================================
  const matrixColumns = useMemo(() => [
    { cap: 6, brand: 'ESSALUD', key: '6_ESSALUD', isPeriferie: false },
    { cap: 6, brand: 'PACIENTE', key: '6_PROPIO', isPeriferie: false },
    { cap: 8, brand: 'ESSALUD', key: '8_ESSALUD', isPeriferie: false },
    { cap: 8, brand: 'OXICUSCO', key: '8_OXICUSCO', isPeriferie: false },
    { cap: 10, brand: 'ESSALUD', key: '10_ESSALUD', isPeriferie: false },
    { cap: 10, brand: 'PRAXAIR', key: '10_PRAXAIR', isPeriferie: false },
    { cap: 10, brand: 'PACIENTE', key: '10_PROPIO', isPeriferie: false },
    { cap: 10, brand: 'ANY', key: '10_PERIFERIE', isPeriferie: true },
  ], []);

  // ==========================================
  // 2. DETECCIÓN INTELIGENTE DE PERIFERIA
  // ==========================================
  const checkIsPeriferie = (mov) => {
    if (!mov) return false;
    if (mov.type === 'ServiceBulkExchange') return true;
    if (mov.service && !mov.patient) {
        const sName = String(mov.service.name || '').toUpperCase();
        const sType = String(mov.service.type || '').toUpperCase();
        
        if (sName.includes('MANIFOLD') || sType.includes('MANIFOLD') || sName.includes('EMERGENCIA') || sName.includes('PEDIATR')) return false;

        if (sName.includes('AMBULANCIA') || sName.includes('CM ') || sName.includes('CENTRO MEDICO') || 
            sName.includes('PERIFERI') || sName.includes('POSTA') || 
            (sName.includes('HOSPITAL') && !sName.includes('HOSPITALIZACION'))) {
            return true;
        }
    }
    return false;
  };

  // ==========================================
  // 3. MAPEO DE COLUMNAS (Mueve esto arriba para reutilizarlo)
  // ==========================================
  const getCylinderColumnIndex = (mov, cylMov) => {
    if (!mov || !cylMov || !cylMov.cylinder) return -1;
    
    let rawCap = Math.floor(parseFloat(cylMov.cylinder.capacity || 0));
    let cap = 10;
    if (rawCap <= 6) cap = 6;
    else if (rawCap <= 8) cap = 8;

    const brandName = String(cylMov.cylinder.ownership_type_name || cylMov.cylinder.ownership_type?.name || cylMov.cylinder.ownershipType?.name || 'ESSALUD').toUpperCase();
    const supName = String(cylMov.cylinder.supplier_name || cylMov.cylinder.supplier?.name || '').toUpperCase();

    const category = (() => {
      if (brandName.includes('PERIFERIE')) return 'PERIFERIE';
      if (brandName.includes('ESSALUD') || brandName === 'MAT' || brandName.includes('YA') || brandName.includes('JD') || brandName.includes('KIOSHI')) return 'ESSALUD';
      if (brandName.includes('PACIENT') || brandName.includes('PROPIO')) return 'PACIENTE';
      if (brandName.includes('OXICUSCO')) return 'OXICUSCO';
      if (brandName.includes('PRAXAIR') || brandName === 'PX' || supName.includes('PRAXAIR') || supName.includes('LINDE')) return 'PRAXAIR';
      return 'UNKNOWN';
    })();

    for (let i = 0; i < matrixColumns.length; i++) {
      const col = matrixColumns[i];
      if (col.isPeriferie && category === 'PERIFERIE') {
        return i; 
      } else if (!col.isPeriferie && cap === col.cap && col.brand === category) {
        return i;
      }
    }
    return -1;
  };

  // ==========================================
  // 4. SALDO INICIAL SEGURO A LAS 07:00 AM
  // ==========================================
  const startingBalances = useMemo(() => {
    const currentBals = matrixColumns.map(() => ({ LLENO: 0, VACIO: 0 }));

    initialBalance.forEach(item => {
      if (!item) return;
      
      let rawCap = Math.floor(parseFloat(item.capacity || 0));
      let cap = 10;
      if (rawCap <= 6) cap = 6;
      else if (rawCap <= 8) cap = 8;

      const status = String(item.status || '').toLowerCase();
      const isFull = status === 'full' || status === 'lleno';
      const isEmpty = status === 'empty' || status === 'vacio' || status === 'vacío' || status === 'in_transit';
      
      const brandName = String(item.ownership_type_name || item.ownership_type?.name || item.ownershipType?.name || '').toUpperCase();
      const supName = String(item.supplier_name || item.supplier?.name || '').toUpperCase();
      const count = parseInt(item.total, 10) || 0;

      const category = (() => {
        if (brandName.includes('PERIFERIE')) return 'PERIFERIE';
        if (brandName.includes('ESSALUD') || brandName === 'MAT' || brandName.includes('YA') || brandName.includes('JD') || brandName.includes('KIOSHI')) return 'ESSALUD';
        if (brandName.includes('PACIENT') || brandName.includes('PROPIO')) return 'PACIENTE';
        if (brandName.includes('OXICUSCO')) return 'OXICUSCO';
        if (brandName.includes('PRAXAIR') || brandName === 'PX' || supName.includes('PRAXAIR') || supName.includes('LINDE')) return 'PRAXAIR';
        return 'UNKNOWN';
      })();

      for (let i = 0; i < matrixColumns.length; i++) {
        const col = matrixColumns[i];
        
        if (col.isPeriferie && category === 'PERIFERIE') {
            if (isFull) currentBals[i].LLENO += count;
            if (isEmpty) currentBals[i].VACIO += count;
            break;
        } else if (!col.isPeriferie && col.cap === cap && col.brand === category) {
            if (isFull) currentBals[i].LLENO += count;
            if (isEmpty) currentBals[i].VACIO += count;
            break;
        }
      }
    });

    return currentBals;
  }, [initialBalance, matrixColumns]);

  // ==========================================
  // 4. MOTOR MATEMÁTICO EN CASCADA
  // ==========================================
  const shiftsBalances = useMemo(() => {
    const start = JSON.parse(JSON.stringify(startingBalances));

    const processShift = (shiftName) => {
        const startBals = JSON.parse(JSON.stringify(start));
        const totals = matrixColumns.map(() => ({ LLENO: 0, VACIO: 0 }));
        
        const rawMovements = shiftsData[shiftName]?.movements;
        const movements = ensureArray(rawMovements);

        movements.forEach(mov => {
            if (!mov) return;
            const isPeriferie = checkIsPeriferie(mov);
            const mType = String(mov.type || '').toLowerCase().trim();
            const isSupplier = mType === 'suppliermovement' || mType === 'supplierentry';
            const isStandard = !isPeriferie && !isSupplier; 

            const cylMovs = ensureArray(mov.cylinder_movements);
            cylMovs.forEach(cylMov => {
                const colIdx = getCylinderColumnIndex(mov, cylMov);
                if (colIdx !== -1) {
                    const cStatus = String(cylMov.cylinder_status || '').toLowerCase().trim();
                    const isFull = cStatus === 'full' || cStatus === 'in_use' || cStatus === 'lleno';
                    
                    const act = String(cylMov.action || '').toLowerCase().trim();
                    const isExit = act === 'exit' || act === 'salida';
                    const isEntry = act === 'entry' || act === 'ingreso';

                    if (isFull) {
                        if (isEntry) start[colIdx].LLENO += 1;
                        if (isExit) {
                            start[colIdx].LLENO -= 1;
                            if (isStandard) totals[colIdx].LLENO -= 1; 
                        }
                    } else { 
                        if (isEntry) {
                            start[colIdx].VACIO += 1;
                            if (isStandard) totals[colIdx].VACIO += 1;
                        }
                        if (isExit) start[colIdx].VACIO -= 1;
                    }
                }
            });
        });
        return { startBals, totals, endBals: JSON.parse(JSON.stringify(start)) };
    };

    return { MAÑANA: processShift('MAÑANA'), TARDE: processShift('TARDE'), NOCHE: processShift('NOCHE') };
  }, [shiftsData, startingBalances, matrixColumns]);

  // ==========================================
  // EXPORTAR A EXCEL
  // ==========================================
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const header = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; }
          th, td { border: 1px solid #000; padding: 2px 4px; text-align: center; }
          .vertical-text { mso-rotate: 90; }
        </style>
      </head>
      <body>
    `;
    const sourceHTML = header + reportRef.current.innerHTML + "</body></html>";
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(sourceHTML);
    fileDownload.download = `Kardex_Atencion_${displayDate.replace(/\//g, '-')}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // ==========================================
  // RENDERIZAR TURNOS
  // ==========================================
  const renderShiftBlock = (shiftName) => {
    const shiftData = shiftsData[shiftName] || {};
    const movements = ensureArray(shiftData.movements);
    
    const standardMovements = [];
    const peripheryMovements = [];
    const plantaMovements = [];
    const lindeMovements = [];
    const otrosMovements = [];

    movements.forEach(mov => {
      if (!mov) return;
      const mType = String(mov.type || '').toLowerCase().trim();
      const isSupplier = mType === 'suppliermovement' || mType === 'supplierentry';
      const isWarehouseTransfer = mType === 'warehousetransfer';
      const isPeriferie = checkIsPeriferie(mov);
      
      if (isSupplier) {
          const supName = String(mov.supplier?.name || '').toUpperCase();
          if (supName.includes('LINDE') || supName.includes('PRAXAIR')) lindeMovements.push(mov);
          else plantaMovements.push(mov);
      } 
      else if (isWarehouseTransfer) {
          plantaMovements.push(mov);
      }
      else if (isPeriferie) peripheryMovements.push(mov);
      else standardMovements.push(mov);
    });

    const getAggregatedCounts = (movs) => {
      const counts = matrixColumns.map(() => ({ LLENO: 0, VACIO: 0 }));
      ensureArray(movs).forEach(m => {
        if (!m) return;
        ensureArray(m.cylinder_movements).forEach(cylMov => {
          const colIdx = getCylinderColumnIndex(m, cylMov);
          if (colIdx !== -1) {
            const cStatus = String(cylMov.cylinder_status || '').toLowerCase().trim();
            const isFull = cStatus === 'full' || cStatus === 'in_use' || cStatus === 'lleno';
            
            let act = String(cylMov.action || '').toLowerCase().trim();
            
            // Lógica especial para traslados internos (WarehouseTransfer)
            if (m.type === 'WarehouseTransfer') {
              if (m.reference_document === 'ALMACEN_TO_CENTRAL') {
                act = 'entry'; // Ingresa a CENTRAL
              } else if (m.reference_document === 'CENTRAL_TO_ALMACEN') {
                act = 'exit';  // Sale de CENTRAL
              }
            }

            const isExit = act === 'exit' || act === 'salida';
            const isEntry = act === 'entry' || act === 'ingreso';
            
            // Usamos 1 tanto para ingresos como para salidas porque queremos mostrar
            // la CANTIDAD de movimientos (absoluta) en la matriz de Kardex.
            const value = (isEntry || isExit) ? 1 : 0;
            
            if (isFull) counts[colIdx].LLENO += value;
            else counts[colIdx].VACIO += value;
          }
        });
      });
      return counts;
    };

    const displayRows = [];

    if (standardMovements.length === 0) {
      displayRows.push({ _type: 'STANDARD_EMPTY', _num: 1 });
    } else {
      standardMovements.forEach((mov, i) => displayRows.push({ ...mov, _type: 'STANDARD', _num: i + 1 }));
    }

    for (let i = 0; i < 4; i++) {
        displayRows.push({ _type: 'STANDARD_EMPTY', _num: '' });
    }

    displayRows.push({ _type: 'AGGREGATED', _label: 'OTROS', counts: getAggregatedCounts(otrosMovements) });

    if (peripheryMovements.length === 0) {
      displayRows.push({ _type: 'CATEGORY_EMPTY', _label: 'PERIFERIE' });
    } else {
      peripheryMovements.forEach(mov => displayRows.push({ ...mov, _type: 'CATEGORY', _label: 'PERIFERIE' }));
    }

    displayRows.push({ _type: 'AGGREGATED', _label: 'PLANTA', counts: getAggregatedCounts(plantaMovements) });
    displayRows.push({ _type: 'AGGREGATED', _label: 'LINDE', counts: getAggregatedCounts(lindeMovements) });

    const operatorNames = ensureArray(shiftData.operators).join(' / ') || '_______________________';
    const startBals = shiftsBalances[shiftName].startBals;
    const shiftTotals = shiftsBalances[shiftName].totals;
    const endBals = shiftsBalances[shiftName].endBals;
    const headerColor = shiftName === 'MAÑANA' ? 'bg-[#e6b8d3]' : 'bg-[#fce4d6]';

    return (
      <tbody key={shiftName} className="border-b-4 border-black">
        <tr>
          <td colSpan="4" className={`${headerColor} font-black text-lg p-2 border border-black text-center uppercase tracking-widest`}>
            {shiftName}
          </td>
          <td className={`${headerColor} font-bold text-center text-[10px] border border-black px-1`}>
            {shiftName === 'MAÑANA' ? 'SALDO INICIAL' : 'SALDO ANTERIOR'}
          </td>
          {matrixColumns.map((col, i) => (
            <React.Fragment key={`bal-${shiftName}-${i}`}>
              <td className={`${headerColor} border border-black text-center font-bold text-[#b91c1c]`}>{startBals[i].LLENO}</td>
              <td className={`${headerColor} border border-black text-center font-bold`}>{startBals[i].VACIO}</td>
            </React.Fragment>
          ))}
          <td rowSpan={displayRows.length + 3} className="w-12 border border-black bg-white align-middle text-center overflow-hidden">
             <div className="h-full flex items-center justify-center">
               <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block' }} className="font-bold text-xs text-black tracking-widest whitespace-nowrap">
                  {operatorNames}
               </span>
             </div>
          </td>
        </tr>

        {displayRows.map((mov, idx) => {
          let colNum = '';
          let codeBed = '';
          let nameServ = '';
          let cylOut = '';
          let cylIn = '';

          const cylMovs = ensureArray(mov.cylinder_movements);

          if (mov._type === 'STANDARD') {
            colNum = mov._num;
            const serviceAbbr = mov.service?.abbreviation || '';
            const bedNum = mov.bed?.bed_number || '';
            codeBed = mov.patient?.exchange_code 
              ? mov.patient.exchange_code 
              : (serviceAbbr || bedNum ? `${serviceAbbr}${bedNum}` : '');
            nameServ = mov.patient?.full_name || mov.service?.name || '';
            cylOut = cylMovs.find(m => {
                const a = String(m.action || '').toLowerCase();
                return a === 'exit' || a === 'salida';
            })?.cylinder?.serial_number || '';
            
            cylIn = cylMovs.find(m => {
                const a = String(m.action || '').toLowerCase();
                return a === 'entry' || a === 'ingreso';
            })?.cylinder?.serial_number || '';
            
          } else if (mov._type === 'CATEGORY') {
            codeBed = mov._label;
            nameServ = mov.service?.name || mov.patient?.full_name || '';
          } else if (mov._type === 'AGGREGATED' || mov._type === 'CATEGORY_EMPTY' || mov._type === 'STANDARD_EMPTY') {
            codeBed = mov._label || '';
          }

          const marks = matrixColumns.map(() => ({ LLENO: 0, VACIO: 0 }));
          
          if (mov.id && (mov._type === 'STANDARD' || mov._type === 'CATEGORY')) {
            cylMovs.forEach(cylMov => {
              const colIdx = getCylinderColumnIndex(mov, cylMov);
              if (colIdx !== -1) {
                const cStatus = String(cylMov.cylinder_status || '').toLowerCase().trim();
                const isFull = cStatus === 'full' || cStatus === 'in_use' || cStatus === 'lleno';
                
                const act = String(cylMov.action || '').toLowerCase().trim();
                const isExit = act === 'exit' || act === 'salida';
                const isEntry = act === 'entry' || act === 'ingreso';
                const value = isEntry ? 1 : (isExit ? -1 : 0);

                if (mov._type === 'STANDARD') {
                    if (isExit) marks[colIdx].LLENO += 1;
                    if (isEntry) marks[colIdx].VACIO += 1;
                } else if (mov._type === 'CATEGORY') {
                    if (isFull) marks[colIdx].LLENO += value;
                    else marks[colIdx].VACIO += value;
                }
              }
            });
          }

          return (
            <tr key={`${shiftName}-${idx}`} className="h-6">
              <td className="border border-black text-center font-bold text-xs">{colNum}</td>
              <td className="border border-black text-center text-xs font-mono">{cylOut}</td>
              <td className="border border-black text-center bg-[#e7e6e6] text-xs font-mono">{cylIn}</td>
              <td className="border border-black text-center font-bold text-xs">{codeBed}</td>
              <td className="border border-black text-left px-2 text-[11px] font-bold">{nameServ}</td>
              
              {matrixColumns.map((col, cIdx) => {
                let contentLleno = '';
                let contentVacio = '';

                if (mov._type === 'AGGREGATED') {
                   contentLleno = mov.counts[cIdx].LLENO !== 0 ? mov.counts[cIdx].LLENO : '';
                   contentVacio = mov.counts[cIdx].VACIO !== 0 ? mov.counts[cIdx].VACIO : '';
                } else if (mov._type === 'CATEGORY') {
                   contentLleno = marks[cIdx].LLENO !== 0 ? marks[cIdx].LLENO : '';
                   contentVacio = marks[cIdx].VACIO !== 0 ? marks[cIdx].VACIO : '';
                } else if (mov._type === 'STANDARD') {
                   contentLleno = marks[cIdx].LLENO > 0 ? 'X' : '';
                   contentVacio = marks[cIdx].VACIO > 0 ? 'X' : '';
                }

                return (
                  <React.Fragment key={`mark-${shiftName}-${idx}-${cIdx}`}>
                    <td className="border border-black text-center font-black text-sm text-[#b91c1c]">{contentLleno}</td>
                    <td className="border border-black text-center font-black text-sm bg-[#e7e6e6]">{contentVacio}</td>
                  </React.Fragment>
                );
              })}
            </tr>
          );
        })}

        <tr className="bg-[#e7e6e6] font-bold text-xs">
          <td colSpan="4" className="border border-black bg-white"></td>
          <td className="border border-black text-center">TOTAL ATENDIDO</td>
          {matrixColumns.map((col, i) => (
             <React.Fragment key={`total-${shiftName}-${i}`}>
               <td className="border border-black text-center text-[#b91c1c]">{shiftTotals[i].LLENO !== 0 ? shiftTotals[i].LLENO : ''}</td>
               <td className="border border-black text-center bg-white">{shiftTotals[i].VACIO !== 0 ? shiftTotals[i].VACIO : ''}</td>
             </React.Fragment>
          ))}
        </tr>
        <tr className="bg-[#e7e6e6] font-bold text-xs">
          <td colSpan="4" className="border border-black bg-white"></td>
          <td className="border border-black text-center">SALDO FINAL</td>
          {matrixColumns.map((col, i) => (
             <React.Fragment key={`saldofin-${shiftName}-${i}`}>
               <td className="border border-black text-center text-[#b91c1c]">{endBals[i].LLENO}</td>
               <td className="border border-black text-center bg-white">{endBals[i].VACIO}</td>
             </React.Fragment>
          ))}
        </tr>
      </tbody>
    );
  };

  return (
    <div className={isEmbedded ? 'space-y-4' : 'space-y-6 pb-12'}>
      {/* Cabecera Responsiva */}
      {!isEmbedded ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <MdInsertChartOutlined className="text-2xl" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Kardex Matriz Diaria</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Control por turnos y cálculo de arrastre.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center justify-center gap-2 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 w-full sm:w-auto">
              <MdDateRange className="text-slate-400 text-xl shrink-0" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full sm:w-auto text-center sm:text-left" />
            </div>
            <button onClick={handleExportExcel} className="flex justify-center items-center gap-2 bg-[#1d6f42] hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm w-full sm:w-auto shrink-0">
              <MdDownload className="text-xl" /> Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-2">
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Kardex Detallado de Atención</h2>
            <p className="text-xs text-slate-500">Matriz de 8 categorías de cilindros por turno con firmas y trazabilidad</p>
          </div>
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 bg-[#1d6f42] hover:bg-green-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm">
            <MdDownload className="text-lg" /> Descargar Excel
          </button>
        </div>
      )}

      {/* Contenedor de la Tabla Responsiva */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-0 sm:p-4 lg:p-6">
        {loading && <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}
        {error && <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg font-bold m-4">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto custom-scrollbar p-4 sm:p-0" ref={reportRef}>
            <style>{`
              .kardex-matrix table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
              .kardex-matrix th, .kardex-matrix td { border: 1px solid #000; }
              /* Pequeña mejora para el scrollbar en webkit */
              .custom-scrollbar::-webkit-scrollbar { height: 8px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
            
            <div className="kardex-matrix text-black min-w-[1200px]">
              <table>
                <thead>
                  <tr>
                    <th colSpan="5" className="text-left p-2 text-xl bg-white border-none font-black">FECHA: <span className="ml-2">{displayDate}</span></th>
                    <th colSpan="16" className="text-center text-xl font-black bg-white border-none tracking-widest pb-4">KARDEX ATENCIÓN DE OXÍGENO</th>
                    <th className="border-none bg-white"></th>
                  </tr>
                  
                  <tr className="bg-white">
                    <th colSpan="5" className="border-none"></th>
                    <th colSpan="4" className="text-center font-bold border border-black bg-[#e7e6e6]">6M3</th>
                    <th colSpan="4" className="text-center font-bold border border-black bg-[#e7e6e6]">8M3</th>
                    <th colSpan="8" className="text-center font-bold border border-black bg-[#e7e6e6]">10M3</th>
                    <th rowSpan="3" className="w-10 border border-black bg-white align-middle text-center p-0">
                      <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block' }} className="font-bold text-[10px] whitespace-nowrap">
                        NOMB<br/>RE<br/>FIRMA
                      </span>
                    </th>
                  </tr>

                  <tr className="bg-white text-[10px]">
                    <th colSpan="5" className="border-none"></th>
                    <th colSpan="2" className="border border-black text-center font-semibold bg-[#fce4d6]">ESSALUD</th>
                    <th colSpan="2" className="border border-black text-center font-semibold bg-[#fce4d6]">B.PROPIO P</th>
                    <th colSpan="2" className="border border-black text-center font-semibold bg-[#fce4d6]">ESSALUD</th>
                    <th colSpan="2" className="border border-black text-center font-semibold bg-[#fce4d6]">OXICUSCO</th>
                    <th colSpan="2" className="border border-black text-center font-semibold bg-[#fce4d6]">ESSALUD</th>
                    <th colSpan="2" className="border border-black text-center font-semibold bg-[#fce4d6]">PRAXAIR</th>
                    <th colSpan="2" className="border border-black text-center font-semibold bg-[#fce4d6]">B. PROPIO</th>
                    <th colSpan="2" className="border border-black text-center font-semibold bg-[#fce4d6]">PERIFERIE</th>
                  </tr>

                  <tr className="bg-white text-[10px]">
                    <th className="w-6 border border-black text-center py-1 bg-slate-100">N°</th>
                    <th className="w-24 border border-black text-center py-1 bg-slate-100">B. LLENO</th>
                    <th className="w-24 border border-black text-center py-1 bg-slate-100">B. VACIO</th>
                    <th className="w-16 border border-black text-center py-1 bg-slate-100">COD/<br/>CAMA</th>
                    <th className="w-48 border border-black text-center py-1 bg-slate-100">NOMBRE/SERVICIO</th>
                    
                    {Array.from({ length: 8 }).map((_, i) => (
                      <React.Fragment key={`hdr-${i}`}>
                        <th className="w-8 border border-black bg-white align-middle text-center p-0 h-16">
                           <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block' }} className="font-normal">LLENO</span>
                        </th>
                        <th className="w-8 border border-black bg-[#e7e6e6] align-middle text-center p-0 h-16">
                           <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block' }} className="font-normal">VACÍO</span>
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                {renderShiftBlock('MAÑANA')}
                {renderShiftBlock('TARDE')}
                {renderShiftBlock('NOCHE')}

              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyKardexReport;