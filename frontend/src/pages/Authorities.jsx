import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdLabelOutline, MdBusiness } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';

const Authorities = () => {
  const { data: authorities, loading, execute, refetch } = useFetch('/authorities');
  const authoritiesList = Array.isArray(authorities) ? authorities : (authorities?.data || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [formData, setFormData] = useState({ name: '', type: '' });

  const handleOpenCreate = () => {
    setFormData({ name: '', type: '' });
    setEditingId(null);
    setDeleteError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (authority) => {
    setFormData({ name: authority.name, type: authority.type || '' });
    setEditingId(authority.id);
    setDeleteError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDeleteError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingId) {
        await execute({ url: `/authorities/${editingId}`, method: 'PUT', body: formData });
      } else {
        await execute({ url: '/authorities', method: 'POST', body: formData });
      }
      handleCloseModal();
      refetch();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al guardar.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (authority) => {
    if (!window.confirm(`¿Eliminar la autoridad "${authority.name}"? Esta acción es irreversible.`)) return;
    try {
      await execute({ url: `/authorities/${authority.id}`, method: 'DELETE' });
      refetch();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  const cardColors = [
    'from-blue-500 to-blue-700',
    'from-emerald-500 to-emerald-700',
    'from-violet-500 to-violet-700',
    'from-orange-500 to-orange-700',
    'from-pink-500 to-pink-700',
    'from-cyan-500 to-cyan-700',
    'from-amber-500 to-amber-700',
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <MdBusiness className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Autoridades y Terceros</h2>
            <p className="text-slate-500 text-sm mt-0.5">Gestión de entidades externas (ej. MINSA, Fiscalización, Entidades del Estado) para préstamos temporales.</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:scale-105"
        >
          <MdAdd className="text-xl" /> Nueva Entidad
        </button>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl font-medium">
          {deleteError}
        </div>
      )}

      {/* GRID DE TARJETAS */}
      {authoritiesList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <MdBusiness className="text-6xl text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No hay entidades registradas.</p>
          <p className="text-slate-400 text-sm mt-1">Crea la primera con el botón "Nueva Entidad".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {authoritiesList.map((authority, idx) => (
            <div
              key={authority.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Franja de color superior */}
              <div className={`h-2 bg-gradient-to-r ${cardColors[idx % cardColors.length]}`}></div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cardColors[idx % cardColors.length]} text-white shadow-sm`}>
                      <MdBusiness className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight">{authority.name}</h3>
                      {authority.type && (
                        <p className="text-slate-500 text-xs mt-0.5 leading-snug">{authority.type}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(authority)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <MdEdit className="text-sm" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(authority)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <MdDelete className="text-sm" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Editar Entidad' : 'Nueva Entidad'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nombre de la Entidad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Ministerio de Salud, Fiscalización..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Entidad (Opcional)</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="Ej: Estatal, Privada, Auditoría..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Authorities;
