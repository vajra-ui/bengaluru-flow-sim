import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Navigation, Clock, Gauge, TrendingDown } from 'lucide-react';

export default function CommuterPanel() {
  const { states, predictCongestion } = useTraffic();

  const sortedSegments = useMemo(() =>
    [...segments]
      .map(seg => ({ seg, state: states.get(seg.id)! }))
      .filter(s => s.state)
      .sort((a, b) => b.state.congestionLevel - a.state.congestionLevel),
    [states]
  );

  const topCongested = sortedSegments.slice(0, 5);
  const bestRoutes = sortedSegments.filter(s => s.state.congestionLevel < 0.35).slice(-5).reverse();

  // Movement probability: inverse of congestion
  const movementProb = (congestion: number) => Math.max(5, Math.round((1 - congestion) * 100));

  // Time to clear queue (seconds)
  const queueClearTime = (state: { queueLength: number; outflowRate: number }) =>
    Math.round(state.queueLength / Math.max(1, state.outflowRate) * 60);

  // Time to reach front (minutes)
  const reachFrontTime = (state: { vehicleCount: number; outflowRate: number }) =>
    Math.round(state.vehicleCount / Math.max(3, state.outflowRate));

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
      <div className="panel-header">
        <div className="status-dot-live" />
        <span>Commuter Intelligence</span>
      </div>

      {/* What's ahead */}
      <div className="panel p-3">
        <div className="metric-label mb-2 flex items-center gap-2">
          <Gauge className="w-3 h-3 text-primary" />
          Ahead of You
        </div>
        {topCongested.slice(0, 4).map(({ seg, state }) => {
          const pred = predictCongestion(seg.id);
          const prob = movementProb(state.congestionLevel);
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
                  {state.vehicleCount} vehicles · {state.queueLength} queued · {state.avgSpacing.toFixed(0)}m spacing
                </div>
                <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                  Movement: <span className={prob > 60 ? 'congestion-low' : prob > 30 ? 'congestion-medium' : 'congestion-high'}>{prob}%</span>
                  {' · '}Speed: {Math.round(state.speedFactor * 65)} km/h
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

      {/* ETA & Wait */}
      <div className="panel p-3">
        <div className="metric-label mb-2 flex items-center gap-2">
          <Clock className="w-3 h-3 text-primary" />
          Estimated Wait
        </div>
        {topCongested[0] && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="metric-value text-lg">{queueClearTime(topCongested[0].state)}s</div>
              <div className="metric-label">Queue Clear</div>
            </div>
            <div>
              <div className="metric-value text-lg">{reachFrontTime(topCongested[0].state)}m</div>
              <div className="metric-label">Reach Front</div>
            </div>
            <div>
              <div className="metric-value text-lg">{movementProb(topCongested[0].state.congestionLevel)}%</div>
              <div className="metric-label">Move Prob</div>
            </div>
          </div>
        )}
        {topCongested[0] && (
          <div className="mt-2 text-[9px] font-mono text-muted-foreground">
            Worst corridor: {topCongested[0].seg.name} — {topCongested[0].state.vehicleCount} vehicles, {topCongested[0].state.queueLength} in queue
          </div>
        )}
      </div>

      {/* Faster alternatives */}
      <div className="panel p-3">
        <div className="metric-label mb-2 flex items-center gap-2">
          <Navigation className="w-3 h-3 text-success" />
          Faster Corridors
        </div>
        {bestRoutes.length === 0 && (
          <div className="text-[10px] font-mono text-muted-foreground">No significantly faster routes available</div>
        )}
        {bestRoutes.map(({ seg, state }) => (
          <motion.div
            key={seg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-1.5 border-b border-border last:border-0"
          >
            <div className="w-2 h-2 rounded-full bg-success" style={{ boxShadow: 'var(--glow-success)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground truncate">{seg.name}</div>
              <div className="text-[9px] font-mono text-muted-foreground">
                {movementProb(state.congestionLevel)}% movement · {state.avgSpacing.toFixed(0)}m spacing
              </div>
            </div>
            <span className="text-xs font-mono congestion-low">{Math.round(state.speedFactor * 65)} km/h</span>
          </motion.div>
        ))}
      </div>

      {/* Trend outlook */}
      <div className="panel p-3">
        <div className="metric-label mb-2 flex items-center gap-2">
          <TrendingDown className="w-3 h-3 text-accent" />
          Clearing Soon
        </div>
        {sortedSegments
          .filter(s => s.state.trend === 'falling' && s.state.congestionLevel > 0.3)
          .slice(0, 3)
          .map(({ seg, state }) => (
            <div key={seg.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <div className="text-[10px] font-mono text-foreground truncate flex-1">{seg.name}</div>
              <span className="text-[9px] font-mono congestion-low">↓ {Math.round(state.congestionLevel * 100)}%</span>
            </div>
          ))}
        {sortedSegments.filter(s => s.state.trend === 'falling' && s.state.congestionLevel > 0.3).length === 0 && (
          <div className="text-[10px] font-mono text-muted-foreground">No corridors currently clearing</div>
        )}
      </div>
    </div>
  );
}
