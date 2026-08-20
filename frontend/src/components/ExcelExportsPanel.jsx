import { useState } from 'react';
import { MdDownload, MdDateRange, MdLocalShipping, MdLocationOn, MdPerson, MdLocalHospital, MdSyncAlt, MdVisibility } from 'react-icons/md';
import { format } from 'date-fns';
import api from '../services/api';
import Modal from './Modal';
import { 
    exportSupplierReport, 
    exportLocationReport, 
    exportPadomiPatientReport, 
    exportIpressReport, 
    exportTrasiegosReport 
} from '../utils/excelExportService';

const ExcelExportsPanel = () => {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [loadingStates, setLoadingStates] = useState({
      supplier: false,
      location: false,
      patient: false,
      ipress: false,
      trasiegos: false
  });

  // Modal Preview States
  const [previewModal, setPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewType, setPreviewType] = useState('');

  const setButtonLoading = (key, value) => {
      setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const getDateRangeText = () => {
      if (startDate && endDate) return `${format(new Date(startDate), 'dd/MM/yyyy')} AL ${format(new Date(endDate), 'dd/MM/yyyy')}`;
      if (startDate) return `DESDE ${format(new Date(startDate), 'dd/MM/yyyy')}`;
      if (endDate) return `HASTA ${format(new Date(endDate), 'dd/MM/yyyy')}`;
      return format(new Date(), 'dd/MM/yyyy');
  };

  const fetchPreviewData = async (type) => {
      setButtonLoading(type, true);
      try {
          const res = await api.get('/reports/movements-search', {
              params: { export: true, start_date: startDate, end_date: endDate }
          });
          let data = [];
          
          if (type === 'supplier') {
              data = res.data.data.filter(item => 
                  item.type === 'Ingreso Proveedor' || item.type === 'Salida Proveedor' || 
                  (item.location && item.location.type === 'Proveedor')
              );
          } else if (type === 'location') {
              data = res.data.data.filter(item => item.location && item.location.type.includes('Servicio'));
          } else if (type === 'patient') {
              data = res.data.data.filter(item => item.location && item.location.type === 'Paciente');
          } else if (type === 'ipress') {
              data = res.data.data.filter(item => item.type === 'Canje de Red (Periferia)');
          } else if (type === 'trasiegos') {
              data = res.data.data.filter(item => item.type === 'Trasiego (Decantación)');
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
      
      setPreviewModal(false);
  };

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
                      <p className="text-slate-500 text-sm">Selecciona el rango de fechas para los reportes mensuales o personalizados.</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <ReportCard 
                  title="Proveedor Externo"
                  description="Reporte mensual de recepción y despacho de cilindros por proveedor externo."
                  icon={MdLocalShipping}
                  loading={loadingStates.supplier}
                  onClick={() => fetchPreviewData('supplier')}
                  bgColor="bg-cyan-50"
                  textColor="text-cyan-600"
              />
              <ReportCard 
                  title="Ubicación y Stock"
                  description="Reporte de la ubicación actual de cilindros en los servicios del HNAGV."
                  icon={MdLocationOn}
                  loading={loadingStates.location}
                  onClick={() => fetchPreviewData('location')}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
              />
              <ReportCard 
                  title="Pacientes PADOMI"
                  description="Reporte diario mensual de asignaciones a pacientes."
                  icon={MdPerson}
                  loading={loadingStates.patient}
                  onClick={() => fetchPreviewData('patient')}
                  bgColor="bg-purple-50"
                  textColor="text-purple-600"
              />
              <ReportCard 
                  title="Centro Asistencial"
                  description="Reporte mensualizado de llenado de cilindros para centros asistenciales."
                  icon={MdLocalHospital}
                  loading={loadingStates.ipress}
                  onClick={() => fetchPreviewData('ipress')}
                  bgColor="bg-rose-50"
                  textColor="text-rose-600"
              />
              <ReportCard 
                  title="Trasiegos / Recargas"
                  description="Reporte diario mensual de trasiegos por paciente PADOMI y servicios."
                  icon={MdSyncAlt}
                  loading={loadingStates.trasiegos}
                  onClick={() => fetchPreviewData('trasiegos')}
                  bgColor="bg-amber-50"
                  textColor="text-amber-600"
              />
          </div>

          {/* Modal de Previsualización */}
          <Modal 
            isOpen={previewModal} 
            onClose={() => setPreviewModal(false)} 
            title="Vista Previa de Exportación" 
            elevated 
            maxWidth="max-w-6xl"
          >
            <div className="mb-4">
              <p className="text-slate-600 font-medium">
                Se han encontrado <span className="font-bold text-blue-600">{previewData.length} registros</span> para las fechas seleccionadas ({getDateRangeText()}).
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Revisa una muestra de los datos antes de exportarlos a Excel para asegurarte de que son los correctos.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-6">
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Acción</th>
                                <th className="px-4 py-3">Balón</th>
                                <th className="px-4 py-3">Destino / Ubicación</th>
                                <th className="px-4 py-3">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {previewData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                                        No hay datos disponibles para exportar con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                previewData.map((item, index) => (
                                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-4 py-3 text-slate-700">
                                            {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : ''}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            <span className={`px-2 py-1 rounded-md text-xs ${item.action === 'Ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
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
                </div>
            </div>

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
                    Confirmar y Descargar Excel
                </button>
            </div>
          </Modal>
      </div>
  );
};

export default ExcelExportsPanel;
