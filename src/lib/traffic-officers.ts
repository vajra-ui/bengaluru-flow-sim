import { segments } from './bengaluru-roads';

export interface TrafficOfficer {
  id: string;
  name: string;
  badge: string;
  phone: string;
  rank: 'Inspector' | 'Sub-Inspector' | 'Head Constable' | 'Constable';
  zone: string;
  assignedSegments: string[];
  status: 'on-duty' | 'responding' | 'off-duty';
  avatar: string;
}

// Mock officers assigned to Bengaluru zones
export const officers: TrafficOfficer[] = [
  {
    id: 'off-1', name: 'Rajesh Kumar', badge: 'BTP-1042', phone: '+91 98450 12345',
    rank: 'Inspector', zone: 'Silk Board – ORR South',
    assignedSegments: ['orr-silk-mara', 'hosur-silk-ec', 'koram-silk'],
    status: 'on-duty', avatar: '👮',
  },
  {
    id: 'off-2', name: 'Priya Sharma', badge: 'BTP-2087', phone: '+91 98451 23456',
    rank: 'Sub-Inspector', zone: 'Marathahalli – KR Puram',
    assignedSegments: ['orr-mara-krp', 'ind-mara', 'mara-whitefield'],
    status: 'on-duty', avatar: '👮‍♀️',
  },
  {
    id: 'off-3', name: 'Mohammed Fazil', badge: 'BTP-3156', phone: '+91 98452 34567',
    rank: 'Inspector', zone: 'MG Road – Indiranagar',
    assignedSegments: ['mg-majestic-ind', 'majestic-mg', 'majestic-raja'],
    status: 'responding', avatar: '👮',
  },
  {
    id: 'off-4', name: 'Lakshmi Devi', badge: 'BTP-4203', phone: '+91 98453 45678',
    rank: 'Head Constable', zone: 'Hebbal – Yelahanka',
    assignedSegments: ['bell-road', 'hebbal-yelahanka', 'hebbal-orrn'],
    status: 'on-duty', avatar: '👮‍♀️',
  },
  {
    id: 'off-5', name: 'Suresh Babu', badge: 'BTP-5078', phone: '+91 98454 56789',
    rank: 'Sub-Inspector', zone: 'Bellandur – Sarjapur',
    assignedSegments: ['bell-sarj', 'hsr-sarjapur', 'btm-hsr'],
    status: 'on-duty', avatar: '👮',
  },
  {
    id: 'off-6', name: 'Anita Rao', badge: 'BTP-6134', phone: '+91 98455 67890',
    rank: 'Constable', zone: 'Jayanagar – Banashankari',
    assignedSegments: ['jayanagar-bana', 'majestic-jaya', 'koram-btm'],
    status: 'off-duty', avatar: '👮‍♀️',
  },
  {
    id: 'off-7', name: 'Venkatesh Murthy', badge: 'BTP-7211', phone: '+91 98456 78901',
    rank: 'Inspector', zone: 'ORR North – KR Puram',
    assignedSegments: ['orr-n-krp', 'raja-yeshwanth'],
    status: 'on-duty', avatar: '👮',
  },
];

/** Get officers assigned to a segment */
export function getOfficersForSegment(segmentId: string): TrafficOfficer[] {
  return officers.filter(o => o.assignedSegments.includes(segmentId));
}

/** Get the segment detail with officer info */
export function getSegmentOfficerInfo(segmentId: string) {
  const seg = segments.find(s => s.id === segmentId);
  const assignedOfficers = getOfficersForSegment(segmentId);
  return { segment: seg, officers: assignedOfficers };
}

/** Preventive actions for moderate traffic */
export interface PreventiveAction {
  condition: string;
  action: string;
  urgency: 'low' | 'medium' | 'high';
}

export function getPreventiveActions(congestionLevel: number, trend: string): PreventiveAction[] {
  const actions: PreventiveAction[] = [];

  if (congestionLevel >= 0.4 && congestionLevel < 0.6) {
    actions.push(
      { condition: 'Moderate buildup detected', action: 'Extend green signal by 15 seconds on main corridor', urgency: 'low' },
      { condition: 'Vehicles spacing decreasing', action: 'Open parallel service road for overflow', urgency: 'low' },
    );
    if (trend === 'rising') {
      actions.push(
        { condition: 'Trend rising toward heavy', action: 'Alert nearby zone officers for standby', urgency: 'medium' },
        { condition: 'Inflow exceeding outflow', action: 'Reduce feeder road green signal duration', urgency: 'medium' },
      );
    }
  }

  if (congestionLevel >= 0.6 && congestionLevel < 0.75) {
    actions.push(
      { condition: 'Approaching heavy traffic', action: 'Deploy traffic officer to manage junction manually', urgency: 'medium' },
      { condition: 'Queue building rapidly', action: 'Activate dynamic message signs to divert traffic', urgency: 'medium' },
      { condition: 'Spillover risk increasing', action: 'Coordinate with adjacent zone to absorb overflow', urgency: 'high' },
    );
  }

  return actions;
}
