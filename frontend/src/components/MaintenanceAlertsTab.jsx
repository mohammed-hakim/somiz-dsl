import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  AlertTriangle, Clock, Gauge, Calendar, CheckCircle, XOctagon,
  RefreshCw, ChevronDown, ChevronUp, Pencil, Save, X, Info, ShieldCheck
} from 'lucide-react';
const apiUrl = import.meta.env.VITE_API_URL;

const urgencyConfig = {
  OVERDUE:  { label: 'En Retard',  color: 'bg-red-100 text-red-800 border-red-200',       dot: 'bg-red-500',     icon: XOctagon,      barColor: 'bg-red-500' },
  CRITICAL: { label: 'Critique',   color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500',  icon: AlertTriangle, barColor: 'bg-orange-500' },
  WARNING:  { label: 'Attention',  color: 'bg-amber-100 text-amber-800 border-amber-200',   dot: 'bg-amber-500',   icon: Clock,         barColor: 'bg-amber-400' },
  UNKNOWN:  { label: 'Données manquantes', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', icon: Info, barColor: 'bg-slate-400' },
  OK:       { label: 'OK',         color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle, barColor: 'bg-emerald-500' }
};

const MaintenanceAlertsTab = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [kmEditing, setKmEditing] = useState(null); // code_prestation being edited
  const [kmValue, setKmValue] = useState('');
  const [kmSaving, setKmSaving] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await axios.get(`${apiUrl}/api/maintenance/alerts`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const toggleExpand = (ruleId) => {
    setExpanded(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  const startKmEdit = (code, currentKm) => {
    setKmEditing(code);
    setKmValue(currentKm || '');
  };

  const saveKm = async (code) => {
    if (!kmValue) return;
    setKmSaving(true);
    try {
      await axios.put(`${apiUrl}/api/equipements/${code}/km`, { current_km: parseInt(kmValue, 10) });
      setKmEditing(null);
      setKmValue('');
      loadAlerts(); // refresh to recompute
    } catch (err) {
      console.error(err);
    } finally {
      setKmSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p>Calcul des alertes en cours...</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, alerts } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="En Retard" count={summary.overdue} color="bg-red-500" textColor="text-red-600" bgColor="bg-red-50" />
        <SummaryCard label="Critique" count={summary.critical} color="bg-orange-500" textColor="text-orange-600" bgColor="bg-orange-50" />
        <SummaryCard label="Attention" count={summary.warning} color="bg-amber-400" textColor="text-amber-600" bgColor="bg-amber-50" />
        <SummaryCard label="OK" count={summary.ok} color="bg-emerald-500" textColor="text-emerald-600" bgColor="bg-emerald-50" />
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
            <ShieldCheck className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <p className="text-lg font-medium">Aucune règle de maintenance configurée</p>
            <p className="text-sm mt-1">Créez des règles dans l'onglet "Règles de Prévention" pour activer les alertes.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = urgencyConfig[alert.urgency] || urgencyConfig.OK;
            const UrgencyIcon = config.icon;
            const isExpanded = expanded[alert.rule_id];

            return (
              <div
                key={alert.rule_id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  alert.urgency === 'OVERDUE' ? 'border-red-300 ring-1 ring-red-100' :
                  alert.urgency === 'CRITICAL' ? 'border-orange-200' :
                  'border-slate-200'
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-1 ${config.barColor}`} />

                {/* Main row */}
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition"
                  onClick={() => toggleExpand(alert.rule_id)}
                >
                  <UrgencyIcon className={`w-5 h-5 flex-shrink-0 ${
                    alert.urgency === 'OVERDUE' ? 'text-red-600' :
                    alert.urgency === 'CRITICAL' ? 'text-orange-600' :
                    alert.urgency === 'WARNING' ? 'text-amber-600' :
                    alert.urgency === 'OK' ? 'text-emerald-600' : 'text-slate-500'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-800 truncate">{alert.equipement}</h4>
                      <span className="text-xs font-mono text-slate-400">{alert.code_prestation}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{alert.type_libelle}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.has_pending && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
                        Demande en cours
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${config.color}`}>
                      {config.label}
                    </span>

                    {/* Quick stats */}
                    {alert.time_alert && (
                      <span className={`hidden md:flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600`}>
                        <Calendar className="w-3 h-3" />
                        {alert.time_alert.days_remaining >= 0
                          ? `${alert.time_alert.days_remaining}j`
                          : `${Math.abs(alert.time_alert.days_remaining)}j retard`}
                      </span>
                    )}
                    {alert.km_alert && alert.km_alert.km_remaining != null && (
                      <span className="hidden md:flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        <Gauge className="w-3 h-3" />
                        {alert.km_alert.km_remaining >= 0
                          ? `${alert.km_alert.km_remaining.toLocaleString()} km`
                          : `${Math.abs(alert.km_alert.km_remaining).toLocaleString()} km retard`}
                      </span>
                    )}
                  </div>

                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      
                      {/* Time-based detail */}
                      {alert.time_alert && (
                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-blue-500" /> Alerte Temporelle
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Dernière maintenance</span>
                              <span className="font-medium">{alert.time_alert.last_date || 'Jamais'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Intervalle</span>
                              <span className="font-medium">{alert.time_alert.interval_days} jours</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Prochaine échéance</span>
                              <span className="font-bold">{alert.time_alert.next_due}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Restant</span>
                              <span className={`font-bold ${
                                alert.time_alert.days_remaining < 0 ? 'text-red-600' :
                                alert.time_alert.urgency === 'CRITICAL' ? 'text-orange-600' :
                                alert.time_alert.urgency === 'WARNING' ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {alert.time_alert.days_remaining < 0
                                  ? `${Math.abs(alert.time_alert.days_remaining)} jours de retard`
                                  : `${alert.time_alert.days_remaining} jours`}
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2">
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    alert.time_alert.urgency === 'OVERDUE' ? 'bg-red-500' :
                                    alert.time_alert.urgency === 'CRITICAL' ? 'bg-orange-500' :
                                    alert.time_alert.urgency === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, 100 - (alert.time_alert.days_remaining / alert.time_alert.interval_days) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* KM-based detail */}
                      {alert.km_alert && (
                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                            <Gauge className="w-4 h-4 text-emerald-500" /> Alerte Kilométrique
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Dernier relevé maintenance</span>
                              <span className="font-medium">{alert.km_alert.last_km != null ? `${alert.km_alert.last_km.toLocaleString()} km` : 'Jamais'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Km actuel</span>
                              {kmEditing === alert.code_prestation ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={kmValue}
                                    onChange={(e) => setKmValue(e.target.value)}
                                    className="w-28 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => saveKm(alert.code_prestation)}
                                    disabled={kmSaving}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => { setKmEditing(null); setKmValue(''); }}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded transition"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">
                                    {alert.km_alert.current_km != null ? `${alert.km_alert.current_km.toLocaleString()} km` : 'Non renseigné'}
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startKmEdit(alert.code_prestation, alert.km_alert.current_km); }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Mettre à jour le kilométrage"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Intervalle</span>
                              <span className="font-medium">{alert.km_alert.interval_km.toLocaleString()} km</span>
                            </div>
                            {alert.km_alert.next_due_km != null && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Prochaine échéance</span>
                                <span className="font-bold">{alert.km_alert.next_due_km.toLocaleString()} km</span>
                              </div>
                            )}
                            {alert.km_alert.km_remaining != null && (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">Restant</span>
                                <span className={`font-bold ${
                                  alert.km_alert.km_remaining < 0 ? 'text-red-600' :
                                  alert.km_alert.urgency === 'CRITICAL' ? 'text-orange-600' :
                                  alert.km_alert.urgency === 'WARNING' ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  {alert.km_alert.km_remaining < 0
                                    ? `${Math.abs(alert.km_alert.km_remaining).toLocaleString()} km de retard`
                                    : `${alert.km_alert.km_remaining.toLocaleString()} km`}
                                </span>
                              </div>
                            )}
                            {alert.km_alert.note && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
                                {alert.km_alert.note}
                              </div>
                            )}
                            {/* Progress bar */}
                            {alert.km_alert.km_remaining != null && (
                              <div className="mt-2">
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      alert.km_alert.urgency === 'OVERDUE' ? 'bg-red-500' :
                                      alert.km_alert.urgency === 'CRITICAL' ? 'bg-orange-500' :
                                      alert.km_alert.urgency === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, 100 - (alert.km_alert.km_remaining / alert.km_alert.interval_km) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, count, color, textColor, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-4 border border-slate-100 shadow-sm`}>
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color} ${count > 0 ? 'animate-pulse' : ''}`} />
      <div>
        <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  </div>
);

export default MaintenanceAlertsTab;
