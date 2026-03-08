import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, MapPin, Phone, Star, Navigation, Eye, Siren, ChevronDown, ChevronUp, Send, Users, Lightbulb, Camera, Clock, Search, Loader2, LocateFixed } from 'lucide-react';
import { allSegments, allNodes } from '@/lib/tamilnadu-roads';
import { useTraffic } from '@/hooks/useTraffic';
import {
  getSegmentSafetyScore, getAllSafetyScores, getRecentIncidents, getMockRatings,
  getTransportModes, emergencyContacts, safetyColor,
  type SafetyScore, type SafetyIncident, type CrowdRating, type TransportMode,
} from '@/lib/safety-engine';
import { geocodeLocation, getRouteAlternatives, generateRouteSafetyScore, type GeoLocation, type RouteResult } from '@/lib/route-service';
import type { ActiveRoute } from '@/components/TrafficMap';

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

/* ─── Location search input with geocoding ─── */
function LocationSearchInput({ 
  value, 
  onChange, 
  onSelect, 
  placeholder, 
  label 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  onSelect: (loc: GeoLocation) => void; 
  placeholder: string;
  label: string;
}) {
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = (text: string) => {
    onChange(text);
    setShowSuggestions(true);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeLocation(text);
      setSuggestions(results);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="relative">
      <label className="text-[9px] text-muted-foreground uppercase">{label}</label>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full text-xs bg-secondary/50 text-foreground border border-border rounded pl-7 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary animate-spin" />}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg max-h-40 overflow-y-auto shadow-lg">
          {suggestions.map((loc, idx) => (
            <button 
              key={idx} 
              onClick={() => { onSelect(loc); onChange(loc.name); setShowSuggestions(false); }}
              className="w-full text-left px-2 py-2 text-[11px] text-foreground hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
            >
              <div className="font-medium">📍 {loc.name}</div>
              <div className="text-[9px] text-muted-foreground truncate">{loc.displayName}</div>
            </button>
          ))}
        </div>
      )}
      {showSuggestions && !loading && value.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-[10px] text-muted-foreground">No locations found. Try a different search.</div>
        </div>
      )}
    </div>
  );
}

/* ─── Route risk category ─── */
function getRouteCategory(score: number): { label: string; emoji: string; color: string; bgColor: string } {
  if (score >= 70) return { label: 'SAFEST', emoji: '🟢', color: 'congestion-low', bgColor: 'bg-success/15 border-success/40' };
  if (score >= 50) return { label: 'MODERATE', emoji: '🟡', color: 'congestion-medium', bgColor: 'bg-accent/10 border-accent/40' };
  return { label: 'RISKY', emoji: '🔴', color: 'congestion-high', bgColor: 'bg-destructive/10 border-destructive/40' };
}

/* ─── Real route result card ─── */
interface RealRouteResult {
  route: RouteResult;
  safetyScore: number;
  isSafest: boolean;
}

/* ─── Main Panel ─── */

type SafetyTab = 'overview' | 'route' | 'incidents' | 'emergency';

interface SafetyPanelProps {
  onRoutesFound?: (routes: ActiveRoute[], markers: { from?: { lat: number; lng: number; name: string }; to?: { lat: number; lng: number; name: string } }) => void;
}

export default function SafetyPanel({ onRoutesFound }: SafetyPanelProps) {
  const [tab, setTab] = useState<SafetyTab>('overview');
  const [selectedSeg, setSelectedSeg] = useState<string>('che-egmore-tnagar');
  
  // Real route search state
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [fromLocation, setFromLocation] = useState<GeoLocation | null>(null);
  const [toLocation, setToLocation] = useState<GeoLocation | null>(null);
  const [routeResults, setRouteResults] = useState<RealRouteResult[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const [liveTracking, setLiveTracking] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [userRatings, setUserRatings] = useState<CrowdRating[]>([]);
  const { states } = useTraffic();

  const allScores = useMemo(() => getAllSafetyScores(), []);
  const currentScore = useMemo(() => getSegmentSafetyScore(selectedSeg), [selectedSeg]);
  const incidents = useMemo(() => getRecentIncidents(), []);
  const ratings = useMemo(() => [...userRatings, ...getMockRatings()], [userRatings]);
  const transportModes = useMemo(() => getTransportModes(selectedSeg), [selectedSeg]);

  const sortedSegments = useMemo(() =>
    allSegments.map(s => ({ seg: s, score: allScores.get(s.id)! }))
      .filter(s => s.score)
      .sort((a, b) => a.score.overall - b.score.overall),
    [allScores]
  );

  // Detect live location
  const detectLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setRouteError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode to get place name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'TNTrafficIntel/1.0' } }
          );
          const data = await res.json();
          const name = data.display_name?.split(',')[0] || 'My Location';
          const loc: GeoLocation = { lat: latitude, lng: longitude, name, displayName: data.display_name?.split(',').slice(0, 3).join(', ') || 'Current Location' };
          setFromLocation(loc);
          setFromSearch(name);
        } catch {
          const loc: GeoLocation = { lat: latitude, lng: longitude, name: 'My Location', displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
          setFromLocation(loc);
          setFromSearch('My Location');
        }
        setGeoLoading(false);
      },
      (err) => {
        setRouteError('Could not detect location. Please allow location access.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Search for real routes
  const searchRoutes = useCallback(async () => {
    if (!fromLocation || !toLocation) {
      setRouteError('Please select both From and To locations.');
      return;
    }
    
    setRouteLoading(true);
    setRouteError('');
    setRouteResults([]);

    try {
      const routes = await getRouteAlternatives(
        { lat: fromLocation.lat, lng: fromLocation.lng },
        { lat: toLocation.lat, lng: toLocation.lng }
      );

      if (routes.length === 0) {
        setRouteError('No routes found. Try different locations.');
        onRoutesFound?.([], {});
        return;
      }

      const results: RealRouteResult[] = routes.map((route) => ({
        route,
        safetyScore: generateRouteSafetyScore(route),
        isSafest: false,
      }));

      // Sort by safety and mark safest
      results.sort((a, b) => b.safetyScore - a.safetyScore);
      if (results.length > 0) results[0].isSafest = true;

      setRouteResults(results);

      // Send routes to map with risk-based colors
      const activeRoutes: ActiveRoute[] = results.map((r) => {
        const cat = getRouteCategory(r.safetyScore);
        return {
          path: r.route.path,
          color: r.safetyScore >= 70 ? '#22c55e' : r.safetyScore >= 50 ? '#eab308' : '#ef4444',
          label: `${r.route.distance} km · ${r.route.duration} min · Safety: ${r.safetyScore} (${cat.label})`,
          isSafest: r.isSafest,
        };
      });

      onRoutesFound?.(activeRoutes, {
        from: { lat: fromLocation.lat, lng: fromLocation.lng, name: fromLocation.name },
        to: { lat: toLocation.lat, lng: toLocation.lng, name: toLocation.name },
      });
    } catch {
      setRouteError('Failed to fetch routes. Please try again.');
    } finally {
      setRouteLoading(false);
    }
  }, [fromLocation, toLocation, onRoutesFound]);

  // Clear routes when leaving route tab
  useEffect(() => {
    if (tab !== 'route') {
      onRoutesFound?.([], {});
    }
  }, [tab, onRoutesFound]);

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
                  {sortedSegments.slice(0, 15).map(({ seg, score }) => (
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

          {/* ─── ROUTE TAB — REAL ROUTING ─── */}
          {tab === 'route' && (
            <motion.div key="route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-1">🧭 Find Safest Route</div>
                <div className="text-[10px] text-muted-foreground mb-3">Search any place in Tamil Nadu — real routes with safety scores.</div>
                
                <div className="flex flex-col gap-2">
                  {/* From input with GPS button */}
                  <div className="flex gap-1.5 items-end">
                    <div className="flex-1">
                      <LocationSearchInput
                        value={fromSearch}
                        onChange={(v) => { setFromSearch(v); setFromLocation(null); }}
                        onSelect={setFromLocation}
                        placeholder="e.g. Paavai College, T.Nagar..."
                        label="From"
                      />
                    </div>
                    <button
                      onClick={detectLiveLocation}
                      disabled={geoLoading}
                      className="p-2 bg-primary/15 text-primary rounded-lg hover:bg-primary/25 transition-colors shrink-0 mb-[1px]"
                      title="Use my current location"
                    >
                      {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                    </button>
                  </div>

                  <LocationSearchInput
                    value={toSearch}
                    onChange={(v) => { setToSearch(v); setToLocation(null); }}
                    onSelect={setToLocation}
                    placeholder="e.g. Pachal, Coimbatore, Salem..."
                    label="To"
                  />
                </div>

                {/* Always visible search button */}
                <button
                  onClick={searchRoutes}
                  disabled={routeLoading || !fromLocation || !toLocation}
                  className="w-full mt-3 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {routeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  {routeLoading ? 'Finding Routes...' : '🔍 Search Routes'}
                </button>

                {!fromLocation && fromSearch.length > 0 && (
                  <div className="text-[9px] text-accent mt-1">↑ Select a location from the dropdown suggestions</div>
                )}
                {!toLocation && toSearch.length > 0 && (
                  <div className="text-[9px] text-accent mt-1">↑ Select a destination from the dropdown suggestions</div>
                )}
              </div>

              {/* Quick place suggestions */}
              {!routeResults.length && !routeLoading && (
                <div className="panel p-3">
                  <div className="text-[10px] text-muted-foreground mb-2">Quick picks — tap to fill:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { from: 'Chennai Central', to: 'Coimbatore' },
                      { from: 'Madurai', to: 'Trichy' },
                      { from: 'Salem', to: 'Namakkal' },
                      { from: 'Ooty', to: 'Mysore' },
                    ].map((pair, idx) => (
                      <button
                        key={idx}
                        onClick={async () => {
                          setFromSearch(pair.from);
                          setToSearch(pair.to);
                          // Auto-geocode both
                          const [fromResults, toResults] = await Promise.all([
                            geocodeLocation(pair.from),
                            geocodeLocation(pair.to),
                          ]);
                          if (fromResults[0]) { setFromLocation(fromResults[0]); setFromSearch(fromResults[0].name); }
                          if (toResults[0]) { setToLocation(toResults[0]); setToSearch(toResults[0].name); }
                        }}
                        className="text-[9px] bg-secondary/60 text-foreground px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                      >
                        {pair.from} → {pair.to}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Route loading */}
              {routeLoading && (
                <div className="panel p-6 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                  <div className="text-xs text-muted-foreground">Finding real routes on Tamil Nadu roads...</div>
                </div>
              )}

              {/* Route error */}
              {routeError && (
                <div className="panel p-4 text-center border-destructive/30">
                  <div className="text-2xl mb-1">⚠️</div>
                  <div className="text-xs text-destructive">{routeError}</div>
                </div>
              )}

              {/* Route results with categories */}
              {routeResults.map((result, i) => {
                const category = getRouteCategory(result.safetyScore);
                return (
                  <div key={i} className={`panel p-3 border ${category.bgColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${category.color}`}>
                        {category.emoji} {category.label} ROUTE
                      </span>
                      <span className="text-[9px] text-muted-foreground">Route {i + 1}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <SafetyGauge score={result.safetyScore} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-foreground">
                          {fromLocation?.name} → {toLocation?.name}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          📏 {result.route.distance} km · ⏱ ~{result.route.duration} min
                          {result.route.summary && ` · via ${result.route.summary}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 text-[9px] flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded-full ${result.safetyScore >= 70 ? 'bg-success/20 congestion-low' : result.safetyScore >= 50 ? 'bg-accent/20 congestion-medium' : 'bg-destructive/20 congestion-high'}`}>
                        Safety: {result.safetyScore}/100
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {result.route.distance < 10 ? '🏘️ Short' : result.route.distance < 50 ? '🛣️ Medium' : '🏔️ Long'} distance
                      </span>
                      {result.isSafest && (
                        <span className="px-1.5 py-0.5 rounded-full bg-success/20 congestion-low">
                          🛡️ Recommended
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              {routeResults.length > 0 && (
                <div className="panel p-2.5">
                  <div className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wider">Route Categories</div>
                  <div className="flex gap-3 text-[9px]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Safest (70+)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> Moderate (50-69)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Risky (&lt;50)</span>
                  </div>
                </div>
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

              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">💡 Safety Tips</div>
                {[
                  'Share your live location with a trusted contact before traveling',
                  'Prefer well-lit, busy roads over shortcuts through isolated areas',
                  'Use Chennai Metro with women-only coach when available',
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
