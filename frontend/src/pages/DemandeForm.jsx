import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Send, Loader2 } from 'lucide-react';

const DemandeForm = ({ user }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    code_affaire: '',
    client: '',
    code_structure: '',
    ref_ods_client: '',
    lieu_prestation: '',
    date_debut: '',
    date_fin: '',
    nature_prestation: '',
    observation: '',
    creator_matricule: user.matricule,
    engins: []
  });

  const [equipements, setEquipements] = useState([]);
  const [engineSearch, setEngineSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loadingAffaire, setLoadingAffaire] = useState(false);
  const [affaireError, setAffaireError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch avail equipments with search
    const timer = setTimeout(() => {
      axios.get(`http://localhost:5000/api/equipements?search=${engineSearch}`).then(res => setEquipements(res.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [engineSearch]);
  
  useEffect(() => {
    // If secretaire, fetch employees in same structure
    if (user.role === 'secretaire') {
      axios.get(`http://localhost:5000/api/employees?structure=${user.structure}`).then(res => setEmployees(res.data));
    }
  }, [user]);

  // Try to load affaire when exactly 7 chars
  useEffect(() => {
    if (formData.code_affaire.length === 7) {
      setLoadingAffaire(true);
      setAffaireError('');
      axios.get(`http://localhost:5000/api/affaires_structures/${formData.code_affaire}`)
        .then(({ data }) => {
          setFormData(prev => ({
            ...prev,
            client: data.client,
            code_structure: data.cod_struct_h
          }));
          setLoadingAffaire(false);
        })
        .catch(() => {
          setAffaireError('Affaire introuvable');
          setLoadingAffaire(false);
        });
    }
  }, [formData.code_affaire]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEnginToggle = (code) => {
    setFormData(prev => {
      const isSelected = prev.engins.includes(code);
      return {
        ...prev,
        engins: isSelected ? prev.engins.filter(c => c !== code) : [...prev.engins, code]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/demandes', {
        ...formData,
        structure: user.struc_code || 'GEN',
        creator_matricule: user.matricule
      });
      navigate('/');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Nouvelle Demande De Moyens</h2>
          <p className="text-slate-500 text-sm mt-1">Saisie des informations de la prestation</p>
        </div>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Retour</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        
        {/* Section 1: Imputation */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-blue-800 border-b pb-2">1. Imputation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Code d'imputation (Affaire N°)</label>
              <div className="relative">
                <input 
                  autoFocus
                  type="text" name="code_affaire" value={formData.code_affaire} onChange={handleChange}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Ex: 851477R"
                  maxLength={7} required
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                {loadingAffaire && <Loader2 className="w-5 h-5 text-blue-500 animate-spin absolute right-3 top-3.5" />}
              </div>
              {affaireError && <p className="text-red-500 text-xs mt-1">{affaireError}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Client (Autofill)</label>
              <input 
                type="text" name="client" value={formData.client} readOnly
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 outline-none"
                placeholder="Client..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Code Structure (Autofill)</label>
              <input 
                type="text" value={formData.code_structure} readOnly
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Réf. ODS Client</label>
              <input 
                type="text" name="ref_ods_client" value={formData.ref_ods_client} onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Prestation */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-blue-800 border-b pb-2">2. Lieu et Durée</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Lieu de la prestation</label>
              <input 
                type="text" name="lieu_prestation" value={formData.lieu_prestation} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date début</label>
              <input 
                type="date" name="date_debut" value={formData.date_debut} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date Fin</label>
              <input 
                type="date" name="date_fin" value={formData.date_fin} onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-blue-800 border-b pb-2">3. Nature et Engins</h3>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nature de la prestation</label>
            <textarea 
              name="nature_prestation" value={formData.nature_prestation} onChange={handleChange} required
              rows={3} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
               <label className="block text-sm font-semibold text-slate-700">Sélectionner les moyens (Engins)</label>
               <input 
                 type="text" 
                 placeholder="Rechercher (ex: Camion, Grue...)" 
                 value={engineSearch}
                 onChange={(e) => setEngineSearch(e.target.value)}
                 className="px-3 py-1.5 text-sm rounded-md border border-slate-300 focus:border-blue-500 outline-none"
               />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border border-slate-200 shadow-inner rounded-xl bg-slate-50">
              {equipements.length === 0 ? <p className="text-sm text-slate-400">Aucun résultat</p> : equipements.map(eq => (
                <label key={eq.code} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 rounded"
                    checked={formData.engins.includes(eq.code)}
                    onChange={() => handleEnginToggle(eq.code)}
                  />
                  <span className="text-sm text-slate-700">{eq.prestation} <span className="text-xs text-slate-400">({eq.code})</span></span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-500">
               {formData.engins.length} engin(s) sélectionné(s)
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-blue-800 border-b pb-2">4. Observations</h3>
          <textarea 
              name="observation" value={formData.observation} onChange={handleChange}
              rows={2} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        {user.role === 'secretaire' && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
             <label className="block text-sm font-semibold text-blue-900 mb-2">Sélectionner le demandeur (Employé du même service)</label>
             <select 
               name="creator_matricule" 
               value={formData.creator_matricule} 
               onChange={handleChange}
               className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
             >
                <option value={user.matricule}>Sélectionner un employé...</option>
                {employees.filter(e => e.matricule !== user.matricule).map(emp => (
                  <option key={emp.matricule} value={emp.matricule}>{emp.nom} {emp.prenom} - {emp.matricule}</option>
                ))}
             </select>
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
             {submitError}
          </div>
        )}

        <button 
          disabled={isSubmitting || loadingAffaire}
          type="submit" 
          className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Soumettre la demande</>}
        </button>

      </form>
    </div>
  );
};

export default DemandeForm;
