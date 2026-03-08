import { allSegments } from './tamilnadu-roads';

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

// Tamil Nadu traffic police officers
export const officers: TrafficOfficer[] = [
  {
    id: 'off-1', name: 'Rajesh Kannan', badge: 'TNTP-1042', phone: '+91 98450 12345',
    rank: 'Inspector', zone: 'Anna Salai – T.Nagar',
    assignedSegments: ['che-egmore-tnagar', 'che-tnagar-guindy', 'che-central-egmore'],
    status: 'on-duty', avatar: '👮',
  },
  {
    id: 'off-2', name: 'Priya Lakshmi', badge: 'TNTP-2087', phone: '+91 98451 23456',
    rank: 'Sub-Inspector', zone: 'OMR – Velachery',
    assignedSegments: ['che-velachery-omr', 'che-omr-sholinganallur', 'che-perungudi-omr'],
    status: 'on-duty', avatar: '👮‍♀️',
  },
  {
    id: 'off-3', name: 'Mohammed Irfan', badge: 'TNTP-3156', phone: '+91 98452 34567',
    rank: 'Inspector', zone: 'Guindy – Chromepet',
    assignedSegments: ['che-guindy-chromepet', 'che-chromepet-tambaram', 'che-porur-guindy'],
    status: 'responding', avatar: '👮',
  },
  {
    id: 'off-4', name: 'Kavitha Devi', badge: 'TNTP-4203', phone: '+91 98453 45678',
    rank: 'Head Constable', zone: 'Anna Nagar – Ambattur',
    assignedSegments: ['che-central-anna-nagar', 'che-anna-nagar-ambattur', 'che-ambattur-avadi'],
    status: 'on-duty', avatar: '👮‍♀️',
  },
  {
    id: 'off-5', name: 'Suresh Kumar', badge: 'CBTP-5078', phone: '+91 98454 56789',
    rank: 'Sub-Inspector', zone: 'Coimbatore – Gandhipuram',
    assignedSegments: ['cbe-jn-gandhi', 'cbe-gandhi-peela', 'cbe-gandhi-sarava'],
    status: 'on-duty', avatar: '👮',
  },
  {
    id: 'off-6', name: 'Anitha Rani', badge: 'MDTP-6134', phone: '+91 98455 67890',
    rank: 'Constable', zone: 'Madurai – Meenakshi',
    assignedSegments: ['mdu-meena-periyar', 'mdu-meena-thiru', 'mdu-periyar-anna'],
    status: 'off-duty', avatar: '👮‍♀️',
  },
  {
    id: 'off-7', name: 'Venkatesh Iyer', badge: 'TNTP-7211', phone: '+91 98456 78901',
    rank: 'Inspector', zone: 'NH44 – Hosur–Salem',
    assignedSegments: ['nh44-hosur-krishi', 'nh44-krishi-salem', 'nh48-che-hosur'],
    status: 'on-duty', avatar: '👮',
  },
];

export function getOfficersForSegment(segmentId: string): TrafficOfficer[] {
  return officers.filter(o => o.assignedSegments.includes(segmentId));
}

export function getSegmentOfficerInfo(segmentId: string) {
  const seg = allSegments.find(s => s.id === segmentId);
  const assignedOfficers = getOfficersForSegment(segmentId);
  return { segment: seg, officers: assignedOfficers };
}

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
