import { useState } from 'react'; // 1. Importamos useState
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { MdMenu } from 'react-icons/md'; // 2. Importamos el icono del menú

const MainLayout = () => {
  const { isAuthenticated, loading, logout } = useAuth();

  // 3. Creamos el estado para controlar si el sidebar está abierto en móviles
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      {/* 4. Le pasamos las props al Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* El contenedor principal derecho */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">

        {/* Barra Superior (Topbar) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm shrink-0">

          <div className="flex items-center gap-3">
            {/* 5. EL BOTÓN HAMBURGUESA: Solo se ve en pantallas pequeñas (lg:hidden) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors active:scale-95"
            >
              <MdMenu className="text-2xl" />
            </button>

            {/* Título de la app (se acorta en móviles para que quepa bien) */}
            <h1 className="text-lg font-semibold text-slate-700 hidden sm:block">
              Sistema de Gestión de Almacén
            </h1>
            <h1 className="text-lg font-semibold text-slate-700 sm:hidden">
              EsSalud
            </h1>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </header>

        {/* CONTENIDO DINÁMICO (Aquí se renderizan las páginas) */}
        {/* Agregué padding responsivo: p-4 en móvil, p-8 en PC */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default MainLayout;