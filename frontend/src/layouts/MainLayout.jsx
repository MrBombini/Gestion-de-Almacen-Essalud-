import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  const { isAuthenticated, loading, user, shift, logout } = useAuth();

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
      
      {/* El menú lateral siempre presente */}
      <Sidebar />

      {/* El contenedor principal derecho */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Barra Superior (Topbar) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0">
          <h1 className="text-lg font-semibold text-slate-700">
            Sistema de Gestión de Almacén
          </h1>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </header>

        {/* CONTENIDO DINÁMICO (Aquí se renderizan las páginas) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet /> 
          </div>
        </main>

      </div>
    </div>
  );
};

export default MainLayout;