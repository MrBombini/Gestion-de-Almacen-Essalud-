import { useState } from 'react';
import { MdPersonAdd, MdEdit, MdLockOutline, MdLockOpen, MdSearch, MdShield } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';

const Users = () => {
  const { data: users, loading, error, execute, refetch } = useFetch('/users');
  const usersList = Array.isArray(users) ? users : (users?.data || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    operator_code: '',
    role: 'Operator',
    password: '' // Se manejará de forma inteligente
  });

  const handleOpenCreate = () => {
    setFormData({ name: '', operator_code: '', role: 'Operator', password: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setFormData({
      name: user.name,
      operator_code: user.operator_code,
      role: user.role,
      password: '' // Siempre lo dejamos vacío al editar por seguridad
    });
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    // Clonamos el payload para no modificar el estado directamente
    const payload = { ...formData };

    // Si estamos editando y el campo password está vacío, lo eliminamos del payload
    if (editingId && !payload.password) {
      delete payload.password;
    }

    try {
      if (editingId) {
        await execute({ url: `/users/${editingId}`, method: 'PUT', body: payload });
      } else {
        await execute({ url: '/users', method: 'POST', body: payload });
      }
      handleCloseModal();
      refetch(); 
    } catch (err) {
      console.error("Error al guardar usuario", err);
      alert(err.response?.data?.message || "Hubo un error al guardar. Revisa la consola.");
    } finally {
      setActionLoading(false);
    }
  };

  // En lugar de Eliminar físico, hacemos un Toggle (Bloquear/Desbloquear)
  const handleToggleStatus = async (user) => {
    const isActivating = user.status !== 'active';
    const confirmMessage = isActivating 
      ? `¿Estás seguro de REACTIVAR al usuario ${user.name}?` 
      : `¿Estás seguro de BLOQUEAR al usuario ${user.name}? Ya no podrá iniciar sesión.`;

    if (window.confirm(confirmMessage)) {
      try {
        // Asumiendo que tu API permite hacer PATCH al estado o tiene un endpoint específico
        await execute({ 
          url: `/users/${user.id}/toggle-status`, // Ajusta esto según el endpoint real de tu Laravel
          method: 'PATCH' 
        });
        refetch();
      } catch (err) {
        console.error("Error al cambiar estado", err);
        alert(err.response?.data?.message || "Error al cambiar el estado del usuario.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <MdShield className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Panel de Usuarios</h2>
            <p className="text-slate-500 text-sm mt-1">Administra los accesos y roles del personal del almacén.</p>
          </div>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <MdPersonAdd className="text-xl" />
          Nuevo Operario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <MdSearch className="text-slate-400 text-xl" />
          <input 
            type="text" 
            placeholder="Buscar por código o nombre..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>

        {loading && usersList.length === 0 && (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold">Código</th>
                  <th className="px-6 py-4 font-semibold">Nombre Completo</th>
                  <th className="px-6 py-4 font-semibold">Rol</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usersList.map((user) => {
                    const isInactive = user.status !== 'active';
                    
                    return (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-slate-50 transition-colors ${isInactive ? 'opacity-60 bg-slate-50' : ''}`}
                      >
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{user.operator_code}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{user.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                            user.role === 'SuperAdmin' ? 'bg-amber-950 text-amber-200 border-amber-800' :
                            user.role === 'Administrator' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            user.role === 'Engineer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {user.role === 'SuperAdmin' ? 'SuperAdmin' : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {isInactive ? (
                            <span className="text-red-600 font-bold text-xs flex items-center gap-1">
                              <MdLockOutline className="text-sm" /> INACTIVO
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-xs">ACTIVO</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <MdEdit className="text-lg" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              isInactive 
                                ? 'text-emerald-500 hover:bg-emerald-50' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isInactive ? 'Desbloquear' : 'Bloquear'}
                          >
                            {isInactive ? <MdLockOpen className="text-lg" /> : <MdLockOutline className="text-lg" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Código Operador</label>
              <input 
                type="text" required value={formData.operator_code}
                onChange={(e) => setFormData({...formData, operator_code: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="Ej: ADMIN01, JPEREZ"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rol en el Sistema</label>
              <select 
                required value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Operator">Operador (Almacén)</option>
                <option value="Engineer">Ingeniero (Reportes)</option>
                <option value="Administrator">Administrador (Total)</option>
                <option value="SuperAdmin">Super Administrador (Sistema)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
            <input 
              type="text" required value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Contraseña {editingId && <span className="text-slate-400 font-normal">(Dejar en blanco para no cambiarla)</span>}
            </label>
            <input 
              type="password" 
              required={!editingId} 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              {actionLoading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default Users;