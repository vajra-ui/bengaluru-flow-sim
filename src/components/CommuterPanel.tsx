import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

/** Simple colored bar representing a vehicle slot */
function VehicleSlot({ filled, you }: { filled: boolean; you?: boolean }) {
  if (you) {
    return (
      <motion.div
        className="w-3 h-5 rounded-sm bg-primary border border-primary/60 relative"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] font-bold text-primary">YOU</span>
      </motion.div>
    );
  }
  return (
    <div className={`w-3 h-5 rounded-sm ${filled ? 'bg-destructive/70' : 'bg-secondary/40'}`} />
  );
}

/** Visual traffic queue showing cars ahead */
function TrafficQueue({ vehiclesAhead, userPosition, total }: { vehiclesAhead: number; userPosition: number; total: number }) {
  const maxShow = 20;
  const scale = total > maxShow ? maxShow / total : 1;
  const aheadScaled = Math.round(vehiclesAhead * scale);
  const posScaled = Math.min(Math.round(userPosition * scale), maxShow - 1);

  const slots = [];
  for (let i = 0; i < Math.min(total, maxShow); i++) {
    if (i === posScaled) {
      slots.push(<VehicleSlot key={i} filled you />);
    } else {
      slots.push(<VehicleSlot key={i} filled={i < aheadScaled + (i < posScaled ? 0 : 1)} />);
    }
  }

  return (
    <div className="flex items-end gap-[3px] flex-wrap py-2">
      {slots}
      {total > maxShow && (
        <span className="text-[9px] font-mono text-muted-foreground ml-1">+{total - maxShow} more</span>
      )}
    </div>
  );
}

/** Big simple stat */
function BigStat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`text-2xl font-bold font-mono ${color ?? 'text-primary'}`} style={{ textShadow: '0 0 10px hsl(185 80% 50% / 0.3)' }}>
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function CommuterPanel() {
  const { states, predictCongestion } = useTraffic();

  // Pick the nearest congested road (simulating user on the worst nearby road)
  const nearestRoad = useMemo(() => {
    const sorted = [...segments]
      .map(seg => ({ seg, state: states.get(seg.id)! }))
      .filter(s => s.state)
      .sort((a, b) => b.state.congestionLevel - a.state.congestionLevel);
    return sorted[0] ?? null;
  }, [states]);

  const bestAlternates = useMemo(() =>
    [...segments]
      .map(seg => ({ seg, state: states.get(seg.id)! }))
      .filter(s => s.state && s.state.congestionLevel < 0.35)
      .sort((a, b) => a.state.congestionLevel - b.state.congestionLevel)
      .slice(0, 3),
    [states]
  );

  if (!nearestRoad) return null;

  const { seg, state } = nearestRoad;
  const pred = predictCongestion(seg.id);
  const vehiclesAhead = state.queueLength;
  const userPosition = Math.floor(state.queueLength * 0.7 + Math.random() * 5); // simulated position
  const waitMinutes = Math.max(1, Math.round(vehiclesAhead / Math.max(3, state.outflowRate)));
  const speed = Math.round(state.speedFactor * 65);
  const movingChance = Math.max(5, Math.round((1 - state.congestionLevel) * 100));

  const congestionLabel = state.congestionLevel > 0.7 ? 'Heavy Traffic' :
    state.congestionLevel > 0.4 ? 'Moderate Traffic' : 'Light Traffic';
  const congestionColor = state.congestionLevel > 0.7 ? 'congestion-high' :
    state.congestionLevel > 0.4 ? 'congestion-medium' : 'congestion-low';
  const congestionEmoji = state.congestionLevel > 0.7 ? '🔴' : state.congestionLevel > 0.4 ? '🟡' : '🟢';

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Road name & status */}
      <div className="text-center">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">You are on</div>
        <div className="text-sm font-bold text-foreground">{seg.name}</div>
        <div className={`text-lg font-bold mt-1 ${congestionColor}`}>
          {congestionEmoji} {congestionLabel}
        </div>
      </div>

      {/* Visual queue */}
      <div className="panel p-3">
        <div className="text-xs text-muted-foreground mb-1 text-center">🚗 Traffic ahead of you</div>
        <TrafficQueue vehiclesAhead={vehiclesAhead} userPosition={userPosition} total={state.vehicleCount} />
        <div className="text-center text-[11px] text-muted-foreground mt-1">
          <span className="text-foreground font-bold">{vehiclesAhead}</span> vehicles ahead · You are #{userPosition + 1} in line
        </div>
      </div>

      {/* Big stats — the 3 things that matter */}
      <div className="panel p-4">
        <div className="grid grid-cols-3 gap-4">
          <BigStat value={`${waitMinutes}m`} label="Wait Time" color={waitMinutes > 5 ? 'congestion-high' : waitMinutes > 2 ? 'congestion-medium' : 'congestion-low'} />
          <BigStat value={`${speed}`} label="km/h now" color={speed < 15 ? 'congestion-high' : speed < 35 ? 'congestion-medium' : 'congestion-low'} />
          <BigStat value={`${movingChance}%`} label="Will Move" color={movingChance < 30 ? 'congestion-high' : movingChance < 60 ? 'congestion-medium' : 'congestion-low'} />
        </div>
      </div>

      {/* Trend — simple text */}
      <div className="panel p-3 text-center">
        {state.trend === 'rising' && (
          <div className="text-sm">
            <span className="congestion-high font-bold">↑ Getting worse</span>
            <div className="text-[11px] text-muted-foreground mt-1">Traffic is building up. Consider an alternate route.</div>
          </div>
        )}
        {state.trend === 'falling' && (
          <div className="text-sm">
            <span className="congestion-low font-bold">↓ Clearing up</span>
            <div className="text-[11px] text-muted-foreground mt-1">Traffic is easing. You'll move soon.</div>
          </div>
        )}
        {state.trend === 'stable' && (
          <div className="text-sm">
            <span className="text-foreground font-bold">→ Steady</span>
            <div className="text-[11px] text-muted-foreground mt-1">Traffic is holding steady right now.</div>
          </div>
        )}
      </div>

      {/* Faster routes */}
      {bestAlternates.length > 0 && (
        <div className="panel p-3">
          <div className="text-xs text-muted-foreground mb-2 text-center">🛣️ Faster routes nearby</div>
          {bestAlternates.map(({ seg: altSeg, state: altState }) => (
            <motion.div
              key={altSeg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-success" style={{ boxShadow: 'var(--glow-success)' }} />
                <span className="text-xs text-foreground">{altSeg.name}</span>
              </div>
              <span className="text-xs font-bold congestion-low">{Math.round(altState.speedFactor * 65)} km/h</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
