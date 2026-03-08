import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, MapPin, Phone, Star, Navigation, Eye, Siren, ChevronDown, ChevronUp, Send, Users, Lightbulb, Camera, Clock } from 'lucide-react';
import { allSegments, allNodes } from '@/lib/tamilnadu-roads';
import { useTraffic } from '@/hooks/useTraffic';
import {
  getSegmentSafetyScore, getAllSafetyScores, getRecentIncidents, getMockRatings,
  getTransportModes, findSafestRoute, emergencyContacts, safetyColor,
  type SafetyScore, type SafetyIncident, type CrowdRating, type TransportMode, type SafeRoute,
} from '@/lib/safety-engine';

/* ─── Sub-components ─── */

function SafetyGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score >= 80 ? 'text-success' : score >= 65 ? 'text-[hsl(80,60%,50%)]' : score >= 50 ? 'text-accent' : score >= 35 ? 'text-[hsl(24,90%,55%)]' : 'text-destructive';
  const bg = score >= 80 ? 'bg-success/15' : score >= 65 ? 'bg-success/10' : score >= 50 ? 'bg-accent/10' : score >= 35 ? 'bg-accent/10' : 'bg-destructive/10';
  const sz = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-2xl';
  return (
    <div className={`${sz} rounded-full ${bg} flex items-center justify-center font-mono font-bold ${color} border border-current/20`}>
      {score}
    </div>
  );
}

function FactorBar({ label, icon, value, inverted = false }: { label: string; icon: React.ReactNode; value: number; inverted?: boolean }) {
  const display = inverted ? 1 - value : value;
  const color = display >= 0.7 ? 'bg-success' : display >= 0.4 ? 'bg-accent' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 text-muted-foreground shrink-0">{icon}</div>
      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${Math.round(display * 100)}%` }} />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground w-7 text-right">{Math.round(display * 100)}%</span>
    </div>
  );
}

function TransportBadge({ mode }: { mode: TransportMode }) {
  const icons: Record<string, string> = { bus: '🚌', metro: '🚇', auto: '🛺', walking: '🚶‍♀️' };
  const scoreColor = mode.safetyScore >= 80 ? 'congestion-low' : mode.safetyScore >= 60 ? 'congestion-medium' : 'congestion-high';
  return (
    <div className="panel p-2.5">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icons[mode.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-foreground">{mode.name}</div>
          {mode.frequency && <div className="text-[9px] text-muted-foreground">{mode.frequency}</div>}
        </div>
        <div className={`text-xs font-bold font-mono ${scoreColor}`}>{mode.safetyScore}</div>
      </div>
      {mode.note && <div className="text-[9px] text-muted-foreground mt-1 ml-7">{mode.note}</div>}
    </div>
  );
}

function IncidentCard({ incident }: { incident: SafetyIncident }) {
  const icons: Record<string, string> = { harassment: '⚠️', theft: '🚨', stalking: '👁️', poor_lighting: '💡', unsafe_area: '🔺' };
  const sevColor = incident.severity === 'high' ? 'border-l-destructive' : incident.severity === 'medium' ? 'border-l-accent' : 'border-l-muted';
  const segName = allSegments.find(s => s.id === incident.segmentId)?.name ?? 'Unknown';
  const timeAgo = Math.round((Date.now() - incident.reportedAt) / 60000);
  const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`;

  return (
    <div className={`panel p-2.5 border-l-4 ${sevColor}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0">{icons[incident.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-foreground">{incident.description}</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">📍 {segName} · {timeStr}</div>
        </div>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
          incident.severity === 'high' ? 'bg-destructive/20 congestion-high' : incident.severity === 'medium' ? 'bg-accent/20 congestion-medium' : 'bg-secondary text-muted-foreground'
        }`}>{incident.severity.toUpperCase()}</span>
      </div>
    </div>
  );
}

function RatingCard({ rating }: { rating: CrowdRating }) {
  const segName = allSegments.find(s => s.id === rating.segmentId)?.name ?? 'Unknown';
  return (
    <div className="panel p-2.5">
      <div className="flex items-start gap-2">
        <div className="flex gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`w-3 h-3 ${i <= rating.rating ? 'text-accent fill-accent' : 'text-muted'}`} />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-foreground">{rating.comment}</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">📍 {segName}</div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {rating.tags.map(t => (
              <span key={t} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Panel ─── */

type SafetyTab = 'overview' | 'route' | 'incidents' | 'emergency';

export default function SafetyPanel() {
  const [tab, setTab] = useState<SafetyTab>('overview');
  const [selectedSeg, setSelectedSeg] = useState<string>('che-egmore-tnagar');
  const [fromSearch, setFromSearch] = useState('Chennai Central');
  const [toSearch, setToSearch] = useState('T. Nagar');
  const [fromNode, setFromNode] = useState('chennai-central');
  const [toNode, setToNode] = useState('chennai-tnagar');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [liveTracking, setLiveTracking] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [userRatings, setUserRatings] = useState<CrowdRating[]>([]);
  const { states } = useTraffic();

  const filteredFromNodes = useMemo(() =>
    allNodes.filter(n => n.name.toLowerCase().includes(fromSearch.toLowerCase())),
    [fromSearch]
  );
  const filteredToNodes = useMemo(() =>
    allNodes.filter(n => n.name.toLowerCase().includes(toSearch.toLowerCase())),
    [toSearch]
  );

  const allScores = useMemo(() => getAllSafetyScores(), []);
  const currentScore = useMemo(() => getSegmentSafetyScore(selectedSeg), [selectedSeg]);
  const incidents = useMemo(() => getRecentIncidents(), []);
  const ratings = useMemo(() => [...userRatings, ...getMockRatings()], [userRatings]);
  const transportModes = useMemo(() => getTransportModes(selectedSeg), [selectedSeg]);
  const safeRoutes = useMemo(() => findSafestRoute(fromNode, toNode), [fromNode, toNode]);

  const sortedSegments = useMemo(() =>
    allSegments.map(s => ({ seg: s, score: allScores.get(s.id)! }))
      .filter(s => s.score)
      .sort((a, b) => a.score.overall - b.score.overall),
    [allScores]
  );

  const submitRating = useCallback(() => {
    if (newRating === 0) return;
    const r: CrowdRating = {
      id: `user-${Date.now()}`,
      segmentId: selectedSeg,
      userId: 'current-user',
      rating: newRating,
      comment: newComment || 'No comment',
      timestamp: Date.now(),
      tags: newRating >= 4 ? ['feels-safe'] : newRating >= 3 ? ['average'] : ['caution'],
    };
    setUserRatings(prev => [r, ...prev]);
    setNewRating(0);
    setNewComment('');
  }, [newRating, newComment, selectedSeg]);

  const tabs = [
    { id: 'overview' as const, label: '🛡️ Safety' },
    { id: 'route' as const, label: '🗺️ Routes' },
    { id: 'incidents' as const, label: '⚠️ Reports', badge: incidents.filter(i => i.severity === 'high').length },
    { id: 'emergency' as const, label: '🚨 SOS' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-[hsl(320,70%,60%)]" />
          <span className="text-sm font-bold text-foreground">Women's Safety Nav</span>
          <div className="status-dot-live ml-auto" />
        </div>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-2 text-[10px] rounded-lg transition-colors text-center relative ${
                tab === t.id
                  ? 'bg-[hsl(320,70%,60%)]/15 text-[hsl(320,70%,60%)] border border-[hsl(320,70%,60%)]/30'
                  : 'bg-secondary/50 text-muted-foreground border border-transparent hover:border-border'
              }`}
            >
              {t.label}
              {t.badge ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-destructive text-destructive-foreground rounded-full">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {/* ─── OVERVIEW TAB ─── */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {/* Current location safety */}
              <div className="panel p-4">
                <div className="flex items-center gap-3 mb-3">
                  <SafetyGauge score={currentScore.overall} />
                  <div>
                    <div className="text-xs text-muted-foreground">Your Route Safety</div>
                    <div className="text-sm font-bold text-foreground">{allSegments.find(s => s.id === selectedSeg)?.name}</div>
                    <div className={`text-xs font-bold mt-0.5 ${
                      currentScore.overall >= 65 ? 'congestion-low' : currentScore.overall >= 50 ? 'congestion-medium' : 'congestion-high'
                    }`}>
                      Grade {currentScore.grade} · {currentScore.label}
                    </div>
                  </div>
                </div>

                {/* Factors */}
                <div className="flex flex-col gap-1.5">
                  <FactorBar label="Lighting" icon={<Lightbulb className="w-3 h-3" />} value={currentScore.factors.lighting} />
                  <FactorBar label="CCTV" icon={<Camera className="w-3 h-3" />} value={currentScore.factors.cctvCoverage} />
                  <FactorBar label="Police" icon={<Shield className="w-3 h-3" />} value={currentScore.factors.policePresence} />
                  <FactorBar label="Time Risk" icon={<Clock className="w-3 h-3" />} value={currentScore.factors.timeRisk} inverted />
                  <FactorBar label="Incidents" icon={<AlertTriangle className="w-3 h-3" />} value={currentScore.factors.incidentHistory} inverted />
                </div>
              </div>

              {/* Road selector */}
              <div className="panel p-3">
                <div className="text-[10px] text-muted-foreground mb-1.5">Select your road:</div>
                <select
                  value={selectedSeg}
                  onChange={e => setSelectedSeg(e.target.value)}
                  className="w-full text-xs bg-secondary/50 text-foreground border border-border rounded-lg px-2 py-1.5"
                >
                  {allSegments.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Transport modes */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">🚇 Transport Options (by safety)</div>
                <div className="flex flex-col gap-1.5">
                  {transportModes.map(m => <TransportBadge key={m.id} mode={m} />)}
                </div>
              </div>

              {/* Safety Heatmap Summary */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">🗺️ City Safety Heatmap</div>
                <div className="flex flex-col gap-1">
                  {sortedSegments.map(({ seg, score }) => (
                    <button
                      key={seg.id}
                      onClick={() => setSelectedSeg(seg.id)}
                      className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-secondary/30 transition-colors"
                    >
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: safetyColor(score.overall) }} />
                      <span className="text-[10px] text-foreground truncate flex-1 text-left">{seg.name}</span>
                      <span className={`text-[10px] font-bold font-mono ${
                        score.overall >= 65 ? 'congestion-low' : score.overall >= 50 ? 'congestion-medium' : 'congestion-high'
                      }`}>{score.overall}</span>
                      <span className="text-[8px] text-muted-foreground w-5">{score.grade}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crowdsourced Ratings */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">⭐ Community Safety Ratings</div>
                {/* Submit rating */}
                <div className="bg-secondary/30 rounded-lg p-2.5 mb-2">
                  <div className="text-[10px] text-muted-foreground mb-1">Rate this route's safety:</div>
                  <div className="flex items-center gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button key={i} onClick={() => setNewRating(i)} className="p-0.5">
                        <Star className={`w-5 h-5 transition-colors ${i <= newRating ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-background text-xs text-foreground rounded px-2 py-1 border border-border"
                    />
                    <button onClick={submitRating} className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {ratings.slice(0, 5).map(r => <RatingCard key={r.id} rating={r} />)}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── ROUTE TAB ─── */}
          {tab === 'route' && (
            <motion.div key="route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">🧭 Find Safest Route</div>
                <div className="text-[10px] text-muted-foreground mb-2">We prioritize safety over shortest distance.</div>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <label className="text-[9px] text-muted-foreground uppercase">From</label>
                    <input
                      type="text"
                      value={fromSearch}
                      onChange={e => { setFromSearch(e.target.value); setShowFromSuggestions(true); }}
                      onFocus={() => setShowFromSuggestions(true)}
                      placeholder="Search location..."
                      className="w-full text-xs bg-secondary/50 text-foreground border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {showFromSuggestions && filteredFromNodes.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg max-h-32 overflow-y-auto">
                        {filteredFromNodes.slice(0, 8).map(n => (
                          <button key={n.id} onClick={() => { setFromNode(n.id); setFromSearch(n.name); setShowFromSuggestions(false); }}
                            className="w-full text-left px-2 py-1.5 text-[11px] text-foreground hover:bg-secondary/50 transition-colors">
                            📍 {n.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className="text-[9px] text-muted-foreground uppercase">To</label>
                    <input
                      type="text"
                      value={toSearch}
                      onChange={e => { setToSearch(e.target.value); setShowToSuggestions(true); }}
                      onFocus={() => setShowToSuggestions(true)}
                      placeholder="Search destination..."
                      className="w-full text-xs bg-secondary/50 text-foreground border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {showToSuggestions && filteredToNodes.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg max-h-32 overflow-y-auto">
                        {filteredToNodes.slice(0, 8).map(n => (
                          <button key={n.id} onClick={() => { setToNode(n.id); setToSearch(n.name); setShowToSuggestions(false); }}
                            className="w-full text-left px-2 py-1.5 text-[11px] text-foreground hover:bg-secondary/50 transition-colors">
                            📍 {n.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {safeRoutes.length === 0 ? (
                <div className="panel p-4 text-center">
                  <div className="text-2xl mb-1">🔍</div>
                  <div className="text-xs text-muted-foreground">No routes found between these points.</div>
                </div>
              ) : (
                safeRoutes.map((route, i) => (
                  <div key={i} className={`panel p-3 ${route.isSafest ? 'border-success/40 bg-success/5' : ''}`}>
                    {route.isSafest && (
                      <div className="text-[9px] font-bold text-success uppercase tracking-widest mb-1">✅ Safest Route</div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <SafetyGauge score={route.safetyScore} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-foreground">{route.segmentNames.join(' → ')}</div>
                        <div className="text-[9px] text-muted-foreground">{route.distance.toFixed(1)} km · ~{route.estimatedTime} min</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {route.transportModes.slice(0, 3).map(m => {
                        const icons: Record<string, string> = { bus: '🚌', metro: '🚇', auto: '🛺', walking: '🚶‍♀️' };
                        return (
                          <span key={m.id} className="text-[9px] bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded-full">
                            {icons[m.type]} {m.name} ({m.safetyScore})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── INCIDENTS TAB ─── */}
          {tab === 'incidents' && (
            <motion.div key="incidents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <div className="panel p-3 bg-destructive/5 border-destructive/20">
                <div className="text-xs font-bold text-destructive">📢 Report an Incident</div>
                <div className="text-[10px] text-muted-foreground mt-1">Your reports help keep other women safe. All reports are anonymous.</div>
              </div>
              <div className="text-[10px] font-bold text-foreground px-1">Recent Reports ({incidents.length})</div>
              {incidents.map(inc => <IncidentCard key={inc.id} incident={inc} />)}
            </motion.div>
          )}

          {/* ─── EMERGENCY TAB ─── */}
          {tab === 'emergency' && (
            <motion.div key="emergency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {/* SOS Button */}
              <motion.button
                className="w-full py-6 rounded-xl bg-destructive text-destructive-foreground font-bold text-lg tracking-wide"
                style={{ boxShadow: '0 0 30px hsl(0 75% 55% / 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLiveTracking(true)}
              >
                <Siren className="w-8 h-8 mx-auto mb-2" />
                🚨 EMERGENCY SOS
              </motion.button>
              <div className="text-[10px] text-center text-muted-foreground">Tap to alert emergency contacts with your live location</div>

              {/* Live Tracking Toggle */}
              <div className="panel p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground">📍 Live Location Sharing</div>
                    <div className="text-[10px] text-muted-foreground">Share your location with trusted contacts</div>
                  </div>
                  <button
                    onClick={() => setLiveTracking(!liveTracking)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${
                      liveTracking ? 'bg-success/20 congestion-low' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {liveTracking ? '● SHARING' : 'OFF'}
                  </button>
                </div>
                {liveTracking && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 p-2 bg-success/5 rounded-lg">
                    <div className="text-[10px] text-success font-bold">Your location is being shared in real-time</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Trusted contacts can see your position on the map</div>
                  </motion.div>
                )}
              </div>

              {/* Emergency Contacts */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">📞 Emergency Contacts</div>
                {emergencyContacts.map((c, i) => {
                  const icons: Record<string, string> = { police: '👮', women_helpline: '🙋‍♀️', ambulance: '🚑', custom: '📱' };
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                      <span className="text-lg">{icons[c.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-foreground">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">{c.type.replace('_', ' ')}</div>
                      </div>
                      <a href={`tel:${c.number}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary rounded-full text-[10px] font-bold hover:bg-primary/25 transition-colors">
                        <Phone className="w-3 h-3" />
                        {c.number}
                      </a>
                    </div>
                  );
                })}
              </div>

              {/* Safety Tips */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">💡 Safety Tips</div>
                {[
                  'Share your live location with a trusted contact before traveling',
                  'Prefer well-lit, busy roads over shortcuts through isolated areas',
                  'Use Namma Metro with women-only coach when available',
                  'Keep emergency numbers on speed dial',
                  'Trust your instincts — if something feels wrong, move to a crowded area',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                    <span className="text-[10px] text-primary font-bold shrink-0">{i + 1}.</span>
                    <span className="text-[10px] text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
