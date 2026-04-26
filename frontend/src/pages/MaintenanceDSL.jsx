import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Wrench, Calendar, Plus, CheckCircle, XCircle, Clock, AlertTriangle, Gauge, Filter, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import MaintenanceRulesTab from '../components/MaintenanceRulesTab';
import MaintenanceAlertsTab from '../components/MaintenanceAlertsTab';
const apiUrl = import.meta.env.VITE_API_URL;

const MaintenanceDSL = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code_prestation: '',
    type_maintenance: '',
    categorie: 'Preventif',
    date_debut: '',
    date_fin: '',
    kilometrage_actuel: '',
    description: ''
  });
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    categorie: '',
    type: '',
    date_from: '',
    date_to: ''
  });

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.categorie) params.append('categorie', filters.categorie);
      if (filters.type) params.append('type', filters.type);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const [reqRes, typeRes, eqRes] = await Promise.all([
        axios.get(`${apiUrl}/api/maintenance/requests?${params.toString()}`),
        axios.get(`${apiUrl}/api/maintenance/types`),
        axios.get(`${apiUrl}/api/equipements`)
      ]);
      setRequests(reqRes.data.data);
      setTotal(reqRes.data.total);
      setTotalPages(reqRes.data.total_pages);
      setMaintenanceTypes(typeRes.data);
      setEquipements(eqRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.matricule, user.structure, user.role, filters, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', categorie: '', type: '', date_from: '', date_to: '' });
  };



  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.code_prestation || !formData.date_debut || !formData.date_fin) return;

      try {
        const { data } = await axios.get(
          `${apiUrl}/api/equipements/${formData.code_prestation}/availability?date_debut=${formData.date_debut}&date_fin=${formData.date_fin}`
        );
        setAvailability(data);
      } catch (err) {
        console.error(err);
      }
    };
    checkAvailability();
  }, [formData.code_prestation, formData.date_debut, formData.date_fin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!availability?.available) {
      setError('L\'équipement n\'est pas disponible pour cette période (maintenance en cours ou planifiée)');
      return;
    }

    try {
      await axios.post(`${apiUrl}/api/maintenance/requests`, {
        ...formData,
        demandeur_matricule: user.matricule,
        demandeur_structure: user.structure
      });
      setShowForm(false);
      setFormData({
        code_prestation: '',
        type_maintenance: '',
        date_debut: '',
        date_fin: '',
        kilometrage_actuel: '',
        description: ''
      });
      // Refresh the list
      const refreshParams = new URLSearchParams({ page: '1', per_page: perPage.toString() });
      const { data } = await axios.get(`${apiUrl}/api/maintenance/requests?${refreshParams.toString()}`);
      setRequests(data.data);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'VALIDE': return 'bg-green-100 text-green-700';
      case 'REJETE': return 'bg-red-100 text-red-700';
      case 'TERMINE': return 'bg-slate-100 text-slate-700';
      case 'EN_COURS': return 'bg-blue-100 text-blue-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6" /> Maintenance des Équipements
          </h2>
          <p className="text-slate-500 text-sm mt-1">Demander la maintenance d'équipements à la structure MVE</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Nouvelle Demande
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'requests' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Demandes de Maintenance
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'rules' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Règles de Prévention
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'alerts' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Alertes Prévention
        </button>
      </div>

      {activeTab === 'requests' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold">
              <Filter className="w-4 h-4" /> Filtres
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En Attente</option>
                <option value="VALIDE">Validé</option>
                <option value="REJETE">Rejeté</option>
                <option value="EN_COURS">En Cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
              <select
                value={filters.categorie}
                onChange={(e) => handleFilterChange('categorie', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Toutes les catégories</option>
                <option value="Preventif">Préventif</option>
                <option value="Curatif">Curatif</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Tous les types</option>
                {maintenanceTypes.map(t => (
                  <option key={t.code} value={t.code}>{t.libelle}</option>
                ))}
              </select>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                placeholder="Date début"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                placeholder="Date fin"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {(filters.status || filters.categorie || filters.type || filters.date_from || filters.date_to) && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Effacer les filtres
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Nouvelle Demande de Maintenance</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Équipement</label>
                    <select
                      value={formData.code_prestation}
                      onChange={(e) => setFormData({ ...formData, code_prestation: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Sélectionner un équipement...</option>
                      {equipements.map(eq => (
                        <option key={eq["Code Prestation"]} value={eq["Code Prestation"]}>{eq.Prestation}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type de Maintenance</label>
                    <select
                      value={formData.type_maintenance}
                      onChange={(e) => {
                        const selectedType = maintenanceTypes.find(t => t.code === e.target.value);
                        setFormData({
                          ...formData,
                          type_maintenance: e.target.value,
                          categorie: selectedType ? selectedType.categorie : 'Preventif'
                        });
                      }}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Sélectionner un type...</option>
                      <optgroup label="Préventif">
                        {maintenanceTypes.filter(t => t.categorie === 'Preventif').map(type => (
                          <option key={type.code} value={type.code}>{type.libelle}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Curatif">
                        {maintenanceTypes.filter(t => t.categorie === 'Curatif').map(type => (
                          <option key={type.code} value={type.code}>{type.libelle}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Catégorie</label>
                    <input
                      type="text"
                      value={formData.categorie}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date Début</label>
                    <input
                      type="date"
                      value={formData.date_debut}
                      onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date Fin</label>
                    <input
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                      required
                      min={formData.date_debut || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Kilométrage Actuel</label>
                  <input
                    type="number"
                    value={formData.kilometrage_actuel}
                    onChange={(e) => setFormData({ ...formData, kilometrage_actuel: e.target.value })}
                    min="0"
                    placeholder="Ex: 45000"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Décrivez la maintenance nécessaire..."
                  />
                </div>

                {availability && (
                  <div className={`p-4 rounded-lg ${availability.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {availability.available ? (
                        <><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-green-700 font-medium">Équipement disponible pour cette période</span></>
                      ) : (
                        <><AlertTriangle className="w-5 h-5 text-red-600" /> <span className="text-red-700 font-medium">Équipement non disponible - Maintenance en conflit</span></>
                      )}
                    </div>
                    {!availability.available && availability.conflicts.length > 0 && (
                      <div className="mt-2 text-sm text-red-600">
                        <p>Conflits détectés:</p>
                        <ul className="list-disc ml-5 mt-1">
                          {availability.conflicts.map((c, i) => (
                            <li key={i}>Du {c.date_debut} au {c.date_fin} ({c.status})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition">
                    Soumettre la Demande
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Mes Demandes de Maintenance</h3>
            </div>
            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                Aucune demande de maintenance
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map(r => (
                  <div key={r.id} className="p-6 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-slate-800">{r.equipement}</h4>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(r.status)}`}>
                            {r.status}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.categorie === 'Preventif' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {r.categorie}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Type: {r.type_libelle}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Du {r.date_debut} au {r.date_fin}</span>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Demande: {r.date_demande}</span>
                          {r.kilometrage_actuel && (
                            <span className="flex items-center gap-1"><Gauge className="w-4 h-4" /> {r.kilometrage_actuel} km</span>
                          )}
                        </div>
                        {r.description && (
                          <p className="text-sm text-slate-600 mt-2">{r.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
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
        </>
      ) : activeTab === 'rules' ? (
        <MaintenanceRulesTab 
          user={user} 
          equipements={equipements} 
          maintenanceTypes={maintenanceTypes} 
        />
      ) : (
        <MaintenanceAlertsTab user={user} />
      )}
    </div>
  );
};

export default MaintenanceDSL;
