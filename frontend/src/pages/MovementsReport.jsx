import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { 
  MdPropaneTank, 
  MdSearch, 
  MdLocationOn, 
  MdPerson, 
  MdLocalHospital, 
  MdBusiness, 
  MdCalendarMonth, 
  MdReport,
  MdArrowUpward,
  MdArrowDownward,
  MdPrint,
  MdDownload,
  MdRefresh,
  MdReceipt,
  MdOutlineClear
} from 'react-icons/md';
import { FaGasPump } from 'react-icons/fa6';
import useFetch from '../hooks/useFetch';
import api from '../services/api';

const MovementsReport = () => {
  // 1. Cargar catálogos para los dropdowns de búsqueda
  const { data: cylindersData, loading: loadingCylinders } = useFetch('/cylinders?per_page=all');
  const { data: patientsData, loading: loadingPatients } = useFetch('/patients');
  const { data: servicesData, loading: loadingServices } = useFetch('/services');
  const { data: bedsData, loading: loadingBeds } = useFetch('/beds');
  const { data: suppliersData, loading: loadingSuppliers } = useFetch('/suppliers');

  // Convertir a arreglos seguros
  const cylindersList = Array.isArray(cylindersData) ? cylindersData : (cylindersData?.data || []);
  const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData?.data || []);
  const servicesList = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
  const bedsList = Array.isArray(bedsData) ? bedsData : (bedsData?.data || []);
  const suppliersList = Array.isArray(suppliersData) ? suppliersData : (suppliersData?.data || []);

  // Formatear las opciones para react-select
  const cylinderOptions = cylindersList.map(c => ({
    value: c.id,
    label: `${c.serial_number} ${c.barcode ? `(${c.barcode})` : ''} - ${c.ownership_type?.name || 'S/D'} (${c.capacity} m³)`
  }));

  const patientOptions = patientsList.map(p => ({
    value: p.id,
    label: `${p.full_name} ${p.dni ? `(DNI: ${p.dni})` : ''} ${p.exchange_code ? `[Código: ${p.exchange_code}]` : ''}`
  }));

  const serviceOptions = servicesList.map(s => ({
    value: s.id,
    label: `${s.name} (${s.type})`
  }));

  const supplierOptions = suppliersList.map(sp => ({
    value: sp.id,
    label: `${sp.name} ${sp.ruc ? `(RUC: ${sp.ruc})` : ''}`
  }));

  // 2. Estados de los Filtros
  const [selectedCylinder, setSelectedCylinder] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [reference, setReference] = useState('');
  const [shift, setShift] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 3. Estado de URL de búsqueda y Hook de datos
  const [searchUrl, setSearchUrl] = useState('/reports/movements-search');
  const { data: results, loading: loadingResults, refetch } = useFetch(searchUrl);
  const movementResults = Array.isArray(results) ? results : [];

  const reportRef = useRef(null);

  // 4. Ejecutar búsqueda
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCylinder) params.append('cylinder', selectedCylinder.value);
    if (selectedPatient) params.append('patient', selectedPatient.value);
    if (selectedService) params.append('service', selectedService.value);
    if (selectedBed) params.append('bed', selectedBed.value);
    if (selectedSupplier) params.append('supplier', selectedSupplier.value);
    if (reference) params.append('reference', reference);
    if (shift) params.append('shift', shift);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    setSearchUrl(`/reports/movements-search?${params.toString()}`);
  };

  // 5. Limpiar todos los filtros
  const handleClearFilters = () => {
    setSelectedCylinder(null);
    setSelectedPatient(null);
    setSelectedService(null);
    setSelectedBed(null);
    setSelectedSupplier(null);
    setReference('');
    setShift('');
    setStartDate('');
    setEndDate('');
    setSearchUrl('/reports/movements-search');
  };

  // 6. Exportar a Excel (.xls nativo compatible)
  const handleExportExcel = () => {
    if (!reportRef.current) return;
    
    // Obtenemos solo las filas visibles para evitar que exporte elementos decorativos
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
        <div class="title">REPORTE DE MOVIMIENTOS DE CILINDROS - ESSALUD</div>
        <br/>
        ${tableHTML}
      </body>
      </html>
    `;

    const source = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(header);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Reporte_Movimientos_Cilindros_${new Date().toISOString().slice(0, 10)}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // 7. Impresión de pantalla
  const handlePrint = () => {
    window.print();
  };

  // Estilo de los dropdowns react-select
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
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };

  const bedOptions = bedsList
    .filter(b => selectedService ? b.service_id === selectedService.value : true)
    .map(b => ({
      value: b.id,
      label: `Cama ${b.bed_number} - ${b.room}`
    }));

  // Traducir turnos
  const translateShift = (s) => {
    const map = {
      Morning: { label: 'MAÑANA', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      Afternoon: { label: 'TARDE', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      Night: { label: 'NOCHE', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    };
    return map[s] || { label: s || 'S/D', color: 'bg-slate-50 text-slate-700 border-slate-200' };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Estilos CSS locales de impresión */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 10px !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1.5px solid #000 !important;
            padding: 4px 6px !important;
            font-size: 9px !important;
            color: #000 !important;
            background: transparent !important;
          }
          th {
            font-weight: bold !important;
            text-transform: uppercase !important;
          }
          .print\\:title {
            display: block !important;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 12px;
            color: #000;
          }
        }
        .print\\:title {
          display: none;
        }
      `}</style>

      {/* Titulo de Impresión Oculto en Web */}
      <div className="print:title">
        REPORTE HISTÓRICO Y BÚSQUEDA DE MOVIMIENTOS DE CILINDROS - ESSALUD
      </div>

      {/* CABECERA DE LA PÁGINA (print:hidden) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-100">
            <MdReceipt className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Reporte de Movimientos y Ubicaciones</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Consulta de forma integral el historial y rastreo de balones de oxígeno.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-sm"
          >
            <MdPrint className="text-lg" /> Imprimir
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-sm"
          >
            <MdDownload className="text-lg" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* PANEL DE FILTROS AVANZADOS (print:hidden) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5 print:hidden">
        <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">Filtros de Búsqueda Avanzada</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cilindro */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Código de Balón</label>
            <Select
              options={cylinderOptions}
              styles={selectStyles}
              isClearable
              isLoading={loadingCylinders}
              placeholder="Buscar Balón..."
              value={selectedCylinder}
              onChange={(opt) => setSelectedCylinder(opt)}
            />
          </div>

          {/* Paciente */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Paciente</label>
            <Select
              options={patientOptions}
              styles={selectStyles}
              isClearable
              isLoading={loadingPatients}
              placeholder="Buscar Paciente..."
              value={selectedPatient}
              onChange={(opt) => setSelectedPatient(opt)}
            />
          </div>

          {/* Servicio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Servicio / Hospitalización</label>
            <Select
              options={serviceOptions}
              styles={selectStyles}
              isClearable
              isLoading={loadingServices}
              placeholder="Buscar Servicio..."
              value={selectedService}
              onChange={(opt) => {
                setSelectedService(opt);
                setSelectedBed(null); // Resetear cama si cambia el servicio
              }}
            />
          </div>

          {/* Cama */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Cama</label>
            <Select
              options={bedOptions}
              styles={selectStyles}
              isClearable
              isLoading={loadingBeds}
              placeholder="Buscar Cama..."
              value={selectedBed}
              onChange={(opt) => setSelectedBed(opt)}
              isDisabled={!selectedService}
            />
          </div>

          {/* Proveedor */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Proveedor</label>
            <Select
              options={supplierOptions}
              styles={selectStyles}
              isClearable
              isLoading={loadingSuppliers}
              placeholder="Buscar Proveedor..."
              value={selectedSupplier}
              onChange={(opt) => setSelectedSupplier(opt)}
            />
          </div>

          {/* Código de Referencia */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Doc. Referencia / Código de Canje</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej. Guía, Vale, Código Canje..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 text-sm"
              />
            </div>
          </div>

          {/* Turno */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Turno</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 text-sm"
            >
              <option value="">Todos los Turnos</option>
              <option value="Morning">Mañana (Morning)</option>
              <option value="Afternoon">Tarde (Afternoon)</option>
              <option value="Night">Noche (Night)</option>
            </select>
          </div>

          {/* Rango de Fechas - Inicio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 text-sm"
            />
          </div>

          {/* Rango de Fechas - Fin */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 text-sm"
            />
          </div>
        </div>

        {/* Botonera de Filtros */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
          >
            <MdOutlineClear className="text-lg" /> Limpiar
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-sm"
          >
            <MdSearch className="text-lg" /> Buscar
          </button>
        </div>
      </div>

      {/* RESULTADOS DE MOVIMIENTOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:p-0">
        
        {loadingResults && (
          <div className="py-24 text-center space-y-4 print:hidden">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Cargando Historial...</p>
          </div>
        )}

        {!loadingResults && movementResults.length === 0 && (
          <div className="py-24 text-center max-w-md mx-auto space-y-4 print:hidden">
            <MdPropaneTank className="text-6xl text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-700">Sin movimientos registrados</h4>
              <p className="text-slate-500 text-sm">
                No se encontraron registros de movimientos o trasiegos con los filtros actuales en la base de datos.
              </p>
            </div>
          </div>
        )}

        {!loadingResults && movementResults.length > 0 && (
          <div className="overflow-x-auto">
            <table ref={reportRef} className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider print:bg-transparent">
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Turno</th>
                  <th className="px-6 py-4">Cilindro (Balón)</th>
                  <th className="px-6 py-4">Tipo Mov.</th>
                  <th className="px-6 py-4">Acción</th>
                  <th className="px-6 py-4">Estado Balón</th>
                  <th className="px-6 py-4">Ubicación / Destino</th>
                  <th className="px-6 py-4">Doc. Referencia</th>
                  <th className="px-6 py-4">Operario</th>
                  <th className="px-6 py-4">Obs / Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {movementResults.map((row) => {
                  const shiftInfo = translateShift(row.shift);
                  const isEntry = row.action === 'Ingreso';
                  const isRecarga = row.action === 'Recarga';

                  let actionBadge = 'bg-orange-50 text-orange-700 border-orange-200';
                  let actionIcon = <MdArrowUpward className="text-sm" />;
                  if (isEntry) {
                    actionBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    actionIcon = <MdArrowDownward className="text-sm" />;
                  } else if (isRecarga) {
                    actionBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                    actionIcon = <FaGasPump className="text-xs" />;
                  }

                  let typeColor = 'bg-slate-100 text-slate-700';
                  if (row.type === 'Intercambio') typeColor = 'bg-purple-100 text-purple-800';
                  else if (row.type.includes('Proveedor')) typeColor = 'bg-teal-100 text-teal-800';
                  else if (row.type.includes('Trasiego')) typeColor = 'bg-blue-100 text-blue-800';
                  else if (row.type.includes('Canje')) typeColor = 'bg-amber-100 text-amber-800';

                  let statusColor = 'bg-slate-50 text-slate-600 border-slate-200';
                  if (row.cylinder_status === 'full') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  else if (row.cylinder_status === 'empty') statusColor = 'bg-red-50 text-red-700 border-red-200';
                  else if (row.cylinder_status === 'in_use') statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  else if (row.cylinder_status === 'in_transit') statusColor = 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Fecha y Hora */}
                      <td className="px-6 py-4.5 whitespace-nowrap font-medium text-slate-800">
                        {row.date ? new Date(row.date).toLocaleString('es-PE') : '-'}
                      </td>

                      {/* Turno */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${shiftInfo.color}`}>
                          {shiftInfo.label}
                        </span>
                      </td>

                      {/* Cilindro */}
                      <td className="px-6 py-4.5">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-800 block">{row.cylinder.serial_number}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {row.cylinder.capacity} m³ • Prop: {row.cylinder.ownership_type}
                            {row.cylinder.barcode && ` • ${row.cylinder.barcode}`}
                          </span>
                        </div>
                      </td>

                      {/* Tipo Mov */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${typeColor}`}>
                          {row.type}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase flex items-center gap-1.5 w-fit ${actionBadge}`}>
                          {actionIcon} {row.action}
                        </span>
                      </td>

                      {/* Estado Balón */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${statusColor}`}>
                          {row.cylinder_status === 'full' ? 'Lleno' : 
                           row.cylinder_status === 'empty' ? 'Vacío' : 
                           row.cylinder_status === 'in_use' ? 'En Uso' : 
                           row.cylinder_status === 'in_transit' ? 'En Tránsito' : 
                           row.cylinder_status}
                        </span>
                      </td>

                      {/* Ubicación / Destino */}
                      <td className="px-6 py-4.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase">
                              {row.location.type}
                            </span>
                          </div>
                          <span className="font-bold text-slate-800 block uppercase">{row.location.name}</span>
                          {row.location.detail && (
                            <span className="text-[10px] text-slate-400 block font-medium">{row.location.detail}</span>
                          )}
                        </div>
                      </td>

                      {/* Doc. Referencia */}
                      <td className="px-6 py-4.5 whitespace-nowrap font-mono text-slate-600 font-semibold">
                        {row.reference_document}
                      </td>

                      {/* Operario */}
                      <td className="px-6 py-4.5 whitespace-nowrap font-medium text-slate-700">
                        {row.user}
                      </td>

                      {/* Obs / Notas */}
                      <td className="px-6 py-4.5 max-w-xs truncate text-slate-500 italic" title={row.notes}>
                        {row.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default MovementsReport;
