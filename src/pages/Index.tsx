import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TrafficMap from '@/components/TrafficMap';
import CommuterPanel from '@/components/CommuterPanel';
import OperatorPanel from '@/components/OperatorPanel';
import AuthorityPanel from '@/components/AuthorityPanel';
import SafetyPanel from '@/components/SafetyPanel';
import { TrafficProvider, useTraffic } from '@/hooks/useTraffic';
import { Activity, Eye, Radio, Shield, Heart, Menu, X } from 'lucide-react';
import NanbaAssistant from '@/components/NanbaAssistant';
import { useIsMobile } from '@/hooks/use-mobile';

type ViewMode = 'commuter' | 'operator' | 'authority' | 'safety';

const viewConfig = {
  commuter: { label: 'Commuter', icon: Eye, description: 'Your Route Intelligence' },
  operator: { label: 'Operator', icon: Radio, description: 'Sensor Network Monitor' },
  authority: { label: 'Authority', icon: Shield, description: 'Traffic Command Center' },
  safety: { label: 'Safety', icon: Heart, description: 'Women Safety Navigation' },
} as const;

function DashboardContent() {
  const [view, setView] = useState<ViewMode>('commuter');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { zoneStats, tickCount, trafficMode, setTrafficMode } = useTraffic();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
          <h1 className="font-mono text-[10px] sm:text-sm font-bold tracking-wider text-foreground glow-text truncate">
            {isMobile ? 'TRAFFIC INTEL' : 'BENGALURU TRAFFIC INTELLIGENCE'}
          </h1>
          <div className="status-dot-live ml-1 sm:ml-2 shrink-0" />
          <span className="text-[8px] sm:text-[10px] font-mono text-muted-foreground shrink-0">LIVE</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Traffic mode selector */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-secondary/50 rounded-lg p-0.5">
            {(['light', 'moderate', 'realistic', 'heavy'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setTrafficMode(mode)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-mono uppercase rounded transition-colors ${
                  trafficMode === mode
                    ? mode === 'heavy' ? 'bg-destructive/20 congestion-high'
                    : mode === 'light' ? 'bg-success/20 congestion-low'
                    : mode === 'moderate' ? 'bg-accent/20 congestion-medium'
                    : 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isMobile ? (mode === 'heavy' ? '🔴' : mode === 'light' ? '🟢' : mode === 'moderate' ? '🟡' : '⚡') : `${mode === 'heavy' ? '🔴' : mode === 'light' ? '🟢' : mode === 'moderate' ? '🟡' : '⚡'} ${mode}`}
              </button>
            ))}
          </div>
          {!isMobile && (
            <div className="text-[10px] font-mono text-muted-foreground">
              <span className="text-foreground">{zoneStats.totalVehicles.toLocaleString()}</span> vehicles ·{' '}
              <span className={zoneStats.avgCongestion > 0.6 ? 'congestion-high' : zoneStats.avgCongestion > 0.35 ? 'congestion-medium' : 'congestion-low'}>
                {Math.round(zoneStats.avgCongestion * 100)}%
              </span> avg
            </div>
          )}
          <div className="text-[8px] sm:text-[10px] font-mono text-muted-foreground">
            T+{tickCount * 2}s
          </div>
          {/* Mobile panel toggle */}
          {isMobile && (
            <button onClick={() => setPanelOpen(!panelOpen)} className="text-foreground p-1">
              {panelOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </header>

      {/* View switcher */}
      <div className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-border bg-card/30 shrink-0 overflow-x-auto">
        {(Object.keys(viewConfig) as ViewMode[]).map(v => {
          const cfg = viewConfig[v];
          const Icon = cfg.icon;
          return (
            <button
              key={v}
              onClick={() => { setView(v); if (isMobile) setPanelOpen(true); }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-mono transition-all whitespace-nowrap ${
                view === v
                  ? 'bg-primary/15 text-primary border border-primary/40 glow-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {cfg.label}
            </button>
          );
        })}
        {!isMobile && (
          <span className="ml-3 text-[10px] font-mono text-muted-foreground">
            {viewConfig[view].description}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Map */}
        <div className="flex-1 relative">
          <TrafficMap onSegmentClick={setSelectedSegment} />
        </div>

        {/* Side panel - responsive: overlay on mobile, sidebar on desktop */}
        {isMobile ? (
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-y-0 right-0 w-full sm:w-80 z-20 border-l border-border bg-card/95 backdrop-blur-xl overflow-y-auto"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="font-mono text-xs text-muted-foreground">{viewConfig[view].description}</span>
                  <button onClick={() => setPanelOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {view === 'commuter' && <CommuterPanel />}
                {view === 'operator' && <OperatorPanel />}
                {view === 'authority' && <AuthorityPanel />}
                {view === 'safety' && <SafetyPanel />}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
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
                {view === 'safety' && <SafetyPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <NanbaAssistant />
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
