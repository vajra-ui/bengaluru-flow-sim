import { type SegmentState } from './traffic-engine';
import { segments, getConnectedSegments } from './bengaluru-roads';

export interface TrafficAlert {
  id: string;
  type: 'density_rising' | 'queue_saturation' | 'gridlock_risk' | 'corridor_clearing' | 'spillover';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  segmentId: string;
  segmentName: string;
  timestamp: number;
}

export interface RegulationAction {
  id: string;
  priority: number;
  action: string;
  target: string;
  reason: string;
  type: 'stop_inflow' | 'clear_alternate' | 'coordinate_zone' | 'deploy_officers';
}

export function generateAlerts(states: Map<string, SegmentState>): TrafficAlert[] {
  const alerts: TrafficAlert[] = [];
  const now = Date.now();

  for (const seg of segments) {
    const state = states.get(seg.id);
    if (!state) continue;

    // Density rising alert
    if (state.trend === 'rising' && state.congestionLevel > 0.6) {
      alerts.push({
        id: `density-${seg.id}`,
        type: 'density_rising',
        severity: state.congestionLevel > 0.8 ? 'critical' : 'warning',
        title: 'Road density increasing',
        description: `${seg.name} at ${Math.round(state.congestionLevel * 100)}% — trend rising`,
        segmentId: seg.id,
        segmentName: seg.name,
        timestamp: now,
      });
    }

    // Queue saturation
    if (state.queueLength > seg.capacity * 0.6) {
      alerts.push({
        id: `queue-${seg.id}`,
        type: 'queue_saturation',
        severity: state.queueLength > seg.capacity * 0.8 ? 'critical' : 'warning',
        title: 'Queue saturation risk',
        description: `${state.queueLength} vehicles queued on ${seg.name} (capacity: ${seg.capacity})`,
        segmentId: seg.id,
        segmentName: seg.name,
        timestamp: now,
      });
    }

    // Gridlock propagation
    if (state.congestionLevel > 0.75) {
      const connected = getConnectedSegments(seg.id);
      const congestedNeighbors = connected.filter(cId => {
        const cs = states.get(cId);
        return cs && cs.congestionLevel > 0.6;
      });
      if (congestedNeighbors.length >= 2) {
        alerts.push({
          id: `gridlock-${seg.id}`,
          type: 'gridlock_risk',
          severity: 'critical',
          title: 'Gridlock propagation possible',
          description: `${seg.name} and ${congestedNeighbors.length} connected corridors congested`,
          segmentId: seg.id,
          segmentName: seg.name,
          timestamp: now,
        });
      }
    }

    // Spillover detection
    if (state.congestionLevel > 0.7 && state.inflowRate > state.outflowRate * 1.3) {
      alerts.push({
        id: `spillover-${seg.id}`,
        type: 'spillover',
        severity: 'warning',
        title: 'Alternative corridor needs clearing',
        description: `Inflow exceeds outflow on ${seg.name} — spillover imminent`,
        segmentId: seg.id,
        segmentName: seg.name,
        timestamp: now,
      });
    }
  }

  return alerts.sort((a, b) => (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1));
}

export function generateRegulations(states: Map<string, SegmentState>): RegulationAction[] {
  const actions: RegulationAction[] = [];
  let priority = 1;

  // Find worst segments
  const ranked = segments
    .map(seg => ({ seg, state: states.get(seg.id)! }))
    .filter(s => s.state)
    .sort((a, b) => b.state.congestionLevel - a.state.congestionLevel);

  for (const { seg, state } of ranked.slice(0, 5)) {
    if (state.congestionLevel < 0.6) break;

    // Stop inflow on worst segment
    actions.push({
      id: `stop-${seg.id}`,
      priority: priority++,
      action: `Stop inflow from feeder roads`,
      target: seg.name,
      reason: `${Math.round(state.congestionLevel * 100)}% congested, queue: ${state.queueLength}`,
      type: 'stop_inflow',
    });

    // Find best alternate
    const connected = getConnectedSegments(seg.id);
    const bestAlt = connected
      .map(cId => ({ id: cId, state: states.get(cId) }))
      .filter(c => c.state && c.state.congestionLevel < 0.4)
      .sort((a, b) => (a.state?.congestionLevel ?? 1) - (b.state?.congestionLevel ?? 1))[0];

    if (bestAlt) {
      const altSeg = segments.find(s => s.id === bestAlt.id);
      actions.push({
        id: `clear-${bestAlt.id}`,
        priority: priority++,
        action: `Clear and prioritize alternate corridor`,
        target: altSeg?.name ?? bestAlt.id,
        reason: `Only ${Math.round((bestAlt.state?.congestionLevel ?? 0) * 100)}% utilized — can absorb diverted traffic`,
        type: 'clear_alternate',
      });
    }
  }

  // Zone coordination if many hotspots
  const hotspotCount = ranked.filter(r => r.state.congestionLevel > 0.7).length;
  if (hotspotCount >= 3) {
    actions.push({
      id: 'coordinate-zone',
      priority: priority++,
      action: 'Coordinate neighboring zone officers',
      target: 'Multi-zone',
      reason: `${hotspotCount} hotspots active — risk of N-S / E-W corridor lock`,
      type: 'coordinate_zone',
    });
  }

  if (hotspotCount >= 5) {
    actions.push({
      id: 'deploy-officers',
      priority: priority++,
      action: 'Deploy additional traffic officers',
      target: ranked[0].seg.name,
      reason: `Critical congestion across ${hotspotCount} corridors`,
      type: 'deploy_officers',
    });
  }

  return actions;
}
