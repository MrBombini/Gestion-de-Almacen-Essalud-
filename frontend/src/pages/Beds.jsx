import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdSingleBed } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';

const Beds = () => {
  const { data: beds, loading, error, execute, refetch } = useFetch('/beds');
  const { data: services } = useFetch('/services');

  const bedsList = Array.isArray(beds) ? beds : (beds?.data || []);
  const servicesList = Array.isArray(services) ? services : (services?.data || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('');
  
  // Agregamos "status" al estado inicial
  const [formData, setFormData] = useState({
    bed_number: '',
    service_id: '',
    status: 'available' // Valor por defecto exigido por el backend
  });

  const handleOpenCreate = () => {
    setFormData({ bed_number: '', service_id: '', status: 'available' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bed) => {
    setFormData({
      bed_number: bed.bed_number,
      service_id: bed.service_id,
      status: bed.status || 'available'
    });
    setEditingId(bed.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingId) {
        await execute({ url: `/beds/${editingId}`, method: 'PUT', body: formData });
      } else {
        await execute({ url: '/beds', method: 'POST', body: formData });
      }
      handleCloseModal();
      refetch(); 
    } catch (err) {
      console.error("Error al guardar la cama", err);
      alert("Hubo un error al guardar. Revisa la consola.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta cama?')) {
      try {
        await execute({ url: `/beds/${id}`, method: 'DELETE' });
        refetch();
      } catch (err) {
        console.error("Error al eliminar", err);
      }
    }
  };

  const getServiceName = (serviceId) => {
    const service = servicesList.find(s => s.id === parseInt(serviceId));
    return service ? service.name : serviceId;
  };

  const filteredBeds = bedsList.filter(bed => {
    const matchSearch = bed.bed_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchService = filterService ? bed.service_id.toString() === filterService : true;
    return matchSearch && matchService;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <MdSingleBed className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Catálogo de Camas</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Administra las camas asignadas a cada servicio médico.</p>
          </div>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shrink-0"
        >
          <MdAdd className="text-xl" />
          Nueva Cama
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 w-full">
            <MdSearch className="text-slate-400 text-xl shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar número de cama..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            />
          </div>
          <div className="w-full sm:w-auto min-w-[250px]">
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm font-medium px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="">TODOS LOS SERVICIOS</option>
              {servicesList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && bedsList.length === 0 && (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 sm:px-6 py-4 font-semibold">ID</th>
                  <th className="px-4 sm:px-6 py-4 font-semibold">Cama</th>
                  <th className="px-4 sm:px-6 py-4 font-semibold">Servicio / Área</th>
                  <th className="px-4 sm:px-6 py-4 font-semibold">Estado</th>
                  <th className="px-4 sm:px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBeds.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No hay camas registradas o no coinciden con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredBeds.map((bed) => (
                    <tr key={bed.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-500">#{bed.id}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-800">{bed.bed_number}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100 text-xs font-semibold">
                          {bed.service?.name || getServiceName(bed.service_id)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm">
                        {bed.status === 'available' ? (
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200 text-xs font-bold">DISPONIBLE</span>
                        ) : (
                          <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md border border-orange-200 text-xs font-bold">OCUPADA</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right space-x-1 sm:space-x-2">
                        <button onClick={() => handleOpenEdit(bed)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <MdEdit className="text-lg" />
                        </button>
                        <button onClick={() => handleDelete(bed.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Editar Cama' : 'Nueva Cama'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Servicio / Área</label>
            <select 
              required 
              value={formData.service_id}
              onChange={(e) => setFormData({...formData, service_id: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Selecciona un servicio...</option>
              {servicesList.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Número de Cama</label>
              <input 
                type="text" 
                required 
                value={formData.bed_number}
                onChange={(e) => setFormData({...formData, bed_number: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="Ej: C-185"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
              <select 
                required 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="available">Disponible</option>
                <option value="occupied">Ocupada</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 flex-col sm:flex-row">
            <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors order-2 sm:order-1">Cancelar</button>
            <button type="submit" disabled={actionLoading} className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors order-1 sm:order-2">
              {actionLoading ? 'Guardando...' : 'Guardar Cama'}
            </button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default Beds;