import React, { useState } from 'react';
import { Sparkles, Users, Lock, HeartHandshake, KeyRound, ArrowRight, Check } from 'lucide-react';
import { api } from '../services/api';
import { Account, Player } from '../types';

interface AuthModalProps {
  onSuccess: (account: Account, currentPlayer: Player, role: 'user1' | 'user2') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'register' | 'login'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration state
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [createdInfo, setCreatedInfo] = useState<{ username: string; account: Account } | null>(null);

  // Login state
  const [loginUsername, setLoginUsername] = useState('alex_and_jordan');
  const [loginPassword, setLoginPassword] = useState('bff');
  const [selectedRole, setSelectedRole] = useState<'user1' | 'user2'>('user1');

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Name.trim() || !p2Name.trim() || !regPassword.trim()) {
      setError('Please fill in both friends\' names and a shared password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.register(p1Name, p2Name, regPassword);
      setCreatedInfo({ username: res.account.username, account: res.account });
      setLoginUsername(res.account.username);
      setLoginPassword(regPassword);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('Please provide your shared username and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(loginUsername, loginPassword, selectedRole);
      onSuccess(res.account, res.currentPlayer, res.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Instant Demo
  const handleInstantDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const demo = await api.getDemo();
      const res = await api.login(demo.account.username, demo.password, 'user1');
      onSuccess(res.account, res.currentPlayer, 'user1');
    } catch (err: any) {
      setError('Failed to load demo pair');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#FFE3EC] via-[#E7DFFF] to-[#DCEEFF] p-6 text-center border-b border-purple-100/80">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white/90 shadow-md flex items-center justify-center text-3xl mb-3 animate-float">
            👯
          </div>
          <h2 className="text-2xl font-bold font-heading text-[#3A3A45]">
            Find Your Bestfriend
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            A co-op mystery adventure. One friend answers truth questions, the other explores the world to find them!
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 p-1.5 gap-1.5">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-2xl transition-all ${
              tab === 'login'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Shared Login
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-2xl transition-all ${
              tab === 'register'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Friend Duo
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-gentle-shake">
              {error}
            </div>
          )}

          {/* Registration Success Banner */}
          {createdInfo && tab === 'register' ? (
            <div className="space-y-4 text-center py-2 animate-pop">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check size={24} />
              </div>
              <h3 className="font-heading font-bold text-lg text-emerald-800">
                Shared Account Created!
              </h3>
              <p className="text-xs text-slate-600">
                Share these exact credentials with your best friend:
              </p>
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-left space-y-1 text-xs">
                <div><span className="font-semibold text-slate-600">Shared Username:</span> <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-purple-700">{createdInfo.username}</code></div>
                <div><span className="font-semibold text-slate-600">User 1:</span> {createdInfo.account.player1.name}</div>
                <div><span className="font-semibold text-slate-600">User 2:</span> {createdInfo.account.player2.name}</div>
              </div>
              <button
                onClick={() => setTab('login')}
                className="w-full py-3 rounded-2xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Shared Login <ArrowRight size={16} />
              </button>
            </div>
          ) : tab === 'register' ? (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Friend 1 Name (User 1)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Friend 2 Name (User 2)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jordan"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shared Password (both use this)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter a secret password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                  />
                  <Lock size={15} className="absolute right-3.5 top-3 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Creating Duo Account...' : 'Generate Shared Account'}
              </button>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shared Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. alex_and_jordan"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shared Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Shared password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                  />
                  <KeyRound size={15} className="absolute right-3.5 top-3 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Who is logging in right now?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('user1')}
                    className={`py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      selectedRole === 'user1'
                        ? 'bg-purple-100/90 text-purple-800 border-purple-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🌸</span>
                    <span>User 1 (Host)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('user2')}
                    className={`py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      selectedRole === 'user2'
                        ? 'bg-purple-100/90 text-purple-800 border-purple-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>⭐</span>
                    <span>User 2 (Partner)</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Logging In...' : 'Log In to Shared Session'}
              </button>
            </form>
          )}

          {/* Quick Demo Login Option */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleInstantDemo}
              disabled={loading}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#FFF4D6] to-[#FFE3EC] hover:brightness-95 border border-amber-200 text-amber-900 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <Sparkles size={15} />
              <span>Instant 1-Click Demo: Play as Alex & Jordan</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              No registration needed to evaluate gameplay
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
