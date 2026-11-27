import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff, MdLock, MdPerson, MdWbSunny, MdNightlight, MdAccessTime } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

// Ícono del balón de oxígeno SVG
const OxygenIcon = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="8" width="8" height="13" rx="2" fill="currentColor" />
    <path d="M8 8v-1a4 4 0 018 0v1H8z" fill="rgba(255,255,255,0.8)" />
    <rect x="11" y="3" width="2" height="3" fill="currentColor" rx="0.5" />
    <rect x="9" y="2" width="6" height="1.5" fill="currentColor" rx="0.5" />
    <rect x="14" y="4" width="2" height="1.5" fill="currentColor" rx="0.5" />
  </svg>
);

// Botón de selección de turno
const ShiftButton = ({ value, label, icon: Icon, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all text-sm font-bold ${
      selected
        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm'
        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-white'
    }`}
  >
    <Icon className="text-xl" />
    <span className="text-[11px]">{label}</span>
  </button>
);

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    operator_code: '',
    password: '',
    shift: 'Morning'
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(formData.operator_code, formData.password, formData.shift);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  const getShiftStyles = () => {
    switch (formData.shift) {
      case 'Morning':
        return {
          bg: 'bg-amber-50',
          blob1: 'bg-orange-300/40',
          blob2: 'bg-amber-400/30',
          blob3: 'bg-yellow-300/20',
          grid: 'linear-gradient(#fde68a 1px, transparent 1px), linear-gradient(90deg, #fde68a 1px, transparent 1px)',
          shadow: 'shadow-orange-200/50'
        };
      case 'Night':
        return {
          bg: 'bg-slate-900',
          blob1: 'bg-indigo-500/30',
          blob2: 'bg-purple-500/20',
          blob3: 'bg-blue-800/30',
          grid: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          shadow: 'shadow-indigo-900/50'
        };
      case 'Afternoon':
      default:
        return {
          bg: 'bg-slate-50',
          blob1: 'bg-blue-300/30',
          blob2: 'bg-cyan-300/30',
          blob3: 'bg-indigo-300/20',
          grid: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
          shadow: 'shadow-slate-200/50'
        };
    }
  };

  const theme = getShiftStyles();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-700 ${theme.bg}`}>

      {/* ── Fondo animado con burbujas sutiles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] transition-colors duration-700 ${theme.blob1}`} />
        <div className={`absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-700 ${theme.blob2}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] transition-colors duration-700 ${theme.blob3}`} />
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.4] transition-all duration-700"
          style={{
            backgroundImage: theme.grid,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* ── Card principal (Glassmorphism) ── */}
      <div className="relative w-full max-w-md transition-all duration-700">

        {/* Borde sutil superior */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-50" />

        <div className={`bg-white/70 backdrop-blur-2xl rounded-3xl border border-white shadow-2xl p-8 sm:p-10 transition-shadow duration-700 ${theme.shadow}`}>

          {/* ── Cabecera ── */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 mb-5 relative">
              <OxygenIcon size={40} className="text-white" />
              {/* Brillo */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-sky-300 rounded-full blur-sm opacity-90" />
            </div>

            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
              Central de Oxígeno
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1.5">
              Sistema de Gestión · EsSalud
            </p>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm font-bold shadow-sm">
              <span className="shrink-0 mt-0.5 text-red-500">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Formulario ── */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Código de operador */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Código de Operador
              </label>
              <div className="relative">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input
                  type="text"
                  name="operator_code"
                  required
                  value={formData.operator_code}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold shadow-sm"
                  placeholder="Ej: ADMIN01"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Contraseña
              </label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-11 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold shadow-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            {/* Selección de turno */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Turno de Trabajo
              </label>
              <div className="flex gap-2.5">
                <ShiftButton
                  value="Morning"
                  label="Mañana"
                  icon={MdWbSunny}
                  selected={formData.shift === 'Morning'}
                  onClick={(v) => setFormData({ ...formData, shift: v })}
                />
                <ShiftButton
                  value="Afternoon"
                  label="Tarde"
                  icon={MdAccessTime}
                  selected={formData.shift === 'Afternoon'}
                  onClick={(v) => setFormData({ ...formData, shift: v })}
                />
                <ShiftButton
                  value="Night"
                  label="Noche"
                  icon={MdNightlight}
                  selected={formData.shift === 'Night'}
                  onClick={(v) => setFormData({ ...formData, shift: v })}
                />
              </div>
            </div>

            {/* Botón de ingreso */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 rounded-xl font-black text-base transition-all mt-4 relative overflow-hidden group ${
                isLoading
                  ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                  : 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
              }`}
            >
              {/* Brillo animado al hover */}
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              )}

              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Ingresar al Sistema'
                )}
              </span>
            </button>

          </form>

          {/* Footer */}
          <p className="text-center text-slate-400 text-[11px] mt-8 font-medium">
            EsSalud · Red Asistencial Cusco · Central de Oxígeno
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;