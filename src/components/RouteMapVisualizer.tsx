import React, { useMemo, useState } from 'react';
import { X, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
import { CalendarEvent, TransportMode } from '../types';

export function decodePolyline(encoded: string): [number, number][] {
  let index = 0, lat = 0, lng = 0;
  const points: [number, number][] = [];
  function delta() {
    let result = 0, shift = 0, byte;
    do {
      if (index >= encoded.length || shift > 30) throw new Error('Invalid geometry');
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    return result & 1 ? ~(result >> 1) : result >> 1;
  }
  try {
    while (index < encoded.length) { lat += delta(); lng += delta(); points.push([lat / 1e5, lng / 1e5]); }
    return points;
  } catch { return []; }
}

export const RouteMapVisualizer = ({ event, originAddress, onClose }: {event: CalendarEvent; originAddress: string; onClose: () => void}) => {
  const [mode, setMode] = useState<TransportMode>(event.selectedMode || 'transit');
  const [zoom, setZoom] = useState(1);
  const route = event.routeOptions?.[mode];
  const points = useMemo(() => {
    const coords = decodePolyline(route?.encodedPolyline || '');
    if (coords.length < 2) return [];
    const cosine = Math.cos(coords[0][0] * Math.PI / 180);
    const xs = coords.map(p => p[1] * cosine), ys = coords.map(p => -p[0]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const width = Math.max(...xs) - minX, height = Math.max(...ys) - minY;
    const scale = Math.min(700 / Math.max(width, 0.00001), 300 / Math.max(height, 0.00001));
    return xs.map((x, i) => [400 + (x - minX - width / 2) * scale, 200 + (ys[i] - minY - height / 2) * scale]);
  }, [route?.encodedPolyline]);
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({api: '1', origin: originAddress, destination: event.parsedDestination || event.location, travelmode: mode}).toString();
  return <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
    <section className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-5 max-h-[90vh] overflow-y-auto space-y-4">
      <header className="flex justify-between gap-3"><div><h2 className="text-xl font-bold text-white">Journey route</h2><p className="text-sm text-slate-400">{event.title} · {event.parsedDestination || event.location}</p></div><button aria-label="Close route" onClick={onClose}><X /></button></header>
      <div className="flex gap-2 flex-wrap">{(['driving','transit','bicycling','walking'] as TransportMode[]).map(m => <button key={m} onClick={() => {setMode(m);setZoom(1);}} className={`px-3 py-2 rounded-lg capitalize ${mode === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{m}</button>)}</div>
      <p className="text-sm text-slate-300">{route?.durationMinutes} min · {route?.distanceKm} km · {route?.costEstimate} · {route?.dataSource || 'No route'}</p>
      <div className="rounded-xl bg-slate-950 border border-slate-700 overflow-auto">
        {points.length > 1 ? <svg viewBox={`0 0 ${800 / zoom} ${400 / zoom}`} width="100%" className="min-h-64" aria-label="Geographic route outline from Google Routes">
          <g transform={`translate(${400 / zoom - 400},${200 / zoom - 200})`}>
            <polyline points={points.map(p=>p.join(',')).join(' ')} fill="none" stroke="#38bdf8" strokeWidth="3" />
            {[points[0], points[points.length-1]].map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r="6" fill={i ? '#f472b6' : '#34d399'} /><text x={p[0]+9} y={p[1]-9} fill="white" fontSize="12">{i ? 'Destination' : 'Start'}</text></g>)}
          </g>
        </svg> : <p className="p-12 text-slate-400 text-center">Route geometry unavailable. Open Google Maps to explore this journey.</p>}
      </div>
      <div className="flex justify-between items-center gap-2 flex-wrap text-xs text-slate-400"><span>Google Maps route data · Geographic outline, no street background or traffic layer.</span><div className="flex gap-3"><button aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(3,z+0.5))}><ZoomIn /></button><button aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(1,z-0.5))}><ZoomOut /></button></div></div>
      <a href={url.toString()} target="_blank" rel="noreferrer" className="inline-flex gap-2 text-cyan-300 text-sm">Open street map and navigation in Google Maps <ExternalLink size={16}/></a>
      <div className="space-y-3">{!route?.steps.length && <p className="text-slate-400">Detailed directions unavailable.</p>}{route?.steps.map((step,i)=><div key={i} className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200"><p>{i+1}. {step.instruction}</p><p className="text-slate-400">{step.distance} · {step.duration}{step.lineName ? ` · ${step.lineName}` : ''}</p>{step.departureStop && <p>{step.departureStop} → {step.arrivalStop}</p>}</div>)}</div>
    </section>
  </div>;
};
