import React, { useState, useEffect, useRef } from 'react';
import { MdLocalHospital, MdPrint, MdRefresh } from 'react-icons/md';
import useFetch from '../../hooks/useFetch';

const HospitalizationControl = () => {
  const { data, loading, error, execute } = useFetch('/reports/hospitalization-control', 'GET', null, false);
  const [localData, setLocalData] = useState([]);
  const reportRef = useRef(null);

  const fetchControl = () => {
    execute();
  };

  useEffect(() => {
    fetchControl();
  }, []);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Inicializar campos editables para presión y flujo
      const initialized = data.map(cyl => ({
        ...cyl,
        presion_psi: '',
        flujo_lmin: '',
        tiempo_horas: ''
      }));
      setLocalData(initialized);
    }
  }, [data]);

  const [selectedService, setSelectedService] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [searchCylinder, setSearchCylinder] = useState('');

  // Cálculos de fórmula: Tiempo = (Volumen_Litros * Presion_Bar) / Flujo
  // 10m3 = 50L, 8m3 = 40L, 6m3 = 30L
  const handleInputChange = (id, field, value) => {
    const updated = [...localData];
    const index = updated.findIndex(c => c.id === id);
    if (index === -1) return;

    updated[index][field] = value;

    const presionPsi = parseFloat(updated[index].presion_psi) || 0;
    const flujoLmin = parseFloat(updated[index].flujo_lmin) || 0;
    
    if (presionPsi > 0 && flujoLmin > 0) {
      const cap_m3 = parseFloat(updated[index].capacity) || 10;
      let volumenLitros = 50;
      if (cap_m3 <= 6) volumenLitros = 30;
      else if (cap_m3 <= 8) volumenLitros = 40;
      
      const presionBar = presionPsi / 14.5;
      const tiempoMinutos = (volumenLitros * presionBar) / flujoLmin;
      const tiempoHoras = Math.round(tiempoMinutos / 60);
      
      updated[index].tiempo_horas = tiempoHoras;
    } else {
      updated[index].tiempo_horas = '';
    }
    
    setLocalData(updated);
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    const printContent = reportRef.current.outerHTML;
    const printWindow = window.open('', '', 'width=1000,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Control de Cilindros - Hospitalización</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; padding: 10px; margin: 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; }
            th, td { border: 1px solid #000; padding: 4px; }
            th { font-weight: bold; background-color: #f1f5f9; }
            h2 { text-align: center; font-size: 16px; margin-bottom: 20px; text-transform: uppercase; }
            .no-print { display: none; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; font-size: 12px; }
            input { border: none; text-align: center; width: 100%; font-size: 11px; font-family: inherit; }
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

  const getLocalDate = () => {
    return new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const getLocalTime = () => {
    return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  // Filtrado
  const filteredData = localData.filter(cyl => {
    const matchService = !selectedService || cyl.current_service?.name === selectedService;
    const matchBed = !selectedBed || cyl.current_bed?.bed_number === selectedBed;
    const matchCylinder = !searchCylinder || (cyl.serial_number && cyl.serial_number.toLowerCase().includes(searchCylinder.toLowerCase()));
    return matchService && matchBed && matchCylinder;
  });

  // Dividimos en dos columnas para emular el reporte original si hay muchos datos
  const half = Math.ceil(filteredData.length / 2);
  const leftCol = filteredData.slice(0, half);
  const rightCol = filteredData.slice(half);

  const renderTable = (columnData, startIndex) => (
    <table className="w-full text-xs bg-white border-collapse border border-black text-center shadow-sm">
      <thead>
        <tr>
          <th className="border border-black p-1 w-6 bg-slate-100">N°</th>
          <th className="border border-black p-1 bg-slate-100">CÓDIGO N° CAMA</th>
          <th className="border border-black p-1 bg-slate-100">SERVICIO</th>
          <th className="border border-black p-1 bg-slate-100">CÓDIGO CILINDRO</th>
          <th className="border border-black p-1 bg-slate-100">MODELO</th>
          <th className="border border-black p-1 w-16 bg-slate-100 no-print">PRESIÓN</th>
          <th className="border border-black p-1 w-16 bg-slate-100 no-print">FLUJO</th>
          <th className="border border-black p-1 w-16 bg-slate-100">TIEMPO (H)</th>
        </tr>
      </thead>
      <tbody>
        {columnData.map((cyl, i) => {
          const globalIdx = startIndex + i;
          return (
            <tr key={cyl.id} className="hover:bg-slate-50">
              <td className="border border-black p-1">{globalIdx + 1}</td>
              <td className="border border-black p-1 text-[10px] uppercase font-bold text-blue-700">{cyl.current_bed?.bed_number || '-'}</td>
              <td className="border border-black p-1 text-[10px] uppercase truncate max-w-[120px]">{cyl.current_service?.name || '-'}</td>
              <td className="border border-black p-1 uppercase">{cyl.serial_number}</td>
              <td className="border border-black p-1 text-[10px] truncate max-w-[80px] uppercase">{cyl.ownership_type?.name || 'ESSALUD'}</td>
              <td className="border border-black p-0 no-print">
                <input 
                  type="number" 
                  className="w-full h-full text-center outline-none bg-transparent"
                  value={cyl.presion_psi}
                  onChange={(e) => handleInputChange(cyl.id, 'presion_psi', e.target.value)}
                  placeholder="PSI"
                />
              </td>
              <td className="border border-black p-0 no-print">
                <input 
                  type="number" 
                  className="w-full h-full text-center outline-none bg-transparent"
                  value={cyl.flujo_lmin}
                  onChange={(e) => handleInputChange(cyl.id, 'flujo_lmin', e.target.value)}
                  placeholder="L/min"
                />
              </td>
              <td className={`border border-black p-1 font-bold bg-slate-50 ${cyl.tiempo_horas !== '' && cyl.tiempo_horas <= 2 ? 'text-red-600' : 'text-slate-700'}`}>
                {cyl.tiempo_horas}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const uniqueServices = Array.from(new Set(localData.map(c => c.current_service?.name).filter(Boolean))).sort();
  const uniqueBeds = Array.from(new Set(localData
    .filter(c => !selectedService || c.current_service?.name === selectedService)
    .map(c => c.current_bed?.bed_number)
    .filter(Boolean)
  )).sort();

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
            <MdLocalHospital className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Control de Hospitalización</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Cálculo de autonomía de cilindros en uso.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={fetchControl} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold transition-colors">
            <MdRefresh className="text-xl" /> Actualizar
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm">
            <MdPrint className="text-xl" /> Imprimir
          </button>
        </div>
      </div>

      {loading && <div className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div>}
      {error && <div className="p-4 text-red-500 bg-red-50 font-bold text-center rounded-lg">{error}</div>}

      {!loading && !error && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Filtrar por Servicio:</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                value={selectedService}
                onChange={(e) => { setSelectedService(e.target.value); setSelectedBed(''); }}
              >
                <option value="">-- Todos los servicios --</option>
                {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Filtrar por Cama:</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value)}
                disabled={!selectedService}
              >
                <option value="">-- Todas las camas --</option>
                {uniqueBeds.map(b => <option key={b} value={b}>Cama {b}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Buscar Cilindro:</label>
              <input 
                type="text"
                placeholder="Ej. SN-1234"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 uppercase"
                value={searchCylinder}
                onChange={(e) => setSearchCylinder(e.target.value)}
              />
            </div>
          </div>

          <div ref={reportRef} className="min-w-[800px] text-black">
            
            <h2 className="text-center font-black text-xl mb-6 tracking-wide">
              FORMATO DE CONTROL DE CILINDROS POR SERVICIO HNAGV ESSALUD CUSCO
            </h2>
            
            <div className="flex justify-between items-center mb-4 text-sm font-bold px-2">
              <div>FECHA: <span className="ml-2 font-normal">{getLocalDate()}</span></div>
              <div>OPERARIO: <span className="ml-2 font-normal">________________________</span></div>
              <div>HORA: <span className="ml-2 font-normal">{getLocalTime()}</span></div>
            </div>

            <div className="flex gap-6">
              <div className="w-1/2">
                {renderTable(leftCol, 0)}
              </div>
              <div className="w-1/2">
                {renderTable(rightCol, half)}
              </div>
            </div>
            
            {localData.length === 0 && (
              <div className="text-center p-8 text-slate-500 italic mt-4">
                No hay cilindros registrados en uso actualmente en Hospitalización.
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalizationControl;
