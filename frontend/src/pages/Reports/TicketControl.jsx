import { useState, useRef } from 'react';
import { MdPrint, MdDownload, MdSearch, MdReceipt } from 'react-icons/md';
import useFetch from '../../hooks/useFetch';

const ControlAtencion = () => {
  // 1. Usamos tu custom hook para traer el historial del Kardex
  const { data: kardexData, loading, error } = useFetch('/reports/kardex');
  
  // Extraemos la lista de forma segura (Laravel suele envolver colecciones en 'data')
  const kardexList = Array.isArray(kardexData) ? kardexData : (kardexData?.data || []);

  // Filtramos solo los movimientos que son Intercambios (Exchange) con pacientes
  const exchanges = kardexList.filter(mov => mov.type === 'Exchange' && mov.patient);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const ticketRef = useRef(null);

  // Filtrado rápido por número de ticket o nombre del paciente
  const filteredExchanges = exchanges.filter(mov => 
    mov.id.toString().includes(searchTerm) || 
    mov.patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  // FUNCIÓN 1: IMPRIMIR (Formato Ticketera 80mm)
  // ==========================================
  const handlePrint = () => {
    if (!ticketRef.current) return;
    const printContent = ticketRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Control de Atención N° ${selectedTicket.id}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 10px;
              color: #000;
              width: 80mm; /* Ancho estándar de ticketera */
            }
            .ticket-header { text-align: center; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 5px;}
            .line { margin-bottom: 8px; font-size: 14px; }
            .bold { font-weight: bold; }
            table { text-align: left; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; width: 100%; font-size: 14px;}
            th { border-bottom: 1px dashed #000; padding-bottom: 5px; text-decoration: underline; }
            td { padding: 5px 0; }
            .signatures { margin-top: 30px; width: 100%; font-size: 14px;}
            .sign-line { border-top: 1px solid #000; padding-top: 5px; margin-bottom: 5px;}
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
    // Forzamos la extensión .xls
    fileDownload.download = `Control_Atencion_${selectedTicket.id}.xls`;
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
            Impresión y exportación de controles de atención a pacientes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Buscador y Lista */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
              <MdSearch className="text-slate-400 text-xl" />
              <input 
                type="text" 
                placeholder="Buscar N° Atención o Paciente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {loading && <div className="text-center p-4 text-slate-500">Cargando atenciones...</div>}
            {error && <div className="text-center p-4 text-red-500">{error}</div>}
            {!loading && filteredExchanges.map(mov => (
              <button
                key={mov.id}
                onClick={() => setSelectedTicket(mov)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedTicket?.id === mov.id 
                    ? 'bg-indigo-50 border-indigo-200' 
                    : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800">N° {mov.id}</span>
                  <span className="text-xs font-semibold text-slate-500">{new Date(mov.movement_at).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="text-sm text-slate-600 line-clamp-1">{mov.patient?.full_name}</div>
              </button>
            ))}
            {!loading && filteredExchanges.length === 0 && (
              <div className="text-center p-4 text-slate-400 text-sm">No se encontraron registros.</div>
            )}
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
                {/* BOTÓN CAMBIADO PARA EXCEL (Color Esmeralda) */}
                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                  <MdDownload className="text-lg" /> Excel
                </button>
              </div>

              {/* TICKET FÍSICO (Idéntico a la imagen) */}
              <div className="bg-white p-8 rounded-sm shadow-xl w-full max-w-[400px] border border-slate-200 mt-10">
                <div ref={ticketRef} className="text-black font-sans">
                  
                  {/* Cabecera */}
                  <div className="ticket-header" style={{ textAlign: 'center', borderBottom: '1px solid black', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>CONTROL DE ATENCIÓN N° {selectedTicket.id}</h3>
                  </div>

                  {/* Datos del Paciente */}
                  <div className="line" style={{ marginBottom: '8px', fontSize: '14px' }}>
                    <span className="bold" style={{ fontWeight: 'bold' }}>Paciente:</span> {patient.full_name || '-'}
                  </div>
                  <div className="line" style={{ marginBottom: '8px', fontSize: '14px' }}>
                    <span className="bold" style={{ fontWeight: 'bold' }}>Cod. Paciente:</span> {patient.exchange_code || patient.dni || patient.id || '-'}
                  </div>
                  <div className="line" style={{ marginBottom: '15px', fontSize: '14px' }}>
                    <span className="bold" style={{ fontWeight: 'bold' }}>Dirección:</span> {patient.address || '-'}
                  </div>

                  {/* Tabla de Cilindros */}
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
                    <thead>
                      <tr>
                        <th style={{ borderBottom: '1px dashed black', paddingBottom: '5px', textDecoration: 'underline' }}>Cod.</th>
                        <th style={{ borderBottom: '1px dashed black', paddingBottom: '5px', textDecoration: 'underline' }}>Prop.</th>
                        <th style={{ borderBottom: '1px dashed black', paddingBottom: '5px', textDecoration: 'underline' }}>Cap.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ paddingTop: '10px', paddingBottom: '5px' }}>
                          B. LLENO: <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{cylinderOut.serial_number || 'N/A'}</span>
                        </td>
                        <td style={{ paddingTop: '10px', paddingBottom: '5px' }}>{cylinderOut.ownership_type_name || 'N/A'}</td>
                        <td style={{ paddingTop: '10px', paddingBottom: '5px' }}>{cylinderOut.capacity ? `${cylinderOut.capacity} m3` : '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                          B. VACÍO: <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{cylinderIn.serial_number || 'N/A'}</span>
                        </td>
                        <td style={{ paddingTop: '5px', paddingBottom: '5px' }}>{cylinderIn.ownership_type_name || 'N/A'}</td>
                        <td style={{ paddingTop: '5px', paddingBottom: '5px' }}>{cylinderIn.capacity ? `${cylinderIn.capacity} m3` : '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Operador y Fecha */}
                  <div className="line" style={{ marginBottom: '8px', fontSize: '14px' }}>
                    <span className="bold" style={{ fontWeight: 'bold' }}>Operador:</span> {user.name || '-'}
                  </div>
                  <div className="line" style={{ marginBottom: '30px', fontSize: '14px' }}>
                    <span className="bold" style={{ fontWeight: 'bold' }}>Fecha:</span> {formattedDate}
                  </div>

                  {/* Firmas (Espacio en blanco) */}
                  <div className="signatures" style={{ marginTop: '40px', width: '250px', marginLeft: 'auto', marginRight: 'auto' }}>
                    <div className="sign-line" style={{ borderTop: '1px solid black', paddingTop: '5px', fontSize: '14px' }}>
                      <span className="bold" style={{ fontWeight: 'bold' }}>Nombre:</span> 
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '14px' }}>
                      <span className="bold" style={{ fontWeight: 'bold' }}>Cel:</span> 
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