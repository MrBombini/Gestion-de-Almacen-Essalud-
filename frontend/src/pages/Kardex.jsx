import { useState, useMemo } from 'react';
import { MdInsertChartOutlined, MdSearch, MdFilterList, MdDownload } from 'react-icons/md';
import useFetch from '../hooks/useFetch';

const Kardex = () => {
  const { data: kardexData, loading, error } = useFetch('/reports/kardex');
  
  // Extraemos el array principal (por si Laravel usa paginación)
  const rawData = Array.isArray(kardexData) ? kardexData : (kardexData?.data || []);

  // 1. APLANAR LOS DATOS (Flattening)
  // Convertimos la estructura Cabecera-Detalle en filas individuales para la tabla
  const flattenedKardex = useMemo(() => {
    const flatList = [];
    
    rawData.forEach(operation => {
      // Si la operación tiene movimientos de cilindros, los desglosamos
      if (operation.cylinder_movements && operation.cylinder_movements.length > 0) {
        operation.cylinder_movements.forEach(mov => {
          flatList.push({
            // Creamos un ID único combinando la operación y el movimiento
            unique_id: `${operation.id}-${mov.id}`,
            date: operation.movement_at || operation.created_at,
            shift: operation.shift,
            type: operation.type, // Ej: Exchange, Decanting
            action: mov.action,   // Ej: Entry, Exit
            cylinder_sn: mov.cylinder?.serial_number || 'N/A',
            capacity: mov.cylinder?.capacity,
            status: mov.cylinder_status, // empty, full, in_use
            user_name: operation.user?.name || 'Sistema',
            patient_name: operation.patient?.full_name,
            service_name: operation.service?.name,
            document: operation.reference_document
          });
        });
      }
    });
    
    return flatList;
  }, [rawData]);

  const [searchTerm, setSearchTerm] = useState('');

  // 2. FILTRAR LOS DATOS APLANADOS
  const filteredKardex = flattenedKardex.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.cylinder_sn.toLowerCase().includes(search) ||
      item.type.toLowerCase().includes(search) ||
      item.action.toLowerCase().includes(search) ||
      item.user_name.toLowerCase().includes(search) ||
      (item.patient_name && item.patient_name.toLowerCase().includes(search)) ||
      (item.service_name && item.service_name.toLowerCase().includes(search))
    );
  });

  // Funciones visuales para los badges (etiquetas)
  const getActionBadge = (action) => {
    if (action === 'Entry') return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold text-xs uppercase">Entrada</span>;
    if (action === 'Exit') return <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-bold text-xs uppercase">Salida</span>;
    return <span>{action}</span>;
  };

  const getStatusBadge = (status) => {
    if (status === 'full') return <span className="text-blue-600 font-bold uppercase text-xs">Lleno</span>;
    if (status === 'empty') return <span className="text-red-600 font-bold uppercase text-xs">Vacío</span>;
    return <span className="text-slate-600 font-bold uppercase text-xs">{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800 text-white rounded-lg">
            <MdInsertChartOutlined className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Kardex General</h2>
            <p className="text-slate-500 text-sm mt-1">Historial detallado de movimientos por cilindro.</p>
          </div>
        </div>
        
        <button 
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
          onClick={() => alert('La exportación a Excel se conectará con el endpoint del backend.')}
        >
          <MdDownload className="text-xl" />
          Exportar Excel
        </button>
      </div>

      {/* Contenedor Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Barra de Búsqueda */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-96 bg-white px-4 py-2 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
            <MdSearch className="text-slate-400 text-xl" />
            <input 
              type="text" 
              placeholder="Buscar por serie, operación, paciente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <MdFilterList className="text-lg" />
            <span>Mostrando: {filteredKardex.length} movimientos</span>
          </div>
        </div>

        {loading && flattenedKardex.length === 0 && (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-500 font-medium bg-red-50 m-4 rounded-lg">
            Error al cargar el Kardex: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                  <th className="px-6 py-4 font-semibold">Operación</th>
                  <th className="px-6 py-4 font-semibold">Cilindro</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold">Origen / Destino</th>
                  <th className="px-6 py-4 font-semibold">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKardex.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      No se encontraron movimientos.
                    </td>
                  </tr>
                ) : (
                  filteredKardex.map((item) => (
                    <tr key={item.unique_id} className="hover:bg-slate-50 transition-colors text-sm">
                      
                      {/* Fecha y Hora */}
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {new Date(item.date).toLocaleString('es-PE')}
                      </td>
                      
                      {/* Operación y Acción (Ej: Exchange + Entry) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800">{item.type}</span>
                          <div>{getActionBadge(item.action)}</div>
                        </div>
                      </td>
                      
                      {/* N° Serie y Capacidad */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-slate-700">{item.cylinder_sn}</span>
                          <span className="text-xs text-slate-500">{item.capacity} m³</span>
                        </div>
                      </td>
                      
                      {/* Estado Físico (Full/Empty) */}
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* A quién se le entregó o de dónde vino */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {item.patient_name && (
                            <span className="text-slate-700"><span className="text-xs text-slate-400 mr-1">Pac:</span>{item.patient_name}</span>
                          )}
                          {item.service_name && (
                            <span className="text-indigo-600 font-medium"><span className="text-xs text-indigo-300 mr-1">Serv:</span>{item.service_name}</span>
                          )}
                          {item.document && (
                            <span className="text-xs text-slate-500 mt-1">Doc: {item.document}</span>
                          )}
                          {!item.patient_name && !item.service_name && (
                            <span className="text-slate-400 italic">Almacén General</span>
                          )}
                        </div>
                      </td>

                      {/* Usuario y Turno */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start">
                          <span className="text-slate-700 font-medium">{item.user_name}</span>
                          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs mt-1 font-semibold">
                            {item.shift}
                          </span>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Kardex;