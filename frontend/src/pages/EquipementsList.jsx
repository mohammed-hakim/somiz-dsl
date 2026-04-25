import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Truck, CheckCircle, Wrench, X, Clock, CalendarDays, ExternalLink, Search } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

const EquipementsList = () => {
  const navigate = useNavigate();
  const [equipements, setEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Details Modal State
  const [selectedEq, setSelectedEq] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchEquipements();
  }, []);

  const fetchEquipements = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/equipements/status`);
      setEquipements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (code) => {
    setSelectedEq(code);
    setDetails(null);
    setLoadingDetails(true);
    try {
      const res = await axios.get(`${apiUrl}/api/equipements/${encodeURIComponent(code)}/details`);
      setDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DISPONIBLE':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3" /> Disponible</span>;
      case 'EN_PRESTATION':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1 w-max"><Truck className="w-3 h-3" /> Déployé</span>;
      case 'EN_MAINTENANCE':
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 w-max"><Wrench className="w-3 h-3" /> Atelier / Panne</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // inclusive
  };

  const filteredEqs = equipements.filter(eq =>
    eq.prestation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Parc Outil & Équipements</h1>
          <p className="text-slate-500 mt-1">Supervision globale en temps réel</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (Code ou Nom)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 w-80 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Synchronisation avec le parc...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                <th className="p-4 font-semibold">Code Prestation</th>
                <th className="p-4 font-semibold">Équipement</th>
                <th className="p-4 font-semibold">Statut Actuel</th>
                <th className="p-4 font-semibold">Référence Active</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEqs.map(eq => (
                <tr key={eq.code} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4 font-mono text-sm text-slate-600">{eq.code}</td>
                  <td className="p-4 font-bold text-slate-800">{eq.prestation}</td>
                  <td className="p-4">{getStatusBadge(eq.status)}</td>
                  <td className="p-4">
                    {eq.current_ref ? (
                      <span className="text-sm font-medium text-slate-600">{eq.current_ref}</span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openDetails(eq.code)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm font-semibold transition"
                    >
                      Historique
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEqs.length === 0 && (
                <tr><td colSpan="5" className="p-12 text-center text-slate-500">Aucun outil trouvé.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {selectedEq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Dossier Outil : {selectedEq}</h2>
                <p className="text-sm text-slate-500">{details ? details.prestation : '...'}</p>
              </div>
              <button
                onClick={() => setSelectedEq(null)}
                className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
              {loadingDetails ? (
                <div className="text-center p-12 text-slate-400 animate-pulse">Extraction du journal...</div>
              ) : details ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Demandes History */}
                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-500" />
                      Journal Déploiements
                    </h3>
                    <div className="space-y-4">
                      {details.history_demandes.length === 0 ? (
                        <p className="text-sm text-slate-500 p-4 bg-white border border-slate-100 rounded-xl">Aucun déploiement enregistré.</p>
                      ) : (
                        details.history_demandes.map(d => (
                          <div key={d.num_demande} className="bg-white border text-left border-slate-200 p-4 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span
                                onClick={() => navigate(`/demande/${d.num_demande}`)}
                                className="font-bold text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
                                title="Voir le document complet"
                              >
                                {d.num_demande} <ExternalLink className="w-3 h-3" />
                              </span>
                              <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg">{d.status}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Lieu:</strong> {d.lieu} <br />
                              <strong>Struct:</strong> {d.structure} ({d.utilisateur})
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-2">
                              <CalendarDays className="w-4 h-4 text-blue-500" />
                              {d.date_debut} au {d.date_fin}
                              <span className="font-semibold ml-auto text-blue-700">({calculateDays(d.date_debut, d.date_fin)} jrs)</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Maintenance History */}
                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-red-500" />
                      Interventions Maintenance
                    </h3>
                    <div className="space-y-4">
                      {details.history_maintenances.length === 0 ? (
                        <p className="text-sm text-slate-500 p-4 bg-white border border-slate-100 rounded-xl">Aucune maintenance déclarée.</p>
                      ) : (
                        details.history_maintenances.map(m => (
                          <div key={m.id} className="bg-rose-50/30 border border-slate-200 p-4 text-left rounded-2xl shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span
                                onClick={() => navigate(`/maintenance`)}
                                className="font-bold text-red-600 cursor-pointer hover:underline flex items-center gap-1"
                                title="Voir dans l'espace maintenance"
                              >
                                {m.id} <ExternalLink className="w-3 h-3" />
                              </span>
                              <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-800 rounded-lg">{m.status}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Type:</strong> {m.type_maintenance}
                            </p>
                            <p className="text-sm text-slate-500 italic mb-2 line-clamp-2">{m.description}</p>

                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-100 p-2 rounded-lg">
                              <Clock className="w-4 h-4 text-red-500" />
                              {m.date_debut} au {m.date_fin}
                              <span className="font-semibold ml-auto text-red-700">({calculateDays(m.date_debut, m.date_fin)} jrs)</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            {/* Modal Footer */}
            <div className="p-4 bg-white border-t flex justify-end">
              <button onClick={() => setSelectedEq(null)} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition">Fermer le dossier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipementsList;
