import { useState } from 'react';
import { components } from 'react-select';
import Select from 'react-select';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdPropaneTank, MdPerson, MdLocationOn, MdScience, MdBusiness, MdLabel } from 'react-icons/md';
import useFetch from '../hooks/useFetch';
import Modal from '../components/Modal';
import api from '../services/api';

// ─── MenuList estable definido FUERA del componente ─────────────────────────
// onAdd y addLabel se pasan a través de selectProps para evitar recrear el
// componente en cada render (lo que causaría que React-Select desmonte el menú).
const AddableMenuList = (props) => {
  const { addLabel, onAdd } = props.selectProps;
  return (
    <components.MenuList {...props}>
      {props.children}
      <div
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onAdd?.(); }}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 cursor-pointer border-t border-slate-200 sticky bottom-0 bg-white z-10"
      >
        <MdAdd className="text-base" /> {addLabel}
      </div>
    </components.MenuList>
  );
};
const ADDABLE_COMPONENTS = { MenuList: AddableMenuList };

// ─── Mini Modal de creación rápida ──────────────────────────────────────────
const QuickAddModal = ({ isOpen, onClose, title, fields, onSave, saving }) => {
  const [form, setForm] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
    setForm({});
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} elevated maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                required={f.required}
                rows={2}
                value={form[f.name] || ''}
                onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            ) : (
              <input
                type={f.type || 'text'}
                required={f.required}
                value={form[f.name] || ''}
                onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            )}
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {saving ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Página principal ────────────────────────────────────────────────────────
const Cylinders = () => {
  const { data: cylinders, loading, error, execute, refetch } = useFetch('/cylinders');
  const { data: suppliers, refetch: refetchSuppliers } = useFetch('/suppliers');
  const { data: ownershipTypes, refetch: refetchOwnership } = useFetch('/ownership-types');
  const { data: patients } = useFetch('/patients');

  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);
  const suppliersList = Array.isArray(suppliers) ? suppliers : (suppliers?.data || []);
  const ownershipTypesList = Array.isArray(ownershipTypes) ? ownershipTypes : (ownershipTypes?.data || []);
  const patientsList = Array.isArray(patients) ? patients : (patients?.data || []);

  // ── Estado del formulario principal ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('ALL');

  const emptyForm = {
    serial_number: '', barcode: '', supplier_id: '', ownership_type_id: '',
    patient_id: '', gas_type: 'OXÍGENO MEDICINAL', capacity: '',
    status: 'empty', location: 'CENTRAL', hydrostatic_test_date: '', physical_condition: 'Good'
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── Estado quick-add ──
  const [quickAdd, setQuickAdd] = useState(null); // 'supplier' | 'ownership' | null
  const [quickSaving, setQuickSaving] = useState(false);

  // ── Opciones para react-select ──
  const supplierOptions = suppliersList.map(s => ({ value: s.id, label: s.name }));
  const ownershipOptions = ownershipTypesList.map(t => ({ value: t.id, label: t.name }));

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 2px #3b82f620' : 'none',
      padding: '1px',
      fontSize: '0.875rem',
    }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  // ── Quick-add: guardar proveedor ──
  const handleQuickSaveSupplier = async (form) => {
    setQuickSaving(true);
    try {
      const res = await api.post('/suppliers', form);
      await refetchSuppliers();
      setFormData(prev => ({ ...prev, supplier_id: res.data.id }));
      setQuickAdd(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al crear proveedor.');
    } finally {
      setQuickSaving(false);
    }
  };

  // ── Quick-add: guardar tipo de propiedad ──
  const handleQuickSaveOwnership = async (form) => {
    setQuickSaving(true);
    try {
      const res = await api.post('/ownership-types', form);
      await refetchOwnership();
      setFormData(prev => ({ ...prev, ownership_type_id: res.data.id }));
      setQuickAdd(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al crear tipo de propiedad.');
    } finally {
      setQuickSaving(false);
    }
  };

  // ── Helper para determinar si el balón es propio (de paciente) ──
  const isCylinderPropio = () => {
    const ownershipName = ownershipTypesList.find(t => t.id === formData.ownership_type_id)?.name?.toLowerCase() || '';
    const supplierName = suppliersList.find(s => s.id === formData.supplier_id)?.name?.toLowerCase() || '';
    
    return (
      ownershipName.includes('propio') || 
      ownershipName.includes('paciente') || 
      supplierName.includes('propio') ||
      supplierName.includes('paciente')
    );
  };

  // ── CRUD principal ──
  const handleOpenCreate = () => { setFormData(emptyForm); setEditingId(null); setIsModalOpen(true); };
  const handleOpenEdit = (c) => {
    setFormData({
      serial_number: c.serial_number, barcode: c.barcode || '',
      supplier_id: c.supplier_id || '', ownership_type_id: c.ownership_type_id || '',
      patient_id: c.patient_id || '', gas_type: c.gas_type || 'OXÍGENO MEDICINAL',
      capacity: c.capacity, status: c.status, location: c.location || 'CENTRAL',
      hydrostatic_test_date: c.hydrostatic_test_date || '', physical_condition: c.physical_condition || 'Good'
    });
    setEditingId(c.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const finalData = { ...formData };
    
    if (isCylinderPropio()) {
      if (!formData.patient_id) {
        alert('Debe seleccionar un paciente para un balón propio.');
        setActionLoading(false);
        return;
      }
    } else {
      finalData.patient_id = null;
    }
    
    try {
      if (editingId) {
        await execute({ url: `/cylinders/${editingId}`, method: 'PUT', body: finalData });
      } else {
        await execute({ url: '/cylinders', method: 'POST', body: finalData });
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
    if (!window.confirm('¿Eliminar este cilindro?')) return;
    try { await execute({ url: `/cylinders/${id}`, method: 'DELETE' }); refetch(); }
    catch (err) { console.error(err); }
  };

  const filtered = cylindersList.filter(c => {
    const s = searchTerm.toLowerCase();
    const matchSearch = c.serial_number.toLowerCase().includes(s) || (c.barcode && c.barcode.toLowerCase().includes(s));
    const matchLoc = filterLocation === 'ALL' || c.location === filterLocation;
    return matchSearch && matchLoc;
  });

  const statusBadge = (status) => {
    const map = {
      full: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      empty: 'bg-red-50 text-red-700 border-red-200',
      in_use: 'bg-blue-50 text-blue-700 border-blue-200',
      in_transit: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    const label = { full: 'Lleno', empty: 'Vacío', in_use: 'En Uso', in_transit: 'En Tránsito' };
    return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tighter ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{label[status] || status}</span>;
  };

  const locationBadge = (loc) => {
    const map = {
      CENTRAL: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      HOSPITALIZACION: 'bg-pink-50 text-pink-700 border-pink-100',
      PADOMI: 'bg-purple-50 text-purple-700 border-purple-100',
      ALMACEN: 'bg-amber-50 text-amber-700 border-amber-100',
      PROVEEDOR: 'bg-orange-50 text-orange-700 border-orange-100',
    };
    return (
      <span className={`px-2 py-1 rounded-md border text-[10px] font-bold flex items-center gap-1 w-fit ${map[loc] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        <MdLocationOn className="text-xs" /> {loc}
      </span>
    );
  };

  // ── Tab activo ──
  const [activeTab, setActiveTab] = useState('cylinders'); // 'cylinders' | 'suppliers' | 'ownership'

  // ── Estado CRUD Proveedores (tab inline) ──
  const [supModal, setSupModal] = useState(false);
  const [supEditing, setSupEditing] = useState(null);
  const [supForm, setSupForm] = useState({ name: '', ruc: '', address: '', phone: '', email: '' });
  const [supSaving, setSupSaving] = useState(false);
  const [supError, setSupError] = useState(null);

  const handleSupOpenCreate = () => { setSupForm({ name: '', ruc: '', address: '', phone: '', email: '' }); setSupEditing(null); setSupError(null); setSupModal(true); };
  const handleSupOpenEdit = (s) => { setSupForm({ name: s.name, ruc: s.ruc || '', address: s.address || '', phone: s.phone || '', email: s.email || '' }); setSupEditing(s.id); setSupError(null); setSupModal(true); };
  const handleSupSubmit = async (e) => {
    e.preventDefault(); setSupSaving(true); setSupError(null);
    try {
      if (supEditing) { await api.put(`/suppliers/${supEditing}`, supForm); }
      else { await api.post('/suppliers', supForm); }
      setSupModal(false); refetchSuppliers();
    } catch (err) { setSupError(err?.response?.data?.message || 'Error al guardar.'); }
    finally { setSupSaving(false); }
  };
  const handleSupDelete = async (sup) => {
    if (!window.confirm(`¿Eliminar "${sup.name}"?`)) return;
    try { await api.delete(`/suppliers/${sup.id}`); refetchSuppliers(); }
    catch (err) { alert(err?.response?.data?.message || 'No se pudo eliminar.'); }
  };

  // ── Estado CRUD Tipos de Propiedad (tab inline) ──
  const [owModal, setOwModal] = useState(false);
  const [owEditing, setOwEditing] = useState(null);
  const [owForm, setOwForm] = useState({ name: '', description: '' });
  const [owSaving, setOwSaving] = useState(false);
  const [owError, setOwError] = useState(null);

  const handleOwOpenCreate = () => { setOwForm({ name: '', description: '' }); setOwEditing(null); setOwError(null); setOwModal(true); };
  const handleOwOpenEdit = (t) => { setOwForm({ name: t.name, description: t.description || '' }); setOwEditing(t.id); setOwError(null); setOwModal(true); };
  const handleOwSubmit = async (e) => {
    e.preventDefault(); setOwSaving(true); setOwError(null);
    try {
      if (owEditing) { await api.put(`/ownership-types/${owEditing}`, owForm); }
      else { await api.post('/ownership-types', owForm); }
      setOwModal(false); refetchOwnership();
    } catch (err) { setOwError(err?.response?.data?.message || 'Error al guardar.'); }
    finally { setOwSaving(false); }
  };
  const handleOwDelete = async (t) => {
    if (!window.confirm(`¿Eliminar "${t.name}"?`)) return;
    try { await api.delete(`/ownership-types/${t.id}`); refetchOwnership(); }
    catch (err) { alert(err?.response?.data?.message || 'No se pudo eliminar.'); }
  };

  // Handlers quick-add desde el modal de cilindro
  const openQuickSupplier  = () => setQuickAdd('supplier');
  const openQuickOwnership = () => setQuickAdd('ownership');

  // ── Colores para tarjetas de tipos de propiedad ──
  const cardColors = ['from-blue-500 to-blue-700','from-emerald-500 to-emerald-700','from-violet-500 to-violet-700','from-orange-500 to-orange-700','from-pink-500 to-pink-700','from-cyan-500 to-cyan-700','from-amber-500 to-amber-700'];

  const TAB_CFG = [
    { id: 'cylinders', label: 'Cilindros', icon: <MdPropaneTank />, color: 'text-cyan-600', active: 'border-cyan-500 text-cyan-700' },
    { id: 'suppliers', label: 'Proveedores', icon: <MdBusiness />, color: 'text-blue-600', active: 'border-blue-500 text-blue-700' },
    { id: 'ownership', label: 'Tipos de Propiedad', icon: <MdLabel />, color: 'text-violet-600', active: 'border-violet-500 text-violet-700' },
  ];

  return (
    <div className="space-y-6">

      {/* ── HEADER con TABS ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Título */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl"><MdPropaneTank className="text-2xl" /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Inventario & Catálogos</h2>
              <p className="text-slate-500 text-sm mt-0.5">Gestiona cilindros, proveedores y tipos de propiedad.</p>
            </div>
          </div>
          {/* Botón contextual según tab */}
          {activeTab === 'cylinders' && (
            <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:scale-105">
              <MdAdd className="text-xl" /> Nuevo Cilindro
            </button>
          )}
          {activeTab === 'suppliers' && (
            <button onClick={handleSupOpenCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:scale-105">
              <MdAdd className="text-xl" /> Nuevo Proveedor
            </button>
          )}
          {activeTab === 'ownership' && (
            <button onClick={handleOwOpenCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all hover:scale-105">
              <MdAdd className="text-xl" /> Nuevo Tipo
            </button>
          )}
        </div>
        {/* Pestañas */}
        <div className="flex border-b border-slate-200 px-6">
          {TAB_CFG.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all mr-2 ${
                activeTab === tab.id ? `${tab.active} bg-transparent` : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           TAB 1: CILINDROS
      ══════════════════════════════════════════════════ */}
      {activeTab === 'cylinders' && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
            <MdSearch className="text-slate-400 text-xl" />
            <input type="text" placeholder="Buscar por código o código de barras..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación:</label>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
              <option value="ALL">TODAS</option>
              <option value="CENTRAL">CENTRAL</option>
              <option value="HOSPITALIZACION">HOSPITALIZACIÓN</option>
              <option value="PADOMI">PADOMI</option>
              <option value="ALMACEN">ALMACÉN</option>
              <option value="PROVEEDOR">PROVEEDOR</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Identificación / Propiedad</th>
                <th className="px-6 py-4 font-semibold">Gas / Capacidad</th>
                <th className="px-6 py-4 font-semibold">Ubicación</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">Cargando cilindros...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No se encontraron cilindros.</td></tr>
              ) : (
                filtered.map((cylinder) => (
                  <tr key={cylinder.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-bold text-slate-800">{cylinder.serial_number}</div>
                        {cylinder.barcode && (
                          <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit font-mono mt-0.5">
                            {cylinder.barcode}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium mt-1">
                        {cylinder.ownership_type?.name} {cylinder.patient ? `(${cylinder.patient.full_name})` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-blue-600 flex items-center gap-1 uppercase tracking-tighter">
                        <MdScience className="text-sm" /> {cylinder.gas_type}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{cylinder.capacity} m³</div>
                    </td>
                    <td className="px-6 py-4">{locationBadge(cylinder.location)}</td>
                    <td className="px-6 py-4">{statusBadge(cylinder.status)}</td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button onClick={() => handleOpenEdit(cylinder)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><MdEdit className="text-lg" /></button>
                      <button onClick={() => handleDelete(cylinder.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><MdDelete className="text-lg" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      )}

      {/* ══════════════════════════════════════════════════
           TAB 2: PROVEEDORES
      ══════════════════════════════════════════════════ */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {supError && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium m-4 rounded">{supError}</div>}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">RUC</th>
                <th className="px-6 py-4 font-semibold">Teléfono</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliersList.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">Sin proveedores. Usa el botón "Nuevo Proveedor".</td></tr>
              ) : suppliersList.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 text-sm">{s.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{s.ruc || '—'}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{s.phone || '—'}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{s.email || '—'}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => handleSupOpenEdit(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><MdEdit className="text-lg" /></button>
                    <button onClick={() => handleSupDelete(s)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><MdDelete className="text-lg" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
           TAB 3: TIPOS DE PROPIEDAD
      ══════════════════════════════════════════════════ */}
      {activeTab === 'ownership' && (
        <div>
          {owError && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium mb-4 rounded">{owError}</div>}
          {ownershipTypesList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
              <MdLabel className="text-6xl text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Sin tipos de propiedad. Usa el botón "Nuevo Tipo".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ownershipTypesList.map((t, idx) => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                  <div className={`h-2 bg-gradient-to-r ${cardColors[idx % cardColors.length]}`} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cardColors[idx % cardColors.length]} text-white shadow-sm`}>
                        <MdLabel className="text-xl" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{t.name}</h3>
                        {t.description && <p className="text-slate-500 text-xs mt-0.5">{t.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-4">
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><MdPropaneTank className="text-sm" /> Balones</span>
                      <span className="font-black text-slate-700 text-lg">{t.cylinders_count ?? 0}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOwOpenEdit(t)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors">
                        <MdEdit className="text-sm" /> Editar
                      </button>
                      <button onClick={() => handleOwDelete(t)} disabled={(t.cylinders_count ?? 0) > 0}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={(t.cylinders_count ?? 0) > 0 ? 'Tiene balones asociados' : 'Eliminar'}>
                        <MdDelete className="text-sm" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Proveedor ── */}
      <Modal isOpen={supModal} onClose={() => setSupModal(false)} title={supEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'} maxWidth="max-w-md">
        <form onSubmit={handleSupSubmit} className="space-y-3">
          {supError && <p className="text-red-600 text-sm font-medium">{supError}</p>}
          {[{name:'name',label:'Nombre *',req:true,ph:'Ej: Linde Peru S.A.'},{name:'ruc',label:'RUC',req:false,ph:'20100010452'},{name:'address',label:'Dirección',req:false,ph:'Av. Principal 123'},{name:'phone',label:'Teléfono',req:false,ph:'987654321'},{name:'email',label:'Email',req:false,ph:'contacto@empresa.com'}].map(f => (
            <div key={f.name}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{f.label}</label>
              <input type="text" required={f.req} value={supForm[f.name]} onChange={e => setSupForm({...supForm,[f.name]:e.target.value})} placeholder={f.ph}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setSupModal(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancelar</button>
            <button type="submit" disabled={supSaving} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{supSaving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Tipo de Propiedad ── */}
      <Modal isOpen={owModal} onClose={() => setOwModal(false)} title={owEditing ? 'Editar Tipo de Propiedad' : 'Nuevo Tipo de Propiedad'} maxWidth="max-w-sm">
        <form onSubmit={handleOwSubmit} className="space-y-3">
          {owError && <p className="text-red-600 text-sm font-medium">{owError}</p>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input type="text" required value={owForm.name} onChange={e => setOwForm({...owForm,name:e.target.value})} placeholder="Ej: EsSalud, Linde..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
            <textarea value={owForm.description} onChange={e => setOwForm({...owForm,description:e.target.value})} rows={2} placeholder="Descripción corta..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setOwModal(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancelar</button>
            <button type="submit" disabled={owSaving} className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{owSaving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL PRINCIPAL: Crear / Editar cilindro ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Cilindro' : 'Nuevo Cilindro'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Códigos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Código del Balón <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ej: OX-00001"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Código de Barras <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
              <input type="text" value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Solo proveedores externos"
              />
            </div>
          </div>

          {/* Gas y Capacidad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Gas</label>
              <select required value={formData.gas_type} onChange={(e) => setFormData({ ...formData, gas_type: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 bg-blue-50 font-bold text-blue-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="OXÍGENO MEDICINAL">OXÍGENO MEDICINAL</option>
                <option value="NITRÓGENO">NITRÓGENO</option>
                <option value="AIRE COMPRIMIDO">AIRE COMPRIMIDO</option>
                <option value="CO2">CO2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Capacidad (m³) <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" required value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ej: 10"
              />
            </div>
          </div>

          {/* Estado y Ubicación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
              <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="empty">VACÍO</option>
                <option value="full">LLENO</option>
                <option value="in_use">EN USO</option>
                <option value="in_transit">EN TRÁNSITO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ubicación</label>
              <select required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="CENTRAL">CENTRAL</option>
                <option value="HOSPITALIZACION">HOSPITALIZACIÓN</option>
                <option value="PADOMI">PADOMI</option>
                <option value="ALMACEN">ALMACÉN</option>
                <option value="PROVEEDOR">PROVEEDOR</option>
              </select>
            </div>
          </div>

          {/* Fecha Prueba Hidrostática y Condición Física */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha Prueba Hidrostática</label>
              <input type="date" value={formData.hydrostatic_test_date}
                onChange={(e) => setFormData({ ...formData, hydrostatic_test_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Condición Física</label>
              <select required value={formData.physical_condition} onChange={(e) => setFormData({ ...formData, physical_condition: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="Good">BUENA</option>
                <option value="Bad">DEFECTUOSA / MALA</option>
              </select>
            </div>
          </div>

          {/* Proveedor con quick-add */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MdBusiness className="text-slate-400" /> Proveedor / Marca
            </label>
            <Select
              options={supplierOptions}
              styles={selectStyles}
              placeholder="Seleccionar proveedor..."
              isClearable
              value={supplierOptions.find(o => o.value === formData.supplier_id) || null}
              onChange={(s) => setFormData({ ...formData, supplier_id: s?.value || '' })}
              components={ADDABLE_COMPONENTS}
              addLabel="+ Añadir Proveedor"
              onAdd={openQuickSupplier}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>

          {/* Tipo de Propiedad con quick-add */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MdLabel className="text-slate-400" /> Tipo de Propiedad <span className="text-red-500">*</span>
            </label>
            <Select
              options={ownershipOptions}
              styles={selectStyles}
              placeholder="Seleccionar tipo de propiedad..."
              value={ownershipOptions.find(o => o.value === formData.ownership_type_id) || null}
              onChange={(s) => setFormData({ ...formData, ownership_type_id: s?.value || '' })}
              components={ADDABLE_COMPONENTS}
              addLabel="+ Añadir Tipo de Propiedad"
              onAdd={openQuickOwnership}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>

          {/* Paciente (solo si propiedad o proveedor es propio) */}
          {isCylinderPropio() && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <label className="block text-sm font-bold text-blue-700 mb-2 flex items-center gap-2"><MdPerson /> Dueño (Paciente)</label>
              <select required value={formData.patient_id} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm">
                <option value="" disabled>Seleccionar paciente...</option>
                {patientsList.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50">
              {actionLoading ? 'Guardando...' : 'Guardar Cilindro'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── QUICK-ADD: Proveedor ── */}
      <QuickAddModal
        isOpen={quickAdd === 'supplier'}
        onClose={() => setQuickAdd(null)}
        title="➕ Añadir Proveedor"
        saving={quickSaving}
        onSave={handleQuickSaveSupplier}
        fields={[
          { name: 'name', label: 'Nombre del Proveedor', required: true, placeholder: 'Ej: Linde Peru S.A.' },
          { name: 'ruc', label: 'RUC', required: false, placeholder: 'Ej: 20100010452' },
          { name: 'phone', label: 'Teléfono', required: false, placeholder: 'Ej: 987654321' },
        ]}
      />

      {/* ── QUICK-ADD: Tipo de Propiedad ── */}
      <QuickAddModal
        isOpen={quickAdd === 'ownership'}
        onClose={() => setQuickAdd(null)}
        title="➕ Añadir Tipo de Propiedad"
        saving={quickSaving}
        onSave={handleQuickSaveOwnership}
        fields={[
          { name: 'name', label: 'Nombre', required: true, placeholder: 'Ej: EsSalud, Linde, Praxair...' },
          { name: 'description', label: 'Descripción', required: false, placeholder: 'Descripción corta...', type: 'textarea' },
        ]}
      />

    </div>
  );
};

export default Cylinders;