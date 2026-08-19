import { useState } from 'react';
import { MdDownload, MdDateRange, MdLocalShipping, MdLocationOn, MdPerson, MdLocalHospital, MdSyncAlt } from 'react-icons/md';
import { format } from 'date-fns';
import api from '../services/api';
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

  const setButtonLoading = (key, value) => {
      setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const getDateRangeText = () => {
      if (startDate && endDate) return `${format(new Date(startDate), 'dd/MM/yyyy')} AL ${format(new Date(endDate), 'dd/MM/yyyy')}`;
      if (startDate) return `DESDE ${format(new Date(startDate), 'dd/MM/yyyy')}`;
      if (endDate) return `HASTA ${format(new Date(endDate), 'dd/MM/yyyy')}`;
      return format(new Date(), 'dd/MM/yyyy');
  };

  const downloadSupplierReport = async () => {
      setButtonLoading('supplier', true);
      try {
          const res = await api.get('/reports/movements-search', {
              params: { export: true, start_date: startDate, end_date: endDate }
          });
          // Filtramos solo ingresos y salidas de proveedores
          const data = res.data.data.filter(item => 
              item.type === 'Ingreso Proveedor' || item.type === 'Salida Proveedor' || 
              (item.location && item.location.type === 'Proveedor')
          );
          await exportSupplierReport(data, getDateRangeText());
      } catch (error) {
          console.error("Error downloading supplier report", error);
      } finally {
          setButtonLoading('supplier', false);
      }
  };

  const downloadLocationReport = async () => {
      setButtonLoading('location', true);
      try {
          // Para ubicaciones se podría usar el kardex o los movimientos generales.
          // Como pidieron la ubicación actual, si exportamos movimientos de HNAGV
          const res = await api.get('/reports/movements-search', {
              params: { export: true, start_date: startDate, end_date: endDate }
          });
          const data = res.data.data.filter(item => item.location && item.location.type.includes('Servicio'));
          await exportLocationReport(data, getDateRangeText());
      } catch (error) {
          console.error("Error downloading location report", error);
      } finally {
          setButtonLoading('location', false);
      }
  };

  const downloadPatientReport = async () => {
      setButtonLoading('patient', true);
      try {
          const res = await api.get('/reports/movements-search', {
              params: { export: true, start_date: startDate, end_date: endDate }
          });
          const data = res.data.data.filter(item => item.location && item.location.type === 'Paciente');
          await exportPadomiPatientReport(data, getDateRangeText());
      } catch (error) {
          console.error("Error downloading patient report", error);
      } finally {
          setButtonLoading('patient', false);
      }
  };

  const downloadIpressReport = async () => {
      setButtonLoading('ipress', true);
      try {
          const res = await api.get('/reports/movements-search', {
              params: { export: true, start_date: startDate, end_date: endDate }
          });
          const data = res.data.data.filter(item => item.type === 'Canje de Red (Periferia)');
          await exportIpressReport(data, getDateRangeText());
      } catch (error) {
          console.error("Error downloading IPRESS report", error);
      } finally {
          setButtonLoading('ipress', false);
      }
  };

  const downloadTrasiegosReport = async () => {
      setButtonLoading('trasiegos', true);
      try {
          const res = await api.get('/reports/movements-search', {
              params: { export: true, start_date: startDate, end_date: endDate }
          });
          const data = res.data.data.filter(item => item.type === 'Trasiego (Decantación)');
          await exportTrasiegosReport(data, getDateRangeText());
      } catch (error) {
          console.error("Error downloading trasiegos report", error);
      } finally {
          setButtonLoading('trasiegos', false);
      }
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
                      Generando...
                  </>
              ) : (
                  <>
                      <MdDownload className="text-xl" />
                      Descargar Excel
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
                  onClick={downloadSupplierReport}
                  bgColor="bg-cyan-50"
                  textColor="text-cyan-600"
              />
              <ReportCard 
                  title="Ubicación y Stock"
                  description="Reporte de la ubicación actual de cilindros en los servicios del HNAGV."
                  icon={MdLocationOn}
                  loading={loadingStates.location}
                  onClick={downloadLocationReport}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
              />
              <ReportCard 
                  title="Pacientes PADOMI"
                  description="Reporte diario mensual de asignaciones a pacientes."
                  icon={MdPerson}
                  loading={loadingStates.patient}
                  onClick={downloadPatientReport}
                  bgColor="bg-purple-50"
                  textColor="text-purple-600"
              />
              <ReportCard 
                  title="Centro Asistencial"
                  description="Reporte mensualizado de llenado de cilindros para centros asistenciales."
                  icon={MdLocalHospital}
                  loading={loadingStates.ipress}
                  onClick={downloadIpressReport}
                  bgColor="bg-rose-50"
                  textColor="text-rose-600"
              />
              <ReportCard 
                  title="Trasiegos / Recargas"
                  description="Reporte diario mensual de trasiegos por paciente PADOMI y servicios."
                  icon={MdSyncAlt}
                  loading={loadingStates.trasiegos}
                  onClick={downloadTrasiegosReport}
                  bgColor="bg-amber-50"
                  textColor="text-amber-600"
              />
          </div>
      </div>
  );
};

export default ExcelExportsPanel;
