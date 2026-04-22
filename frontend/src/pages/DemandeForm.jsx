import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Send, Loader2 } from 'lucide-react';

const DemandeForm = ({ user }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    code_affaire: '',
    ref_ods_client: '',
    lieu_prestation: '',
    date_debut: '',
    date_fin: '',
    description: '',
    observations: [''],
    creator_matricule: '',
    validateur_demandeur: '',
    engins: [],
    demandeur_structure: user.structure === 'DSL' ? '' : user.structure
  });

  // Données récupérées par la jointure (affichage uniquement)
  const [affaireInfo, setAffaireInfo] = useState({ client: '', code_structure: '', intitule: '' });

  const [equipements, setEquipements] = useState([]);
  const [engineSearch, setEngineSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loadingAffaire, setLoadingAffaire] = useState(false);
  const [affaireError, setAffaireError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      axios.get(`https://backend-crt-78564523-dev.apps.rm1.0a51.p1.openshiftapps.com/api/equipements?search=${engineSearch}`).then(res => setEquipements(res.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [engineSearch]);

  useEffect(() => {
    if (user.role === 'secretaire' && user.structure === 'DSL' && formData.demandeur_structure) {
      axios.get(`https://backend-crt-78564523-dev.apps.rm1.0a51.p1.openshiftapps.com/api/employees?structure=${formData.demandeur_structure}`).then(res => {
        setEmployees(res.data.filter(e => e.role !== 'chef departement'));
        setChefs(res.data.filter(e => e.role === 'chef departement'));
      });
    } else if (user.role === 'secretaire' && user.structure !== 'DSL') {
      axios.get(`https://backend-crt-78564523-dev.apps.rm1.0a51.p1.openshiftapps.com/api/employees?structure=${user.structure}`).then(res => setEmployees(res.data.filter(e => e.role !== 'chef departement')));
    }
  }, [user, formData.demandeur_structure]);

  // Charger les infos de l'affaire quand code_affaire = 7 caractères
  useEffect(() => {
    if (formData.code_affaire.length === 7) {
      setLoadingAffaire(true);
      setAffaireError('');
      axios.get(`https://backend-crt-78564523-dev.apps.rm1.0a51.p1.openshiftapps.com/api/affaires_structures/${formData.code_affaire}`)
        .then(({ data }) => {
          setAffaireInfo({
            client: data.client,
            code_structure: data.cod_struct_h,
            intitule: data.intitule
          });
          setLoadingAffaire(false);
        })
        .catch(() => {
          setAffaireError('Affaire introuvable');
          setAffaireInfo({ client: '', code_structure: '', intitule: '' });
          setLoadingAffaire(false);
        });
    } else {
      setAffaireInfo({ client: '', code_structure: '', intitule: '' });
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

  const handleObservationChange = (index, value) => {
    const newObs = [...formData.observations];
    newObs[index] = value;
    setFormData(prev => ({ ...prev, observations: newObs }));
  };

  const handleObservationKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newObs = [...formData.observations];
      newObs.splice(index + 1, 0, '');
      setFormData(prev => ({ ...prev, observations: newObs }));

      // Auto-focus the next input after state updates
      setTimeout(() => {
        const obsInputs = document.querySelectorAll('.obs-input');
        if (obsInputs[index + 1]) obsInputs[index + 1].focus();
      }, 0);
    } else if (e.key === 'Backspace' && formData.observations[index] === '' && formData.observations.length > 1) {
      e.preventDefault();
      const newObs = [...formData.observations];
      newObs.splice(index, 1);
      setFormData(prev => ({ ...prev, observations: newObs }));

      // Auto-focus the previous input
      setTimeout(() => {
        const obsInputs = document.querySelectorAll('.obs-input');
        if (obsInputs[index - 1]) obsInputs[index - 1].focus();
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    // Join observations with bullets
    const joinedObservations = formData.observations
      .filter(obs => obs.trim() !== '')
      .map(obs => '• ' + obs.trim())
      .join('\n');

    try {
      const res = await axios.post('https://backend-crt-78564523-dev.apps.rm1.0a51.p1.openshiftapps.com/api/demandes', {
        ...formData,
        observation: joinedObservations,
        structure: user.struc_code || 'GEN',
        creator_matricule: formData.creator_matricule || user.matricule,
        actual_creator_matricule: user.role === 'secretaire' ? user.matricule : null
      });
      navigate('/');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2); // add 2 days
    return date.toISOString().split('T')[0];
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">Client (Autofill via affaire)</label>
              <input
                type="text" value={affaireInfo.client} readOnly
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 outline-none"
                placeholder="Client..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Structure (Autofill via affaire)</label>
              <input
                type="text" value={affaireInfo.intitule ? `${affaireInfo.code_structure} - ${affaireInfo.intitule}` : affaireInfo.code_structure} readOnly
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Réf. ODS Client (Optionnel)</label>
              <input
                type="text" name="ref_ods_client" value={formData.ref_ods_client} onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Ex: ODS-2026-X..."
              />
            </div>


          </div>
        </div>

        {/* Section 2: Lieu et Durée */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-blue-800 border-b pb-2">2.Lieu et Durée de la Prestation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date début</label>
              <input
                type="date" name="date_debut" value={formData.date_debut} onChange={handleChange} required
                min={getMinDate()}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date Fin</label>
              <input
                type="date" name="date_fin" value={formData.date_fin} onChange={handleChange}
                min={formData.date_debut || getMinDate()}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Lieu de Prestation</label>
              <input
                type="text" name="lieu_prestation" value={formData.lieu_prestation} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Section 3: Description et Engins */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-blue-800 border-b pb-2">3. Description et Engins</h3>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description de la prestation</label>
            <textarea
              name="description" value={formData.description} onChange={handleChange} required
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

        {/* Section 4: Observations */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-blue-800 border-b pb-2">4. Observations</h3>
          <p className="text-xs text-slate-500 -mt-4 mb-2">Appuyez sur "Entrée" pour ajouter un nouveau point d'observation.</p>
          <div className="space-y-3">
            {formData.observations.map((obs, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <input
                  type="text"
                  value={obs}
                  onChange={(e) => handleObservationChange(idx, e.target.value)}
                  onKeyDown={(e) => handleObservationKeyDown(e, idx)}
                  className="obs-input flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                  placeholder="Observation..."
                />
              </div>
            ))}
          </div>
        </div>

        {user.role === 'secretaire' && user.structure === 'DSL' && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <label className="block text-sm font-semibold text-purple-900 mb-2">Structure du demandeur</label>
            <input
              type="text"
              name="demandeur_structure"
              value={formData.demandeur_structure}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              placeholder="Ex: ISI, DSL, GPA..."
            />
          </div>
        )}

        {user.role === 'secretaire' && user.structure !== 'DSL' && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <label className="block text-sm font-semibold text-blue-900 mb-2">Sélectionner le demandeur (Employé de {user.structure})</label>
            <select
              name="creator_matricule"
              value={formData.creator_matricule}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">Sélectionner un employé...</option>
              {employees.filter(e => e.matricule !== user.matricule).map(emp => (
                <option key={emp.matricule} value={emp.matricule}>{emp.nom} {emp.prenom} - {emp.matricule}</option>
              ))}
            </select>
          </div>
        )}

        {user.role === 'secretaire' && user.structure === 'DSL' && formData.demandeur_structure && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
            <label className="block text-sm font-semibold text-orange-900 mb-2">Validateur Demandeur (Chef signataire sur la version papier)</label>
            <select
              name="validateur_demandeur"
              value={formData.validateur_demandeur || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="">Sélectionner le chef validateur...</option>
              {chefs.map(emp => (
                <option key={emp.matricule} value={emp.matricule}>{emp.nom} {emp.prenom} - {emp.structure}</option>
              ))}
            </select>
          </div>
        )}

        {user.role === 'secretaire' && user.structure === 'DSL' && formData.demandeur_structure && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <label className="block text-sm font-semibold text-blue-900 mb-2">Sélectionner le demandeur (Employé de {formData.demandeur_structure})</label>
            <select
              name="creator_matricule"
              value={formData.creator_matricule}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">Sélectionner un employé...</option>
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
