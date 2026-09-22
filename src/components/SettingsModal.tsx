import React, { useState } from 'react';
import { X, Settings, MapPin, Clock, Sliders, Shield, Save, Check, Locate, RefreshCw } from 'lucide-react';
import { UserPreferences, TransportMode } from '../types';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';

interface SettingsModalProps {
  preferences: UserPreferences;
  onClose: () => void;
  onSave: (updated: Partial<UserPreferences>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ preferences, onClose, onSave }) => {
  const [originAddress, setOriginAddress] = useState(preferences.originAddress);
  const [drivingBuffer, setDrivingBuffer] = useState(preferences.buffers.driving);
  const [transitBuffer, setTransitBuffer] = useState(preferences.buffers.transit);
  const [bicyclingBuffer, setBicyclingBuffer] = useState(preferences.buffers.bicycling);
  const [walkingBuffer, setWalkingBuffer] = useState(preferences.buffers.walking);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(preferences.quietHours.enabled);
  const [quietHoursStart, setQuietHoursStart] = useState(preferences.quietHours.start);
  const [quietHoursEnd, setQuietHoursEnd] = useState(preferences.quietHours.end);
  const [headsUpMinutes, setHeadsUpMinutes] = useState(preferences.notificationThresholds.headsUpMinutes);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocateGps = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let formatted = `📍 GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              const addr = data.address || {};
              const place = addr.road || addr.suburb || addr.city;
              if (place) formatted = `📍 ${place}, ${addr.city || addr.country || ''}`;
            }
          }
        } catch (e) {
          console.warn('Reverse geocode error:', e);
        }
        setOriginAddress(formatted);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try { await onSave({
      originAddress,
      buffers: {
        driving: Number(drivingBuffer),
        transit: Number(transitBuffer),
        bicycling: Number(bicyclingBuffer),
        walking: Number(walkingBuffer),
      },
      quietHours: {
        enabled: quietHoursEnabled,
        start: quietHoursStart,
        end: quietHoursEnd,
      },
      notificationThresholds: {
        ...preferences.notificationThresholds,
        headsUpMinutes: Number(headsUpMinutes),
      },
    });

    } catch { setSaveError('Could not save settings. Please retry.'); return; } finally { setSaving(false); }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {saveError && <p role="alert" className="text-red-300">{saveError}</p>}
        {saving && <p className="text-cyan-300">Saving and recalculating routes…</p>}
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Commute & Buffer Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Default Departure Origin */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px] flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Default Origin Address
              </label>
              <button
                type="button"
                onClick={handleLocateGps}
                disabled={isLocating}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 transition"
              >
                {isLocating ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                ) : (
                  <Locate className="w-2.5 h-2.5 text-cyan-400" />
                )}
                <span>Locate Me (GPS)</span>
              </button>
            </div>
            <LocationAutocompleteInput
              value={originAddress}
              required
              onChange={setOriginAddress}
              onSelectSuggestion={(sug) => setOriginAddress(sug.address)}
              placeholder="Type address, postcode (e.g. EC1A 1BB), or click 'Locate Me'..."
            />
            <p className="text-[10px] text-slate-400">Used as default starting point for all leave-by calculations.</p>
          </div>

          {/* Buffer Minutes per Mode */}
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px] flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Mode Safety Buffers (Minutes)
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-300 font-medium text-[11px] block">Transit Buffer</span>
                <input
                  type="number"
                  min="0"
                  max="45"
                  value={transitBuffer}
                  onChange={(e) => setTransitBuffer(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[9px] text-slate-400 block">Extra margin beyond the returned journey</span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-300 font-medium text-[11px] block">Driving Buffer</span>
                <input
                  type="number"
                  min="0"
                  max="45"
                  value={drivingBuffer}
                  onChange={(e) => setDrivingBuffer(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[9px] text-slate-400 block">For garage parking & walking</span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-300 font-medium text-[11px] block">Bicycling Buffer</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={bicyclingBuffer}
                  onChange={(e) => setBicyclingBuffer(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[9px] text-slate-400 block">For unlocking/locking bike</span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-300 font-medium text-[11px] block">Walking Buffer</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={walkingBuffer}
                  onChange={(e) => setWalkingBuffer(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[9px] text-slate-400 block">General padding</span>
              </div>
            </div>
          </div>

          {/* Quiet Hours & Alerts */}
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px] flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" /> Quiet Hours
              </label>
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
            </div>

            {quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Quiet Hours Start:</span>
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Quiet Hours End:</span>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notification Threshold */}
          <div className="space-y-1 border-t border-slate-800 pt-3">
            <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              Heads-Up Alert Notice Window (Minutes)
            </label>
            <input
              type="number"
              min="15"
              max="180"
              value={headsUpMinutes}
              onChange={(e) => setHeadsUpMinutes(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-400">In-app reminder before departure. Requires the server running; open the app to view alerts.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-emerald-300" /> Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" /> Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
