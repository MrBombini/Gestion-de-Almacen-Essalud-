import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { MdInsertChartOutlined, MdOutlineLocalGasStation, MdOutlineInventory2, MdLocalHospital, MdDateRange, MdTrendingUp, MdSwapHoriz, MdScience, MdPeople } from 'react-icons/md';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const { user, shift } = useAuth();
  const navigate = useNavigate();

  const { data: stats, loading, error } = useFetch('/dashboard/stats');

  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  // Procesar breakdown de central
  const breakdown = stats?.breakdown || [];
  
  // Extraer capacidades únicas (asegurando al menos 10, 8 y 6)
  let capacities = [...new Set([...breakdown.map(b => Number(b.capacity)), 10, 8, 6])].sort((a,b) => b - a);
  capacities = capacities.filter(c => c > 0);

  // Extraer propietarios únicos
  let owners = [...new Set(breakdown.map(b => b.ownership_type?.name || 'OTRO'))].sort();
  if (owners.length === 0) {
      owners = ['ESSALUD', 'B.PROPIO P', 'PERIFERIA'];
  }

  // Helper para buscar cantidad
  const getCount = (owner, cap, status) => {
      const match = breakdown.find(b => 
          (b.ownership_type?.name || 'OTRO') === owner && 
          Number(b.capacity) === cap && 
          b.status === status
      );
      return match ? match.total : 0;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header Profesional (Estilo ConsumptionDashboard) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-4">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <MdInsertChartOutlined className="text-3xl text-blue-300" />
              </div>
              <div>
                  <h1 className="text-3xl font-black tracking-tight">Hola, {user?.name} 👋</h1>
                  <p className="text-slate-400 font-medium mt-1">Panel de control principal del almacén</p>
              </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 bg-black/20 p-2 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                  <MdDateRange className="text-slate-400" />
                  <span className="text-sm font-semibold text-white capitalize">{today}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                  <span className="text-slate-500 font-bold">Turno:</span>
                  <span className="text-sm font-black text-blue-400 uppercase tracking-widest">{shift}</span>
              </div>
          </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Llenos en Central */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MdOutlineInventory2 className="text-xl" /></div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Balones Llenos</h3>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-5xl font-black text-slate-800 tracking-tighter">
                            {loading ? '...' : (stats?.full_central_count ?? 0)}
                        </span>
                        <span className="text-lg font-bold text-slate-400">cilindros</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 w-full text-xs font-bold text-emerald-600 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-100">
                Ubicados en Almacén Central (Disponibles)
            </div>
        </div>

        {/* Vacíos en Central */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><MdOutlineInventory2 className="text-xl" /></div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Balones Vacíos</h3>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-5xl font-black text-slate-800 tracking-tighter">
                            {loading ? '...' : (stats?.empty_central_count ?? 0)}
                        </span>
                        <span className="text-lg font-bold text-slate-400">cilindros</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 w-full text-xs font-bold text-orange-600 bg-orange-50 py-2 px-3 rounded-xl border border-orange-100">
                Ubicados en Almacén Central (Requieren Recarga)
            </div>
        </div>

        {/* Tanque Líquido */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-110"></div>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><MdOutlineLocalGasStation className="text-xl" /></div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tanque Criogénico</h3>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-5xl font-black text-slate-800 tracking-tighter">
                            {loading ? '...' : (stats?.tank_level ?? 0)}
                        </span>
                        <span className="text-lg font-bold text-slate-400">inH2O</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 w-full text-xs font-bold text-blue-600 bg-blue-50 py-2 px-3 rounded-xl border border-blue-100">
                Última lectura: {loading ? 'cargando...' : (stats?.last_reading_time ?? '—')}
            </div>
        </div>

      </div>

      {/* ── MATRIZ DE DESGLOSE EN CENTRAL ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><MdOutlineInventory2 className="text-xl" /></div>
              <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Desglose Exacto en Almacén Central</h3>
                  <p className="text-xs font-semibold text-slate-400">Inventario físico por capacidad y tipo de propiedad</p>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                      <tr>
                          <th className="px-4 py-3 bg-slate-50 border-b-2 border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest text-center" rowSpan="2">Propietario</th>
                          {capacities.map(cap => (
                              <th key={cap} className="px-4 py-2 bg-slate-50 border-b border-slate-200 border-l border-slate-200 text-sm font-black text-slate-700 text-center" colSpan="2">
                                  {cap} m³
                              </th>
                          ))}
                      </tr>
                      <tr>
                          {capacities.map(cap => (
                              <React.Fragment key={`sub-${cap}`}>
                                  <th className="px-2 py-2 bg-emerald-50/50 border-b-2 border-emerald-200 border-l border-slate-200 text-[10px] font-bold text-emerald-600 uppercase tracking-wider text-center w-20">Llenos</th>
                                  <th className="px-2 py-2 bg-orange-50/50 border-b-2 border-orange-200 text-[10px] font-bold text-orange-600 uppercase tracking-wider text-center w-20">Vacíos</th>
                              </React.Fragment>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {owners.map(owner => (
                          <tr key={owner} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-sm font-bold text-slate-700 border-r border-slate-100">{owner}</td>
                              {capacities.map(cap => {
                                  const full = getCount(owner, cap, 'full');
                                  const empty = getCount(owner, cap, 'empty');
                                  return (
                                      <React.Fragment key={`${owner}-${cap}`}>
                                          <td className={`px-2 py-3 text-center text-sm font-black border-l border-slate-100 ${full > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                              {loading ? '-' : full}
                                          </td>
                                          <td className={`px-2 py-3 text-center text-sm font-black ${empty > 0 ? 'text-orange-600' : 'text-slate-300'}`}>
                                              {loading ? '-' : empty}
                                          </td>
                                      </React.Fragment>
                                  );
                              })}
                          </tr>
                      ))}
                      {/* Fila de Totales */}
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                          <td className="px-4 py-3 text-sm font-black text-slate-800 text-right uppercase tracking-wider">Total</td>
                          {capacities.map(cap => {
                              const totalFull = owners.reduce((sum, owner) => sum + getCount(owner, cap, 'full'), 0);
                              const totalEmpty = owners.reduce((sum, owner) => sum + getCount(owner, cap, 'empty'), 0);
                              return (
                                  <React.Fragment key={`total-${cap}`}>
                                      <td className="px-2 py-3 text-center text-sm font-black text-emerald-700 border-l border-slate-200">
                                          {loading ? '-' : totalFull}
                                      </td>
                                      <td className="px-2 py-3 text-center text-sm font-black text-orange-700">
                                          {loading ? '-' : totalEmpty}
                                      </td>
                                  </React.Fragment>
                              );
                          })}
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>

      {/* Accesos Rápidos (Rediseñados) */}
      <h3 className="text-lg font-black text-slate-800 pt-4 px-2">Accesos Rápidos</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => navigate('/inventory/exchange')} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <MdSwapHoriz className="text-3xl" />
              </div>
              <span className="text-sm font-bold text-slate-700">Canje de Balones</span>
          </button>

          <button onClick={() => navigate('/inventory/decanting')} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-emerald-300 hover:shadow-md transition-all group">
              <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MdScience className="text-3xl" />
              </div>
              <span className="text-sm font-bold text-slate-700">Registrar Trasiego</span>
          </button>

          <button onClick={() => navigate('/liquid/daily')} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-purple-300 hover:shadow-md transition-all group">
              <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <MdTrendingUp className="text-3xl" />
              </div>
              <span className="text-sm font-bold text-slate-700">Lectura de Tanque</span>
          </button>

          <button onClick={() => navigate('/patients')} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-orange-300 hover:shadow-md transition-all group">
              <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <MdPeople className="text-3xl" />
              </div>
              <span className="text-sm font-bold text-slate-700">Gestión Pacientes</span>
          </button>
      </div>

    </div>
  );
};

export default Dashboard;