import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, CheckCircle, FileText, Anchor, History, XCircle, Printer } from 'lucide-react';

const DemandeView = ({ user }) => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [demande, setDemande] = useState(null);
   const [loading, setLoading] = useState(true);
   const [errorStatus, setErrorStatus] = useState('');

   // DSL Local form state
   const [dslForm, setDslForm] = useState({ ot_ods: '', fournisseur: '' });

   const fetchDemande = async () => {
      try {
         const { data } = await axios.get(`http://localhost:5000/api/demandes/${id}`);
         setDemande(data);
         document.title = data.N_DSL || `Demande_${id}`;
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchDemande();
   }, [id]);

   const handleValider = async () => {
      await axios.post(`http://localhost:5000/api/demandes/${id}/valider`, { matricule: user.matricule });
      fetchDemande();
   };

   const handleDslValider = async () => {
      try {
         setErrorStatus('');
         await axios.post(`http://localhost:5000/api/demandes/${id}/dsl_validate`, {
            matricule: user.matricule,
            ot_ods: dslForm.ot_ods,
            fournisseur: dslForm.fournisseur
         });
         fetchDemande();
      } catch (err) {
         setErrorStatus(err.response?.data?.error || 'Erreur lors de la validation DSL.');
      }
   };

   const handleRefuser = async () => {
      if (window.confirm('Êtes-vous sûr de vouloir refuser cette demande ? (Ceci libérera les engins)')) {
         await axios.post(`http://localhost:5000/api/demandes/${id}/refuser`);
         fetchDemande();
      }
   };

   const handleCloturer = async () => {
      await axios.post(`http://localhost:5000/api/demandes/${id}/cloturer`);
      fetchDemande();
   };

   if (loading) return <div className="text-center py-20 text-slate-500">Chargement...</div>;
   if (!demande) return <div className="text-center py-20 text-red-500">Demande introuvable.</div>;

   return (
      <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">

         {/* HEADER VISIBLE ONLY ON SCREEN */}
         <div className="mb-6 flex justify-between items-center print:hidden">
            <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">&larr; Retour</button>
            <div className="flex gap-4">
               <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-1.5 rounded-lg font-medium shadow-sm transition">
                  <Printer className="w-4 h-4" /> Imprimer
               </button>
               <div className={`text-sm px-3 py-1.5 rounded-full font-bold ${demande.Status === 'Validé' ? 'bg-green-100 text-green-700' :
                  demande.Status === 'Clôturé' ? 'bg-slate-200 text-slate-600' :
                     demande.Status === 'Approuvé par DSL' ? 'bg-indigo-100 text-indigo-700' :
                        demande.Status === 'Refusé' ? 'bg-red-100 text-red-700' :
                           'bg-orange-100 text-orange-700'
                  }`}>
                  {demande.Status}
               </div>
            </div>
         </div>

         {/* DOCUMENT TO PRINT & VIEW */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 print:shadow-none print:border-none print:m-0">

            {/* Print Only Header (Simulating physical DOCX) */}
            <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
               <h1 className="text-2xl font-bold uppercase tracking-widest text-black">Entreprise SOMIZ</h1>
               <h2 className="text-xl font-bold uppercase mt-2 text-black">DEMANDE DE MISE A DISPOSITION DE MOYENS</h2>
            </div>

            <div className="bg-slate-50 border-b border-slate-200 p-6 print:bg-white print:p-0 print:border-none print:mb-6">
               <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 print:text-black print:text-xl">
                  <FileText className="w-6 h-6 text-blue-500 print:hidden" />
                  Réf N° : {demande.N_DSL}
               </h2>
               <p className="text-slate-500 text-sm mt-2 print:text-black">Structure / Division: <span className="font-bold">{demande.Code_Structure}</span></p>
               <p className="text-slate-500 text-sm mt-1 print:text-black print:hidden">Créé le {demande.Date_Demande}</p>
            </div>

            <div className="p-8 space-y-8 print:p-0 print:space-y-6">

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4 print:grid-cols-2">
                  <div className="print:border print:border-black print:p-3">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black print:border-b print:border-black print:pb-1">1. Imputation</h4>
                     <div className="space-y-2 text-sm text-slate-700 print:text-black font-medium">
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Code Affaire/NS:</span> {demande.Code_Affaire}</p>
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Client:</span> {demande.Client || '-'}</p>
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Réf. ODS:</span> {demande.Ref_ODS_Client || '-'}</p>
                     </div>
                  </div>

                  <div className="print:border print:border-black print:p-3">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black print:border-b print:border-black print:pb-1">2. Lieu et Durée</h4>
                     <div className="space-y-2 text-sm text-slate-700 print:text-black font-medium">
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Lieu:</span> {demande.Lieu_Prestation}</p>
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Date Début:</span> {demande.Date_Debut_Prestation}</p>
                        <p><span className="w-32 inline-block text-slate-500 print:text-black">Date Fin:</span> {demande.Date_Fin_Prestation}</p>
                     </div>
                  </div>
               </div>

               <div className="print:border print:border-black print:p-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black print:border-b print:border-black print:pb-1">3. Nature de la Prestation</h4>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap print:bg-white print:p-0 print:text-black font-medium">
                     {demande.Nature_Prestation}
                     {demande.Observation && <div className="mt-4 pt-4 border-t border-slate-200 print:border-black print:mt-2 print:pt-2"><strong>Obs:</strong> {demande.Observation}</div>}
                  </div>
               </div>

               <div className="print:border print:border-black print:p-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black print:border-b print:border-black print:pb-1">4. Moyens (Engins) Demandés</h4>
                  <ul className="space-y-2 print:list-disc print:pl-5">
                     {demande.engins_detail?.length === 0 && <span className="text-slate-400 text-sm print:text-black">Aucun engin réservé</span>}
                     {demande.engins_detail?.map(eq => (
                        <li key={eq.code} className="flex items-center gap-2 text-sm text-slate-700 bg-blue-50/50 px-3 py-2 rounded border border-blue-100 print:bg-white print:border-none print:p-0 print:text-black font-medium">
                           <Anchor className="w-4 h-4 text-blue-500 print:hidden" />
                           {eq.prestation} <span className="text-blue-400 text-xs text-slate-400 print:text-black print:opacity-60">({eq.code})</span>
                        </li>
                     ))}
                  </ul>
               </div>

               {/* DSL REGISTRATION BLOCK FOR PRINTER ONLY */}
               <div className="hidden print:block border border-black p-3 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">Réservé à La Division Logistique (DSL)</h4>
                  <div className="flex justify-between text-sm font-medium">
                     <p>Enregistrée le : <span className="font-bold">{demande.Date_Enregistrement_DSL || '__________________'}</span></p>
                     <p>Par : <span className="font-bold">{demande.dsl_nom ? `${demande.dsl_nom} ${demande.dsl_prenom}` : '__________________'}</span></p>
                  </div>
                  <div className="flex justify-between text-sm mt-3 font-medium">
                     <p>OT ou ODS N° : <span className="font-bold">{demande.OT_ODS || '__________________'}</span></p>
                     <p>Le fournisseur : <span className="font-bold">{demande.Fournisseur || '__________________'}</span></p>
                  </div>
               </div>

               {/* SIGNATURES FOR PRINTER */}
               <div className="hidden print:grid grid-cols-2 gap-4 mt-8 pt-8 border-t-2 border-black">
                  <div className="text-center">
                     <p className="font-bold uppercase text-sm">Le Demandeur</p>
                     <p className="text-xs mt-1 mb-16">{demande.dem_nom} {demande.dem_prenom}</p>
                     <p className="text-xs italic">(Signé le {demande.Date_Demande})</p>
                  </div>
                  <div className="text-center">
                     <p className="font-bold uppercase text-sm">Visa Chef de Structure</p>
                     {demande.Visa_Chef ? (
                        <>
                           <p className="text-xs mt-1 mb-16">{demande.chef_nom} {demande.chef_prenom}</p>
                           <p className="text-xs italic">(Approuvé le {demande.Date_Validation_Chef})</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
               <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Demandeur</h4>
                  <p className="font-semibold text-slate-800">{demande.dem_nom} {demande.dem_prenom}</p>
                  <p className="text-xs text-slate-500">{demande.Demandeur_Matricule} - {demande.dem_role}</p>
                  <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Initiée ({demande.Date_Demande})</div>
               </div>

               <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 border-l-green-400">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chef Structure Origine</h4>
                  {demande.Status === 'Refusé' ? (
                     <div className="mt-3 flex items-center gap-1 text-red-600 text-xs font-bold"><XCircle className="w-4 h-4" /> Refusé/Annulé</div>
                  ) : demande.Visa_Chef ? (
                     <>
                        <p className="font-semibold text-slate-800">{demande.chef_nom} {demande.chef_prenom}</p>
                        <p className="text-xs text-slate-500">{demande.Chef_Structure_Matricule}</p>
                        <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Validé ({demande.Date_Validation_Chef})</div>
                     </>
                  ) : (
                     <span className="text-slate-400 text-sm">En Attente...</span>
                  )}
               </div>

               <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 border-l-indigo-400">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Division des Services Logistique (DSL)</h4>
                  {demande.Enregistre_A_DSL ? (
                     <>
                        <p className="font-semibold text-slate-800">{demande.dsl_nom} {demande.dsl_prenom}</p>
                        <p className="text-xs text-slate-500">Par {demande.DSL_Chef_Matricule}</p>
                        <div className="mt-3 flex items-center gap-1 text-indigo-600 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Traité ({demande.Date_Enregistrement_DSL})</div>
                     </>
                  ) : (
                     <span className="text-slate-400 text-sm">Non traité par DSL</span>
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
               {user.role === 'chef departement' && demande.Status === 'En Attente' && user.struc_code !== 'DSL' && (
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={handleValider} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-lg">
                        <Check className="w-6 h-6" /> Approuver (Visa Chef)
                     </button>
                     <button onClick={handleRefuser} className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-lg border border-red-200">
                        <XCircle className="w-6 h-6" /> Refuser
                     </button>
                  </div>
               )}

               {user.structure === 'DSL' && user.role === 'chef departement' && demande.Status === 'Validé' && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                     <h3 className="text-indigo-900 font-bold mb-4">Finalisation DSL</h3>
                     <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                           <label className="block text-xs font-semibold text-indigo-800 mb-1">OT ou ODS N° (Doit être Unique)</label>
                           <input type="text" value={dslForm.ot_ods} onChange={(e) => setDslForm({ ...dslForm, ot_ods: e.target.value })} className="w-full px-3 py-2 rounded border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-indigo-800 mb-1">Fournisseur</label>
                           <input type="text" value={dslForm.fournisseur} onChange={(e) => setDslForm({ ...dslForm, fournisseur: e.target.value })} className="w-full px-3 py-2 rounded border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <button onClick={handleDslValider} className="col-span-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow transition-all flex items-center justify-center gap-2">
                           <CheckCircle className="w-5 h-5" /> Enregistrer & Approuver DSL
                        </button>
                        <button onClick={handleRefuser} className="col-span-1 w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                           Refuser
                        </button>
                     </div>
                  </div>
               )}

               {(user.matricule === demande.Demandeur_Matricule || user.role === 'chef departement') && demande.Status === 'Approuvé par DSL' && (
                  <button onClick={handleCloturer} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-lg">
                     Clôturer définitivement la demande
                  </button>
               )}
            </div>
         </div>

      </div>
   );
};

export default DemandeView;
