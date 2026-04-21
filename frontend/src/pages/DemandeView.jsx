import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, CheckCircle, FileText, Anchor, History, XCircle, Printer, ScrollText, AlertTriangle, Play, X, Ban, Edit, Search } from 'lucide-react';

const getStatusStyle = (status) => {
   switch (status) {
      case 'Validé': return 'bg-green-100 text-green-700';
      case 'Clôturé': return 'bg-slate-200 text-slate-600';
      case 'Approuvé': return 'bg-indigo-100 text-indigo-700';
      case 'En Cours': return 'bg-blue-100 text-blue-700';
      case 'Rejeté': return 'bg-red-100 text-red-700';
      case 'Annulé': return 'bg-red-50 text-red-500';
      default: return 'bg-orange-100 text-orange-700';
   }
};

const MotifModal = ({ isOpen, title, onConfirm, onClose }) => {
   const [motif, setMotif] = useState('');
   const [error, setError] = useState('');

   if (!isOpen) return null;

   const handleSubmit = () => {
      if (!motif.trim()) {
         setError('Le motif est obligatoire.');
         return;
      }
      onConfirm(motif.trim());
      setMotif('');
      setError('');
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
               <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
               <button onClick={() => { onClose(); setMotif(''); setError(''); }} className="text-slate-400 hover:text-slate-600 transition">
                  <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6">
               <label className="block text-sm font-semibold text-slate-700 mb-2">Motif <span className="text-red-500">*</span></label>
               <textarea
                  value={motif}
                  onChange={(e) => { setMotif(e.target.value); setError(''); }}
                  rows={4}
                  placeholder="Veuillez saisir le motif..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none transition"
                  autoFocus
               />
               {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
            </div>
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
               <button onClick={() => { onClose(); setMotif(''); setError(''); }} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                  Annuler
               </button>
               <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition">
                  Confirmer
               </button>
            </div>
         </div>
      </div>
   );
};

const DemandeView = ({ user }) => {
   const { num_demande } = useParams();
   const navigate = useNavigate();
   const [demande, setDemande] = useState(null);
   const [loading, setLoading] = useState(true);
   const [errorStatus, setErrorStatus] = useState('');
   const [journaux, setJournaux] = useState([]);

   // DSL Local form state
   const [dslForm, setDslForm] = useState({ ot: '' });
   const [enginsAvailability, setEnginsAvailability] = useState(null);
   const [assignedEngins, setAssignedEngins] = useState([]);
   const [cpaForm, setCpaForm] = useState({ ods: '', date_cpa: '', fournisseur: '' });

   // Modal state
   const [modal, setModal] = useState({ open: false, title: '', action: null });

   // Edit equipment modal state
   const [editEquipModal, setEditEquipModal] = useState(false);
   const [equipements, setEquipements] = useState([]);
   const [engineSearch, setEngineSearch] = useState('');
   const [selectedEngins, setSelectedEngins] = useState([]);
   const [editEquipError, setEditEquipError] = useState('');

   const fetchJournaux = async () => {
      try {
         const { data } = await axios.get(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/journaux`);
         setJournaux(data);
      } catch (err) {
         console.error(err);
      }
   };

   const fetchDemande = async () => {
      try {
         const { data } = await axios.get(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}`);
         setDemande(data);
         document.title = data.num_demande || 'Demande';

         if (user.structure === 'DSL' && data.Status === 'Validé') {
            axios.get(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/engins_availability`)
               .then(res => {
                  setEnginsAvailability(res.data);
                  const available = Object.keys(res.data).filter(k => res.data[k]);
                  setAssignedEngins(available);
               }).catch(e => console.error(e));
         }

         fetchJournaux();
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchDemande();
   }, [num_demande]);

   // Fetch equipements for edit modal
   useEffect(() => {
      if (editEquipModal && engineSearch.length >= 2) {
         axios.get(`http://localhost:5500/api/equipements?search=${engineSearch}`)
            .then(res => setEquipements(res.data))
            .catch(e => console.error(e));
      }
   }, [editEquipModal, engineSearch]);

   const openEditEquipModal = () => {
      setSelectedEngins(demande.engins_detail?.map(e => e.code) || []);
      setEngineSearch('');
      setEquipements([]);
      setEditEquipError('');
      setEditEquipModal(true);
   };

   const handleUpdateEngins = async () => {
      try {
         setEditEquipError('');
         await axios.put(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/engins`, {
            engins: selectedEngins,
            matricule: user.matricule
         });
         setEditEquipModal(false);
         fetchDemande();
      } catch (err) {
         setEditEquipError(err.response?.data?.error || 'Erreur lors de la mise à jour');
      }
   };

   const toggleEngin = (code) => {
      setSelectedEngins(prev => 
         prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
      );
   };

   const handleValider = async () => {
      try {
         setErrorStatus('');
         await axios.post(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/valider`, { matricule: user.matricule });
         fetchDemande();
      } catch (err) {
         setErrorStatus(err.response?.data?.error || 'Erreur lors de la validation.');
      }
   };

   const handleRejeter = (motif) => {
      setErrorStatus('');
      axios.post(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/rejeter`, {
         matricule: user.matricule,
         motif
      }).then(() => {
         setModal({ open: false, title: '', action: null });
         fetchDemande();
      }).catch(err => {
         setErrorStatus(err.response?.data?.error || 'Erreur lors du rejet.');
         setModal({ open: false, title: '', action: null });
      });
   };

   const handleDslValider = async (action = 'approuver') => {
      try {
         setErrorStatus('');
         await axios.post(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/dsl_validate`, {
            matricule: user.matricule,
            action,
            ot: action === 'approuver' ? dslForm.ot : '',
            assigned_engins: action === 'approuver' ? assignedEngins : []
         });
         fetchDemande();
      } catch (err) {
         setErrorStatus(err.response?.data?.error || 'Erreur lors de l\'approbation DSL.');
      }
   };

   const handleCpaValider = async () => {
      try {
         setErrorStatus('');
         await axios.post(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/cpa_validate`, {
            matricule: user.matricule,
            ...cpaForm
         });
         fetchDemande();
      } catch (err) {
         setErrorStatus(err.response?.data?.error || 'Erreur lors de la validation CPA.');
      }
   };

   const handleEnCours = async () => {
      try {
         setErrorStatus('');
         await axios.post(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/en_cours`, { matricule: user.matricule });
         fetchDemande();
      } catch (err) {
         setErrorStatus(err.response?.data?.error || 'Erreur lors du passage en cours.');
      }
   };

   const handleCloturer = async () => {
      try {
         setErrorStatus('');
         await axios.post(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/cloturer`, { matricule: user.matricule });
         fetchDemande();
      } catch (err) {
         setErrorStatus(err.response?.data?.error || 'Erreur lors de la clôture.');
      }
   };

   const handleAnnuler = (motif) => {
      setErrorStatus('');
      axios.post(`http://localhost:5500/api/demandes/${encodeURIComponent(num_demande)}/annuler`, {
         matricule: user.matricule,
         motif
      }).then(() => {
         setModal({ open: false, title: '', action: null });
         fetchDemande();
      }).catch(err => {
         setErrorStatus(err.response?.data?.error || 'Erreur lors de l\'annulation.');
         setModal({ open: false, title: '', action: null });
      });
   };

   const openRejetModal = () => {
      setModal({ open: true, title: 'Motif du Rejet', action: 'rejeter' });
   };

   const openAnnulerModal = () => {
      setModal({ open: true, title: 'Motif de l\'Annulation', action: 'annuler' });
   };

   const handleModalConfirm = (motif) => {
      if (modal.action === 'rejeter') handleRejeter(motif);
      else if (modal.action === 'annuler') handleAnnuler(motif);
   };

   // Can the current user annuler this demande?
   const canAnnuler = () => {
      if (!demande) return false;
      const s = demande.Status;
      if (['Clôturé', 'Rejeté', 'Annulé'].includes(s)) return false;
      // Agent can cancel their own if still En Attente
      if (user.role === 'agent' && demande.utilisateur === user.matricule && s === 'En Attente') return true;
      // Chef departement (demandeur) can cancel if En Attente or Validé
      if (user.role === 'chef departement' && ['En Attente', 'Validé'].includes(s)) return true;
      // Chef DSL can cancel at any active stage
      if (user.role === 'chef departement' && user.structure === 'DSL') return true;
      // CPA can cancel Sous Traitance
      if (user.structure === 'CPA' && ['secretaire', 'chef service'].includes(user.role) && s === 'Sous Traitance') return true;
      return false;
   };

   if (loading) return <div className="text-center py-20 text-slate-500">Chargement...</div>;
   if (!demande) return <div className="text-center py-20 text-red-500">Demande introuvable.</div>;

   const isDone = ['Clôturé', 'Rejeté', 'Annulé'].includes(demande.Status);

   return (
      <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">

         {/* MOTIF MODAL */}
         <MotifModal
            isOpen={modal.open}
            title={modal.title}
            onConfirm={handleModalConfirm}
            onClose={() => setModal({ open: false, title: '', action: null })}
         />

         {/* HEADER VISIBLE ONLY ON SCREEN */}
         <div className="mb-6 flex justify-between items-center print:hidden">
            <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">&larr; Retour</button>
            <div className="flex gap-4">
               <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-1.5 rounded-lg font-medium shadow-sm transition">
                  <Printer className="w-4 h-4" /> Imprimer
               </button>
               <div className={`text-sm px-3 py-1.5 rounded-full font-bold ${getStatusStyle(demande.Status)}`}>
                  {demande.Status}
               </div>
            </div>
         </div>

         {/* DOCUMENT TO PRINT & VIEW */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 print:shadow-none print:border-none print:m-0">

            {/* Print Only Header */}
            <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
               <h1 className="text-2xl font-bold uppercase tracking-widest text-black">Entreprise SOMIZ</h1>
               <h2 className="text-xl font-bold uppercase mt-2 text-black">DEMANDE DE MISE A DISPOSITION DE MOYENS</h2>
            </div>

            <div className="bg-slate-50 border-b border-slate-200 p-6 print:bg-white print:p-0 print:border-none print:mb-6">
               <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 print:text-black print:text-xl">
                  <FileText className="w-6 h-6 text-blue-500 print:hidden" />
                  Réf N° : {demande.num_demande}
               </h2>
               <p className="text-slate-500 text-sm mt-2 print:text-black">
                  Structure / Division: <span className="font-bold">{demande.Structure_Intitule || demande.Code_Structure || '-'}</span>
               </p>
               <p className="text-slate-500 text-sm mt-1 print:text-black print:hidden">Créé le {demande.Date_Demande}</p>
            </div>

            <div className="p-8 space-y-8 print:p-0 print:space-y-6">

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4 print:grid-cols-2">
                  <div className="print:border print:border-black print:p-3">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black print:border-b print:border-black print:pb-1">1. Imputation</h4>
                     <div className="space-y-2 text-sm text-slate-700 print:text-black font-medium">
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Code Affaire:</span> {demande.Code_Affaire}</p>
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Réf. ODS Client:</span> {demande.ref_ods_client}</p>
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Client:</span> {demande.CLIENT || '-'}</p>
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Structure:</span> {demande.Structure_Intitule || demande.Code_Structure || '-'}</p>
                     </div>
                  </div>

                  <div className="print:border print:border-black print:p-3">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black print:border-b print:border-black print:pb-1">2. Durée</h4>
                     <div className="space-y-2 text-sm text-slate-700 print:text-black font-medium">
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Date Début:</span> {demande.Date_Debut_Prestation}</p>
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Date Fin:</span> {demande.Date_Fin_Prestation}</p>
                     </div>
                  </div>
               </div>

               <div className="print:border print:border-black print:p-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black print:border-b print:border-black print:pb-1">3. Description de la Prestation</h4>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap print:bg-white print:p-0 print:text-black font-medium">
                     <p className="mb-2 print:mb-1"><strong>Lieu:</strong> {demande.lieu_prestation}</p>
                     <div className="print:mt-1">{demande.description}</div>
                     {demande.Observation && (
                        <div className="mt-4 pt-4 border-t border-slate-200 print:border-black print:mt-2 print:pt-2">
                           <strong>Observations:</strong>
                           <div className="print:mt-1">{demande.Observation}</div>
                        </div>
                     )}
                  </div>
               </div>

               <div className="print:border print:border-black print:p-3">
                  <div className="flex justify-between items-center mb-3">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-black print:border-b print:border-black print:pb-1">4. Moyens (Engins) Demandés</h4>
                     {/* Edit Equipment Button - Only for DSL and editable statuses */}
                     {user.structure === 'DSL' && ['En Attente', 'Validé'].includes(demande.Status) && (
                        <button 
                           onClick={openEditEquipModal}
                           className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition print:hidden"
                        >
                           <Edit className="w-4 h-4" /> Modifier
                        </button>
                     )}
                  </div>
                  <ul className="space-y-2 print:list-disc print:pl-5">
                     {demande.engins_detail?.length === 0 && <span className="text-slate-400 text-sm print:text-black">Aucun engin réservé</span>}
                     {demande.engins_detail?.map(eq => {
                        const isAvail = enginsAvailability ? enginsAvailability[eq.code] : null;
                        return (
                        <li key={eq.code} className="flex items-center gap-2 text-sm text-slate-700 bg-blue-50/50 px-3 py-2 rounded border border-blue-100 print:bg-white print:border-none print:p-0 print:text-black font-medium">
                           {user.structure === 'DSL' && demande.Status === 'Validé' && ['secretaire', 'chef service'].includes(user.role) && (
                              <input 
                                 type="checkbox" 
                                 checked={assignedEngins.includes(eq.code)}
                                 onChange={(e) => {
                                    if(e.target.checked) setAssignedEngins(prev => [...prev, eq.code]);
                                    else setAssignedEngins(prev => prev.filter(c => c !== eq.code));
                                 }}
                                 disabled={isAvail === false}
                                 className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                           )}
                           <Anchor className="w-4 h-4 text-blue-500 print:hidden" />
                           {eq.prestation} <span className="text-blue-400 text-xs text-slate-400 print:text-black print:opacity-60">({eq.code})</span>
                           {isAvail === false && <span className="text-xs font-bold text-red-500 ml-auto mr-2 border border-red-200 bg-red-50 px-2 py-0.5 rounded">Non Dispo</span>}
                           {isAvail === true && <span className="text-xs font-bold text-green-600 ml-auto mr-2 border border-green-200 bg-green-50 px-2 py-0.5 rounded">Dispo</span>}
                        </li>
                     )})}
                  </ul>
               </div>

               {/* MOTIF DE REJET / ANNULATION */}
               {demande.motif_rejet && (demande.Status === 'Rejeté' || demande.Status === 'Annulé') && (
                  <div className={`rounded-xl p-5 border ${demande.Status === 'Rejeté' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                     <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${demande.Status === 'Rejeté' ? 'text-red-500' : 'text-orange-500'}`} />
                        <div className="flex-1">
                           <h4 className={`text-sm font-bold ${demande.Status === 'Rejeté' ? 'text-red-800' : 'text-orange-800'}`}>
                              {demande.Status === 'Rejeté' ? 'Motif du Rejet' : 'Motif de l\'Annulation'}
                           </h4>
                           <p className={`mt-1 text-sm ${demande.Status === 'Rejeté' ? 'text-red-700' : 'text-orange-700'}`}>
                              {demande.motif_rejet}
                           </p>
                           {demande.Status === 'Annulé' && demande.annulation_info && (
                              <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-orange-700">
                                 <p><strong>Annulé par:</strong> {demande.annulation_info.nom} {demande.annulation_info.prenom} ({demande.annulation_info.matricule})</p>
                                 <p><strong>Structure:</strong> {demande.annulation_info.structure || '-'}</p>
                                 <p><strong>Date:</strong> {demande.annulation_info.date}</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               )}

               {/* DSL REGISTRATION BLOCK FOR PRINTER ONLY */}
               <div className="hidden print:block border border-black p-3 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">Réservé à La Division Logistique (DSL)</h4>
                  <div className="flex justify-between text-sm font-medium">
                     <p>Validée le : <span className="font-bold">{demande.date_validation_prestataire || '__________________'}</span></p>
                     <p>Enregistrée par : <span className="font-bold">{demande.validateur_dsl ? `${demande.val_dsl_nom} ${demande.val_dsl_prenom}` : '__________________'}</span></p>
                  </div>
                  <div className="flex justify-between text-sm mt-3 font-medium">
                     <p>OT N° (DSL) : <span className="font-bold">{demande.validateur_dsl && !demande.date_cpa ? demande.OT_ODS : '__________________'}</span></p>
                     <p>ODS N° (CPA) : <span className="font-bold">{demande.date_cpa ? demande.OT_ODS : '__________________'}</span></p>
                  </div>
                  {demande.Fournisseur && (
                     <div className="flex justify-between text-sm mt-3 font-medium">
                        <p>Fournisseur (CPA) : <span className="font-bold">{demande.Fournisseur}</span></p>
                     </div>
                  )}
                  {demande.date_cpa && (
                     <div className="flex justify-between text-sm mt-3 font-medium">
                        <p>Date Sous-Traitance (CPA) : <span className="font-bold">{demande.date_cpa}</span></p>
                     </div>
                  )}
               </div>

               {/* SIGNATURES FOR PRINTER */}
               <div className="hidden print:grid grid-cols-2 gap-4 mt-8 pt-8 border-t-2 border-black">
                  <div className="text-center">
                     <p className="font-bold uppercase text-sm">Le Demandeur</p>
                     <p className="text-xs mt-1 mb-16">{demande.dem_nom} {demande.dem_prenom}</p>
                     <p className="text-xs italic">(Signé le {demande.Date_Demande})</p>
                  </div>
                  <div className="text-center">
                     <p className="font-bold uppercase text-sm">Validation Chef Département</p>
                     {demande.date_validation_demandeur ? (
                        <>
                           <p className="text-xs font-bold mt-1">{demande.val_dem_nom} {demande.val_dem_prenom}</p>
                           <p className="text-xs italic mt-1 mb-10">(Validé le {demande.date_validation_demandeur})</p>
                        </>
                     ) : (
                        <p className="text-xs italic mt-10">Non validé</p>
                     )}
                  </div>
               </div>

            </div>
         </div>

         {/* TRACKING TIMELINE / SCREEN ONLY */}
         <div className="print:hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><History className="w-5 h-5" /> Suivi de la Demande</h3>
            
            {/* Steps Progress Bar */}
            <div className="mb-8">
               {(() => {
                  // Check if this demande went through Sous Traitance
                  // It's Sous Traitance if: currently in that status, OR was approved by CPA (has date_cpa)
                  const hasSousTraitance = demande.Status === 'Sous Traitance' || 
                                          demande.date_cpa ||
                                          (demande.Status === 'Approuvé' && demande.date_validation_prestataire && !demande.validateur_dsl);
                  
                  const steps = hasSousTraitance
                     ? [
                        { label: 'En Attente', key: 'en_attente' },
                        { label: 'Validé', key: 'valide' },
                        { label: 'Sous Traitance', key: 'sous_traitance' },
                        { label: 'Approuvé', key: 'approuve' },
                        { label: 'En Cours', key: 'en_cours' },
                        { label: 'Clôturé', key: 'cloture' },
                     ]
                     : [
                        { label: 'En Attente', key: 'en_attente' },
                        { label: 'Validé', key: 'valide' },
                        { label: 'Approuvé', key: 'approuve' },
                        { label: 'En Cours', key: 'en_cours' },
                        { label: 'Clôturé', key: 'cloture' },
                     ];
                  
                  const statusOrder = hasSousTraitance
                     ? { 'En Attente': 0, 'Validé': 1, 'Sous Traitance': 2, 'Approuvé': 3, 'En Cours': 4, 'Clôturé': 5 }
                     : { 'En Attente': 0, 'Validé': 1, 'Approuvé': 2, 'En Cours': 3, 'Clôturé': 4 };
                  
                  // For cancelled demandes, determine at which stage it was cancelled
                  let cancelledAtIdx = -1;
                  if (demande.Status === 'Annulé') {
                     if (!demande.date_validation_demandeur) cancelledAtIdx = 0; // En Attente
                     else if (demande.validateur_dsl && !demande.date_validation_prestataire) cancelledAtIdx = hasSousTraitance ? 2 : 2; // Sous Traitance or Approuvé
                     else if (!demande.validateur_dsl && demande.date_validation_prestataire) cancelledAtIdx = hasSousTraitance ? 3 : 2; // Approuvé
                     else cancelledAtIdx = 1; // Validé
                  }
                  
                  const currentIdx = statusOrder[demande.Status] ?? -1;
                  const isTerminal = ['Rejeté', 'Annulé'].includes(demande.Status);

                  return (
                     <div className="relative">
                        {isTerminal && (
                           <div className={`mb-4 p-4 rounded-xl border flex items-center gap-3 ${
                              demande.Status === 'Rejeté' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                           }`}>
                              <XCircle className={`w-5 h-5 ${demande.Status === 'Rejeté' ? 'text-red-500' : 'text-orange-500'}`} />
                              <span className={`font-bold text-sm ${demande.Status === 'Rejeté' ? 'text-red-700' : 'text-orange-700'}`}>
                                 Demande {demande.Status}
                              </span>
                           </div>
                        )}
                        <div className="flex items-center">
                           {steps.map((step, idx) => {
                              const isActive = idx <= currentIdx && !isTerminal;
                              const isCurrent = idx === currentIdx && !isTerminal;
                              const isCancelled = idx === cancelledAtIdx;
                              return (
                                 <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center flex-1">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                          isCancelled
                                             ? 'bg-red-500 border-red-500 text-white'
                                             : isActive 
                                                ? (isCurrent ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-200' : 'bg-green-500 border-green-500 text-white')
                                                : 'bg-white border-slate-300 text-slate-400'
                                       }`}>
                                          {isCancelled ? <X className="w-4 h-4" /> : (isActive && !isCurrent ? <Check className="w-4 h-4" /> : idx + 1)}
                                       </div>
                                       <span className={`text-[10px] mt-1.5 font-medium text-center ${isActive || isCancelled ? 'text-slate-800' : 'text-slate-400'}`}>
                                          {step.label}
                                       </span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                       <div className={`flex-1 h-0.5 -mt-4 ${
                                          isCancelled ? 'bg-red-400' : 
                                          (idx < currentIdx && !isTerminal ? 'bg-green-400' : 'bg-slate-200')
                                       }`} />
                                    )}
                                 </React.Fragment>
                              );
                           })}
                        </div>
                     </div>
                  );
               })()}
            </div>

            {/* Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
               <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Créée par</h4>
                  <p className="font-semibold text-slate-800">{demande.dem_nom} {demande.dem_prenom}</p>
                  <p className="text-xs text-slate-500">{demande.utilisateur} - {demande.dem_role}</p>
                  <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Initiée ({demande.Date_Demande})</div>
               </div>

               <div className={`p-5 bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 ${
                  demande.Status === 'Rejeté' && !demande.date_validation_demandeur ? 'border-l-red-400' : 'border-l-green-400'
               }`}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Validation Département Demandeur</h4>
                  {demande.Status === 'Rejeté' && !demande.date_validation_demandeur ? (
                     <div className="mt-3 flex items-center gap-1 text-red-600 text-xs font-bold"><XCircle className="w-4 h-4" /> Rejeté</div>
                  ) : demande.date_validation_demandeur ? (
                     <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Validé le {demande.date_validation_demandeur}</div>
                  ) : (
                     <span className="text-slate-400 text-sm">En Attente...</span>
                  )}
               </div>

               <div className={`p-5 bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 ${
                  demande.Status === 'Rejeté' && demande.date_validation_demandeur ? 'border-l-red-400' : 'border-l-indigo-400'
               }`}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Approbation DSL / CPA</h4>
                  {demande.Status === 'Rejeté' && demande.date_validation_demandeur ? (
                     <div className="mt-3 flex items-center gap-1 text-red-600 text-xs font-bold"><XCircle className="w-4 h-4" /> Rejeté par DSL</div>
                  ) : demande.Status === 'Sous Traitance' ? (
                     <span className="text-orange-500 text-sm font-bold flex items-center gap-1 mt-3"><CheckCircle className="w-4 h-4" /> Transféré à la Sous-Traitance (CPA)</span>
                  ) : demande.date_validation_prestataire ? (
                     <>
                        <div className="mt-3 flex items-center gap-1 text-indigo-600 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Approuvé le {demande.date_validation_prestataire}</div>
                        {demande.OT_ODS && !demande.date_cpa && <p className="text-xs text-slate-500 mt-1">OT (DSL): {demande.OT_ODS}</p>}
                        {demande.OT_ODS && demande.date_cpa && <p className="text-xs text-slate-500 mt-1">ODS (CPA): {demande.OT_ODS}</p>}
                        {demande.Fournisseur && <p className="text-xs text-slate-500">Fournisseur (CPA): {demande.Fournisseur}</p>}
                        {demande.date_cpa && <p className="text-xs text-slate-500">Date CPA: {demande.date_cpa}</p>}
                     </>
                  ) : (
                     <span className="text-slate-400 text-sm">Non traité par la logistique</span>
                  )}
               </div>
            </div>

            {errorStatus && (
               <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
                  {errorStatus}
               </div>
            )}

            {/* ACTIONS CONDITIONNELLES */}
            <div className="flex flex-col gap-4">
               
               {/* Chef Departement Demandeur: Valider ou Rejeter (quand En Attente) */}
               {user.role === 'chef departement' && demande.Status === 'En Attente' && (
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={handleValider} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-lg">
                        <Check className="w-6 h-6" /> Valider
                     </button>
                     <button onClick={openRejetModal} className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-lg border border-red-200">
                        <XCircle className="w-6 h-6" /> Rejeter
                     </button>
                  </div>
               )}

               {/* Chef DSL: Approuver ou ND (quand Validé) */}
               {user.structure === 'DSL' && ['secretaire', 'chef service'].includes(user.role) && demande.Status === 'Validé' && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-indigo-900 font-bold mb-4">Traitement Logistique (DSL)</h3>
                     <div className="flex gap-4 mb-5">
                        <button onClick={() => handleDslValider('nd')} className="w-1/3 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 border border-orange-300 whitespace-nowrap">
                           ND (Sous-Traitance)
                        </button>
                        <div className="flex-1">
                           <label className="block text-xs font-semibold text-indigo-800 mb-1">OT N° <span className="text-red-500">*</span></label>
                           <input type="text" placeholder="Obligatoire (Si Assignation)" value={dslForm.ot} onChange={(e) => setDslForm({ ...dslForm, ot: e.target.value })} className="w-full px-3 py-2 rounded border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => handleDslValider('approuver')} className="col-span-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow transition-all flex items-center justify-center gap-2">
                           <CheckCircle className="w-5 h-5" /> Assigner & Approuver
                        </button>
                        <button onClick={openRejetModal} className="col-span-1 w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                           Rejeter
                        </button>
                     </div>
                  </div>
               )}

               {/* Sec/Chef CPA: Approuver (quand Sous Traitance) */}
               {user.structure === 'CPA' && ['secretaire', 'chef service'].includes(user.role) && demande.Status === 'Sous Traitance' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-purple-900 font-bold mb-4">Sous-Traitance (CPA)</h3>
                     <div className="grid grid-cols-3 gap-4 mb-5">
                        <div>
                           <label className="block text-xs font-semibold text-purple-800 mb-1">ODS N° <span className="text-red-500">*</span></label>
                           <input type="text" placeholder="Obligatoire" value={cpaForm.ods} onChange={(e) => setCpaForm({ ...cpaForm, ods: e.target.value })} className="w-full px-3 py-2 rounded border border-purple-200 outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-purple-800 mb-1">Date (Du) <span className="text-red-500">*</span></label>
                           <input type="date" value={cpaForm.date_cpa} onChange={(e) => setCpaForm({ ...cpaForm, date_cpa: e.target.value })} className="w-full px-3 py-2 rounded border border-purple-200 outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-purple-800 mb-1">Fournisseur <span className="text-red-500">*</span></label>
                           <input type="text" placeholder="Obligatoire" value={cpaForm.fournisseur} onChange={(e) => setCpaForm({ ...cpaForm, fournisseur: e.target.value })} className="w-full px-3 py-2 rounded border border-purple-200 outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleCpaValider} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-lg">
                           <CheckCircle className="w-6 h-6" /> Approuver la Sous-Traitance
                        </button>
                        <button onClick={openAnnulerModal} className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-orange-200">
                           <Ban className="w-5 h-5" /> Annuler la Sous-Traitance
                        </button>
                     </div>
                  </div>
               )}

               {/* Sec/Chef DSL/CPA: Passer En Cours (quand Approuvé) */}
               {['DSL', 'CPA'].includes(user.structure) && ['secretaire', 'chef service'].includes(user.role) && demande.Status === 'Approuvé' && (
                  <button onClick={handleEnCours} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-lg">
                     <Play className="w-6 h-6" /> Démarrer — Passer En Cours
                  </button>
               )}

               {/* Sec/Chef DSL/CPA: Clôturer (quand En Cours) */}
               {(['DSL', 'CPA'].includes(user.structure) && ['secretaire', 'chef service'].includes(user.role)) && demande.Status === 'En Cours' && (
                  <button onClick={handleCloturer} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-lg">
                     <CheckCircle className="w-6 h-6" /> Clôturer définitivement la demande
                  </button>
               )}



               {/* Annuler: visible selon les droits */}
               {canAnnuler() && (
                  <button onClick={openAnnulerModal} className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-orange-200">
                     <Ban className="w-5 h-5" /> Annuler la demande
                  </button>
               )}
            </div>

            {/* JOURNAUX / LOGS */}
            {journaux.length > 0 && (
               <div className="mt-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ScrollText className="w-5 h-5" /> Journal des Opérations</h3>
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                     <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                           <tr>
                              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Opération</th>
                              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Utilisateur</th>
                              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">IP</th>
                              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Machine</th>
                              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Compte Win</th>
                           </tr>
                        </thead>
                        <tbody>
                           {journaux.map((j, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                 <td className="px-4 py-3 font-medium text-slate-700">{j.action}</td>
                                 <td className="px-4 py-3 text-slate-600">{j.utilisateur}</td>
                                 <td className="px-4 py-3 text-slate-500">{j.date_action}</td>
                                 <td className="px-4 py-3 text-slate-500">{j.adresse_ip}</td>
                                 <td className="px-4 py-3 text-slate-500">{j.nom_pc}</td>
                                 <td className="px-4 py-3 text-slate-500">{j.session_windows}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}
         </div>

         {/* Edit Equipment Modal */}
         {editEquipModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in max-h-[90vh] flex flex-col">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                     <h3 className="font-bold text-slate-800 text-lg">Modifier les Engins</h3>
                     <button onClick={() => setEditEquipModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                     {/* Search */}
                     <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Rechercher des engins</label>
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                           <input
                              type="text"
                              value={engineSearch}
                              onChange={(e) => setEngineSearch(e.target.value)}
                              placeholder="Tapez au moins 2 caractères..."
                              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                           />
                        </div>
                     </div>

                     {/* Search Results */}
                     {equipements.length > 0 && (
                        <div className="mb-4 max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                           {equipements.map(eq => (
                              <label key={eq.code} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                                 <input
                                    type="checkbox"
                                    checked={selectedEngins.includes(eq.code)}
                                    onChange={() => toggleEngin(eq.code)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                 />
                                 <span className="text-sm text-slate-700">{eq.prestation}</span>
                                 <span className="text-xs text-slate-400">({eq.code})</span>
                              </label>
                           ))}
                        </div>
                     )}

                     {/* Selected Equipment */}
                     <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                           Engins sélectionnés ({selectedEngins.length})
                        </label>
                        {selectedEngins.length === 0 ? (
                           <p className="text-sm text-slate-400">Aucun engin sélectionné</p>
                        ) : (
                           <div className="flex flex-wrap gap-2">
                              {selectedEngins.map(code => (
                                 <span key={code} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                    {code}
                                    <button onClick={() => toggleEngin(code)} className="hover:text-blue-900">
                                       <X className="w-3 h-3" />
                                    </button>
                                 </span>
                              ))}
                           </div>
                        )}
                     </div>

                     {editEquipError && (
                        <p className="text-red-500 text-sm font-medium">{editEquipError}</p>
                     )}
                  </div>
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                     <button onClick={() => setEditEquipModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                        Annuler
                     </button>
                     <button onClick={handleUpdateEngins} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition">
                        Enregistrer
                     </button>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
};

export default DemandeView;
