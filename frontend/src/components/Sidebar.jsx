import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importamos los iconos
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
  MdSwapCalls
} from 'react-icons/md';
import { FaGasPump, FaBedPulse } from 'react-icons/fa6';

const Sidebar = () => {
  const { user, shift } = useAuth();

  // Función para dar estilo a los links activos
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${isActive
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

  // Verificar si es admin o ingeniero
  const isAdminOrEngineer = user?.role === 'Administrator' || user?.role === 'Engineer';

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col text-sm shadow-xl shrink-0">

      {/* Cabecera del Sidebar */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-center">
        <div className="text-white font-bold text-xl tracking-wider flex items-center gap-3">
          <MdLocalHospital className="text-3xl text-blue-500" />
          EsSalud
        </div>
      </div>

      {/* Menú de Navegación (Aquí aplicamos el scrollbar-hide) */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">

        {/* SECCIÓN: PRINCIPAL */}
        <div>
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <NavLink to="/" className={navLinkClass}>
            <MdDashboard className="text-lg" />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* SECCIÓN: INVENTARIO */}
        <div>
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Inventario</p>
          <NavLink to="/inventory/exchange" className={navLinkClass}>
            <MdSwapHoriz className="text-lg" />
            <span>Intercambio</span>
          </NavLink>
          <NavLink to="/reports/ticketcontrol" className={navLinkClass}>
            <MdPeople className="text-lg" />
            <span>Control de Atencion</span>
          </NavLink>
          <NavLink to="/inventory/decanting" className={navLinkClass}>
            <FaGasPump className="text-lg" />
            <span>Trasiego (Cascada)</span>
          </NavLink>
          <NavLink to="/inventory/supplier" className={navLinkClass}>
            <MdLocalShipping className="text-lg" />
            <span>Mov. Proveedor</span>
          </NavLink>
          <NavLink to="/inventory/periphery" className={navLinkClass}>
            <MdSwapCalls className="text-lg" />
            <span>Canje de Red</span>
          </NavLink>
        </div>

        {/* SECCIÓN: OXÍGENO LÍQUIDO */}
        <div>
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Oxígeno Líquido</p>
          <NavLink to="/liquid/daily" className={navLinkClass}>
            <MdAssignment className="text-lg" />
            <span>Lectura Diaria</span>
          </NavLink>
          <NavLink to="/liquid/refill" className={navLinkClass}>
            <MdAcUnit className="text-lg" />
            <span>Recarga Cisterna</span>
          </NavLink>
        </div>

        {/* SECCIÓN: CATÁLOGOS */}
        <div>
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Catálogos</p>
          <NavLink to="/patients" className={navLinkClass}>
            <FaBedPulse className="text-lg" />
            <span>Pacientes</span>
          </NavLink>
          <NavLink to="/cylinders" className={navLinkClass}>
            <MdPropaneTank className="text-lg" />
            <span>Cilindros</span>
          </NavLink>
          <NavLink to="/services" className={navLinkClass}>
            <MdLocalHospital className="text-lg" />
            <span>Servicios</span>
          </NavLink>
          <NavLink to="/beds" className={navLinkClass}>
            <MdAirlineSeatFlat className='text-lg' />
            <span>Camas</span>
          </NavLink>
        </div>

        <div>
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reportes</p>
          
          <NavLink to="/reports/consumption" className={navLinkClass}>
            <MdInsertChartOutlined className="text-lg" />
            <span>Dashboard de Consumo</span>
          </NavLink>
          <NavLink to="/reports/supplier" className={navLinkClass}>
            <MdInsertChartOutlined className="text-lg" />
            <span>Proveedores Ingreso y Salida</span>
          </NavLink>
          <NavLink to="/reports/periphery" className={navLinkClass}>
            <MdAssignment className="text-lg" />
            <span>Periferia Reportes</span>
          </NavLink>
          <NavLink to="/reports/alerts" className={navLinkClass}>
            <MdAssignment className="text-lg" />
            <span>Alertas de Pacientes</span>
          </NavLink>
          <NavLink to="/admin/kardex5" className={navLinkClass}>
            <MdAssignment className="text-lg" />
            <span>Cilindros Seguimiento</span>
          </NavLink>
          <NavLink to="/admin/movements-report" className={navLinkClass}>
            <MdAssignment className="text-lg" />
            <span>Búsqueda de Movimientos</span>
          </NavLink>
        </div>

        {/* SECCIÓN: ADMINISTRACIÓN (Condicional) */}
        {isAdminOrEngineer && (
          <div>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Administración</p>
            <NavLink to="/admin/users" className={navLinkClass}>
              <MdPeople className="text-lg" />
              <span>Usuarios</span>
            </NavLink>
            {/* <NavLink to="/admin/reports" className={navLinkClass}>
              <MdInsertChartOutlined className="text-lg" />
              <span>Reportes / Alertas</span>
            </NavLink> */}
            <NavLink to="/admin/kardex" className={navLinkClass}>
              <MdAssignment className="text-lg" />
              <span>Kardex General</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Info del Usuario (Fondo del Sidebar) */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <p className="text-white font-medium truncate">{user?.name || 'Operario'}</p>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-slate-400">{user?.role || 'Administrator'}</p>
          <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded text-blue-400 border border-slate-700">
            Turno: {shift || 'Morning'}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;