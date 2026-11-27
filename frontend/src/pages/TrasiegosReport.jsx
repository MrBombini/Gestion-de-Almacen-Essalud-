import { useState, useRef } from 'react';
import Select from 'react-select';
import { MdInsertChartOutlined, MdDownload, MdSearch, MdOutlineClear, MdPropaneTank, MdLocalHospital, MdPerson } from 'react-icons/md';
import { FaGasPump } from 'react-icons/fa6';
import useFetch from '../hooks/useFetch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TrasiegosReport = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchUrl, setSearchUrl] = useState('/inventory/decantings?page=1');
  const { data: results, loading, error, refetch } = useFetch(searchUrl);

  const decantings = results?.data || [];
  const paginationMeta = results ? {
    currentPage: results.current_page || 1,
    lastPage: results.last_page || 1,
    total: results.total || 0,
    perPage: results.per_page || 20
  } : null;

  const reportRef = useRef(null);

  // Catálogos para filtros
  const { data: patientsData, loading: loadingPatients } = useFetch('/patients');
  const { data: servicesData, loading: loadingServices } = useFetch('/services');

  const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData?.data || []);
  const servicesList = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);

  const patientOptions = patientsList.map(p => ({
    value: p.id,
    label: `${p.full_name} ${p.dni ? `(DNI: ${p.dni})` : ''} ${p.exchange_code ? `[Código: ${p.exchange_code}]` : ''}`
  }));

  const serviceOptions = servicesList.map(s => ({
    value: s.id,
    label: `${s.name} (${s.type})`
  }));

  const capacityOptions = [
    { value: '6', label: '6 m³' },
    { value: '8', label: '8 m³' },
    { value: '10', label: '10 m³' },
  ];

  const shiftOptions = [
    { value: 'Morning', label: 'Mañana' },
    { value: 'Afternoon', label: 'Tarde' },
    { value: 'Night', label: 'Noche' },
  ];

  // Estados de los Filtros
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCapacity, setSelectedCapacity] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Ejecutar búsqueda o paginación
  const handleSearch = (pageIndex = 1) => {
    setCurrentPage(pageIndex);
    const params = new URLSearchParams();
    if (selectedPatient) params.append('patient_id', selectedPatient.value);
    if (selectedService) params.append('service_id', selectedService.value);
    if (selectedCapacity) params.append('capacity', selectedCapacity.value);
    if (selectedShift) params.append('shift', selectedShift.value);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('page', pageIndex);

    setSearchUrl(`/inventory/decantings?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSelectedPatient(null);
    setSelectedService(null);
    setSelectedCapacity(null);
    setSelectedShift(null);
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setSearchUrl('/inventory/decantings?page=1');
  };

  // Estilos react-select
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.75rem',
      borderColor: state.isFocused ? '#2563eb' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 2px #2563eb20' : 'none',
      padding: '1px',
      fontSize: '0.875rem',
      backgroundColor: 'white font-medium',
    }),
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    const tableHTML = reportRef.current.outerHTML;

    const header = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #1e293b; color: #ffffff; font-weight: bold; text-align: left; border: 1px solid #cbd5e1; padding: 8px; }
          td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
          .title { font-size: 16px; font-weight: bold; text-align: center; color: #1e3a8a; }
        </style>
      </head>
      <body>
        <div class="title">REPORTE DE TRASIEGOS (RECARGAS INTERNAS) - ESSALUD</div>
        <br/>
        ${tableHTML}
      </body>
      </html>
    `;

    const source = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(header);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Reporte_Trasiegos_${new Date().toISOString().slice(0, 10)}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Título */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <FaGasPump className="text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reporte de Trasiegos</h1>
            <p className="text-slate-500 font-medium mt-1">
              Registro histórico de recargas internas de oxígeno (Balón a Balón).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-sm"
          >
            Imprimir
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-sm"
          >
            <MdDownload className="text-lg" /> Excel
          </button>
        </div>
      </div>

      {/* FILTROS AVANZADOS */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5 print:hidden">
        <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100 flex items-center gap-2">
          Filtros de Búsqueda
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Paciente</label>
            <Select
              options={patientOptions}
              styles={selectStyles}
              isClearable
              isLoading={loadingPatients}
              placeholder="Seleccionar Paciente..."
              value={selectedPatient}
              onChange={(opt) => setSelectedPatient(opt)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Servicio / Área</label>
            <Select
              options={serviceOptions}
              styles={selectStyles}
              isClearable
              isLoading={loadingServices}
              placeholder="Seleccionar Servicio..."
              value={selectedService}
              onChange={(opt) => setSelectedService(opt)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Capacidad del Balón</label>
            <Select
              options={capacityOptions}
              styles={selectStyles}
              isClearable
              placeholder="Ej: 10 m³"
              value={selectedCapacity}
              onChange={(opt) => setSelectedCapacity(opt)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Turno</label>
            <Select
              options={shiftOptions}
              styles={selectStyles}
              isClearable
              placeholder="Todos los turnos"
              value={selectedShift}
              onChange={(opt) => setSelectedShift(opt)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha Inicio</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-300 text-sm font-medium px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha Fin</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-300 text-sm font-medium px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
          <button 
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
          >
            <MdOutlineClear className="text-lg" /> Limpiar
          </button>
          <button 
            onClick={() => handleSearch(1)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-sm"
          >
            <MdSearch className="text-lg" /> Buscar
          </button>
        </div>
      </div>

      {/* Resultados y Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MdInsertChartOutlined className="text-blue-600 text-xl" /> Resultados del Historial
          </h2>
          <button
            onClick={() => handleSearch(1)}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Actualizar <MdSearch />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Cargando trasiegos...</p>
          </div>
        ) : decantings.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MdPropaneTank className="text-4xl text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-lg">No se encontraron registros de trasiego.</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table ref={reportRef} className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Fecha y Hora</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Balón Origen</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Destino (Paciente / Área)</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Cantidad Recargada</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Operario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decantings.map((row, idx) => {
                  const dateObj = row.decanted_at ? new Date(row.decanted_at) : null;
                  
                  return (
                    <tr key={row.id || idx} className="hover:bg-blue-50/50 transition-colors group">
                      
                      {/* Fecha y Hora */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {dateObj ? format(dateObj, "dd MMM yyyy", { locale: es }) : '-'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {dateObj ? format(dateObj, "HH:mm a") : ''} • Turno {row.shift}
                          </span>
                        </div>
                      </td>

                      {/* Balón Origen */}
                      <td className="px-6 py-4.5">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-800 block">
                            {row.cylinder?.serial_number || 'S/N'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {row.cylinder?.capacity} m³ • Prop: {row.cylinder?.ownership_type?.name || 'ESSALUD'}
                          </span>
                        </div>
                      </td>

                      {/* Destino */}
                      <td className="px-6 py-4.5">
                        <div className="space-y-0.5">
                          {row.patient ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                  <MdPerson /> PACIENTE PADOMI
                                </span>
                              </div>
                              <span className="font-bold text-slate-800 block uppercase">{row.patient.full_name}</span>
                              <span className="text-[10px] text-slate-400 block font-medium">DNI: {row.patient.dni}</span>
                            </>
                          ) : row.service ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                  <MdLocalHospital /> {row.service.type || 'SERVICIO'}
                                </span>
                              </div>
                              <span className="font-bold text-slate-800 block uppercase">{row.service.name}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">No especificado</span>
                          )}
                        </div>
                      </td>

                      {/* Cantidad Recargada */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {row.refilled_amount} m³
                        </span>
                      </td>

                      {/* Operario */}
                      <td className="px-6 py-4.5 whitespace-nowrap font-medium text-slate-700">
                        {row.user?.name || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {paginationMeta && paginationMeta.lastPage > 1 && (
          <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between rounded-b-3xl">
            <div className="text-sm text-slate-500 font-medium">
              Mostrando <span className="font-bold text-slate-800">{(paginationMeta.currentPage - 1) * paginationMeta.perPage + 1}</span> a <span className="font-bold text-slate-800">{Math.min(paginationMeta.currentPage * paginationMeta.perPage, paginationMeta.total)}</span> de <span className="font-bold text-slate-800">{paginationMeta.total}</span> resultados
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSearch(paginationMeta.currentPage - 1)}
                disabled={paginationMeta.currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                <span className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm">
                  Página {paginationMeta.currentPage} de {paginationMeta.lastPage}
                </span>
              </div>

              <button
                onClick={() => handleSearch(paginationMeta.currentPage + 1)}
                disabled={paginationMeta.currentPage === paginationMeta.lastPage}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrasiegosReport;
