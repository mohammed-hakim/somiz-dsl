import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, User, Gauge, Filter, Search } from 'lucide-react';

const MaintenanceMVE = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [showRejetModal, setShowRejetModal] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    structure_filter: '',
    categorie: '',
    date_from: '',
    date_to: ''
  });
  const [structures, setStructures] = useState([]);

  const loadRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.structure_filter) params.append('structure_filter', filters.structure_filter);
      if (filters.categorie) params.append('categorie', filters.categorie);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      
      const { data } = await axios.get(
        `http://localhost:5000/api/maintenance/requests?${params.toString()}`
      );
      setRequests(data);
      
      // Extract unique structures for filter dropdown
      const uniqueStructures = [...new Set(data.map(r => r.demandeur_structure).filter(Boolean))];
      setStructures(uniqueStructures);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', structure_filter: '', categorie: '', date_from: '', date_to: '' });
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.matricule, user.structure, user.role, filters]);

  const handleValider = async (requestId) => {
    try {
      setError('');
      await axios.post(`http://localhost:5000/api/maintenance/requests/${requestId}/valider`, {
        matricule: user.matricule
      });
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la validation');
    }
  };

  const openRejetModal = (request) => {
    setSelectedRequest(request);
    setMotifRejet('');
    setShowRejetModal(true);
    setError('');
  };

  const handleRejeter = async () => {
    if (!motifRejet.trim()) {
      setError('Le motif de rejet est obligatoire');
      return;
    }
    
    try {
      await axios.post(`http://localhost:5000/api/maintenance/requests/${selectedRequest.id}/rejeter`, {
        matricule: user.matricule,
        motif: motifRejet
      });
      setShowRejetModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du rejet');
    }
  };

  const handleTerminer = async (requestId) => {
    try {
      await axios.post(`http://localhost:5000/api/maintenance/requests/${requestId}/terminer`, {
        matricule: user.matricule
      });
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
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

  const pendingRequests = requests.filter(r => r.status === 'EN_ATTENTE');
  const validatedRequests = requests.filter(r => r.status === 'VALIDE');
  const otherRequests = requests.filter(r => ['REJETE', 'TERMINE', 'EN_COURS'].includes(r.status));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6" /> Validation Maintenance (MVE)
        </h2>
        <p className="text-slate-500 text-sm mt-1">Valider les demandes de maintenance des équipements DSL</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

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
            value={filters.structure_filter}
            onChange={(e) => handleFilterChange('structure_filter', e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Toutes les structures</option>
            {structures.map(s => <option key={s} value={s}>{s}</option>)}
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
        {(filters.status || filters.structure_filter || filters.categorie || filters.date_from || filters.date_to) && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-200 bg-orange-50">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Demandes en Attente ({pendingRequests.length})
          </h3>
        </div>
        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            Aucune demande en attente
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingRequests.map(r => (
              <div key={r.id} className="p-6 hover:bg-slate-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
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
                      <span className="flex items-center gap-1"><User className="w-4 h-4" /> {r.demandeur_nom} ({r.demandeur_structure})</span>
                      {r.kilometrage_actuel && (
                        <span className="flex items-center gap-1"><Gauge className="w-4 h-4" /> {r.kilometrage_actuel} km</span>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">{r.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => handleValider(r.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
                    >
                      <CheckCircle className="w-4 h-4" /> Valider
                    </button>
                    <button 
                      onClick={() => openRejetModal(r)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
                    >
                      <XCircle className="w-4 h-4" /> Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validated Requests */}
      {validatedRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-200 bg-green-50">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Demandes Validées en Cours ({validatedRequests.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {validatedRequests.map(r => (
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
                      <span className="flex items-center gap-1"><User className="w-4 h-4" /> {r.demandeur_nom}</span>
                      {r.kilometrage_actuel && (
                        <span className="flex items-center gap-1"><Gauge className="w-4 h-4" /> {r.kilometrage_actuel} km</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleTerminer(r.id)}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
                  >
                    <CheckCircle className="w-4 h-4" /> Terminer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejet Modal */}
      {showRejetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Motif du Rejet
            </h3>
            <textarea
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none mb-4"
              placeholder="Indiquez le motif du rejet..."
            />
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <div className="flex gap-4">
              <button 
                onClick={handleRejeter}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
              >
                Confirmer le Rejet
              </button>
              <button 
                onClick={() => setShowRejetModal(false)}
                className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {otherRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Historique</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {otherRequests.map(r => (
              <div key={r.id} className="p-6 hover:bg-slate-50 transition opacity-60">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-slate-800">{r.equipement}</h4>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusStyle(r.status)}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">Type: {r.type_libelle}</p>
                <p className="text-xs text-slate-400 mt-1">Du {r.date_debut} au {r.date_fin}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceMVE;
