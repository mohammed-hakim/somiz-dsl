import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn } from 'lucide-react';
const apiUrl = import.meta.env.VITE_API_URL;

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${apiUrl}/api/login`, { username, password });
      // data contains { token: string, user: object }
      const sessionData = { ...data.user, token: data.token };
      localStorage.setItem('user', JSON.stringify(sessionData));
      setUser(sessionData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };
  const fillDemo = (user) => {
    setUsername(user);
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300 mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden border border-white/50 relative z-10 transition-all hover:shadow-blue-900/5 hover:-translate-y-1">
        <div className="px-8 py-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">SOMIZ Logistics</h2>
            <p className="text-slate-500 mt-2 text-sm">Gestion des mises à disposition de moyens</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="prenom.nom"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de Passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="••••••"
                required
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">{error}</div>}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2 group"
            >
              <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Se Connecter
            </button>
          </form>
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <p className="font-semibold text-slate-700 mb-2">Comptes de test</p>

            <p className="mb-2">
              🔐 <span className="font-medium">Mot de passe :</span> 123456
            </p>

            <p className="mb-4">
              👤 <span className="font-medium">Username :</span> prenom.nom
            </p>

            {/* ISI */}
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">ISI</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <button type="button" onClick={() => fillDemo('isi.karim')} className="text-left hover:text-blue-600">isi.karim</button>
                <span className="text-slate-400">agent</span>

                <button type="button" onClick={() => fillDemo('isi.mansor')} className="text-left hover:text-blue-600">isi.mansor</button>
                <span className="text-slate-400">secretaire</span>
              </div>
            </div>

            <div className="border-t border-slate-200 my-2"></div>

            {/* DSL */}
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">DSL</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <button type="button" onClick={() => fillDemo('isi.zakaria')} className="text-left hover:text-blue-600">isi.zakaria</button>
                <span className="text-slate-400">chef service</span>

                <button type="button" onClick={() => fillDemo('dsl.jamal')} className="text-left hover:text-blue-600">dsl.jamal</button>
                <span className="text-slate-400">secretaire</span>

                <button type="button" onClick={() => fillDemo('dsl.ahmed')} className="text-left hover:text-blue-600">dsl.ahmed</button>
                <span className="text-slate-400">chef service</span>
              </div>
            </div>

            <div className="border-t border-slate-200 my-2"></div>

            {/* CPA */}
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">CPA</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <button type="button" onClick={() => fillDemo('cpa.amine')} className="text-left hover:text-blue-600">cpa.amine</button>
                <span className="text-slate-400">secretaire</span>

                <button type="button" onClick={() => fillDemo('cpa.reda')} className="text-left hover:text-blue-600">cpa.reda</button>
                <span className="text-slate-400">chef service</span>
              </div>
            </div>

            <div className="border-t border-slate-200 my-2"></div>

            {/* MVE */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1">MVE</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <button type="button" onClick={() => fillDemo('mve.ryad')} className="text-left hover:text-blue-600">mve.ryad</button>
                <span className="text-slate-400">secretaire</span>

                <button type="button" onClick={() => fillDemo('mve.baraa')} className="text-left hover:text-blue-600">mve.baraa</button>
                <span className="text-slate-400">chef service</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
