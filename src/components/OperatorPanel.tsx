import { useTraffic } from '@/hooks/useTraffic';
import { sensors } from '@/lib/bengaluru-roads';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function OperatorPanel() {
  const { getSensorReading, tickCount } = useTraffic();
  const [filter, setFilter] = useState<'all' | 'loop' | 'camera' | 'radar'>('all');

  const filteredSensors = filter === 'all' ? sensors : sensors.filter(s => s.type === filter);

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">
      <div className="panel-header">
        <div className="status-dot-live" />
        <span>Sensor Network</span>
        <span className="ml-auto text-primary font-mono">{sensors.length} active</span>
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {(['all', 'loop', 'camera', 'radar'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-[10px] font-mono uppercase rounded transition-colors ${
              filter === f 
                ? 'bg-primary/20 text-primary border border-primary/40' 
                : 'bg-secondary text-muted-foreground border border-transparent hover:border-border'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Sensor list */}
      <div className="flex flex-col gap-1.5">
        {filteredSensors.slice(0, 20).map(sensor => {
          const reading = getSensorReading(sensor.id, sensor.segmentId);
          return (
            <motion.div
              key={sensor.id}
              className="panel p-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`status-dot ${reading.status === 'online' ? 'status-dot-live' : 'bg-accent'}`} />
                <span className="text-[10px] font-mono text-foreground truncate flex-1">{sensor.id}</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">{sensor.type}</span>
              </div>
              <div className="data-grid grid-cols-4 gap-x-2">
                <div>
                  <div className="text-foreground font-semibold">{reading.vehicleCount}</div>
                  <div className="text-muted-foreground">count</div>
                </div>
                <div>
                  <div className="text-foreground font-semibold">{reading.avgSpacing.toFixed(1)}m</div>
                  <div className="text-muted-foreground">space</div>
                </div>
                <div>
                  <div className="text-foreground font-semibold">{reading.speedEstimate.toFixed(0)}</div>
                  <div className="text-muted-foreground">km/h</div>
                </div>
                <div>
                  <div className="text-foreground font-semibold">{reading.queueLength}</div>
                  <div className="text-muted-foreground">queue</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
