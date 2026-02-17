import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TrafficMap from '@/components/TrafficMap';
import CommuterPanel from '@/components/CommuterPanel';
import OperatorPanel from '@/components/OperatorPanel';
import AuthorityPanel from '@/components/AuthorityPanel';
import { TrafficProvider, useTraffic } from '@/hooks/useTraffic';
import { Activity, Eye, Radio, Shield } from 'lucide-react';

type ViewMode = 'commuter' | 'operator' | 'authority';

const viewConfig = {
  commuter: { label: 'Commuter', icon: Eye, description: 'Your Route Intelligence' },
  operator: { label: 'Operator', icon: Radio, description: 'Sensor Network Monitor' },
  authority: { label: 'Authority', icon: Shield, description: 'Traffic Command Center' },
} as const;

function DashboardContent() {
  const [view, setView] = useState<ViewMode>('commuter');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const { zoneStats, tickCount, trafficMode, setTrafficMode } = useTraffic();

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="font-mono text-sm font-bold tracking-wider text-foreground glow-text">
            BENGALURU TRAFFIC INTELLIGENCE
          </h1>
          <div className="status-dot-live ml-2" />
          <span className="text-[10px] font-mono text-muted-foreground">LIVE</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Traffic mode selector */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
            {(['light', 'moderate', 'realistic', 'heavy'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setTrafficMode(mode)}
                className={`px-2 py-1 text-[9px] font-mono uppercase rounded transition-colors ${
                  trafficMode === mode
                    ? mode === 'heavy' ? 'bg-destructive/20 congestion-high'
                    : mode === 'light' ? 'bg-success/20 congestion-low'
                    : mode === 'moderate' ? 'bg-accent/20 congestion-medium'
                    : 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'heavy' ? '🔴' : mode === 'light' ? '🟢' : mode === 'moderate' ? '🟡' : '⚡'} {mode}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            <span className="text-foreground">{zoneStats.totalVehicles.toLocaleString()}</span> vehicles ·{' '}
            <span className={zoneStats.avgCongestion > 0.6 ? 'congestion-high' : zoneStats.avgCongestion > 0.35 ? 'congestion-medium' : 'congestion-low'}>
              {Math.round(zoneStats.avgCongestion * 100)}%
            </span> avg
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            T+{tickCount * 2}s
          </div>
        </div>
      </header>

      {/* View switcher */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card/30 shrink-0">
        {(Object.keys(viewConfig) as ViewMode[]).map(v => {
          const cfg = viewConfig[v];
          const Icon = cfg.icon;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                view === v
                  ? 'bg-primary/15 text-primary border border-primary/40 glow-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </button>
          );
        })}
        <span className="ml-3 text-[10px] font-mono text-muted-foreground">
          {viewConfig[view].description}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Map */}
        <div className="flex-1 relative">
          <TrafficMap onSegmentClick={setSelectedSegment} />
        </div>

        {/* Side panel */}
        <div className="w-80 border-l border-border bg-card/30 backdrop-blur-sm shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {view === 'commuter' && <CommuterPanel />}
              {view === 'operator' && <OperatorPanel />}
              {view === 'authority' && <AuthorityPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const Index = () => (
  <TrafficProvider>
    <DashboardContent />
  </TrafficProvider>
);

export default Index;
