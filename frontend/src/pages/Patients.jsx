import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import { FaBedPulse } from 'react-icons/fa6';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';

const Patients = () => {
    // Fetch de Pacientes (Ya no necesitamos el de servicios aquí)
    const { data: patients, loading, error, execute, refetch } = useFetch('/patients');

    // Estados del Modal y Formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Adaptado a la respuesta exacta de tu API
    const [formData, setFormData] = useState({
        full_name: '',
        dni: '',
        trasiego_code: '',
        exchange_code: ''
    });

    // Manejadores
    const handleOpenCreate = () => {
        setFormData({ full_name: '', dni: '', trasiego_code: '', exchange_code: '' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (patient) => {
        setFormData({
            full_name: patient.full_name,
            dni: patient.dni || '',
            trasiego_code: patient.trasiego_code || '',
            exchange_code: patient.exchange_code || ''
        });
        setEditingId(patient.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    // Guardar (POST o PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            if (editingId) {
                await execute({
                    url: `/patients/${editingId}`,
                    method: 'PUT',
                    body: formData
                });
            } else {
                await execute({
                    url: '/patients',
                    method: 'POST',
                    body: formData
                });
            }
            handleCloseModal();
            refetch();
        } catch (err) {
            console.error("Error al guardar paciente", err);
            alert("Hubo un error al guardar. Revisa la consola.");
        } finally {
            setActionLoading(false);
        }
    };

    // Eliminar (DELETE)
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
            try {
                await execute({
                    url: `/patients/${id}`,
                    method: 'DELETE'
                });
                refetch();
            } catch (err) {
                console.error("Error al eliminar", err);
            }
        }
    };

    const patientsList = Array.isArray(patients)
        ? patients
        : (patients?.data ? patients.data : []);

    return (
        <div className="space-y-6">
            {/* Cabecera de la página */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <FaBedPulse className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Pacientes</h2>
                        <p className="text-slate-500 text-sm mt-1">Gestiona la información y códigos de trasiego/intercambio.</p>
                    </div>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <MdAdd className="text-xl" />
                    Nuevo Paciente
                </button>
            </div>

            {/* Tabla de Datos */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <MdSearch className="text-slate-400 text-xl" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                    />
                </div>

                {loading && !patients && (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {error && (
                    <div className="p-6 text-center text-red-500">
                        Error al cargar pacientes: {error}
                    </div>
                )}

                {!loading && patients && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">ID</th>
                                    <th className="px-6 py-4 font-semibold">Paciente</th>
                                    <th className="px-6 py-4 font-semibold">DNI</th>
                                    <th className="px-6 py-4 font-semibold">Cód. Trasiego</th>
                                    <th className="px-6 py-4 font-semibold">Cód. Intercambio</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {patientsList.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                            No hay pacientes registrados aún.
                                        </td>
                                    </tr>
                                ) : (
                                    patientsList.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-500">#{patient.id}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{patient.full_name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{patient.dni || '-'}</td>

                                            <td className="px-6 py-4 text-sm">
                                                {patient.trasiego_code ? (
                                                    <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md border border-orange-100 text-xs font-semibold">
                                                        {patient.trasiego_code}
                                                    </span>
                                                ) : '-'}
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                {patient.exchange_code ? (
                                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 text-xs font-semibold">
                                                        {patient.exchange_code}
                                                    </span>
                                                ) : '-'}
                                            </td>

                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenEdit(patient)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <MdEdit className="text-lg" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(patient.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <MdDelete className="text-lg" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ================= MODAL GENÉRICO ================= */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Editar Paciente' : 'Nuevo Paciente'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">DNI / Documento</label>
                        <input
                            type="text"
                            maxLength="8"
                            value={formData.dni}
                            onChange={(e) => {
                                const valor = e.target.value;
                                if (/^\d{0,8}$/.test(valor)) {
                                    setFormData({ ...formData, dni: valor });
                                }
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: 74839201"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Cód. Trasiego</label>
                            <input
                                type="text"
                                value={formData.trasiego_code}
                                onChange={(e) => setFormData({ ...formData, trasiego_code: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="Ej: T-123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Cód. Intercambio</label>
                            <input
                                type="text"
                                value={formData.exchange_code}
                                onChange={(e) => setFormData({ ...formData, exchange_code: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Ej: E-456"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {actionLoading ? 'Guardando...' : 'Guardar Paciente'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Patients;