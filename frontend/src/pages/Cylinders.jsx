import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdPropaneTank } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';

const Cylinders = () => {
  // 1. Fetch de Cilindros
  const { data: cylinders, loading, error, execute, refetch } = useFetch('/cylinders');
  
  // 2. Fetch de Proveedores (Para el menú desplegable)
  const { data: suppliers } = useFetch('/suppliers');

  // Variables seguras para evitar "map is not a function"
  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);
  const suppliersList = Array.isArray(suppliers) ? suppliers : (suppliers?.data || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Adaptado al nuevo JSON de tu API
  const [formData, setFormData] = useState({
    serial_number: '',
    supplier_id: '',
    ownership_type_id: 1, // 1: EsSalud por defecto
    gas_type: 'OXYGEN',
    capacity: '',
    status: 'empty',
    hydrostatic_test_date: '',
    physical_condition: 'Good'
  });

  const handleOpenCreate = () => {
    setFormData({ 
      serial_number: '', 
      supplier_id: '', 
      ownership_type_id: 1, 
      gas_type: 'OXYGEN', 
      capacity: '', 
      status: 'empty',
      hydrostatic_test_date: '',
      physical_condition: 'Good'
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cylinder) => {
    setFormData({
      serial_number: cylinder.serial_number,
      supplier_id: cylinder.supplier_id || '',
      ownership_type_id: cylinder.ownership_type_id || 1,
      gas_type: cylinder.gas_type || 'OXYGEN',
      capacity: cylinder.capacity,
      status: cylinder.status,
      hydrostatic_test_date: cylinder.hydrostatic_test_date || '',
      physical_condition: cylinder.physical_condition || 'Good'
    });
    setEditingId(cylinder.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingId) {
        await execute({ url: `/cylinders/${editingId}`, method: 'PUT', body: formData });
      } else {
        await execute({ url: '/cylinders', method: 'POST', body: formData });
      }
      handleCloseModal();
      refetch(); 
    } catch (err) {
      console.error("Error al guardar el cilindro", err);
      alert("Hubo un error al guardar. Revisa la consola.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas dar de baja este cilindro?')) {
      try {
        await execute({ url: `/cylinders/${id}`, method: 'DELETE' });
        refetch();
      } catch (err) {
        console.error("Error al eliminar", err);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'full':
        return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200 text-xs font-bold">LLENO</span>;
      case 'empty':
        return <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-200 text-xs font-bold">VACÍO</span>;
      case 'in_use':
        return <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 text-xs font-bold">EN USO</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-lg">
            <MdPropaneTank className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Catálogo de Cilindros</h2>
            <p className="text-slate-500 text-sm mt-1">Inventario físico detallado de balones.</p>
          </div>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <MdAdd className="text-xl" />
          Nuevo Cilindro
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <MdSearch className="text-slate-400 text-xl" />
          <input 
            type="text" 
            placeholder="Buscar por número de serie..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>

        {loading && cylindersList.length === 0 && (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold">N° Serie</th>
                  <th className="px-6 py-4 font-semibold">Propiedad</th>
                  <th className="px-6 py-4 font-semibold">Proveedor</th>
                  <th className="px-6 py-4 font-semibold">Capacidad</th>
                  <th className="px-6 py-4 font-semibold">Venc. Prueba</th>
                  <th className="px-6 py-4 font-semibold">Estado Actual</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cylindersList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                      No hay cilindros registrados aún.
                    </td>
                  </tr>
                ) : (
                  cylindersList.map((cylinder) => (
                    <tr key={cylinder.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{cylinder.serial_number}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {cylinder.ownership_type?.name || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {cylinder.supplier?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{cylinder.capacity} m³</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{cylinder.hydrostatic_test_date}</td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(cylinder.status)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenEdit(cylinder)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <MdEdit className="text-lg" />
                        </button>
                        <button onClick={() => handleDelete(cylinder.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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

      {/* ================= MODAL ================= */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Editar Cilindro' : 'Nuevo Cilindro'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Número de Serie</label>
              <input 
                type="text" required value={formData.serial_number}
                onChange={(e) => setFormData({...formData, serial_number: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="Ej: CYL-79520"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Capacidad (m³)</label>
              <input 
                type="number" step="0.01" required value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 6.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Propietario</label>
              <select 
                required value={formData.ownership_type_id}
                onChange={(e) => setFormData({...formData, ownership_type_id: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={1}>EsSalud</option>
                <option value={2}>Proveedor Externo</option>
                <option value={3}>Paciente Privado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Proveedor (Marca)</label>
              <select 
                required value={formData.supplier_id}
                onChange={(e) => setFormData({...formData, supplier_id: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="" disabled>Seleccionar...</option>
                {suppliersList.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha Prueba Hidrostática</label>
              <input 
                type="date" required value={formData.hydrostatic_test_date}
                onChange={(e) => setFormData({...formData, hydrostatic_test_date: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Condición Física</label>
              <select 
                required value={formData.physical_condition}
                onChange={(e) => setFormData({...formData, physical_condition: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Good">Bueno (Good)</option>
                <option value="Maintenance">En Mantenimiento</option>
                <option value="Damaged">Dañado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Estado Físico Inicial</label>
            <select 
              required value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="empty">Vacío (Empty)</option>
              <option value="full">Lleno (Full)</option>
              <option value="in_use">En Uso (In Use)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              {actionLoading ? 'Guardando...' : 'Guardar Cilindro'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cylinders;