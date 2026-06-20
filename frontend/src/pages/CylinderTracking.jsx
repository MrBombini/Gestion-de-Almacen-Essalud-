import { useState, useEffect } from 'react';
import Select from 'react-select';
import { 
  MdPropaneTank, 
  MdSearch, 
  MdLocationOn, 
  MdPerson, 
  MdLocalHospital, 
  MdBusiness, 
  MdCalendarMonth, 
  MdReport,
  MdArrowUpward,
  MdArrowDownward
} from 'react-icons/md';
import { FaGasPump } from 'react-icons/fa6';
import useFetch from '../hooks/useFetch';
import api from '../services/api';

const CylinderTracking = () => {
  // 1. Cargar la lista completa de balones para el buscador
  const { data: cylinders, loading: loadingCylinders } = useFetch('/cylinders?per_page=all');
  const cylindersList = Array.isArray(cylinders) ? cylinders : (cylinders?.data || []);

  const [selectedOption, setSelectedOption] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState(null);

  // Formatear las opciones del buscador (Select)
  const cylinderOptions = cylindersList.map(c => {
    const patientSuffix = c.patient ? ` (Paciente: ${c.patient.full_name})` : '';
    return {
      value: c.id,
      label: `${c.serial_number} ${c.barcode ? `(${c.barcode})` : ''} - ${c.ownership_type?.name || 'Propiedad S/D'}${patientSuffix} (${c.capacity} m³)`
    };
  });

  // Buscar historial cuando cambia el cilindro seleccionado
  useEffect(() => {
    if (!selectedOption) {
      setHistoryData(null);
      return;
    }

    const fetchHistory = async () => {
      setLoadingHistory(true);
      setErrorHistory(null);
      try {
        // Usamos la instancia api configurada directamente
        const response = await api.get(`/reports/history/${selectedOption.value}`);
        setHistoryData(response.data);
      } catch (err) {
        setErrorHistory(err.response?.data?.message || err.message || 'Error al cargar el historial.');
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedOption]);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '1rem',
      borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 2px #3b82f620' : 'none',
      padding: '4px',
      fontSize: '0.95rem',
      backgroundColor: 'white',
    }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };

  const statusBadge = (status) => {
    const map = {
      full: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      empty: 'bg-red-50 text-red-700 border-red-200',
      in_use: 'bg-blue-50 text-blue-700 border-blue-200',
      in_transit: 'bg-orange-50 text-orange-700 border-orange-200',
      lost: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    const label = { full: 'Lleno', empty: 'Vacío', in_use: 'En Uso', in_transit: 'En Tránsito', lost: 'Extraviado' };
    return <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${map[status] || 'bg-slate-100 text-slate-600'}`}>{label[status] || status}</span>;
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
      <span className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 w-fit ${map[loc] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        <MdLocationOn className="text-sm" /> {loc}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Cabecera */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 bg-cyan-50 text-cyan-600 rounded-xl">
          <MdPropaneTank className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Seguimiento de Balones (Tracking)</h2>
          <p className="text-slate-500 text-sm mt-1">
            Consulta la ficha técnica, ubicación y línea de tiempo histórica de cada cilindro.
          </p>
        </div>
      </div>

      {/* Buscador de Balón */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
          <MdSearch className="text-slate-400 text-lg" /> Buscar Cilindro por Código o Barra
        </label>
        <Select
          options={cylinderOptions}
          styles={selectStyles}
          isClearable
          isLoading={loadingCylinders}
          placeholder="Escribe el código del balón (Ej. OX-00001)..."
          value={selectedOption}
          onChange={(opt) => setSelectedOption(opt)}
          noOptionsMessage={() => "No se encontraron balones."}
        />
      </div>

      {/* Carga e Historial */}
      {loadingHistory && (
        <div className="py-20 text-center font-bold text-slate-400 animate-pulse text-lg uppercase tracking-wider">
          Consultando base de datos del balón...
        </div>
      )}

      {errorHistory && (
        <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-2xl font-medium">
          {errorHistory}
        </div>
      )}

      {!loadingHistory && historyData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Ficha Técnica Lateral */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
              <MdReport className="text-blue-500" /> Ficha Técnica
            </h3>

            <div className="space-y-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase">Número de Serie</span>
                <span className="text-lg font-bold text-slate-800 font-mono">{historyData.cylinder.serial_number}</span>
              </div>

              {historyData.cylinder.barcode && (
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Código de Barras</span>
                  <span className="text-sm font-semibold text-slate-700 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200">{historyData.cylinder.barcode}</span>
                </div>
              )}

              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase">Ubicación Actual</span>
                <div className="mt-1">{locationBadge(historyData.cylinder.location)}</div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase">Estado Actual</span>
                <div className="mt-1">{statusBadge(historyData.cylinder.status)}</div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase">Capacidad</span>
                <span className="text-sm font-semibold text-slate-800">{Number(historyData.cylinder.capacity)} m³</span>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase">Propietario / Marca</span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mt-1">
                  <MdBusiness className="text-slate-400" />
                  {historyData.cylinder.ownership_type?.name || 'S/D'}
                </div>
              </div>

              {historyData.cylinder.current_patient && (
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                  <span className="block text-xs font-bold text-indigo-500 uppercase">Paciente Asignado</span>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-900 mt-1">
                    <MdPerson />
                    {historyData.cylinder.current_patient.full_name}
                  </div>
                </div>
              )}

              {historyData.cylinder.current_service && (
                <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                  <span className="block text-xs font-bold text-pink-500 uppercase">Servicio Asignado</span>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-pink-900 mt-1">
                    <MdLocalHospital />
                    {historyData.cylinder.current_service.name} 
                    {historyData.cylinder.current_bed ? ` - Cama: ${historyData.cylinder.current_bed.bed_number}` : ''}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Prueba Hidrostática:</span>
                  <span className="font-semibold">{historyData.cylinder.hydrostatic_test_date || 'S/D'}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Condición Física:</span>
                  <span className={`font-bold uppercase ${historyData.cylinder.physical_condition === 'Good' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {historyData.cylinder.physical_condition === 'Good' ? 'BUENA' : historyData.cylinder.physical_condition || 'S/D'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Historial en Línea de Tiempo */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
              <MdCalendarMonth className="text-blue-500" /> Línea de Tiempo de Operaciones
            </h3>

            {historyData.history.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No se registran movimientos ni trasiegos históricos para este balón.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 my-4 ml-3">
                {historyData.history.map((event, index) => {
                  const isEntry = event.action === 'Entry';
                  const isDecanting = event.event_type === 'Trasiego';

                  let iconBg = 'bg-orange-100 text-orange-600';
                  let eventIcon = <MdArrowUpward className="text-base" />;

                  if (isDecanting) {
                    iconBg = 'bg-blue-100 text-blue-600';
                    eventIcon = <FaGasPump className="text-sm" />;
                  } else if (isEntry) {
                    iconBg = 'bg-emerald-100 text-emerald-600';
                    eventIcon = <MdArrowDownward className="text-base" />;
                  }

                  return (
                    <div key={index} className="relative group">
                      
                      {/* Círculo con Icono en la línea */}
                      <span className={`absolute -left-10 top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow ${iconBg}`}>
                        {eventIcon}
                      </span>

                      <div className="bg-slate-50 group-hover:bg-slate-100/70 p-4 rounded-xl border border-slate-200/60 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{event.event_type}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                              isDecanting ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              isEntry ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                              {isDecanting ? 'Trasiego' : isEntry ? 'Ingreso' : 'Salida'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {new Date(event.date).toLocaleString('es-PE')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                          <div>
                            <span className="block font-semibold text-slate-400">Destino / Origen</span>
                            <span className="font-bold text-slate-800 uppercase">{event.destination}</span>
                          </div>
                          <div>
                            <span className="block font-semibold text-slate-400">Estado del Balón</span>
                            <span className="font-bold text-slate-700 uppercase">{event.status === 'full' ? 'Lleno' : event.status === 'empty' ? 'Vacío' : event.status}</span>
                          </div>
                          {event.document && (
                            <div>
                              <span className="block font-semibold text-slate-400">Documentación / Ref</span>
                              <span className="font-mono text-slate-700">{event.document}</span>
                            </div>
                          )}
                          <div>
                            <span className="block font-semibold text-slate-400">Operario Responsable</span>
                            <span className="font-semibold text-slate-800">{event.user} (Turno: {event.shift})</span>
                          </div>
                        </div>

                        {event.notes && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/50 text-xs text-slate-500 italic">
                            <span className="font-bold not-italic text-slate-400 mr-1">Obs:</span>
                            {event.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {!historyData && !loadingHistory && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-24 text-center">
          <MdPropaneTank className="text-6xl text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            Por favor, selecciona un balón en el buscador superior para visualizar su ficha de seguimiento e historial.
          </p>
        </div>
      )}
    </div>
  );
};

export default CylinderTracking;
