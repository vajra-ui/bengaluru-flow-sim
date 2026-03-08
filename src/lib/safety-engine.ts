// Women's Safety Navigation Engine - Tamil Nadu focused
import { allSegments, allNodes } from './tamilnadu-roads';

export interface SafetyFactor {
  crowdDensity: number;
  lighting: number;
  incidentHistory: number;
  policePresence: number;
  cctvCoverage: number;
  timeRisk: number;
}

export interface SafetyScore {
  overall: number;
  riskIndex: number;
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
  rating: number;
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
  distance: number;
  estimatedTime: number;
  transportModes: TransportMode[];
  isSafest: boolean;
}

export interface EmergencyContact {
  name: string;
  number: string;
  type: 'police' | 'women_helpline' | 'ambulance' | 'custom';
}

// Tamil Nadu zone safety profiles
const zoneSafetyProfiles: Record<string, Partial<SafetyFactor>> = {
  'chennai-central': { crowdDensity: 0.85, lighting: 0.7, incidentHistory: 0.4, policePresence: 0.8, cctvCoverage: 0.7 },
  'chennai-egmore': { crowdDensity: 0.75, lighting: 0.75, incidentHistory: 0.3, policePresence: 0.7, cctvCoverage: 0.65 },
  'chennai-tnagar': { crowdDensity: 0.8, lighting: 0.85, incidentHistory: 0.25, policePresence: 0.75, cctvCoverage: 0.8 },
  'chennai-adyar': { crowdDensity: 0.55, lighting: 0.8, incidentHistory: 0.15, policePresence: 0.6, cctvCoverage: 0.7 },
  'chennai-anna-nagar': { crowdDensity: 0.6, lighting: 0.85, incidentHistory: 0.1, policePresence: 0.65, cctvCoverage: 0.75 },
  'chennai-tambaram': { crowdDensity: 0.7, lighting: 0.5, incidentHistory: 0.35, policePresence: 0.5, cctvCoverage: 0.4 },
  'chennai-omr': { crowdDensity: 0.65, lighting: 0.6, incidentHistory: 0.3, policePresence: 0.45, cctvCoverage: 0.5 },
  'chennai-velachery': { crowdDensity: 0.7, lighting: 0.65, incidentHistory: 0.25, policePresence: 0.55, cctvCoverage: 0.6 },
  'chennai-guindy': { crowdDensity: 0.75, lighting: 0.7, incidentHistory: 0.2, policePresence: 0.65, cctvCoverage: 0.65 },
  'chennai-ambattur': { crowdDensity: 0.65, lighting: 0.55, incidentHistory: 0.35, policePresence: 0.5, cctvCoverage: 0.45 },
  'chennai-avadi': { crowdDensity: 0.5, lighting: 0.5, incidentHistory: 0.3, policePresence: 0.55, cctvCoverage: 0.4 },
  'chennai-porur': { crowdDensity: 0.6, lighting: 0.6, incidentHistory: 0.25, policePresence: 0.5, cctvCoverage: 0.5 },
  'chennai-sholinganallur': { crowdDensity: 0.55, lighting: 0.55, incidentHistory: 0.3, policePresence: 0.4, cctvCoverage: 0.45 },
  'chennai-perungudi': { crowdDensity: 0.6, lighting: 0.6, incidentHistory: 0.2, policePresence: 0.5, cctvCoverage: 0.55 },
  'chennai-chromepet': { crowdDensity: 0.65, lighting: 0.55, incidentHistory: 0.3, policePresence: 0.5, cctvCoverage: 0.45 },
  'chennai-mahabalipuram': { crowdDensity: 0.3, lighting: 0.35, incidentHistory: 0.2, policePresence: 0.3, cctvCoverage: 0.25 },
  'cbe-junction': { crowdDensity: 0.8, lighting: 0.7, incidentHistory: 0.25, policePresence: 0.7, cctvCoverage: 0.6 },
  'cbe-gandhipuram': { crowdDensity: 0.85, lighting: 0.75, incidentHistory: 0.3, policePresence: 0.65, cctvCoverage: 0.65 },
  'cbe-rs-puram': { crowdDensity: 0.5, lighting: 0.8, incidentHistory: 0.1, policePresence: 0.6, cctvCoverage: 0.7 },
  'cbe-peelamedu': { crowdDensity: 0.6, lighting: 0.65, incidentHistory: 0.2, policePresence: 0.5, cctvCoverage: 0.55 },
  'cbe-singanallur': { crowdDensity: 0.65, lighting: 0.55, incidentHistory: 0.3, policePresence: 0.45, cctvCoverage: 0.45 },
  'cbe-saravanampatti': { crowdDensity: 0.45, lighting: 0.5, incidentHistory: 0.2, policePresence: 0.4, cctvCoverage: 0.4 },
  'mdu-meenakshi': { crowdDensity: 0.9, lighting: 0.65, incidentHistory: 0.35, policePresence: 0.7, cctvCoverage: 0.55 },
  'mdu-periyar': { crowdDensity: 0.85, lighting: 0.6, incidentHistory: 0.4, policePresence: 0.6, cctvCoverage: 0.5 },
  'mdu-anna-nagar': { crowdDensity: 0.5, lighting: 0.65, incidentHistory: 0.2, policePresence: 0.5, cctvCoverage: 0.5 },
  'mdu-thirunagar': { crowdDensity: 0.55, lighting: 0.5, incidentHistory: 0.3, policePresence: 0.4, cctvCoverage: 0.35 },
  'mdu-mattuthavani': { crowdDensity: 0.75, lighting: 0.5, incidentHistory: 0.35, policePresence: 0.5, cctvCoverage: 0.4 },
  'trichy-junction': { crowdDensity: 0.75, lighting: 0.65, incidentHistory: 0.25, policePresence: 0.65, cctvCoverage: 0.55 },
  'trichy-srirangam': { crowdDensity: 0.6, lighting: 0.6, incidentHistory: 0.15, policePresence: 0.55, cctvCoverage: 0.5 },
  'trichy-thillai-nagar': { crowdDensity: 0.5, lighting: 0.7, incidentHistory: 0.1, policePresence: 0.5, cctvCoverage: 0.6 },
  'trichy-cantonment': { crowdDensity: 0.55, lighting: 0.65, incidentHistory: 0.15, policePresence: 0.7, cctvCoverage: 0.6 },
  'salem-junction': { crowdDensity: 0.7, lighting: 0.6, incidentHistory: 0.3, policePresence: 0.6, cctvCoverage: 0.5 },
  'salem-five-roads': { crowdDensity: 0.65, lighting: 0.55, incidentHistory: 0.25, policePresence: 0.5, cctvCoverage: 0.45 },
  'salem-omalur': { crowdDensity: 0.35, lighting: 0.4, incidentHistory: 0.2, policePresence: 0.35, cctvCoverage: 0.3 },
  'tvl-junction': { crowdDensity: 0.6, lighting: 0.6, incidentHistory: 0.2, policePresence: 0.6, cctvCoverage: 0.5 },
  'tvl-palayamkottai': { crowdDensity: 0.5, lighting: 0.55, incidentHistory: 0.15, policePresence: 0.5, cctvCoverage: 0.45 },
  'tvl-melapalayam': { crowdDensity: 0.55, lighting: 0.45, incidentHistory: 0.25, policePresence: 0.4, cctvCoverage: 0.35 },
  'vellore-fort': { crowdDensity: 0.6, lighting: 0.6, incidentHistory: 0.2, policePresence: 0.6, cctvCoverage: 0.55 },
  'vellore-katpadi': { crowdDensity: 0.7, lighting: 0.55, incidentHistory: 0.3, policePresence: 0.55, cctvCoverage: 0.45 },
  'villupuram': { crowdDensity: 0.55, lighting: 0.5, incidentHistory: 0.25, policePresence: 0.5, cctvCoverage: 0.4 },
  'krishnagiri': { crowdDensity: 0.5, lighting: 0.5, incidentHistory: 0.2, policePresence: 0.5, cctvCoverage: 0.4 },
  'dindigul': { crowdDensity: 0.55, lighting: 0.55, incidentHistory: 0.2, policePresence: 0.5, cctvCoverage: 0.45 },
  'erode': { crowdDensity: 0.6, lighting: 0.6, incidentHistory: 0.2, policePresence: 0.55, cctvCoverage: 0.5 },
  'karur': { crowdDensity: 0.5, lighting: 0.5, incidentHistory: 0.2, policePresence: 0.45, cctvCoverage: 0.4 },
  'thanjavur': { crowdDensity: 0.55, lighting: 0.6, incidentHistory: 0.15, policePresence: 0.55, cctvCoverage: 0.5 },
  'kanchipuram': { crowdDensity: 0.6, lighting: 0.55, incidentHistory: 0.2, policePresence: 0.55, cctvCoverage: 0.45 },
  'hosur': { crowdDensity: 0.55, lighting: 0.55, incidentHistory: 0.2, policePresence: 0.5, cctvCoverage: 0.45 },
};

function getTimeRisk(): number {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) return 0.85;
  if (hour >= 19) return 0.55;
  if (hour < 7) return 0.4;
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour < 19)) return 0.15;
  return 0.1;
}

export function getSegmentSafetyScore(segmentId: string): SafetyScore {
  const seg = allSegments.find(s => s.id === segmentId);
  if (!seg) {
    return { overall: 50, riskIndex: 0.5, grade: 'C', label: 'Unknown', factors: { crowdDensity: 0.5, lighting: 0.5, incidentHistory: 0.5, policePresence: 0.5, cctvCoverage: 0.5, timeRisk: 0.5 } };
  }

  const fromProfile = zoneSafetyProfiles[seg.from] ?? {};
  const toProfile = zoneSafetyProfiles[seg.to] ?? {};
  const avg = (a?: number, b?: number, def = 0.5) => ((a ?? def) + (b ?? def)) / 2;
  const jitter = () => (Math.random() - 0.5) * 0.08;

  const factors: SafetyFactor = {
    crowdDensity: Math.max(0, Math.min(1, avg(fromProfile.crowdDensity, toProfile.crowdDensity) + jitter())),
    lighting: Math.max(0, Math.min(1, avg(fromProfile.lighting, toProfile.lighting) + jitter())),
    incidentHistory: Math.max(0, Math.min(1, avg(fromProfile.incidentHistory, toProfile.incidentHistory) + jitter())),
    policePresence: Math.max(0, Math.min(1, avg(fromProfile.policePresence, toProfile.policePresence) + jitter())),
    cctvCoverage: Math.max(0, Math.min(1, avg(fromProfile.cctvCoverage, toProfile.cctvCoverage) + jitter())),
    timeRisk: getTimeRisk(),
  };

  const riskIndex = Math.max(0, Math.min(1,
    factors.crowdDensity * 0.1 +
    (1 - factors.lighting) * 0.25 +
    factors.incidentHistory * 0.25 +
    (1 - factors.policePresence) * 0.15 +
    (1 - factors.cctvCoverage) * 0.1 +
    factors.timeRisk * 0.15
  ));

  const overall = Math.round((1 - riskIndex) * 100);
  const grade: SafetyScore['grade'] = overall >= 80 ? 'A' : overall >= 65 ? 'B' : overall >= 50 ? 'C' : overall >= 35 ? 'D' : 'F';
  const label = overall >= 80 ? 'Very Safe' : overall >= 65 ? 'Safe' : overall >= 50 ? 'Moderate' : overall >= 35 ? 'Caution' : 'Unsafe';

  return { overall, riskIndex, grade, label, factors };
}

export function getAllSafetyScores(): Map<string, SafetyScore> {
  const map = new Map<string, SafetyScore>();
  for (const seg of allSegments) {
    map.set(seg.id, getSegmentSafetyScore(seg.id));
  }
  return map;
}

// Tamil Nadu specific incidents
export function getRecentIncidents(): SafetyIncident[] {
  const now = Date.now();
  return [
    { id: 'inc-1', segmentId: 'che-velachery-omr', type: 'poor_lighting', description: 'Street lights not working near Velachery junction', reportedAt: now - 3600000, severity: 'medium' },
    { id: 'inc-2', segmentId: 'che-omr-sholinganallur', type: 'harassment', description: 'Verbal harassment reported near Sholinganallur signal', reportedAt: now - 7200000, severity: 'high' },
    { id: 'inc-3', segmentId: 'che-omr-mahabalipuram', type: 'unsafe_area', description: 'Deserted stretch on ECR with no streetlights after 9 PM', reportedAt: now - 1800000, severity: 'high' },
    { id: 'inc-4', segmentId: 'che-guindy-chromepet', type: 'theft', description: 'Phone snatching reported near Alandur metro', reportedAt: now - 5400000, severity: 'medium' },
    { id: 'inc-5', segmentId: 'mdu-meena-thiru', type: 'poor_lighting', description: 'Dark stretch near Thirunagar bus stop', reportedAt: now - 10800000, severity: 'low' },
    { id: 'inc-6', segmentId: 'che-ambattur-avadi', type: 'stalking', description: 'Suspicious person following commuters near MTH Rd', reportedAt: now - 9000000, severity: 'medium' },
    { id: 'inc-7', segmentId: 'cbe-gandhi-peela', type: 'harassment', description: 'Harassment reported near Gandhipuram bus stand', reportedAt: now - 14400000, severity: 'medium' },
  ];
}

export function getMockRatings(): CrowdRating[] {
  const now = Date.now();
  return [
    { id: 'r1', segmentId: 'che-egmore-tnagar', userId: 'u1', rating: 4, comment: 'Anna Salai well-lit, metro nearby, feels safe', timestamp: now - 86400000, tags: ['well-lit', 'metro-access'] },
    { id: 'r2', segmentId: 'che-velachery-omr', userId: 'u2', rating: 2, comment: 'Very crowded, uncomfortable during peak hours', timestamp: now - 172800000, tags: ['crowded', 'peak-hours'] },
    { id: 'r3', segmentId: 'chennai-anna-nagar', userId: 'u3', rating: 5, comment: 'Residential area, very safe even at night', timestamp: now - 259200000, tags: ['residential', 'safe-night'] },
    { id: 'r4', segmentId: 'che-omr-mahabalipuram', userId: 'u4', rating: 2, comment: 'Dark stretches on ECR, avoid after 8 PM alone', timestamp: now - 345600000, tags: ['dark', 'avoid-night'] },
    { id: 'r5', segmentId: 'cbe-gandhi-peela', userId: 'u5', rating: 3, comment: 'OK during day, isolated at night near IT corridor', timestamp: now - 432000000, tags: ['daytime-ok', 'isolated-night'] },
    { id: 'r6', segmentId: 'che-central-egmore', userId: 'u6', rating: 4, comment: 'Police presence good, CCTV everywhere', timestamp: now - 518400000, tags: ['police', 'cctv'] },
  ];
}

export function getTransportModes(segmentId: string): TransportMode[] {
  const seg = allSegments.find(s => s.id === segmentId);
  if (!seg) return [];

  const modes: TransportMode[] = [];

  // Chennai Metro segments
  const metroSegments = ['che-central-egmore', 'che-egmore-tnagar', 'che-tnagar-guindy', 'che-guindy-adyar', 'che-guindy-velachery', 'che-central-anna-nagar'];
  if (metroSegments.includes(segmentId)) {
    modes.push({ id: `metro-${segmentId}`, type: 'metro', name: 'Chennai Metro', safetyScore: 92, available: true, frequency: 'Every 5 min', note: 'CCTV monitored, women-only coach available' });
  }

  // Bus always available
  const busName = segmentId.startsWith('cbe') ? 'TNSTC / Town Bus' :
    segmentId.startsWith('mdu') ? 'TNSTC Madurai' :
    segmentId.startsWith('trichy') ? 'TNSTC Trichy' :
    segmentId.startsWith('nh') || segmentId.startsWith('nh4') ? 'SETC / TNSTC' : 'MTC Bus';
  
  modes.push({ id: `bus-${segmentId}`, type: 'bus', name: busName, safetyScore: 70, available: true, frequency: 'Every 10-15 min', note: 'Reserved seats for women. GPS tracked.' });

  modes.push({ id: `auto-${segmentId}`, type: 'auto', name: 'Auto Rickshaw', safetyScore: 55, available: true, note: 'Prefer metered. Share ride details.' });

  const walkScore = getSegmentSafetyScore(segmentId);
  modes.push({ id: `walk-${segmentId}`, type: 'walking', name: 'Walking', safetyScore: walkScore.overall, available: true, note: walkScore.overall > 65 ? 'Reasonably safe to walk' : 'Avoid walking alone here' });

  return modes.sort((a, b) => b.safetyScore - a.safetyScore);
}

export function findSafestRoute(fromNodeId: string, toNodeId: string): SafeRoute[] {
  const routes: SafeRoute[] = [];

  // Direct segments
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

  // 1-hop routes
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

  // 2-hop routes for inter-city
  if (routes.length === 0) {
    const fromSegs2 = allSegments.filter(s => s.from === fromNodeId || s.to === fromNodeId);
    for (const s1 of fromSegs2) {
      const mid1 = s1.from === fromNodeId ? s1.to : s1.from;
      const midSegs = allSegments.filter(s => s.from === mid1 || s.to === mid1);
      for (const s2 of midSegs) {
        const mid2 = s2.from === mid1 ? s2.to : s2.from;
        const endSegs = allSegments.filter(s => (s.from === mid2 && s.to === toNodeId) || (s.to === mid2 && s.from === toNodeId));
        for (const s3 of endSegs) {
          const avg = Math.round((getSegmentSafetyScore(s1.id).overall + getSegmentSafetyScore(s2.id).overall + getSegmentSafetyScore(s3.id).overall) / 3);
          routes.push({
            segments: [s1.id, s2.id, s3.id],
            segmentNames: [s1.name, s2.name, s3.name],
            safetyScore: avg,
            distance: (s1.path.length + s2.path.length + s3.path.length) * 0.8,
            estimatedTime: Math.round((s1.path.length + s2.path.length + s3.path.length) * 3),
            transportModes: getTransportModes(s1.id),
            isSafest: false,
          });
        }
      }
    }
  }

  routes.sort((a, b) => b.safetyScore - a.safetyScore);
  if (routes.length > 0) routes[0].isSafest = true;
  return routes.slice(0, 5);
}

// Tamil Nadu emergency contacts
export const emergencyContacts: EmergencyContact[] = [
  { name: 'Women Helpline', number: '181', type: 'women_helpline' },
  { name: 'Police Emergency', number: '100', type: 'police' },
  { name: 'Ambulance', number: '108', type: 'ambulance' },
  { name: 'TN Police Control Room', number: '044-28447777', type: 'police' },
  { name: 'Kavalan SOS App', number: '1091', type: 'women_helpline' },
];

export function safetyColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#84cc16';
  if (score >= 50) return '#eab308';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}
