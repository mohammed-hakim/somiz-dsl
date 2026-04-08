import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DemandeForm from './pages/DemandeForm';
import DemandeView from './pages/DemandeView';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        {/* Simple navbar if user exists */}
        {user && (
          <header className="bg-white shadow-sm border-b border-slate-200 print:hidden">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-600 tracking-tight">SOMIZ Logistics</h1>
              <div className="flex items-center gap-4">
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
        )}
        <main>
          <Routes>
             <Route path="/login" element={<Login setUser={setUser} />} />
             <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
             <Route path="/demande/new" element={user ? <DemandeForm user={user} /> : <Navigate to="/login" />} />
             <Route path="/demande/:num_demande" element={user ? <DemandeView user={user} /> : <Navigate to="/login" />} />
             <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
