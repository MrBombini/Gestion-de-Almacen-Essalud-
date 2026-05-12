import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdBusiness } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';

const Suppliers = () => {
    const { data: suppliers, loading, error, execute, refetch } = useFetch('/suppliers');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        ruc: '',
        address: '',
        phone: '',
        email: '',
        description: ''
    });

    const handleOpenCreate = () => {
        setFormData({ name: '', ruc: '', address: '', phone: '', email: '', description: '' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (supplier) => {
        setFormData({
            name: supplier.name,
            ruc: supplier.ruc || '',
            address: supplier.address || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            description: supplier.description || ''
        });
        setEditingId(supplier.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            if (editingId) {
                await execute({
                    url: `/suppliers/${editingId}`,
                    method: 'PUT',
                    body: formData
                });
            } else {
                await execute({
                    url: '/suppliers',
                    method: 'POST',
                    body: formData
                });
            }
            handleCloseModal();
            refetch();
        } catch (err) {
            console.error("Error al guardar proveedor", err);
            alert("Hubo un error al guardar. Revisa la consola.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
            try {
                await execute({
                    url: `/suppliers/${id}`,
                    method: 'DELETE'
                });
                refetch();
            } catch (err) {
                console.error("Error al eliminar", err);
            }
        }
    };

    const suppliersList = Array.isArray(suppliers) ? suppliers : (suppliers?.data || []);
    const filteredSuppliers = suppliersList.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.ruc && s.ruc.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <MdBusiness className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Catálogo de Proveedores</h2>
                        <p className="text-slate-500 text-sm mt-1">Administra las empresas proveedoras de oxígeno.</p>
                    </div>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <MdAdd className="text-xl" />
                    Nuevo Proveedor
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <MdSearch className="text-slate-400 text-xl" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RUC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                    />
                </div>

                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-4 font-semibold">Empresa / RUC</th>
                                    <th className="px-6 py-4 font-semibold">Contacto</th>
                                    <th className="px-6 py-4 font-semibold">Dirección</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSuppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No se encontraron proveedores.</td>
                                    </tr>
                                ) : (
                                    filteredSuppliers.map((sup) => (
                                        <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-800">{sup.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">RUC: {sup.ruc || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-slate-700 font-medium">{sup.phone || '-'}</div>
                                                <div className="text-[10px] text-slate-400">{sup.email || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600 max-w-[200px] truncate">{sup.address || '-'}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => handleOpenEdit(sup)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit className="text-lg" /></button>
                                                <button onClick={() => handleDelete(sup.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><MdDelete className="text-lg" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre / Razón Social</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">RUC</label>
                            <input type="text" maxLength="11" value={formData.ruc} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
                            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{actionLoading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Suppliers;
