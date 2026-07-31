import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Estado para capturar los datos del formulario
  const [formData, setFormData] = useState({
    operator_code: '',
    password: '',
    shift: 'Morning' // Valor por defecto según la API
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }


  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Manejador del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(
      formData.operator_code,
      formData.password,
      formData.shift
    );

    if (result.success) {
      navigate('/'); // Si todo sale bien, redirigimos al inicio
    } else {
      setError(result.message); // Si falla, mostramos el error
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">

        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="mx-auto bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="8" width="8" height="13" rx="2" fill="currentColor" />
              <path d="M8 8v-1a4 4 0 018 0v1H8z" fill="#93c5fd" />
              <rect x="11" y="3" width="2" height="3" fill="#e2e8f0" rx="0.5" />
              <rect x="9" y="2" width="6" height="1.5" fill="#cbd5e1" rx="0.5" />
              <rect x="14" y="4" width="2" height="1.5" fill="#cbd5e1" rx="0.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Central de Oxígeno</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Control de Inventario y Trazabilidad</p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Código de Operador
            </label>
            <input
              type="text"
              name="operator_code"
              required
              value={formData.operator_code}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ej: ADMIN01"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Turno
            </label>
            <select
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all cursor-pointer"
            >
              <option value="Morning">Mañana</option>
              <option value="Afternoon">Tarde</option>
              <option value="Night">Noche</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 text-white rounded-lg font-bold shadow-md transition-all ${isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;