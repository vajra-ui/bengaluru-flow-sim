// Women's Safety Navigation Engine - Simulated real-time data
import { type RoadSegment } from './bengaluru-roads';
import { allSegments, allNodes } from './india-roads';

export interface SafetyFactor {
  crowdDensity: number;    // 0-1 (0=empty, 1=overcrowded)
  lighting: number;        // 0-1 (0=dark, 1=well-lit)
  incidentHistory: number; // 0-1 (0=no incidents, 1=frequent)
  policePresence: number;  // 0-1 (0=none, 1=heavy)
  cctvCoverage: number;    // 0-1 (0=none, 1=full)
  timeRisk: number;        // 0-1 based on time of day
}

export interface SafetyScore {
  overall: number;         // 0-100 (100=safest)
  riskIndex: number;       // 0-1 (0=safe, 1=dangerous)
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  factors: SafetyFactor;
}

export interface SafetyIncident {
  id: string;
  segmentId: string;
  type: 'harassment' | 'theft' | 'stalking' | 'poor_lighting' | 'unsafe_area';
  description: string;
  reportedAt: number;
  severity: 'low' | 'medium' | 'high';
}

export interface CrowdRating {
  id: string;
  segmentId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  timestamp: number;
  tags: string[];
}

export interface TransportMode {
  id: string;
  type: 'bus' | 'metro' | 'auto' | 'walking';
  name: string;
  safetyScore: number;
  available: boolean;
  frequency?: string;
  note?: string;
}

export interface SafeRoute {
  segments: string[];
  segmentNames: string[];
  safetyScore: number;
  distance: number; // km
  estimatedTime: number; // minutes
  transportModes: TransportMode[];
  isSafest: boolean;
}

export interface EmergencyContact {
  name: string;
  number: string;
  type: 'police' | 'women_helpline' | 'ambulance' | 'custom';
}

// Static safety profiles per zone (simulated)
const zoneSafetyProfiles: Record<string, Partial<SafetyFactor>> = {
  'majestic': { crowdDensity: 0.85, lighting: 0.6, incidentHistory: 0.5, policePresence: 0.7, cctvCoverage: 0.6 },
  'silk-board': { crowdDensity: 0.9, lighting: 0.5, incidentHistory: 0.4, policePresence: 0.5, cctvCoverage: 0.4 },
  'mg-road': { crowdDensity: 0.7, lighting: 0.9, incidentHistory: 0.2, policePresence: 0.8, cctvCoverage: 0.9 },
  'indiranagar': { crowdDensity: 0.6, lighting: 0.85, incidentHistory: 0.15, policePresence: 0.6, cctvCoverage: 0.7 },
  'koramangala': { crowdDensity: 0.65, lighting: 0.8, incidentHistory: 0.2, policePresence: 0.55, cctvCoverage: 0.65 },
  'electronic-city': { crowdDensity: 0.5, lighting: 0.4, incidentHistory: 0.35, policePresence: 0.3, cctvCoverage: 0.5 },
  'whitefield': { crowdDensity: 0.55, lighting: 0.5, incidentHistory: 0.3, policePresence: 0.4, cctvCoverage: 0.45 },
  'hebbal': { crowdDensity: 0.7, lighting: 0.65, incidentHistory: 0.25, policePresence: 0.6, cctvCoverage: 0.55 },
  'jayanagar': { crowdDensity: 0.5, lighting: 0.75, incidentHistory: 0.1, policePresence: 0.65, cctvCoverage: 0.7 },
  'banashankari': { crowdDensity: 0.45, lighting: 0.6, incidentHistory: 0.2, policePresence: 0.5, cctvCoverage: 0.5 },
  'marathahalli': { crowdDensity: 0.75, lighting: 0.55, incidentHistory: 0.35, policePresence: 0.45, cctvCoverage: 0.4 },
  'kr-puram': { crowdDensity: 0.7, lighting: 0.45, incidentHistory: 0.4, policePresence: 0.4, cctvCoverage: 0.35 },
  'hsr-layout': { crowdDensity: 0.5, lighting: 0.7, incidentHistory: 0.15, policePresence: 0.5, cctvCoverage: 0.6 },
  'btm-layout': { crowdDensity: 0.6, lighting: 0.65, incidentHistory: 0.25, policePresence: 0.45, cctvCoverage: 0.5 },
  'rajajinagar': { crowdDensity: 0.5, lighting: 0.7, incidentHistory: 0.15, policePresence: 0.6, cctvCoverage: 0.6 },
  'bellandur': { crowdDensity: 0.55, lighting: 0.5, incidentHistory: 0.3, policePresence: 0.35, cctvCoverage: 0.4 },
  'yeshwanthpur': { crowdDensity: 0.6, lighting: 0.6, incidentHistory: 0.2, policePresence: 0.55, cctvCoverage: 0.5 },
  'yelahanka': { crowdDensity: 0.4, lighting: 0.55, incidentHistory: 0.2, policePresence: 0.45, cctvCoverage: 0.4 },
  'sarjapur-road': { crowdDensity: 0.45, lighting: 0.45, incidentHistory: 0.3, policePresence: 0.3, cctvCoverage: 0.35 },
  'outer-ring-road-n': { crowdDensity: 0.65, lighting: 0.5, incidentHistory: 0.3, policePresence: 0.4, cctvCoverage: 0.4 },
};

function getTimeRisk(): number {
  const hour = new Date().getHours();
  // Late night (10pm-5am) is highest risk
  if (hour >= 22 || hour < 5) return 0.85;
  // Evening (7pm-10pm) moderate-high
  if (hour >= 19) return 0.55;
  // Early morning (5am-7am) moderate
  if (hour < 7) return 0.4;
  // Peak hours (8am-10am, 5pm-7pm) lower risk (crowds = safety)
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour < 19)) return 0.15;
  // Daytime
  return 0.1;
}

export function getSegmentSafetyScore(segmentId: string): SafetyScore {
  const seg = allSegments.find(s => s.id === segmentId);
  if (!seg) {
    return { overall: 50, riskIndex: 0.5, grade: 'C', label: 'Unknown', factors: { crowdDensity: 0.5, lighting: 0.5, incidentHistory: 0.5, policePresence: 0.5, cctvCoverage: 0.5, timeRisk: 0.5 } };
  }

  // Average safety from both endpoint zones
  const fromProfile = zoneSafetyProfiles[seg.from] ?? {};
  const toProfile = zoneSafetyProfiles[seg.to] ?? {};

  const avg = (a?: number, b?: number, def = 0.5) => ((a ?? def) + (b ?? def)) / 2;
  // Add slight randomness for simulation feel
  const jitter = () => (Math.random() - 0.5) * 0.08;

  const factors: SafetyFactor = {
    crowdDensity: Math.max(0, Math.min(1, avg(fromProfile.crowdDensity, toProfile.crowdDensity) + jitter())),
    lighting: Math.max(0, Math.min(1, avg(fromProfile.lighting, toProfile.lighting) + jitter())),
    incidentHistory: Math.max(0, Math.min(1, avg(fromProfile.incidentHistory, toProfile.incidentHistory) + jitter())),
    policePresence: Math.max(0, Math.min(1, avg(fromProfile.policePresence, toProfile.policePresence) + jitter())),
    cctvCoverage: Math.max(0, Math.min(1, avg(fromProfile.cctvCoverage, toProfile.cctvCoverage) + jitter())),
    timeRisk: getTimeRisk(),
  };

  // Risk index: weighted combination (higher = more dangerous)
  const riskIndex = Math.max(0, Math.min(1,
    factors.crowdDensity * 0.1 +             // crowd can be good or bad
    (1 - factors.lighting) * 0.25 +           // poor lighting = risky
    factors.incidentHistory * 0.25 +          // past incidents matter
    (1 - factors.policePresence) * 0.15 +     // no police = risky
    (1 - factors.cctvCoverage) * 0.1 +        // no cctv = risky
    factors.timeRisk * 0.15                   // late night = risky
  ));

  const overall = Math.round((1 - riskIndex) * 100);
  const grade: SafetyScore['grade'] = overall >= 80 ? 'A' : overall >= 65 ? 'B' : overall >= 50 ? 'C' : overall >= 35 ? 'D' : 'F';
  const label = overall >= 80 ? 'Very Safe' : overall >= 65 ? 'Safe' : overall >= 50 ? 'Moderate' : overall >= 35 ? 'Caution' : 'Unsafe';

  return { overall, riskIndex, grade, label, factors };
}

// Get all segment safety scores (for heatmap)
export function getAllSafetyScores(): Map<string, SafetyScore> {
  const map = new Map<string, SafetyScore>();
  for (const seg of allSegments) {
    map.set(seg.id, getSegmentSafetyScore(seg.id));
  }
  return map;
}

// Mock incidents
export function getRecentIncidents(): SafetyIncident[] {
  const now = Date.now();
  return [
    { id: 'inc-1', segmentId: 'orr-silk-mara', type: 'poor_lighting', description: 'Street lights not working near Silk Board underpass', reportedAt: now - 3600000, severity: 'medium' },
    { id: 'inc-2', segmentId: 'hosur-silk-ec', type: 'harassment', description: 'Verbal harassment reported near toll plaza', reportedAt: now - 7200000, severity: 'high' },
    { id: 'inc-3', segmentId: 'ind-mara', type: 'stalking', description: 'Suspicious person following commuters at bus stop', reportedAt: now - 1800000, severity: 'high' },
    { id: 'inc-4', segmentId: 'mara-whitefield', type: 'unsafe_area', description: 'Deserted stretch with no streetlights after 9 PM', reportedAt: now - 14400000, severity: 'medium' },
    { id: 'inc-5', segmentId: 'bell-road', type: 'theft', description: 'Phone snatching reported near Mekhri Circle', reportedAt: now - 5400000, severity: 'medium' },
    { id: 'inc-6', segmentId: 'kr-puram', type: 'poor_lighting', description: 'Dark underpass area, poor visibility at night', reportedAt: now - 10800000, severity: 'low' },
    { id: 'inc-7', segmentId: 'btm-hsr', type: 'harassment', description: 'Catcalling near bus stop reported multiple times', reportedAt: now - 9000000, severity: 'medium' },
  ];
}

// Mock crowd ratings
export function getMockRatings(): CrowdRating[] {
  const now = Date.now();
  return [
    { id: 'r1', segmentId: 'mg-majestic-ind', userId: 'u1', rating: 4, comment: 'Well-lit, metro nearby, feels safe', timestamp: now - 86400000, tags: ['well-lit', 'metro-access'] },
    { id: 'r2', segmentId: 'orr-silk-mara', userId: 'u2', rating: 2, comment: 'Very crowded, uncomfortable during peak hours', timestamp: now - 172800000, tags: ['crowded', 'peak-hours'] },
    { id: 'r3', segmentId: 'jayanagar-bana', userId: 'u3', rating: 5, comment: 'Residential area, very safe even at night', timestamp: now - 259200000, tags: ['residential', 'safe-night'] },
    { id: 'r4', segmentId: 'hosur-silk-ec', userId: 'u4', rating: 2, comment: 'Dark stretches, avoid after 8 PM alone', timestamp: now - 345600000, tags: ['dark', 'avoid-night'] },
    { id: 'r5', segmentId: 'mara-whitefield', userId: 'u5', rating: 3, comment: 'OK during day, isolated at night', timestamp: now - 432000000, tags: ['daytime-ok', 'isolated-night'] },
    { id: 'r6', segmentId: 'majestic-mg', userId: 'u6', rating: 4, comment: 'Police presence good, CCTV everywhere', timestamp: now - 518400000, tags: ['police', 'cctv'] },
  ];
}

// Transport modes per segment
export function getTransportModes(segmentId: string): TransportMode[] {
  const seg = allSegments.find(s => s.id === segmentId);
  if (!seg) return [];

  const modes: TransportMode[] = [];

  // Metro availability (only certain corridors)
  const metroSegments = ['mg-majestic-ind', 'majestic-mg', 'bell-road', 'majestic-raja', 'majestic-jaya'];
  if (metroSegments.includes(segmentId)) {
    modes.push({ id: `metro-${segmentId}`, type: 'metro', name: 'Namma Metro', safetyScore: 92, available: true, frequency: 'Every 5 min', note: 'CCTV monitored, women-only coach available' });
  }

  // Bus always available
  modes.push({ id: `bus-${segmentId}`, type: 'bus', name: 'BMTC Bus', safetyScore: 70, available: true, frequency: 'Every 10-15 min', note: 'Reserved seats for women. GPS tracked.' });

  // Auto
  modes.push({ id: `auto-${segmentId}`, type: 'auto', name: 'Auto Rickshaw', safetyScore: 55, available: true, note: 'Prefer metered. Share ride details.' });

  // Walking safety varies
  const walkScore = getSegmentSafetyScore(segmentId);
  modes.push({ id: `walk-${segmentId}`, type: 'walking', name: 'Walking', safetyScore: walkScore.overall, available: true, note: walkScore.overall > 65 ? 'Reasonably safe to walk' : 'Avoid walking alone here' });

  return modes.sort((a, b) => b.safetyScore - a.safetyScore);
}

// Find safest route (not shortest) between areas
export function findSafestRoute(fromNodeId: string, toNodeId: string): SafeRoute[] {
  // Simple BFS-based route finding with safety scoring
  const routes: SafeRoute[] = [];

  // Find direct segments
  const direct = allSegments.filter(s =>
    (s.from === fromNodeId && s.to === toNodeId) || (s.to === fromNodeId && s.from === toNodeId)
  );

  for (const seg of direct) {
    const safety = getSegmentSafetyScore(seg.id);
    routes.push({
      segments: [seg.id],
      segmentNames: [seg.name],
      safetyScore: safety.overall,
      distance: seg.path.length * 0.8,
      estimatedTime: Math.round(seg.path.length * 3),
      transportModes: getTransportModes(seg.id),
      isSafest: false,
    });
  }

  // Find 1-hop routes
  const fromSegs = allSegments.filter(s => s.from === fromNodeId || s.to === fromNodeId);
  for (const s1 of fromSegs) {
    const midNode = s1.from === fromNodeId ? s1.to : s1.from;
    const toSegs = allSegments.filter(s => (s.from === midNode && s.to === toNodeId) || (s.to === midNode && s.from === toNodeId));
    for (const s2 of toSegs) {
      const safety1 = getSegmentSafetyScore(s1.id);
      const safety2 = getSegmentSafetyScore(s2.id);
      const avgSafety = Math.round((safety1.overall + safety2.overall) / 2);
      routes.push({
        segments: [s1.id, s2.id],
        segmentNames: [s1.name, s2.name],
        safetyScore: avgSafety,
        distance: (s1.path.length + s2.path.length) * 0.8,
        estimatedTime: Math.round((s1.path.length + s2.path.length) * 3),
        transportModes: getTransportModes(s1.id),
        isSafest: false,
      });
    }
  }

  // Sort by safety (safest first) and mark safest
  routes.sort((a, b) => b.safetyScore - a.safetyScore);
  if (routes.length > 0) routes[0].isSafest = true;

  return routes.slice(0, 5);
}

// Emergency contacts
export const emergencyContacts: EmergencyContact[] = [
  { name: 'Women Helpline', number: '181', type: 'women_helpline' },
  { name: 'Police Emergency', number: '100', type: 'police' },
  { name: 'Ambulance', number: '108', type: 'ambulance' },
  { name: 'Bengaluru City Police', number: '080-22942222', type: 'police' },
];

// Safety color for heatmap
export function safetyColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#84cc16';
  if (score >= 50) return '#eab308';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}
