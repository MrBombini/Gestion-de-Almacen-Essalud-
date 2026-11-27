import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import { FaHospitalUser } from 'react-icons/fa6';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal'; // Importamos nuestro modal genérico
import api from '../services/api';

const Services = () => {
    // 1. Fetch de datos usando la ruta ajustada (sin /api)
    const { data: services, loading, error, refetch } = useFetch('/services');

    // Estados
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        abbreviation: '',
        type: 'Hospital' // Valores comunes: Hospital, Manifold, Externo
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');

    // Manejadores del Modal
    const handleOpenCreate = () => {
        setFormData({ name: '', abbreviation: '', type: 'Hospital' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (service) => {
        setFormData({
            name: service.name,
            abbreviation: service.abbreviation || '',
            type: service.type
        });
        setEditingId(service.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Guardar (POST / PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            if (editingId) {
                await api.put(`/services/${editingId}`, formData);
            } else {
                await api.post('/services', formData);
            }
            handleCloseModal();
            refetch(); // Recargar la tabla
        } catch (err) {
            console.error("Error al guardar el servicio", err);
            alert(err?.response?.data?.message || "Hubo un error al guardar. Revisa la consola.");
        } finally {
            setActionLoading(false);
        }
    };

    // Eliminar (DELETE)
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este servicio? También se eliminarán las camas asociadas.')) {
            setActionLoading(true);
            try {
                await api.delete(`/services/${id}`);
                refetch();
            } catch (err) {
                console.error("Error al eliminar", err);
                alert(err?.response?.data?.message || "Hubo un error al eliminar.");
            } finally {
                setActionLoading(false);
            }
        }
    };

    // Aseguramos que la lista sea siempre un Array, extrayendo 'data' si es necesario
    const servicesList = Array.isArray(services)
        ? services
        : (services?.data ? services.data : []);

    const filteredServices = servicesList.filter(service => {
        const matchSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (service.abbreviation && service.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchType = filterType ? service.type === filterType : true;
        return matchSearch && matchType;
    });

    return (
        <div className="space-y-6">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FaHospitalUser className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Servicios</h2>
                        <p className="text-slate-500 text-sm mt-1">Gestiona las áreas médicas y puntos de recarga.</p>
                    </div>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <MdAdd className="text-xl" />
                    Nuevo Servicio
                </button>
            </div>

            {/* Tabla de Servicios */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 w-full">
                        <MdSearch className="text-slate-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Buscar área o servicio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                        />
                    </div>
                    <div className="w-full sm:w-auto min-w-[200px]">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-sm font-medium px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            <option value="">TODOS LOS TIPOS</option>
                            <option value="Hospital">Hospital</option>
                            <option value="Manifold">Manifold</option>
                            <option value="PERIFERIE">Periferia</option>
                        </select>
                    </div>
                </div>

                {loading && !services && (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {error && (
                    <div className="p-6 text-center text-red-500">
                        Error al cargar servicios: {error}
                    </div>
                )}

                {!loading && services && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">ID</th>
                                    <th className="px-6 py-4 font-semibold">Abreviación</th>
                                    <th className="px-6 py-4 font-semibold">Nombre del Servicio</th>
                                    <th className="px-6 py-4 font-semibold">Tipo</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredServices.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            No hay servicios registrados o no coinciden con la búsqueda.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredServices.map((service) => (
                                        <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-500">#{service.id}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{service.abbreviation || '-'}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{service.name}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${service.type === 'Hospital'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : service.type === 'PERIFERIE'
                                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                            : 'bg-purple-50 text-purple-700 border-purple-100'
                                                    }`}>
                                                    {service.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenEdit(service)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <MdEdit className="text-lg" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(service.id)}
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

            {/* ================= USO DEL MODAL GENÉRICO ================= */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            >
                {/* Aquí pasamos únicamente el contenido del formulario como 'children' */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Servicio</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: Unidad de Cuidados Intensivos (UCI)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Abreviación (Opcional)</label>
                        <input
                            type="text"
                            value={formData.abbreviation}
                            onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: UCI"
                            maxLength={20}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Área</label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            <option value="Hospital">Área Médica (Hospitalización)</option>
                            <option value="Manifold">Área de Recarga (Manifold)</option>
                            <option value="PERIFERIE">Hospital Periférico (Red / Periferia)</option>
                        </select>
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
                            {actionLoading ? 'Guardando...' : 'Guardar Servicio'}
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};

export default Services;