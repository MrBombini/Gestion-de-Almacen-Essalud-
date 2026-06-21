import { useState, useEffect } from 'react';
import { MdTrendingUp, MdDateRange, MdLocalHospital, MdScience, MdPeople, MdDirectionsBus } from 'react-icons/md';
import { FaWind } from 'react-icons/fa';
import api from '../../services/api';
import { format, subDays } from 'date-fns';

const ConsumptionDashboard = () => {
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/consumption?start_date=${startDate}&end_date=${endDate}`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching consumption data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const formatNumber = (num) => Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const cylCons = data?.cylinder_consumption || {
        MANIFOLD: 0, HOSPITALIZACION: 0, PADOMI: 0, PERIFERIA: 0
    };

    const totalCylinders = Object.values(cylCons).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Profesional */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                        <MdTrendingUp className="text-3xl text-blue-300" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Dashboard de Consumo</h1>
                        <p className="text-slate-400 font-medium mt-1">Reporte analítico de oxígeno por área y manifold</p>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-3 bg-black/20 p-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                        <MdDateRange className="text-slate-400" />
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-sm font-semibold outline-none text-white focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                        <span className="text-slate-500 font-bold">-</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-sm font-semibold outline-none text-white focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Tarjetas Principales (Manifold y Hospitalización solicitados) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tarjeta Manifold */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-110"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MdScience className="text-xl" /></div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Consumo Manifold</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-slate-800 tracking-tighter">{formatNumber(cylCons.MANIFOLD)}</span>
                                        <span className="text-lg font-bold text-slate-400">m³</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${totalCylinders ? (cylCons.MANIFOLD/totalCylinders)*100 : 0}%` }}></div>
                            </div>
                        </div>

                        {/* Tarjeta Hospitalización */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-full opacity-50 transition-transform group-hover:scale-110"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MdLocalHospital className="text-xl" /></div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hospitalización</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-slate-800 tracking-tighter">{formatNumber(cylCons.HOSPITALIZACION)}</span>
                                        <span className="text-lg font-bold text-slate-400">m³</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${totalCylinders ? (cylCons.HOSPITALIZACION/totalCylinders)*100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Otras Áreas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-colors">
                            <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl"><MdPeople className="text-2xl" /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Padomi</p>
                                <p className="text-2xl font-black text-slate-800">{formatNumber(cylCons.PADOMI)} <span className="text-sm text-slate-400 font-semibold">m³</span></p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-orange-300 transition-colors">
                            <div className="p-3.5 bg-orange-50 text-orange-600 rounded-xl"><MdDirectionsBus className="text-2xl" /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Periferia</p>
                                <p className="text-2xl font-black text-slate-800">{formatNumber(cylCons.PERIFERIA)} <span className="text-sm text-slate-400 font-semibold">m³</span></p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white">
                            <div className="p-3.5 bg-slate-800 text-white rounded-xl"><FaWind className="text-2xl" /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consumo Total</p>
                                <p className="text-2xl font-black text-slate-800">{formatNumber(totalCylinders)} <span className="text-sm text-slate-400 font-semibold">m³</span></p>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default ConsumptionDashboard;
