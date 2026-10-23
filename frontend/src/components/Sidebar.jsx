import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Iconos para la navegación y módulos
import {
  MdDashboard,
  MdSwapHoriz,
  MdLocalShipping,
  MdAssignment,
  MdAcUnit,
  MdLocalHospital,
  MdBusiness,
  MdPeople,
  MdPropaneTank,
  MdAirlineSeatFlat,
  MdSwapCalls,
  MdClose,
  MdSyncAlt,
  MdSettingsBackupRestore,
  MdSearch,
  MdClear,
  MdChevronRight,
  MdEventNote,
  MdHandshake,
  MdManageSearch,
  MdHome,
  MdNotificationsActive,
  MdInsertChart,
  MdMap,
  MdRadar,
  MdPrint,
  MdBarChart,
  MdCategory
} from 'react-icons/md';
import { FaGasPump, FaBedPulse } from 'react-icons/fa6';

// Recibimos isOpen y setIsOpen como props
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, shift } = useAuth();
  const location = useLocation();

  // Estado del tema oscuro / claro
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

  // Buscador de módulos en el sidebar
  const [navSearch, setNavSearch] = useState('');

  // Estado de qué secciones del acordeón están abiertas (con persistencia en localStorage)
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarOpenSections');
      return saved ? JSON.parse(saved) : { operaciones: true, reportes: false, catalogos: false, liquido: false };
    } catch (e) {
      return { operaciones: true, reportes: false, catalogos: false, liquido: false };
    }
  });

  const toggleSection = (sectionId) => {
    setOpenSections(prev => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      localStorage.setItem('sidebarOpenSections', JSON.stringify(next));
      return next;
    });
  };

  // Auto-expandir la sección que contiene la ruta activa
  useEffect(() => {
    const path = location.pathname;
    let sectionToOpen = null;

    if (path.startsWith('/inventory') || path === '/reports/ticketcontrol') {
      sectionToOpen = 'operaciones';
    } else if (path.startsWith('/liquid')) {
      sectionToOpen = 'liquido';
    } else if (['/patients', '/cylinders', '/services', '/beds', '/suppliers', '/ownership-types', '/authorities'].includes(path)) {
      sectionToOpen = 'catalogos';
    } else if (path.startsWith('/reports')) {
      sectionToOpen = 'reportes';
    }

    if (sectionToOpen) {
      setOpenSections(prev => {
        if (!prev[sectionToOpen]) {
          const next = { ...prev, [sectionToOpen]: true };
          localStorage.setItem('sidebarOpenSections', JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }
  }, [location.pathname]);

  // Función para cerrar el sidebar en móviles al hacer clic en un link
  const closeSidebarMobile = () => {
    if (setIsOpen) setIsOpen(false);
  };

  // Estilo de los links de navegación
  const navLinkClass = ({ isActive }) => {
    if (isDarkTheme) {
      return `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group text-xs font-semibold ${
        isActive
          ? 'bg-blue-600/25 text-blue-300 font-bold shadow-sm ring-1 ring-blue-500/40'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`;
    }
    return `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group text-xs font-semibold ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs ring-1 ring-indigo-200/60'
        : 'text-slate-600 hover:bg-slate-100/80 hover:text-indigo-600'
    }`;
  };

  const isSuperAdmin = user?.role === 'Administrator';

  // Configuración de las secciones del Sidebar
  const SECTIONS = useMemo(() => [
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: MdSwapHoriz,
      color: isDarkTheme ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600',
      items: [
        { to: '/inventory/exchange', label: 'Intercambio', icon: MdSwapHoriz },
        { to: '/reports/ticketcontrol', label: 'Control de Atención', icon: MdEventNote },
        { to: '/inventory/decanting', label: 'Trasiego (Cascada)', icon: FaGasPump },
        { to: '/inventory/supplier', label: 'Mov. Proveedor', icon: MdLocalShipping },
        { to: '/inventory/warehouse-transfer', label: 'Traslado Interno', icon: MdSyncAlt },
        { to: '/inventory/periphery', label: 'Periferia/Centros Médicos', icon: MdSwapCalls },
        { to: '/inventory/loan-return', label: 'Préstamos / Terceros', icon: MdHandshake },
        { to: '/inventory/return-control', label: 'Control Devoluciones', icon: MdSettingsBackupRestore },
      ]
    },
    {
      id: 'liquido',
      label: 'Oxígeno Líquido',
      icon: MdAcUnit,
      color: isDarkTheme ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600',
      items: [
        { to: '/liquid/daily', label: 'Lectura Diaria', icon: MdAssignment },
        { to: '/liquid/refill', label: 'Recarga Cisterna', icon: MdAcUnit },
      ]
    },
    {
      id: 'catalogos',
      label: 'Catálogos',
      icon: MdCategory,
      color: isDarkTheme ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
      items: [
        { to: '/patients', label: 'Pacientes', icon: FaBedPulse },
        { to: '/cylinders', label: 'Cilindros', icon: MdPropaneTank },
        { to: '/services', label: 'Servicios', icon: MdLocalHospital },
        { to: '/beds', label: 'Camas', icon: MdAirlineSeatFlat },
        { to: '/suppliers', label: 'Proveedores', icon: MdLocalShipping },
        { to: '/ownership-types', label: 'Tipos de Propiedad', icon: MdCategory },
        { to: '/authorities', label: 'Autoridades / Entidades', icon: MdBusiness },
      ]
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: MdBarChart,
      color: isDarkTheme ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
      items: [
        { to: '/reports/unified-search', label: 'Búsqueda y Exportación', icon: MdManageSearch },
        { to: '/reports/padomi-exchanges', label: 'Intercambios PADOMI', icon: MdHome },
        { to: '/reports/alerts', label: 'Alertas de Pacientes', icon: MdNotificationsActive },
        { to: '/reports/supplier', label: 'Proveedores Ingreso/Salida', icon: MdInsertChart },
        { to: '/reports/periphery', label: 'Periferia Reportes', icon: MdMap },
        { to: '/reports/hospitalization-control', label: 'Control Hospitalización', icon: MdLocalHospital },
        { to: '/reports/cylinder-tracking', label: 'Seguimiento Cilindros', icon: MdRadar },
        { to: '/reports/control-format', label: 'Formatos de Control', icon: MdPrint },
      ]
    }
  ], [isDarkTheme]);

  // Filtrado por buscador
  const searchTerm = navSearch.trim().toLowerCase();
  const isSearching = searchTerm.length > 0;

  const filteredSections = useMemo(() => {
    if (!isSearching) return SECTIONS;
    return SECTIONS.map(section => {
      const matchingItems = section.items.filter(item => 
        item.label.toLowerCase().includes(searchTerm)
      );
      return {
        ...section,
        items: matchingItems,
        hasMatches: matchingItems.length > 0
      };
    }).filter(sec => sec.hasMatches);
  }, [SECTIONS, searchTerm, isSearching]);

  const hasAnyMatches = isSearching ? filteredSections.length > 0 : true;

  return (
    <>
      {/* OVERLAY OSCURO PARA MÓVILES */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen w-64 flex flex-col text-sm shrink-0 z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isDarkTheme 
            ? 'bg-slate-900 border-r border-slate-800 shadow-xl text-slate-300' 
            : 'bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-100 text-slate-700'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-5 flex items-center justify-between lg:justify-center relative overflow-hidden">
          {!isDarkTheme && (
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-50/50 to-transparent opacity-50 pointer-events-none" />
          )}
          
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

          {/* Botón Cerrar (Móviles) */}
          <button
            onClick={() => setIsOpen(false)}
            className={`lg:hidden relative transition-colors p-2 rounded-lg ${
              isDarkTheme ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50'
            }`}
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Buscador de Módulos */}
        <div className="px-4 mb-3">
          <div className={`relative flex items-center rounded-xl border px-3 py-2 transition-all ${
            isDarkTheme 
              ? 'bg-slate-800/80 border-slate-700/80 focus-within:border-blue-500' 
              : 'bg-slate-50 border-slate-200/80 focus-within:border-indigo-400 focus-within:bg-white'
          }`}>
            <MdSearch className={`text-lg mr-2 shrink-0 ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Buscar módulo..."
              className={`w-full bg-transparent text-xs font-semibold outline-none ${
                isDarkTheme ? 'text-white placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'
              }`}
            />
            {navSearch && (
              <button 
                onClick={() => setNavSearch('')} 
                className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                title="Limpiar búsqueda"
              >
                <MdClear className="text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Menú de Navegación con Acordeón */}
        <nav className={`flex-1 overflow-y-auto px-3 py-1 space-y-3 scrollbar-thin scrollbar-track-transparent pb-24 ${
          isDarkTheme ? 'scrollbar-thumb-slate-700' : 'scrollbar-thumb-slate-200'
        }`}>

          {/* SECCIÓN FIJA: DASHBOARD PRINCIPAL */}
          {!isSearching && (
            <div>
              <NavLink 
                to="/" 
                end
                className={navLinkClass} 
                onClick={closeSidebarMobile}
              >
                <MdDashboard className="text-lg shrink-0" />
                <span className="font-bold">Dashboard</span>
              </NavLink>
            </div>
          )}

          {/* MENSAJE SI NO HAY RESULTADOS EN BÚSQUEDA */}
          {isSearching && !hasAnyMatches && (
            <div className="p-4 text-center">
              <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                No se encontraron módulos para "{navSearch}".
              </p>
            </div>
          )}

          {/* SECCIONES ACORDEÓN */}
          {filteredSections.map((section) => {
            const SectionIcon = section.icon;
            // Si está buscando, auto-expande siempre la sección; si no, usa el estado guardado
            const isOpenSection = isSearching ? true : !!openSections[section.id];
            const itemCount = section.items.length;

            return (
              <div key={section.id} className="rounded-xl overflow-hidden">
                {/* Cabecera del acordeón */}
                <button
                  onClick={() => !isSearching && toggleSection(section.id)}
                  disabled={isSearching}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors select-none ${
                    isDarkTheme 
                      ? 'hover:bg-slate-800/60 text-slate-300' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`p-1.5 rounded-lg shrink-0 ${section.color}`}>
                      <SectionIcon className="text-base" />
                    </span>
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {section.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isDarkTheme 
                        ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                    }`}>
                      {itemCount}
                    </span>
                    {!isSearching && (
                      <MdChevronRight className={`text-lg transition-transform duration-200 ${
                        isOpenSection ? 'rotate-90 text-blue-500' : 'text-slate-400'
                      }`} />
                    )}
                  </div>
                </button>

                {/* Sub-ítems colapsables */}
                <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                  isOpenSection ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}>
                  <div className="overflow-hidden">
                    <div className={`ml-3 pl-3 border-l-2 mt-1 space-y-0.5 mb-2 ${
                      isDarkTheme ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={navLinkClass}
                            onClick={closeSidebarMobile}
                          >
                            <ItemIcon className="text-base shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* SECCIÓN ADMINISTRACIÓN (SuperAdmin) */}
          {isSuperAdmin && (!isSearching || 'usuarios'.includes(searchTerm)) && (
            <div className="pt-2 border-t border-slate-100/50">
              <p className={`px-3 text-[10px] font-black uppercase tracking-widest mb-1 ${
                isDarkTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Administración
              </p>
              <NavLink to="/admin/users" className={navLinkClass} onClick={closeSidebarMobile}>
                <MdPeople className="text-lg shrink-0" />
                <span>Usuarios</span>
              </NavLink>
            </div>
          )}

        </nav>

        {/* Info del Usuario (Pie del Sidebar) */}
        <div className={`p-3.5 shrink-0 mt-auto border-t transition-colors ${
          isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className={`rounded-2xl p-3 border flex flex-col gap-2 relative overflow-hidden group transition-colors ${
            isDarkTheme ? 'bg-slate-900 border-slate-800/50' : 'bg-slate-50 border-slate-100/50'
          }`}>
            {!isDarkTheme && (
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-50 rounded-full blur-xl group-hover:bg-indigo-100 transition-colors" />
            )}
            
            <div className="flex items-center gap-3 relative">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs font-bold text-base border ${
                isDarkTheme 
                  ? 'bg-gradient-to-tr from-slate-800 to-slate-700 text-blue-400 border-slate-700'
                  : 'bg-gradient-to-tr from-indigo-100 to-blue-50 text-indigo-600 border-indigo-50'
              }`}>
                {(user?.name || 'O')[0].toUpperCase()}
              </div>
              <div className="min-w-0 pr-6">
                <p className={`font-bold truncate text-xs ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                  {user?.name || 'Operario'}
                </p>
                <p className={`text-[11px] truncate ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  {user?.role || 'Administrator'}
                </p>
              </div>
            </div>
            
            <div className={`flex items-center justify-between mt-1 pt-1.5 border-t relative ${
              isDarkTheme ? 'border-slate-800' : 'border-slate-200/50'
            }`}>
              <span className={`text-[11px] font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                Turno Actual
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs border uppercase tracking-widest ${
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
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkTheme ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-white hover:text-indigo-600'
                }`}
              >
                {isDarkTheme ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
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