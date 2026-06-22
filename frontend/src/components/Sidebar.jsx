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
  MdClose
} from 'react-icons/md';
import { FaGasPump, FaBedPulse } from 'react-icons/fa6';

// Recibimos isOpen y setIsOpen como props
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, shift } = useAuth();

  // Función para dar estilo a los links activos
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${isActive
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

  // Verificar si es admin o ingeniero
  const isAdminOrEngineer = user?.role === 'Administrator' || user?.role === 'Engineer';

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
      {/* Usamos transformaciones para ocultarlo (-translate-x-full) o mostrarlo (translate-x-0) en móviles.
          En desktop (lg:), siempre será estático y visible (lg:translate-x-0 lg:static). */}
      <aside 
        className={`fixed lg:static top-0 left-0 h-screen w-64 bg-slate-900 flex flex-col text-sm shadow-xl shrink-0 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between lg:justify-center">
          <div className="text-white font-bold text-xl tracking-wider flex items-center gap-3">
            <MdLocalHospital className="text-3xl text-blue-500" />
            EsSalud
          </div>
          {/* Botón Cerrar (Solo visible en móviles) */}
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-24">

          {/* SECCIÓN: PRINCIPAL */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
            <NavLink to="/" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdDashboard className="text-lg" />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* SECCIÓN: INVENTARIO */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Inventario</p>
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
            <NavLink to="/inventory/periphery" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdSwapCalls className="text-lg" />
              <span>Canje de Red</span>
            </NavLink>
          </div>

          {/* SECCIÓN: OXÍGENO LÍQUIDO */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Oxígeno Líquido</p>
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
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Catálogos</p>
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
          </div>

          {/* SECCIÓN: REPORTES */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reportes</p>

            <NavLink to="/reports/consumption" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdInsertChartOutlined className="text-lg" />
              <span>Dashboard de Consumo</span>
            </NavLink>
            <NavLink to="/reports/supplier" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdInsertChartOutlined className="text-lg" />
              <span>Proveedores Ingreso y Salida</span>
            </NavLink>
            <NavLink to="/reports/periphery" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Periferia Reportes</span>
            </NavLink>
            <NavLink to="/reports/alerts" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Alertas de Pacientes</span>
            </NavLink>
            <NavLink to="/reports/cylinder-tracking" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Cilindros Seguimiento</span>
            </NavLink>
            <NavLink to="/reports/movements-report" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Búsqueda de Movimientos</span>
            </NavLink>
            <NavLink to="/reports/kardexresume" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Resumen de Kardex</span>
            </NavLink>
            <NavLink to="/reports/kardex" className={navLinkClass} onClick={closeSidebarMobile}>
              <MdAssignment className="text-lg" />
              <span>Kardex General</span>
            </NavLink>
          </div>

          {/* SECCIÓN: ADMINISTRACIÓN (Condicional) */}
          {isAdminOrEngineer && (
            <div>
              <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Administración</p>
              <NavLink to="/admin/users" className={navLinkClass} onClick={closeSidebarMobile}>
                <MdPeople className="text-lg" />
                <span>Usuarios</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Info del Usuario (Fondo del Sidebar) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0 mt-auto">
          <p className="text-white font-medium truncate">{user?.name || 'Operario'}</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-slate-400 truncate pr-2">{user?.role || 'Administrator'}</p>
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-blue-400 border border-slate-700 whitespace-nowrap">
              Turno: {shift || 'Morning'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;