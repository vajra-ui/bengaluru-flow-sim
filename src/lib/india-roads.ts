// India-wide road network — major corridors across cities with mock data
import type { RoadNode, RoadSegment } from './bengaluru-roads';

// Re-export types
export type { RoadNode, RoadSegment, VirtualSensor } from './bengaluru-roads';

// Keep original Bengaluru data and add more Indian cities
import { nodes as blrNodes, segments as blrSegments, sensors as blrSensors } from './bengaluru-roads';

const delhiNodes: RoadNode[] = [
  { id: 'delhi-cp', lat: 28.6315, lng: 77.2167, name: 'Connaught Place' },
  { id: 'delhi-igi', lat: 28.5562, lng: 77.1000, name: 'IGI Airport' },
  { id: 'delhi-noida', lat: 28.5355, lng: 77.3910, name: 'Noida Sec 18' },
  { id: 'delhi-dwarka', lat: 28.5921, lng: 77.0460, name: 'Dwarka' },
  { id: 'delhi-rohini', lat: 28.7325, lng: 77.1190, name: 'Rohini' },
  { id: 'gurgaon', lat: 28.4595, lng: 77.0266, name: 'Gurgaon Cyber Hub' },
];

const mumbaiNodes: RoadNode[] = [
  { id: 'mumbai-cst', lat: 18.9398, lng: 72.8355, name: 'CST Mumbai' },
  { id: 'mumbai-bandra', lat: 19.0596, lng: 72.8295, name: 'Bandra' },
  { id: 'mumbai-andheri', lat: 19.1197, lng: 72.8464, name: 'Andheri' },
  { id: 'mumbai-thane', lat: 19.2183, lng: 72.9781, name: 'Thane' },
  { id: 'navi-mumbai', lat: 19.0330, lng: 73.0297, name: 'Navi Mumbai' },
];

const chennaiNodes: RoadNode[] = [
  { id: 'chennai-central', lat: 13.0827, lng: 80.2707, name: 'Chennai Central' },
  { id: 'chennai-omr', lat: 12.9165, lng: 80.2274, name: 'OMR Toll Gate' },
  { id: 'chennai-tambaram', lat: 12.9249, lng: 80.1000, name: 'Tambaram' },
  { id: 'chennai-anna', lat: 13.0604, lng: 80.2496, name: 'Anna Nagar' },
];

const hyderabadNodes: RoadNode[] = [
  { id: 'hyd-hitech', lat: 17.4435, lng: 78.3772, name: 'HITEC City' },
  { id: 'hyd-charminar', lat: 17.3616, lng: 78.4747, name: 'Charminar' },
  { id: 'hyd-secunderabad', lat: 17.4399, lng: 78.4983, name: 'Secunderabad' },
  { id: 'hyd-gachibowli', lat: 17.4401, lng: 78.3489, name: 'Gachibowli' },
];

const kolkataNodes: RoadNode[] = [
  { id: 'kol-howrah', lat: 22.5854, lng: 88.3426, name: 'Howrah Bridge' },
  { id: 'kol-saltlake', lat: 22.5801, lng: 88.4209, name: 'Salt Lake' },
  { id: 'kol-parkstreet', lat: 22.5510, lng: 88.3514, name: 'Park Street' },
];

const puneNodes: RoadNode[] = [
  { id: 'pune-hinjewadi', lat: 18.5912, lng: 73.7390, name: 'Hinjewadi IT Park' },
  { id: 'pune-shivaji', lat: 18.5314, lng: 73.8446, name: 'Shivaji Nagar' },
  { id: 'pune-kharadi', lat: 18.5530, lng: 73.9400, name: 'Kharadi' },
];

// Delhi segments
const delhiSegments: RoadSegment[] = [
  {
    id: 'del-cp-igi', name: 'NH48: CP → IGI Airport', from: 'delhi-cp', to: 'delhi-igi',
    path: [[28.6315, 77.2167], [28.6100, 77.1800], [28.5800, 77.1400], [28.5562, 77.1000]],
    lanes: 4, capacity: 300, sensors: ['s-del-1', 's-del-2']
  },
  {
    id: 'del-cp-noida', name: 'DND Flyway: CP → Noida', from: 'delhi-cp', to: 'delhi-noida',
    path: [[28.6315, 77.2167], [28.6000, 77.2800], [28.5700, 77.3400], [28.5355, 77.3910]],
    lanes: 3, capacity: 250, sensors: ['s-del-3', 's-del-4']
  },
  {
    id: 'del-cp-rohini', name: 'GT Karnal Rd: CP → Rohini', from: 'delhi-cp', to: 'delhi-rohini',
    path: [[28.6315, 77.2167], [28.6600, 77.1800], [28.7000, 77.1500], [28.7325, 77.1190]],
    lanes: 3, capacity: 220, sensors: ['s-del-5']
  },
  {
    id: 'del-igi-gurgaon', name: 'NH48: IGI → Gurgaon', from: 'delhi-igi', to: 'gurgaon',
    path: [[28.5562, 77.1000], [28.5200, 77.0700], [28.4900, 77.0500], [28.4595, 77.0266]],
    lanes: 4, capacity: 280, sensors: ['s-del-6', 's-del-7']
  },
  {
    id: 'del-dwarka-igi', name: 'Dwarka Expressway', from: 'delhi-dwarka', to: 'delhi-igi',
    path: [[28.5921, 77.0460], [28.5800, 77.0600], [28.5700, 77.0800], [28.5562, 77.1000]],
    lanes: 3, capacity: 200, sensors: ['s-del-8']
  },
];

// Mumbai segments
const mumbaiSegments: RoadSegment[] = [
  {
    id: 'mum-cst-bandra', name: 'Western Express: CST → Bandra', from: 'mumbai-cst', to: 'mumbai-bandra',
    path: [[18.9398, 72.8355], [18.9700, 72.8300], [19.0200, 72.8290], [19.0596, 72.8295]],
    lanes: 3, capacity: 200, sensors: ['s-mum-1', 's-mum-2']
  },
  {
    id: 'mum-bandra-andheri', name: 'WEH: Bandra → Andheri', from: 'mumbai-bandra', to: 'mumbai-andheri',
    path: [[19.0596, 72.8295], [19.0800, 72.8350], [19.1000, 72.8400], [19.1197, 72.8464]],
    lanes: 3, capacity: 180, sensors: ['s-mum-3', 's-mum-4']
  },
  {
    id: 'mum-andheri-thane', name: 'EEH: Andheri → Thane', from: 'mumbai-andheri', to: 'mumbai-thane',
    path: [[19.1197, 72.8464], [19.1500, 72.8800], [19.1800, 72.9300], [19.2183, 72.9781]],
    lanes: 3, capacity: 220, sensors: ['s-mum-5', 's-mum-6']
  },
  {
    id: 'mum-cst-navi', name: 'Harbour Line: CST → Navi Mumbai', from: 'mumbai-cst', to: 'navi-mumbai',
    path: [[18.9398, 72.8355], [18.9600, 72.8800], [19.0000, 72.9500], [19.0330, 73.0297]],
    lanes: 2, capacity: 150, sensors: ['s-mum-7']
  },
];

// Chennai segments
const chennaiSegments: RoadSegment[] = [
  {
    id: 'che-central-omr', name: 'OMR: Central → IT Corridor', from: 'chennai-central', to: 'chennai-omr',
    path: [[13.0827, 80.2707], [13.0400, 80.2600], [12.9800, 80.2400], [12.9165, 80.2274]],
    lanes: 3, capacity: 200, sensors: ['s-che-1', 's-che-2']
  },
  {
    id: 'che-central-tambaram', name: 'GST Rd: Central → Tambaram', from: 'chennai-central', to: 'chennai-tambaram',
    path: [[13.0827, 80.2707], [13.0400, 80.2100], [12.9800, 80.1500], [12.9249, 80.1000]],
    lanes: 3, capacity: 180, sensors: ['s-che-3']
  },
  {
    id: 'che-anna-central', name: 'Anna Nagar → Central', from: 'chennai-anna', to: 'chennai-central',
    path: [[13.0604, 80.2496], [13.0650, 80.2550], [13.0750, 80.2650], [13.0827, 80.2707]],
    lanes: 2, capacity: 120, sensors: ['s-che-4']
  },
];

// Hyderabad segments
const hyderabadSegments: RoadSegment[] = [
  {
    id: 'hyd-hitech-charm', name: 'ORR: HITEC → Charminar', from: 'hyd-hitech', to: 'hyd-charminar',
    path: [[17.4435, 78.3772], [17.4200, 78.4100], [17.3900, 78.4400], [17.3616, 78.4747]],
    lanes: 3, capacity: 200, sensors: ['s-hyd-1', 's-hyd-2']
  },
  {
    id: 'hyd-sec-hitech', name: 'Secunderabad → HITEC City', from: 'hyd-secunderabad', to: 'hyd-hitech',
    path: [[17.4399, 78.4983], [17.4420, 78.4500], [17.4430, 78.4100], [17.4435, 78.3772]],
    lanes: 3, capacity: 180, sensors: ['s-hyd-3', 's-hyd-4']
  },
  {
    id: 'hyd-gachi-hitech', name: 'Gachibowli → HITEC City', from: 'hyd-gachibowli', to: 'hyd-hitech',
    path: [[17.4401, 78.3489], [17.4410, 78.3580], [17.4425, 78.3680], [17.4435, 78.3772]],
    lanes: 2, capacity: 120, sensors: ['s-hyd-5']
  },
];

// Kolkata segments
const kolkataSegments: RoadSegment[] = [
  {
    id: 'kol-howrah-salt', name: 'EM Bypass: Howrah → Salt Lake', from: 'kol-howrah', to: 'kol-saltlake',
    path: [[22.5854, 88.3426], [22.5850, 88.3700], [22.5830, 88.3950], [22.5801, 88.4209]],
    lanes: 3, capacity: 180, sensors: ['s-kol-1', 's-kol-2']
  },
  {
    id: 'kol-howrah-park', name: 'Howrah Bridge → Park Street', from: 'kol-howrah', to: 'kol-parkstreet',
    path: [[22.5854, 88.3426], [22.5750, 88.3450], [22.5650, 88.3480], [22.5510, 88.3514]],
    lanes: 2, capacity: 100, sensors: ['s-kol-3']
  },
];

// Pune segments
const puneSegments: RoadSegment[] = [
  {
    id: 'pune-hinj-shivaji', name: 'Mumbai-Pune Expy: Hinjewadi → Shivaji Nagar', from: 'pune-hinjewadi', to: 'pune-shivaji',
    path: [[18.5912, 73.7390], [18.5700, 73.7700], [18.5500, 73.8100], [18.5314, 73.8446]],
    lanes: 3, capacity: 200, sensors: ['s-pun-1', 's-pun-2']
  },
  {
    id: 'pune-shivaji-kharadi', name: 'Nagar Rd: Shivaji Nagar → Kharadi', from: 'pune-shivaji', to: 'pune-kharadi',
    path: [[18.5314, 73.8446], [18.5400, 73.8700], [18.5450, 73.9100], [18.5530, 73.9400]],
    lanes: 2, capacity: 150, sensors: ['s-pun-3']
  },
];

// Combined exports
export const allNodes: RoadNode[] = [
  ...blrNodes,
  ...delhiNodes,
  ...mumbaiNodes,
  ...chennaiNodes,
  ...hyderabadNodes,
  ...kolkataNodes,
  ...puneNodes,
];

export const allSegments: RoadSegment[] = [
  ...blrSegments,
  ...delhiSegments,
  ...mumbaiSegments,
  ...chennaiSegments,
  ...hyderabadSegments,
  ...kolkataSegments,
  ...puneSegments,
];

// Generate sensors for new segments
import type { VirtualSensor } from './bengaluru-roads';

const newSegments = [...delhiSegments, ...mumbaiSegments, ...chennaiSegments, ...hyderabadSegments, ...kolkataSegments, ...puneSegments];

const newSensors: VirtualSensor[] = newSegments.flatMap(seg =>
  seg.sensors.map((sId, i) => {
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

export const allSensors: VirtualSensor[] = [...blrSensors, ...newSensors];

// Adjacency
export function getAllConnectedSegments(segmentId: string): string[] {
  const seg = allSegments.find(s => s.id === segmentId);
  if (!seg) return [];
  return allSegments
    .filter(s => s.id !== segmentId && (s.from === seg.to || s.to === seg.from || s.from === seg.from || s.to === seg.to))
    .map(s => s.id);
}
