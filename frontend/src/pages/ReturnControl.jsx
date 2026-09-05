import { useState, useEffect } from 'react';
import { MdPrint, MdSearch, MdDateRange, MdNavigateBefore, MdNavigateNext, MdOutlineClear, MdSettingsBackupRestore, MdLocalHospital, MdPerson } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { printReturnReceipt } from '../utils/printTemplates';

const getLocalYYYYMMDD = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
};

const ReturnControl = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getLocalYYYYMMDD());
  const [filterByDate, setFilterByDate] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Debounce para búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = new URLSearchParams();
  queryParams.append('type', 'PatientReturn');
  queryParams.append('page', currentPage);
  queryParams.append('per_page', 20);
  if (filterByDate && selectedDate) {
    queryParams.append('date', selectedDate);
  }
  if (debouncedSearch) {
    queryParams.append('search', debouncedSearch);
  }

  const { data: responseData, loading, execute } = useFetch(`/reports/kardex?${queryParams.toString()}`);

  useEffect(() => {
    execute({ url: `/reports/kardex?${queryParams.toString()}` });
  }, [selectedDate, filterByDate, debouncedSearch, currentPage]);

  const rawList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
  const returns = rawList.filter(mov => mov.type === 'PatientReturn');

  const paginationMeta = responseData && responseData.total !== undefined ? {
    currentPage: responseData.current_page || 1,
    lastPage: responseData.last_page || 1,
    total: responseData.total || 0,
    perPage: responseData.per_page || 20
  } : {
    currentPage: 1,
    lastPage: 1,
    total: returns.length,
    perPage: 20
  };

  useEffect(() => {
    if (returns.length > 0 && !selectedReturn) {
      setSelectedReturn(returns[0]);
    } else if (returns.length === 0) {
      setSelectedReturn(null);
    }
  }, [returns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl">
          <MdSettingsBackupRestore className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control de Devoluciones</h2>
          <p className="text-slate-500 text-sm mt-1">
            Historial de devoluciones de cilindros de pacientes PADOMI e impresión de constancias.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LADO IZQUIERDO: Filtros y Lista */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[650px]">
          
          {/* Filtros */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
                <MdDateRange className="text-slate-400 text-base shrink-0" />
                <input
                  type="date"
                  className="w-full text-xs outline-none bg-transparent font-medium text-slate-700"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setFilterByDate(true);
                  }}
                  disabled={!filterByDate}
                />
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-300 text-xs shrink-0">
                <input
                  type="checkbox"
                  checked={filterByDate}
                  onChange={(e) => setFilterByDate(e.target.checked)}
                  className="accent-rose-500"
                />
                <span className="text-slate-600 font-bold select-none">Filtrar Fecha</span>
              </label>
            </div>

            <div className="relative">
              <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="Buscar paciente, DNI, o código..."
                className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <MdOutlineClear />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Devoluciones */}
          <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium animate-pulse">
                Cargando devoluciones...
              </div>
            ) : returns.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium bg-white border border-dashed border-slate-200 rounded-xl m-2">
                No se encontraron devoluciones para los filtros aplicados.
              </div>
            ) : (
              <div className="space-y-1.5">
                {returns.map(ret => (
                  <button
                    key={ret.id}
                    onClick={() => setSelectedReturn(ret)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedReturn?.id === ret.id
                        ? 'bg-rose-50 border-rose-400 shadow-sm ring-1 ring-rose-400'
                        : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-sm truncate pr-2">
                        {ret.patient?.full_name || 'Sin Nombre'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {ret.movement_at ? ret.movement_at.substring(11, 16) : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-slate-500 gap-1.5 mb-1.5">
                      <MdPerson className="text-slate-400" />
                      <span>{ret.patient?.exchange_code || ret.patient?.dni}</span>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full uppercase truncate max-w-[150px]">
                        {ret.reason || 'S/M'}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-600">
                        OP: {String(ret.id).padStart(5, '0')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Paginación */}
          <div className="p-2.5 border-t border-slate-200 bg-white flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={paginationMeta.currentPage === 1 || loading}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <MdNavigateBefore className="text-xl" />
            </button>
            <div className="text-xs font-bold text-slate-600">
              Página {paginationMeta.currentPage} de {paginationMeta.lastPage} <span className="text-slate-400 font-normal ml-1">({paginationMeta.total})</span>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(paginationMeta.lastPage, p + 1))}
              disabled={paginationMeta.currentPage === paginationMeta.lastPage || loading}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <MdNavigateNext className="text-xl" />
            </button>
          </div>
        </div>

        {/* LADO DERECHO: Detalle y Botón de Imprimir */}
        <div className="lg:col-span-2 flex flex-col items-center">
          {selectedReturn ? (
            <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-500 to-red-500" />
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold mb-3 shadow-inner">
                  <MdLocalHospital />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Constancia de Devolución</h3>
                <p className="text-slate-500 font-mono text-sm mt-1">Operación N° {selectedReturn.id}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Paciente</p>
                  <p className="font-bold text-slate-800">{selectedReturn.patient?.full_name}</p>
                  <p className="text-sm text-slate-500">DNI: {selectedReturn.patient?.dni}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Fecha</p>
                    <p className="font-semibold text-slate-700">
                      {selectedReturn.movement_at ? new Date(selectedReturn.movement_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Motivo</p>
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg uppercase">
                      {selectedReturn.reason}
                    </span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Balón Devuelto</p>
                  <p className="font-bold text-lg text-slate-800 font-mono">
                    {selectedReturn.cylinder_movements?.[0]?.cylinder?.serial_number || 'S/M'} 
                    <span className="text-sm text-slate-500 ml-2 font-sans font-normal">
                      ({selectedReturn.cylinder_movements?.[0]?.cylinder?.capacity || ''} m³)
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => printReturnReceipt(selectedReturn, user)}
                  className="w-full group relative px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-rose-700 transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden flex items-center justify-center gap-3"
                >
                  <div className="relative z-10 flex items-center gap-2">
                    <MdPrint className="text-2xl group-hover:scale-110 transition-transform" /> 
                    IMPRIMIR CONSTANCIA
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 text-center px-4">
              <MdSettingsBackupRestore className="text-6xl mb-4 opacity-20" />
              <p className="font-bold text-lg text-slate-500">Seleccione una Devolución</p>
              <p className="text-sm max-w-sm mt-2">Elija un registro de la lista de la izquierda para ver los detalles y generar la constancia de devolución.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReturnControl;
