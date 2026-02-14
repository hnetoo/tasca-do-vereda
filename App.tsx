
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import SmartAlertsPanel from './components/SmartAlertsPanel';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Reservations from './pages/Reservations';
import Products from './pages/Inventory';
import Categories from './pages/Inventory';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import TableLayout from './pages/TableLayout';
import PublicMenu from './pages/PublicMenu';
import Employees from './pages/Employees';
import Schedules from './pages/Schedules';
import SystemManual from './pages/SystemManual';
import CustomerDisplay from './pages/CustomerDisplay';
import QRScanner from './pages/QRScanner';
import MobileDashboard from './pages/MobileDashboard';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import EncomendasPage from './pages/Encomendas';
import SystemHealth from './pages/SystemHealth';
import { disasterRecoveryService, setStoreGetter } from './services/disasterRecoveryService';
import { healthMonitorService } from './services/healthMonitorService';
import DLPRecovery from './pages/DLPRecovery';

const GlobalNotificationCenter = () => {
  const { notifications, removeNotification } = useStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`
            pointer-events-auto
            min-w-[300px] max-w-sm w-full
            p-4 rounded-xl shadow-2xl 
            flex items-start gap-3 
            animate-in slide-in-from-right duration-300 fade-in
            border backdrop-blur-md
            ${notification.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-200' : ''}
            ${notification.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : ''}
            ${notification.type === 'warning' ? 'bg-orange-500/20 border-orange-500/50 text-orange-200' : ''}
            ${notification.type === 'info' ? 'bg-primary/20 border-primary/50 text-primary' : ''}
          `}
        >
          <div className="mt-0.5 shrink-0">
            {notification.type === 'success' && <CheckCircle size={18} />}
            {notification.type === 'error' && <AlertCircle size={18} />}
            {notification.type === 'warning' && <AlertTriangle size={18} />}
            {notification.type === 'info' && <Info size={18} />}
          </div>
          <p className="text-sm font-bold flex-1 tracking-tight">{notification.message}</p>
          <button onClick={() => removeNotification(notification.id)} className="opacity-50 hover:opacity-100 shrink-0">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const { currentUser, settings, setOnlineStatus, initializeStore } = useStore();

  React.useEffect(() => {
    // Set store getter for DLP system (Swiss-watch precision)
    setStoreGetter(() => useStore.getState());

    const init = async () => {
      try {
        await initializeStore();
        disasterRecoveryService.initialize();
        // Force health monitor to be referenced so it initializes
        console.log('Swiss Watch Precision active:', !!healthMonitorService);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    init();

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="flex h-screen w-full bg-background font-sans">
          <GlobalNotificationCenter />
          <SmartAlertsPanel />
          
          <Routes>
            {/* Legacy Menu Redirect (Support for existing QR codes on tables) */}
            <Route path="/menu/public/*" element={<PublicMenu />} />
            
            <Route path="/menu-digital/*" element={<PublicMenu />} />
            <Route path="/menu/:tableId" element={<PublicMenu />} />
            <Route path="/customer-display/:tableId" element={<CustomerDisplay />} />
            <Route path="/qr-scanner" element={<QRScanner />} />
            <Route path="/owner" element={<MobileDashboard />} />

            <Route path="/*" element={
              !currentUser ? (
                <Routes>
                  <Route path="*" element={<Login />} />
                </Routes>
              ) : (
                <div className="flex h-screen w-full overflow-hidden">
                  {/* Hide sidebar if on owner dashboard to allow full view */}
                  {window.location.pathname !== '/owner' && <Sidebar />}
                  <main className="flex-1 h-full overflow-hidden relative">
                    <Routes>
                      <Route path="/manual" element={<SystemManual />} />
                      {currentUser.role === 'ADMIN' && (
                        <>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/finance" element={<Finance />} />
                          <Route path="/employees" element={<Employees />} />
                          <Route path="/schedules" element={<Schedules />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/recovery" element={<DLPRecovery />} />
                          <Route path="/system-health" element={<SystemHealth />} />
                        </>
                      )}

                      {['ADMIN', 'CAIXA', 'GARCOM'].includes(currentUser.role) && (
                        <>
                          <Route path="/pos" element={<POS />} />
                          <Route path="/tables-layout" element={<TableLayout />} />
                        </>
                      )}
                      
                      {['ADMIN', 'CAIXA'].includes(currentUser.role) && (
                        <>
                          <Route path="/reservations" element={<Reservations />} />
                          <Route path="/customers" element={<Customers />} />
                        </>
                      )}

                      {['ADMIN', 'COZINHA'].includes(currentUser.role) && (
                        <Route path="/kitchen" element={
                          settings.kdsEnabled ? <Kitchen /> : <Navigate to="/" />
                        } />
                      )}

                      <Route path="/encomendas" element={<EncomendasPage />} />

                      <Route path="*" element={
                        currentUser.role === 'COZINHA' ? (settings.kdsEnabled ? <Navigate to="/kitchen" /> : <Navigate to="/" />) :
                        currentUser.role === 'GARCOM' ? <Navigate to="/pos" /> :
                        <Navigate to="/" />
                      } />
                    </Routes>
                  </main>
                </div>
              )
            } />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
