import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTraffic } from '@/hooks/useTraffic';
import { getAllSafetyScores, getSegmentSafetyScore, safetyColor } from '@/lib/safety-engine';
import { allSegments } from '@/lib/tamilnadu-roads';

function congestionColor(level: number): string {
  if (level < 0.3) return '#22c55e';
  if (level < 0.5) return '#84cc16';
  if (level < 0.65) return '#eab308';
  if (level < 0.8) return '#f97316';
  return '#ef4444';
}

function gradeEmoji(grade: string): string {
  return { A: '🟢', B: '🟡', C: '🟠', D: '🔴', F: '⛔' }[grade] ?? '⚪';
}

function buildSafetyPopup(segName: string, segId: string): string {
  const safety = getSegmentSafetyScore(segId);
  const score = safety.overall;
  const color = safetyColor(score);
  const barWidth = (v: number) => Math.round(v * 100);

  const factorBar = (label: string, value: number, inverted = false) => {
    const display = inverted ? 1 - value : value;
    const pct = barWidth(display);
    const barColor = display >= 0.7 ? '#22c55e' : display >= 0.4 ? '#eab308' : '#ef4444';
    return `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span style="width:72px;font-size:9px;color:#94a3b8;flex-shrink:0">${label}</span>
        <div style="flex:1;height:4px;background:#1e293b;border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px"></div>
        </div>
        <span style="font-size:9px;color:#64748b;width:24px;text-align:right">${pct}%</span>
      </div>`;
  };

  return `
    <div style="font-family:monospace;min-width:210px;padding:12px;background:#0d1117;border-radius:8px">
      <div style="font-size:12px;font-weight:bold;color:#e2e8f0;margin-bottom:6px">${segName}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:48px;height:48px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;color:${color}">${score}</div>
        <div>
          <div style="font-size:13px;font-weight:bold;color:${color}">${gradeEmoji(safety.grade)} Grade ${safety.grade}</div>
          <div style="font-size:10px;color:#94a3b8">${safety.label}</div>
          <div style="font-size:9px;color:#64748b">Risk Index: ${Math.round(safety.riskIndex * 100)}%</div>
        </div>
      </div>
      <div style="border-top:1px solid #1e293b;padding-top:8px;margin-bottom:2px">
        <div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px">Safety Factors</div>
        ${factorBar('Lighting', safety.factors.lighting)}
        ${factorBar('Police', safety.factors.policePresence)}
        ${factorBar('CCTV', safety.factors.cctvCoverage)}
        ${factorBar('Low Risk Time', safety.factors.timeRisk, true)}
        ${factorBar('Low Incidents', safety.factors.incidentHistory, true)}
      </div>
      <div style="margin-top:8px;padding:5px 7px;background:#1e293b;border-radius:4px;font-size:9px;color:#94a3b8">
        💡 ${safety.overall >= 80 ? 'Safe to travel at any time.' : safety.overall >= 65 ? 'Generally safe. Stay alert at night.' : safety.overall >= 50 ? 'Use caution, prefer daylight travel.' : safety.overall >= 35 ? 'Avoid traveling alone here.' : 'High risk — avoid if possible.'}
      </div>
    </div>`;
}

interface TrafficMapProps {
  onSegmentClick?: (id: string) => void;
  className?: string;
  viewMode?: string;
}

export default function TrafficMap({ onSegmentClick, className, viewMode }: TrafficMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const glowLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const isSafetyViewRef = useRef(false);
  const { states } = useTraffic();

  const isSafetyView = viewMode === 'safety';

  useEffect(() => {
    isSafetyViewRef.current = isSafetyView;
  }, [isSafetyView]);

  // Initialize map — centered on India
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [11.0, 78.5], // Center of Tamil Nadu
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM',
    }).addTo(map);

    mapRef.current = map;

    for (const seg of allSegments) {
      const positions = seg.path.map(p => [p[0], p[1]] as L.LatLngExpression);

      const glow = L.polyline(positions, {
        color: '#22c55e', weight: 12, opacity: 0,
        lineCap: 'round', lineJoin: 'round', interactive: false,
      }).addTo(map);
      glowLinesRef.current.set(seg.id, glow);

      const line = L.polyline(positions, {
        color: '#22c55e', weight: 4, opacity: 0.8,
        lineCap: 'round', lineJoin: 'round',
      }).addTo(map);

      line.bindTooltip('', { sticky: true, className: 'traffic-tooltip' });

      line.on('click', (e: L.LeafletMouseEvent) => {
        if (isSafetyViewRef.current) {
          map.closePopup();
          L.popup({ className: 'safety-popup', maxWidth: 260, autoPan: true, closeButton: true })
            .setLatLng(e.latlng)
            .setContent(buildSafetyPopup(seg.name, seg.id))
            .openOn(map);
        } else {
          onSegmentClick?.(seg.id);
        }
      });

      polylinesRef.current.set(seg.id, line);
    }

    return () => { map.remove(); mapRef.current = null; polylinesRef.current.clear(); glowLinesRef.current.clear(); };
  }, []);

  // Update polyline styles
  useEffect(() => {
    const safetyScores = isSafetyView ? getAllSafetyScores() : null;

    for (const seg of allSegments) {
      const line = polylinesRef.current.get(seg.id);
      const glow = glowLinesRef.current.get(seg.id);

      if (isSafetyView && safetyScores) {
        const safety = safetyScores.get(seg.id);
        const score = safety?.overall ?? 50;
        const color = safetyColor(score);
        const weight = 3 + (1 - score / 100) * 5;

        if (line) {
          line.setStyle({ color, weight, opacity: 0.85 });
          line.setTooltipContent(
            `<div style="font-family:monospace;font-size:11px;padding:4px">
              <b>${seg.name}</b><br/>Safety: <b>${score}/100</b> · Grade <b>${safety?.grade ?? 'N/A'}</b><br/>
              <span style="font-size:9px;color:#94a3b8">Tap for full breakdown</span>
            </div>`
          );
        }
        if (glow) {
          const glowOpacity = score < 50 ? 0.25 : score < 65 ? 0.12 : 0;
          glow.setStyle({ color, weight: weight + 10, opacity: glowOpacity });
        }
      } else {
        const state = states.get(seg.id);
        const congestion = state?.congestionLevel ?? 0;
        const color = congestionColor(congestion);
        const weight = 3 + congestion * 6;

        if (line) {
          line.setStyle({ color, weight, opacity: 0.7 + congestion * 0.3 });
          line.setTooltipContent(
            `<div style="font-family:monospace;font-size:11px;padding:4px">
              <b>${seg.name}</b><br/>Congestion: ${Math.round(congestion * 100)}%<br/>
              Vehicles: ${state?.vehicleCount ?? 0}<br/>Speed: ${Math.round((state?.speedFactor ?? 1) * 65)} km/h
            </div>`
          );
        }
        if (glow) {
          glow.setStyle({ color, weight: weight + 8, opacity: congestion > 0.4 ? 0.15 : 0 });
        }
      }
    }
  }, [states, isSafetyView]);

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <div ref={containerRef} className="w-full h-full" style={{ background: '#0a0e1a' }} />
      <div className="scan-line" />

      {isSafetyView && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 font-mono text-[10px]">
          <div className="text-muted-foreground mb-1.5 uppercase tracking-wider text-[9px]">Safety Heatmap</div>
          {[
            { color: '#22c55e', label: 'Very Safe (80–100)' },
            { color: '#84cc16', label: 'Safe (65–79)' },
            { color: '#eab308', label: 'Moderate (50–64)' },
            { color: '#f97316', label: 'Caution (35–49)' },
            { color: '#ef4444', label: 'Unsafe (0–34)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="mt-1.5 pt-1.5 border-t border-border text-[8px] text-muted-foreground">
            Tap a road for full breakdown
          </div>
        </div>
      )}

      <style>{`
        .traffic-tooltip {
          background: hsl(220 18% 10% / 0.95) !important;
          color: hsl(190 60% 85%) !important;
          border: 1px solid hsl(210 20% 18%) !important;
          border-radius: 6px !important;
          padding: 0 !important;
          box-shadow: 0 0 20px hsl(185 80% 50% / 0.1) !important;
        }
        .traffic-tooltip::before { border-top-color: hsl(210 20% 18%) !important; }
        .leaflet-container { background: #0a0e1a !important; }
        .safety-popup .leaflet-popup-content-wrapper {
          background: #0d1117 !important; border: 1px solid hsl(210 20% 22%) !important;
          border-radius: 10px !important; padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px hsl(185 80% 50% / 0.08) !important;
        }
        .safety-popup .leaflet-popup-content { margin: 0 !important; }
        .safety-popup .leaflet-popup-tip { background: #0d1117 !important; }
        .safety-popup .leaflet-popup-close-button { color: #64748b !important; font-size: 16px !important; top: 8px !important; right: 8px !important; }
        .safety-popup .leaflet-popup-close-button:hover { color: #e2e8f0 !important; }
      `}</style>
    </div>
  );
}
