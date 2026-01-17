import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, displayName || undefined);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-100 mx-auto mb-6 bg-white flex items-center justify-center border border-slate-100">
            <img 
              src="./Minglr.png" 
              alt="Minglr" 
              className="w-full h-full object-contain p-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://ui-avatars.com/api/?name=Minglr&background=4F46E5&color=fff&bold=true";
              }}
            />
          </div>
          <h1 className="font-black text-4xl tracking-tighter mb-1">
            <span className="text-indigo-600">Ming</span>
            <span className="text-rose-500 italic">lr</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Munich Social Hub</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 px-8 py-10 text-white text-center">
            <h2 className="text-3xl font-black italic tracking-tighter">
              {isSignUp ? 'JOIN THE SQUAD' : 'WELCOME BACK'}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-2">
              {isSignUp ? 'Start your Munich adventure' : 'Dive back into the city'}
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.85 2.21c1.67-1.54 2.63-3.81 2.63-6.56z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.85-2.21c-.79.53-1.8.84-3.11.84-2.39 0-4.41-1.61-5.13-3.78H.95v2.3C2.43 15.72 5.51 18 9 18z" fill="#34A853" />
                <path d="M3.87 10.67c-.18-.53-.29-1.1-.29-1.67s.11-1.14.29-1.67V5.03H.95C.35 6.23 0 7.58 0 9s.35 2.77.95 3.97l2.92-2.3z" fill="#FBBC05" />
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.51 0 2.43 2.28.95 5.03L3.87 7.33C4.59 5.16 6.61 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">Continue with Google</span>
            </button>

            {/* Separator */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">OR</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                    <User size={10} className="text-indigo-500" /> Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Max M."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                  <Mail size={10} className="text-indigo-500" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@minglr.com"
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                  <Lock size={10} className="text-indigo-500" /> Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-3 rounded-xl text-xs font-bold animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {isSignUp ? 'Already joined? Sign in here' : "Need an invite? Join the squad"}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <p className="text-center mt-10 text-slate-300 text-[9px] font-black uppercase tracking-[0.5em]">MunichConnect © 2024</p>
      </div>
    </div>
  );
};

export default Login;