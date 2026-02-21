import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { TrafficEngine, type SegmentState, type SensorReading } from '@/lib/traffic-engine';
import { segments } from '@/lib/bengaluru-roads';

export interface CommuterNotification {
  id: string;
  segmentId: string;
  segmentName: string;
  message: string;
  severity: 'warning' | 'danger';
  timestamp: number;
}

interface TrafficContextType {
  states: Map<string, SegmentState>;
  getSensorReading: (sensorId: string, segmentId: string) => SensorReading;
  getHistory: (segmentId: string) => number[];
  predictCongestion: (segmentId: string) => { prediction: number; risk: 'low' | 'medium' | 'high' };
  zoneStats: { totalVehicles: number; avgCongestion: number; hotspots: string[]; gridlockRisk: number };
  tickCount: number;
  notifications: CommuterNotification[];
  dismissNotification: (id: string) => void;
  trafficMode: 'realistic' | 'heavy' | 'light' | 'moderate';
  setTrafficMode: (mode: 'realistic' | 'heavy' | 'light' | 'moderate') => void;
}

const TrafficContext = createContext<TrafficContextType | null>(null);

export function TrafficProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef(new TrafficEngine());
  const [states, setStates] = useState<Map<string, SegmentState>>(engineRef.current.getAllStates());
  const [zoneStats, setZoneStats] = useState(engineRef.current.getZoneStats());
  const [tickCount, setTickCount] = useState(0);
  const [notifications, setNotifications] = useState<CommuterNotification[]>([]);
  const [trafficMode, setTrafficMode] = useState<'realistic' | 'heavy' | 'light' | 'moderate'>('realistic');
  const prevStatesRef = useRef<Map<string, SegmentState>>(new Map());

  // Apply traffic mode to engine
  useEffect(() => {
    engineRef.current.setMode(trafficMode);
  }, [trafficMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newStates = engineRef.current.tick();
      const statesMap = new Map(newStates);
      setStates(statesMap);
      setZoneStats(engineRef.current.getZoneStats());
      setTickCount(c => c + 1);

      // Generate commuter notifications for roads transitioning to heavy
      const newNotifs: CommuterNotification[] = [];
      for (const seg of segments) {
        const curr = statesMap.get(seg.id);
        const prev = prevStatesRef.current.get(seg.id);
        if (!curr) continue;

        // Road becoming heavy (crossing 0.7 threshold while rising)
        if (curr.congestionLevel > 0.65 && curr.trend === 'rising' &&
            prev && prev.congestionLevel <= 0.65) {
          newNotifs.push({
            id: `notif-${seg.id}-${Date.now()}`,
            segmentId: seg.id,
            segmentName: seg.name,
            message: `⚠️ ${seg.name} is getting heavy! Consider alternate route.`,
            severity: 'warning',
            timestamp: Date.now(),
          });
        }

        // Road becoming critical
        if (curr.congestionLevel > 0.8 && curr.trend === 'rising' &&
            prev && prev.congestionLevel <= 0.8) {
          newNotifs.push({
            id: `notif-crit-${seg.id}-${Date.now()}`,
            segmentId: seg.id,
            segmentName: seg.name,
            message: `🔴 ${seg.name} is jammed! Avoid this road.`,
            severity: 'danger',
            timestamp: Date.now(),
          });
        }
      }

      if (newNotifs.length > 0) {
        setNotifications(prev => [...newNotifs, ...prev].slice(0, 20));
      }

      prevStatesRef.current = statesMap;
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

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <TrafficContext.Provider value={{
      states, getSensorReading, getHistory, predictCongestion, zoneStats, tickCount,
      notifications, dismissNotification, trafficMode, setTrafficMode,
    }}>
      {children}
    </TrafficContext.Provider>
  );
}

export function useTraffic() {
  const ctx = useContext(TrafficContext);
  if (!ctx) throw new Error('useTraffic must be used within TrafficProvider');
  return ctx;
}
