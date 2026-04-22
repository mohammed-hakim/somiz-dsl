import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn } from 'lucide-react';

const Login = ({ setUser }) => {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('https://backend-crt-78564523-dev.apps.rm1.0a51.p1.openshiftapps.com/api/login', { matricule, password });
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">Matricule</label>
              <input 
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="123456"
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
        </div>
      </div>
    </div>
  );
};

export default Login;
