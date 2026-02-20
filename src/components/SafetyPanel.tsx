import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Phone,
  Star,
  Send,
  Lightbulb,
  Camera,
  Clock,
  Siren,
} from 'lucide-react';
import { segments, nodes } from '@/lib/bengaluru-roads';
import { useTraffic } from '@/hooks/useTraffic';
import {
  getSegmentSafetyScore,
  getAllSafetyScores,
  getRecentIncidents,
  getMockRatings,
  getTransportModes,
  findSafestRoute,
  emergencyContacts,
  safetyColor,
  type CrowdRating,
  type TransportMode,
} from '@/lib/safety-engine';

/* ───────────────── COMPONENTS ───────────────── */

function SafetyGauge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-success'
      : score >= 60
      ? 'text-accent'
      : 'text-destructive';

  return (
    <div
      className={`w-16 h-16 rounded-full bg-secondary flex items-center justify-center font-bold ${color}`}
    >
      {score}
    </div>
  );
}

function TransportBadge({ mode }: { mode: TransportMode }) {
  const icons: Record<string, string> = {
    bus: '🚌',
    metro: '🚇',
    auto: '🛺',
    walking: '🚶‍♀️',
  };

  return (
    <div className="panel p-2.5">
      <div className="flex items-center gap-2">
        <span>{icons[mode.type]}</span>
        <div className="flex-1 text-[11px] font-bold">
          {mode.name}
        </div>
        <div className="text-xs font-mono">{mode.safetyScore}</div>
      </div>
    </div>
  );
}

/* ───────────────── MAIN PANEL ───────────────── */

type SafetyTab = 'overview' | 'route' | 'incidents' | 'emergency';

export default function SafetyPanel() {
  const { addSafetyReport } = useTraffic();

  const [tab, setTab] = useState<SafetyTab>('overview');
  const [selectedSeg, setSelectedSeg] = useState('orr-silk-mara');
  const [fromNode, setFromNode] = useState('majestic');
  const [toNode, setToNode] = useState('whitefield');
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [userRatings, setUserRatings] = useState<CrowdRating[]>([]);
  const [liveTracking, setLiveTracking] = useState(false);

  /* ───────────── DATA ───────────── */

  const allScores = useMemo(() => getAllSafetyScores(), []);
  const currentScore = useMemo(
    () => getSegmentSafetyScore(selectedSeg),
    [selectedSeg]
  );
  const incidents = useMemo(() => getRecentIncidents(), []);
  const ratings = useMemo(
    () => [...userRatings, ...getMockRatings()],
    [userRatings]
  );
  const transportModes = useMemo(
    () => getTransportModes(selectedSeg),
    [selectedSeg]
  );
  const safeRoutes = useMemo(
    () => findSafestRoute(fromNode, toNode),
    [fromNode, toNode]
  );

  /* ───────────── ACTIONS ───────────── */

  const submitRating = useCallback(() => {
    if (!newRating) return;

    const r: CrowdRating = {
      id: `user-${Date.now()}`,
      segmentId: selectedSeg,
      userId: 'current-user',
      rating: newRating,
      comment: newComment || 'No comment',
      timestamp: Date.now(),
      tags: newRating >= 4 ? ['feels-safe'] : ['caution'],
    };

    setUserRatings(prev => [r, ...prev]);
    setNewRating(0);
    setNewComment('');
  }, [newRating, newComment, selectedSeg]);

  const reportIncident = useCallback(() => {
    addSafetyReport({
      location:
        segments.find(s => s.id === selectedSeg)?.name ||
        'Unknown road',
      description: 'User reported safety issue',
    });
  }, [addSafetyReport, selectedSeg]);

  /* ───────────── UI ───────────── */

  const tabs = [
    { id: 'overview' as const, label: '🛡️ Safety' },
    { id: 'route' as const, label: '🗺️ Routes' },
    { id: 'incidents' as const, label: '⚠️ Reports' },
    { id: 'emergency' as const, label: '🚨 SOS' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-pink-500" />
          <span className="text-sm font-bold">
            Women's Safety Nav
          </span>
        </div>

        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-2 text-[10px] rounded-lg ${
                tab === t.id
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <motion.div key="overview">
              <div className="panel p-4">
                <div className="flex items-center gap-3">
                  <SafetyGauge score={currentScore.overall} />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Route Safety
                    </div>
                    <div className="text-sm font-bold">
                      {
                        segments.find(s => s.id === selectedSeg)
                          ?.name
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel p-3">
                <select
                  value={selectedSeg}
                  onChange={e => setSelectedSeg(e.target.value)}
                  className="w-full text-xs bg-secondary rounded px-2 py-1.5"
                >
                  {segments.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="panel p-3">
                <div className="text-xs font-bold mb-2">
                  🚇 Transport Options
                </div>
                <div className="flex flex-col gap-1.5">
                  {transportModes.map(m => (
                    <TransportBadge key={m.id} mode={m} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* INCIDENTS */}
          {tab === 'incidents' && (
            <motion.div key="incidents">
              <div className="panel p-3 bg-destructive/5 border-destructive/20">
                <div className="text-xs font-bold text-destructive mb-2">
                  📢 Report an Incident
                </div>

                <div className="text-[10px] text-muted-foreground mb-2">
                  Your reports help keep other women safe.
                </div>

                <button
                  onClick={reportIncident}
                  className="w-full py-2 rounded-lg bg-destructive/20 text-destructive text-[11px] font-bold hover:bg-destructive/30"
                >
                  🚨 Send Safety Report to Operator
                </button>
              </div>

              <div className="text-[10px] font-bold mt-3">
                Recent Reports ({incidents.length})
              </div>
            </motion.div>
          )}

          {/* EMERGENCY */}
          {tab === 'emergency' && (
            <motion.div key="emergency">
              <motion.button
                className="w-full py-6 rounded-xl bg-destructive text-white font-bold"
                whileTap={{ scale: 0.95 }}
                onClick={() => setLiveTracking(true)}
              >
                <Siren className="w-8 h-8 mx-auto mb-2" />
                🚨 EMERGENCY SOS
              </motion.button>

              <div className="panel p-3 mt-3">
                <div className="text-xs font-bold mb-2">
                  📞 Emergency Contacts
                </div>

                {emergencyContacts.map((c, i) => (
                  <a
                    key={i}
                    href={`tel:${c.number}`}
                    className="flex justify-between py-2 text-xs"
                  >
                    <span>{c.name}</span>
                    <span className="text-primary font-bold">
                      {c.number}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}