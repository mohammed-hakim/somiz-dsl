import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, FileText, Wrench, BarChart3, PieChart, Activity, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const Statistics = ({ user }) => {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        matricule: user.matricule,
        role: user.role,
        structure: user.structure,
      });

      const [demandesRes, maintenanceRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/demandes?${params.toString()}`),
        axios.get('http://localhost:5000/api/maintenance/requests')
      ]);

      setDemandes(demandesRes.data);
      setMaintenanceRequests(maintenanceRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate Demandes stats
  const demandesStats = {
    total: demandes.length,
    enAttente: demandes.filter(d => d.status === 'En Attente').length,
    valide: demandes.filter(d => d.status === 'Validé').length,
    approuve: demandes.filter(d => d.status === 'Approuvé').length,
    enCours: demandes.filter(d => d.status === 'En Cours').length,
    cloture: demandes.filter(d => d.status === 'Clôturé').length,
    rejete: demandes.filter(d => d.status === 'Rejeté').length,
    annule: demandes.filter(d => d.status === 'Annulé').length,
    sousTraitance: demandes.filter(d => d.status === 'Sous Traitance').length,
  };

  // Calculate Maintenance stats
  const maintenanceStats = {
    total: maintenanceRequests.length,
    enAttente: maintenanceRequests.filter(r => r.status === 'EN_ATTENTE').length,
    valide: maintenanceRequests.filter(r => r.status === 'VALIDE').length,
    enCours: maintenanceRequests.filter(r => r.status === 'EN_COURS').length,
    termine: maintenanceRequests.filter(r => r.status === 'TERMINE').length,
    rejete: maintenanceRequests.filter(r => r.status === 'REJETE').length,
    preventif: maintenanceRequests.filter(r => r.categorie === 'Preventif').length,
    curatif: maintenanceRequests.filter(r => r.categorie === 'Curatif').length,
  };

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
      <div className="mb-8">
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
