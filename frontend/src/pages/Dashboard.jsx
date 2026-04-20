import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, ChevronRight, Bell, ChevronDown, ChevronUp, Filter, X, CalendarDays, Search } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'En Attente', label: 'En Attente' },
  { value: 'Validé', label: 'Validé' },
  { value: 'Rejeté', label: 'Rejeté' },
  { value: 'Sous Traitance', label: 'Sous Traitance' },
  { value: 'Approuvé', label: 'Approuvé' },
  { value: 'En Cours', label: 'En Cours' },
  { value: 'Clôturé', label: 'Clôturé' },
  { value: 'Annulé', label: 'Annulé' },
];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Validé': return 'bg-green-100 text-green-700';
    case 'Clôturé': return 'bg-slate-200 text-slate-600';
    case 'Approuvé': return 'bg-indigo-100 text-indigo-700';
    case 'En Cours': return 'bg-blue-100 text-blue-700';
    case 'Rejeté': return 'bg-red-100 text-red-700';
    case 'Annulé': return 'bg-red-50 text-red-500';
    case 'Sous Traitance': return 'bg-purple-100 text-purple-700';
    default: return 'bg-orange-100 text-orange-700';
  }
};

const Dashboard = ({ user }) => {
  const [demandes, setDemandes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    client: '',
  });

  const hasActiveFilters = filters.status || filters.date_from || filters.date_to || filters.client;

  const fetchDemandes = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        matricule: user.matricule,
        role: user.role,
        structure: user.structure,
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.structureSearch) params.append('structure_search', filters.structureSearch);
      
      const { data } = await axios.get(`http://localhost:5000/api/demandes?${params.toString()}`);
      setDemandes(data);
    } catch (err) {
      console.error(err);
    }
  }, [user, filters]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/notifications?matricule=${user.matricule}&role=${user.role}&structure=${user.structure}`);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const clearFilters = () => {
    setFilters({ status: '', date_from: '', date_to: '', structureSearch: '' });
  };

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
        {((user.role === 'agent' && user.structure !== 'DSL') || ['secretaire', 'chef service'].includes(user.role)) && (
          <button 
            onClick={() => navigate('/demande/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Nouvelle Demande
          </button>
        )}
      </div>

      {/* ─── NOTIFICATION BANNER ─── */}
      {(user.structure === 'DSL' || user.structure === 'CPA') && notifications.length > 0 && (
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

      {/* ─── FILTER BAR ─── */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition ${
            hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
          {hasActiveFilters && (
            <span className="ml-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-blue-600 text-white rounded-full">
              {[filters.status, filters.date_from, filters.date_to, filters.structureSearch].filter(Boolean).length}
            </span>
          )}
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFilters && (
          <div className="mt-3 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date du</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date au</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              {/* Structure */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Structure Demandeur</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher par structure..."
                    value={filters.structureSearch}
                    onChange={(e) => setFilters(f => ({ ...f, structureSearch: e.target.value }))}
                    className="w-full px-3 py-2.5 pl-9 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  {demandes.length} résultat{demandes.length !== 1 ? 's' : ''} trouvé{demandes.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition"
                >
                  <X className="w-3.5 h-3.5" /> Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── DEMANDE LIST ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {demandes.length === 0 ? (
            <li className="p-8 text-center text-slate-500 flex flex-col items-center">
               <FileText className="w-12 h-12 text-slate-300 mb-3" />
               {hasActiveFilters ? 'Aucune demande ne correspond aux filtres' : 'Aucune demande trouvée'}
            </li>
          ) : (
             demandes.map(d => (
               <li 
                 key={d.num_demande} 
                 onClick={() => navigate(`/demande/${encodeURIComponent(d.num_demande)}`)}
                 className="p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between group cursor-pointer"
               >
                 <div>
                   <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-3">
                     {d.num_demande}
                     <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(d.status)}`}>
                       {d.status}
                     </span>
                   </h3>
                   <div className="text-sm text-slate-500 mt-2 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-1">
                     <p><b>Client:</b> {d.client || '-'}</p>
                     <p><b>Date:</b> {d.date_demande}</p>
                     <p><b>Structure:</b> {d.structure_initial || '-'}</p>
                     <p><b>Demandeur:</b> {d.demandeur}</p>
                   </div>
                 </div>
                 <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-6 h-6" />
                 </div>
               </li>
             ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
