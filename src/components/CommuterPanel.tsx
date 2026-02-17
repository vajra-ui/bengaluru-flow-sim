import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';
import { motion } from 'framer-motion';

export default function CommuterPanel() {
  const { states, predictCongestion } = useTraffic();

  // Get top congested segments nearby (simulating user location near Koramangala)
  const sortedSegments = [...segments]
    .map(seg => ({ seg, state: states.get(seg.id)! }))
    .filter(s => s.state)
    .sort((a, b) => b.state.congestionLevel - a.state.congestionLevel);

  const topCongested = sortedSegments.slice(0, 5);
  const bestRoutes = sortedSegments.slice(-3).reverse();

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
      <div className="panel-header">
        <div className="status-dot-live" />
        <span>Commuter Intelligence</span>
      </div>

      {/* Current conditions */}
      <div className="panel p-3">
        <div className="metric-label mb-2">Ahead of You</div>
        {topCongested.slice(0, 3).map(({ seg, state }) => {
          const pred = predictCongestion(seg.id);
          return (
            <motion.div
              key={seg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{seg.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {state.queueLength} vehicles queued · {Math.round(state.speedFactor * 65)} km/h
                </div>
              </div>
              <div className="flex flex-col items-end ml-2">
                <span className={`text-xs font-mono font-bold ${
                  state.congestionLevel > 0.7 ? 'congestion-high' : 
                  state.congestionLevel > 0.4 ? 'congestion-medium' : 'congestion-low'
                }`}>
                  {Math.round(state.congestionLevel * 100)}%
                </span>
                <span className={`text-[9px] font-mono ${
                  pred.risk === 'high' ? 'congestion-high' : 
                  pred.risk === 'medium' ? 'congestion-medium' : 'congestion-low'
                }`}>
                  {state.trend === 'rising' ? '↑ building' : state.trend === 'falling' ? '↓ clearing' : '→ stable'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ETA estimation */}
      <div className="panel p-3">
        <div className="metric-label mb-2">Estimated Wait</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="metric-value text-lg">
              {Math.round(topCongested[0]?.state.queueLength / Math.max(1, topCongested[0]?.state.outflowRate) * 60)}s
            </div>
            <div className="metric-label">Queue Clear Time</div>
          </div>
          <div>
            <div className="metric-value text-lg">
              {Math.round(topCongested[0]?.state.vehicleCount / Math.max(3, topCongested[0]?.state.outflowRate))}m
            </div>
            <div className="metric-label">Reach Front</div>
          </div>
        </div>
      </div>

      {/* Suggested alternatives */}
      <div className="panel p-3">
        <div className="metric-label mb-2">Faster Corridors</div>
        {bestRoutes.map(({ seg, state }) => (
          <div key={seg.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
            <div className="w-2 h-2 rounded-full bg-success" style={{ boxShadow: 'var(--glow-success)' }} />
            <div className="flex-1 text-xs text-foreground truncate">{seg.name}</div>
            <span className="text-xs font-mono congestion-low">{Math.round(state.speedFactor * 65)} km/h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
