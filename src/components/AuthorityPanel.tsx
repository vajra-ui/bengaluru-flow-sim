import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';
import { motion } from 'framer-motion';

export default function AuthorityPanel() {
  const { states, predictCongestion, zoneStats } = useTraffic();

  const segmentsWithPredictions = segments.map(seg => ({
    seg,
    state: states.get(seg.id)!,
    prediction: predictCongestion(seg.id),
  })).filter(s => s.state).sort((a, b) => b.prediction.prediction - a.prediction.prediction);

  const riskColor = zoneStats.gridlockRisk > 0.6 ? 'congestion-high' : zoneStats.gridlockRisk > 0.3 ? 'congestion-medium' : 'congestion-low';

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
      <div className="panel-header">
        <div className="status-dot-live" />
        <span>Command Center</span>
      </div>

      {/* Zone overview */}
      <div className="panel p-3">
        <div className="metric-label mb-3">Bengaluru Zone Overview</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="metric-value text-lg">{zoneStats.totalVehicles.toLocaleString()}</div>
            <div className="metric-label">Total Vehicles</div>
          </div>
          <div>
            <div className="metric-value text-lg">{Math.round(zoneStats.avgCongestion * 100)}%</div>
            <div className="metric-label">Avg Congestion</div>
          </div>
          <div>
            <div className={`metric-value text-lg ${riskColor}`}>{Math.round(zoneStats.gridlockRisk * 100)}%</div>
            <div className="metric-label">Gridlock Risk</div>
          </div>
          <div>
            <div className="metric-value text-lg">{zoneStats.hotspots.length}</div>
            <div className="metric-label">Active Hotspots</div>
          </div>
        </div>
      </div>

      {/* Hotspots */}
      {zoneStats.hotspots.length > 0 && (
        <div className="panel p-3">
          <div className="metric-label mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            Congestion Hotspots
          </div>
          {zoneStats.hotspots.map(name => (
            <div key={name} className="text-xs font-mono text-destructive py-1 border-b border-border last:border-0">
              {name}
            </div>
          ))}
        </div>
      )}

      {/* Predictive risk */}
      <div className="panel p-3">
        <div className="metric-label mb-2">Predictive Risk Analysis</div>
        {segmentsWithPredictions.slice(0, 6).map(({ seg, state, prediction }) => (
          <motion.div
            key={seg.id}
            className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground truncate">{seg.name}</div>
              <div className="text-[9px] text-muted-foreground font-mono">
                Now: {Math.round(state.congestionLevel * 100)}% → Pred: {Math.round(prediction.prediction * 100)}%
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              prediction.risk === 'high' ? 'bg-destructive/20 congestion-high' :
              prediction.risk === 'medium' ? 'bg-accent/20 congestion-medium' :
              'bg-success/20 congestion-low'
            }`}>
              {prediction.risk.toUpperCase()}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Density propagation log */}
      <div className="panel p-3">
        <div className="metric-label mb-2">Density Propagation</div>
        {segmentsWithPredictions
          .filter(s => s.state.trend === 'rising' && s.state.congestionLevel > 0.5)
          .slice(0, 4)
          .map(({ seg, state }) => (
            <div key={seg.id} className="text-[10px] font-mono text-accent py-1 border-b border-border last:border-0">
              ⚠ {seg.name}: density surge {state.trend} ({Math.round(state.congestionLevel * 100)}%)
              <br />
              <span className="text-muted-foreground">Spillover propagating to adjacent corridors</span>
            </div>
          ))}
        {segmentsWithPredictions.filter(s => s.state.trend === 'rising' && s.state.congestionLevel > 0.5).length === 0 && (
          <div className="text-[10px] font-mono text-muted-foreground">No active density surges</div>
        )}
      </div>
    </div>
  );
}
