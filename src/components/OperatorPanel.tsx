import { useTraffic } from '@/hooks/useTraffic';
import { sensors } from '@/lib/bengaluru-roads';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';

/** Simple gauge bar */
function GaugeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}

function SensorCard({ sensorId, segmentId, type }: { sensorId: string; segmentId: string; type: string }) {
  const { getSensorReading } = useTraffic();
  const reading = getSensorReading(sensorId, segmentId);

  const isOnline = reading.status === 'online';
  const speedColor = reading.speedEstimate > 40 ? 'bg-success' : reading.speedEstimate > 20 ? 'bg-accent' : 'bg-destructive';
  const typeEmoji = type === 'camera' ? '📷' : type === 'radar' ? '📡' : '🔄';

  return (
    <div className="panel p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{typeEmoji}</span>
          <span className="text-xs font-medium text-foreground">{sensorId}</span>
        </div>
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-success" />
          ) : (
            <WifiOff className="w-3 h-3 text-destructive" />
          )}
          <span className={`text-[9px] font-bold ${isOnline ? 'congestion-low' : 'congestion-high'}`}>
            {isOnline ? 'LIVE' : 'WEAK'}
          </span>
        </div>
      </div>

      {/* Simple metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-lg font-bold font-mono text-foreground">{reading.vehicleCount}</div>
          <div className="text-[10px] text-muted-foreground">🚗 Vehicles</div>
        </div>
        <div>
          <div className="text-lg font-bold font-mono text-foreground">{reading.speedEstimate.toFixed(0)}</div>
          <div className="text-[10px] text-muted-foreground">⚡ km/h</div>
        </div>
      </div>

      {/* Speed gauge */}
      <div className="mt-2">
        <GaugeBar value={reading.speedEstimate} max={65} color={speedColor} />
      </div>

      {/* Bottom row */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>Spacing: {reading.avgSpacing.toFixed(0)}m</span>
        <span>Queue: {reading.queueLength}</span>
      </div>
    </div>
  );
}

export default function OperatorPanel() {
  const { tickCount } = useTraffic();
  const [filter, setFilter] = useState<'all' | 'loop' | 'camera' | 'radar'>('all');

  const filteredSensors = useMemo(() =>
    filter === 'all' ? sensors : sensors.filter(s => s.type === filter),
    [filter]
  );

  const onlineCount = sensors.length; // simulated — mostly online
  const filters = [
    { id: 'all' as const, label: '📋 All', count: sensors.length },
    { id: 'camera' as const, label: '📷 Camera', count: sensors.filter(s => s.type === 'camera').length },
    { id: 'radar' as const, label: '📡 Radar', count: sensors.filter(s => s.type === 'radar').length },
    { id: 'loop' as const, label: '🔄 Loop', count: sensors.filter(s => s.type === 'loop').length },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Sensor Network</span>
          <div className="status-dot-live ml-auto" />
          <span className="text-[10px] font-mono text-muted-foreground">LIVE</span>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center panel p-2">
            <div className="text-lg font-bold font-mono text-primary">{sensors.length}</div>
            <div className="text-[9px] text-muted-foreground">Total</div>
          </div>
          <div className="text-center panel p-2">
            <div className="text-lg font-bold font-mono congestion-low">{onlineCount}</div>
            <div className="text-[9px] text-muted-foreground">Online</div>
          </div>
          <div className="text-center panel p-2">
            <div className="text-lg font-bold font-mono text-foreground">T+{tickCount * 2}s</div>
            <div className="text-[9px] text-muted-foreground">Uptime</div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 px-2 py-1.5 text-[10px] rounded-lg transition-colors text-center ${
                filter === f.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-secondary/50 text-muted-foreground border border-transparent hover:border-border'
              }`}
            >
              {f.label}
              <div className="text-[8px] opacity-60">{f.count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sensor list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filteredSensors.slice(0, 15).map((sensor, i) => (
          <motion.div
            key={sensor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <SensorCard sensorId={sensor.id} segmentId={sensor.segmentId} type={sensor.type} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
