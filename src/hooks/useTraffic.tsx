import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { TrafficEngine, type SegmentState, type SensorReading } from '@/lib/traffic-engine';
import { sensors } from '@/lib/bengaluru-roads';

interface TrafficContextType {
  states: Map<string, SegmentState>;
  getSensorReading: (sensorId: string, segmentId: string) => SensorReading;
  getHistory: (segmentId: string) => number[];
  predictCongestion: (segmentId: string) => { prediction: number; risk: 'low' | 'medium' | 'high' };
  zoneStats: { totalVehicles: number; avgCongestion: number; hotspots: string[]; gridlockRisk: number };
  tickCount: number;
}

const TrafficContext = createContext<TrafficContextType | null>(null);

export function TrafficProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef(new TrafficEngine());
  const [states, setStates] = useState<Map<string, SegmentState>>(engineRef.current.getAllStates());
  const [zoneStats, setZoneStats] = useState(engineRef.current.getZoneStats());
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newStates = engineRef.current.tick();
      setStates(new Map(newStates));
      setZoneStats(engineRef.current.getZoneStats());
      setTickCount(c => c + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getSensorReading = useCallback((sensorId: string, segmentId: string) => {
    return engineRef.current.getSensorReading(sensorId, segmentId);
  }, []);

  const getHistory = useCallback((segmentId: string) => {
    return engineRef.current.getHistory(segmentId);
  }, []);

  const predictCongestion = useCallback((segmentId: string) => {
    return engineRef.current.predictCongestion(segmentId);
  }, []);

  return (
    <TrafficContext.Provider value={{ states, getSensorReading, getHistory, predictCongestion, zoneStats, tickCount }}>
      {children}
    </TrafficContext.Provider>
  );
}

export function useTraffic() {
  const ctx = useContext(TrafficContext);
  if (!ctx) throw new Error('useTraffic must be used within TrafficProvider');
  return ctx;
}
