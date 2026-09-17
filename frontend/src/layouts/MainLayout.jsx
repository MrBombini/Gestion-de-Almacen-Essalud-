import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { MdMenu, MdLogout, MdNotifications } from 'react-icons/md';

// Mapa de rutas a títulos legibles
const PAGE_TITLES = {
  '/': 'Dashboard',
  '/patients': 'Gestión de Pacientes',
  '/services': 'Servicios',
  '/cylinders': 'Cilindros / Balones',
  '/suppliers': 'Proveedores',
  '/ownership-types': 'Tipos de Propiedad',
  '/authorities': 'Autoridades / Entidades',
  '/beds': 'Camas',
  '/inventory/exchange': 'Intercambio PADOMI',
  '/inventory/decanting': 'Trasiego (Cascada)',
  '/inventory/loan-return': 'Préstamos / Terceros',
  '/inventory/return-control': 'Control de Devoluciones',
  '/inventory/supplier': 'Movimiento Proveedor',
  '/inventory/periphery': 'Periferia / Centros Médicos',
  '/inventory/warehouse-transfer': 'Traslado Interno',
  '/liquid/daily': 'Lectura Diaria de Tanque',
  '/liquid/refill': 'Recarga de Cisterna',
  '/reports/ticketcontrol': 'Control de Atención',
  '/reports/control-format': 'Formatos de Control',
  '/reports/supplier': 'Reporte de Proveedores',
  '/reports/periphery': 'Reporte de Periferia',
  '/reports/consumption': 'Dashboard de Consumo',
  '/reports/alerts': 'Alertas de Pacientes',
  '/reports/kardexresume': 'Resumen de Kardex',
  '/reports/kardex': 'Kardex General',
  '/reports/hospitalization-control': 'Control de Hospitalización',
  '/reports/cylinder-tracking': 'Seguimiento de Cilindros',
  '/reports/unified-search': 'Búsqueda y Exportación',
  '/reports/executive': 'Reporte Gerencial',
  '/admin/reports': 'Administración de Reportes',
  '/admin/users': 'Gestión de Usuarios',
};

// Badge de turno con color según el turno activo
const ShiftBadge = ({ shift }) => {
  const config = {
    Morning: { label: 'Mañana', bg: 'bg-emerald-500/15 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    Afternoon: { label: 'Tarde', bg: 'bg-blue-500/15 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    Night: { label: 'Noche', bg: 'bg-violet-500/15 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  };
  const s = config[shift] || config['Morning'];
  return (
    <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
      {s.label}
    </span>
  );
};

// Avatar con la inicial del usuario
const UserAvatar = ({ name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">
      {initial}
    </div>
  );
};

const MainLayout = () => {
  const { isAuthenticated, loading, logout, user, shift } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] || 'Sistema de Gestión';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full min-w-0">

        {/* ── TOPBAR MEJORADO ── */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm shrink-0">

          {/* Lado Izquierdo: Hamburguesa + Título de página */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors active:scale-95"
              aria-label="Abrir menú"
            >
              <MdMenu className="text-2xl" />
            </button>

            <div className="min-w-0">
              {/* Título de la página actual */}
              <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate leading-tight">
                {pageTitle}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block leading-tight">
                Sistema de Gestión · Central de Oxígeno EsSalud
              </p>
            </div>
          </div>

          {/* Lado Derecho: Turno + Usuario + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Badge de turno */}
            <ShiftBadge shift={shift} />

            {/* Separador */}
            <div className="hidden sm:block w-px h-6 bg-slate-200" />

            {/* Info del usuario */}
            <div className="hidden sm:flex items-center gap-2.5">
              <UserAvatar name={user?.name} />
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {user?.role || 'Operario'}
                </p>
              </div>
            </div>

            {/* Avatar solo en móvil */}
            <div className="sm:hidden">
              <UserAvatar name={user?.name} />
            </div>

            {/* Separador */}
            <div className="w-px h-6 bg-slate-200" />

            {/* Botón cerrar sesión */}
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95 group"
            >
              <MdLogout className="text-lg group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Salir</span>
            </button>

          </div>
        </header>

        {/* CONTENIDO DINÁMICO */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto page-enter">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default MainLayout;