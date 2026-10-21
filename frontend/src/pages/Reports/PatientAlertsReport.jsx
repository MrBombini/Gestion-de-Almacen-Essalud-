import { useState, useMemo } from 'react';
import { 
    MdWarning, 
    MdSearch, 
    MdPeople, 
    MdPhone, 
    MdAccessTime, 
    MdRefresh, 
    MdErrorOutline, 
    MdAssignmentLate,
    MdFilterList
} from 'react-icons/md';
import useFetch from '../../hooks/useFetch';
import { format, differenceInDays } from 'date-fns';

const PatientAlertsReport = () => {
    // Margen de meses para el filtro en backend (por defecto 1 mes a más)
    const [retentionMonths, setRetentionMonths] = useState(1);
    const [reasonFilter, setReasonFilter] = useState('ALL'); // 'ALL' | 'LOAN' | '1M' | '2M' | '3M'
    const [searchTerm, setSearchTerm] = useState('');

    const { data: alertsData, loading, error, execute } = useFetch(
        `/reports/patient-alerts?months=${retentionMonths}`
    );
    const alerts = Array.isArray(alertsData) ? alertsData : (alertsData?.data || []);

    // Calcular días transcurridos / fecha de salida
    const getDaysDelayed = (cylinder) => {
        if (cylinder.retention_days !== undefined && cylinder.exit_date) {
            return { date: new Date(cylinder.exit_date), days: cylinder.retention_days };
        }
        const movements = cylinder.movements || [];
        const exits = movements.filter(m => m.action === 'Exit').sort((a, b) => {
            const dateA = a.inventory_movement ? a.inventory_movement.movement_at : a.created_at;
            const dateB = b.inventory_movement ? b.inventory_movement.movement_at : b.created_at;
            return new Date(dateB) - new Date(dateA);
        });
        
        if (exits.length > 0) {
            const lastExit = exits[0];
            const date = lastExit.inventory_movement ? lastExit.inventory_movement.movement_at : lastExit.created_at;
            const daysSince = differenceInDays(new Date(), new Date(date));
            return { date: new Date(date), days: daysSince };
        }
        return { date: null, days: 0 };
    };

    // Estadísticas
    const stats = useMemo(() => {
        let loanExpired = 0;
        let retained1to2M = 0;
        let retained3MPlus = 0;

        alerts.forEach(cyl => {
            if (cyl.alert_reason === 'Préstamo Vencido') {
                loanExpired++;
            } else {
                const { days } = getDaysDelayed(cyl);
                if (days >= 90) {
                    retained3MPlus++;
                } else {
                    retained1to2M++;
                }
            }
        });

        return {
            total: alerts.length,
            loanExpired,
            retained1to2M,
            retained3MPlus,
        };
    }, [alerts]);

    // Filtrar por término de búsqueda y por filtro rápido de motivo
    const filteredAlerts = useMemo(() => {
        return alerts.filter(cyl => {
            const matchesSearch = 
                cyl.current_patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                cyl.current_patient?.dni?.includes(searchTerm) ||
                cyl.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (reasonFilter === 'ALL') return true;
            if (reasonFilter === 'LOAN') return cyl.alert_reason === 'Préstamo Vencido';

            const { days } = getDaysDelayed(cyl);
            if (reasonFilter === '1M') return cyl.alert_reason !== 'Préstamo Vencido' && days >= 30 && days < 60;
            if (reasonFilter === '2M') return cyl.alert_reason !== 'Préstamo Vencido' && days >= 60 && days < 90;
            if (reasonFilter === '3M') return cyl.alert_reason !== 'Préstamo Vencido' && days >= 90;

            return true;
        });
    }, [alerts, searchTerm, reasonFilter]);

    return (
        <div className="space-y-6 pb-12">
            {/* Cabecera Principal */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
                        <MdWarning className="text-3xl" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                Alertas de Pacientes
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Margen: ≥ 1 Mes
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm mt-1">
                            Seguimiento preventivo de cilindros de oxígeno en poder de pacientes por más de 1 mes y préstamos con fecha vencida.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => execute()}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                    <MdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* KPIs / Tarjetas de Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                    onClick={() => setReasonFilter('ALL')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        reasonFilter === 'ALL' 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Total en Alerta</span>
                        <MdPeople className="text-2xl opacity-70" />
                    </div>
                    <div className="text-3xl font-black mt-2">{stats.total}</div>
                    <div className="text-xs mt-1 opacity-75">Pacientes con atención requerida</div>
                </div>

                <div 
                    onClick={() => setReasonFilter(reasonFilter === '1M' ? 'ALL' : '1M')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        reasonFilter === '1M' 
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Retenido 1 a 2 Meses</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            30-59 días
                        </span>
                    </div>
                    <div className="text-3xl font-black mt-2 text-amber-600">{stats.retained1to2M}</div>
                    <div className="text-xs mt-1 text-slate-500">Alerta preventiva inicial</div>
                </div>

                <div 
                    onClick={() => setReasonFilter(reasonFilter === '3M' ? 'ALL' : '3M')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        reasonFilter === '3M' 
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Retenido ≥ 3 Meses</span>
                        <MdErrorOutline className="text-2xl text-rose-500" />
                    </div>
                    <div className="text-3xl font-black mt-2 text-rose-600">{stats.retained3MPlus}</div>
                    <div className="text-xs mt-1 text-slate-500">Crítico: seguimiento urgente</div>
                </div>

                <div 
                    onClick={() => setReasonFilter(reasonFilter === 'LOAN' ? 'ALL' : 'LOAN')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        reasonFilter === 'LOAN' 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Préstamo Vencido</span>
                        <MdAssignmentLate className="text-2xl text-purple-500" />
                    </div>
                    <div className="text-3xl font-black mt-2 text-purple-600">{stats.loanExpired}</div>
                    <div className="text-xs mt-1 text-slate-500">Superó fecha comprometida</div>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Buscador */}
                    <div className="flex-1 flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <MdSearch className="text-slate-400 text-xl shrink-0" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre de paciente, DNI o N° de serie de cilindro..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded hover:bg-slate-100"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Selector de Margen Mínimo en Backend */}
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <MdFilterList className="text-slate-400 text-lg shrink-0" />
                        <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                            Margen Mínimo:
                        </label>
                        <select
                            value={retentionMonths}
                            onChange={(e) => setRetentionMonths(parseInt(e.target.value))}
                            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                        >
                            <option value={1}>≥ 1 Mes (Recomendado)</option>
                            <option value={2}>≥ 2 Meses</option>
                            <option value={3}>≥ 3 Meses</option>
                        </select>
                    </div>

                    {/* Reset de filtro si hay uno activo */}
                    {reasonFilter !== 'ALL' && (
                        <button
                            onClick={() => setReasonFilter('ALL')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 transition-colors"
                        >
                            Ver Todos ({alerts.length})
                        </button>
                    )}
                </div>

                {/* Tabla de Alertas */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                <th className="p-4">Paciente</th>
                                <th className="p-4">Contacto / Teléfono</th>
                                <th className="p-4">Cilindro / Balón</th>
                                <th className="p-4">Motivo Alerta</th>
                                <th className="p-4">Tiempo Transcurrido</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-3" />
                                        <p className="text-xs font-semibold text-slate-500">Cargando alertas de pacientes...</p>
                                    </td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-red-600 bg-red-50">
                                        <p className="font-bold">Error al cargar alertas</p>
                                        <p className="text-xs mt-1">{error}</p>
                                    </td>
                                </tr>
                            )}
                            {!loading && !error && filteredAlerts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-500">
                                        <MdPeople className="text-4xl mx-auto mb-3 text-slate-300" />
                                        <p className="font-bold text-slate-700">No se encontraron alertas</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {searchTerm 
                                                ? 'No hay resultados que coincidan con la búsqueda.' 
                                                : 'Todos los pacientes están dentro del margen de atención normal.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                            {!loading && !error && filteredAlerts.map(cyl => {
                                const patient = cyl.current_patient;
                                const isLoan = cyl.alert_reason === 'Préstamo Vencido';
                                const { date, days } = getDaysDelayed(cyl);

                                // Nivel de severidad para estilos visuales
                                let badgeClass = '';
                                let icon = '⚠️';
                                if (isLoan) {
                                    badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                                    icon = '⏳';
                                } else if (days >= 90) {
                                    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-black';
                                    icon = '🚨';
                                } else if (days >= 60) {
                                    badgeClass = 'bg-orange-100 text-orange-800 border-orange-200';
                                    icon = '⚠️';
                                } else {
                                    badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                                    icon = '⏱️';
                                }

                                const alertText = isLoan
                                    ? 'Préstamo Vencido'
                                    : days >= 90
                                        ? 'Retenido > 3 meses (Crítico)'
                                        : days >= 60
                                            ? 'Retenido > 2 meses'
                                            : 'Retenido > 1 mes';

                                return (
                                    <tr key={cyl.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Paciente */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">
                                                {patient?.full_name || 'Paciente no identificado'}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                DNI: {patient?.dni || 'S/D'}
                                                {patient?.prescriptions?.length > 0 && (
                                                    <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                                                        Receta activa
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Contacto */}
                                        <td className="p-4">
                                            {patient?.phone1 ? (
                                                <a 
                                                    href={`tel:${patient.phone1}`}
                                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                                                    title="Llamar al paciente"
                                                >
                                                    <MdPhone className="text-sm" />
                                                    {patient.phone1}
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">Sin teléfono</span>
                                            )}
                                            {patient?.phone2 && (
                                                <div className="text-xs text-slate-500 mt-1 pl-1">
                                                    Alt: {patient.phone2}
                                                </div>
                                            )}
                                        </td>

                                        {/* Cilindro */}
                                        <td className="p-4">
                                            <div className="font-mono font-bold text-slate-800">
                                                {cyl.serial_number}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                {cyl.ownership_type?.name || 'Propio'}
                                                {cyl.capacity && ` · ${cyl.capacity}m³`}
                                            </div>
                                        </td>

                                        {/* Motivo de Alerta */}
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${badgeClass}`}>
                                                <span>{icon}</span>
                                                {alertText}
                                            </span>
                                        </td>

                                        {/* Detalle de tiempo */}
                                        <td className="p-4">
                                            {isLoan ? (
                                                <div>
                                                    <div className="text-xs text-slate-600">
                                                        Fecha límite: <span className="font-bold">{format(new Date(cyl.expected_return_date), 'dd/MM/yyyy')}</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-purple-700 mt-0.5 flex items-center gap-1">
                                                        <MdAccessTime /> Retraso: {differenceInDays(new Date(), new Date(cyl.expected_return_date))} días
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-xs text-slate-600">
                                                        Entregado: <span className="font-bold">{date ? format(date, 'dd/MM/yyyy') : 'Desconocido'}</span>
                                                    </div>
                                                    <div className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${
                                                        days >= 90 ? 'text-rose-600' : days >= 60 ? 'text-orange-600' : 'text-amber-700'
                                                    }`}>
                                                        <MdAccessTime /> {days} días retenido ({Math.floor(days / 30)} mes{Math.floor(days / 30) > 1 ? 'es' : ''})
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PatientAlertsReport;
