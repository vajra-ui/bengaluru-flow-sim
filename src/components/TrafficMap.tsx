import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { segments } from '@/lib/bengaluru-roads';
import { useTraffic } from '@/hooks/useTraffic';

function congestionColor(level: number): string {
  if (level < 0.3) return '#22c55e';
  if (level < 0.5) return '#84cc16';
  if (level < 0.65) return '#eab308';
  if (level < 0.8) return '#f97316';
  return '#ef4444';
}

interface TrafficMapProps {
  onSegmentClick?: (id: string) => void;
  className?: string;
}

export default function TrafficMap({ onSegmentClick, className }: TrafficMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const glowLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const { states } = useTraffic();

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM',
    }).addTo(map);

    mapRef.current = map;

    // Create initial polylines for each segment
    for (const seg of segments) {
      const positions = seg.path.map(p => [p[0], p[1]] as L.LatLngExpression);
      
      // Glow layer
      const glow = L.polyline(positions, {
        color: '#22c55e',
        weight: 12,
        opacity: 0,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(map);
      glowLinesRef.current.set(seg.id, glow);

      // Main line
      const line = L.polyline(positions, {
        color: '#22c55e',
        weight: 4,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      line.bindTooltip('', { sticky: true, className: 'traffic-tooltip' });
      line.on('click', () => onSegmentClick?.(seg.id));
      polylinesRef.current.set(seg.id, line);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      polylinesRef.current.clear();
      glowLinesRef.current.clear();
    };
  }, []);

  // Update polyline styles on state change
  useEffect(() => {
    for (const seg of segments) {
      const state = states.get(seg.id);
      const congestion = state?.congestionLevel ?? 0;
      const color = congestionColor(congestion);
      const weight = 3 + congestion * 6;

      const line = polylinesRef.current.get(seg.id);
      if (line) {
        line.setStyle({ color, weight, opacity: 0.7 + congestion * 0.3 });
        line.setTooltipContent(
          `<div style="font-family:monospace;font-size:11px;padding:4px">
            <b>${seg.name}</b><br/>
            Congestion: ${Math.round(congestion * 100)}%<br/>
            Vehicles: ${state?.vehicleCount ?? 0}<br/>
            Speed: ${Math.round((state?.speedFactor ?? 1) * 65)} km/h
          </div>`
        );
      }

      const glow = glowLinesRef.current.get(seg.id);
      if (glow) {
        glow.setStyle({
          color,
          weight: weight + 8,
          opacity: congestion > 0.4 ? 0.15 : 0,
        });
      }
    }
  }, [states]);

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <div ref={containerRef} className="w-full h-full" style={{ background: '#0a0e1a' }} />
      <div className="scan-line" />
      {/* Custom tooltip styles */}
      <style>{`
        .traffic-tooltip {
          background: hsl(220 18% 10% / 0.95) !important;
          color: hsl(190 60% 85%) !important;
          border: 1px solid hsl(210 20% 18%) !important;
          border-radius: 6px !important;
          padding: 0 !important;
          box-shadow: 0 0 20px hsl(185 80% 50% / 0.1) !important;
        }
        .traffic-tooltip::before {
          border-top-color: hsl(210 20% 18%) !important;
        }
        .leaflet-container {
          background: #0a0e1a !important;
        }
      `}</style>
    </div>
  );
}
