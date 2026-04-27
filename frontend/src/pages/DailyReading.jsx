import { useState, useEffect } from 'react';
import { MdAssignment, MdSave, MdOutlineGasMeter, MdCalculate } from 'react-icons/md';
import { FaDroplet } from 'react-icons/fa6';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';

const DailyReading = () => {
  const { shift } = useAuth();
  
  // Obtenemos la fecha actual en formato YYYY-MM-DD para el valor por defecto
  const peruTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Lima"}));
  const yyyy = peruTime.getFullYear();
  const mm = String(peruTime.getMonth() + 1).padStart(2, '0');
  const dd = String(peruTime.getDate()).padStart(2, '0');
  const today = `${yyyy}-${mm}-${dd}`;

  const [formData, setFormData] = useState({
    reading_date: today,
    ext_tank_reserve: '',
    int_warehouse_consumption: '',
    calculated_consumption: ''
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Hook para el POST
  const { execute, loading: actionLoading } = useFetch('/liquid/daily-reading', 'POST', null, false);

  // Efecto opcional: Si quieres que el consumo se calcule automáticamente al escribir los otros dos
  // (Depende de cómo usaban su Excel, aquí lo dejamos manual pero puedes automatizarlo)
  /*
  useEffect(() => {
    if (formData.ext_tank_reserve && formData.int_warehouse_consumption) {
       // Tu lógica de cálculo aquí
    }
  }, [formData.ext_tank_reserve, formData.int_warehouse_consumption]);
  */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await execute({
        body: {
          ...formData,
          shift: shift // Inyectamos el turno desde el Contexto
        }
      });
      
      setSuccessMessage('¡Lectura diaria registrada con éxito!');
      // Limpiamos los campos numéricos, pero mantenemos la fecha
      setFormData({
        ...formData,
        ext_tank_reserve: '',
        int_warehouse_consumption: '',
        calculated_consumption: ''
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al registrar la lectura. Revisa los datos ingresados.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-sky-50 text-sky-600 rounded-xl">
          <MdAssignment className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lectura Diaria de Líquido</h2>
          <p className="text-slate-500 text-sm mt-1">
            Registro de niveles del tanque criogénico y medidores internos. Turno activo: <span className="font-bold text-blue-600">{shift}</span>
          </p>
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md text-emerald-700 font-medium">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Datos de la Lectura</h3>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">Fecha:</label>
            <input 
              type="date" 
              required
              value={formData.reading_date}
              onChange={(e) => setFormData({...formData, reading_date: e.target.value})}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Lado Izquierdo: Lecturas de Equipos */}
            <div className="space-y-6">
              
              <div className="bg-sky-50/50 p-5 rounded-xl border border-sky-100 relative">
                <div className="absolute -top-3 -left-3 bg-white p-2 rounded-full border border-sky-100 shadow-sm text-sky-500">
                  <FaDroplet className="text-lg" />
                </div>
                <label className="block text-sm font-semibold text-slate-800 mb-2 pl-4">
                  Reserva Tanque Exterior
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.ext_tank_reserve}
                    onChange={(e) => setFormData({...formData, ext_tank_reserve: e.target.value})}
                    className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all text-lg font-medium"
                    placeholder="Ej: 75.20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    % / L
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 pl-4">Nivel general del tanque criogénico principal.</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative">
                <div className="absolute -top-3 -left-3 bg-white p-2 rounded-full border border-slate-200 shadow-sm text-slate-500">
                  <MdOutlineGasMeter className="text-lg" />
                </div>
                <label className="block text-sm font-semibold text-slate-800 mb-2 pl-4">
                  Consumo Almacén Interno (Medidor)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.int_warehouse_consumption}
                    onChange={(e) => setFormData({...formData, int_warehouse_consumption: e.target.value})}
                    className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all text-lg font-medium"
                    placeholder="Ej: 15.50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    m³
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 pl-4">Lectura del flujómetro o medidor del área de trasiego.</p>
              </div>

            </div>

            {/* Lado Derecho: Resultados Matemáticos */}
            <div className="flex flex-col justify-center">
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-inner flex flex-col items-center text-center h-full justify-center space-y-4">
                <div className="bg-indigo-100 p-4 rounded-full text-indigo-600">
                  <MdCalculate className="text-4xl" />
                </div>
                
                <div className="w-full">
                  <label className="block text-sm font-bold text-indigo-900 mb-2">
                    Consumo Calculado del Turno
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={formData.calculated_consumption}
                      onChange={(e) => setFormData({...formData, calculated_consumption: e.target.value})}
                      className="w-full text-center py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-2xl font-black text-indigo-700 bg-white"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-indigo-600/70 mt-3 px-4">
                    Ingresa el cálculo final (Diferencia de niveles o suma de consumo interno).
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={actionLoading}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:bg-slate-400"
            >
              <MdSave className="text-xl" />
              {actionLoading ? 'Registrando Lectura...' : 'Guardar Lectura Diaria'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DailyReading;