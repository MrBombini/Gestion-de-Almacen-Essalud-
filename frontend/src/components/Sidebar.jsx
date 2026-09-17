import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importamos los iconos (agregamos MdClose para cerrar en móviles)
import {
  MdDashboard,
  MdSwapHoriz,
  MdLocalShipping,
  MdAssignment,
  MdAcUnit,
  MdLocalHospital,
  MdBusiness,
  MdPeople,
  MdInsertChartOutlined,
  MdPropaneTank,
  MdAirlineSeatFlat,
  MdSwapCalls,
  MdClose,
  MdSyncAlt,
  MdSettingsBackupRestore
} from 'react-icons/md';
import { FaGasPump, FaBedPulse } from 'react-icons/fa6';

// Recibimos isOpen y setIsOpen como props
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, shift } = useAuth();

  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('sidebarTheme') === 'dark';
  });

  const toggleTheme = () => {
    setIsDarkTheme(prev => {
      const newTheme = !prev;
      localStorage.setItem('sidebarTheme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  // Función para dar estilo a los links activos con un diseño premium
  const navLinkClass = ({ isActive }) => {
    if (isDarkTheme) {
      return `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group mb-1 ${isActive
        ? 'bg-blue-600/20 text-blue-400 font-bold shadow-sm ring-1 ring-blue-500/30'
        : 'text-slate-400 hover:bg-slate-800 hover:text-blue-400 font-medium'
      }`;
    }
    return `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group mb-1 ${isActive
      ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100/50'
      : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600 font-medium'
    }`;
  };

  // Verificar si es superadmin (solo Administrator)
  const isSuperAdmin = user?.role === 'Administrator';

  // Función para cerrar el sidebar en móviles al hacer clic en un link
  const closeSidebarMobile = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {/* OVERLAY OSCURO PARA MÓVILES */}
      {/* Solo se muestra en pantallas pequeñas (lg:hidden) cuando isOpen es true */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen w-64 flex flex-col text-sm shrink-0 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${
          isDarkTheme ? 'bg-slate-900 border-r border-slate-800 shadow-xl text-slate-300' : 'bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-100 text-slate-700'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-6 flex items-center justify-between lg:justify-center relative overflow-hidden">
          {/* Un toque sutil de fondo para la cabecera */}
          {!isDarkTheme && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-50/50 to-transparent opacity-50 pointer-events-none"></div>}
          
          <div className={`relative font-bold text-xl tracking-wider flex items-center gap-3 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
            <svg className="w-9 h-9 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="8" width="8" height="13" rx="2" fill="url(#gradLogo)" />
              <path d="M8 8v-1a4 4 0 018 0v1H8z" fill="#4f46e5" />
              <rect x="11" y="3" width="2" height="3" fill="#cbd5e1" rx="0.5" />
              <rect x="9" y="2" width="6" height="1.5" fill="#94a3b8" rx="0.5" />
              <rect x="14" y="4" width="2" height="1.5" fill="#94a3b8" rx="0.5" />
              <defs>
                <linearGradient id="gradLogo" x1="8" y1="8" x2="16" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span className={`text-lg leading-tight font-black ${isDarkTheme ? 'text-white' : 'bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600'}`}>
              Central de<br />Oxígeno
            </span>
          </div>
          {/* Botón Cerrar (Solo visible en móviles) */}
          <button
            onClick={() => setIsOpen(false)}
            className={`lg:hidden relative transition-colors p-2 rounded-lg ${isDarkTheme ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50'}`}
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className={`flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-thin scrollbar-track-transparent pb-24 ${isDarkTheme ? 'scrollbar-thumb-slate-700' : 'scrollbar-thumb-slate-200'}`}>

          {/* SECCIÓN: PRINCIPAL */}
          <div>
            <p className={`px-4 text-[11px] font-black uppercase tracking-widest mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Principal</p>
            <NavLink to="/" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdDashboard className="text-lg" />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* SECCIÓN: INVENTARIO */}
          <div>
            <p className={`px-4 text-[11px] font-black uppercase tracking-widest mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Inventario</p>
            <NavLink to="/inventory/exchange" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdSwapHoriz className="text-lg" />
              <span>Intercambio</span>
            </NavLink>
            <NavLink to="/reports/ticketcontrol" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdPeople className="text-lg" />
              <span>Control de Atencion</span>
            </NavLink>
            <NavLink to="/inventory/decanting" className={navLinkClass} onClick={closeSidebarMobile}>
              <FaGasPump className="text-lg" />
              <span>Trasiego (Cascada)</span>
            </NavLink>
            <NavLink to="/inventory/supplier" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdLocalShipping className="text-lg" />
              <span>Mov. Proveedor</span>
            </NavLink>
            <NavLink to="/inventory/warehouse-transfer" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdSyncAlt className="text-lg" />
              <span>Traslado Interno</span>
            </NavLink>
            <NavLink to="/inventory/periphery" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdSwapCalls className="text-lg" />
              <span>Periferia/Centros Medicos</span>
            </NavLink>
            <NavLink to="/inventory/loan-return" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdBusiness className="text-lg" />
              <span>Préstamos / Terceros</span>
            </NavLink>
            <NavLink to="/inventory/return-control" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdSettingsBackupRestore className="text-lg" />
              <span>Control Devoluciones</span>
            </NavLink>
          </div>

          {/* SECCIÓN: OXÍGENO LÍQUIDO */}
          <div>
            <p className={`px-4 text-[11px] font-black uppercase tracking-widest mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Oxígeno Líquido</p>
            <NavLink to="/liquid/daily" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Lectura Diaria</span>
            </NavLink>
            <NavLink to="/liquid/refill" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAcUnit className="text-lg" />
              <span>Recarga Cisterna</span>
            </NavLink>
          </div>

          {/* SECCIÓN: CATÁLOGOS */}
          <div>
            <p className={`px-4 text-[11px] font-black uppercase tracking-widest mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Catálogos</p>
            <NavLink to="/patients" className={navLinkClass} onClick={closeSidebarMobile}>
              <FaBedPulse className="text-lg" />
              <span>Pacientes</span>
            </NavLink>
            <NavLink to="/cylinders" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdPropaneTank className="text-lg" />
              <span>Cilindros</span>
            </NavLink>
            <NavLink to="/services" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdLocalHospital className="text-lg" />
              <span>Servicios</span>
            </NavLink>
            <NavLink to="/beds" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAirlineSeatFlat className='text-lg' />
              <span>Camas</span>
            </NavLink>
            <NavLink to="/authorities" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdBusiness className="text-lg" />
              <span>Autoridades / Entidades</span>
            </NavLink>
          </div>

          {/* SECCIÓN: REPORTES */}
          <div>
            <p className={`px-4 text-[11px] font-black uppercase tracking-widest mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Reportes</p>

            <NavLink to="/reports/kardex" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Kardex General</span>
            </NavLink>
            <NavLink to="/reports/kardexresume" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Resumen de Kardex</span>
            </NavLink>
            <NavLink to="/reports/unified-search" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Búsqueda y Exportación</span>
            </NavLink>
            <NavLink to="/reports/padomi-exchanges" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Intercambios PADOMI</span>
            </NavLink>
            <NavLink to="/reports/alerts" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Alertas de Pacientes</span>
            </NavLink>
            <NavLink to="/reports/supplier" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdInsertChartOutlined className="text-lg" />
              <span>Proveedores Ingreso y Salida</span>
            </NavLink>
            <NavLink to="/reports/periphery" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Periferia Reportes</span>
            </NavLink>
            <NavLink to="/reports/hospitalization-control" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdLocalHospital className="text-lg" />
              <span>Control Hospitalización</span>
            </NavLink>
            <NavLink to="/reports/cylinder-tracking" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Cilindros Seguimiento</span>
            </NavLink>
            <NavLink to="/reports/control-format" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Formatos de Control</span>
            </NavLink>
            <NavLink to="/reports/executive" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdInsertChartOutlined className="text-lg" />
              <span>Reporte Gerencial</span>
            </NavLink>
          </div>

          {/* SECCIÓN: ADMINISTRACIÓN (Condicional) */}
          {isSuperAdmin && (
            <div>
              <p className={`px-4 text-[11px] font-black uppercase tracking-widest mb-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Administración</p>
              <NavLink to="/admin/users" className={navLinkClass} onClick={closeSidebarMobile}>
                <MdPeople className="text-lg" />
                <span>Usuarios</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Info del Usuario (Fondo del Sidebar) */}
        <div className={`p-4 shrink-0 mt-auto border-t transition-colors ${isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className={`rounded-2xl p-4 border flex flex-col gap-2 relative overflow-hidden group transition-colors ${isDarkTheme ? 'bg-slate-900 border-slate-800/50' : 'bg-slate-50 border-slate-100/50'}`}>
            {/* Decal de fondo */}
            {!isDarkTheme && <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-50 rounded-full blur-xl group-hover:bg-indigo-100 transition-colors"></div>}
            
            <div className="flex items-center gap-3 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm font-bold text-lg border ${
                isDarkTheme 
                  ? 'bg-gradient-to-tr from-slate-800 to-slate-700 text-blue-400 border-slate-700'
                  : 'bg-gradient-to-tr from-indigo-100 to-blue-50 text-indigo-600 border-indigo-50'
              }`}>
                {(user?.name || 'O')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className={`font-bold truncate text-sm ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{user?.name || 'Operario'}</p>
                <p className={`text-xs truncate ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{user?.role || 'Administrator'}</p>
              </div>
            </div>
            
            <div className={`flex items-center justify-between mt-2 pt-2 border-t relative ${isDarkTheme ? 'border-slate-800' : 'border-slate-200/50'}`}>
              <span className={`text-xs font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Turno Actual</span>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm border uppercase tracking-widest ${
                isDarkTheme 
                  ? 'bg-slate-800 text-blue-400 border-slate-700'
                  : 'bg-white text-indigo-600 border-slate-100'
              }`}>
                {shift || 'Morning'}
              </span>
            </div>

            {/* TOGGLE DARK MODE */}
            <div className="absolute top-2 right-2">
              <button 
                onClick={toggleTheme}
                title="Cambiar Modo Oscuro/Claro"
                className={`p-1.5 rounded-lg transition-colors ${isDarkTheme ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}
              >
                {isDarkTheme ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;