import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, ChevronRight, Bell, ChevronDown, ChevronUp, Filter, X, CalendarDays, Search, Wrench, ClipboardList, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const getEndingStyle = (hours) => {
  if (hours <= 12) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-500 text-white', label: 'Urgent' };
  if (hours <= 24) return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500 text-white', label: '24h' };
  return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-500 text-white', label: '48h' };
};

const Dashboard = ({ user }) => {
  const [demandes, setDemandes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, enAttente: 0, valide: 0, enCours: 0, cloture: 0 });
  const [showNotifs, setShowNotifs] = useState(true);
  const navigate = useNavigate();



  const fetchDemandes = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        matricule: user.matricule,
        role: user.role,
        structure: user.structure,
      });
  
      const { data } = await axios.get(`http://localhost:5000/api/demandes?${params.toString()}`);
      setDemandes(data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/notifications?matricule=${user.matricule}&role=${user.role}&structure=${user.structure}`);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/maintenance/requests`);
      setMaintenanceRequests(data.slice(0, 5)); // Get last 5
    } catch (err) {
      console.error(err);
    }
  };

  const calculateStats = useCallback(() => {
    const total = demandes.length;
    const enAttente = demandes.filter(d => d.status === 'En Attente').length;
    const valide = demandes.filter(d => d.status === 'Validé').length;
    const enCours = demandes.filter(d => d.status === 'En Cours').length;
    const cloture = demandes.filter(d => d.status === 'Clôturé').length;
    setStats({ total, enAttente, valide, enCours, cloture });
  }, [demandes]);

  useEffect(() => {
    fetchDemandes();
    fetchNotifications();
    fetchMaintenance();
  }, [fetchDemandes]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);



  const getUrgencyStyle = (days) => {
    if (days === 0) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-500 text-white', label: "Aujourd'hui" };
    if (days === 1) return { bg: 'bg-red-50 border-red-200', text: 'text-red-600', badge: 'bg-red-400 text-white', label: 'Demain' };
    return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-400 text-white', label: `Dans ${days}j` };
  };

  const getEndingStyle = (hours) => {
    if (hours <= 12) return { bg: 'bg-red-50 border-red-300', text: 'text-red-700', badge: 'bg-red-600 text-white', label: `${hours}h restantes` };
    if (hours <= 24) return { bg: 'bg-orange-50 border-orange-300', text: 'text-orange-700', badge: 'bg-orange-500 text-white', label: `${hours}h restantes` };
    return { bg: 'bg-blue-50 border-blue-300', text: 'text-blue-700', badge: 'bg-blue-500 text-white', label: `${hours}h restantes` };
  };

  // Separate notifications by type
  const upcomingNotifs = notifications.filter(n => n.type === 'upcoming');
  const endingNotifs = notifications.filter(n => n.type === 'ending');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-500 text-sm mt-1">Vos demandes de moyens et engins</p>
        </div>
        {!(['MVE', 'CPA'].includes(user.structure)) && ((user.role === 'agent' && user.structure !== 'DSL') || ['secretaire', 'chef service'].includes(user.role)) && (
          <button 
            onClick={() => navigate('/demande/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Nouvelle Demande
          </button>
        )}
      </div>

      {/* ─── NOTIFICATION BANNER ─── */}
      {/*  || user.structure === 'CPA' */}
      {(user.structure === 'DSL') && notifications.length > 0 && (
        <div className="mb-6 space-y-3">
          {/* Ending Soon Notifications (48h) */}
          {endingNotifs.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-red-100/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="w-5 h-5 text-red-600" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
                  </div>
                  <span className="font-semibold text-red-900 text-sm">
                    {endingNotifs.length} prestation{endingNotifs.length > 1 ? 's' : ''} se termine dans moins de 48h
                  </span>
                </div>
                {showNotifs ? <ChevronUp className="w-4 h-4 text-red-600" /> : <ChevronDown className="w-4 h-4 text-red-600" />}
              </button>

              {showNotifs && (
                <div className="px-5 pb-4 space-y-2">
                  {endingNotifs.map(n => {
                    const style = getEndingStyle(n.hours_remaining);
                    return (
                      <div
                        key={`ending-${n.num_demande}`}
                        onClick={() => navigate(`/demande/${encodeURIComponent(n.num_demande)}`)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${style.bg}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                            {style.label}
                          </span>
                          <div>
                            <p className={`font-semibold text-sm ${style.text}`}>{n.num_demande}</p>
                            <p className="text-xs text-slate-500">
                              Fin: {n.date_fin} · Client: {n.client || '-'} · {n.demandeur}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${style.text}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Notifications (3 days) */}
          {upcomingNotifs.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-amber-100/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="w-5 h-5 text-amber-600" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  </div>
                  <span className="font-semibold text-amber-900 text-sm">
                    {upcomingNotifs.length} prestation{upcomingNotifs.length > 1 ? 's' : ''} à venir dans les 3 prochains jours
                  </span>
                </div>
                {showNotifs ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
              </button>

              {showNotifs && (
                <div className="px-5 pb-4 space-y-2">
                  {upcomingNotifs.map(n => {
                    const style = getUrgencyStyle(n.days_remaining);
                    return (
                      <div
                        key={`upcoming-${n.num_demande}`}
                        onClick={() => navigate(`/demande/${encodeURIComponent(n.num_demande)}`)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${style.bg}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                            {style.label}
                          </span>
                          <div>
                            <p className={`font-semibold text-sm ${style.text}`}>{n.num_demande}</p>
                            <p className="text-xs text-slate-500">
                              Début: {n.date_debut} · Client: {n.client || '-'} · {n.demandeur}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${style.text}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── QUICK ACTIONS CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* MVE: Only Maintenance */}
        {user.structure === 'MVE' && (
          <>
            {/* Maintenance */}
            <button
              onClick={() => navigate('/maintenance')}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <div className="p-3 bg-white/20 rounded-lg">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Maintenance</p>
                <p className="text-emerald-100 text-sm">{maintenanceRequests.length} demandes</p>
              </div>
            </button>
          </>
        )}

        {/* DSL: Demandes, Maintenance, Nouvelle Demande, All Stats */}
        {user.structure === 'DSL' && (
          <>
            {/* Nouvelle Demande */}
            <button
              onClick={() => navigate('/demande/new')}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <div className="p-3 bg-white/20 rounded-lg">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Nouvelle Demande</p>
                <p className="text-blue-100 text-sm">Créer une demande</p>
              </div>
            </button>

            {/* Maintenance */}
            <button
              onClick={() => navigate('/maintenance')}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <div className="p-3 bg-white/20 rounded-lg">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Maintenance</p>
                <p className="text-emerald-100 text-sm">{maintenanceRequests.length} demandes</p>
              </div>
            </button>

            {/* Voir Demandes */}
            <button
              onClick={() => navigate('/demandes')}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <div className="p-3 bg-white/20 rounded-lg">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Demandes</p>
                <p className="text-indigo-100 text-sm">{stats.total} total</p>
              </div>
            </button>

            {/* Statistiques Complètes - Clickable */}
            <button
              onClick={() => navigate('/statistics')}
              className="p-5 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="font-bold">Statistiques</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xs text-slate-400">Demandes</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xs text-slate-400">Maintenance</p>
                  <p className="text-xl font-bold">{maintenanceRequests.length}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Cliquez pour voir les détails</p>
            </button>
          </>
        )}

        {/* CPA: Demandes only */}
        {user.structure === 'CPA' && (
          <>
            {/* Voir Demandes */}
            <button
              onClick={() => navigate('/demandes')}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <div className="p-3 bg-white/20 rounded-lg">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Demandes</p>
                <p className="text-indigo-100 text-sm">{stats.total} total</p>
              </div>
            </button>
          </>
        )}

        {/* Others: Demandes and Nouvelle Demande only */}
        {user.structure !== 'MVE' && user.structure !== 'DSL' && user.structure !== 'CPA' && (
          <>
            {/* Nouvelle Demande */}
            <button
              onClick={() => navigate('/demande/new')}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <div className="p-3 bg-white/20 rounded-lg">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Nouvelle Demande</p>
                <p className="text-blue-100 text-sm">Créer une demande</p>
              </div>
            </button>

            {/* Voir Demandes */}
            <button
              onClick={() => navigate('/demandes')}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <div className="p-3 bg-white/20 rounded-lg">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Demandes</p>
                <p className="text-indigo-100 text-sm">{stats.total} total</p>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Quick Link to All Demandes */}
      {/* <div className="text-center">
        <button
          onClick={() => navigate('/demandes')}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
        >
          Voir toutes les demandes <ChevronRight className="w-4 h-4" />
        </button>
      </div> */}
    </div>
  );
};

export default Dashboard;
