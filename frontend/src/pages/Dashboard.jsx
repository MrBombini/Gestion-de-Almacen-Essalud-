import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import api from '../services/api';
import { 
  MdInsertChartOutlined, 
  MdOutlineLocalGasStation, 
  MdOutlineInventory2, 
  MdDateRange, 
  MdTrendingUp, 
  MdSwapHoriz, 
  MdScience, 
  MdPeople, 
  MdAssignment, 
  MdAssessment, 
  MdCheckCircle, 
  MdWarning, 
  MdRefresh, 
  MdFileDownload, 
  MdPrint,
  MdShield,
  MdSchedule,
  MdOutlineAir,
  MdLocalHospital,
  MdNotificationsActive,
  MdArrowForward,
  MdClose
} from 'react-icons/md';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Vistas unificadas en el Dashboard
import ExecutiveConsumptionReport from './ExecutiveConsumptionReport';
import KardexResume from './KardexResume';
import DailyKardexReport from './DailyKardexReport';

// Obtiene la fecha local de Perú exacta (YYYY-MM-DD)
const getLocalYYYYMMDD = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
};

const getBrandCategory = (sBrand, sSupplier) => {
  sBrand = String(sBrand || '').toUpperCase();
  sSupplier = String(sSupplier || '').toUpperCase();
  if (sBrand.includes('PERIFERIE')) return 'PERIFERIE';
  if (sBrand.includes('ESSALUD') || sBrand === 'MAT' || sBrand.includes('YA') || sBrand.includes('JD') || sBrand.includes('KIOSHI')) return 'ESSALUD';
  if (sBrand.includes('PACIENT') || sBrand.includes('PROPIO')) return 'PROPIO';
  if (sBrand.includes('OXICUSCO')) return 'OXICUSCO';
  if (sBrand.includes('PRAXAIR') || sBrand === 'PX' || sSupplier.includes('PRAXAIR') || sSupplier.includes('LINDE')) return 'PRAXAIR';
  return 'UNKNOWN';
};

const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Object.values(data);
};

const getStockCount = (stockArray, location, capacity, brandKeyword) => {
  const array = ensureArray(stockArray);
  let total = 0;
  array.forEach(s => {
    if (!s) return;
    const sLoc = String(s.location || '').toUpperCase();
    let rawCap = Math.floor(parseFloat(s.capacity || 0));
    let sCap = 10;
    if (rawCap <= 6) sCap = 6;
    else if (rawCap <= 8) sCap = 8;

    const sBrand = String(s.ownership_type?.name || s.ownership_name || s.ownership_type_name || '').toUpperCase();
    const sSupplier = String(s.supplier?.name || s.supplier_name || '').toUpperCase();

    let locMatch = false;
    if (location.toUpperCase() === 'CENTRAL') {
      if (sLoc === 'CENTRAL') locMatch = true;
    } else if (location.toUpperCase() === 'ALMACEN') {
      if (sLoc === 'ALMACEN' || sLoc.includes('ALMACEN')) locMatch = true;
    } else {
      if (sLoc.includes(location.toUpperCase())) locMatch = true;
    }

    if (locMatch && sCap === capacity) {
      const category = getBrandCategory(sBrand, sSupplier);
      if (category === brandKeyword) {
        total += (parseInt(s.total, 10) || 0);
      }
    }
  });
  return total;
};

const calcPhysicalReserve = (llenos) => {
  return (getStockCount(llenos, 'CENTRAL', 6, 'ESSALUD') * 6) +
    (getStockCount(llenos, 'CENTRAL', 10, 'OXICUSCO') * 10) +
    (getStockCount(llenos, 'CENTRAL', 10, 'ESSALUD') * 10) +
    (getStockCount(llenos, 'CENTRAL', 10, 'PRAXAIR') * 10) +
    (getStockCount(llenos, 'CENTRAL', 8, 'ESSALUD') * 8) +
    (getStockCount(llenos, 'CENTRAL', 10, 'PROPIO') * 10) +
    (getStockCount(llenos, 'CENTRAL', 6, 'PROPIO') * 6) +
    (getStockCount(llenos, 'CENTRAL', 10, 'PERIFERIE') * 10) +
    (getStockCount(llenos, 'ALMACEN', 6, 'ESSALUD') * 6) +
    (getStockCount(llenos, 'ALMACEN', 10, 'ESSALUD') * 10) +
    (getStockCount(llenos, 'ALMACEN', 8, 'ESSALUD') * 8);
};

const Dashboard = ({ defaultTab }) => {
  const { user, shift } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados sincronizados con URL y rutas
  const activeTab = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) return tabParam;
    if (defaultTab) return defaultTab;
    if (location.pathname.includes('/reports/executive')) return 'gerencial';
    if (location.pathname.includes('/reports/kardexresume')) return 'resumen';
    if (location.pathname.includes('/reports/kardex')) return 'kardex';
    return 'gerencial';
  }, [searchParams, defaultTab, location.pathname]);

  const selectedDate = searchParams.get('date') || getLocalYYYYMMDD();

  const handleTabChange = (tabId) => {
    navigate(`/?tab=${tabId}&date=${selectedDate}`);
  };

  const handleDateChange = (newDate) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', activeTab);
    params.set('date', newDate);
    setSearchParams(params, { replace: true });
  };

  const handleQuickToday = () => {
    handleDateChange(getLocalYYYYMMDD());
  };

  const handleQuickYesterday = () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    handleDateChange(yesterday);
  };

  // 1. Estadísticas físicas de almacén central
  const { data: stats, loading: statsLoading, execute: refetchStats } = useFetch('/dashboard/stats');

  // 2. Datos ejecutivos del día para el KPI Banner
  const [executiveData, setExecutiveData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [hospAlerts, setHospAlerts] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [dismissHospAlert, setDismissHospAlert] = useState(false);

  const fetchKpis = async () => {
    setKpisLoading(true);
    try {
      const [resExec, resResume, resHosp] = await Promise.allSettled([
        api.get(`/reports/executive-consumption?date=${selectedDate}`),
        api.get(`/reports/consumption-dashboard?date=${selectedDate}`),
        api.get('/hospitalization/alerts')
      ]);
      if (resExec.status === 'fulfilled') {
        setExecutiveData(resExec.value.data);
      }
      if (resResume.status === 'fulfilled') {
        setResumeData(resResume.value.data);
      }
      if (resHosp.status === 'fulfilled') {
        setHospAlerts(resHosp.value.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
    // Polling cada 60 segundos para monitorear alertas de hospitalización en tiempo real
    const alertInterval = setInterval(() => {
      api.get('/hospitalization/alerts')
        .then(r => setHospAlerts(r.data))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(alertInterval);
  }, [selectedDate]);

  const handleRefreshAll = () => {
    refetchStats();
    fetchKpis();
  };

  // Cálculos de Auditoría y Cuadre de Kardex
  const cuadreInfo = useMemo(() => {
    if (!resumeData) return { isOk: true, text: 'Verificando...', color: 'text-slate-400' };
    const payload = resumeData;
    const shiftsData = payload.shifts || {};
    const initial_balance_m3 = payload.initial_balance ?? 0;

    const m_consumo = shiftsData['MAÑANA']?.total || 0;
    const m_ingreso = shiftsData['MAÑANA']?.total_ingreso || 0;
    const t_consumo = shiftsData['TARDE']?.total || 0;
    const t_ingreso = shiftsData['TARDE']?.total_ingreso || 0;
    const n_consumo = shiftsData['NOCHE']?.total || 0;
    const n_ingreso = shiftsData['NOCHE']?.total_ingreso || 0;

    const gran_total_consumo = m_consumo + t_consumo + n_consumo;
    const gran_total_ingreso = m_ingreso + t_ingreso + n_ingreso;

    const n_reserva_fisica = calcPhysicalReserve(shiftsData['NOCHE']?.reserva_llenos);
    const cuadreMatematico = initial_balance_m3 + gran_total_ingreso - gran_total_consumo;

    const isOk = cuadreMatematico === n_reserva_fisica;
    return {
      isOk,
      text: isOk ? 'Cuadrado Exacto' : 'Descuadre Detectado',
      initial: initial_balance_m3,
      consumo: gran_total_consumo,
      ingreso: gran_total_ingreso,
      reserva: n_reserva_fisica,
      calculado: cuadreMatematico,
      diferencia: Math.abs(cuadreMatematico - n_reserva_fisica)
    };
  }, [resumeData]);

  // Totales de Consumo Gaseoso Ejecutivo
  const totalGaseosoM3 = executiveData?.gaseoso?.consumo?.total_m3 ?? 0;
  const totalGaseosoUnd = useMemo(() => {
    const und = executiveData?.gaseoso?.consumo?.total_und || {};
    return (parseInt(und['10'] || 0, 10)) + (parseInt(und['8'] || 0, 10)) + (parseInt(und['6'] || 0, 10));
  }, [executiveData]);

  // Consumo Líquido
  const liquidM3 = executiveData?.liquido?.consumo?.consumo_m3 ?? '0.00';
  const liquidAutonomiaDias = executiveData?.liquido?.reserva?.proyeccion_dias ?? '—';
  const tankLevel = stats?.tank_level ?? executiveData?.liquido?.saldo_inicial?.lectura_actual ?? 0;

  // Procesar breakdown de central para pestaña "Stock en Almacén"
  const breakdown = stats?.breakdown || [];
  let capacities = [...new Set([...breakdown.map(b => Number(b.capacity)), 10, 8, 6])].sort((a,b) => b - a);
  capacities = capacities.filter(c => c > 0);

  const suppliersMap = new Map();
  breakdown.forEach(b => {
    let supName = 'OTROS PROVEEDORES';
    if (b.supplier && b.supplier.name) {
      supName = b.supplier.name.toUpperCase();
    }
    if (!suppliersMap.has(supName)) {
      suppliersMap.set(supName, []);
    }
    suppliersMap.get(supName).push(b);
  });

  const suppliersList = Array.from(suppliersMap.entries()).map(([supName, items]) => {
    let owners = [...new Set(items.map(b => b.ownership_type?.name || 'OTRO'))].sort();
    return { supName, items, owners };
  });

  if (suppliersList.length === 0) {
    suppliersList.push({ supName: 'SISTEMA', items: [], owners: ['ESSALUD', 'B.PROPIO P', 'PERIFERIA'] });
  }

  const getBreakdownCount = (items, owner, cap, status) => {
    const match = items.find(b => 
      (b.ownership_type?.name || 'OTRO') === owner && 
      Number(b.capacity) === cap && 
      b.status === status
    );
    return match ? match.total : 0;
  };

  const tabsConfig = [
    { 
      id: 'gerencial', 
      label: 'Reporte Gerencial', 
      badge: 'Oficial',
      icon: MdInsertChartOutlined,
      description: 'Consolidado ejecutivo de Oxígeno Gaseoso y Líquido (Corte 07:00 AM)'
    },
    { 
      id: 'resumen', 
      label: 'Resumen Kardex', 
      badge: cuadreInfo.isOk ? 'Cuadrado' : 'Revisión',
      icon: MdAssignment,
      description: 'Lógica en cascada por turnos y validador de cuadre de saldos en m³'
    },
    { 
      id: 'kardex', 
      label: 'Kardex General', 
      badge: 'Matriz Diaria',
      icon: MdAssessment,
      description: 'Matriz de 8 columnas por cilindro, movimientos por turno y firmas'
    },
    { 
      id: 'stock', 
      label: 'Stock en Almacén', 
      badge: `${stats?.full_central_count ?? 0} balones`,
      icon: MdOutlineInventory2,
      description: 'Inventario físico en Central por proveedor, modelo y capacidad'
    },
  ];

  const formattedDisplayDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-');
      const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return format(dObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (e) {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 px-2 sm:px-4">

      {/* ── 1. HERO HEADER DE MANDO CENTRAL ── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Efectos de luz ambiental de fondo */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Bienvenida y Título */}
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 shrink-0 border border-white/20">
              <MdShield className="text-3xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Panel Unificado de Control
                </span>
                <span className="hidden sm:inline-block text-slate-400 text-xs font-medium">| Almacén & Kardex</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                Hola, {user?.name || 'Operario'}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                {formattedDisplayDate}
              </p>
            </div>
          </div>

          {/* Barra de Filtros de Fecha y Acciones */}
          <div className="flex flex-wrap items-center gap-2.5 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md w-full lg:w-auto">
            
            {/* Input Fecha */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/10 text-white flex-1 sm:flex-none">
              <MdDateRange className="text-blue-400 text-lg shrink-0" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent border-none outline-none text-xs sm:text-sm font-bold text-white cursor-pointer"
              />
            </div>

            {/* Accesos Rápidos de Fecha */}
            <button
              onClick={handleQuickToday}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDate === getLocalYYYYMMDD()
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
              title="Cargar fecha de hoy"
            >
              Hoy
            </button>

            <button
              onClick={handleQuickYesterday}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDate === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
              title="Cargar fecha de ayer"
            >
              Ayer
            </button>

            {/* Turno Actual */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-2 rounded-xl border border-white/10 text-xs">
              <MdSchedule className="text-amber-400 text-base" />
              <span className="text-slate-400 font-bold hidden sm:inline">Turno:</span>
              <span className="font-black text-amber-300 uppercase tracking-wider">{shift || 'MAÑANA'}</span>
            </div>

            {/* Botón Refrescar */}
            <button
              onClick={handleRefreshAll}
              disabled={kpisLoading || statsLoading}
              className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all border border-white/10"
              title="Actualizar datos del panel"
            >
              <MdRefresh className={`text-lg ${(kpisLoading || statsLoading) ? 'animate-spin' : ''}`} />
            </button>

          </div>

        </div>
      </div>

      {/* ── AVISO DE HOSPITALIZACIÓN: BALONES POR AGOTARSE (≤ 2 HORAS) ── */}
      {hospAlerts && hospAlerts.total_alerts > 0 && !dismissHospAlert && (
        <div className="relative overflow-hidden rounded-3xl p-0.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 shadow-lg shadow-red-500/10 animate-fadeIn">
          <div className="bg-white rounded-[23px] p-4 sm:p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0 animate-bounce">
                  <MdNotificationsActive className="text-2xl" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-300 animate-pulse">
                      Alerta Prioritaria
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Control de Oxígeno en Hospitalización
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {hospAlerts.total_alerts} balón{hospAlerts.total_alerts > 1 ? 'es' : ''} de oxígeno requiere{hospAlerts.total_alerts > 1 ? 'n' : ''} cambio urgente (≤ 2 horas de autonomía)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Se detectaron balones asignados a camas con autonomía crítica. Se recomienda el recambio inmediato para evitar desabastecimiento.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => navigate('/reports/hospitalization-control')}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <MdLocalHospital className="text-base" />
                  <span>Atender en Hospitalización</span>
                  <MdArrowForward className="text-sm" />
                </button>
                <button
                  onClick={() => setDismissHospAlert(true)}
                  title="Ocultar aviso temporalmente"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <MdClose className="text-lg" />
                </button>
              </div>

            </div>

            {/* Fila de balones críticos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
              {hospAlerts.alerts?.map((al, idx) => {
                const totalMins = Math.floor((al.remaining_hours || 0) * 60);
                const h = Math.floor(totalMins / 60);
                const m = totalMins % 60;
                const timeText = al.remaining_hours <= 0 ? '0h (Agotado)' : (h > 0 ? `${h}h ${m}m` : `${m} min`);

                return (
                  <div
                    key={idx}
                    onClick={() => navigate('/reports/hospitalization-control')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-sm flex items-center justify-between gap-3 ${
                      al.status === 'depleted'
                        ? 'bg-slate-900 border-rose-500 text-white'
                        : al.status === 'critical'
                        ? 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                        : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black uppercase ${al.status === 'depleted' ? 'text-rose-400' : 'text-slate-900'}`}>
                          Cama {al.bed_number || '?'}
                        </span>
                        <span className={`text-[10px] truncate max-w-[100px] ${al.status === 'depleted' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {al.service_name || 'Hospitalización'}
                        </span>
                      </div>
                      <p className={`text-[11px] font-mono font-bold truncate mt-0.5 ${al.status === 'depleted' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {al.serial_number} · {al.capacity || 10}m³
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${
                        al.status === 'depleted'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : al.status === 'critical'
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {timeText}
                      </span>
                      <p className={`text-[9px] font-bold mt-0.5 ${
                        al.status === 'depleted' ? 'text-rose-300' : al.status === 'critical' ? 'text-red-700' : 'text-amber-800'
                      }`}>
                        {al.status === 'depleted' ? 'Sin oxígeno' : al.status === 'critical' ? 'Cambio urgente' : 'Cambiar pronto'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. KPI RIBBON: TARJETAS EJECUTIVAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* KPI 1: Consumo Gaseoso Total */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-60 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <MdOutlineAir className="text-xl" />
                </div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Consumo Gaseoso</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                  {kpisLoading ? '...' : totalGaseosoM3}
                </span>
                <span className="text-sm font-bold text-slate-400">m³</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {kpisLoading ? 'Calculando...' : `${totalGaseosoUnd} balones atendidos`}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>PADOMI: <b className="text-slate-800">{executiveData?.gaseoso?.consumo?.padomi?.['10'] ? `${executiveData.gaseoso.consumo.padomi['10']} (10m³)` : '0'}</b></span>
            <span>HNAGV: <b className="text-slate-800">{executiveData?.gaseoso?.consumo?.hnagv?.['10'] ? `${executiveData.gaseoso.consumo.hnagv['10']} (10m³)` : '0'}</b></span>
          </div>
        </div>

        {/* KPI 2: Oxígeno Líquido Criogénico */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-cyan-100 to-transparent rounded-bl-full opacity-60 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <MdOutlineLocalGasStation className="text-xl" />
                </div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Tanque Líquido</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                  {statsLoading ? '...' : tankLevel}
                </span>
                <span className="text-sm font-bold text-slate-400">inH2O</span>
              </div>
              <p className="text-xs font-semibold text-cyan-700 mt-1">
                Consumo: {liquidM3} m³
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Autonomía Proyectada:</span>
            <span className="text-cyan-700 font-black">{liquidAutonomiaDias} días</span>
          </div>
        </div>

        {/* KPI 3: Auditoría y Cuadre de Kardex */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
          <div className={`absolute top-0 right-0 w-28 h-28 rounded-bl-full opacity-60 transition-transform group-hover:scale-110 ${
            cuadreInfo.isOk ? 'bg-gradient-to-bl from-emerald-100 to-transparent' : 'bg-gradient-to-bl from-rose-100 to-transparent'
          }`}></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-xl ${cuadreInfo.isOk ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {cuadreInfo.isOk ? <MdCheckCircle className="text-xl" /> : <MdWarning className="text-xl" />}
                </div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Cuadre de Kardex</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${cuadreInfo.isOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpisLoading ? '...' : (cuadreInfo.isOk ? 'Cuadrado' : 'Descuadre')}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {cuadreInfo.isOk 
                  ? 'Matemática = Reserva física' 
                  : `Diferencia de ${cuadreInfo.diferencia} m³`}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Reserva Física: <b className="text-slate-800">{cuadreInfo.reserva || 0} m³</b></span>
            <span>Saldo: <b className="text-slate-800">{cuadreInfo.calculado || 0} m³</b></span>
          </div>
        </div>

        {/* KPI 4: Stock Físico en Central */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-60 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <MdOutlineInventory2 className="text-xl" />
                </div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Almacén Central</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                  {statsLoading ? '...' : (stats?.full_central_count ?? 0)}
                </span>
                <span className="text-sm font-bold text-emerald-600">Llenos</span>
              </div>
              <p className="text-xs font-semibold text-orange-600 mt-1">
                {statsLoading ? '...' : (stats?.empty_central_count ?? 0)} Vacíos para recarga
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Disponibilidad:</span>
            <span className="text-purple-700 font-black">
              {stats?.full_central_count ? 'Stock Activo' : 'Bajo Stock'}
            </span>
          </div>
        </div>

      </div>

      {/* ── 3. SEGMENTED TAB SWITCHER (Navegación Unificada) ── */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-[190px] sm:min-w-0 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`text-lg shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. CONTENIDO DINÁMICO DE LA PESTAÑA ACTIVA ── */}
      <div className="transition-all">
        
        {/* PESTAÑA 1: REPORTE GERENCIAL */}
        {activeTab === 'gerencial' && (
          <div className="animate-fadeIn">
            <ExecutiveConsumptionReport 
              externalDate={selectedDate} 
              isEmbedded={true} 
            />
          </div>
        )}

        {/* PESTAÑA 2: RESUMEN KARDEX */}
        {activeTab === 'resumen' && (
          <div className="animate-fadeIn">
            <KardexResume 
              externalDate={selectedDate} 
              isEmbedded={true} 
            />
          </div>
        )}

        {/* PESTAÑA 3: KARDEX GENERAL MATRICIAL */}
        {activeTab === 'kardex' && (
          <div className="animate-fadeIn">
            <DailyKardexReport 
              externalDate={selectedDate} 
              isEmbedded={true} 
            />
          </div>
        )}

        {/* PESTAÑA 4: STOCK FÍSICO Y MATRIZ CENTRAL */}
        {activeTab === 'stock' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Matriz de desglose en central */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <MdOutlineInventory2 className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Desglose Exacto en Almacén Central</h3>
                    <p className="text-xs font-semibold text-slate-400">Inventario físico por capacidad, proveedor y modelo registrado</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  {suppliersList.length} Proveedores Registrados
                </div>
              </div>

              <div className="space-y-8">
                {suppliersList.map(({ supName, items, owners }) => (
                  <div key={supName} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs sm:text-sm">PROPIEDAD DE: {supName}</h4>
                      <span className="text-[11px] font-bold text-slate-500 uppercase">{owners.length} Categorías</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 bg-white border-b-2 border-slate-200 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest text-left sticky left-0 z-10" rowSpan="2">
                              Modelo / Tipo
                            </th>
                            {capacities.map(cap => (
                              <th key={cap} className="px-4 py-2 bg-white border-b border-slate-200 border-l border-slate-200 text-xs sm:text-sm font-black text-slate-700 text-center" colSpan="2">
                                {cap} m³
                              </th>
                            ))}
                          </tr>
                          <tr>
                            {capacities.map(cap => (
                              <React.Fragment key={`sub-${cap}`}>
                                <th className="px-2 py-2 bg-emerald-50/70 border-b-2 border-emerald-200 border-l border-slate-200 text-[10px] font-bold text-emerald-700 uppercase tracking-wider text-center w-16 sm:w-20">Llenos</th>
                                <th className="px-2 py-2 bg-orange-50/70 border-b-2 border-orange-200 text-[10px] font-bold text-orange-700 uppercase tracking-wider text-center w-16 sm:w-20">Vacíos</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {owners.map(owner => (
                            <tr key={owner} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap">
                                {owner}
                              </td>
                              {capacities.map(cap => {
                                const full = getBreakdownCount(items, owner, cap, 'full');
                                const empty = getBreakdownCount(items, owner, cap, 'empty');
                                return (
                                  <React.Fragment key={`${owner}-${cap}`}>
                                    <td className={`px-2 py-3 text-center text-xs sm:text-sm font-black border-l border-slate-100 ${full > 0 ? 'text-emerald-600 bg-emerald-50/20' : 'text-slate-300'}`}>
                                      {statsLoading ? '-' : full}
                                    </td>
                                    <td className={`px-2 py-3 text-center text-xs sm:text-sm font-black ${empty > 0 ? 'text-orange-600 bg-orange-50/20' : 'text-slate-300'}`}>
                                      {statsLoading ? '-' : empty}
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          ))}
                          {/* Fila de Totales por Proveedor */}
                          <tr className="bg-slate-50 border-t-2 border-slate-200">
                            <td className="px-4 py-3 text-xs sm:text-sm font-black text-slate-800 text-right uppercase tracking-wider sticky left-0 bg-slate-50 z-10">
                              Total {supName}
                            </td>
                            {capacities.map(cap => {
                              const totalFull = owners.reduce((sum, owner) => sum + getBreakdownCount(items, owner, cap, 'full'), 0);
                              const totalEmpty = owners.reduce((sum, owner) => sum + getBreakdownCount(items, owner, cap, 'empty'), 0);
                              return (
                                <React.Fragment key={`total-${cap}`}>
                                  <td className="px-2 py-3 text-center text-xs sm:text-sm font-black text-emerald-700 border-l border-slate-200 bg-emerald-50/30">
                                    {statsLoading ? '-' : totalFull}
                                  </td>
                                  <td className="px-2 py-3 text-center text-xs sm:text-sm font-black text-orange-700 bg-orange-50/30">
                                    {statsLoading ? '-' : totalEmpty}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos Rápidos Operativos */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
              <h3 className="text-base sm:text-lg font-black text-slate-800 mb-4">Operaciones Rápidas de Almacén</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <button onClick={() => navigate('/inventory/exchange')} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-white hover:shadow-md transition-all group active:scale-95">
                  <div className="p-3 bg-white text-slate-600 rounded-2xl shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MdSwapHoriz className="text-2xl sm:text-3xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 text-center">Canje de Balones</span>
                </button>

                <button onClick={() => navigate('/inventory/decanting')} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3 hover:border-emerald-400 hover:bg-white hover:shadow-md transition-all group active:scale-95">
                  <div className="p-3 bg-white text-slate-600 rounded-2xl shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <MdScience className="text-2xl sm:text-3xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 text-center">Registrar Trasiego</span>
                </button>

                <button onClick={() => navigate('/liquid/daily')} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3 hover:border-purple-400 hover:bg-white hover:shadow-md transition-all group active:scale-95">
                  <div className="p-3 bg-white text-slate-600 rounded-2xl shadow-xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <MdTrendingUp className="text-2xl sm:text-3xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 text-center">Lectura de Tanque</span>
                </button>

                <button onClick={() => navigate('/patients')} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3 hover:border-orange-400 hover:bg-white hover:shadow-md transition-all group active:scale-95">
                  <div className="p-3 bg-white text-slate-600 rounded-2xl shadow-xs group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <MdPeople className="text-2xl sm:text-3xl" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 text-center">Gestión Pacientes</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default Dashboard;