import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MdInsertChartOutlined, MdDownload, MdDateRange, MdWarning, MdPeople } from 'react-icons/md';
import useFetch from '../hooks/useFetch';

// ==========================================
// FUNCIÓN ESCUDO (Evita pantallas en blanco)
// ==========================================
const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Object.values(data);
};

// Obtiene la fecha local de Perú de forma exacta
const getLocalYYYYMMDD = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
};

const KardexResume = () => {
  const [selectedDate, setSelectedDate] = useState(getLocalYYYYMMDD());

  // Llamada a la API de Consumo
  const { data: dashboardData, loading, error, execute } = useFetch(`/reports/consumption-dashboard?date=${selectedDate}`, 'GET', null, false);
  const reportRef = useRef(null);

  useEffect(() => {
    execute({ url: `/reports/consumption-dashboard?date=${selectedDate}` });
  }, [selectedDate]);

  const payload = dashboardData || {};
  const shiftsData = payload.shifts || { MAÑANA: {}, TARDE: {}, NOCHE: {} };
  const displayDate = String(selectedDate).split('-').reverse().join('/');

  // ==========================================
  // EXPORTAR A EXCEL (FUNCIÓN RESTAURADA)
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
          th, td { border: 1px solid #000; padding: 4px; text-align: center; vertical-align: middle; }
          .bg-slate-200 { background-color: #e2e8f0; }
          .bg-slate-100 { background-color: #f1f5f9; }
          .bg-slate-50 { background-color: #f8fafc; }
          .cuadre-error { background-color: #fecaca; color: #b91c1c; font-weight: bold; }
          .cuadre-ok { background-color: #bbf7d0; color: #15803d; font-weight: bold; }
        </style>
      </head>
      <body>
    `;
    const sourceHTML = header + reportRef.current.innerHTML + "</body></html>";
    const source = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Resumen_Kardex_${displayDate.replace(/\//g, '-')}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // Columnas maestras de la matriz
  const matrixColumns = useMemo(() => [
    { cap: 6, brand: 'ESSALUD', key: '6_ESSALUD' },
    { cap: 6, brand: 'PACIENTE', key: '6_PROPIO' },
    { cap: 8, brand: 'ESSALUD', key: '8_ESSALUD' },
    { cap: 8, brand: 'OXICUSCO', key: '8_OXICUSCO' },
    { cap: 10, brand: 'ESSALUD', key: '10_ESSALUD' },
    { cap: 10, brand: 'PRAXAIR', key: '10_PRAXAIR' },
    { cap: 10, brand: 'PACIENTE', key: '10_PROPIO' },
    { cap: 10, brand: 'ANY', key: '10_PERIFERIE' },
  ], []);

  // Detector de Periferia
  const checkIsPeriferie = (mov) => {
    if (!mov) return false;
    if (String(mov.type).toLowerCase() === 'servicebulkexchange') return true;
    if (mov.service && !mov.patient) {
        const sName = String(mov.service.name || '').toUpperCase();
        if (sName.includes('MANIFOLD') || sName.includes('EMERGENCIA')) return false;
        return true;
    }
    return false;
  };

  // Función Stock Dinámico para Cuadros Inferiores
  const getStock = (stockArray, location, capacity, brandKeyword) => {
    const array = ensureArray(stockArray);
    let total = 0;

    array.forEach(s => {
        if (!s) return;
        const sLoc = String(s.location || '').toUpperCase();
        let rawCap = Math.floor(parseFloat(s.capacity || 0));
        let sCap = 10;
        if (rawCap <= 6) sCap = 6;
        else if (rawCap <= 8) sCap = 8;

        const sBrand = String(s.ownership_type?.name || s.ownership_name || s.ownership_type_name || '').toUpperCase();

        if (sLoc.includes(location.toUpperCase()) && sCap === capacity) {
            let matched = false;
            if (brandKeyword === 'ESSALUD' && (sBrand.includes('ESSALUD') || sBrand === 'MAT' || sBrand === 'YA' || sBrand === 'JD' || sBrand.includes('KIOSHI'))) matched = true;
            else if (brandKeyword === 'PROPIO' && (sBrand.includes('PACIENT') || sBrand.includes('PROPIO'))) matched = true;
            else if (brandKeyword === 'PRAXAIR' && (sBrand.includes('PRAXAIR') || sBrand === 'PX')) matched = true;
            else if (brandKeyword === 'OXICUSCO' && sBrand.includes('OXICUSCO')) matched = true;
            else if (brandKeyword === 'PERIFERIE' && sBrand.includes('PERIFERIE')) matched = true;

            if (matched) total += (parseInt(s.total, 10) || 0);
        }
    });
    return total;
  };

  // Lógica en Cascada de Saldos
  const m_consumo = shiftsData['MAÑANA']?.total || 0;
  const m_ingreso = shiftsData['MAÑANA']?.total_ingreso || 0;
  const m_saldo_anterior = payload.initial_balance || 0; 
  const m_reserva = m_saldo_anterior + m_ingreso - m_consumo;

  const t_consumo = shiftsData['TARDE']?.total || 0;
  const t_ingreso = shiftsData['TARDE']?.total_ingreso || 0;
  const t_saldo_anterior = m_reserva; 
  const t_reserva = t_saldo_anterior + t_ingreso - t_consumo;

  const n_consumo = shiftsData['NOCHE']?.total || 0;
  const n_ingreso = shiftsData['NOCHE']?.total_ingreso || 0;
  const n_saldo_anterior = t_reserva; 
  const n_reserva = n_saldo_anterior + n_ingreso - n_consumo;
  
  const gran_total_consumo = m_consumo + t_consumo + n_consumo;
  const gran_total_ingreso = m_ingreso + t_ingreso + n_ingreso;
  const cuadreMatematico = m_saldo_anterior + gran_total_ingreso - gran_total_consumo;
  const isCuadreOk = cuadreMatematico === n_reserva;

  // ==========================================
  // RENDERIZADOR DE BLOQUES POR TURNO
  // ==========================================
  const renderShiftBlock = (shiftName, shiftData, saldoAnterior, reservaActual) => {
    const d = shiftData || {};
    const movements = ensureArray(d.movements);
    const operatorNames = ensureArray(d.operators).join(' / ') || '______________________________';

    const llenos = ensureArray(d.reserva_llenos);
    const vacios = ensureArray(d.almacen_vacios);

    // Contadores en caliente para la Tabla de Consumo
    const consumptionCounts = {
      PADOMI: { '8_ESSALUD': 0, '6_ESSALUD': 0, '10_ESSALUD': 0, '10_PRAXAIR': 0 },
      HNAGV: { '8_ESSALUD': 0, '6_ESSALUD': 0, '10_ESSALUD': 0, '10_PRAXAIR': 0 },
      PERIFERICOS: { '8_ESSALUD': 0, '6_ESSALUD': 0, '10_ESSALUD': 0, '10_PRAXAIR': 0 }
    };

    const ingresoCounts = {
      PADOMI: { '6_ESSALUD': 0, '10_PERIFERIE': 0, '10_ESSALUD': 0, '10_PRAXAIR': 0 },
      HNAGV: { '6_ESSALUD': 0, '10_PERIFERIE': 0, '10_ESSALUD': 0, '10_PRAXAIR': 0 },
      PERIFERICOS: { '6_ESSALUD': 0, '10_PERIFERIE': 0, '10_ESSALUD': 0, '10_PRAXAIR': 0 }
    };

    movements.forEach(mov => {
      if (!mov) return;
      let rowKey = 'HNAGV';
      if (mov.patient_id) rowKey = 'PADOMI';
      else if (checkIsPeriferie(mov)) rowKey = 'PERIFERICOS';

      ensureArray(mov.cylinder_movements).forEach(cm => {
        const act = String(cm.action || '').toLowerCase().trim();
        let rawCap = Math.floor(parseFloat(cm.cylinder?.capacity || 0));
        let cap = 10;
        if (rawCap <= 6) cap = 6;
        else if (rawCap <= 8) cap = 8;

        const sBrand = String(cm.cylinder?.ownership_type_name || cm.cylinder?.ownership_type?.name || '').toUpperCase().trim();
        const supName = String(cm.cylinder?.supplier_name || cm.cylinder?.supplier?.name || '').toUpperCase().trim();
        
        let brandKey = 'ESSALUD';
        if (supName.includes('PRAXAIR') || supName.includes('LINDE') || sBrand.includes('PRAXAIR') || sBrand === 'PX') brandKey = 'PRAXAIR';

        // Salidas (Consumo Físico)
        if (act === 'exit' || act === 'salida') {
          const colKey = `${cap}_${brandKey}`;
          if (consumptionCounts[rowKey] && consumptionCounts[rowKey].hasOwnProperty(colKey)) {
            consumptionCounts[rowKey][colKey] += 1;
          }
        }
        // Entradas (Ingreso Físico)
        if (act === 'entry' || act === 'ingreso') {
          if (sBrand.includes('PERIFERIE')) ingresoCounts[rowKey]['10_PERIFERIE'] += 1;
          else if (brandKey === 'ESSALUD') {
            if (cap === 6) ingresoCounts[rowKey]['6_ESSALUD'] += 1;
            else ingresoCounts[rowKey]['10_ESSALUD'] += 1;
          } else if (brandKey === 'PRAXAIR') {
            ingresoCounts[rowKey]['10_PRAXAIR'] += 1;
          }
        }
      });
    });

    const sumReserva = 
      getStock(llenos, 'CENTRAL', 6, 'ESSALUD') +
      getStock(llenos, 'CENTRAL', 10, 'OXICUSCO') +
      getStock(llenos, 'CENTRAL', 10, 'ESSALUD') +
      getStock(llenos, 'CENTRAL', 10, 'PRAXAIR') +
      getStock(llenos, 'CENTRAL', 8, 'ESSALUD') +
      getStock(llenos, 'CENTRAL', 10, 'PROPIO') +
      getStock(llenos, 'CENTRAL', 6, 'PROPIO') +
      getStock(llenos, 'CENTRAL', 10, 'PERIFERIE') +
      getStock(llenos, 'PLANTA', 6, 'ESSALUD') +
      getStock(llenos, 'PLANTA', 10, 'ESSALUD') +
      getStock(llenos, 'PLANTA', 8, 'ESSALUD');

    return (
      <div key={shiftName} className="mb-6">
        {/* TABLA 1: CONSUMO DEL TURNO */}
        <table className="w-full text-xs border-collapse border border-black mb-1">
          <thead>
            <tr>
              <th colSpan="11" className="border-none"></th>
              <th colSpan="3" className="border border-black bg-slate-100 font-bold text-right pr-2">TURNO:</th>
              <th colSpan="2" className="border border-black font-bold text-left pl-2">{shiftName}</th>
            </tr>
            <tr className="bg-slate-200">
              <th rowSpan="2" className="border border-black w-6">N°</th>
              <th rowSpan="2" className="border border-black w-48 text-left px-2">DESCRIPCIÓN</th>
              <th className="border border-black">BALONES<br/>8M3</th>
              <th className="border border-black">BALONES<br/>6M3</th>
              <th colSpan="2" className="border border-black">BALONES 10M3</th>
              <th colSpan="2" className="border border-black">RECARGA</th>
              <th className="border border-black">CONSUMO</th>
              <th rowSpan="2" className="border border-black">TRASIEG<br/>O</th>
              <th colSpan="4" className="border border-black">INGRESO TOTAL</th>
              <th colSpan="2" className="border border-black">TOTAL</th>
            </tr>
            <tr className="bg-slate-200">
              <th className="border border-black font-normal">ESSALUD</th>
              <th className="border border-black font-normal">ESSALUD</th>
              <th className="border border-black font-normal">ESSALUD</th>
              <th className="border border-black font-normal">PRAXAIR</th>
              <th className="border border-black font-normal">6M3</th>
              <th className="border border-black font-normal">10M3</th>
              <th className="border border-black font-bold">TOTAL M3</th>
              <th className="border border-black font-normal">ESSALUD<br/>6M3</th>
              <th className="border border-black font-normal">PERIFERIE<br/>10M3</th>
              <th className="border border-black font-normal">ESSALUD<br/>10M3</th>
              <th className="border border-black font-normal">PRAXAIR<br/>10M3</th>
              <th colSpan="2" className="border border-black font-bold">M3</th>
            </tr>
          </thead>
          <tbody>
            {/* PADOMI */}
            <tr>
              <td className="border border-black text-center">1</td>
              <td className="border border-black text-left px-2 font-bold">PACIENTES DOMICILIO (PADOMI)</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.PADOMI['8_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.PADOMI['6_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.PADOMI['10_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.PADOMI['10_PRAXAIR'] || ''}</td>
              <td className="border border-black"></td><td className="border border-black"></td>
              <td className="border border-black text-center font-bold text-sm bg-slate-50">{d.padomi || 0}</td>
              <td className="border border-black"></td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.PADOMI['6_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.PADOMI['10_PERIFERIE'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.PADOMI['10_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.PADOMI['10_PRAXAIR'] || ''}</td>
              <td colSpan="2" className="border border-black text-center font-bold">{d.padomi || 0}</td>
            </tr>
            {/* HNAGV */}
            <tr>
              <td className="border border-black text-center">2</td>
              <td className="border border-black text-left px-2 font-bold">HNAGV</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.HNAGV['8_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.HNAGV['6_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.HNAGV['10_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.HNAGV['10_PRAXAIR'] || ''}</td>
              <td className="border border-black"></td><td className="border border-black"></td>
              <td className="border border-black text-center font-bold text-sm bg-slate-50">{d.hnagv || 0}</td>
              <td className="border border-black"></td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.HNAGV['6_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.HNAGV['10_PERIFERIE'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.HNAGV['10_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.HNAGV['10_PRAXAIR'] || ''}</td>
              <td colSpan="2" className="border border-black text-center bg-slate-50 font-bold text-slate-700">CILINDROS</td>
            </tr>
            {/* PERIFERICOS */}
            <tr>
              <td className="border border-black text-center">3</td>
              <td className="border border-black text-left px-2 font-bold">CCAA PERIFÉRICOS</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.PERIFERICOS['8_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.PERIFERICOS['6_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.PERIFERICOS['10_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-red-600">{consumptionCounts.PERIFERICOS['10_PRAXAIR'] || ''}</td>
              <td className="border border-black"></td><td className="border border-black"></td>
              <td className="border border-black text-center font-bold text-sm bg-slate-50">{d.perifericos || 0}</td>
              <td className="border border-black"></td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.PERIFERICOS['6_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.PERIFERICOS['10_PERIFERIE'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.PERIFERICOS['10_ESSALUD'] || ''}</td>
              <td className="border border-black text-center font-bold text-green-600">{ingresoCounts.PERIFERICOS['10_PRAXAIR'] || ''}</td>
              <td colSpan="2" className="border border-black text-center font-bold">{d.perifericos || 0}</td>
            </tr>
            <tr>
              <td colSpan="8" className="border border-black text-right pr-2 font-bold bg-slate-100">TOTAL M3</td>
              <td className="border border-black text-center font-black text-base bg-yellow-50">{d.total || 0}</td>
              <td colSpan="7" className="border border-black"></td>
            </tr>
          </tbody>
        </table>

        {/* TABLA 2: RESERVA LLENOS FÍSICA */}
        <table className="w-full text-xs border-collapse border border-black mb-2">
          <thead>
            <tr className="bg-slate-200">
              <th colSpan="8" className="border border-black text-left px-2 font-bold">RESERVA OXÍGENO GASEOSO (BALONES LLENOS)</th>
              <th colSpan="3" className="border border-black font-bold">ALMACÉN</th>
              <th colSpan="4" className="border border-black font-bold">PLANTA</th>
            </tr>
            <tr className="bg-slate-200">
              <th className="border border-black w-6">N°</th>
              <th className="border border-black w-48 text-left px-2">DESCRIPCIÓN</th>
              <th className="border border-black font-normal">06 (M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">10 (M3)<br/>OXICUSCO</th>
              <th className="border border-black font-normal">10 (M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">10 (M3)<br/>PRAXAIR</th>
              <th className="border border-black font-normal">8 (M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">10 (M3)<br/>PROPIO</th>
              <th className="border border-black font-normal">6(M3)<br/>PROPIO</th>
              <th className="border border-black font-normal">10(M3)<br/>PERIFERIE</th>
              <th className="border border-black font-normal">6(M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">10(M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">8(M3)<br/>ESSALUD</th>
              <th className="border border-black font-bold bg-slate-300">SALDO<br/>ANTERIOR</th>
              <th className="border border-black font-bold bg-slate-300">RESERVA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black text-center">1</td>
              <td className="border border-black text-left px-2 font-bold">RESERVA CENTRAL DE OXÍGENO</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'CENTRAL', 6, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'CENTRAL', 10, 'OXICUSCO')}</td>
              <td className="border border-black text-center font-bold text-sm text-blue-700">{getStock(llenos, 'CENTRAL', 10, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'CENTRAL', 10, 'PRAXAIR')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'CENTRAL', 8, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'CENTRAL', 10, 'PROPIO')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'CENTRAL', 6, 'PROPIO')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'CENTRAL', 10, 'PERIFERIE')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'PLANTA', 6, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'PLANTA', 10, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(llenos, 'PLANTA', 8, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm bg-slate-100">{saldoAnterior}</td>
              <td className="border border-black text-center font-black text-sm bg-slate-200">{sumReserva}</td>
            </tr>
          </tbody>
          
          {/* TABLA 3: BALONES VACIOS */}
          <thead>
            <tr className="bg-slate-200">
              <th colSpan="8" className="border border-black text-left px-2 font-bold border-t-2">BALONES VACÍOS OXÍGENO GASEOSO</th>
              <th colSpan="3" className="border border-black font-bold border-t-2">ALMACÉN</th>
              <th colSpan="2" className="border border-black font-bold border-t-2">PLANTA</th>
              <th colSpan="2" className="border border-black font-bold border-t-2">TALLER O2</th>
            </tr>
            <tr className="bg-slate-200">
              <th className="border border-black w-6">N°</th>
              <th className="border border-black w-48 text-left px-2">DESCRIPCIÓN</th>
              <th className="border border-black font-normal">06 (M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">10 (M3)<br/>OXICUSCO</th>
              <th className="border border-black font-normal">10 (M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">10 (M3)<br/>PRAXAIR</th>
              <th className="border border-black font-normal">8 (M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">10 (M3)<br/>PROPIO</th>
              <th className="border border-black font-normal">6(M3)<br/>PROPIO</th>
              <th className="border border-black font-normal">10(M3)<br/>PERIFERIE</th>
              <th className="border border-black font-normal">10(M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">8 (M3)<br/>ESSALUD</th>
              <th className="border border-black font-normal">DESCONO<br/>CIDOS</th>
              <th className="border border-black font-normal">MANTENI<br/>MIENTO</th>
              <th className="border border-black font-normal">MALOGRAD<br/>OS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black text-center">1</td>
              <td className="border border-black text-left px-2 font-bold">ALMACÉN CENTRAL DE OXÍGENO</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'CENTRAL', 6, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'CENTRAL', 10, 'OXICUSCO')}</td>
              <td className="border border-black text-center font-bold text-sm text-red-700">{getStock(vacios, 'CENTRAL', 10, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'CENTRAL', 10, 'PRAXAIR')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'CENTRAL', 8, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'CENTRAL', 10, 'PROPIO')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'CENTRAL', 6, 'PROPIO')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'CENTRAL', 10, 'PERIFERIE')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'PLANTA', 10, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm">{getStock(vacios, 'PLANTA', 8, 'ESSALUD')}</td>
              <td className="border border-black text-center font-bold text-sm text-slate-400">0</td>
              <td className="border border-black text-center font-bold text-sm text-slate-400">0</td>
              <td className="border border-black text-center font-bold text-sm text-slate-400">0</td>
            </tr>
          </tbody>
        </table>

        {/* FIRMA */}
        <div className="flex items-end gap-2 mb-8 text-sm mt-4">
          <span className="font-normal">RESPONSABLE (NOMBRE Y APELLIDO):</span>
          <span className="font-bold border-b border-black flex-1 uppercase tracking-wider text-base pb-1">
            {operatorNames}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <MdInsertChartOutlined className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Resumen Kardex (Lógica en Cascada)</h2>
            <p className="text-slate-500 text-sm mt-1">Control secuencial de saldos por turno y validador de cuadre diario.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <MdDateRange className="text-slate-400 text-xl" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-slate-700" />
          </div>
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-[#1d6f42] hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm">
            <MdDownload className="text-xl" /> Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg font-bold">{error}</div>
        ) : (
          <div className="min-w-[1000px] text-black" ref={reportRef}>
            
            <div className="flex flex-col items-center mb-6 pl-4 w-full">
              <MdPeople className="text-5xl text-blue-600 mb-1" />
              <div className="text-blue-600 text-center font-bold leading-tight mb-4">
                <span className="text-lg font-black">EsSalud</span>
              </div>
              <h1 className="text-3xl font-bold m-0 uppercase tracking-wide text-center">REGISTRO DE CONSUMO DE OXIGENO DIARIO</h1>
              <h2 className="text-2xl font-bold m-0 mt-4 uppercase text-center w-full flex justify-start border-b border-slate-300 pb-2">FECHA: {displayDate}</h2>
            </div>

            {renderShiftBlock('MAÑANA', shiftsData['MAÑANA'], m_saldo_anterior, m_reserva)}
            {renderShiftBlock('TARDE', shiftsData['TARDE'], t_saldo_anterior, t_reserva)}
            {renderShiftBlock('NOCHE', shiftsData['NOCHE'], n_saldo_anterior, n_reserva)}
            
            <table className="w-full text-sm border-collapse border-2 border-black mb-12">
              <thead>
                <tr>
                  <th className="border border-black p-2 bg-slate-100 w-1/4">TOTAL CONSUMO<br/>OXÍGENO GASEOSO</th>
                  <th className="border border-black p-2 bg-slate-100 w-1/4">SALDO INICIAL M3</th>
                  <th className="border border-black p-2 bg-slate-100 w-1/4">CONSUMO (M3)</th>
                  <th className="border border-black p-2 bg-slate-100 w-1/4">INGRESO (M3)</th>
                  <th className="border border-black p-2 bg-slate-100 w-1/4">RESERVA (M3)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold text-center bg-slate-100"></td>
                  <td className="border border-black p-2 text-center font-bold text-lg">{m_saldo_anterior}</td>
                  <td className="border border-black p-2 text-center font-bold text-lg">{gran_total_consumo}</td>
                  <td className="border border-black p-2 text-center font-bold text-lg">{gran_total_ingreso}</td>
                  <td className="border border-black p-2 text-center font-bold text-lg">{n_reserva}</td>
                </tr>
                <tr className={isCuadreOk ? 'cuadre-ok bg-green-100' : 'cuadre-error bg-red-100'}>
                  <td className="border border-black p-2 font-bold text-center flex items-center justify-center gap-2">
                    {!isCuadreOk && <MdWarning className="text-xl" />}
                    CUADRE
                  </td>
                  <td className="border border-black p-2 text-center font-bold text-lg">{m_saldo_anterior}</td>
                  <td className="border border-black p-2 text-center font-bold text-lg">{gran_total_consumo}</td>
                  <td className="border border-black p-2 text-center font-bold text-lg">{gran_total_ingreso}</td>
                  <td className="border border-black p-2 text-center font-bold text-lg">{cuadreMatematico}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KardexResume;