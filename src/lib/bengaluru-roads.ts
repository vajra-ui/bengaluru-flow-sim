// Bengaluru road network - key corridors with real coordinates
export interface RoadNode {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  from: string;
  to: string;
  path: [number, number][]; // [lat, lng][]
  lanes: number;
  capacity: number; // max vehicles
  sensors: string[];
}

export interface VirtualSensor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  segmentId: string;
  type: 'loop' | 'camera' | 'radar';
}

// Key Bengaluru intersections/nodes
export const nodes: RoadNode[] = [
  { id: 'majestic', lat: 12.9767, lng: 77.5713, name: 'Majestic' },
  { id: 'silk-board', lat: 12.9170, lng: 77.6227, name: 'Silk Board Junction' },
  { id: 'kr-puram', lat: 13.0012, lng: 77.6965, name: 'KR Puram' },
  { id: 'hebbal', lat: 13.0358, lng: 77.5970, name: 'Hebbal Flyover' },
  { id: 'electronic-city', lat: 12.8456, lng: 77.6603, name: 'Electronic City' },
  { id: 'whitefield', lat: 12.9698, lng: 77.7500, name: 'Whitefield' },
  { id: 'koramangala', lat: 12.9352, lng: 77.6245, name: 'Koramangala' },
  { id: 'indiranagar', lat: 12.9719, lng: 77.6412, name: 'Indiranagar' },
  { id: 'mg-road', lat: 12.9756, lng: 77.6066, name: 'MG Road' },
  { id: 'jayanagar', lat: 12.9308, lng: 77.5838, name: 'Jayanagar' },
  { id: 'yelahanka', lat: 13.1007, lng: 77.5963, name: 'Yelahanka' },
  { id: 'banashankari', lat: 12.9255, lng: 77.5468, name: 'Banashankari' },
  { id: 'marathahalli', lat: 12.9591, lng: 77.6974, name: 'Marathahalli' },
  { id: 'hsr-layout', lat: 12.9116, lng: 77.6474, name: 'HSR Layout' },
  { id: 'rajajinagar', lat: 12.9910, lng: 77.5560, name: 'Rajajinagar' },
  { id: 'bellandur', lat: 12.9260, lng: 77.6762, name: 'Bellandur' },
  { id: 'yeshwanthpur', lat: 13.0220, lng: 77.5500, name: 'Yeshwanthpur' },
  { id: 'btm-layout', lat: 12.9166, lng: 77.6101, name: 'BTM Layout' },
  { id: 'sarjapur-road', lat: 12.9100, lng: 77.6850, name: 'Sarjapur Road' },
  { id: 'outer-ring-road-n', lat: 13.0200, lng: 77.6500, name: 'ORR North' },
];

// Major road segments connecting nodes
export const segments: RoadSegment[] = [
  {
    id: 'orr-silk-mara', name: 'ORR: Silk Board → Marathahalli', from: 'silk-board', to: 'marathahalli',
    path: [[12.9170, 77.6227], [12.9200, 77.6350], [12.9260, 77.6500], [12.9260, 77.6762], [12.9400, 77.6900], [12.9591, 77.6974]],
    lanes: 3, capacity: 180, sensors: ['s-orr-1', 's-orr-2', 's-orr-3']
  },
  {
    id: 'orr-mara-krp', name: 'ORR: Marathahalli → KR Puram', from: 'marathahalli', to: 'kr-puram',
    path: [[12.9591, 77.6974], [12.9700, 77.6980], [12.9850, 77.6970], [13.0012, 77.6965]],
    lanes: 3, capacity: 150, sensors: ['s-orr-4', 's-orr-5']
  },
  {
    id: 'hosur-silk-ec', name: 'Hosur Rd: Silk Board → Electronic City', from: 'silk-board', to: 'electronic-city',
    path: [[12.9170, 77.6227], [12.9050, 77.6300], [12.8800, 77.6450], [12.8600, 77.6550], [12.8456, 77.6603]],
    lanes: 3, capacity: 200, sensors: ['s-hosur-1', 's-hosur-2', 's-hosur-3']
  },
  {
    id: 'mg-majestic-ind', name: 'MG Road → Indiranagar', from: 'mg-road', to: 'indiranagar',
    path: [[12.9756, 77.6066], [12.9740, 77.6150], [12.9730, 77.6250], [12.9719, 77.6412]],
    lanes: 2, capacity: 100, sensors: ['s-mg-1', 's-mg-2']
  },
  {
    id: 'bell-road', name: 'Bellary Rd: Hebbal → Majestic', from: 'hebbal', to: 'majestic',
    path: [[13.0358, 77.5970], [13.0220, 77.5800], [13.0100, 77.5750], [12.9910, 77.5700], [12.9767, 77.5713]],
    lanes: 3, capacity: 170, sensors: ['s-bell-1', 's-bell-2', 's-bell-3']
  },
  {
    id: 'hebbal-yelahanka', name: 'NH44: Hebbal → Yelahanka', from: 'hebbal', to: 'yelahanka',
    path: [[13.0358, 77.5970], [13.0500, 77.5965], [13.0700, 77.5960], [13.1007, 77.5963]],
    lanes: 4, capacity: 250, sensors: ['s-nh44-1', 's-nh44-2']
  },
  {
    id: 'ind-mara', name: 'Old Airport Rd: Indiranagar → Marathahalli', from: 'indiranagar', to: 'marathahalli',
    path: [[12.9719, 77.6412], [12.9700, 77.6550], [12.9650, 77.6700], [12.9591, 77.6974]],
    lanes: 2, capacity: 120, sensors: ['s-oar-1', 's-oar-2']
  },
  {
    id: 'koram-silk', name: 'Koramangala → Silk Board', from: 'koramangala', to: 'silk-board',
    path: [[12.9352, 77.6245], [12.9280, 77.6240], [12.9200, 77.6235], [12.9170, 77.6227]],
    lanes: 2, capacity: 90, sensors: ['s-kor-1']
  },
  {
    id: 'mara-whitefield', name: 'Marathahalli → Whitefield', from: 'marathahalli', to: 'whitefield',
    path: [[12.9591, 77.6974], [12.9620, 77.7100], [12.9650, 77.7250], [12.9698, 77.7500]],
    lanes: 2, capacity: 130, sensors: ['s-wf-1', 's-wf-2']
  },
  {
    id: 'jayanagar-bana', name: 'Jayanagar → Banashankari', from: 'jayanagar', to: 'banashankari',
    path: [[12.9308, 77.5838], [12.9290, 77.5700], [12.9270, 77.5580], [12.9255, 77.5468]],
    lanes: 2, capacity: 100, sensors: ['s-jb-1']
  },
  {
    id: 'majestic-raja', name: 'Majestic → Rajajinagar', from: 'majestic', to: 'rajajinagar',
    path: [[12.9767, 77.5713], [12.9800, 77.5680], [12.9850, 77.5620], [12.9910, 77.5560]],
    lanes: 2, capacity: 110, sensors: ['s-mr-1']
  },
  {
    id: 'raja-yeshwanth', name: 'Rajajinagar → Yeshwanthpur', from: 'rajajinagar', to: 'yeshwanthpur',
    path: [[12.9910, 77.5560], [13.0000, 77.5540], [13.0100, 77.5520], [13.0220, 77.5500]],
    lanes: 2, capacity: 120, sensors: ['s-ry-1']
  },
  {
    id: 'btm-hsr', name: 'BTM Layout → HSR Layout', from: 'btm-layout', to: 'hsr-layout',
    path: [[12.9166, 77.6101], [12.9150, 77.6200], [12.9130, 77.6350], [12.9116, 77.6474]],
    lanes: 2, capacity: 90, sensors: ['s-bh-1']
  },
  {
    id: 'hsr-sarjapur', name: 'HSR → Sarjapur Road', from: 'hsr-layout', to: 'sarjapur-road',
    path: [[12.9116, 77.6474], [12.9110, 77.6550], [12.9105, 77.6700], [12.9100, 77.6850]],
    lanes: 2, capacity: 100, sensors: ['s-hs-1']
  },
  {
    id: 'bell-sarj', name: 'Bellandur → Sarjapur', from: 'bellandur', to: 'sarjapur-road',
    path: [[12.9260, 77.6762], [12.9200, 77.6800], [12.9150, 77.6830], [12.9100, 77.6850]],
    lanes: 2, capacity: 90, sensors: ['s-bs-1']
  },
  {
    id: 'majestic-mg', name: 'Majestic → MG Road', from: 'majestic', to: 'mg-road',
    path: [[12.9767, 77.5713], [12.9760, 77.5800], [12.9758, 77.5950], [12.9756, 77.6066]],
    lanes: 2, capacity: 110, sensors: ['s-mmg-1', 's-mmg-2']
  },
  {
    id: 'majestic-jaya', name: 'Majestic → Jayanagar', from: 'majestic', to: 'jayanagar',
    path: [[12.9767, 77.5713], [12.9650, 77.5750], [12.9500, 77.5790], [12.9308, 77.5838]],
    lanes: 2, capacity: 100, sensors: ['s-mj-1']
  },
  {
    id: 'koram-btm', name: 'Koramangala → BTM Layout', from: 'koramangala', to: 'btm-layout',
    path: [[12.9352, 77.6245], [12.9300, 77.6200], [12.9230, 77.6150], [12.9166, 77.6101]],
    lanes: 2, capacity: 80, sensors: ['s-kb-1']
  },
  {
    id: 'orr-n-krp', name: 'ORR North → KR Puram', from: 'outer-ring-road-n', to: 'kr-puram',
    path: [[13.0200, 77.6500], [13.0150, 77.6650], [13.0100, 77.6800], [13.0012, 77.6965]],
    lanes: 3, capacity: 150, sensors: ['s-orrn-1', 's-orrn-2']
  },
  {
    id: 'hebbal-orrn', name: 'Hebbal → ORR North', from: 'hebbal', to: 'outer-ring-road-n',
    path: [[13.0358, 77.5970], [13.0320, 77.6100], [13.0270, 77.6300], [13.0200, 77.6500]],
    lanes: 3, capacity: 160, sensors: ['s-horrn-1', 's-horrn-2']
  },
];

// Generate virtual sensors from segment definitions
export const sensors: VirtualSensor[] = segments.flatMap(seg => 
  seg.sensors.map((sId, i) => {
    const pathIdx = Math.min(i, seg.path.length - 1);
    const frac = seg.sensors.length > 1 ? i / (seg.sensors.length - 1) : 0.5;
    const fromIdx = Math.floor(frac * (seg.path.length - 1));
    const toIdx = Math.min(fromIdx + 1, seg.path.length - 1);
    const t = frac * (seg.path.length - 1) - fromIdx;
    return {
      id: sId,
      name: `${seg.name} Sensor ${i + 1}`,
      lat: seg.path[fromIdx][0] + t * (seg.path[toIdx][0] - seg.path[fromIdx][0]),
      lng: seg.path[fromIdx][1] + t * (seg.path[toIdx][1] - seg.path[fromIdx][1]),
      segmentId: seg.id,
      type: (['loop', 'camera', 'radar'] as const)[i % 3],
    };
  })
);

// Adjacency: which segments connect (for wave propagation)
export function getConnectedSegments(segmentId: string): string[] {
  const seg = segments.find(s => s.id === segmentId);
  if (!seg) return [];
  return segments
    .filter(s => s.id !== segmentId && (s.from === seg.to || s.to === seg.from || s.from === seg.from || s.to === seg.to))
    .map(s => s.id);
}
