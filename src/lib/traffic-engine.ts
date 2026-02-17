import { segments, getConnectedSegments } from './bengaluru-roads';

export interface SegmentState {
  id: string;
  vehicleCount: number;
  avgSpacing: number; // meters between vehicles
  speedFactor: number; // 0-1, 1 = free flow
  queueLength: number; // vehicles queued
  inflowRate: number;
  outflowRate: number;
  congestionLevel: number; // 0-1
  trend: 'rising' | 'falling' | 'stable';
}

export interface SensorReading {
  sensorId: string;
  segmentId: string;
  vehicleCount: number;
  avgSpacing: number;
  speedEstimate: number; // km/h
  queueLength: number;
  timestamp: number;
  status: 'online' | 'degraded';
}

// Time-of-day pattern (hour -> base congestion multiplier)
function getTimeMultiplier(): number {
  const hour = new Date().getHours();
  // Simulate Bengaluru peaks: 8-10 AM and 5-8 PM
  const patterns: Record<number, number> = {
    0: 0.1, 1: 0.08, 2: 0.05, 3: 0.05, 4: 0.08, 5: 0.15,
    6: 0.3, 7: 0.55, 8: 0.85, 9: 0.95, 10: 0.75, 11: 0.6,
    12: 0.55, 13: 0.5, 14: 0.5, 15: 0.55, 16: 0.65, 17: 0.9,
    18: 0.95, 19: 0.85, 20: 0.6, 21: 0.4, 22: 0.25, 23: 0.15,
  };
  return patterns[hour] ?? 0.5;
}

// Corridor-specific base congestion (ORR and Hosur road are worst)
const corridorWeights: Record<string, number> = {
  'orr-silk-mara': 1.0,
  'orr-mara-krp': 0.9,
  'hosur-silk-ec': 0.95,
  'bell-road': 0.85,
  'mg-majestic-ind': 0.7,
  'ind-mara': 0.8,
  'mara-whitefield': 0.75,
};

export class TrafficEngine {
  private states: Map<string, SegmentState> = new Map();
  private history: Map<string, number[]> = new Map(); // last 60 congestion values
  private tickCount = 0;
  private mode: 'realistic' | 'heavy' | 'light' | 'moderate' = 'realistic';

  setMode(mode: 'realistic' | 'heavy' | 'light' | 'moderate') {
    this.mode = mode;
  }

  private getModeMultiplier(): number {
    switch (this.mode) {
      case 'heavy': return 1.8;
      case 'light': return 0.3;
      case 'moderate': return 0.7;
      default: return 1.0;
    }
  }

  constructor() {
    // Initialize all segments
    for (const seg of segments) {
      const baseCongestion = (corridorWeights[seg.id] ?? 0.5) * getTimeMultiplier();
      const vehicleCount = Math.floor(baseCongestion * seg.capacity * (0.6 + Math.random() * 0.4));
      const congestion = vehicleCount / seg.capacity;
      
      this.states.set(seg.id, {
        id: seg.id,
        vehicleCount,
        avgSpacing: Math.max(2, 50 * (1 - congestion)),
        speedFactor: Math.max(0.05, 1 - congestion * 0.9),
        queueLength: Math.floor(vehicleCount * congestion * 0.3),
        inflowRate: Math.floor(10 + Math.random() * 20),
        outflowRate: Math.floor(10 + Math.random() * 20),
        congestionLevel: Math.min(1, congestion),
        trend: 'stable',
      });
      this.history.set(seg.id, [congestion]);
    }
  }

  tick(): Map<string, SegmentState> {
    this.tickCount++;
    const timeMult = getTimeMultiplier() * this.getModeMultiplier();
    
    // Store previous for trend calculation
    const prevCongestions = new Map<string, number>();
    this.states.forEach((s, id) => prevCongestions.set(id, s.congestionLevel));

    for (const seg of segments) {
      const state = this.states.get(seg.id)!;
      const baseWeight = corridorWeights[seg.id] ?? 0.5;
      
      // Random perturbation (signal cycles, etc.)
      const signalPulse = Math.sin(this.tickCount * 0.15 + seg.id.length) * 0.08;
      const randomNoise = (Math.random() - 0.5) * 0.06;
      
      // Wave propagation from connected segments
      const connected = getConnectedSegments(seg.id);
      let spillover = 0;
      for (const cId of connected) {
        const cState = this.states.get(cId);
        if (cState && cState.congestionLevel > 0.7) {
          spillover += (cState.congestionLevel - 0.7) * 0.15;
        }
      }
      
      // Target congestion
      const target = Math.min(1, Math.max(0, 
        baseWeight * timeMult + signalPulse + randomNoise + spillover
      ));
      
      // Smooth transition (inertia)
      const newCongestion = state.congestionLevel * 0.85 + target * 0.15;
      const clampedCongestion = Math.min(1, Math.max(0, newCongestion));
      
      // Derive other metrics
      const vehicleCount = Math.floor(clampedCongestion * seg.capacity);
      const speedFactor = Math.max(0.03, 1 - clampedCongestion * 0.95);
      
      // Inflow/outflow
      const inflow = Math.floor((10 + baseWeight * 25) * timeMult * (0.7 + Math.random() * 0.6));
      const outflow = Math.floor(inflow * speedFactor * (0.8 + Math.random() * 0.4));

      state.vehicleCount = vehicleCount;
      state.avgSpacing = Math.max(1.5, 60 * (1 - clampedCongestion));
      state.speedFactor = speedFactor;
      state.queueLength = Math.floor(vehicleCount * clampedCongestion * 0.4);
      state.inflowRate = inflow;
      state.outflowRate = outflow;
      state.congestionLevel = clampedCongestion;
      
      // Trend
      const prev = prevCongestions.get(seg.id) ?? clampedCongestion;
      const diff = clampedCongestion - prev;
      state.trend = diff > 0.02 ? 'rising' : diff < -0.02 ? 'falling' : 'stable';
      
      // History
      const hist = this.history.get(seg.id)!;
      hist.push(clampedCongestion);
      if (hist.length > 60) hist.shift();
    }
    
    return this.states;
  }

  getState(segmentId: string): SegmentState | undefined {
    return this.states.get(segmentId);
  }

  getAllStates(): Map<string, SegmentState> {
    return this.states;
  }

  getHistory(segmentId: string): number[] {
    return this.history.get(segmentId) ?? [];
  }

  getSensorReading(sensorId: string, segmentId: string): SensorReading {
    const state = this.states.get(segmentId);
    const noise = () => (Math.random() - 0.5) * 0.1;
    if (!state) {
      return {
        sensorId, segmentId,
        vehicleCount: 0, avgSpacing: 50, speedEstimate: 60,
        queueLength: 0, timestamp: Date.now(), status: 'online',
      };
    }
    return {
      sensorId,
      segmentId,
      vehicleCount: Math.max(0, state.vehicleCount + Math.floor(noise() * 10)),
      avgSpacing: Math.max(1, state.avgSpacing + noise() * 5),
      speedEstimate: Math.max(2, state.speedFactor * 65 + noise() * 8),
      queueLength: Math.max(0, state.queueLength + Math.floor(noise() * 5)),
      timestamp: Date.now(),
      status: Math.random() > 0.02 ? 'online' : 'degraded',
    };
  }

  // Predict congestion 5-10 minutes ahead based on recent trend
  predictCongestion(segmentId: string): { prediction: number; risk: 'low' | 'medium' | 'high' } {
    const hist = this.history.get(segmentId) ?? [];
    if (hist.length < 5) return { prediction: 0.5, risk: 'medium' };
    
    const recent = hist.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const trend = recent[recent.length - 1] - recent[0];
    const prediction = Math.min(1, Math.max(0, avg + trend * 2));
    
    return {
      prediction,
      risk: prediction > 0.8 ? 'high' : prediction > 0.5 ? 'medium' : 'low',
    };
  }

  // Zone-level aggregation for authority view
  getZoneStats(): { totalVehicles: number; avgCongestion: number; hotspots: string[]; gridlockRisk: number } {
    let totalVehicles = 0;
    let totalCongestion = 0;
    const hotspots: string[] = [];
    
    this.states.forEach((state, id) => {
      totalVehicles += state.vehicleCount;
      totalCongestion += state.congestionLevel;
      if (state.congestionLevel > 0.75) {
        const seg = segments.find(s => s.id === id);
        if (seg) hotspots.push(seg.name);
      }
    });
    
    const avgCongestion = totalCongestion / this.states.size;
    const gridlockRisk = Math.min(1, hotspots.length / 5);
    
    return { totalVehicles, avgCongestion, hotspots, gridlockRisk };
  }
}
