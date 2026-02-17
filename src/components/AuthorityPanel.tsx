import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';
import { generateAlerts, generateRegulations } from '@/lib/traffic-alerts';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { AlertTriangle, Shield, Radio, Users, TrendingUp, ArrowRightLeft, MapPin } from 'lucide-react';

export default function AuthorityPanel() {
  const { states, predictCongestion, zoneStats } = useTraffic();
  const [tab, setTab] = useState<'overview' | 'alerts' | 'regulate' | 'strategic'>('overview');

  const alerts = useMemo(() => generateAlerts(states), [states]);
  const regulations = useMemo(() => generateRegulations(states), [states]);

  const segmentsWithData = useMemo(() =>
    segments.map(seg => ({
      seg,
      state: states.get(seg.id)!,
      prediction: predictCongestion(seg.id),
    })).filter(s => s.state).sort((a, b) => b.state.congestionLevel - a.state.congestionLevel),
    [states, predictCongestion]
  );

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const riskColor = zoneStats.gridlockRisk > 0.6 ? 'congestion-high' : zoneStats.gridlockRisk > 0.3 ? 'congestion-medium' : 'congestion-low';

  const tabs = [
    { id: 'overview' as const, label: 'Zone', icon: MapPin },
    { id: 'alerts' as const, label: 'Alerts', icon: AlertTriangle, count: criticalAlerts.length },
    { id: 'regulate' as const, label: 'Regulate', icon: Shield },
    { id: 'strategic' as const, label: 'Strategic', icon: Radio },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header">
        <div className="status-dot-live" />
        <span>Command Center</span>
        {criticalAlerts.length > 0 && (
          <span className="ml-auto px-1.5 py-0.5 text-[9px] font-mono font-bold bg-destructive/20 text-destructive rounded animate-pulse">
            {criticalAlerts.length} CRITICAL
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border shrink-0">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors relative ${
                tab === t.id
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
              {t.count ? (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 flex items-center justify-center text-[7px] bg-destructive text-destructive-foreground rounded-full">
                  {t.count}
                </span>
              ) : null}
              {tab === t.id && <motion.div layoutId="authority-tab" className="absolute bottom-0 left-0 right-0 h-px bg-primary" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {/* Zone stats */}
              <div className="panel p-3">
                <div className="metric-label mb-3">Bengaluru Zone Overview</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="metric-value text-lg">{zoneStats.totalVehicles.toLocaleString()}</div>
                    <div className="metric-label">Total Vehicles</div>
                  </div>
                  <div>
                    <div className="metric-value text-lg">{Math.round(zoneStats.avgCongestion * 100)}%</div>
                    <div className="metric-label">Avg Congestion</div>
                  </div>
                  <div>
                    <div className={`metric-value text-lg ${riskColor}`}>{Math.round(zoneStats.gridlockRisk * 100)}%</div>
                    <div className="metric-label">Gridlock Risk</div>
                  </div>
                  <div>
                    <div className="metric-value text-lg">{zoneStats.hotspots.length}</div>
                    <div className="metric-label">Active Hotspots</div>
                  </div>
                </div>
              </div>

              {/* Per-segment detail */}
              <div className="panel p-3">
                <div className="metric-label mb-2">Segment Detail</div>
                {segmentsWithData.slice(0, 8).map(({ seg, state }) => (
                  <div key={seg.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-[10px] font-mono">
                    <div className="flex-1 min-w-0 truncate text-foreground">{seg.name}</div>
                    <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                      <span>{state.vehicleCount}<span className="text-[8px] ml-0.5">veh</span></span>
                      <span>{state.queueLength}<span className="text-[8px] ml-0.5">q</span></span>
                      <span>{state.avgSpacing.toFixed(0)}<span className="text-[8px] ml-0.5">m</span></span>
                      <span className={state.congestionLevel > 0.7 ? 'congestion-high' : state.congestionLevel > 0.4 ? 'congestion-medium' : 'congestion-low'}>
                        {Math.round(state.congestionLevel * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Density propagation */}
              <div className="panel p-3">
                <div className="metric-label mb-2">Density Propagation</div>
                {segmentsWithData
                  .filter(s => s.state.trend === 'rising' && s.state.congestionLevel > 0.5)
                  .slice(0, 4)
                  .map(({ seg, state }) => (
                    <div key={seg.id} className="text-[10px] font-mono text-accent py-1 border-b border-border last:border-0">
                      ⚠ {seg.name}: density surge {state.trend} ({Math.round(state.congestionLevel * 100)}%)
                      <br />
                      <span className="text-muted-foreground">
                        In: {state.inflowRate}/min · Out: {state.outflowRate}/min · Spillover propagating
                      </span>
                    </div>
                  ))}
                {segmentsWithData.filter(s => s.state.trend === 'rising' && s.state.congestionLevel > 0.5).length === 0 && (
                  <div className="text-[10px] font-mono text-muted-foreground">No active density surges</div>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'alerts' && (
            <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              {alerts.length === 0 && (
                <div className="panel p-4 text-center text-muted-foreground text-xs font-mono">No active alerts</div>
              )}
              {alerts.slice(0, 12).map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`panel p-2.5 border-l-2 ${
                    alert.severity === 'critical'
                      ? 'border-l-destructive bg-destructive/5'
                      : 'border-l-accent bg-accent/5'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      alert.severity === 'critical' ? 'text-destructive' : 'text-accent'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono font-bold text-foreground">{alert.title}</div>
                      <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{alert.description}</div>
                      <div className="text-[8px] font-mono text-muted-foreground/60 mt-1 uppercase">
                        {alert.type.replace(/_/g, ' ')} · {alert.severity}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === 'regulate' && (
            <motion.div key="regulate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <div className="panel p-2.5 bg-primary/5 border-primary/20">
                <div className="text-[10px] font-mono text-primary font-bold mb-1">🧭 Recommended Regulation Sequence</div>
                <div className="text-[9px] font-mono text-muted-foreground">
                  AI-generated actions to prevent gridlock. Execute in order of priority.
                </div>
              </div>
              {regulations.map((reg, i) => {
                const typeIcon = reg.type === 'stop_inflow' ? '🛑' :
                  reg.type === 'clear_alternate' ? '🔄' :
                  reg.type === 'coordinate_zone' ? '📡' : '👮';
                const typeColor = reg.type === 'stop_inflow' ? 'text-destructive' :
                  reg.type === 'clear_alternate' ? 'text-success' :
                  reg.type === 'coordinate_zone' ? 'text-accent' : 'text-primary';
                return (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="panel p-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-primary shrink-0">
                        {reg.priority}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[10px] font-mono font-bold ${typeColor}`}>
                          {typeIcon} {reg.action}
                        </div>
                        <div className="text-[9px] font-mono text-foreground mt-0.5">{reg.target}</div>
                        <div className="text-[8px] font-mono text-muted-foreground mt-0.5">{reg.reason}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {regulations.length === 0 && (
                <div className="panel p-4 text-center text-muted-foreground text-xs font-mono">All corridors within limits</div>
              )}
            </motion.div>
          )}

          {tab === 'strategic' && (
            <motion.div key="strategic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {/* City-wide summary */}
              <div className="panel p-3 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-3.5 h-3.5 text-primary" />
                  <div className="metric-label">Strategic Control Room</div>
                </div>
                <div className="text-[9px] font-mono text-muted-foreground">
                  City-wide congestion monitoring · Zone officer deployment · Choke point prediction
                </div>
              </div>

              {/* City metrics */}
              <div className="panel p-3">
                <div className="metric-label mb-3">City-Wide Traffic Ratios</div>
                <div className="grid grid-cols-3 gap-3">
                  {(() => {
                    const free = segmentsWithData.filter(s => s.state.congestionLevel < 0.3).length;
                    const moderate = segmentsWithData.filter(s => s.state.congestionLevel >= 0.3 && s.state.congestionLevel < 0.7).length;
                    const heavy = segmentsWithData.filter(s => s.state.congestionLevel >= 0.7).length;
                    const total = segmentsWithData.length;
                    return (
                      <>
                        <div className="text-center">
                          <div className="text-sm font-mono font-bold congestion-low">{Math.round(free / total * 100)}%</div>
                          <div className="text-[8px] font-mono text-muted-foreground">FREE FLOW</div>
                          <div className="text-[9px] font-mono text-foreground">{free} roads</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-mono font-bold congestion-medium">{Math.round(moderate / total * 100)}%</div>
                          <div className="text-[8px] font-mono text-muted-foreground">MODERATE</div>
                          <div className="text-[9px] font-mono text-foreground">{moderate} roads</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-mono font-bold congestion-high">{Math.round(heavy / total * 100)}%</div>
                          <div className="text-[8px] font-mono text-muted-foreground">HEAVY</div>
                          <div className="text-[9px] font-mono text-foreground">{heavy} roads</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Predicted choke points */}
              <div className="panel p-3">
                <div className="metric-label mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-accent" />
                  Predicted Choke Points
                </div>
                {segmentsWithData
                  .filter(s => s.prediction.risk === 'high' || (s.prediction.risk === 'medium' && s.state.trend === 'rising'))
                  .slice(0, 5)
                  .map(({ seg, state, prediction }) => (
                    <div key={seg.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono text-foreground truncate">{seg.name}</div>
                        <div className="text-[8px] font-mono text-muted-foreground">
                          Now {Math.round(state.congestionLevel * 100)}% → Pred {Math.round(prediction.prediction * 100)}%
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        prediction.risk === 'high' ? 'bg-destructive/20 congestion-high' : 'bg-accent/20 congestion-medium'
                      }`}>
                        {prediction.risk === 'high' ? '🔴' : '🟡'} JAM LIKELY
                      </span>
                    </div>
                  ))}
                {segmentsWithData.filter(s => s.prediction.risk === 'high' || (s.prediction.risk === 'medium' && s.state.trend === 'rising')).length === 0 && (
                  <div className="text-[10px] font-mono text-muted-foreground">No imminent choke points predicted</div>
                )}
              </div>

              {/* Officer deployment suggestion */}
              <div className="panel p-3">
                <div className="metric-label mb-2 flex items-center gap-2">
                  <Users className="w-3 h-3 text-primary" />
                  Officer Deployment Priority
                </div>
                {segmentsWithData.slice(0, 4).map(({ seg, state }, i) => (
                  <div key={seg.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-mono font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 text-[10px] font-mono text-foreground truncate">{seg.name}</div>
                    <span className="text-[9px] font-mono text-muted-foreground">{state.vehicleCount} veh</span>
                  </div>
                ))}
              </div>

              {/* Cross-flow lock risk */}
              <div className="panel p-3">
                <div className="metric-label mb-2 flex items-center gap-2">
                  <ArrowRightLeft className="w-3 h-3 text-destructive" />
                  N-S / E-W Lock Risk
                </div>
                {(() => {
                  const nsSegments = segmentsWithData.filter(s =>
                    ['bell-road', 'hosur-silk-ec', 'hebbal-yelahanka', 'majestic-jaya'].includes(s.seg.id)
                  );
                  const ewSegments = segmentsWithData.filter(s =>
                    ['orr-silk-mara', 'orr-mara-krp', 'mg-majestic-ind', 'ind-mara', 'mara-whitefield'].includes(s.seg.id)
                  );
                  const nsAvg = nsSegments.length ? nsSegments.reduce((a, s) => a + s.state.congestionLevel, 0) / nsSegments.length : 0;
                  const ewAvg = ewSegments.length ? ewSegments.reduce((a, s) => a + s.state.congestionLevel, 0) / ewSegments.length : 0;
                  const lockRisk = nsAvg > 0.6 && ewAvg > 0.6;
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className={`text-sm font-mono font-bold ${nsAvg > 0.6 ? 'congestion-high' : nsAvg > 0.3 ? 'congestion-medium' : 'congestion-low'}`}>
                          {Math.round(nsAvg * 100)}%
                        </div>
                        <div className="text-[8px] font-mono text-muted-foreground">N↔S CORRIDORS</div>
                      </div>
                      <div>
                        <div className={`text-sm font-mono font-bold ${ewAvg > 0.6 ? 'congestion-high' : ewAvg > 0.3 ? 'congestion-medium' : 'congestion-low'}`}>
                          {Math.round(ewAvg * 100)}%
                        </div>
                        <div className="text-[8px] font-mono text-muted-foreground">E↔W CORRIDORS</div>
                      </div>
                      {lockRisk && (
                        <div className="col-span-2 text-[9px] font-mono text-destructive animate-pulse">
                          ⚠ Cross-flow lock risk detected — coordinate all zone officers
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
