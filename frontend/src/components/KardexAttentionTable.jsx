import { format } from 'date-fns';
import { MdPropaneTank, MdEvent, MdPrint } from 'react-icons/md';

const KardexAttentionTable = ({ data, date }) => {
  const shifts = ['MAÑANA', 'TARDE', 'NOCHE'];

  return (
    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 overflow-x-auto print:p-0 print:shadow-none print:border-none">
      {/* RESUMEN DE CONTEO PARA OPERARIO */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8 print:hidden">
        {data?.stock_summary?.map((item) => (
          <div key={item.name} className="bg-white border-2 border-slate-900 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-2 pb-1">{item.name}</p>
            <div className="flex justify-between items-center">
              <div className="text-center flex-1 border-r border-slate-100">
                <p className="text-[8px] font-bold text-emerald-600 uppercase">Llenos</p>
                <p className="text-xl font-black text-slate-800">{item.full}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-[8px] font-bold text-red-500 uppercase">Vacíos</p>
                <p className="text-xl font-black text-slate-800">{item.empty}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header Estilo Formato */}
      <div className="flex justify-between items-end border-b-4 border-slate-900 pb-4 mb-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">KARDEX ATENCIÓN DE OXÍGENO</h2>
          <p className="text-xl font-bold text-slate-500 uppercase">FECHA: {format(new Date(date), 'dd/MM/yyyy')}</p>
        </div>
        <div className="text-right">
          <img src="/essalud_logo.png" alt="EsSalud" className="h-12 mb-2 ml-auto grayscale opacity-50" />
          <p className="text-[10px] font-bold text-slate-400">SISTEMA DE GESTIÓN DE ALMACÉN - CENTRAL OXIGENO</p>
        </div>
      </div>

      {shifts.map((shiftName) => {
        const shiftData = data?.shifts?.[shiftName] || { movements: [], operators: [] };
        const movements = shiftData.movements || [];
        const operators = shiftData.operators || [];

        // Calcular resumen de saldos para el encabezado (Ejemplo para EsSalud 10m3)
        const getInitialCount = (cap, ownId, status) => {
          return data?.initial_balance?.find(b => b.capacity == cap && b.ownership_type_id == ownId && b.status === status)?.total || 0;
        };

        return (
          <div key={shiftName} className="mb-12 last:mb-0 relative">
            <div className="bg-slate-900 text-white px-6 py-2 flex justify-between items-center">
              <h3 className="text-2xl font-black italic tracking-widest">{shiftName}</h3>
              <div className="flex gap-8 text-[10px] font-bold uppercase opacity-80">
                <span>EsSalud 10m3 (LL/V): {getInitialCount(10, 1, 'full')} / {getInitialCount(10, 1, 'empty')}</span>
                <span>Operadores: {operators.join(', ') || 'Sin registro'}</span>
              </div>
            </div>

            <div className="flex">
              <table className="flex-1 border-collapse border-2 border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase">
                    <th rowSpan="2" className="border border-slate-900 p-1 w-8 text-center">N°</th>
                    <th rowSpan="2" className="border border-slate-900 p-1">B. LLENO</th>
                    <th rowSpan="2" className="border border-slate-900 p-1">B. VACÍO</th>
                    <th rowSpan="2" className="border border-slate-900 p-1">COD/CAMA</th>
                    <th rowSpan="2" className="border border-slate-900 p-1">NOMBRE/SERVICIO</th>
                    <th colSpan="2" className="border border-slate-900 p-1 text-center bg-blue-50">6M3 ESSALUD</th>
                    <th colSpan="2" className="border border-slate-900 p-1 text-center bg-blue-50">10M3 ESSALUD</th>
                    <th colSpan="2" className="border border-slate-900 p-1 text-center bg-orange-50">10M3 PRAXAIR</th>
                    <th colSpan="2" className="border border-slate-900 p-1 text-center bg-emerald-50">B. PROPIO</th>
                    <th colSpan="2" className="border border-slate-900 p-1 text-center bg-purple-50">PERIFERIE</th>
                    <th rowSpan="2" className="border border-slate-900 p-1 text-center bg-slate-200">FIRMA</th>
                  </tr>
                  <tr className="bg-slate-50 text-[8px]">
                    <th className="border border-slate-900 p-0.5 w-6 text-center">LL</th><th className="border border-slate-900 p-0.5 w-6 text-center">V</th>
                    <th className="border border-slate-900 p-0.5 w-6 text-center">LL</th><th className="border border-slate-900 p-0.5 w-6 text-center">V</th>
                    <th className="border border-slate-900 p-0.5 w-6 text-center">LL</th><th className="border border-slate-900 p-0.5 w-6 text-center">V</th>
                    <th className="border border-slate-900 p-0.5 w-6 text-center">LL</th><th className="border border-slate-900 p-0.5 w-6 text-center">V</th>
                    <th className="border border-slate-900 p-0.5 w-6 text-center">LL</th><th className="border border-slate-900 p-0.5 w-6 text-center">V</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {(movements.length > 0 ? movements : Array(10).fill({})).map((move, idx) => (
                    <tr key={idx} className="h-7 hover:bg-slate-50">
                      <td className="border border-slate-400 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-400 px-2 font-mono">{move.cylinder_movements?.find(cm => cm.action === 'Exit')?.cylinder?.serial_number || ''}</td>
                      <td className="border border-slate-400 px-2 font-mono">{move.cylinder_movements?.find(cm => cm.action === 'Entry')?.cylinder?.serial_number || ''}</td>
                      <td className="border border-slate-400 text-center">{move.bed?.bed_number || move.service?.name?.substring(0, 3) || ''}</td>
                      <td className="border border-slate-400 px-2 uppercase truncate max-w-[150px] font-bold">{move.patient?.full_name || move.service?.name || ''}</td>
                      {/* 6M3 ESSALUD */}
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Exit' && cm.cylinder?.capacity == 6) ? 'X' : ''}</td>
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Entry' && cm.cylinder?.capacity == 6) ? 'X' : ''}</td>
                      {/* 10M3 ESSALUD */}
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Exit' && cm.cylinder?.capacity == 10 && cm.cylinder?.ownership_type_id == 1) ? 'X' : ''}</td>
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Entry' && cm.cylinder?.capacity == 10 && cm.cylinder?.ownership_type_id == 1) ? 'X' : ''}</td>
                      {/* 10M3 PRAXAIR */}
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Exit' && cm.cylinder?.capacity == 10 && (cm.cylinder?.ownership_type_id == 2 || cm.cylinder?.ownership_type_id == 3)) ? 'X' : ''}</td>
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Entry' && cm.cylinder?.capacity == 10 && (cm.cylinder?.ownership_type_id == 2 || cm.cylinder?.ownership_type_id == 3)) ? 'X' : ''}</td>
                      {/* B. PROPIO */}
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Exit' && cm.cylinder?.ownership_type_id == 4) ? 'X' : ''}</td>
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Entry' && cm.cylinder?.ownership_type_id == 4) ? 'X' : ''}</td>
                      {/* PERIFERIE */}
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Exit' && cm.cylinder?.ownership_type_id == 5) ? 'X' : ''}</td>
                      <td className="border border-slate-400 text-center font-black">{move.cylinder_movements?.some(cm => cm.action === 'Entry' && cm.cylinder?.ownership_type_id == 5) ? 'X' : ''}</td>
                      <td className="border border-slate-400"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Lado derecho: Nombre del Operador vertical */}
              <div className="w-12 bg-slate-100 border-y-2 border-r-2 border-slate-900 flex items-center justify-center p-2">
                <p className="rotate-180 [writing-mode:vertical-lr] font-black text-slate-800 uppercase tracking-widest text-xs whitespace-nowrap">
                  {operators.join(' / ') || 'SIN OPERADOR'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KardexAttentionTable;
