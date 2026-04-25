import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus, ChevronRight, Bell, ChevronDown, ChevronUp,
  Wrench, ClipboardList, TrendingUp, Clock, CheckCircle,
  XSquare, FileText, ArrowRight, LayoutDashboard, Truck, Flag
} from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

const Dashboard = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, enAttente: 0, valide: 0, enCours: 0, cloture: 0, rejete: 0 });
  const [recentDemandes, setRecentDemandes] = useState([]);
  const [maintenanceTotal, setMaintenanceTotal] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await axios.get(`${apiUrl}/api/demandes/stats`);
      const s = statsRes.data.by_status || {};
      setStats({
        total: statsRes.data.total || 0,
        enAttente: s['En Attente'] || 0,
        valide: s['Validé'] || 0,
        enCours: s['En Cours'] || 0,
        cloture: s['Clôturé'] || 0,
        rejete: (s['Rejeté'] || 0) + (s['Annulé'] || 0)
      });

      // 2. Fetch Notifications
      const notifRes = await axios.get(`${apiUrl}/api/notifications`);
      setNotifications(notifRes.data);

      // 3. Fetch Maintenance (if applicable)
      if (['DSL', 'MVE'].includes(user.structure)) {
        const maintRes = await axios.get(`${apiUrl}/api/maintenance/stats`);
        setMaintenanceTotal(maintRes.data.total || 0);
      }

      // 4. Fetch Recent Demandes (max 5)
      const recentsRes = await axios.get(`${apiUrl}/api/demandes?page=1&per_page=5`);
      setRecentDemandes(recentsRes.data.data || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'En Attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Validé': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Approuvé': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Sous Traitance': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'En Cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Clôturé': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Rejeté': case 'Annulé': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const upcomingNotifs = notifications.filter(n => n.type === 'upcoming');
  const endingNotifs = notifications.filter(n => n.type === 'ending');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500 slide-in-from-bottom-4">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
            Tableau de Bord
          </h2>
          <p className="text-slate-500 text-sm mt-1 ml-11">Bienvenue, voici un résumé de votre espace logistique.</p>
        </div>

        {/* Quick Actions Header */}
        <div className="flex flex-wrap items-center gap-3">
          {!(['MVE', 'CPA'].includes(user.structure)) && ((user.role === 'agent' && user.structure !== 'DSL') || ['secretaire', 'chef service'].includes(user.role)) && (
            <button
              onClick={() => navigate('/demande/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 transition hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" /> Nouvelle Demande
            </button>
          )}
          {!['MVE'].includes(user.structure) && (

            <button
              onClick={() => navigate('/demandes')}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2 transition hover:-translate-y-0.5"
            >
              <ClipboardList className="w-5 h-5" /> Toutes les demandes
            </button>
          )}
        </div>
      </div>

      {/* ─── NOTIFICATION BANNER (DSL ONLY) ─── */}
      {(user.structure === 'DSL') && notifications.length > 0 && (
        <div className="mb-8 space-y-3">
          {/* Ending Soon Notifications (48h) */}
          {endingNotifs.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm overflow-hidden transition-all">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-red-100/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="w-5 h-5 text-red-600" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
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
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm overflow-hidden transition-all">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-amber-100/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="w-5 h-5 text-amber-600" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
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

      {/* ─── METRICS ROW ─── */}
      {user.structure !== 'MVE' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Requests Metric */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <FileText className="w-24 h-24" />
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl relative z-10">
              <FileText className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-sm text-slate-500 font-medium">Total</p>
              <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            </div>
          </div>

          {/* En Attente Metric */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <Clock className="w-24 h-24" />
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl relative z-10">
              <Clock className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-sm text-slate-500 font-medium">En Attente</p>
              <p className="text-2xl font-black text-slate-800">{stats.enAttente}</p>
            </div>
          </div>

          {/* En Cours Metric */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <Truck className="w-24 h-24" />
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl relative z-10">
              <Truck className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-sm text-slate-500 font-medium">En Cours</p>
              <p className="text-2xl font-black text-slate-800">{stats.enCours}</p>
            </div>
          </div>

          {/* Validated Metric */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-24 h-24" />
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl relative z-10">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-sm text-slate-500 font-medium">Validé</p>
              <p className="text-2xl font-black text-slate-800">{stats.valide}</p>
            </div>
          </div>

          {/* Finished Metric */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <Flag className="w-24 h-24" />
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl relative z-10">
              <Flag className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-sm text-slate-500 font-medium">Terminé</p>
              <p className="text-2xl font-black text-slate-800">{stats.cloture}</p>
            </div>
          </div>

          {/* Rejected/Cancelled Metric */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group lg:col-span-1 md:col-span-4 col-span-2">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <XSquare className="w-24 h-24" />
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl relative z-10">
              <XSquare className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <p className="text-sm text-slate-500 font-medium">Rejeté / Annulé</p>
              <p className="text-2xl font-black text-slate-800">{stats.rejete}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div className={`grid grid-cols-1 ${user.structure !== 'MVE' ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-2xl mx-auto'} gap-8`}>

        {/* RECENT ACTIVITY FEED */}
        {user.structure !== 'MVE' && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg">Activités Récentes</h3>
                <button
                  onClick={() => navigate('/demandes')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition group"
                >
                  Tout voir <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 p-2">
                {loading ? (
                  <div className="p-8 text-center text-slate-400 animate-pulse">Chargement des données...</div>
                ) : recentDemandes.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <ClipboardList className="w-12 h-12 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-700 mb-1">Aucune demande trouvée</h4>
                    <p className="text-slate-500 text-sm max-w-sm">Vous n'avez aucune demande active. C'est le moment idéal pour créer votre première demande logistique.</p>
                    {!(['MVE', 'CPA'].includes(user.structure)) && (
                      <button
                        onClick={() => navigate('/demande/new')}
                        className="mt-6 px-6 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition"
                      >
                        Commencer maintenant
                      </button>
                    )}
                  </div>
                ) : (
                  recentDemandes.map((rq) => (
                    <div
                      key={rq.num_demande}
                      onClick={() => navigate(`/demande/${encodeURIComponent(rq.num_demande)}`)}
                      className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <FileText className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {rq.num_demande}
                          </p>
                          <p className="text-sm text-slate-500 line-clamp-1 max-w-xs md:max-w-md">
                            {rq.equipement} • Pour: {rq.client || 'Interne'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="hidden sm:block">
                          <p className="text-xs text-slate-500 mb-1">Date Début</p>
                          <p className="text-sm font-medium text-slate-700">{rq.date_debut_prestation}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(rq.status)}`}>
                          {rq.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR: EXTRA COMMANDS & SYSTEM MODULES */}
        <div className="space-y-4">

          {/* Module: Statistics (For DSL) */}
          {user.structure === 'DSL' && (
            <div
              onClick={() => navigate('/statistics')}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Statistiques Logistique</h3>
                  <p className="text-slate-300 text-sm">Tableau de bord détaillé</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-slate-200 mt-6 relative z-10">
                <span>Accéder aux graphes</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          )}

          {/* Module: Equipements (For DSL) */}
          {user.structure === 'DSL' && (
            <div
              onClick={() => navigate('/equipements')}
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Truck className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-4 mb-2 relative z-10">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Catalogue Matériel</h3>
                </div>
              </div>
              <div className="mt-4 bg-black/10 rounded-xl p-3 relative z-10 flex justify-between items-center text-sm text-blue-50">
                <span>Explorer l'inventaire complet</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Module: Maintenance (For DSL & MVE) */}
          {['DSL', 'MVE'].includes(user.structure) && (
            <div
              onClick={() => navigate('/maintenance')}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Wrench className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-4 mb-2 relative z-10">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Parc Maintenance</h3>
                </div>
              </div>
              <div className="mt-4 bg-black/10 rounded-xl p-3 relative z-10 flex justify-between items-center">
                <span className="text-emerald-50 text-sm">Requêtes actives</span>
                <span className="text-xl font-black">{maintenanceTotal}</span>
              </div>
            </div>
          )}

          {/* Fallback Module Guide for empty sidebar situations */}
          {!['DSL', 'MVE'].includes(user.structure) && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-blue-800">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Guide Processus Logistique
              </h3>
              <p className="text-sm text-blue-600/80 leading-relaxed mb-4">
                Découvrez le cycle de vie de vos demandes logistiques :
              </p>
              <ul className="text-sm font-medium space-y-4 mt-4 pt-4 border-t border-blue-200/50">
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 bg-blue-200 text-blue-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</div>
                  <div>
                    <span className="font-bold text-slate-700 block">Création &amp; Validation</span>
                    <span className="text-slate-500 text-xs font-normal">Soumission <span className="text-amber-600 font-semibold">(En Attente)</span> et attente d'approbation hiérarchique <span className="text-emerald-600 font-semibold">(Validé)</span>. </span>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 bg-blue-200 text-blue-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</div>
                  <div>
                    <span className="font-bold text-slate-700 block">Traitement Logistique</span>
                    <span className="text-slate-500 text-xs font-normal">Approbation <span className="text-blue-600 font-semibold">(Approuvé)</span>  ou externalisation <span className="text-purple-600 font-semibold">(Sous Traitance)</span>.</span>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 bg-blue-200 text-blue-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</div>
                  <div>
                    <span className="font-bold text-slate-700 block">Déploiement</span>
                    <span className="text-slate-500 text-xs font-normal">début d'exécution <span className="text-blue-600 font-semibold">(En Cours)</span>.</span>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 bg-blue-200 text-blue-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">4</div>
                  <div>
                    <span className="font-bold text-slate-700 block">Restitution</span>
                    <span className="text-slate-500 text-xs font-normal">Fin de l'intervention et clôture du dossier. <span className="text-slate-700 font-semibold">(Clôturé)</span></span>
                  </div>
                </li>
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
