import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Services from './pages/Services';
import Cylinders from './pages/Cylinders';
import Beds from './pages/Beds';
import Exchange from './pages/Exchange';
import Decanting from './pages/Decanting';
import DailyReading from './pages/DailyReading';
import LiquidRefill from './pages/LiquidRefill';
import Kardex from './pages/Kardex';
import Users from './pages/Users';
import Suppliers from './pages/Suppliers';
import SupplierMovement from './pages/SupplierMovement';
import PeripheryExchange from './pages/PeripheryExchange';
import Reports from './pages/Reports';
import OwnershipTypes from './pages/OwnershipTypes';
import TicketControl from './pages/Reports/TicketControl';
import SupplierReport from './pages/Reports/SupplierReport';
import PeripheryReport from './pages/Reports/PeripheryReport';
import CylinderTracking from './pages/CylinderTracking';
import MovementsReport from './pages/MovementsReport';
import DailyKardexReport from './pages/DailyKardexReport';
import ConsumptionDashboard from './pages/Reports/ConsumptionDashboard';
import PatientAlertsReport from './pages/Reports/PatientAlertsReport';
import KardexResume from './pages/KardexResume';
import HospitalizationControl from './pages/Reports/HospitalizationControl';
import TrasiegosReport from './pages/TrasiegosReport';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* RUTA PUBLICA */}
          <Route path="/login" element={<Login />} />

          {/* RUTA PROTEGIDA CON SIDEBAR */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/services" element={<Services />} />
            <Route path="/cylinders" element={<Cylinders />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/ownership-types" element={<OwnershipTypes />} />
            <Route path="/beds" element={<Beds />} />

            <Route path="/inventory/exchange" element={<Exchange />} />
            <Route path="/inventory/decanting" element={<Decanting />} />
            <Route path="/inventory/supplier" element={<SupplierMovement />} />
            <Route path="/inventory/periphery" element={<PeripheryExchange />} />

            <Route path="/liquid/daily" element={<DailyReading />} />
            <Route path="/liquid/refill" element={<LiquidRefill />} />

            <Route path="/reports/ticketcontrol" element={<TicketControl />} />
            <Route path="/reports/supplier" element={<SupplierReport />} />
            <Route path="/reports/periphery" element={<PeripheryReport />} />
            <Route path="/reports/consumption" element={<ConsumptionDashboard />} />
            <Route path="/reports/alerts" element={<PatientAlertsReport />} />
            <Route path="/reports/kardexresume" element={<KardexResume />} />
            <Route path="/reports/kardex" element={<DailyKardexReport />} />
            <Route path="/reports/hospitalization-control" element={<HospitalizationControl />} />
            <Route path="/reports/cylinder-tracking" element={<CylinderTracking />} />
            <Route path="/reports/movements-report" element={<MovementsReport />} />
            <Route path="/reports/trasiegos" element={<TrasiegosReport />} />

            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/users" element={<Users />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;