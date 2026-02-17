import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';
import { generateAlerts, generateRegulations } from '@/lib/traffic-alerts';
import { getOfficersForSegment, getPreventiveActions } from '@/lib/traffic-officers';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { AlertTriangle, Shield, Radio, Users, MapPin, X, Phone } from 'lucide-react';

/** Progress bar */
function CongestionBar({ level }: { level: number }) {
  const color = level > 0.7 ? 'bg-destructive' : level > 0.4 ? 'bg-accent' : 'bg-success';
  return (
    <div className="w-full h-1.5 rounded-full bg-secondary/60 overflow-hidden">
      <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${Math.round(level * 100)}%` }} transition={{ duration: 0.5 }} />
    </div>
  );
}

/** Road detail modal */
function RoadDetailModal({ segmentId, onClose }: { segmentId: string; onClose: () => void }) {
  const { states, predictCongestion } = useTraffic();
  const seg = segments.find(s => s.id === segmentId);
  const state = states.get(segmentId);
  const prediction = predictCongestion(segmentId);
  const officers = getOfficersForSegment(segmentId);
  const preventive = state ? getPreventiveActions(state.congestionLevel, state.trend) : [];

  if (!seg || !state) return null;

  const statusEmoji = state.congestionLevel > 0.7 ? '🔴' : state.congestionLevel > 0.4 ? '🟡' : '🟢';
  const statusText = state.congestionLevel > 0.7 ? 'Heavy' : state.congestionLevel > 0.4 ? 'Moderate' : 'Light';
  const statusColor = state.congestionLevel > 0.7 ? 'congestion-high' : state.congestionLevel > 0.4 ? 'congestion-medium' : 'congestion-low';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <div>
          <div className="text-sm font-bold text-foreground">{seg.name}</div>
          <div className={`text-xs font-bold ${statusColor}`}>{statusEmoji} {statusText} Traffic</div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Traffic stats */}
        <div className="panel p-3">
          <div className="text-xs font-bold text-foreground mb-2">📊 Current Status</div>
          <CongestionBar level={state.congestionLevel} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-foreground">{state.vehicleCount}</div>
              <div className="text-[10px] text-muted-foreground">🚗 Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-foreground">{state.queueLength}</div>
              <div className="text-[10px] text-muted-foreground">🚧 In Queue</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-foreground">{state.avgSpacing.toFixed(0)}m</div>
              <div className="text-[10px] text-muted-foreground">↔️ Spacing</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-foreground">{Math.round(state.speedFactor * 65)}</div>
              <div className="text-[10px] text-muted-foreground">⚡ km/h</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-foreground">{state.inflowRate}/min</div>
              <div className="text-[10px] text-muted-foreground">📥 Coming In</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-foreground">{state.outflowRate}/min</div>
              <div className="text-[10px] text-muted-foreground">📤 Going Out</div>
            </div>
          </div>
          <div className="text-center mt-3 text-xs">
            <span className="text-muted-foreground">Trend: </span>
            <span className={`font-bold ${state.trend === 'rising' ? 'congestion-high' : state.trend === 'falling' ? 'congestion-low' : 'text-foreground'}`}>
              {state.trend === 'rising' ? '↑ Getting Worse' : state.trend === 'falling' ? '↓ Improving' : '→ Steady'}
            </span>
          </div>
          <div className="text-center mt-1 text-[10px] text-muted-foreground">
            Predicted: {Math.round(prediction.prediction * 100)}% ({prediction.risk === 'high' ? '🔴' : prediction.risk === 'medium' ? '🟡' : '🟢'} {prediction.risk} risk)
          </div>
        </div>

        {/* Assigned Officers */}
        <div className="panel p-3">
          <div className="text-xs font-bold text-foreground mb-2">👮 Assigned Officers</div>
          {officers.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-2">No officer assigned to this road</div>
          ) : (
            officers.map(officer => (
              <div key={officer.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="text-2xl">{officer.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground">{officer.name}</div>
                  <div className="text-[10px] text-muted-foreground">{officer.rank} · {officer.badge}</div>
                  <div className="text-[10px] text-muted-foreground">{officer.zone}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    officer.status === 'on-duty' ? 'bg-success/20 congestion-low' :
                    officer.status === 'responding' ? 'bg-accent/20 congestion-medium' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {officer.status === 'on-duty' ? '✅ On Duty' : officer.status === 'responding' ? '🚨 Responding' : '⏸ Off Duty'}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-primary">
                    <Phone className="w-2.5 h-2.5" />
                    {officer.phone}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preventive Actions (for moderate traffic) */}
        {preventive.length > 0 && (
          <div className="panel p-3">
            <div className="text-xs font-bold text-foreground mb-2">🛡️ Prevent Heavy Traffic</div>
            <div className="text-[10px] text-muted-foreground mb-2">Do these now to stop it from getting worse:</div>
            {preventive.map((action, i) => (
              <div key={i} className={`flex items-start gap-2 py-2 border-b border-border last:border-0`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                  action.urgency === 'high' ? 'bg-destructive/20 congestion-high' :
                  action.urgency === 'medium' ? 'bg-accent/20 congestion-medium' :
                  'bg-success/20 congestion-low'
                }`}>
                  {i + 1}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-foreground">{action.action}</div>
                  <div className="text-[9px] text-muted-foreground">{action.condition}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AuthorityPanel() {
  const { states, predictCongestion, zoneStats } = useTraffic();
  const [tab, setTab] = useState<'zone' | 'alerts' | 'actions' | 'control'>('zone');
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);

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
    { id: 'zone' as const, label: '📍 Zone' },
    { id: 'alerts' as const, label: '⚠️ Alerts', badge: criticalCount },
    { id: 'actions' as const, label: '🛡️ Actions' },
    { id: 'control' as const, label: '📡 Control' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Road Detail Modal */}
      <AnimatePresence>
        {selectedRoad && <RoadDetailModal segmentId={selectedRoad} onClose={() => setSelectedRoad(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Command Center</span>
          <div className="status-dot-live ml-auto" />
        </div>
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
          {/* ZONE TAB */}
          {tab === 'zone' && (
            <motion.div key="zone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
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

              {/* All roads — clickable */}
              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">🛣️ All Roads <span className="text-muted-foreground font-normal">(tap for details)</span></div>
                {segmentsData.slice(0, 12).map(({ seg, state }) => {
                  const officers = getOfficersForSegment(seg.id);
                  return (
                    <motion.button
                      key={seg.id}
                      onClick={() => setSelectedRoad(seg.id)}
                      className="w-full text-left py-2.5 border-b border-border last:border-0 hover:bg-secondary/30 rounded px-1 transition-colors"
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-foreground truncate flex-1">{seg.name}</span>
                        <span className={`text-[11px] font-bold font-mono ${
                          state.congestionLevel > 0.7 ? 'congestion-high' : state.congestionLevel > 0.4 ? 'congestion-medium' : 'congestion-low'
                        }`}>
                          {state.congestionLevel > 0.7 ? '🔴' : state.congestionLevel > 0.4 ? '🟡' : '🟢'} {Math.round(state.congestionLevel * 100)}%
                        </span>
                      </div>
                      <CongestionBar level={state.congestionLevel} />
                      <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                        <span>{state.vehicleCount} veh · Q:{state.queueLength}</span>
                        {officers.length > 0 && (
                          <span>👮 {officers.map(o => o.name.split(' ')[0]).join(', ')}</span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ALERTS TAB */}
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
                    className={`panel p-3 border-l-4 ${alert.severity === 'critical' ? 'border-l-destructive' : 'border-l-accent'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{
                        alert.type === 'density_rising' ? '📈' :
                        alert.type === 'queue_saturation' ? '🚧' :
                        alert.type === 'gridlock_risk' ? '⛔' : '🌊'
                      }</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground">{alert.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{alert.description}</div>
                        <div className={`text-[9px] font-bold mt-1 ${alert.severity === 'critical' ? 'congestion-high' : 'congestion-medium'}`}>
                          {alert.severity === 'critical' ? '🔴 CRITICAL' : '🟡 WARNING'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ACTIONS TAB */}
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
                </div>
              ) : (
                regulations.map((reg, i) => {
                  const emoji = reg.type === 'stop_inflow' ? '🛑' : reg.type === 'clear_alternate' ? '✅' : reg.type === 'coordinate_zone' ? '📡' : '👮';
                  const actionColor = reg.type === 'stop_inflow' ? 'congestion-high' : reg.type === 'clear_alternate' ? 'congestion-low' : reg.type === 'coordinate_zone' ? 'congestion-medium' : 'text-primary';
                  return (
                    <motion.div key={reg.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="panel p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">{reg.priority}</div>
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

          {/* CONTROL TAB */}
          {tab === 'control' && (
            <motion.div key="control" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
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
                      </div>
                      <div className="flex-1 panel p-3 text-center bg-accent/5">
                        <div className="text-xl font-bold font-mono congestion-medium">{moderate}</div>
                        <div className="text-[10px] text-muted-foreground">🟡 Slow</div>
                      </div>
                      <div className="flex-1 panel p-3 text-center bg-destructive/5">
                        <div className="text-xl font-bold font-mono congestion-high">{heavy}</div>
                        <div className="text-[10px] text-muted-foreground">🔴 Jammed</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">⏳ About to Jam</div>
                {segmentsData
                  .filter(s => s.prediction.risk === 'high' || (s.prediction.risk === 'medium' && s.state.trend === 'rising'))
                  .slice(0, 5)
                  .map(({ seg, state, prediction }) => (
                    <div key={seg.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-foreground truncate">{seg.name}</div>
                        <div className="text-[9px] text-muted-foreground">Now {Math.round(state.congestionLevel * 100)}% → Soon {Math.round(prediction.prediction * 100)}%</div>
                      </div>
                      <span className="text-sm">{prediction.risk === 'high' ? '🔴' : '🟡'}</span>
                    </div>
                  ))}
                {segmentsData.filter(s => s.prediction.risk === 'high' || (s.prediction.risk === 'medium' && s.state.trend === 'rising')).length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-2">✅ No jams predicted soon</div>
                )}
              </div>

              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Send Officers Here
                </div>
                {segmentsData.slice(0, 4).map(({ seg, state }, i) => (
                  <div key={seg.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-foreground truncate">{seg.name}</div>
                      <div className="text-[9px] text-muted-foreground">{state.vehicleCount} vehicles · {state.queueLength} queued</div>
                    </div>
                    <span className="text-sm">{state.congestionLevel > 0.7 ? '🔴' : '🟡'}</span>
                  </div>
                ))}
              </div>

              <div className="panel p-3">
                <div className="text-xs font-bold text-foreground mb-2">↕️ N-S vs ↔️ E-W</div>
                {(() => {
                  const ns = segmentsData.filter(s => ['bell-road', 'hosur-silk-ec', 'hebbal-yelahanka', 'majestic-jaya'].includes(s.seg.id));
                  const ew = segmentsData.filter(s => ['orr-silk-mara', 'orr-mara-krp', 'mg-majestic-ind', 'ind-mara', 'mara-whitefield'].includes(s.seg.id));
                  const nsAvg = ns.length ? ns.reduce((a, s) => a + s.state.congestionLevel, 0) / ns.length : 0;
                  const ewAvg = ew.length ? ew.reduce((a, s) => a + s.state.congestionLevel, 0) / ew.length : 0;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="text-center">
                          <div className={`text-lg font-bold font-mono ${nsAvg > 0.6 ? 'congestion-high' : nsAvg > 0.3 ? 'congestion-medium' : 'congestion-low'}`}>{Math.round(nsAvg * 100)}%</div>
                          <div className="text-[10px] text-muted-foreground">↕️ N-S</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold font-mono ${ewAvg > 0.6 ? 'congestion-high' : ewAvg > 0.3 ? 'congestion-medium' : 'congestion-low'}`}>{Math.round(ewAvg * 100)}%</div>
                          <div className="text-[10px] text-muted-foreground">↔️ E-W</div>
                        </div>
                      </div>
                      {nsAvg > 0.6 && ewAvg > 0.6 && (
                        <div className="text-center text-xs font-bold congestion-high animate-pulse">⚠️ Both directions jammed!</div>
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
