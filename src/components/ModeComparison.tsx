import React from 'react';
import {
  X,
  Car,
  Bus,
  Bike,
  Footprints,
  Clock,
  DollarSign,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { CalendarEvent, TransportMode, RouteOption } from '../types';

interface ModeComparisonProps {
  event: CalendarEvent;
  onClose: () => void;
  onSelectMode: (mode: TransportMode) => void;
}

export const ModeComparison: React.FC<ModeComparisonProps> = ({ event, onClose, onSelectMode }) => {
  const modes: TransportMode[] = ['driving', 'transit', 'bicycling', 'walking'];

  const getIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'driving':
        return <Car className="w-5 h-5" />;
      case 'transit':
        return <Bus className="w-5 h-5" />;
      case 'bicycling':
        return <Bike className="w-5 h-5" />;
      case 'walking':
        return <Footprints className="w-5 h-5" />;
    }
  };

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Transport Mode Trade-Off Comparison
            </span>
            <h2 className="text-xl font-bold text-white">{event.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Destination: {event.parsedDestination || event.location} • Start: {formatTime(event.startTime)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modes.map((m) => {
            const route: RouteOption | undefined = event.routeOptions?.[m];
            const isCurrent = event.selectedMode === m;
            const isRecommended = event.recommendedMode === m;

            if (!route) return null;

            return (
              <div
                key={m}
                className={`rounded-xl border p-4 flex flex-col space-y-4 min-w-0 transition ${
                  isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Top Title & Badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-white font-bold capitalize">
                      <span className="p-1.5 bg-slate-700/80 rounded-lg text-indigo-400">{getIcon(m)}</span>
                      <span>{m}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>

                  {isRecommended && (
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Fastest available route
                    </div>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="space-y-3 text-xs divide-y divide-slate-700/60">
                  {/* Leave-By */}
                  <div className="pt-2">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                      Calculated Leave-By
                    </span>
                    <span className="text-xl font-extrabold text-white font-mono">
                      {formatTime(route.leaveByTime)}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      +{route.bufferMinutes}m buffer included · {route.dataSource || 'Estimate'}
                    </span>
                  </div>

                  {/* Travel Time & Distance */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400">Duration & Dist:</span>
                    <span className="font-semibold text-slate-200">
                      {route.durationMinutes} min ({route.distanceKm} km)
                    </span>
                  </div>

                  {/* Traffic Delay */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400">Traffic Delay:</span>
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                        route.trafficDelayMinutes > 5
                          ? 'bg-red-500/20 text-red-300'
                          : route.trafficDelayMinutes > 0
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {route.trafficStatus === 'unknown' ? 'Not available' : route.trafficDelayMinutes > 0 ? `+${route.trafficDelayMinutes}m` : 'No added delay'}
                    </span>
                  </div>

                  {/* Estimated Cost */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400 flex items-center">
                      <DollarSign className="w-3 h-3 mr-0.5" /> Cost:
                    </span>
                    <span className="font-medium text-slate-200">{route.costEstimate}</span>
                  </div>

                  {/* CO2 Emissions */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400 flex items-center">
                      <Leaf className="w-3 h-3 mr-0.5 text-emerald-400" /> Estimated CO₂:
                    </span>
                    <span className="font-medium text-emerald-300">{route.co2Kg} kg</span>
                  </div>
                </div>

                {/* Step Breakdown */}
                <div className="bg-slate-900/90 rounded-lg p-2.5 space-y-1.5 max-h-48 overflow-y-auto border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Route Breakdown ({route.steps.length} steps):
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {route.steps.map((st, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-indigo-400 font-bold font-mono">{i + 1}.</span>
                        <span>{st.instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => {
                    onSelectMode(m);
                    onClose();
                  }}
                  disabled={isCurrent}
                  className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
                    isCurrent
                      ? 'bg-slate-700 text-slate-400 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  }`}
                >
                  {isCurrent ? 'Currently Selected' : `Switch to ${m}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-400 flex items-center justify-between">
          <span>
            💡 <strong>Pro Tip:</strong> Buffers are extra time beyond the returned journey, which may already include walking. You can customize buffer minutes in settings.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
