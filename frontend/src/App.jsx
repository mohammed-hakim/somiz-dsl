import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Wrench, Truck } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DemandeForm from './pages/DemandeForm';
import DemandeView from './pages/DemandeView';
import DemandesList from './pages/DemandesList';
import Statistics from './pages/Statistics';
import MaintenanceDSL from './pages/MaintenanceDSL';
import MaintenanceMVE from './pages/MaintenanceMVE';
import EquipementsList from './pages/EquipementsList';
const apiUrl = import.meta.env.VITE_API_URL;

axios.interceptors.request.use((config) => {
  const saved = localStorage.getItem('user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${parsed.token}`;
        
        // Add logging headers for audit trail
        if (parsed.clientWinAccount) {
          config.headers['X-Client-Win-Account'] = parsed.clientWinAccount;
        }
        if (parsed.clientMachine) {
          config.headers['X-Client-Machine'] = parsed.clientMachine;
        }
      }
    } catch (e) {
      console.error("Interceptor parse error", e);
    }
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Exclude the login route itself so the Login component can show the error instead of infinite reloading
    if (error.response && error.response.status === 401) {
      if (error.config && !error.config.url.includes('/api/login')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const Navbar = ({ user, setUser }) => {
  const [notifCount, setNotifCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const [notifRes, ...rest] = await Promise.all([
          axios.get(`${apiUrl}/api/notifications`),
          ...(user.structure === 'DSL' ? [axios.get(`${apiUrl}/api/maintenance/alerts`)] : [])
        ]);
        let count = notifRes.data.length;
        if (rest.length > 0 && rest[0]?.data?.summary) {
          count += rest[0].data.summary.overdue + rest[0].data.summary.critical;
        }
        setNotifCount(count);
      } catch { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <h1
          onClick={() => navigate('/')}
          className="text-xl font-bold text-blue-600 tracking-tight cursor-pointer hover:text-blue-700 transition"
        >
          SOMIZ Logistics
        </h1>
        <div className="flex items-center gap-4">
          {/* Equipments Catalog Link */}
          {user.structure === 'DSL' && (
            <button
              onClick={() => navigate('/equipements')}
              className="p-2 rounded-lg hover:bg-slate-100 transition group"
              title="Catalogue des Outils"
            >
              <Truck className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition" />
            </button>
          )}

          {/* Maintenance Link */}
          {(user.structure === 'DSL' || user.structure === 'MVE') && (
            <button
              onClick={() => navigate('/maintenance')}
              className="p-2 rounded-lg hover:bg-slate-100 transition group"
              title="Maintenance des équipements"
            >
              <Wrench className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition" />
            </button>
          )}

          {/* Notification Bell */}
          {user.structure === 'DSL' && (
            <button
              onClick={() => navigate('/')}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition group"
              title="Notifications - Prestations à venir"
            >
              <Bell className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center text-[11px] font-bold text-white bg-red-500 rounded-full px-1 animate-pulse shadow-lg shadow-red-500/40">
                  {notifCount}
                </span>
              )}
            </button>
          )}

          <span className="text-sm font-medium text-slate-600">
            {user.nom} {user.prenom} ({user.role})
          </span>
          <button
            onClick={() => { localStorage.removeItem('user'); setUser(null); window.location.href = '/login'; }}
            className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
};

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        {user && <Navbar user={user} setUser={setUser} />}
        <main>
          <Routes>
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/demande/new" element={user ? <DemandeForm user={user} /> : <Navigate to="/login" />} />
            <Route path="/demande/:num_demande" element={user ? <DemandeView user={user} /> : <Navigate to="/login" />} />
            <Route path="/demandes" element={user ? <DemandesList user={user} /> : <Navigate to="/login" />} />
            <Route path="/statistics" element={user && user.structure === 'DSL' ? <Statistics user={user} /> : <Navigate to="/" />} />
            <Route path="/equipements" element={user && user.structure === 'DSL' ? <EquipementsList user={user} /> : <Navigate to="/" />} />
            <Route path="/maintenance" element={user ? (user.structure === 'MVE' ? <MaintenanceMVE user={user} /> : <MaintenanceDSL user={user} />) : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
