import { MdClose } from 'react-icons/md';

const Modal = ({ isOpen, onClose, title, children }) => {
  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      {/* Contenedor del Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Cuerpo del Modal (Aquí se inyectará tu formulario) */}
        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;