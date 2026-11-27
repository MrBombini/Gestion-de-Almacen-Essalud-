import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// CARGA INMEDIATA (Eager) — Solo los que se necesitan en el primer render
// ─────────────────────────────────────────────────────────────────────────────
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';

// ─────────────────────────────────────────────────────────────────────────────
// CARGA DIFERIDA (Lazy) — Cada página genera su propio chunk JS
// Vite los empaqueta por separado y solo los descarga cuando el usuario navega
// ─────────────────────────────────────────────────────────────────────────────

// Catálogos
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const Patients           = lazy(() => import('./pages/Patients'));
const Services           = lazy(() => import('./pages/Services'));
const Cylinders          = lazy(() => import('./pages/Cylinders'));           // 54 KB
const Beds               = lazy(() => import('./pages/Beds'));
const Suppliers          = lazy(() => import('./pages/Suppliers'));
const OwnershipTypes     = lazy(() => import('./pages/OwnershipTypes'));
const Authorities        = lazy(() => import('./pages/Authorities'));

// Inventario
const Exchange           = lazy(() => import('./pages/Exchange'));            // 45 KB
const Decanting          = lazy(() => import('./pages/Decanting'));
const LoanReturn         = lazy(() => import('./pages/LoanReturn'));
const ReturnControl      = lazy(() => import('./pages/ReturnControl'));
const SupplierMovement   = lazy(() => import('./pages/SupplierMovement'));
const PeripheryExchange  = lazy(() => import('./pages/PeripheryExchange'));
const WarehouseTransfer  = lazy(() => import('./pages/WarehouseTransfer'));

// Oxígeno Líquido
const DailyReading       = lazy(() => import('./pages/DailyReading'));
const LiquidRefill       = lazy(() => import('./pages/LiquidRefill'));

// Reportes
const TicketControl          = lazy(() => import('./pages/Reports/TicketControl'));
const ControlFormat          = lazy(() => import('./pages/Reports/ControlFormat'));
const SupplierReport         = lazy(() => import('./pages/Reports/SupplierReport'));
const PeripheryReport        = lazy(() => import('./pages/Reports/PeripheryReport'));
const ConsumptionDashboard   = lazy(() => import('./pages/Reports/ConsumptionDashboard'));
const PatientAlertsReport    = lazy(() => import('./pages/Reports/PatientAlertsReport'));
const KardexResume           = lazy(() => import('./pages/KardexResume'));
const DailyKardexReport      = lazy(() => import('./pages/DailyKardexReport'));
const HospitalizationControl = lazy(() => import('./pages/Reports/HospitalizationControl')); // 49 KB
const CylinderTracking       = lazy(() => import('./pages/CylinderTracking'));
const UnifiedMovements       = lazy(() => import('./pages/Reports/UnifiedMovements'));
const ExecutiveConsumptionReport = lazy(() => import('./pages/ExecutiveConsumptionReport'));
const PadomiExchanges        = lazy(() => import('./pages/PadomiExchanges'));
const Kardex                 = lazy(() => import('./pages/Kardex'));
const MonthlyResumenReport   = lazy(() => import('./pages/Reports/MonthlyResumenReport'));
const MonthlyEntriesReport   = lazy(() => import('./pages/Reports/MonthlyEntriesReport'));

// Administración
const Reports = lazy(() => import('./pages/Reports'));
const Users   = lazy(() => import('./pages/Users'));

// ─────────────────────────────────────────────────────────────────────────────
// Spinner de carga — Se muestra mientras el chunk de la ruta se descarga
// ─────────────────────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">
        Cargando módulo...
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Suspense envuelve todas las rutas. El PageLoader aparece mientras
            cualquier chunk lazy está en tránsito. */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* RUTA PÚBLICA */}
            <Route path="/login" element={<Login />} />

            {/* RUTAS PROTEGIDAS CON SIDEBAR */}
            <Route element={<MainLayout />}>

              {/* Principal */}
              <Route path="/"                           element={<Dashboard />} />

              {/* Catálogos */}
              <Route path="/patients"                   element={<Patients />} />
              <Route path="/services"                   element={<Services />} />
              <Route path="/cylinders"                  element={<Cylinders />} />
              <Route path="/suppliers"                  element={<Suppliers />} />
              <Route path="/ownership-types"            element={<OwnershipTypes />} />
              <Route path="/authorities"                element={<Authorities />} />
              <Route path="/beds"                       element={<Beds />} />

              {/* Inventario */}
              <Route path="/inventory/exchange"         element={<Exchange />} />
              <Route path="/inventory/decanting"        element={<Decanting />} />
              <Route path="/inventory/loan-return"      element={<LoanReturn />} />
              <Route path="/inventory/return-control"   element={<ReturnControl />} />
              <Route path="/inventory/supplier"         element={<SupplierMovement />} />
              <Route path="/inventory/periphery"        element={<PeripheryExchange />} />
              <Route path="/inventory/warehouse-transfer" element={<WarehouseTransfer />} />

              {/* Oxígeno Líquido */}
              <Route path="/liquid/daily"               element={<DailyReading />} />
              <Route path="/liquid/refill"              element={<LiquidRefill />} />

              {/* Reportes */}
              <Route path="/reports/ticketcontrol"           element={<TicketControl />} />
              <Route path="/reports/control-format"          element={<ControlFormat />} />
              <Route path="/reports/supplier"                element={<SupplierReport />} />
              <Route path="/reports/periphery"               element={<PeripheryReport />} />
              <Route path="/reports/consumption"             element={<ConsumptionDashboard />} />
              <Route path="/reports/alerts"                  element={<PatientAlertsReport />} />
              <Route path="/reports/kardexresume"            element={<Dashboard defaultTab="resumen" />} />
              <Route path="/reports/kardex"                  element={<Dashboard defaultTab="kardex" />} />
              <Route path="/reports/hospitalization-control" element={<HospitalizationControl />} />
              <Route path="/reports/cylinder-tracking"       element={<CylinderTracking />} />
              <Route path="/reports/unified-search"          element={<UnifiedMovements />} />
              <Route path="/reports/executive"               element={<Dashboard defaultTab="gerencial" />} />
              <Route path="/reports/padomi-exchanges"        element={<PadomiExchanges />} />
              <Route path="/reports/monthly-resumen"          element={<MonthlyResumenReport />} />
              <Route path="/reports/monthly-entries"          element={<MonthlyEntriesReport />} />

              {/* Administración */}
              <Route path="/admin/reports"              element={<Reports />} />
              <Route path="/admin/users"                element={<Users />} />

              {/* Fallback — cualquier ruta desconocida va al Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;