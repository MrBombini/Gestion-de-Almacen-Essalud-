import { format } from 'date-fns';
import { MdTrendingUp, MdPropaneTank, MdAnalytics, MdPerson } from 'react-icons/md';

const ConsumptionDashboardTable = ({ data, date }) => {
  const shiftNames = ['MAÑANA', 'TARDE', 'NOCHE'];
  
  // Totales globales para las cajas de arriba
  const globalPadomi = Object.values(data?.shifts || {}).reduce((acc, s) => acc + (s.padomi || 0), 0);
  const globalHnagv = Object.values(data?.shifts || {}).reduce((acc, s) => acc + (s.hnagv || 0), 0);
  const globalPerifericos = Object.values(data?.shifts || {}).reduce((acc, s) => acc + (s.perifericos || 0), 0);

  return (
    <div className="space-y-8 bg-slate-50 p-8 rounded-3xl border border-slate-200 print:bg-white print:p-0 print:border-none">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg">
            <MdAnalytics className="text-3xl" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Registro de Consumo Diario</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                FECHA: {format(new Date(date), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <img src="/essalud_logo.png" alt="EsSalud" className="h-14 opacity-80" />
      </div>

      {/* CONSUMO POR CATEGORIA (TOTALES DEL DIA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 border-t-8 border-t-indigo-500">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">PACIENTES DOMICILIO (PADOMI)</h3>
            <div className="flex justify-between items-end">
                <span className="text-5xl font-black text-slate-800 tracking-tighter">{globalPadomi}</span>
                <span className="text-lg font-bold text-slate-400 uppercase">Total m³</span>
            </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 border-t-8 border-t-cyan-500">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">HOSPITAL (HNAGV)</h3>
            <div className="flex justify-between items-end">
                <span className="text-5xl font-black text-slate-800 tracking-tighter">{globalHnagv}</span>
                <span className="text-lg font-bold text-slate-400 uppercase">Total m³</span>
            </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 border-t-8 border-t-emerald-500">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">CCAA PERIFÉRICOS / RED</h3>
            <div className="flex justify-between items-end">
                <span className="text-5xl font-black text-slate-800 tracking-tighter">{globalPerifericos}</span>
                <span className="text-lg font-bold text-slate-400 uppercase">Total m³</span>
            </div>
        </div>
      </div>

      {/* STOCK DETALLADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 p-4 text-white font-black text-sm uppercase tracking-widest">Reserva Oxígeno (Llenos)</div>
              <div className="p-4"><p className="text-[10px] font-bold text-slate-400 italic">Datos calculados del inventario actual...</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-red-800 p-4 text-white font-black text-sm uppercase tracking-widest">Balones Vacíos</div>
              <div className="p-4"><p className="text-[10px] font-bold text-slate-400 italic">Datos calculados del inventario actual...</p></div>
          </div>
      </div>

      {/* SECCIÓN DE CIERRES POR TURNO (LA SOLICITADA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {shiftNames.map((shift) => {
            const sData = data?.shifts?.[shift] || { total: 0, operators: [] };
            return (
                <div key={shift} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Turno {shift}</p>
                    <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                        <span className="text-3xl font-black text-slate-800">{sData.total}</span>
                        <span className="text-[10px] font-bold text-slate-400">m³ entregados</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Responsable(s):</p>
                        {sData.operators.length > 0 ? sData.operators.map(op => (
                            <p key={op} className="text-[10px] font-black text-slate-700 uppercase italic flex items-center gap-1">
                                <MdPerson className="text-blue-500" /> {op}
                            </p>
                        )) : <p className="text-[10px] text-slate-300 italic">Sin registros</p>}
                    </div>
                </div>
            )
        })}

        {/* TOTAL DEL DÍA */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-900 shadow-xl text-white">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Consumo Día</p>
            <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
                <span className="text-4xl font-black text-white tracking-tighter">{data?.grand_total || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">m³ Global</span>
            </div>
            <div className="flex justify-between items-center mt-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Estado Cuadre:</p>
                <span className="bg-blue-500 text-[9px] font-black px-2 py-0.5 rounded uppercase">Sincronizado</span>
            </div>
        </div>
      </div>

    </div>
  );
};

export default ConsumptionDashboardTable;
