import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Search, Calendar, Gauge, Cog, RefreshCw, X, ShieldAlert, BadgeInfo, ChevronLeft, ChevronRight } from 'lucide-react';
const apiUrl = import.meta.env.VITE_API_URL;

const MaintenanceRulesTab = ({ user, equipements, maintenanceTypes }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Equipment search in modal
  const [equipSearchModal, setEquipSearchModal] = useState('');

  const [formData, setFormData] = useState({
    code_prestation: '',
    type_maintenance: '',
    interval_km: '',
    interval_days: '',
    alert_before_km: 500,
    alert_before_days: 7
  });

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());
      if (search) params.append('search', search);

      const { data } = await axios.get(`${apiUrl}/api/maintenance/rules?${params.toString()}`);
      setRules(data.data);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des règles de maintenance.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Filter equipements in modal based on search
  const filteredEquipements = equipements.filter(eq =>
    !equipSearchModal ||
    eq.code?.toLowerCase().includes(equipSearchModal.toLowerCase()) ||
    eq.prestation?.toLowerCase().includes(equipSearchModal.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axios.post(`${apiUrl}/api/maintenance/rules`, {
        code_prestation: formData.code_prestation,
        type_maintenance: formData.type_maintenance,
        interval_km: formData.interval_km ? parseInt(formData.interval_km, 10) : null,
        interval_days: formData.interval_days ? parseInt(formData.interval_days, 10) : null,
        alert_before_km: formData.alert_before_km ? parseInt(formData.alert_before_km, 10) : null,
        alert_before_days: formData.alert_before_days ? parseInt(formData.alert_before_days, 10) : null
      });
      setShowModal(false);
      setFormData({
        code_prestation: '',
        type_maintenance: '',
        interval_km: '',
        interval_days: '',
        alert_before_km: 500,
        alert_before_days: 7
      });
      setEquipSearchModal('');
      setPage(1);
      loadRules();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création de la règle.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get the selected equipment label for display in modal
  const selectedEquipLabel = formData.code_prestation
    ? equipements.find(eq => eq.code === formData.code_prestation)
    : null;

  return (
    <div className="space-y-6 animate-fade-in transition-all">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par code ou nom d'équipement..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={loadRules}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Actualiser"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Nouvelle Règle
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm border-t-0">
                <th className="px-6 py-4 font-semibold">Équipement</th>
                <th className="px-6 py-4 font-semibold">Type de Maintenance</th>
                <th className="px-6 py-4 font-semibold">Intervalles</th>
                <th className="px-6 py-4 font-semibold">Alertes</th>
                <th className="px-6 py-4 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                       <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                    Chargement des règles...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Search className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-lg font-medium">Aucune règle définie</p>
                      <p className="text-sm">Créez une nouvelle règle pour démarrer la prévention.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{rule.equipement}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{rule.code_prestation}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Cog className="w-3.5 h-3.5" />
                        {rule.type_libelle}
                      </span>
                      <div className="text-xs text-slate-500 mt-1.5">{rule.categorie}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {rule.interval_km && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Gauge className="w-4 h-4 text-emerald-500" />
                            {rule.interval_km.toLocaleString()} km
                          </div>
                        )}
                        {rule.interval_days && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            {rule.interval_days} jours
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {rule.alert_before_km && (
                          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 w-max px-2 py-0.5 rounded border border-orange-100">
                            Alerte à -{rule.alert_before_km} km
                          </div>
                        )}
                        {rule.alert_before_days && (
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 w-max px-2 py-0.5 rounded border border-amber-100">
                            Alerte à -{rule.alert_before_days} jours
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {rule.is_active ? (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Actif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span> Inactif
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Affichage {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} sur {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      p === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Creating Rule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Cog className="w-6 h-6 text-indigo-600" />
                Nouvelle Règle de Maintenance
              </h3>
              <button
                onClick={() => { setShowModal(false); setEquipSearchModal(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-6">

                {/* Equipment Selection with search */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Équipement Cible *</label>
                  {/* Show selected equipment or search input */}
                  {formData.code_prestation && selectedEquipLabel ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50">
                      <span className="font-medium text-indigo-800 flex-1">
                        {selectedEquipLabel.code} - {selectedEquipLabel.prestation}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setFormData({ ...formData, code_prestation: '' }); setEquipSearchModal(''); }}
                        className="text-indigo-400 hover:text-indigo-700 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={equipSearchModal}
                          onChange={(e) => setEquipSearchModal(e.target.value)}
                          placeholder="Rechercher un équipement par code ou nom..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        />
                      </div>
                      {/* Results dropdown */}
                      <div className="mt-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                        {filteredEquipements.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-400 text-center">Aucun résultat</div>
                        ) : (
                          filteredEquipements.slice(0, 20).map(eq => (
                            <button
                              key={eq.code}
                              type="button"
                              onClick={() => { setFormData({ ...formData, code_prestation: eq.code }); setEquipSearchModal(''); }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition border-b border-slate-50 last:border-b-0"
                            >
                              <span className="font-mono text-indigo-600 mr-2">{eq.code}</span>
                              <span className="text-slate-700">{eq.prestation}</span>
                            </button>
                          ))
                        )}
                        {filteredEquipements.length > 20 && (
                          <div className="px-4 py-2 text-xs text-slate-400 text-center bg-slate-50">
                            +{filteredEquipements.length - 20} résultats – affinez votre recherche
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type d'Intervention *</label>
                  <select
                    required
                    value={formData.type_maintenance}
                    onChange={(e) => setFormData({ ...formData, type_maintenance: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  >
                    <option value="">Sélectionner le type...</option>
                    {maintenanceTypes.map(t => (
                      <option key={t.code} value={t.code}>
                        {t.libelle} ({t.categorie})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                     <BadgeInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                     <p className="text-sm text-blue-800 leading-relaxed">
                        Les règles définissent quand une alerte de prévention doit être déclenchée. Vous pouvez configurer un intervalle en kilométrage, en jours ouvrés, ou les deux. Le premier des deux seuils atteint déclenchera la demande de maintenance.
                     </p>
                  </div>
                </div>

                {/* Intervals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                       <Gauge className="w-4 h-4" /> Basé sur le Kilométrage
                    </h4>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Fréquence (km)</label>
                      <input
                        type="number"
                        placeholder="Ex: 10000"
                        value={formData.interval_km}
                        onChange={(e) => setFormData({ ...formData, interval_km: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1 text-orange-600 font-medium">Alerter avant (km)</label>
                      <input
                        type="number"
                        placeholder="Ex: 500"
                        value={formData.alert_before_km}
                        onChange={(e) => setFormData({ ...formData, alert_before_km: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-orange-200 bg-orange-50/30 focus:ring-2 focus:ring-orange-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                       <Calendar className="w-4 h-4" /> Basé sur le Temps
                    </h4>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Fréquence (Jours)</label>
                      <input
                        type="number"
                        placeholder="Ex: 365"
                        value={formData.interval_days}
                        onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1 text-amber-600 font-medium">Alerter avant (Jours)</label>
                      <input
                        type="number"
                        placeholder="Ex: 15"
                        value={formData.alert_before_days}
                        onChange={(e) => setFormData({ ...formData, alert_before_days: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-amber-200 bg-amber-50/30 focus:ring-2 focus:ring-amber-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEquipSearchModal(''); }}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.code_prestation || !formData.type_maintenance || (!formData.interval_km && !formData.interval_days)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? 'Création...' : 'Créer la règle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceRulesTab;
