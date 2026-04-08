import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, ChevronRight } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [demandes, setDemandes] = useState([]);
  const navigate = useNavigate();

  const fetchDemandes = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/demandes?matricule=${user.matricule}&role=${user.role}&structure=${user.structure}`);
      setDemandes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-500 text-sm mt-1">Vos demandes de moyens et engins</p>
        </div>
        {(user.role === 'agent' || user.role === 'secretaire') && (
          <button 
            onClick={() => navigate('/demande/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Nouvelle Demande
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {demandes.length === 0 ? (
            <li className="p-8 text-center text-slate-500 flex flex-col items-center">
               <FileText className="w-12 h-12 text-slate-300 mb-3" />
               Aucune demande trouvée
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
                     <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                       d.status === 'Validé' ? 'bg-green-100 text-green-700' :
                       d.status === 'Clôturé' ? 'bg-slate-200 text-slate-600' :
                       d.status === 'Approuvé par DSL' ? 'bg-indigo-100 text-indigo-700' :
                       d.status === 'Refusé' ? 'bg-red-100 text-red-700' :
                       'bg-orange-100 text-orange-700'
                     }`}>
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
    </div>
  );
};

export default Dashboard;
