// Tamil Nadu road network — major corridors with real coordinates and route names
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
  capacity: number;
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

// ─── CHENNAI ───
const chennaiNodes: RoadNode[] = [
  { id: 'chennai-central', lat: 13.0827, lng: 80.2707, name: 'Chennai Central' },
  { id: 'chennai-egmore', lat: 13.0732, lng: 80.2609, name: 'Egmore' },
  { id: 'chennai-tnagar', lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
  { id: 'chennai-adyar', lat: 13.0067, lng: 80.2572, name: 'Adyar' },
  { id: 'chennai-anna-nagar', lat: 13.0850, lng: 80.2101, name: 'Anna Nagar' },
  { id: 'chennai-tambaram', lat: 12.9249, lng: 80.1000, name: 'Tambaram' },
  { id: 'chennai-omr', lat: 12.9165, lng: 80.2274, name: 'OMR Toll Gate' },
  { id: 'chennai-velachery', lat: 12.9815, lng: 80.2180, name: 'Velachery' },
  { id: 'chennai-guindy', lat: 13.0067, lng: 80.2206, name: 'Guindy' },
  { id: 'chennai-ambattur', lat: 13.1143, lng: 80.1548, name: 'Ambattur' },
  { id: 'chennai-avadi', lat: 13.1145, lng: 80.0970, name: 'Avadi' },
  { id: 'chennai-porur', lat: 13.0382, lng: 80.1565, name: 'Porur' },
  { id: 'chennai-sholinganallur', lat: 12.9010, lng: 80.2279, name: 'Sholinganallur' },
  { id: 'chennai-perungudi', lat: 12.9619, lng: 80.2440, name: 'Perungudi' },
  { id: 'chennai-chromepet', lat: 12.9516, lng: 80.1415, name: 'Chromepet' },
  { id: 'chennai-mahabalipuram', lat: 12.6269, lng: 80.1929, name: 'Mahabalipuram' },
];

// ─── COIMBATORE ───
const coimbatoreNodes: RoadNode[] = [
  { id: 'cbe-junction', lat: 11.0168, lng: 76.9558, name: 'Coimbatore Junction' },
  { id: 'cbe-gandhipuram', lat: 11.0183, lng: 76.9725, name: 'Gandhipuram' },
  { id: 'cbe-rs-puram', lat: 11.0044, lng: 76.9553, name: 'RS Puram' },
  { id: 'cbe-peelamedu', lat: 11.0240, lng: 77.0250, name: 'Peelamedu' },
  { id: 'cbe-singanallur', lat: 10.9942, lng: 77.0297, name: 'Singanallur' },
  { id: 'cbe-saravanampatti', lat: 11.0680, lng: 77.0070, name: 'Saravanampatti' },
];

// ─── MADURAI ───
const maduraiNodes: RoadNode[] = [
  { id: 'mdu-meenakshi', lat: 9.9195, lng: 78.1193, name: 'Meenakshi Temple' },
  { id: 'mdu-periyar', lat: 9.9252, lng: 78.1230, name: 'Periyar Bus Stand' },
  { id: 'mdu-anna-nagar', lat: 9.9400, lng: 78.1100, name: 'Madurai Anna Nagar' },
  { id: 'mdu-thirunagar', lat: 9.9050, lng: 78.0900, name: 'Thirunagar' },
  { id: 'mdu-mattuthavani', lat: 9.8980, lng: 78.1450, name: 'Mattuthavani' },
];

// ─── TRICHY ───
const trichyNodes: RoadNode[] = [
  { id: 'trichy-junction', lat: 10.7905, lng: 78.6826, name: 'Trichy Junction' },
  { id: 'trichy-srirangam', lat: 10.8627, lng: 78.6900, name: 'Srirangam' },
  { id: 'trichy-thillai-nagar', lat: 10.8050, lng: 78.6920, name: 'Thillai Nagar' },
  { id: 'trichy-cantonment', lat: 10.8200, lng: 78.6700, name: 'Cantonment' },
];

// ─── SALEM ───
const salemNodes: RoadNode[] = [
  { id: 'salem-junction', lat: 11.6643, lng: 78.1460, name: 'Salem Junction' },
  { id: 'salem-five-roads', lat: 11.6500, lng: 78.1550, name: 'Five Roads' },
  { id: 'salem-omalur', lat: 11.7420, lng: 78.0400, name: 'Omalur' },
];

// ─── TIRUNELVELI ───
const tirunelveliNodes: RoadNode[] = [
  { id: 'tvl-junction', lat: 8.7139, lng: 77.7567, name: 'Tirunelveli Junction' },
  { id: 'tvl-palayamkottai', lat: 8.7220, lng: 77.7420, name: 'Palayamkottai' },
  { id: 'tvl-melapalayam', lat: 8.6950, lng: 77.7300, name: 'Melapalayam' },
];

// ─── VELLORE ───
const velloreNodes: RoadNode[] = [
  { id: 'vellore-fort', lat: 12.9165, lng: 79.1325, name: 'Vellore Fort' },
  { id: 'vellore-katpadi', lat: 12.9690, lng: 79.1470, name: 'Katpadi Junction' },
];

// ─── INTER-CITY HIGHWAY NODES ───
const highwayNodes: RoadNode[] = [
  { id: 'villupuram', lat: 11.9401, lng: 79.4861, name: 'Villupuram' },
  { id: 'krishnagiri', lat: 12.5186, lng: 78.2137, name: 'Krishnagiri' },
  { id: 'dindigul', lat: 10.3624, lng: 77.9695, name: 'Dindigul' },
  { id: 'erode', lat: 11.3410, lng: 77.7172, name: 'Erode' },
  { id: 'karur', lat: 10.9601, lng: 78.0766, name: 'Karur' },
  { id: 'thanjavur', lat: 10.7870, lng: 79.1378, name: 'Thanjavur' },
  { id: 'kanchipuram', lat: 12.8342, lng: 79.7036, name: 'Kanchipuram' },
  { id: 'hosur', lat: 12.7409, lng: 77.8253, name: 'Hosur' },
];

// ─── ALL NODES ───
export const allNodes: RoadNode[] = [
  ...chennaiNodes, ...coimbatoreNodes, ...maduraiNodes,
  ...trichyNodes, ...salemNodes, ...tirunelveliNodes,
  ...velloreNodes, ...highwayNodes,
];

// ─── CHENNAI SEGMENTS ───
const chennaiSegments: RoadSegment[] = [
  {
    id: 'che-central-egmore', name: 'EVR Periyar Rd: Central → Egmore', from: 'chennai-central', to: 'chennai-egmore',
    path: [[13.0827, 80.2707], [13.0790, 80.2670], [13.0760, 80.2640], [13.0732, 80.2609]],
    lanes: 3, capacity: 150, sensors: ['s-che-1', 's-che-2']
  },
  {
    id: 'che-egmore-tnagar', name: 'Anna Salai: Egmore → T.Nagar', from: 'chennai-egmore', to: 'chennai-tnagar',
    path: [[13.0732, 80.2609], [13.0600, 80.2500], [13.0500, 80.2420], [13.0418, 80.2341]],
    lanes: 4, capacity: 250, sensors: ['s-che-3', 's-che-4', 's-che-5']
  },
  {
    id: 'che-tnagar-guindy', name: 'Anna Salai: T.Nagar → Guindy', from: 'chennai-tnagar', to: 'chennai-guindy',
    path: [[13.0418, 80.2341], [13.0300, 80.2280], [13.0180, 80.2240], [13.0067, 80.2206]],
    lanes: 4, capacity: 230, sensors: ['s-che-6', 's-che-7']
  },
  {
    id: 'che-guindy-velachery', name: 'Velachery Rd: Guindy → Velachery', from: 'chennai-guindy', to: 'chennai-velachery',
    path: [[13.0067, 80.2206], [12.9980, 80.2190], [12.9900, 80.2185], [12.9815, 80.2180]],
    lanes: 2, capacity: 120, sensors: ['s-che-8', 's-che-9']
  },
  {
    id: 'che-velachery-omr', name: 'Velachery → OMR (Medavakkam Rd)', from: 'chennai-velachery', to: 'chennai-omr',
    path: [[12.9815, 80.2180], [12.9700, 80.2200], [12.9500, 80.2240], [12.9165, 80.2274]],
    lanes: 2, capacity: 130, sensors: ['s-che-10', 's-che-11']
  },
  {
    id: 'che-omr-sholinganallur', name: 'OMR: Toll Gate → Sholinganallur', from: 'chennai-omr', to: 'chennai-sholinganallur',
    path: [[12.9165, 80.2274], [12.9100, 80.2278], [12.9050, 80.2279], [12.9010, 80.2279]],
    lanes: 3, capacity: 200, sensors: ['s-che-12', 's-che-13']
  },
  {
    id: 'che-omr-mahabalipuram', name: 'ECR: OMR → Mahabalipuram', from: 'chennai-sholinganallur', to: 'chennai-mahabalipuram',
    path: [[12.9010, 80.2279], [12.8200, 80.2150], [12.7300, 80.2050], [12.6269, 80.1929]],
    lanes: 2, capacity: 150, sensors: ['s-che-14', 's-che-15']
  },
  {
    id: 'che-adyar-velachery', name: 'Sardar Patel Rd: Adyar → Velachery', from: 'chennai-adyar', to: 'chennai-velachery',
    path: [[13.0067, 80.2572], [13.0000, 80.2450], [12.9910, 80.2320], [12.9815, 80.2180]],
    lanes: 2, capacity: 100, sensors: ['s-che-16']
  },
  {
    id: 'che-central-anna-nagar', name: 'Poonamallee High Rd: Central → Anna Nagar', from: 'chennai-central', to: 'chennai-anna-nagar',
    path: [[13.0827, 80.2707], [13.0840, 80.2500], [13.0845, 80.2300], [13.0850, 80.2101]],
    lanes: 3, capacity: 180, sensors: ['s-che-17', 's-che-18']
  },
  {
    id: 'che-anna-nagar-ambattur', name: 'Inner Ring Rd: Anna Nagar → Ambattur', from: 'chennai-anna-nagar', to: 'chennai-ambattur',
    path: [[13.0850, 80.2101], [13.0920, 80.1900], [13.1030, 80.1700], [13.1143, 80.1548]],
    lanes: 3, capacity: 170, sensors: ['s-che-19', 's-che-20']
  },
  {
    id: 'che-ambattur-avadi', name: 'MTH Rd: Ambattur → Avadi', from: 'chennai-ambattur', to: 'chennai-avadi',
    path: [[13.1143, 80.1548], [13.1143, 80.1350], [13.1144, 80.1150], [13.1145, 80.0970]],
    lanes: 2, capacity: 140, sensors: ['s-che-21', 's-che-22']
  },
  {
    id: 'che-porur-guindy', name: 'Mount Poonamallee Rd: Porur → Guindy', from: 'chennai-porur', to: 'chennai-guindy',
    path: [[13.0382, 80.1565], [13.0300, 80.1750], [13.0180, 80.1980], [13.0067, 80.2206]],
    lanes: 3, capacity: 180, sensors: ['s-che-23', 's-che-24']
  },
  {
    id: 'che-guindy-adyar', name: 'Rajiv Gandhi Salai: Guindy → Adyar', from: 'chennai-guindy', to: 'chennai-adyar',
    path: [[13.0067, 80.2206], [13.0067, 80.2350], [13.0067, 80.2460], [13.0067, 80.2572]],
    lanes: 3, capacity: 160, sensors: ['s-che-25']
  },
  {
    id: 'che-guindy-chromepet', name: 'GST Rd: Guindy → Chromepet', from: 'chennai-guindy', to: 'chennai-chromepet',
    path: [[13.0067, 80.2206], [12.9900, 80.1900], [12.9700, 80.1650], [12.9516, 80.1415]],
    lanes: 3, capacity: 200, sensors: ['s-che-26', 's-che-27']
  },
  {
    id: 'che-chromepet-tambaram', name: 'GST Rd: Chromepet → Tambaram', from: 'chennai-chromepet', to: 'chennai-tambaram',
    path: [[12.9516, 80.1415], [12.9400, 80.1250], [12.9330, 80.1120], [12.9249, 80.1000]],
    lanes: 3, capacity: 180, sensors: ['s-che-28', 's-che-29']
  },
  {
    id: 'che-perungudi-omr', name: 'OMR: Perungudi → OMR Toll', from: 'chennai-perungudi', to: 'chennai-omr',
    path: [[12.9619, 80.2440], [12.9500, 80.2380], [12.9350, 80.2330], [12.9165, 80.2274]],
    lanes: 3, capacity: 190, sensors: ['s-che-30', 's-che-31']
  },
];

// ─── COIMBATORE SEGMENTS ───
const coimbatoreSegments: RoadSegment[] = [
  {
    id: 'cbe-jn-gandhi', name: 'Avinashi Rd: Junction → Gandhipuram', from: 'cbe-junction', to: 'cbe-gandhipuram',
    path: [[11.0168, 76.9558], [11.0175, 76.9620], [11.0180, 76.9680], [11.0183, 76.9725]],
    lanes: 3, capacity: 160, sensors: ['s-cbe-1', 's-cbe-2']
  },
  {
    id: 'cbe-gandhi-peela', name: 'Avinashi Rd: Gandhipuram → Peelamedu', from: 'cbe-gandhipuram', to: 'cbe-peelamedu',
    path: [[11.0183, 76.9725], [11.0200, 76.9850], [11.0220, 77.0050], [11.0240, 77.0250]],
    lanes: 3, capacity: 180, sensors: ['s-cbe-3', 's-cbe-4']
  },
  {
    id: 'cbe-peela-singa', name: 'Trichy Rd: Peelamedu → Singanallur', from: 'cbe-peelamedu', to: 'cbe-singanallur',
    path: [[11.0240, 77.0250], [11.0150, 77.0270], [11.0050, 77.0280], [10.9942, 77.0297]],
    lanes: 2, capacity: 130, sensors: ['s-cbe-5']
  },
  {
    id: 'cbe-jn-rspuram', name: 'Big Bazaar St: Junction → RS Puram', from: 'cbe-junction', to: 'cbe-rs-puram',
    path: [[11.0168, 76.9558], [11.0120, 76.9556], [11.0080, 76.9554], [11.0044, 76.9553]],
    lanes: 2, capacity: 100, sensors: ['s-cbe-6']
  },
  {
    id: 'cbe-gandhi-sarava', name: 'Sathy Rd: Gandhipuram → Saravanampatti', from: 'cbe-gandhipuram', to: 'cbe-saravanampatti',
    path: [[11.0183, 76.9725], [11.0300, 76.9800], [11.0500, 76.9930], [11.0680, 77.0070]],
    lanes: 2, capacity: 140, sensors: ['s-cbe-7', 's-cbe-8']
  },
];

// ─── MADURAI SEGMENTS ───
const maduraiSegments: RoadSegment[] = [
  {
    id: 'mdu-meena-periyar', name: 'East Veli St: Meenakshi → Periyar', from: 'mdu-meenakshi', to: 'mdu-periyar',
    path: [[9.9195, 78.1193], [9.9220, 78.1210], [9.9240, 78.1220], [9.9252, 78.1230]],
    lanes: 2, capacity: 100, sensors: ['s-mdu-1']
  },
  {
    id: 'mdu-periyar-anna', name: 'Bypass Rd: Periyar → Anna Nagar', from: 'mdu-periyar', to: 'mdu-anna-nagar',
    path: [[9.9252, 78.1230], [9.9300, 78.1200], [9.9350, 78.1150], [9.9400, 78.1100]],
    lanes: 3, capacity: 150, sensors: ['s-mdu-2', 's-mdu-3']
  },
  {
    id: 'mdu-meena-thiru', name: 'Thirunagar Rd: Meenakshi → Thirunagar', from: 'mdu-meenakshi', to: 'mdu-thirunagar',
    path: [[9.9195, 78.1193], [9.9150, 78.1100], [9.9100, 78.1000], [9.9050, 78.0900]],
    lanes: 2, capacity: 110, sensors: ['s-mdu-4']
  },
  {
    id: 'mdu-periyar-mattu', name: 'Mattuthavani Rd', from: 'mdu-periyar', to: 'mdu-mattuthavani',
    path: [[9.9252, 78.1230], [9.9180, 78.1300], [9.9100, 78.1380], [9.8980, 78.1450]],
    lanes: 2, capacity: 120, sensors: ['s-mdu-5', 's-mdu-6']
  },
];

// ─── TRICHY SEGMENTS ───
const trichySegments: RoadSegment[] = [
  {
    id: 'trichy-jn-thillai', name: 'Salai Rd: Junction → Thillai Nagar', from: 'trichy-junction', to: 'trichy-thillai-nagar',
    path: [[10.7905, 78.6826], [10.7950, 78.6850], [10.8000, 78.6880], [10.8050, 78.6920]],
    lanes: 2, capacity: 120, sensors: ['s-tri-1', 's-tri-2']
  },
  {
    id: 'trichy-thillai-sri', name: 'Madurai Rd: Thillai Nagar → Srirangam', from: 'trichy-thillai-nagar', to: 'trichy-srirangam',
    path: [[10.8050, 78.6920], [10.8200, 78.6910], [10.8400, 78.6905], [10.8627, 78.6900]],
    lanes: 2, capacity: 130, sensors: ['s-tri-3']
  },
  {
    id: 'trichy-jn-canton', name: 'Junction → Cantonment', from: 'trichy-junction', to: 'trichy-cantonment',
    path: [[10.7905, 78.6826], [10.8000, 78.6780], [10.8100, 78.6740], [10.8200, 78.6700]],
    lanes: 2, capacity: 100, sensors: ['s-tri-4']
  },
];

// ─── SALEM SEGMENTS ───
const salemSegments: RoadSegment[] = [
  {
    id: 'salem-jn-five', name: 'Cherry Rd: Junction → Five Roads', from: 'salem-junction', to: 'salem-five-roads',
    path: [[11.6643, 78.1460], [11.6600, 78.1490], [11.6550, 78.1520], [11.6500, 78.1550]],
    lanes: 2, capacity: 110, sensors: ['s-slm-1']
  },
  {
    id: 'salem-jn-omalur', name: 'NH44: Salem → Omalur', from: 'salem-junction', to: 'salem-omalur',
    path: [[11.6643, 78.1460], [11.6800, 78.1200], [11.7100, 78.0800], [11.7420, 78.0400]],
    lanes: 3, capacity: 180, sensors: ['s-slm-2', 's-slm-3']
  },
];

// ─── TIRUNELVELI SEGMENTS ───
const tirunelveliSegments: RoadSegment[] = [
  {
    id: 'tvl-jn-palaya', name: 'South Car St: Junction → Palayamkottai', from: 'tvl-junction', to: 'tvl-palayamkottai',
    path: [[8.7139, 77.7567], [8.7160, 77.7520], [8.7190, 77.7470], [8.7220, 77.7420]],
    lanes: 2, capacity: 90, sensors: ['s-tvl-1']
  },
  {
    id: 'tvl-jn-melapa', name: 'Bypass Rd: Junction → Melapalayam', from: 'tvl-junction', to: 'tvl-melapalayam',
    path: [[8.7139, 77.7567], [8.7100, 77.7480], [8.7020, 77.7390], [8.6950, 77.7300]],
    lanes: 2, capacity: 100, sensors: ['s-tvl-2']
  },
];

// ─── VELLORE SEGMENTS ───
const velloreSegments: RoadSegment[] = [
  {
    id: 'vel-fort-katpadi', name: 'NH46: Vellore Fort → Katpadi', from: 'vellore-fort', to: 'vellore-katpadi',
    path: [[12.9165, 79.1325], [12.9300, 79.1350], [12.9500, 79.1400], [12.9690, 79.1470]],
    lanes: 2, capacity: 130, sensors: ['s-vel-1', 's-vel-2']
  },
];

// ─── INTER-CITY HIGHWAY SEGMENTS ───
const highwaySegments: RoadSegment[] = [
  {
    id: 'nh45-che-villu', name: 'NH45: Chennai → Villupuram', from: 'chennai-tambaram', to: 'villupuram',
    path: [[12.9249, 80.1000], [12.6500, 79.9000], [12.3000, 79.7000], [11.9401, 79.4861]],
    lanes: 4, capacity: 300, sensors: ['s-nh45-1', 's-nh45-2', 's-nh45-3']
  },
  {
    id: 'nh48-che-hosur', name: 'NH48: Chennai → Hosur', from: 'chennai-chromepet', to: 'hosur',
    path: [[12.9516, 80.1415], [12.9000, 79.6000], [12.8200, 78.9000], [12.7409, 77.8253]],
    lanes: 4, capacity: 280, sensors: ['s-nh48-1', 's-nh48-2']
  },
  {
    id: 'nh44-hosur-krishi', name: 'NH44: Hosur → Krishnagiri', from: 'hosur', to: 'krishnagiri',
    path: [[12.7409, 77.8253], [12.6800, 78.0000], [12.6000, 78.1000], [12.5186, 78.2137]],
    lanes: 4, capacity: 300, sensors: ['s-nh44-1', 's-nh44-2']
  },
  {
    id: 'nh44-krishi-salem', name: 'NH44: Krishnagiri → Salem', from: 'krishnagiri', to: 'salem-junction',
    path: [[12.5186, 78.2137], [12.2000, 78.1800], [11.9000, 78.1600], [11.6643, 78.1460]],
    lanes: 3, capacity: 250, sensors: ['s-nh44-3', 's-nh44-4']
  },
  {
    id: 'nh44-salem-erode', name: 'NH44: Salem → Erode', from: 'salem-junction', to: 'erode',
    path: [[11.6643, 78.1460], [11.5500, 78.0000], [11.4500, 77.8500], [11.3410, 77.7172]],
    lanes: 3, capacity: 230, sensors: ['s-nh44-5', 's-nh44-6']
  },
  {
    id: 'nh44-erode-cbe', name: 'NH44: Erode → Coimbatore', from: 'erode', to: 'cbe-junction',
    path: [[11.3410, 77.7172], [11.2500, 77.5000], [11.1300, 77.2500], [11.0168, 76.9558]],
    lanes: 3, capacity: 250, sensors: ['s-nh44-7', 's-nh44-8']
  },
  {
    id: 'nh38-trichy-dindigul', name: 'NH38: Trichy → Dindigul', from: 'trichy-junction', to: 'dindigul',
    path: [[10.7905, 78.6826], [10.6500, 78.4500], [10.5000, 78.2000], [10.3624, 77.9695]],
    lanes: 3, capacity: 200, sensors: ['s-nh38-1', 's-nh38-2']
  },
  {
    id: 'nh38-dindigul-mdu', name: 'NH38: Dindigul → Madurai', from: 'dindigul', to: 'mdu-periyar',
    path: [[10.3624, 77.9695], [10.2500, 78.0200], [10.1000, 78.0700], [9.9252, 78.1230]],
    lanes: 3, capacity: 200, sensors: ['s-nh38-3', 's-nh38-4']
  },
  {
    id: 'nh44-erode-karur', name: 'NH44: Erode → Karur', from: 'erode', to: 'karur',
    path: [[11.3410, 77.7172], [11.2000, 77.8000], [11.1000, 77.9400], [10.9601, 78.0766]],
    lanes: 2, capacity: 180, sensors: ['s-nh44-9']
  },
  {
    id: 'nh-karur-trichy', name: 'NH: Karur → Trichy', from: 'karur', to: 'trichy-junction',
    path: [[10.9601, 78.0766], [10.9000, 78.2500], [10.8500, 78.4500], [10.7905, 78.6826]],
    lanes: 2, capacity: 170, sensors: ['s-nk-1', 's-nk-2']
  },
  {
    id: 'nh-trichy-thanja', name: 'NH: Trichy → Thanjavur', from: 'trichy-junction', to: 'thanjavur',
    path: [[10.7905, 78.6826], [10.7900, 78.8000], [10.7890, 78.9700], [10.7870, 79.1378]],
    lanes: 2, capacity: 160, sensors: ['s-ntt-1', 's-ntt-2']
  },
  {
    id: 'nh-mdu-tvl', name: 'NH44: Madurai → Tirunelveli', from: 'mdu-periyar', to: 'tvl-junction',
    path: [[9.9252, 78.1230], [9.6000, 78.0000], [9.2000, 77.9000], [8.7139, 77.7567]],
    lanes: 3, capacity: 220, sensors: ['s-mt-1', 's-mt-2']
  },
  {
    id: 'nh-che-kanchi', name: 'NH: Chennai → Kanchipuram', from: 'chennai-tambaram', to: 'kanchipuram',
    path: [[12.9249, 80.1000], [12.9000, 79.9500], [12.8700, 79.8200], [12.8342, 79.7036]],
    lanes: 3, capacity: 200, sensors: ['s-nck-1', 's-nck-2']
  },
  {
    id: 'nh-kanchi-vellore', name: 'NH: Kanchipuram → Vellore', from: 'kanchipuram', to: 'vellore-fort',
    path: [[12.8342, 79.7036], [12.8500, 79.5000], [12.8800, 79.3000], [12.9165, 79.1325]],
    lanes: 2, capacity: 160, sensors: ['s-nkv-1', 's-nkv-2']
  },
];

// ─── COMBINED EXPORTS ───
export const allSegments: RoadSegment[] = [
  ...chennaiSegments, ...coimbatoreSegments, ...maduraiSegments,
  ...trichySegments, ...salemSegments, ...tirunelveliSegments,
  ...velloreSegments, ...highwaySegments,
];

// Generate sensors from segment definitions
export const allSensors: VirtualSensor[] = allSegments.flatMap(seg =>
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

// Adjacency
export function getAllConnectedSegments(segmentId: string): string[] {
  const seg = allSegments.find(s => s.id === segmentId);
  if (!seg) return [];
  return allSegments
    .filter(s => s.id !== segmentId && (s.from === seg.to || s.to === seg.from || s.from === seg.from || s.to === seg.to))
    .map(s => s.id);
}
