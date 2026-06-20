import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdLocationOn, MdPhone, MdAssignment, MdClose, MdHistory, MdWarning } from 'react-icons/md';
import { FaBedPulse } from 'react-icons/fa6';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';
import api from '../services/api';

const Patients = () => {
    const [currentPage, setCurrentPage]     = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchTerm, setSearchTerm]       = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const { data: patients, loading, execute, refetch } = useFetch(`/patients?page=${currentPage}&search=${debouncedSearch}`);

    const [isModalOpen, setIsModalOpen]     = useState(false);
    const [editingId, setEditingId]         = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // ── Sub-CRUD de Recetas ──
    const [rxPatient, setRxPatient]     = useState(null); // paciente cuyas recetas se ven
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

    const handleOpenCreate = () => { setFormData(emptyForm); setEditingId(null); setIsModalOpen(true); };

    const handleOpenEdit = (patient) => {
        const rx = patient.prescriptions?.find(p => p.status === 'active') || {};
        setFormData({
            full_name: patient.full_name, dni: patient.dni || '',
            trasiego_code: patient.trasiego_code || '', exchange_code: patient.exchange_code || '',
            address: patient.address || '', phone1: patient.phone1 || '', phone2: patient.phone2 || '',
            dosage: rx.dosage || '', usage_time: rx.usage_time || '', expires_at: rx.expires_at || '',
            promissory_note: rx.promissory_note || '', authorization_date: rx.authorization_date || ''
        });
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
            // Actualizar rxPatient con datos frescos
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

    const patientsList = Array.isArray(patients) ? patients : (patients?.data || []);
    const filtered = patientsList;

    const rxStatusBadge = (status) => {
        const map = { active: 'bg-emerald-50 text-emerald-700 border-emerald-200', expired: 'bg-red-50 text-red-700 border-red-200', inactive: 'bg-slate-50 text-slate-600 border-slate-200' };
        const label = { active: 'Activa', expired: 'Vencida', inactive: 'Inactiva' };
        return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>{label[status] || status}</span>;
    };

    return (
        <div className="space-y-6">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FaBedPulse className="text-2xl" /></div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Pacientes</h2>
                        <p className="text-slate-500 text-sm mt-1">Gestiona pacientes y sus recetas de oxígeno.</p>
                    </div>
                </div>
                <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:scale-105">
                    <MdAdd className="text-xl" /> Nuevo Paciente
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <MdSearch className="text-slate-400 text-xl" />
                    <input type="text" placeholder="Buscar por nombre o DNI..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                    />
                </div>

                {loading && <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>}

                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">Paciente</th>
                                    <th className="px-6 py-4 font-semibold">Receta Activa</th>
                                    <th className="px-6 py-4 font-semibold">Contacto</th>
                                    <th className="px-6 py-4 font-semibold">Códigos</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No se encontraron pacientes.</td></tr>
                                ) : filtered.map((patient) => {
                                    const activeRx = patient.prescriptions?.find(p => p.status === 'active');
                                    const isExpired = activeRx && activeRx.expires_at && new Date(activeRx.expires_at) < new Date();
                                    return (
                                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-800">{patient.full_name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">DNI: {patient.dni || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {activeRx ? (
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-bold text-blue-600">
                                                            {activeRx.dosage ? `${activeRx.dosage} L/min` : ''} 
                                                            {activeRx.dosage && activeRx.usage_time ? ' | ' : ''}
                                                            {activeRx.usage_time ? `${activeRx.usage_time} hrs` : ''}
                                                            {!activeRx.dosage && !activeRx.usage_time ? 'Receta de Oxígeno' : ''}
                                                        </div>
                                                        <div className={`text-[10px] flex items-center gap-1 ${activeRx.days_remaining < 0 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                                            {activeRx.days_remaining < 0 && <MdWarning />}
                                                            {activeRx.days_remaining === null ? (
                                                                `Vence: ${activeRx.expires_at || 'No vence'}`
                                                            ) : activeRx.days_remaining < 0 ? (
                                                                `Vencida hace ${Math.abs(activeRx.days_remaining)} días`
                                                            ) : activeRx.days_remaining === 0 ? (
                                                                'Vence hoy'
                                                            ) : (
                                                                `${activeRx.days_remaining} días restantes`
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : <span className="text-xs text-slate-400 italic">Sin receta activa</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><MdPhone className="text-slate-400" />{patient.phone1 || '—'}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1"><MdLocationOn className="text-slate-400 text-sm" /><span className="truncate max-w-[140px]" title={patient.address}>{patient.address || '—'}</span></div>
                                            </td>
                                            <td className="px-6 py-4 space-y-1">
                                                {patient.trasiego_code && <div><span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 text-[9px] font-bold">TRASIEGO: {patient.trasiego_code}</span></div>}
                                                {patient.exchange_code && <div><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 text-[9px] font-bold">CANJE: {patient.exchange_code}</span></div>}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-1">
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

                        {patients && patients.last_page > 1 && (
                            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50 gap-4">
                                <span className="text-sm text-slate-500 font-medium">
                                    Página <strong className="text-slate-800">{patients.current_page}</strong> de <strong className="text-slate-800">{patients.last_page}</strong> 
                                    <span className="ml-2 hidden sm:inline">(Total: {patients.total})</span>
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Anterior
                                    </button>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(patients.last_page, p + 1))}
                                        disabled={currentPage === patients.last_page}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
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
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Datos Personales</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                                <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">DNI</label>
                                <input type="text" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Celular</label>
                                <input type="text" value={formData.phone1} onChange={e => setFormData({...formData, phone1: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest border-b border-blue-100 pb-1 flex items-center gap-1"><MdAssignment />Receta Inicial</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Dosificación (L/min)</label>
                                <input type="text" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})}
                                    placeholder="Ej: 3 L/min" className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiempo Uso (hrs/día)</label>
                                <input type="text" value={formData.usage_time} onChange={e => setFormData({...formData, usage_time: e.target.value})}
                                    placeholder="Ej: 24" className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Autorización</label>
                                <input type="date" value={formData.authorization_date} onChange={e => setFormData({...formData, authorization_date: e.target.value})}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Vencimiento</label>
                                <input type="date" value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nº Pagaré</label>
                                <input type="text" value={formData.promissory_note} onChange={e => setFormData({...formData, promissory_note: e.target.value})}
                                    placeholder="PAG-2024-001" className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Código Trasiego</label>
                            <input type="text" value={formData.trasiego_code} onChange={e => setFormData({...formData, trasiego_code: e.target.value.toUpperCase()})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Código Intercambio</label>
                            <input type="text" value={formData.exchange_code} onChange={e => setFormData({...formData, exchange_code: e.target.value.toUpperCase()})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase outline-none" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancelar</button>
                        <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50">
                            {actionLoading ? 'Guardando...' : 'Guardar'}
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
                        <div key={rx.id} className={`flex items-start justify-between p-3 rounded-xl border text-xs ${rx.status === 'active' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                    {rxStatusBadge(rx.status)}
                                    <span className="font-bold text-slate-700">{rx.dosage} L/min · {rx.usage_time} hrs</span>
                                </div>
                                <div className="text-slate-500">
                                    Autorización: {rx.authorization_date || '—'} · Vence: <span className={rx.days_remaining < 0 ? 'text-red-600 font-bold' : ''}>{rx.expires_at || '—'}</span>
                                    {rx.days_remaining !== null && (
                                        <span className={`ml-2 font-semibold ${rx.days_remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            ({rx.days_remaining < 0 ? `Vencida hace ${Math.abs(rx.days_remaining)}d` : rx.days_remaining === 0 ? 'Vence hoy' : `${rx.days_remaining}d restantes`})
                                        </span>
                                    )}
                                </div>
                                {rx.promissory_note && <div className="text-slate-400">Pagaré: {rx.promissory_note}</div>}
                            </div>
                            <div className="flex gap-1 ml-3 shrink-0">
                                <button onClick={() => openRxEdit(rx)} className="p-1 text-blue-400 hover:text-blue-600 transition-colors"><MdEdit /></button>
                                <button onClick={() => handleRxDelete(rx.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><MdDelete /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Formulario nueva/editar receta */}
                <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-700">{rxEditId ? '✏️ Editar Receta' : '➕ Nueva Receta'}</p>
                        {rxEditId && <button onClick={() => { setRxEditId(null); setRxForm({ dosage: '', usage_time: '', expires_at: '', authorization_date: '', promissory_note: '', status: 'active' }); }} className="text-slate-400 hover:text-red-500 transition-colors"><MdClose /></button>}
                    </div>
                    <form onSubmit={handleRxSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
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
                        <div className="flex justify-end gap-2">
                            <button type="submit" disabled={rxSaving} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
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