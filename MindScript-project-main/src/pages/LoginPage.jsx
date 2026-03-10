import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, Heart } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';
import MindfulBackground from '../components/MindfulBackground';

const LoginPage = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-16 animate-fade-in relative">
      <MindfulBackground variant="aurora" />

      <div className="glass-card rounded-3xl p-8 sm:p-10 w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 animate-float shadow-lg shadow-violet-900/40">
            <img src="/mindscript-icon.png" alt="MindScript" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-ms-primary-light to-ms-blue bg-clip-text text-transparent">
            MindScript
          </h1>
          <p className="text-ms-muted text-sm mt-1 flex items-center gap-1.5">
            Welcome back <Heart className="w-3.5 h-3.5 text-ms-secondary animate-pulse" />
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ms-muted" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-11"
              required
            />
          </div>

          <div className="relative animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ms-muted" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-11"
              required
            />
          </div>

          {error && (
            <p className="text-ms-secondary text-sm text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <p className="text-center text-ms-muted text-sm mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="text-ms-primary-light hover:text-ms-primary font-medium transition-colors">
            Create one
          </button>
        </p>

        {/* Positive quote */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-xs text-ms-muted/60 italic">"Taking care of your mind is just as important as taking care of your body."</p>
        </div>
      </div>

      <ScrollingFooter />
    </div>
  );
};

export default LoginPage;
