import { useState } from 'react';
import { 
  MdSearch,
  MdSwapHoriz,
  MdDownload,
  MdAssignment
} from 'react-icons/md';
import MovementsReport from '../MovementsReport';
import TrasiegosReport from '../TrasiegosReport';
import ExcelExportsPanel from '../../components/ExcelExportsPanel';

const UnifiedMovements = () => {
  const [activeTab, setActiveTab] = useState('movements');

  return (
    <div className="space-y-6">
      
      {/* HEADER DE UNIFICADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-xl">
            <MdAssignment className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Búsqueda y Exportación</h2>
            <p className="text-slate-500 text-sm">Historial integral de movimientos, trasiegos y descarga de datos.</p>
          </div>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1 w-fit print:hidden overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'movements' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MdSearch className="text-lg" />
          Búsqueda de Movimientos
        </button>
        <button
          onClick={() => setActiveTab('trasiegos')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'trasiegos' 
              ? 'bg-purple-600 text-white shadow-md shadow-purple-100' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MdSwapHoriz className="text-lg" />
          Reporte de Trasiegos
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'export' 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MdDownload className="text-lg" />
          Exportación a Excel
        </button>
      </div>

      {/* CONTENIDO DEL REPORTE */}
      <div className="animate-fade-in print:mt-0">
        {/* MovementsReport y TrasiegosReport ya tienen sus propios contenedores principales (max-w-7xl mx-auto). 
            Al renderizarlos condicionalmente, tomarán el ancho disponible. */}
        <div className={activeTab === 'movements' ? 'block' : 'hidden'}>
          <MovementsReport />
        </div>
        <div className={activeTab === 'trasiegos' ? 'block' : 'hidden'}>
          <TrasiegosReport />
        </div>
        {activeTab === 'export' && (
          <div className="max-w-7xl mx-auto pb-12">
            <ExcelExportsPanel />
          </div>
        )}
      </div>

    </div>
  );
};

export default UnifiedMovements;
