import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth, type UserRole } from '@/lib/auth-context';
import { Activity, Eye, Radio, Phone, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('commuter');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (phone.length < 10) { setError('Enter a valid 10-digit phone number'); return; }
    if (!password) { setError('Enter your password'); return; }
    const ok = login(phone, password, role);
    if (!ok) setError('Invalid credentials');
  };

  const roles = [
    { id: 'commuter' as const, label: 'Commuter', icon: Eye, desc: 'Traffic updates, safety nav & routes', color: 'hsl(var(--primary))' },
    { id: 'operator' as const, label: 'Operator', icon: Radio, desc: 'Sensor network & traffic command', color: 'hsl(var(--accent))' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-6 h-6 text-primary" />
            <h1 className="font-mono text-lg font-bold tracking-wider text-foreground glow-text">
              SAFETY DOST
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-mono">YOUR GUARDIAN FRIEND</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-3 mb-6">
          {roles.map(r => {
            const Icon = r.icon;
            const active = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex-1 panel p-4 text-center transition-all ${
                  active ? 'glow-border bg-primary/5' : 'hover:bg-secondary/30'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className={`text-sm font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{r.label}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{r.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="panel p-6 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                className="w-full bg-secondary/50 text-foreground border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-secondary/50 text-foreground border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors font-mono text-sm"
          >
            Login as {role === 'commuter' ? 'Commuter' : 'Operator'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[10px] text-muted-foreground text-center mt-2 panel p-2">
            <span className="text-foreground font-bold">Demo:</span> Any 10-digit number + any password works
          </div>
        </form>
      </motion.div>
    </div>
  );
}
