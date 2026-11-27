import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdLocationOn, MdPhone, MdAssignment, MdClose, MdHistory, MdWarning, MdDownload } from 'react-icons/md';
import { FaBedPulse } from 'react-icons/fa6';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';
import api from '../services/api';
import { exportPatientsCatalogReport } from '../utils/excelExportService';

const Patients = () => {
    const [currentPage, setCurrentPage]     = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchTerm, setSearchTerm]       = useState('');
    const [filterRxStatus, setFilterRxStatus] = useState('ALL');
    const [exportingExcel, setExportingExcel] = useState(false);
    const [loadingCodes, setLoadingCodes]   = useState(false);
    // Toggles de tipo de código para el formulario
    const [hasTrasiego, setHasTrasiego]     = useState(false);
    const [hasExchange, setHasExchange]     = useState(false);
    // Códigos pre-cargados desde el backend (para reutilizarlos si el usuario activa/desactiva)
    const [prefetchedCodes, setPrefetchedCodes] = useState({ trasiego_code: '', exchange_code: '' });
    
    // NUEVO: Estado para el filtro de códigos
    const [filterCodeType, setFilterCodeType] = useState('ALL'); 

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Reseteamos a la página 1 si cambia cualquier filtro
    useEffect(() => {
        setCurrentPage(1);
    }, [filterRxStatus, filterCodeType]);

    // Añadimos el nuevo parámetro code_type a la URL
    const { data: patients, loading, execute, refetch } = useFetch(`/patients?page=${currentPage}&search=${debouncedSearch}&rx_status=${filterRxStatus}&code_type=${filterCodeType}`);

    const [isModalOpen, setIsModalOpen]     = useState(false);
    const [editingId, setEditingId]         = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // ── Sub-CRUD de Recetas ──
    const [rxPatient, setRxPatient]     = useState(null);
    const [rxModal, setRxModal]         = useState(false);
    const [rxEditId, setRxEditId]       = useState(null);
    const [rxForm, setRxForm]           = useState({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
    const [rxSaving, setRxSaving]       = useState(false);
    const [rxError, setRxError]         = useState(null);

    const emptyForm = {
        full_name: '', dni: '', trasiego_code: '', exchange_code: '', address: '', phone1: '', phone2: '',
        dosage: '', usage_time: '', expires_at: '', promissory_note: '', authorization_date: ''
    };
    const [formData, setFormData] = useState(emptyForm);

    const handleOpenCreate = async () => {
        setHasTrasiego(false);
        setHasExchange(false);
        setPrefetchedCodes({ trasiego_code: '', exchange_code: '' });
        setFormData(emptyForm);
        setEditingId(null);
        setIsModalOpen(true);
        setLoadingCodes(true);
        try {
            const res = await api.get('/patients/next-codes');
            setPrefetchedCodes({
                exchange_code: res.data.exchange_code ?? '',
                trasiego_code: res.data.trasiego_code ?? '',
            });
        } catch {
            // Si falla, el usuario puede escribir manualmente
        } finally {
            setLoadingCodes(false);
        }
    };

    const handleOpenEdit = (patient) => {
        const rx = patient.prescriptions?.find(p => p.status === 'active') || {};
        setFormData({
            full_name: patient.full_name, dni: patient.dni || '',
            trasiego_code: patient.trasiego_code || '', exchange_code: patient.exchange_code || '',
            address: patient.address || '', phone1: patient.phone1 || '', phone2: patient.phone2 || '',
            dosage: rx.dosage || '', usage_time: rx.usage_time || '', expires_at: rx.expires_at || '',
            promissory_note: rx.promissory_note || '', authorization_date: rx.authorization_date || ''
        });
        // Detectar qué códigos tiene ya el paciente
        setHasTrasiego(!!patient.trasiego_code);
        setHasExchange(!!patient.exchange_code);
        setPrefetchedCodes({ trasiego_code: '', exchange_code: '' });
        setEditingId(patient.id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (editingId) {
                await execute({ url: `/patients/${editingId}`, method: 'PUT', body: formData });
            } else {
                await execute({ url: '/patients', method: 'POST', body: formData });
            }
            setIsModalOpen(false);
            refetch();
        } catch (err) {
            alert(err?.response?.data?.message || 'Error al guardar.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este paciente? Se eliminarán también sus recetas.')) return;
        try { await execute({ url: `/patients/${id}`, method: 'DELETE' }); refetch(); }
        catch (err) { alert(err?.response?.data?.message || 'Error al eliminar.'); }
    };

    // ── Handlers sub-CRUD recetas ──
    const openRxPanel = (patient) => {
        setRxPatient(patient);
        setRxEditId(null);
        setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
        setRxError(null);
        setRxModal(true);
    };

    const openRxEdit = (rx) => {
        setRxEditId(rx.id);
        setRxForm({ dosage: rx.dosage || '', usage_time: rx.usage_time || '', expires_at: rx.expires_at || '', authorization_date: rx.authorization_date || '', promissory_note: rx.promissory_note || '', status: rx.status });
    };

    const handleRxSubmit = async (e) => {
        e.preventDefault();
        setRxSaving(true); setRxError(null);
        try {
            if (rxEditId) {
                await api.put(`/prescriptions/${rxEditId}`, rxForm);
            } else {
                await api.post('/prescriptions', { ...rxForm, patient_id: rxPatient.id });
            }
            setRxEditId(null);
            setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' });
            refetch();
            const res = await api.get(`/patients/${rxPatient.id}`);
            setRxPatient(res.data);
        } catch (err) {
            setRxError(err?.response?.data?.message || 'Error al guardar la receta.');
        } finally {
            setRxSaving(false);
        }
    };

    const handleRxDelete = async (rxId) => {
        if (!window.confirm('¿Eliminar esta receta?')) return;
        try {
            await api.delete(`/prescriptions/${rxId}`);
            refetch();
            const res = await api.get(`/patients/${rxPatient.id}`);
            setRxPatient(res.data);
        } catch (err) {
            alert(err?.response?.data?.message || 'No se pudo eliminar.');
        }
    };

    const handleExportExcel = async () => {
        setExportingExcel(true);
        try {
            const res = await api.get('/patients', {
                params: {
                    per_page: 'all',
                    search: debouncedSearch || undefined,
                    rx_status: filterRxStatus,
                    code_type: filterCodeType,
                }
            });
            const allPatients = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            if (allPatients.length === 0) {
                alert('No se encontraron pacientes para exportar con los filtros seleccionados.');
                return;
            }
            await exportPatientsCatalogReport(allPatients, filterCodeType);
        } catch (error) {
            console.error('Error al exportar pacientes:', error);
            alert('Error al generar la exportación de pacientes.');
        } finally {
            setExportingExcel(false);
        }
    };

    const patientsList = Array.isArray(patients) ? patients : (patients?.data || []);
    const filtered = patientsList;

    const rxStatusBadge = (status) => {
        const map = { active: 'bg-emerald-50 text-emerald-700 border-emerald-200', expired: 'bg-red-50 text-red-700 border-red-200', inactive: 'bg-slate-50 text-slate-600 border-slate-200' };
        const label = { active: 'Activa', expired: 'Vencida', inactive: 'Inactiva' };
        return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase shrink-0 ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>{label[status] || status}</span>;
    };

    return (
        <div className="space-y-4 sm:space-y-6 pb-10">
            {/* Cabecera Responsiva */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 sm:p-4 bg-purple-50 text-purple-600 rounded-xl shrink-0"><FaBedPulse className="text-2xl" /></div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Catálogo de Pacientes</h2>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">Gestiona pacientes y sus recetas de oxígeno.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                    <button 
                        onClick={handleExportExcel} 
                        disabled={exportingExcel}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:scale-105 shrink-0"
                        title={`Exportar a Excel según filtros (${filterCodeType === 'ALL' ? 'Todos' : filterCodeType === 'TRASIEGO' ? 'Con Trasiego' : 'Con Canje'})`}
                    >
                        {exportingExcel ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Exportando...</span>
                            </>
                        ) : (
                            <>
                                <MdDownload className="text-xl" />
                                <span>Exportar Excel</span>
                            </>
                        )}
                    </button>
                    <button onClick={handleOpenCreate} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:scale-105 shrink-0">
                        <MdAdd className="text-xl" /> Nuevo Paciente
                    </button>
                </div>
            </div>

            {/* Contenedor de Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* Filtros Superiores */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <MdSearch className="text-slate-400 text-xl shrink-0" />
                        <input type="text" placeholder="Buscar por nombre o DNI..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                        />
                    </div>
                    
                    {/* Contenedor responsivo para los selects */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Código:</label>
                            <select value={filterCodeType} onChange={(e) => setFilterCodeType(e.target.value)}
                                className="w-full sm:w-auto bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 shadow-sm">
                                <option value="ALL">TODOS</option>
                                <option value="TRASIEGO">CON TRASIEGO</option>
                                <option value="EXCHANGE">CON CANJE</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Receta:</label>
                            <select value={filterRxStatus} onChange={(e) => setFilterRxStatus(e.target.value)}
                                className="w-full sm:w-auto bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 shadow-sm">
                                <option value="ALL">TODAS</option>
                                <option value="ACTIVE">CON RECETA ACTIVA</option>
                                <option value="NONE">SIN RECETA ACTIVA</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading && <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>}

                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Paciente</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Receta Activa</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Contacto</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Códigos</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No se encontraron pacientes con esos filtros.</td></tr>
                                ) : filtered.map((patient) => {
                                    const activeRx = patient.prescriptions?.find(p => p.status === 'active');
                                    return (
                                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="text-sm font-bold text-slate-800">{patient.full_name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">DNI: {patient.dni || '—'}</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                {activeRx ? (
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-bold text-blue-600">
                                                            {activeRx.dosage ? `${activeRx.dosage} L/min` : ''} 
                                                            {activeRx.dosage && activeRx.usage_time ? ' | ' : ''}
                                                            {activeRx.usage_time ? `${activeRx.usage_time} hrs` : ''}
                                                            {!activeRx.dosage && !activeRx.usage_time ? 'Receta de Oxígeno' : ''}
                                                        </div>
                                                        <div className={`text-[10px] flex items-center gap-1 ${activeRx.days_remaining < 0 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                                            {activeRx.days_remaining < 0 && <MdWarning className="shrink-0" />}
                                                            <span className="truncate">
                                                              {activeRx.days_remaining === null ? (
                                                                  `Vence: ${formatDate(activeRx.expires_at) || 'No vence'}`
                                                              ) : activeRx.days_remaining < 0 ? (
                                                                  `Vencida hace ${Math.abs(activeRx.days_remaining)} días`
                                                              ) : activeRx.days_remaining === 0 ? (
                                                                  'Vence hoy'
                                                              ) : (
                                                                  `${activeRx.days_remaining} días restantes`
                                                              )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-xs text-slate-400 italic">Sin receta activa</span>}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><MdPhone className="text-slate-400 shrink-0" />{patient.phone1 || '—'}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1"><MdLocationOn className="text-slate-400 text-sm shrink-0" /><span className="truncate max-w-[140px]" title={patient.address}>{patient.address || '—'}</span></div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 space-y-1">
                                                {patient.trasiego_code && <div><span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 text-[9px] font-bold whitespace-nowrap">TRASIEGO: {patient.trasiego_code}</span></div>}
                                                {patient.exchange_code && <div><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 text-[9px] font-bold whitespace-nowrap">CANJE: {patient.exchange_code}</span></div>}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right space-x-1 whitespace-nowrap">
                                                <button onClick={() => openRxPanel(patient)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Ver/Gestionar Recetas">
                                                    <MdHistory className="text-lg" />
                                                </button>
                                                <button onClick={() => handleOpenEdit(patient)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                    <MdEdit className="text-lg" />
                                                </button>
                                                <button onClick={() => handleDelete(patient.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                    <MdDelete className="text-lg" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Paginación Responsiva */}
                        {patients && patients.last_page > 1 && (
                            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50 gap-4">
                                <span className="text-sm text-slate-500 font-medium">
                                    Página <strong className="text-slate-800">{patients.current_page}</strong> de <strong className="text-slate-800">{patients.last_page}</strong> 
                                    <span className="ml-2 hidden sm:inline">(Total: {patients.total})</span>
                                </span>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Anterior
                                    </button>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(patients.last_page, p + 1))}
                                        disabled={currentPage === patients.last_page}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════
                MODAL PRINCIPAL: Crear / Editar Paciente
            ═══════════════════════════════════════════ */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Paciente' : 'Nuevo Paciente'} maxWidth="max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ── Datos Personales ── */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Datos Personales</p>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                            <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">DNI</label>
                                <input type="text" inputMode="numeric" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Celular</label>
                                <input type="text" inputMode="tel" value={formData.phone1} onChange={e => setFormData({...formData, phone1: e.target.value})}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección</label>
                            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                        </div>
                    </div>

                    {/* ── Receta Inicial ── */}
                    <div className="space-y-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest border-b border-blue-100 pb-1 flex items-center gap-1"><MdAssignment />Receta Inicial</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Dosif. (L/min)</label>
                                <input type="text" inputMode="decimal" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})}
                                    placeholder="Ej: 3" className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Uso (hrs/día)</label>
                                <input type="text" inputMode="decimal" value={formData.usage_time} onChange={e => setFormData({...formData, usage_time: e.target.value})}
                                    placeholder="Ej: 24" className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">F. Autorización</label>
                                <input type="date" value={formData.authorization_date} onChange={e => setFormData({...formData, authorization_date: e.target.value})}
                                    className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">F. Vencimiento</label>
                                <input type="date" value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})}
                                    className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Nº Pagaré</label>
                            <input type="text" value={formData.promissory_note} onChange={e => setFormData({...formData, promissory_note: e.target.value})}
                                placeholder="PAG-2024-001" className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                    </div>

                    {/* ══════════════════════════════════════
                        SELECTOR DE TIPO DE CÓDIGO (CARD TOGGLE)
                    ══════════════════════════════════════ */}
                    <div className="space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">
                            Modalidad del Paciente PADOMI
                        </p>
                        <p className="text-xs text-slate-500">Selecciona los tipos de código que aplican:</p>

                        <div className="flex flex-col gap-3">
                            {/* ── Card: Código Trasiego ── */}
                            <div
                                onClick={() => {
                                    const next = !hasTrasiego;
                                    setHasTrasiego(next);
                                    setFormData(prev => ({
                                        ...prev,
                                        trasiego_code: next ? (prefetchedCodes.trasiego_code || prev.trasiego_code) : '',
                                    }));
                                }}
                                className={`relative cursor-pointer rounded-xl border-2 p-3.5 transition-all select-none ${
                                    hasTrasiego
                                        ? 'border-orange-400 bg-orange-50 shadow-sm shadow-orange-100'
                                        : 'border-slate-200 bg-white active:bg-orange-50/40'
                                }`}
                            >
                                {/* Cabecera de la card: icono + texto + toggle */}
                                <div className="flex items-center gap-3">
                                    {/* Checkbox visual tipo pill a la izquierda */}
                                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        hasTrasiego ? 'bg-orange-500 border-orange-500' : 'border-slate-300 bg-white'
                                    }`}>
                                        {hasTrasiego && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-xl leading-none">🔁</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-black text-sm leading-tight ${hasTrasiego ? 'text-orange-700' : 'text-slate-700'}`}>
                                            Código Trasiego
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Recarga por decantación · Formato P####</p>
                                    </div>
                                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                                        hasTrasiego ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {hasTrasiego ? 'ON' : 'OFF'}
                                    </span>
                                </div>

                                {/* Input expansible cuando está activo */}
                                {hasTrasiego && (
                                    <div className="mt-3 pt-3 border-t border-orange-200" onClick={e => e.stopPropagation()}>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.trasiego_code}
                                                onChange={e => setFormData({ ...formData, trasiego_code: e.target.value.toUpperCase() })}
                                                className="w-full px-3 py-2.5 border-2 border-orange-300 rounded-lg text-sm font-bold uppercase outline-none focus:border-orange-500 bg-white text-orange-800 pr-14 touch-action-manipulation"
                                                placeholder={loadingCodes ? 'Calculando...' : 'Ej: P1090'}
                                                readOnly={loadingCodes}
                                                inputMode="text"
                                                autoCapitalize="characters"
                                            />
                                            {loadingCodes ? (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                !editingId && (
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full border border-orange-200">AUTO</span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Card: Código Intercambio ── */}
                            <div
                                onClick={() => {
                                    const next = !hasExchange;
                                    setHasExchange(next);
                                    setFormData(prev => ({
                                        ...prev,
                                        exchange_code: next ? (prefetchedCodes.exchange_code || prev.exchange_code) : '',
                                    }));
                                }}
                                className={`relative cursor-pointer rounded-xl border-2 p-3.5 transition-all select-none ${
                                    hasExchange
                                        ? 'border-blue-400 bg-blue-50 shadow-sm shadow-blue-100'
                                        : 'border-slate-200 bg-white active:bg-blue-50/40'
                                }`}
                            >
                                {/* Cabecera de la card */}
                                <div className="flex items-center gap-3">
                                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        hasExchange ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'
                                    }`}>
                                        {hasExchange && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-xl leading-none">🔄</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-black text-sm leading-tight ${hasExchange ? 'text-blue-700' : 'text-slate-700'}`}>
                                            Código Intercambio
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Canje balón lleno/vacío · Formato ####</p>
                                    </div>
                                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                                        hasExchange ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {hasExchange ? 'ON' : 'OFF'}
                                    </span>
                                </div>

                                {/* Input expansible cuando está activo */}
                                {hasExchange && (
                                    <div className="mt-3 pt-3 border-t border-blue-200" onClick={e => e.stopPropagation()}>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.exchange_code}
                                                onChange={e => setFormData({ ...formData, exchange_code: e.target.value.toUpperCase() })}
                                                className="w-full px-3 py-2.5 border-2 border-blue-300 rounded-lg text-sm font-bold uppercase outline-none focus:border-blue-500 bg-white text-blue-800 pr-14 touch-action-manipulation"
                                                placeholder={loadingCodes ? 'Calculando...' : 'Ej: 3200'}
                                                readOnly={loadingCodes}
                                                inputMode="numeric"
                                            />
                                            {loadingCodes ? (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                !editingId && (
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-200">AUTO</span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Indicador si ninguno está activo */}
                        {!hasTrasiego && !hasExchange && (
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="text-base">ℹ️</span>
                                <p className="text-xs text-slate-400 italic leading-tight">
                                    Sin código asignado — el paciente no tendrá modalidad PADOMI.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={actionLoading}
                            className="flex-1 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors shadow-sm shadow-purple-200">
                            {actionLoading ? 'Guardando...' : 'Guardar Paciente'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ═══════════════════════════════════════════
                PANEL DE RECETAS (Sub-CRUD)
            ═══════════════════════════════════════════ */}
            <Modal isOpen={rxModal} onClose={() => setRxModal(false)} title={`📋 Recetas de ${rxPatient?.full_name || ''}`} elevated maxWidth="max-w-2xl">
                {rxError && <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded">{rxError}</div>}

                {/* Historial de recetas */}
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
                    {rxPatient?.prescriptions?.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-4">Sin recetas registradas.</p>
                    )}
                    {rxPatient?.prescriptions?.map(rx => (
                        <div key={rx.id} className={`flex flex-col sm:flex-row sm:items-start justify-between p-3 rounded-xl border text-xs gap-3 ${rx.status === 'active' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                    {rxStatusBadge(rx.status)}
                                    <span className="font-bold text-slate-700">{rx.dosage} L/min · {rx.usage_time} hrs</span>
                                </div>
                                <div className="text-slate-500 break-words">
                                    Autorización: {formatDate(rx.authorization_date)} · Vence: <span className={rx.days_remaining < 0 ? 'text-red-600 font-bold' : ''}>{formatDate(rx.expires_at)}</span>
                                    {rx.days_remaining !== null && (
                                        <span className={`ml-1 sm:ml-2 font-semibold ${rx.days_remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            ({rx.days_remaining < 0 ? `Vencida hace ${Math.abs(rx.days_remaining)}d` : rx.days_remaining === 0 ? 'Vence hoy' : `${rx.days_remaining}d restantes`})
                                        </span>
                                    )}
                                </div>
                                {rx.promissory_note && <div className="text-slate-400">Pagaré: {rx.promissory_note}</div>}
                            </div>
                            <div className="flex gap-2 sm:ml-3 shrink-0 self-end sm:self-auto border-t sm:border-none pt-2 sm:pt-0 w-full sm:w-auto justify-end border-slate-200">
                                <button onClick={() => openRxEdit(rx)} className="px-3 py-1.5 sm:p-1 bg-white sm:bg-transparent border sm:border-none border-slate-200 text-blue-500 hover:text-blue-700 rounded transition-colors flex items-center gap-1 font-semibold sm:font-normal"><MdEdit className="text-base" /> <span className="sm:hidden">Editar</span></button>
                                <button onClick={() => handleRxDelete(rx.id)} className="px-3 py-1.5 sm:p-1 bg-white sm:bg-transparent border sm:border-none border-slate-200 text-red-400 hover:text-red-600 rounded transition-colors flex items-center gap-1 font-semibold sm:font-normal"><MdDelete className="text-base" /> <span className="sm:hidden">Eliminar</span></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Formulario nueva/editar receta */}
                <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-700">{rxEditId ? '✏️ Editar Receta' : '➕ Nueva Receta'}</p>
                        {rxEditId && <button onClick={() => { setRxEditId(null); setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' }); }} className="text-slate-400 hover:text-red-500 transition-colors p-1"><MdClose className="text-xl" /></button>}
                    </div>
                    <form onSubmit={handleRxSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Dosificación</label>
                                <input type="text" value={rxForm.dosage} onChange={e => setRxForm({...rxForm, dosage: e.target.value})}
                                    placeholder="Ej: 3 L/min" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Tiempo Uso</label>
                                <input type="text" value={rxForm.usage_time} onChange={e => setRxForm({...rxForm, usage_time: e.target.value})}
                                    placeholder="Ej: 24 hrs" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Autorización *</label>
                                <input type="date" required value={rxForm.authorization_date} onChange={e => setRxForm({...rxForm, authorization_date: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Vencimiento *</label>
                                <input type="date" required value={rxForm.expires_at} onChange={e => setRxForm({...rxForm, expires_at: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Pagaré</label>
                                <input type="text" value={rxForm.promissory_note} onChange={e => setRxForm({...rxForm, promissory_note: e.target.value})}
                                    placeholder="PAG-2024-001" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
                                <select value={rxForm.status} onChange={e => setRxForm({...rxForm, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white focus:ring-2 focus:ring-purple-400">
                                    <option value="active">Activa</option>
                                    <option value="expired">Vencida</option>
                                    <option value="inactive">Inactiva</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={rxSaving} className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm">
                                {rxSaving ? 'Guardando...' : rxEditId ? 'Actualizar Receta' : 'Agregar Receta'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default Patients;