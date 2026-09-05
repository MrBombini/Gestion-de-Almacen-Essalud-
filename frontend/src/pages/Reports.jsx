import { useState } from 'react';
import { 
  MdInsertChartOutlined, 
  MdTableView,
  MdDashboardCustomize,
  MdPrint,
  MdRefresh,
  MdEvent
} from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import KardexAttentionTable from '../components/KardexAttentionTable';
import ConsumptionDashboardTable from '../components/ConsumptionDashboardTable';
const Reports = () => {
  const [activeTab, setActiveTab] = useState('kardex');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Cargamos datos según el reporte activo
  const { data: kardexData, loading: loadingK, execute: refreshK } = useFetch(`/reports/daily-kardex?date=${date}`);
  const { data: dashboardData, loading: loadingD, execute: refreshD } = useFetch(`/reports/consumption-dashboard?date=${date}`);

  const handleRefresh = () => {
    if (activeTab === 'kardex') refreshK();
    else if (activeTab === 'dashboard') refreshD();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER DE REPORTES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl">
            <MdInsertChartOutlined className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Reportes Profesionales y Exportación</h2>
            <p className="text-slate-500 text-sm">Información real del sistema y descarga de reportes en Excel</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <MdEvent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            />
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
          >
            <MdRefresh className={`text-xl ${(loadingK || loadingD) ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-md"
          >
            <MdPrint /> Imprimir
          </button>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1 w-fit print:hidden">
        <button
          onClick={() => setActiveTab('kardex')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'kardex' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MdTableView className="text-lg" />
          Kardex de Atención
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MdDashboardCustomize className="text-lg" />
          Consumo Diario
        </button>
      </div>

      <div className="animate-fade-in print:mt-0">
        {activeTab === 'kardex' && (
            loadingK ? <p className="text-center py-20 font-bold text-slate-400 uppercase tracking-widest">Generando Kardex...</p> : <KardexAttentionTable data={kardexData} date={date} />
        )}
        {activeTab === 'dashboard' && (
            loadingD ? <p className="text-center py-20 font-bold text-slate-400 uppercase tracking-widest">Calculando Consumo...</p> : <ConsumptionDashboardTable data={dashboardData} date={date} />
        )}
      </div>

    </div>
  );
};

export default Reports;
