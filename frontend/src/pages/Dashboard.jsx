import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, shift } = useAuth();

  // Función para obtener la fecha formateada
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-6">
      
      {/* Mensaje de Bienvenida */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">
          Hola, {user?.name} 👋
        </h2>
        <p className="text-slate-500 mt-1 capitalize">
          {today} — Turno: <span className="font-semibold text-blue-600">{shift}</span>
        </p>
      </div>

      {/* Tarjetas de Resumen (Mocks/Placeholders por ahora) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-blue-500">
          <h3 className="text-slate-500 text-sm font-medium">Balones Llenos (Stock)</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">124</p>
          <p className="text-xs text-green-500 mt-2">↑ Disponible para despacho</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-orange-500">
          <h3 className="text-slate-500 text-sm font-medium">Balones Vacíos</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">45</p>
          <p className="text-xs text-orange-500 mt-2">Requieren ser enviados a planta</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-cyan-500">
          <h3 className="text-slate-500 text-sm font-medium">Tanque Líquido</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">82%</p>
          <p className="text-xs text-slate-400 mt-2">Última lectura: Hace 2 horas</p>
        </div>

      </div>

      {/* Sección de Accesos Rápidos */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Accesos Rápidos del Turno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition-colors group">
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🔄</span>
            <span className="font-semibold text-slate-700 group-hover:text-blue-700">Nuevo Intercambio</span>
          </button>
          <button className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition-colors group">
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">⛽</span>
            <span className="font-semibold text-slate-700 group-hover:text-blue-700">Registrar Trasiego</span>
          </button>
          <button className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition-colors group">
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">📝</span>
            <span className="font-semibold text-slate-700 group-hover:text-blue-700">Lectura de Líquido</span>
          </button>
          <button className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition-colors group">
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🛏️</span>
            <span className="font-semibold text-slate-700 group-hover:text-blue-700">Ver Pacientes</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;