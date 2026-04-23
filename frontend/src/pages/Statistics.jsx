import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, FileText, Wrench, BarChart3, PieChart, Activity, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
const apiUrl = import.meta.env.VITE_API_URL;
const Statistics = ({ user }) => {
  const navigate = useNavigate();
  const [demandesStats, setDemandesStats] = useState({
    total: 0, enAttente: 0, valide: 0, approuve: 0, enCours: 0,
    cloture: 0, rejete: 0, annule: 0, sousTraitance: 0,
  });
  const [maintenanceStats, setMaintenanceStats] = useState({
    total: 0, enAttente: 0, valide: 0, enCours: 0,
    termine: 0, rejete: 0, preventif: 0, curatif: 0,
  });
  const [period, setPeriod] = useState('max');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });

      const [demandesRes, maintenanceRes] = await Promise.all([
        axios.get(`${apiUrl}/api/demandes/stats?${params.toString()}`),
        axios.get(`${apiUrl}/api/maintenance/stats?${params.toString()}`)
      ]);

      const ds = demandesRes.data.by_status || {};
      setDemandesStats({
        total: demandesRes.data.total,
        enAttente: ds['En Attente'] || 0,
        valide: ds['Validé'] || 0,
        approuve: ds['Approuvé'] || 0,
        enCours: ds['En Cours'] || 0,
        cloture: ds['Clôturé'] || 0,
        rejete: ds['Rejeté'] || 0,
        annule: ds['Annulé'] || 0,
        sousTraitance: ds['Sous Traitance'] || 0,
      });

      const ms = maintenanceRes.data.by_status || {};
      const mc = maintenanceRes.data.by_categorie || {};
      setMaintenanceStats({
        total: maintenanceRes.data.total,
        enAttente: ms['EN_ATTENTE'] || 0,
        valide: ms['VALIDE'] || 0,
        enCours: ms['EN_COURS'] || 0,
        termine: ms['TERMINE'] || 0,
        rejete: ms['REJETE'] || 0,
        preventif: mc['Preventif'] || 0,
        curatif: mc['Curatif'] || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get monthly data for charts
  const getMonthlyData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(months[monthIndex]);
    }

    return last6Months;
  };

  const monthlyLabels = getMonthlyData();

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600">{label}</span>
          <span className="font-medium">{value} ({percentage.toFixed(1)}%)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-slate-500">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6" /> Statistiques Détaillées
          </h2>
          <p className="text-slate-500 text-sm mt-1">Vue d'ensemble des demandes et maintenance</p>
        </div>
        
        {/* Filter Dropdown */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Période d'analyse</label>
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="max">Toujours (Max)</option>
            <option value="day">Dernier jour</option>
            <option value="week">Dernière semaine</option>
            <option value="month">Dernier mois</option>
            <option value="year">Dernière année</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Demandes"
          value={demandesStats.total}
          icon={FileText}
          color="bg-blue-500"
          subtext="Toutes structures confondues"
        />
        <StatCard
          title="Total Maintenance"
          value={maintenanceStats.total}
          icon={Wrench}
          color="bg-emerald-500"
          subtext="Demandes de maintenance"
        />
        <StatCard
          title="Demandes Actives"
          value={demandesStats.enAttente + demandesStats.valide + demandesStats.approuve + demandesStats.enCours}
          icon={Activity}
          color="bg-indigo-500"
          subtext="En cours de traitement"
        />
        <StatCard
          title="Maintenance En Cours"
          value={maintenanceStats.enCours + maintenanceStats.valide}
          icon={Clock}
          color="bg-orange-500"
          subtext="Validée ou en cours"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Répartition des Demandes</h3>
          </div>

          <ProgressBar label="En Attente" value={demandesStats.enAttente} total={demandesStats.total} color="bg-orange-400" />
          <ProgressBar label="Validé" value={demandesStats.valide} total={demandesStats.total} color="bg-green-400" />
          <ProgressBar label="Approuvé" value={demandesStats.approuve} total={demandesStats.total} color="bg-indigo-400" />
          <ProgressBar label="En Cours" value={demandesStats.enCours} total={demandesStats.total} color="bg-blue-400" />
          <ProgressBar label="Sous Traitance" value={demandesStats.sousTraitance} total={demandesStats.total} color="bg-purple-400" />
          <ProgressBar label="Clôturé" value={demandesStats.cloture} total={demandesStats.total} color="bg-slate-400" />
          <ProgressBar label="Rejeté" value={demandesStats.rejete} total={demandesStats.total} color="bg-red-400" />
          <ProgressBar label="Annulé" value={demandesStats.annule} total={demandesStats.total} color="bg-red-300" />

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {demandesStats.total > 0 ? ((demandesStats.cloture / demandesStats.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-green-600">Taux de clôture</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {demandesStats.total > 0 ? (((demandesStats.enAttente + demandesStats.valide) / demandesStats.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-blue-600">En attente de validation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wrench className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Répartition Maintenance</h3>
          </div>

          <ProgressBar label="En Attente" value={maintenanceStats.enAttente} total={maintenanceStats.total} color="bg-orange-400" />
          <ProgressBar label="Validé" value={maintenanceStats.valide} total={maintenanceStats.total} color="bg-green-400" />
          <ProgressBar label="En Cours" value={maintenanceStats.enCours} total={maintenanceStats.total} color="bg-blue-400" />
          <ProgressBar label="Terminé" value={maintenanceStats.termine} total={maintenanceStats.total} color="bg-slate-400" />
          <ProgressBar label="Rejeté" value={maintenanceStats.rejete} total={maintenanceStats.total} color="bg-red-400" />

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="font-medium text-slate-700 mb-3">Par Type</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <p className="text-2xl font-bold text-teal-600">{maintenanceStats.preventif}</p>
                <p className="text-xs text-teal-600">Préventif</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{maintenanceStats.curatif}</p>
                <p className="text-xs text-amber-600">Curatif</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">
                {maintenanceStats.total > 0 ? ((maintenanceStats.termine / maintenanceStats.total) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-emerald-600">Taux de complétion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/demandes')}
          className="flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition"
        >
          <FileText className="w-5 h-5" />
          <span className="font-medium">Voir les Demandes</span>
        </button>
        <button
          onClick={() => navigate('/maintenance')}
          className="flex items-center justify-center gap-2 p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
        >
          <Wrench className="w-5 h-5" />
          <span className="font-medium">Voir la Maintenance</span>
        </button>
        <button
          onClick={() => navigate('/demande/new')}
          className="flex items-center justify-center gap-2 p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Nouvelle Demande</span>
        </button>
      </div>
    </div>
  );
};

export default Statistics;
