import { useState } from 'react';
import { 
    MdDownload, 
    MdDateRange, 
    MdLocalShipping, 
    MdLocationOn, 
    MdPerson, 
    MdLocalHospital, 
    MdSyncAlt, 
    MdVisibility,
    MdInventory,
    MdNavigateBefore,
    MdNavigateNext,
    MdWaterDrop
} from 'react-icons/md';
import { format } from 'date-fns';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import Modal from './Modal';
import { 
    exportSupplierReport, 
    exportLocationReport, 
    exportPadomiPatientReport, 
    exportIpressReport, 
    exportTrasiegosReport,
    exportCylindersInventoryReport,
    exportLiquidReadingsReport,
    exportLiquidRefillsReport
} from '../utils/excelExportService';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

const PREVIEW_PER_PAGE = 20;

const ExcelExportsPanel = () => {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [loadingStates, setLoadingStates] = useState({
      supplier: false,
      location: false,
      patient: false,
      ipress: false,
      trasiegos: false,
      inventory: false,
      liquid_readings: false,
      liquid_refills: false
  });

  // Filtros específicos para el Inventario General
  const [inventoryLocation, setInventoryLocation] = useState('ALL');
  const [inventoryOwnership, setInventoryOwnership] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState('');
  const [inventorySupplier, setInventorySupplier] = useState('');

  const { data: ownershipTypes } = useFetch('/ownership-types?per_page=all');
  const { data: suppliers } = useFetch('/suppliers?per_page=all');
  
  const ownershipTypesList = Array.isArray(ownershipTypes) ? ownershipTypes : (ownershipTypes?.data || []);
  const suppliersList = Array.isArray(suppliers) ? suppliers : (suppliers?.data || []);

  // Modal Preview States
  const [previewModal, setPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewType, setPreviewType] = useState('');
  const [previewPage, setPreviewPage] = useState(1);

  const setButtonLoading = (key, value) => {
      setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const parseLocalDate = (dateStr) => new Date(dateStr + 'T00:00:00');

  const getDateRangeText = () => {
      if (previewType === 'inventory') return format(new Date(), 'dd/MM/yyyy');
      if (startDate && endDate) return `${format(parseLocalDate(startDate), 'dd/MM/yyyy')} AL ${format(parseLocalDate(endDate), 'dd/MM/yyyy')}`;
      if (startDate) return `DESDE ${format(parseLocalDate(startDate), 'dd/MM/yyyy')}`;
      if (endDate) return `HASTA ${format(parseLocalDate(endDate), 'dd/MM/yyyy')}`;
      return format(new Date(), 'dd/MM/yyyy');
  };

  const fetchPreviewData = async (type) => {
      setButtonLoading(type, true);
      setPreviewPage(1);
      try {
          if (type === 'inventory') {
              const res = await api.get('/cylinders', {
                  params: { 
                      per_page: 'all',
                      location: inventoryLocation !== 'ALL' ? inventoryLocation : undefined,
                      ownership_type_id: inventoryOwnership || undefined,
                      status: inventoryStatus || undefined,
                      supplier_id: inventorySupplier || undefined
                  }
              });
              const rawData = res.data.data || res.data || [];
              setPreviewData(rawData);
              setPreviewType(type);
              setPreviewModal(true);
              return;
          }

          if (type === 'liquid_readings' || type === 'liquid_refills') {
              const endpoint = type === 'liquid_readings' ? '/daily-readings' : '/liquid/refills';
              const res = await api.get(endpoint);
              const rawData = res.data.data || res.data || [];
              
              const dateField = type === 'liquid_readings' ? 'reading_date' : 'refilled_at';
              const data = rawData.filter(item => {
                  if (!startDate || !endDate) return true;
                  if (!item[dateField]) return false;
                  // Handle potential date-time strings by extracting the date part
                  const dateStr = item[dateField].split('T')[0];
                  const itemDate = parseISO(dateStr);
                  return isWithinInterval(itemDate, {
                      start: startOfDay(parseISO(startDate)),
                      end: endOfDay(parseISO(endDate))
                  });
              });
              
              setPreviewData(data);
              setPreviewType(type);
              setPreviewModal(true);
              return;
          }

          const res = await api.get('/reports/movements-search', {
              params: { export: true, start_date: startDate, end_date: endDate }
          });
          const allMovements = res.data.data || [];
          let data = [];
          
          if (type === 'supplier') {
              data = allMovements.filter(item => 
                  item.type === 'Ingreso Proveedor' || item.type === 'Salida Proveedor' || 
                  (item.location && item.location.type === 'Proveedor')
              );
          } else if (type === 'location') {
              // Hospitalización HNAGV: Excluye expresamente Periferia, Trasiego, Pacientes y Proveedores
              data = allMovements.filter(item => {
                  const isService = item.location && (item.location.type === 'Servicio (Hospital)' || item.location.type?.includes('Servicio'));
                  const isNotPeriphery = item.type !== 'Canje de Red (Periferia)' && item.location?.type !== 'Centro Asistencial (Periferia)' && item.location?.detail !== 'PERIFERIE / CENTRO MÉDICO';
                  const isNotTrasiego = item.type !== 'Trasiego (Decantación)' && !item.location?.type?.includes('Trasiego') && item.location?.detail !== 'Trasiego Recarga';
                  const isNotSupplier = item.type !== 'Ingreso Proveedor' && item.type !== 'Salida Proveedor' && item.location?.type !== 'Proveedor';
                  const isNotPatient = item.location?.type !== 'Paciente' && item.type !== 'Intercambio PADOMI' && item.type !== 'Devolución Paciente';
                  return isService && isNotPeriphery && isNotTrasiego && isNotSupplier && isNotPatient;
              });
          } else if (type === 'patient') {
              // Pacientes PADOMI: Excluye trasiegos
              data = allMovements.filter(item => {
                  const isPatient = (item.location && item.location.type === 'Paciente') || item.type === 'Intercambio PADOMI' || item.type === 'Devolución Paciente';
                  const isNotTrasiego = item.type !== 'Trasiego (Decantación)' && !item.location?.type?.includes('Trasiego');
                  return isPatient && isNotTrasiego;
              });
          } else if (type === 'ipress') {
              // Canjes de Red / Periferia
              data = allMovements.filter(item => 
                  item.type === 'Canje de Red (Periferia)' || 
                  (item.location && item.location.type === 'Centro Asistencial (Periferia)')
              );
          } else if (type === 'trasiegos') {
              // Trasiegos / Decantaciones
              data = allMovements.filter(item => 
                  item.type === 'Trasiego (Decantación)' || 
                  (item.location && item.location.type?.includes('Trasiego'))
              );
          }

          setPreviewData(data);
          setPreviewType(type);
          setPreviewModal(true);
      } catch (error) {
          console.error(`Error fetching ${type} report`, error);
      } finally {
          setButtonLoading(type, false);
      }
  };

  const executeDownload = async () => {
      if (previewType === 'supplier') await exportSupplierReport(previewData, getDateRangeText());
      else if (previewType === 'location') await exportLocationReport(previewData, getDateRangeText());
      else if (previewType === 'patient') await exportPadomiPatientReport(previewData, getDateRangeText());
      else if (previewType === 'ipress') await exportIpressReport(previewData, getDateRangeText());
      else if (previewType === 'trasiegos') await exportTrasiegosReport(previewData, getDateRangeText());
      else if (previewType === 'inventory') await exportCylindersInventoryReport(previewData, getDateRangeText());
      else if (previewType === 'liquid_readings') await exportLiquidReadingsReport(previewData, getDateRangeText());
      else if (previewType === 'liquid_refills') await exportLiquidRefillsReport(previewData, getDateRangeText());
      
      setPreviewModal(false);
  };

  const getReportTitle = () => {
      switch(previewType) {
          case 'supplier': return 'Reporte de Proveedor Externo';
          case 'location': return 'Reporte de Hospitalización HNAGV';
          case 'patient': return 'Reporte de Pacientes PADOMI';
          case 'ipress': return 'Reporte de Centros Asistenciales (Periferia)';
          case 'trasiegos': return 'Reporte de Trasiegos / Recargas';
          case 'inventory': return 'Inventario General de Cilindros';
          case 'liquid_readings': return 'Resumen Diario de Lecturas (Oxígeno Líquido)';
          case 'liquid_refills': return 'Reporte de Recargas de Cisterna (Oxígeno Líquido)';
          default: return 'Vista Previa de Exportación';
      }
  };

  const getStatusBadge = (status) => {
      const s = status ? status.toLowerCase() : '';
      if (s === 'full' || s === 'lleno') return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">LLENO</span>;
      if (s === 'in_use' || s === 'en uso') return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">EN USO</span>;
      if (s === 'empty' || s === 'vacío' || s === 'vacio') return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-200 text-slate-700">VACÍO</span>;
      if (s === 'in_transit' || s === 'en tránsito' || s === 'en transito') return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800">EN TRÁNSITO</span>;
      return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800">{status?.toUpperCase() || 'S/D'}</span>;
  };

  const getCylinderAssignmentDetail = (item) => {
      if (item.location === 'PADOMI') {
          const p = item.current_patient || item.patient;
          return p ? `${p.full_name} (DNI: ${p.dni || 'S/D'})` : 'Paciente PADOMI';
      } else if (item.location === 'HOSPITALIZACION') {
          const s = item.current_service || item.service;
          const b = item.current_bed;
          return s ? `${s.name}${b ? ' - Cama: ' + b.bed_number : ''}` : 'Servicio Hospitalario';
      } else if (item.location === 'PERIFERIE' || item.location === 'PERIFERIE/CENTROS MEDICOS') {
          const s = item.current_service || item.service;
          return s ? s.name : 'Centro Asistencial Red';
      } else if (item.location === 'PROVEEDOR') {
          const sup = item.supplier;
          return sup ? sup.name : 'Recarga Externa';
      } else if (item.location === 'CENTRAL') {
          return 'Almacén Central / Planta';
      } else if (item.location === 'AUTORIDAD / TERCEROS' || item.location === 'AUTORIDADES') {
          return 'Entidad Externa / Autoridad';
      }
      return '-';
  };

  const totalPreviewPages = Math.ceil(previewData.length / PREVIEW_PER_PAGE) || 1;
  const paginatedPreview = previewData.slice((previewPage - 1) * PREVIEW_PER_PAGE, previewPage * PREVIEW_PER_PAGE);

  const ReportCard = ({ title, description, icon: Icon, onClick, loading, bgColor, textColor }) => (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
              <div className={`p-4 rounded-2xl w-fit mb-4 ${bgColor} ${textColor}`}>
                  <Icon className="text-3xl" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{title}</h3>
              <p className="text-slate-500 text-sm">{description}</p>
          </div>
          <button 
              onClick={onClick}
              disabled={loading}
              className={`mt-6 w-full py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95
                  ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200'}`}
          >
              {loading ? (
                  <>
                      <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      Analizando...
                  </>
              ) : (
                  <>
                      <MdVisibility className="text-xl" />
                      Previsualizar
                  </>
              )}
          </button>
      </div>
  );

  return (
      <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <MdDateRange className="text-xl" />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 text-lg">Parámetros de Exportación</h3>
                      <p className="text-slate-500 text-sm">Selecciona el rango de fechas para los reportes periódicos (los reportes de inventario toman el estado actual).</p>
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                  <div className="flex-1 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha Inicio</label>
                      <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                      />
                  </div>
                  <div className="flex-1 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Fecha Fin</label>
                      <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                      />
                  </div>
              </div>
          </div>

          {/* Filtros de Inventario General */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <MdInventory className="text-xl" />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 text-lg">Filtros para Inventario General</h3>
                      <p className="text-slate-500 text-sm">Opcional. Estos filtros se aplican únicamente a la exportación del &quot;Inventario General (Físico Actual)&quot;.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Ubicación</label>
                      <select 
                          value={inventoryLocation} 
                          onChange={(e) => setInventoryLocation(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700"
                      >
                          <option value="ALL">TODAS</option>
                          <option value="CENTRAL">CENTRAL</option>
                          <option value="HOSPITALIZACION">HOSPITALIZACIÓN</option>
                          <option value="PADOMI">PADOMI</option>
                          <option value="ALMACEN">ALMACÉN</option>
                          <option value="PROVEEDOR">PROVEEDOR</option>
                          <option value="PERIFERIE/CENTROS MEDICOS">PERIFERIE/CENTROS MEDICOS</option>
                      </select>
                  </div>
                  <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Propiedad</label>
                      <select 
                          value={inventoryOwnership} 
                          onChange={(e) => setInventoryOwnership(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700"
                      >
                          <option value="">TODAS</option>
                          {ownershipTypesList.map(o => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                      </select>
                  </div>
                  <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Proveedor / Modelo</label>
                      <select 
                          value={inventorySupplier} 
                          onChange={(e) => setInventorySupplier(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700"
                      >
                          <option value="">TODOS</option>
                          {suppliersList.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                      </select>
                  </div>
                  <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Estado</label>
                      <select 
                          value={inventoryStatus} 
                          onChange={(e) => setInventoryStatus(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700"
                      >
                          <option value="">TODOS</option>
                          <option value="full">LLENOS</option>
                          <option value="empty">VACÍOS</option>
                          <option value="in_use">EN USO</option>
                          <option value="in_transit">EN TRÁNSITO</option>
                      </select>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ReportCard 
                  title="Proveedor Externo"
                  description="Reporte mensual exclusivo de recepción y despacho de cilindros con proveedores externos (Linde, Praxair, etc.)."
                  icon={MdLocalShipping}
                  loading={loadingStates.supplier}
                  onClick={() => fetchPreviewData('supplier')}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
              />
              <ReportCard 
                  title="Hospitalización HNAGV"
                  description="Reporte exclusivo de ubicación y rotación de cilindros en los servicios hospitalarios internos del HNAGV."
                  icon={MdLocalHospital}
                  loading={loadingStates.location}
                  onClick={() => fetchPreviewData('location')}
                  bgColor="bg-indigo-50"
                  textColor="text-indigo-600"
              />
              <ReportCard 
                  title="Pacientes PADOMI"
                  description="Reporte diario mensualizado exclusivo de asignaciones, recargas y préstamos a pacientes PADOMI."
                  icon={MdPerson}
                  loading={loadingStates.patient}
                  onClick={() => fetchPreviewData('patient')}
                  bgColor="bg-purple-50"
                  textColor="text-purple-600"
              />
              <ReportCard 
                  title="Centros Asistenciales (Periferia)"
                  description="Reporte exclusivo de canjes de red, entregas y recepción de cilindros llenos/vacíos a las Ipress."
                  icon={MdLocationOn}
                  loading={loadingStates.ipress}
                  onClick={() => fetchPreviewData('ipress')}
                  bgColor="bg-rose-50"
                  textColor="text-rose-600"
              />
              <ReportCard 
                  title="Trasiegos / Recargas (Cascada)"
                  description="Reporte de recargas internas mediante decantación (Trasiego), detallando merma y operador."
                  icon={MdSyncAlt}
                  loading={loadingStates.trasiegos}
                  onClick={() => fetchPreviewData('trasiegos')}
                  bgColor="bg-amber-50"
                  textColor="text-amber-600"
              />
              <ReportCard 
                  title="Inventario General (Físico Actual)"
                  description="Reporte del estado actual de todos los cilindros. Exporta la base de datos en tiempo real (ignora las fechas seleccionadas arriba)."
                  icon={MdInventory}
                  loading={loadingStates.inventory}
                  onClick={() => fetchPreviewData('inventory')}
                  bgColor="bg-emerald-50"
                  textColor="text-emerald-600"
              />
              <ReportCard 
                  title="O2 Líquido: Lecturas"
                  description="Reporte diario de lecturas de niveles del tanque criogénico y medidor de flujo."
                  icon={MdWaterDrop}
                  loading={loadingStates.liquid_readings}
                  onClick={() => fetchPreviewData('liquid_readings')}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
              />
              <ReportCard 
                  title="O2 Líquido: Recargas"
                  description="Reporte de recargas de oxígeno líquido provenientes de la cisterna del proveedor externo."
                  icon={MdLocalShipping}
                  loading={loadingStates.liquid_refills}
                  onClick={() => fetchPreviewData('liquid_refills')}
                  bgColor="bg-cyan-50"
                  textColor="text-cyan-600"
              />
          </div>

          {/* Modal de Previsualización */}
          <Modal 
            isOpen={previewModal} 
            onClose={() => setPreviewModal(false)} 
            title={`Vista Previa: ${getReportTitle()}`} 
            elevated 
            maxWidth="max-w-6xl"
          >
            <div className="mb-4">
              <p className="text-slate-600 font-medium">
                Se han encontrado <span className="font-bold text-blue-600">{previewData.length} registros</span> para {previewType === 'inventory' ? 'el inventario actual' : `las fechas seleccionadas (${getDateRangeText()})`}.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Visualización limitada a 20 registros por página para máxima velocidad. La exportación descargará los <span className="font-bold text-emerald-700">{previewData.length} registros completos</span>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-4">
                <div className="overflow-x-auto max-h-[420px]">
                    {previewType === 'inventory' ? (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Nº</th>
                                    <th className="px-4 py-3">Cód. Cilindro</th>
                                    <th className="px-4 py-3">Cód. Referencia</th>
                                    <th className="px-4 py-3">Propiedad</th>
                                    <th className="px-4 py-3">Modelo / Prov.</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Ubicación Actual</th>
                                    <th className="px-4 py-3">Detalle Asignación</th>
                                    <th className="px-4 py-3">Capacidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginatedPreview.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                                            No hay cilindros registrados en el inventario.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPreview.map((item, index) => (
                                        <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-4 py-3 text-slate-400 font-medium">{(previewPage - 1) * PREVIEW_PER_PAGE + index + 1}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800">{item.serial_number || 'S/D'}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.barcode || '-'}</td>
                                            <td className="px-4 py-3 text-slate-700 font-semibold">{item.ownership_type?.name || item.ownership_type_name || 'ESSALUD'}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.supplier?.name || item.supplier_name || item.ownership_type?.name || '-'}</td>
                                            <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                                            <td className="px-4 py-3 font-medium text-indigo-700">{item.location || 'CENTRAL'}</td>
                                            <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{getCylinderAssignmentDetail(item)}</td>
                                            <td className="px-4 py-3 text-slate-700 font-bold">{item.capacity || 0} m³</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : previewType === 'liquid_readings' ? (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Nº</th>
                                    <th className="px-4 py-3">Fecha Lectura</th>
                                    <th className="px-4 py-3">Turno</th>
                                    <th className="px-4 py-3">Nivel Tanque</th>
                                    <th className="px-4 py-3">Flujómetro</th>
                                    <th className="px-4 py-3">Registrado Por</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginatedPreview.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                                            No hay lecturas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPreview.map((item, index) => (
                                        <tr key={item.id || index} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-4 py-3 text-slate-400 font-medium">{(previewPage - 1) * PREVIEW_PER_PAGE + index + 1}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800">{item.reading_date || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 font-semibold">{item.shift?.toUpperCase() || '-'}</td>
                                            <td className="px-4 py-3 font-medium text-blue-700">{item.tank_level || '0'} mmH2O</td>
                                            <td className="px-4 py-3 text-slate-700 font-bold">{item.flow_meter_reading || '0'} m3</td>
                                            <td className="px-4 py-3 text-slate-600">{item.user?.name || item.user_name || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : previewType === 'liquid_refills' ? (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Nº</th>
                                    <th className="px-4 py-3">Fecha Recarga</th>
                                    <th className="px-4 py-3">Proveedor</th>
                                    <th className="px-4 py-3">Guía</th>
                                    <th className="px-4 py-3">Cantidad</th>
                                    <th className="px-4 py-3">Nivel Antes</th>
                                    <th className="px-4 py-3">Nivel Después</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginatedPreview.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                                            No hay recargas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPreview.map((item, index) => (
                                        <tr key={item.id || index} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-4 py-3 text-slate-400 font-medium">{(previewPage - 1) * PREVIEW_PER_PAGE + index + 1}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800">{item.refilled_at || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 font-semibold">{item.supplier_name || 'PRAXAIR / LINDE'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{item.guide_number || '-'}</td>
                                            <td className="px-4 py-3 text-emerald-700 font-bold">{item.ticket_quantity || '0'} Kg</td>
                                            <td className="px-4 py-3 text-slate-600">{item.tank_level_before || '0'}</td>
                                            <td className="px-4 py-3 text-blue-700 font-bold">{item.tank_level_after || '0'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Nº</th>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Acción</th>
                                    <th className="px-4 py-3">Balón</th>
                                    <th className="px-4 py-3">Destino / Ubicación</th>
                                    <th className="px-4 py-3">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginatedPreview.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                                            No hay datos disponibles para exportar con estos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPreview.map((item, index) => (
                                        <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-4 py-3 text-slate-400 font-medium">{(previewPage - 1) * PREVIEW_PER_PAGE + index + 1}</td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : ''}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                    item.action === 'Ingreso' 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : item.action === 'Recarga' 
                                                        ? 'bg-amber-100 text-amber-700' 
                                                        : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {item.action || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-slate-800">{item.cylinder?.serial_number || 'S/D'}</span>
                                                <span className="text-xs text-slate-500 block">{item.cylinder?.ownership_type || 'N/A'} - {item.cylinder?.capacity}m³</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {item.location?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {item.location?.detail || item.type || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Barra de Paginación del Preview */}
            {previewData.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4 px-1 text-xs text-slate-500">
                    <span>
                        Mostrando página <span className="font-bold text-slate-800">{previewPage}</span> de <span className="font-bold text-slate-800">{totalPreviewPages}</span> ({previewData.length} registros en total)
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            disabled={previewPage <= 1}
                            onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 flex items-center gap-1"
                        >
                            <MdNavigateBefore className="text-base" /> Anterior
                        </button>
                        <span className="px-2 font-bold text-slate-700">{previewPage} / {totalPreviewPages}</span>
                        <button
                            type="button"
                            disabled={previewPage >= totalPreviewPages}
                            onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 flex items-center gap-1"
                        >
                            Siguiente <MdNavigateNext className="text-base" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                    onClick={() => setPreviewModal(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={executeDownload}
                    disabled={previewData.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md transition-all"
                >
                    <MdDownload className="text-lg" />
                    Confirmar y Descargar Excel ({previewData.length})
                </button>
            </div>
          </Modal>
      </div>
  );
};

export default ExcelExportsPanel;
