import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import trafficScene from '@/assets/traffic-scene.png';

/** Visual road lane with car icons showing position */
function RoadView({ vehiclesAhead, userPosition, total }: { vehiclesAhead: number; userPosition: number; total: number }) {
  const maxCars = 12;
  const scale = total > maxCars ? maxCars / total : 1;
  const ahead = Math.min(Math.round(vehiclesAhead * scale), maxCars - 1);
  const pos = Math.min(Math.round(userPosition * scale), maxCars - 1);

  const cars = [];
  for (let i = 0; i < Math.min(total, maxCars); i++) {
    const isYou = i === pos;
    const isAhead = i < pos;
    cars.push(
      <motion.div
        key={i}
        className={`relative flex flex-col items-center ${isYou ? 'z-10' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
      >
        {isYou && (
          <motion.div
            className="absolute -top-6 text-[8px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full border border-primary/40"
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            YOU
          </motion.div>
        )}
        <div className={`text-lg ${isYou ? '' : ''}`}>
          {isYou ? '🚙' : isAhead ? '🚗' : '🚗'}
        </div>
        {isYou && (
          <div className="text-[8px] font-mono text-primary font-bold">#{userPosition + 1}</div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      {/* Road background */}
      <div className="bg-[hsl(220,15%,12%)] rounded-lg p-3 border border-border">
        {/* Lane markings */}
        <div className="flex items-center gap-2 py-1 border-t border-dashed border-muted-foreground/20 border-b">
          <div className="text-[8px] font-mono text-muted-foreground/40 mr-1">◀</div>
          <div className="flex items-center gap-3 flex-wrap justify-center flex-1 py-2">
            {cars}
          </div>
          <div className="text-[8px] font-mono text-muted-foreground/40 ml-1">▶</div>
        </div>
        {total > maxCars && (
          <div className="text-center text-[9px] font-mono text-muted-foreground mt-1">
            +{total - maxCars} more vehicles on this road
          </div>
        )}
      </div>
    </div>
  );
}

/** Big simple number */
function BigNumber({ value, label, sublabel, color }: { value: string; label: string; sublabel?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center text-center p-2">
      <div className={`text-3xl font-bold font-mono ${color ?? 'text-primary'}`} style={{ textShadow: '0 0 12px hsl(185 80% 50% / 0.3)' }}>
        {value}
      </div>
      <div className="text-xs text-foreground font-medium mt-1">{label}</div>
      {sublabel && <div className="text-[10px] text-muted-foreground">{sublabel}</div>}
    </div>
  );
}

export default function CommuterPanel() {
  const { states, predictCongestion } = useTraffic();

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
  const vehiclesAhead = state.queueLength;
  const userPosition = Math.max(1, Math.floor(state.queueLength * 0.65));
  const speed = Math.round(state.speedFactor * 65);

  // Time to reach position #1 in minutes
  const timeToFront = Math.max(1, Math.round(userPosition / Math.max(2, state.outflowRate)));
  const timeLabel = timeToFront >= 60 ? `${Math.round(timeToFront / 60)}h ${timeToFront % 60}m` : `${timeToFront} min`;

  const congestionLevel = state.congestionLevel;
  const statusEmoji = congestionLevel > 0.7 ? '🔴' : congestionLevel > 0.4 ? '🟡' : '🟢';
  const statusText = congestionLevel > 0.7 ? 'Heavy Traffic' : congestionLevel > 0.4 ? 'Slow Moving' : 'Moving Well';
  const statusColor = congestionLevel > 0.7 ? 'congestion-high' : congestionLevel > 0.4 ? 'congestion-medium' : 'congestion-low';

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
      {/* Traffic image */}
      <div className="relative rounded-lg overflow-hidden h-28 shrink-0">
        <img src={trafficScene} alt="Live traffic" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">You are on</div>
          <div className="text-sm font-bold text-foreground truncate">{seg.name}</div>
        </div>
        <div className="absolute top-2 right-2">
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor} bg-background/80 backdrop-blur-sm`}>
            {statusEmoji} {statusText}
          </div>
        </div>
      </div>

      {/* Visual road with cars */}
      <RoadView vehiclesAhead={vehiclesAhead} userPosition={userPosition} total={state.vehicleCount} />

      {/* Key info — vehicles ahead + time to reach #1 */}
      <div className="panel p-3">
        <div className="grid grid-cols-2 gap-2">
          <BigNumber
            value={`${vehiclesAhead}`}
            label="Vehicles Ahead"
            sublabel="in your lane"
            color={vehiclesAhead > 50 ? 'congestion-high' : vehiclesAhead > 20 ? 'congestion-medium' : 'congestion-low'}
          />
          <BigNumber
            value={timeLabel}
            label="To Reach #1"
            sublabel="estimated wait"
            color={timeToFront > 10 ? 'congestion-high' : timeToFront > 4 ? 'congestion-medium' : 'congestion-low'}
          />
        </div>
      </div>

      {/* Your position + speed */}
      <div className="panel p-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xl font-bold font-mono text-primary">#{userPosition}</div>
            <div className="text-[10px] text-muted-foreground">Your Position</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold font-mono ${speed < 15 ? 'congestion-high' : speed < 35 ? 'congestion-medium' : 'congestion-low'}`}>{speed}</div>
            <div className="text-[10px] text-muted-foreground">km/h</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold font-mono ${statusColor}`}>{Math.round(congestionLevel * 100)}%</div>
            <div className="text-[10px] text-muted-foreground">Congestion</div>
          </div>
        </div>
      </div>

      {/* Simple trend */}
      <div className="panel p-3 text-center">
        {state.trend === 'rising' ? (
          <>
            <div className="text-sm font-bold congestion-high">↑ Traffic Building Up</div>
            <div className="text-[11px] text-muted-foreground mt-1">Wait time may increase. Try a faster route below.</div>
          </>
        ) : state.trend === 'falling' ? (
          <>
            <div className="text-sm font-bold congestion-low">↓ Traffic Clearing</div>
            <div className="text-[11px] text-muted-foreground mt-1">You'll move faster soon. Hang tight!</div>
          </>
        ) : (
          <>
            <div className="text-sm font-bold text-foreground">→ Steady Flow</div>
            <div className="text-[11px] text-muted-foreground mt-1">Traffic is holding at current pace.</div>
          </>
        )}
      </div>

      {/* Faster routes */}
      {bestAlternates.length > 0 && (
        <div className="panel p-3">
          <div className="text-xs text-muted-foreground mb-2 text-center">🛣️ Faster Routes</div>
          {bestAlternates.map(({ seg: altSeg, state: altState }) => (
            <div key={altSeg.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-success" style={{ boxShadow: 'var(--glow-success)' }} />
                <span className="text-xs text-foreground">{altSeg.name}</span>
              </div>
              <span className="text-xs font-bold congestion-low">{Math.round(altState.speedFactor * 65)} km/h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
