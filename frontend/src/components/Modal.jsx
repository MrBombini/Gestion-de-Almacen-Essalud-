import { MdClose } from 'react-icons/md';

const Modal = ({ isOpen, onClose, title, children, elevated = false, maxWidth = 'max-w-md' }) => {
  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  const zClass = elevated ? 'z-[200]' : 'z-50';

  return (
    <div className={`fixed inset-0 ${zClass} flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto`}>
      {/* Contenedor del Modal */}
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} my-auto flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden animate-fade-in-up`}>
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate pr-2">{title}</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            title="Cerrar"
          >
            <MdClose className="text-xl sm:text-2xl" />
          </button>
        </div>

        {/* Cuerpo del Modal (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;