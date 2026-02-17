import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';
import { generateAlerts, generateRegulations } from '@/lib/traffic-alerts';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { AlertTriangle, Shield, Radio, Users, MapPin } from 'lucide-react';

/** Progress bar for congestion */
function CongestionBar({ level }: { level: number }) {
  const color = level > 0.7 ? 'bg-destructive' : level > 0.4 ? 'bg-accent' : 'bg-success';
  return (
    <div className="w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden">
      <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${Math.round(level * 100)}%` }} transition={{ duration: 0.5 }} />
    </div>
  );
}

export default function AuthorityPanel() {
  const { states, predictCongestion, zoneStats } = useTraffic();
  const [tab, setTab] = useState<'zone' | 'alerts' | 'actions' | 'control'>('zone');

  const alerts = useMemo(() => generateAlerts(states), [states]);
  const regulations = useMemo(() => generateRegulations(states), [states]);
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  const segmentsData = useMemo(() =>
    segments.map(seg => ({ seg, state: states.get(seg.id)!, prediction: predictCongestion(seg.id) }))
      .filter(s => s.state)
      .sort((a, b) => b.state.congestionLevel - a.state.congestionLevel),
    [states, predictCongestion]
  );

  const riskEmoji = zoneStats.gridlockRisk > 0.6 ? '🔴' : zoneStats.gridlockRisk > 0.3 ? '🟡' : '🟢';
  const riskColor = zoneStats.gridlockRisk > 0.6 ? 'congestion-high' : zoneStats.gridlockRisk > 0.3 ? 'congestion-medium' : 'congestion-low';

  const tabs = [
    { id: 'zone' as const, label: '📍 Zone', icon: MapPin },
    { id: 'alerts' as const, label: `⚠️ Alerts`, icon: AlertTriangle, badge: criticalCount },
    { id: 'actions' as const, label: '🛡️ Actions', icon: Shield },
    { id: 'control' as const, label: '📡 Control', icon: Radio },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Command Center</span>
          <div className="status-dot-live ml-auto" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-2 text-[10px] rounded-lg transition-colors text-center relative ${
                tab === t.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
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
          {/* ===== ZONE TAB ===== */}
          {tab === 'zone' && (
            <motion.div key="zone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {/* Big stats */}
              <div className="panel p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-primary">{zoneStats.totalVehicles.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">🚗 Total Vehicles</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold font-mono ${riskColor}`}>{riskEmoji} {Math.round(zoneStats.gridlockRisk * 100)}%</div>
                    <div className="text-xs text-muted-foreground">Gridlock Risk</div>
                  </div>
                </div>
              </div>

              {/* Hotspots */}
              {zoneStats.hotspots.length > 0 && (
                <div className="panel p-3">
                  <div className="text-xs font-bold text-foreground mb-2">🔥 Problem Areas ({zoneStats.hotspots.length})</div>
                  {zoneStats.hotspots.map(name => (
                    <div key={name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                      <span className="text-sm">🔴</span>
                      <span className="text-xs text-foreground">{name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* All roads at a glance */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">🛣️ All Roads</div>
                {segmentsData.slice(0, 10).map(({ seg, state }) => (
                  <div key={seg.id} className="py-2 border-b border-border last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-foreground truncate flex-1">{seg.name}</span>
                      <span className={`text-[11px] font-bold font-mono ${
                        state.congestionLevel > 0.7 ? 'congestion-high' : state.congestionLevel > 0.4 ? 'congestion-medium' : 'congestion-low'
                      }`}>
                        {Math.round(state.congestionLevel * 100)}%
                      </span>
                    </div>
                    <CongestionBar level={state.congestionLevel} />
                    <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                      <span>{state.vehicleCount} vehicles</span>
                      <span>Queue: {state.queueLength}</span>
                      <span>{state.avgSpacing.toFixed(0)}m apart</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== ALERTS TAB ===== */}
          {tab === 'alerts' && (
            <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              {alerts.length === 0 ? (
                <div className="panel p-6 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-sm font-bold text-foreground">All Clear</div>
                  <div className="text-xs text-muted-foreground">No traffic alerts right now</div>
                </div>
              ) : (
                alerts.slice(0, 10).map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`panel p-3 border-l-4 ${
                      alert.severity === 'critical' ? 'border-l-destructive' : 'border-l-accent'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{
                        alert.type === 'density_rising' ? '📈' :
                        alert.type === 'queue_saturation' ? '🚧' :
                        alert.type === 'gridlock_risk' ? '⛔' :
                        alert.type === 'spillover' ? '🌊' : '⚠️'
                      }</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground">{alert.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{alert.description}</div>
                        <div className={`text-[9px] font-bold mt-1 ${
                          alert.severity === 'critical' ? 'congestion-high' : 'congestion-medium'
                        }`}>
                          {alert.severity === 'critical' ? '🔴 CRITICAL' : '🟡 WARNING'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ===== ACTIONS TAB ===== */}
          {tab === 'actions' && (
            <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <div className="panel p-3 bg-primary/5 border-primary/20">
                <div className="text-xs font-bold text-primary">🧭 What To Do Now</div>
                <div className="text-[10px] text-muted-foreground mt-1">Follow these steps in order to prevent gridlock.</div>
              </div>

              {regulations.length === 0 ? (
                <div className="panel p-6 text-center">
                  <div className="text-3xl mb-2">👍</div>
                  <div className="text-sm font-bold text-foreground">No Action Needed</div>
                  <div className="text-xs text-muted-foreground">All roads are within safe limits</div>
                </div>
              ) : (
                regulations.map((reg, i) => {
                  const emoji = reg.type === 'stop_inflow' ? '🛑' :
                    reg.type === 'clear_alternate' ? '✅' :
                    reg.type === 'coordinate_zone' ? '📡' : '👮';
                  const actionColor = reg.type === 'stop_inflow' ? 'congestion-high' :
                    reg.type === 'clear_alternate' ? 'congestion-low' :
                    reg.type === 'coordinate_zone' ? 'congestion-medium' : 'text-primary';
                  return (
                    <motion.div
                      key={reg.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="panel p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {reg.priority}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold ${actionColor}`}>{emoji} {reg.action}</div>
                          <div className="text-[11px] text-foreground mt-0.5">{reg.target}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{reg.reason}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ===== CONTROL ROOM TAB ===== */}
          {tab === 'control' && (
            <motion.div key="control" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {/* City traffic breakdown */}
              <div className="panel p-4">
                <div className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-primary" />
                  City Traffic Status
                </div>
                {(() => {
                  const total = segmentsData.length;
                  const free = segmentsData.filter(s => s.state.congestionLevel < 0.3).length;
                  const moderate = segmentsData.filter(s => s.state.congestionLevel >= 0.3 && s.state.congestionLevel < 0.7).length;
                  const heavy = segmentsData.filter(s => s.state.congestionLevel >= 0.7).length;
                  return (
                    <div className="flex gap-2">
                      <div className="flex-1 panel p-3 text-center bg-success/5">
                        <div className="text-xl font-bold font-mono congestion-low">{free}</div>
                        <div className="text-[10px] text-muted-foreground">🟢 Free</div>
                        <div className="text-[9px] text-muted-foreground">{Math.round(free / total * 100)}%</div>
                      </div>
                      <div className="flex-1 panel p-3 text-center bg-accent/5">
                        <div className="text-xl font-bold font-mono congestion-medium">{moderate}</div>
                        <div className="text-[10px] text-muted-foreground">🟡 Slow</div>
                        <div className="text-[9px] text-muted-foreground">{Math.round(moderate / total * 100)}%</div>
                      </div>
                      <div className="flex-1 panel p-3 text-center bg-destructive/5">
                        <div className="text-xl font-bold font-mono congestion-high">{heavy}</div>
                        <div className="text-[10px] text-muted-foreground">🔴 Jammed</div>
                        <div className="text-[9px] text-muted-foreground">{Math.round(heavy / total * 100)}%</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Roads about to jam */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">⏳ About to Jam</div>
                {segmentsData
                  .filter(s => s.prediction.risk === 'high' || (s.prediction.risk === 'medium' && s.state.trend === 'rising'))
                  .slice(0, 5)
                  .map(({ seg, state, prediction }) => (
                    <div key={seg.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-foreground truncate">{seg.name}</div>
                        <div className="text-[9px] text-muted-foreground">
                          Now {Math.round(state.congestionLevel * 100)}% → Soon {Math.round(prediction.prediction * 100)}%
                        </div>
                      </div>
                      <span className="text-sm">{prediction.risk === 'high' ? '🔴' : '🟡'}</span>
                    </div>
                  ))}
                {segmentsData.filter(s => s.prediction.risk === 'high' || (s.prediction.risk === 'medium' && s.state.trend === 'rising')).length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-2">✅ No jams predicted soon</div>
                )}
              </div>

              {/* Deploy officers */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Send Officers Here
                </div>
                {segmentsData.slice(0, 4).map(({ seg, state }, i) => (
                  <div key={seg.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-foreground truncate">{seg.name}</div>
                      <div className="text-[9px] text-muted-foreground">{state.vehicleCount} vehicles · {state.queueLength} queued</div>
                    </div>
                    <span className="text-sm">{state.congestionLevel > 0.7 ? '🔴' : '🟡'}</span>
                  </div>
                ))}
              </div>

              {/* N-S vs E-W */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">↕️ North-South vs ↔️ East-West</div>
                {(() => {
                  const ns = segmentsData.filter(s => ['bell-road', 'hosur-silk-ec', 'hebbal-yelahanka', 'majestic-jaya'].includes(s.seg.id));
                  const ew = segmentsData.filter(s => ['orr-silk-mara', 'orr-mara-krp', 'mg-majestic-ind', 'ind-mara', 'mara-whitefield'].includes(s.seg.id));
                  const nsAvg = ns.length ? ns.reduce((a, s) => a + s.state.congestionLevel, 0) / ns.length : 0;
                  const ewAvg = ew.length ? ew.reduce((a, s) => a + s.state.congestionLevel, 0) / ew.length : 0;
                  const lockRisk = nsAvg > 0.6 && ewAvg > 0.6;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="text-center">
                          <div className={`text-lg font-bold font-mono ${nsAvg > 0.6 ? 'congestion-high' : nsAvg > 0.3 ? 'congestion-medium' : 'congestion-low'}`}>
                            {Math.round(nsAvg * 100)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">↕️ N-S Roads</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold font-mono ${ewAvg > 0.6 ? 'congestion-high' : ewAvg > 0.3 ? 'congestion-medium' : 'congestion-low'}`}>
                            {Math.round(ewAvg * 100)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">↔️ E-W Roads</div>
                        </div>
                      </div>
                      {lockRisk && (
                        <div className="text-center text-xs font-bold congestion-high animate-pulse">
                          ⚠️ Both directions jammed — full city lock possible!
                        </div>
                      )}
                    </>
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
