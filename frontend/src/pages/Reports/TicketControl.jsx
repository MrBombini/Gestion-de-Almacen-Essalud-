import { useState, useRef, useEffect } from 'react';
import { MdPrint, MdDownload, MdSearch, MdReceipt, MdDateRange, MdNavigateBefore, MdNavigateNext, MdOutlineClear } from 'react-icons/md';
import useFetch from '../../hooks/useFetch';

// Obtiene la fecha local de Perú exacta YYYY-MM-DD
const getLocalYYYYMMDD = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
};

const ControlAtencion = () => {
  const [selectedDate, setSelectedDate] = useState(getLocalYYYYMMDD());
  const [filterByDate, setFilterByDate] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const ticketRef = useRef(null);

  // Debounce para la búsqueda en servidor
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Construir URL reactiva
  const queryParams = new URLSearchParams();
  queryParams.append('type', 'Exchange');
  queryParams.append('page', currentPage);
  queryParams.append('per_page', 20);
  if (filterByDate && selectedDate) {
    queryParams.append('date', selectedDate);
  }
  if (debouncedSearch) {
    queryParams.append('search', debouncedSearch);
  }

  const { data: responseData, loading, error, execute } = useFetch(`/reports/kardex?${queryParams.toString()}`);

  useEffect(() => {
    execute({ url: `/reports/kardex?${queryParams.toString()}` });
  }, [selectedDate, filterByDate, debouncedSearch, currentPage]);

  const rawList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
  const exchanges = rawList.filter(mov => mov.type === 'Exchange' && mov.patient);

  const paginationMeta = responseData && responseData.total !== undefined ? {
    currentPage: responseData.current_page || 1,
    lastPage: responseData.last_page || 1,
    total: responseData.total || 0,
    perPage: responseData.per_page || 20
  } : {
    currentPage: 1,
    lastPage: 1,
    total: exchanges.length,
    perPage: 20
  };

  // Auto-seleccionar el primer ticket si no hay uno seleccionado
  useEffect(() => {
    if (exchanges.length > 0 && !selectedTicket) {
      setSelectedTicket(exchanges[0]);
    }
  }, [exchanges]);

  // ==========================================
  // EXTRACCIÓN SEGURA DE DATOS PARA EL TICKET
  // ==========================================
  const patient = selectedTicket?.patient || {};
  const user = selectedTicket?.user || {};

  // Formateo de fecha al estilo YYYY/MM/DD
  const rawDate = selectedTicket?.movement_at ? new Date(selectedTicket.movement_at) : new Date();
  const formattedDate = `${rawDate.getFullYear()}/${String(rawDate.getMonth() + 1).padStart(2, '0')}/${String(rawDate.getDate()).padStart(2, '0')}`;

  // Buscar cilindros: Entry (Vacío que devuelve) y Exit (Lleno que se lleva)
  const cylinderMovements = selectedTicket?.cylinder_movements || [];
  const cylinderOut = cylinderMovements.find(m => m.action === 'Exit')?.cylinder || {};
  const cylinderIn = cylinderMovements.find(m => m.action === 'Entry')?.cylinder || {};

  // ==========================================
  // FUNCIÓN 1: IMPRIMIR (Formato Etiqueta 76*76mm)
  // ==========================================
  const handlePrint = () => {
    if (!ticketRef.current) return;
    const printContent = ticketRef.current.outerHTML;
    const printWindow = window.open('', '', 'width=400,height=600');
    const attentionNum = selectedTicket.attention_number || selectedTicket.id;
    printWindow.document.write(`
      <html>
        <head>
          <title>Control de Atención N° ${attentionNum}</title>
          <style>
            @page {
              size: 76mm 76mm;
              margin: 0 !important;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 4mm 4mm;
              color: #000;
              width: 74mm;
              height: 74mm;
              box-sizing: border-box;
              font-size: 11px;
              line-height: 1.3;
              overflow: hidden;
            }
            .ticket-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }
            .ticket-header { 
              text-align: center; 
              border-bottom: 1.5px solid #000; 
              margin-bottom: 5px;
              padding-bottom: 3px;
            }
            .ticket-header h3 {
              margin: 0;
              font-size: 14px;
              font-weight: bold;
            }
            .ticket-body {
              flex-grow: 1;
            }
            .line { 
              margin-bottom: 3px; 
              font-size: 11px; 
            }
            .bold { 
              font-weight: bold; 
            }
            table { 
              text-align: left; 
              border-collapse: collapse; 
              margin-top: 4px; 
              margin-bottom: 4px; 
              width: 100%; 
              font-size: 10.5px;
            }
            th { 
              border-bottom: 1px dashed #000; 
              padding-bottom: 2px; 
              font-weight: bold;
              text-decoration: underline;
            }
            td { 
              padding: 3px 0; 
            }
            .cylinder-number {
              font-weight: bold;
              font-size: 12px;
            }
            .footer-info { 
              font-size: 9.5px; 
            }
            .signatures { 
              width: 38mm; 
              font-size: 9.5px;
              text-align: left; 
            }
            .sign-line { 
              border-top: 1px solid #000; 
              padding-top: 2px;
              margin-top: 10px;
            }
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
  // FUNCIÓN 2: EXPORTAR A MS EXCEL (.xls)
  // ==========================================
  const handleExportExcel = () => {
    if (!ticketRef.current) return;

    const attentionNum = selectedTicket.attention_number || selectedTicket.id;
    // Usamos el formato nativo compatible con Excel para reconocer tablas desde HTML
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
    const sourceHTML = header + ticketRef.current.innerHTML + footer;

    // Cambiamos el tipo MIME a application/vnd.ms-excel
    const source = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    // Forzamos la extensión .xls con el número correlativo
    fileDownload.download = `Control_Atencion_N${attentionNum}.xls`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="space-y-6">

      {/* Cabecera Principal */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
          <MdReceipt className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Generador de Tickets</h2>
          <p className="text-slate-500 text-sm mt-1">
            Impresión y exportación de controles de atención correlativos a pacientes PADOMI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: Selector de Fecha, Buscador, Lista y Paginación */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[650px]">
          
          {/* Cabecera de Filtros */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
            {/* Selector de Fecha */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
                <MdDateRange className="text-slate-400 text-base shrink-0" />
                <input
                  type="date"
                  disabled={!filterByDate}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`bg-transparent border-none outline-none text-xs w-full font-bold ${filterByDate ? 'text-slate-700' : 'text-slate-300'}`}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterByDate(!filterByDate);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  filterByDate
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-indigo-600 text-white border-indigo-600'
                }`}
              >
                {filterByDate ? 'Por Fecha' : 'Ver Todo'}
              </button>
            </div>

            {/* Buscador Global (N° Atención, Ticket o Paciente) */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
              <MdSearch className="text-slate-400 text-lg shrink-0" />
              <input
                type="text"
                placeholder="Buscar N° Atención (1, 2, 3...), DNI, Paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-700 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <MdOutlineClear className="text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Atenciones */}
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {loading && (
              <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-2"></div>
                Cargando atenciones...
              </div>
            )}
            {error && <div className="text-center p-4 text-red-500 text-xs font-bold">{error}</div>}
            
            {!loading && exchanges.map(mov => (
              <button
                key={mov.id}
                onClick={() => setSelectedTicket(mov)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedTicket?.id === mov.id
                    ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                    : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-xs">
                    N° {mov.attention_number || mov.id}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {new Date(mov.movement_at).toLocaleDateString('es-PE')}
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-semibold line-clamp-1">
                  {mov.patient?.full_name || 'Paciente sin nombre'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex justify-between">
                  <span>DNI: {mov.patient?.dni || '-'}</span>
                  <span>Cód: {mov.patient?.exchange_code || '-'}</span>
                </div>
              </button>
            ))}

            {!loading && exchanges.length === 0 && (
              <div className="text-center p-8 text-slate-400 text-xs">
                No se encontraron atenciones con los filtros actuales.
              </div>
            )}
          </div>

          {/* Barra de Paginación (20 por página) */}
          <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">
              Pág. <span className="font-bold">{paginationMeta.currentPage}</span> de <span className="font-bold">{paginationMeta.lastPage}</span> ({paginationMeta.total} total)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={paginationMeta.currentPage <= 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded-lg border bg-white border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold"
                title="Anterior"
              >
                <MdNavigateBefore className="text-base" />
              </button>
              <button
                type="button"
                disabled={paginationMeta.currentPage >= paginationMeta.lastPage || loading}
                onClick={() => setCurrentPage(prev => Math.min(paginationMeta.lastPage, prev + 1))}
                className="p-1 rounded-lg border bg-white border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold"
                title="Siguiente"
              >
                <MdNavigateNext className="text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Visualizador del Ticket */}
        <div className="lg:col-span-2 bg-slate-100 rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[600px] relative">

          {!selectedTicket ? (
            <div className="text-slate-400 text-center">
              <MdReceipt className="text-6xl mx-auto mb-4 opacity-50" />
              <p>Selecciona una atención de la lista para ver el ticket.</p>
            </div>
          ) : (
            <>
              {/* Botonera Flotante */}
              <div className="absolute top-6 right-6 flex gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                  <MdPrint className="text-lg" /> Imprimir
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                  <MdDownload className="text-lg" /> Excel
                </button>
              </div>

              {/* TICKET FÍSICO */}
              <div className="bg-white p-6 rounded-sm shadow-xl w-full max-w-[360px] border border-slate-200 mt-10">
                <div ref={ticketRef} className="ticket-container text-black font-sans">

                  {/* Cabecera */}
                  <div className="ticket-header border-b-2 border-black pb-1 mb-2 text-center">
                    <h3 className="text-sm font-bold tracking-wide">
                      CONTROL DE ATENCIÓN N° {selectedTicket.attention_number || selectedTicket.id}
                    </h3>
                  </div>

                  {/* Cuerpo */}
                  <div className="ticket-body">
                    {/* Datos del Paciente */}
                    <div className="line text-xs mb-1">
                      <span className="bold font-bold">Paciente:</span> {patient.full_name || '-'}
                    </div>
                    <div className="line text-xs mb-1">
                      <span className="bold font-bold">Cod. Paciente:</span> {patient.exchange_code || patient.dni || patient.id || '-'}
                    </div>
                    <div className="line text-xs mb-2">
                      <span className="bold font-bold">Dirección:</span> {patient.address || '-'}
                    </div>

                    {/* Tabla de Cilindros */}
                    <table className="w-full text-left border-collapse my-2 text-xs">
                      <thead>
                        <tr>
                          <th className="border-b border-dashed border-black pb-1 underline font-bold">Cod.</th>
                          <th className="border-b border-dashed border-black pb-1 underline font-bold">Prop.</th>
                          <th className="border-b border-dashed border-black pb-1 underline font-bold">Cap.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1">
                            B. LLENO: <span className="cylinder-number font-bold text-sm">{cylinderOut.serial_number || 'N/A'}</span>
                          </td>
                          <td className="py-1">{cylinderOut.ownership_type_name || 'N/A'}</td>
                          <td className="py-1">{cylinderOut.capacity ? `${cylinderOut.capacity} m3` : '-'}</td>
                        </tr>
                        <tr>
                          <td className="py-1">
                            B. VACÍO: <span className="cylinder-number font-bold text-sm">{cylinderIn.serial_number || 'N/A'}</span>
                          </td>
                          <td className="py-1">{cylinderIn.ownership_type_name || 'N/A'}</td>
                          <td className="py-1">{cylinderIn.capacity ? `${cylinderIn.capacity} m3` : '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Pie de página */}
                  <div className="ticket-footer flex justify-between items-end mt-2 pt-2 border-t border-dashed border-slate-200">
                    <div className="footer-info text-[10px]">
                      <div className="line mb-0.5">
                        <span className="bold font-bold">Operador:</span> {user.name || '-'}
                      </div>
                      <div className="line mb-0">
                        <span className="bold font-bold">Fecha:</span> {formattedDate}
                      </div>
                    </div>

                    <div className="signatures w-32 text-[10px]">
                      <div className="sign-line border-t border-black pt-1">
                        <div className="mb-0.5"><span className="bold font-bold">Nombre:</span></div>
                        <div><span className="bold font-bold">Cel:</span></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlAtencion;