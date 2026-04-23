import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, ChevronRight, ChevronLeft, Filter, X, Search, ArrowLeft, Plus } from 'lucide-react';
const apiUrl = import.meta.env.VITE_API_URL;

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

const DemandesList = ({ user }) => {
  const [demandes, setDemandes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    structureSearch: '',
  });

  const hasActiveFilters = filters.status || filters.date_from || filters.date_to || filters.structureSearch;

  const fetchDemandes = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        matricule: user.matricule,
        role: user.role,
        structure: user.structure,
        page: page.toString(),
        per_page: perPage.toString(),
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.structureSearch) params.append('structure_search', filters.structureSearch);

      const { data } = await axios.get(`${apiUrl}/api/demandes?${params.toString()}`);
      setDemandes(data.data);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error(err);
    }
  }, [user, filters, page]);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const clearFilters = () => {
    setFilters({ status: '', date_from: '', date_to: '', structureSearch: '' });
  };

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-2 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6" /> Liste des Demandes
          </h2>
          <button
            onClick={() => navigate('/demande/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Nouvelle Demande
          </button>
        </div>
        <p className="text-slate-500 text-sm mt-1">{total} demande{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter Bar */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition ${hasActiveFilters
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Début prestation (du)</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fin prestation (au)</label>
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
                  {total} résultat{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
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

      {/* Demande List */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Affichage {startItem}–{endItem} sur {total}
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
    </div>
  );
};

export default DemandesList;
