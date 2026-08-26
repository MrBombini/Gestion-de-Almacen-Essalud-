import { useState, useEffect } from 'react';
import { MdWarning, MdSearch, MdPeople } from 'react-icons/md';
import useFetch from '../../hooks/useFetch';
import { format, differenceInDays } from 'date-fns';

const PatientAlertsReport = () => {
    const { data: alertsData, loading, error } = useFetch('/reports/patient-alerts');
    const alerts = Array.isArray(alertsData) ? alertsData : (alertsData?.data || []);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredAlerts = alerts.filter(cyl => 
        cyl.current_patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        cyl.current_patient?.dni?.includes(searchTerm) ||
        cyl.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate days delayed from 3 months ago (approximate or just days since issue)
    const getDaysDelayed = (cylinder) => {
        // Find last exit movement
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl">
                        <MdWarning className="text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Alertas de Pacientes</h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Préstamos con tiempo límite vencido y balones retenidos hace más de 3 meses.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <MdSearch className="text-slate-400 text-xl" />
                        <input 
                            type="text" 
                            placeholder="Buscar por paciente, DNI o código de balón..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balón</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo Alerta</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                    </td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-red-500">{error}</td>
                                </tr>
                            )}
                            {!loading && filteredAlerts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-500">
                                        <MdPeople className="text-4xl mx-auto mb-3 text-slate-300" />
                                        <p>No hay alertas. Todos los pacientes están al día o no se encontraron coincidencias.</p>
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredAlerts.map(cyl => {
                                const patient = cyl.current_patient;
                                const alertReason = cyl.alert_reason || 'Retenido > 3 meses';
                                const { date, days } = getDaysDelayed(cyl);
                                
                                return (
                                    <tr key={cyl.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{patient?.full_name || 'Desconocido'}</div>
                                            <div className="text-xs font-medium text-slate-500">DNI: {patient?.dni || 'S/N'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-700">{patient?.phone1 || 'S/N'}</div>
                                            {patient?.phone2 && <div className="text-xs text-slate-500">{patient.phone2}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700">{cyl.serial_number}</div>
                                            <div className="text-xs text-slate-500">{cyl.ownership_type?.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${alertReason === 'Préstamo Vencido' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {alertReason === 'Préstamo Vencido' ? '⏳ Préstamo Vencido' : '⚠️ Retenido > 3 meses'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {alertReason === 'Préstamo Vencido' ? (
                                                <>
                                                    <div className="text-sm text-slate-700 font-bold">
                                                        Venció el: {format(new Date(cyl.expected_return_date), 'dd/MM/yyyy')}
                                                    </div>
                                                    <div className="text-xs text-orange-600 font-bold mt-0.5">
                                                        Retraso: {differenceInDays(new Date(), new Date(cyl.expected_return_date))} días
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-sm text-slate-700">
                                                        Prestado: {date ? format(date, 'dd/MM/yyyy') : 'Desconocido'}
                                                    </div>
                                                    <div className="text-xs text-red-600 font-bold mt-0.5">
                                                        Hace {days} días
                                                    </div>
                                                </>
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
