import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Navigation,
  Sparkles,
  Zap,
  MapPin,
  Car,
  Bus,
  Bike,
  Footprints,
  Sliders,
  ChevronRight,
  RefreshCw,
  Bell,
  Database,
  Plus,
  ShieldAlert,
  Search,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  DollarSign,
  Locate,
  Crosshair,
  Compass,
  Radio,
} from 'lucide-react';
import {
  CalendarEvent,
  UserPreferences,
  CommuteNotification,
  TransportMode,
  TransitPreference,
  RouteOption,
} from './types';
import { LocationAutocompleteInput } from './components/LocationAutocompleteInput';

import {
  fetchEvents,
  fetchPreferences,
  fetchNotifications,
  createEvent,
  updateEvent,
  deleteEvent,
  syncGoogleCalendar,
  updatePreferences,
  markNotificationRead,
  triggerTestNotification,
  calculateCommuteRoute,
} from './services/api';
import { defaultPreferences, LONDON_SAMPLE_EVENTS, SF_SAMPLE_EVENTS, initialNotifications } from './data/mockEvents';
import { Header } from './components/Header';
import { EventList } from './components/EventList';
import { ModeComparison } from './components/ModeComparison';
import { RouteMapVisualizer } from './components/RouteMapVisualizer';
import { AICommuteAdvisor } from './components/AICommuteAdvisor';
import { NotificationCenter } from './components/NotificationCenter';
import { EventModal } from './components/EventModal';
import { SettingsModal } from './components/SettingsModal';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [notifications, setNotifications] = useState<CommuteNotification[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Region switcher state
  const [activeRegion, setActiveRegion] = useState<'london' | 'sf' | 'paris' | 'tokyo'>('london');

  // Quick Calculator State - Defaults to London UK
  const [calcDestination, setCalcDestination] = useState<string>('One Canada Square, Canary Wharf, London E14 5AB, UK');
  const [transitPreference, setTransitPreference] = useState<TransitPreference>('ANY');
  const calculationVersion = useRef(0);
  const [calcMode, setCalcMode] = useState<TransportMode>('transit');
  const [calcOrigin, setCalcOrigin] = useState<string>("King's Cross St. Pancras Station, Euston Rd, London N1 9AL, UK");
  const [calcResult, setCalcResult] = useState<RouteOption | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Geolocation Current Position State
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCurrentLocationUsed, setIsCurrentLocationUsed] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  // Modals & Panels State
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState<boolean>(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

  const [modeCompareEvent, setModeCompareEvent] = useState<CalendarEvent | null>(null);
  const [mapVisualizerEvent, setMapVisualizerEvent] = useState<CalendarEvent | null>(null);
  const [aiAdviceEvent, setAiAdviceEvent] = useState<CalendarEvent | null>(null);

  // Initial Load
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [evts, prefs, notifs] = await Promise.all([
          fetchEvents(),
          fetchPreferences().catch(() => defaultPreferences),
          fetchNotifications(),
        ]);
        setEvents(evts);
        setPreferences(prefs || defaultPreferences);
        if (prefs?.originAddress) setCalcOrigin(prefs.originAddress);
        if (prefs?.originUsesCoordinates) {
          setGpsCoords({lat:prefs.originLat,lng:prefs.originLng});
          setIsCurrentLocationUsed(true);
        }
        setNotifications(notifs);
      } catch (err) {
        console.error('Initialization error:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Poll only local state for reminders; avoid expensive routing on each poll.
  useEffect(() => {
    const timer = setInterval(() => { fetchNotifications().then(setNotifications); }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Switch City / Region Handler
  const handleSwitchRegion = async (region: 'london' | 'sf' | 'paris' | 'tokyo') => {
    setActiveRegion(region);
    let newOrigin = '';
    let newDest = '';

    if (region === 'london') {
      newOrigin = "King's Cross St. Pancras Station, Euston Rd, London N1 9AL, UK";
      newDest = 'One Canada Square, Canary Wharf, London E14 5AB, UK';
    } else if (region === 'sf') {
      newOrigin = '100 Howard St, San Francisco, CA 94105';
      newDest = 'Salesforce Tower, 415 Mission St, San Francisco, CA';
    } else if (region === 'paris') {
      newOrigin = 'Gare du Nord, 18 Rue de Dunkerque, 75010 Paris, France';
      newDest = 'Grande Arche, La Défense, 92800 Puteaux, France';
    } else if (region === 'tokyo') {
      newOrigin = 'Shinjuku Station, 3 Chome Shinjuku, Tokyo 160-0022, Japan';
      newDest = 'Shibuya Sky, 2 Chome-24-12 Shibuya, Tokyo, Japan';
    }

    setCalcOrigin(newOrigin);
    setCalcDestination(newDest);

    // Update preferences origin
    handleSavePreferences({ originAddress: newOrigin });

    setIsCurrentLocationUsed(false);
    setCalcResult(null);
  };

  // Quick Calculator Action
  const handleCalculateCommute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!calcDestination.trim()) return;
    const version = ++calculationVersion.current;
    setCalcResult(null);
    setLocationError(null);

    setIsCalculating(true);
    try {
      const route = await calculateCommuteRoute(
        calcOrigin || preferences.originAddress,
        calcDestination,
        calcMode,
        new Date().toISOString(), transitPreference, isCurrentLocationUsed && gpsCoords ? gpsCoords : undefined
      );
      if (version === calculationVersion.current) setCalcResult(route);
    } catch (err) {
      if (version !== calculationVersion.current) return;
      setCalcResult(null);
      setLocationError(err instanceof Error ? err.message : 'Route calculation failed. Please retry.');
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => { calculationVersion.current++; setCalcResult(null); setLocationError(null); }, [calcOrigin,calcDestination,calcMode,transitPreference]);

  // Geolocation Current Position Handler
  const handleLocateCurrentPosition = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude, accuracy });

        let formattedLocation = `📍 GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              const addr = data.address || {};
              const placeName = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || addr.building;
              const city = addr.city || addr.town || addr.village || addr.state || addr.country;
              if (placeName && city) {
                formattedLocation = `📍 ${placeName}, ${city} (Current GPS)`;
              } else {
                formattedLocation = `📍 ${data.display_name.split(',').slice(0, 3).join(',')} (Current GPS)`;
              }
            }
          }
        } catch (e) {
          console.warn('Reverse geocoding timeout or error, using coordinate string:', e);
        }

        setCalcOrigin(formattedLocation);
        setIsCurrentLocationUsed(true);
        setIsLocating(false);

        // Update preferences
        handleSavePreferences({
          originAddress: formattedLocation,
          originLat: latitude,
          originLng: longitude,
          originUsesCoordinates: true,
        });

        // Calculate explicitly after GPS acquisition so no old input request can overwrite the result.

      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        let msg = 'Unable to acquire GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'GPS access denied by browser permissions. You can type an origin manually or use city presets.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS position unavailable. Check device location services.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'GPS location request timed out. Please try again.';
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5000,
      }
    );
  };

  // Run initial calculation on load
  useEffect(() => {
    handleCalculateCommute();
  }, []);

  // Handlers
  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const res = await syncGoogleCalendar();
      setEvents(res.events);
      const freshNotifs = await fetchNotifications();
      setNotifications(freshNotifs);
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      if (eventData.id) {
        const updated = await updateEvent(eventData.id, eventData);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await createEvent(eventData);
        setEvents((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleDuplicateEvent = async (evtToDup: CalendarEvent) => {
    try {
      const nextDayStart = new Date(new Date(evtToDup.startTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
      const nextDayEnd = new Date(new Date(evtToDup.endTime).getTime() + 24 * 60 * 60 * 1000).toISOString();

      const dupData: Partial<CalendarEvent> = {
        title: `${evtToDup.title} (Copy)`,
        location: evtToDup.location,
        parsedDestination: evtToDup.parsedDestination || evtToDup.location,
        startTime: nextDayStart,
        endTime: nextDayEnd,
        category: evtToDup.category,
        selectedMode: evtToDup.selectedMode,
        notes: evtToDup.notes,
      };
      const created = await createEvent(dupData);
      setEvents((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Error duplicating event:', err);
    }
  };

  const handleModeChange = async (eventId: string, mode: TransportMode) => {
    setEvents((prev) =>
      prev.map((evt) => (evt.id === eventId ? { ...evt, selectedMode: mode } : evt))
    );
    try {
      await updateEvent(eventId, { selectedMode: mode });
    } catch (err) {
      console.error('Error updating selected mode:', err);
    }
  };

  const handleSavePreferences = async (updatedPrefs: Partial<UserPreferences>) => {
    try {
      const saved = await updatePreferences(updatedPrefs);
      setPreferences(saved);
      if (saved.originAddress) setCalcOrigin(saved.originAddress);
      const reloadedEvents = await fetchEvents();
      setEvents(reloadedEvents);
    } catch (err) {
      throw err;
    }
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    if (id === 'all') {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } else {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const handleTriggerTestAlert = async () => {
    try {
      const notif = await triggerTestNotification();
      setNotifications((prev) => [notif, ...prev]);
    } catch (err) {
      console.error('Test notification error:', err);
    }
  };

  const [summaryNow, setSummaryNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setSummaryNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  // Show the earliest unfinished event, rather than the most recently added one.
  const nextEvent = [...events].filter(e => Date.parse(e.endTime) > summaryNow)
    .sort((a,b) => Date.parse(a.startTime) - Date.parse(b.startTime))[0];
  const nextMode: TransportMode = nextEvent?.selectedMode || 'transit';
  const nextRoute = nextEvent?.routeOptions?.[nextMode];

  const calcMinsToLeave = (leaveByIso?: string) => {
    if (!leaveByIso) return 0;
    const diff = new Date(leaveByIso).getTime() - summaryNow;
    return Math.ceil(diff / 60000);
  };

  const nextMinsToLeave = nextRoute ? calcMinsToLeave(nextRoute.leaveByTime) : 18;
  const alternativeRoute = (Object.values(nextEvent?.routeOptions || {}) as RouteOption[])
    .filter(r => r.mode !== nextMode)
    .sort((a,b) => a.durationMinutes - b.durationMinutes)[0];
  const modeLabels: Record<TransportMode, string> = {driving:'Driving',transit:'Public transport',bicycling:'Cycling',walking:'Walking'};
  const modeIcons = {driving:Car,transit:Bus,bicycling:Bike,walking:Footprints};
  const summaryTime = (value: string) => new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-900 flex flex-col">
      {/* App Header */}
      <Header
        notifications={notifications}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSchema={() => setIsSchemaOpen(true)}
        onOpenAddEvent={() => {
          setEventToEdit(null);
          setIsEventModalOpen(true);
        }}
        onSyncCalendar={handleSyncCalendar}
        isSyncing={isSyncing}
        nextLeaveSummary={
          nextEvent && nextRoute
            ? {
                title: nextEvent.title,
                mode: nextMode,
                leaveByTime: nextRoute.leaveByTime,
                duration: nextRoute.durationMinutes,
              }
            : undefined
        }
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* 1. MAIN COMMUTE CALCULATOR BAR (Required Feature) */}
        <section className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Calculator className="w-48 h-48 text-cyan-400" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/50 pb-4">
              <div>
                <span className="inline-flex items-center px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-full border border-cyan-500/20 mb-1">
                  <Zap className="w-3.5 h-3.5 mr-1" /> Global Commute Calculator
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Instant Travel Time & Leave-By Route Calculator
                </h2>
              </div>

              {/* Quick Region Selector Pills */}
              <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/80 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSwitchRegion('london')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeRegion === 'london'
                      ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>🇬🇧 London, UK</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchRegion('sf')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeRegion === 'sf'
                      ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>🇺🇸 San Francisco</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchRegion('paris')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeRegion === 'paris'
                      ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>🇫🇷 Paris</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchRegion('tokyo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    activeRegion === 'tokyo'
                      ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>🇯🇵 Tokyo</span>
                </button>
              </div>
            </div>

            {/* Geolocation Alert or GPS Active Banner */}
            {locationError && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{locationError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationError(null)}
                  className="text-amber-400 hover:text-white font-bold text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {isCurrentLocationUsed && gpsCoords && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold">GPS coordinates:</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                    {gpsCoords.accuracy ? ` (±${Math.round(gpsCoords.accuracy)}m)` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLocateCurrentPosition}
                  disabled={isLocating}
                  className="text-emerald-400 hover:text-white font-bold flex items-center space-x-1 underline decoration-dotted"
                >
                  <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>Re-sync GPS</span>
                </button>
              </div>
            )}

            {/* Input Form Controls */}
            <form onSubmit={handleCalculateCommute} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Departure Origin Input with GPS Locate Me Feature */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                      <Navigation className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> Departure Origin
                    </label>
                    <button
                      type="button"
                      onClick={handleLocateCurrentPosition}
                      disabled={isLocating}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 transition active:scale-95 disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <Locate className="w-3 h-3 text-cyan-400" />
                          <span>Locate Me (GPS)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <LocationAutocompleteInput
                      value={calcOrigin}
                      required
                      onChange={(val) => {
                        setCalcOrigin(val);
                        setIsCurrentLocationUsed(false);
                      }}
                      onSelectSuggestion={(sug) => {setCalcOrigin(sug.address);setIsCurrentLocationUsed(false);}}
                      placeholder="Type origin, postcode (e.g. SW1A 1AA, 90210), or click GPS..."
                      inputClassName="py-2.5 text-sm rounded-2xl pr-20"
                    />
                    <button
                      type="button"
                      onClick={handleLocateCurrentPosition}
                      disabled={isLocating}
                      title="Acquire current position using device GPS"
                      className="absolute right-2 top-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-900 text-cyan-400 px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 border border-slate-700 z-10"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">GPS</span>
                    </button>
                  </div>
                </div>

                {/* 2. Destination Input Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> Destination Address / Postcode
                  </label>
                  <LocationAutocompleteInput
                    value={calcDestination}
                    required
                    onChange={setCalcDestination}
                    onSelectSuggestion={(sug) => setCalcDestination(sug.address)}
                    placeholder="Enter postcode (e.g. EC1A 1BB), landmark, or full address..."
                    inputClassName="py-2.5 text-sm rounded-2xl"
                  />
                </div>
              </div>

              {/* Row 2: Transport Mode & Calculate Action */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Commute Mode Selector */}
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> Transport Mode
                  </label>
                  <div className="grid grid-cols-4 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCalcMode('transit')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center space-x-1 transition ${
                        calcMode === 'transit'
                          ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Bus className="w-4 h-4 mb-0.5 sm:mb-0" />
                      <span>Transit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcMode('driving')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center space-x-1 transition ${
                        calcMode === 'driving'
                          ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Car className="w-4 h-4 mb-0.5 sm:mb-0" />
                      <span>Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcMode('bicycling')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center space-x-1 transition ${
                        calcMode === 'bicycling'
                          ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Bike className="w-4 h-4 mb-0.5 sm:mb-0" />
                      <span>Bike</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcMode('walking')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center space-x-1 transition ${
                        calcMode === 'walking'
                          ? 'bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Footprints className="w-4 h-4 mb-0.5 sm:mb-0" />
                      <span>Walk</span>
                    </button>
                  </div>
                </div>

                {/* Calculate Button */}
                <div className="md:col-span-4">
                  <button
                    type="submit"
                    disabled={isCalculating || !calcDestination.trim()}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-900 font-extrabold py-3 px-4 rounded-2xl transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 active:scale-95"
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Computing...</span>
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4" />
                        <span>Calculate Travel Time</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {calcMode === 'transit' && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <label htmlFor="transit-preference" className="block text-sm font-semibold text-slate-200 mb-2">Preferred public transport</label>
                <select id="transit-preference" value={transitPreference} onChange={e => {setTransitPreference(e.target.value as TransitPreference);setCalcResult(null);}} className="w-full sm:w-72 bg-slate-800 border border-slate-600 rounded-lg p-2 text-white">
                  <option value="ANY">Any public transport</option><option value="BUS">Bus only</option><option value="RAIL">All rail (train, Tube, tram)</option><option value="SUBWAY">Tube / Subway only</option><option value="TRAIN">Train only</option><option value="LIGHT_RAIL">Tram / Light rail only</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">Only matching transit vehicles are accepted. Walking connections may be included. If Google returns a different mode, no fare will be shown.</p>
              </div>}
            </form>

            {/* Calculated Results Banner */}
            {calcResult && (
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 mt-4 space-y-3 animate-in fade-in duration-300">
                {calcResult.mode === 'transit' && <div className="text-sm text-cyan-200">
                  <p>Journey: {calcResult.steps.filter(s => s.mode === 'transit').map(s => `${s.transitVehicle || 'Transit'}${s.lineName ? ' ' + s.lineName : ''}`).join(' → ') || 'Transit details unavailable'}</p>
                  {calcResult.dataSource !== 'Google Routes' && <p className="text-amber-300">Estimated fallback — preferred transport could not be verified.</p>}
                  <details className="mt-2 text-slate-300"><summary className="cursor-pointer">View stops and journey steps</summary><ol className="mt-2 space-y-2">{calcResult.steps.map((step,i) => <li key={i}>{i+1}. {step.instruction}{step.departureStop && <span className="block text-xs text-slate-400">{step.departureStop} → {step.arrivalStop}</span>}</li>)}</ol></details>
                </div>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Route Calculation Complete — {calcResult.dataSource || 'Estimate'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {calcOrigin} <ArrowRight className="w-3 h-3 inline mx-1 text-cyan-400" /> {calcDestination}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
                      Departure: {new Date(calcResult.leaveByTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                      ETA: {new Date(calcResult.etaTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Travel Duration</p>
                    <p className="text-lg font-black text-cyan-400">{calcResult.durationMinutes} mins</p>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Distance</p>
                    <p className="text-lg font-black text-white">{calcResult.distanceKm} km</p>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 flex items-center">
                      <Leaf className="w-3 h-3 text-emerald-400 mr-1" /> Estimated CO₂
                    </p>
                    <p className="text-lg font-black text-emerald-400">{calcResult.co2Kg} kg</p>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 flex items-center">
                      <DollarSign className="w-3 h-3 text-amber-400 mr-1" /> Cost Estimate
                    </p>
                    <p className="text-lg font-black text-amber-300">{calcResult.costEstimate}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {nextEvent && nextRoute && (
          <section aria-label="Next event travel summary" className="rounded-3xl border border-slate-700 bg-slate-800/40 p-5 sm:p-7 space-y-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wider uppercase text-cyan-300">{Date.parse(nextEvent.startTime) <= summaryNow ? 'Event in progress' : 'Next event'} · {new Date(nextEvent.startTime).toLocaleDateString([], {month:'short',day:'numeric'})}</p>
                <h2 className="text-2xl font-bold text-white mt-1">{nextEvent.title}</h2>
                <p className="text-sm text-slate-400 mt-1 break-words">{nextEvent.parsedDestination || nextEvent.location}</p>
              </div>
              <div className="text-sm text-slate-400">Event starts <span className="block text-xl font-semibold text-white">{summaryTime(nextEvent.startTime)}</span></div>
            </div>
            <div className="grid lg:grid-cols-[1.1fr_1fr_1fr] gap-4">
              <div className={`rounded-2xl border p-5 ${nextMinsToLeave < 0 ? 'border-rose-500/40 bg-rose-950/20' : 'border-cyan-500/30 bg-slate-900/70'}`}>
                <p className="text-sm text-slate-300">{nextMinsToLeave < 0 ? 'Planned departure has passed' : nextMinsToLeave === 0 ? 'Time to leave' : 'Leave in'}</p>
                <p className={`text-3xl font-bold mt-2 ${nextMinsToLeave < 0 ? 'text-rose-300' : 'text-cyan-300'}`}>{nextMinsToLeave === 0 ? 'Now' : `${Math.abs(nextMinsToLeave)} min${nextMinsToLeave < 0 ? ' ago' : ''}`}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-slate-400">Planned departure</dt><dd>{summaryTime(nextRoute.leaveByTime)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-400">Journey time</dt><dd>{nextRoute.durationMinutes} min</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-400">Extra buffer</dt><dd>{nextRoute.bufferMinutes} min</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-slate-400">Planned arrival</dt><dd>{summaryTime(nextRoute.etaTime)}</dd></div>
                </dl>
                <p className="text-xs text-slate-400 mt-4">{nextMinsToLeave < 0 ? 'These are planned times, not an arrival estimate if you leave now. Refresh routes before travelling.' : 'The buffer is extra time before the event starts.'}</p>
              </div>
              {[nextRoute, alternativeRoute].map((route,index) => {
                if (!route) return <div key="none" className="p-5 text-slate-400">No alternative route available.</div>;
                const Icon = modeIcons[route.mode];
                const difference = route.durationMinutes - nextRoute.durationMinutes;
                return <div key={route.mode} className={`rounded-2xl border p-5 flex flex-col ${index === 0 ? 'border-cyan-500/50 bg-cyan-950/30' : 'border-slate-700 bg-slate-900/50'}`}>
                  <div className="flex items-center gap-2 text-sm text-slate-400"><Icon className="w-5 h-5 text-cyan-300" />{index === 0 ? 'Your selected mode' : 'Fastest other option'}</div>
                  <h3 className="text-xl font-semibold mt-3">{modeLabels[route.mode]}</h3>
                  <p className="text-3xl font-bold mt-3">{route.durationMinutes}<span className="text-sm font-normal text-slate-400"> min · {route.distanceKm} km</span></p>
                  <p className="text-sm text-slate-300 mt-3">{route.costEstimate}</p>
                  <p className="text-xs text-slate-400 mt-3">{route.mode === 'driving' && route.trafficStatus !== 'unknown' ? `${route.trafficDelayMinutes} min traffic delay included in journey time` : 'Live disruption information unavailable'}</p>
                  <p className="text-xs text-slate-500 mt-2">{route.dataSource || 'Estimate'} · Updated {summaryTime(route.updatedAt)}</p>
                  {index === 1 && <><p className="text-sm text-cyan-300 mt-4">{difference === 0 ? 'Same journey time' : `${Math.abs(difference)} min ${difference < 0 ? 'faster' : 'slower'} than your selection`}</p><button onClick={() => handleModeChange(nextEvent.id,route.mode)} className="mt-4 rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm">Use {modeLabels[route.mode].toLowerCase()}</button></>}
                </div>;
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-700 pt-4">
              <p className="text-sm text-slate-400 break-words">From: <span className="text-slate-200">{preferences.originAddress}</span></p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setModeCompareEvent(nextEvent)} className="rounded-lg bg-slate-700 px-3 py-2 text-sm">Compare all modes</button>
                <button onClick={() => setMapVisualizerEvent(nextEvent)} className="rounded-lg bg-cyan-950 text-cyan-300 px-3 py-2 text-sm">View route</button>
                <button onClick={() => setAiAdviceEvent(nextEvent)} className="rounded-lg bg-indigo-950 text-indigo-300 px-3 py-2 text-sm">Ask AI</button>
              </div>
            </div>
          </section>
        )}

        {/* 3. CALENDAR EVENTS & DAILY TRAJECTORY SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em]">
                Daily Trajectory & Scheduled Events
              </h2>
              <p className="text-xs text-slate-400">
                Routes calculated when loaded or refreshed. Estimates can change before departure.
              </p>
            </div>
            <button
              onClick={() => {
                setEventToEdit(null);
                setIsEventModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-cyan-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>

          {/* Event List Component */}
          <EventList
            events={events}
            preferences={preferences}
            onSelectEvent={(evt) => setModeCompareEvent(evt)}
            onOpenModeCompare={(evt) => setModeCompareEvent(evt)}
            onOpenMap={(evt) => setMapVisualizerEvent(evt)}
            onOpenAIAdvice={(evt) => setAiAdviceEvent(evt)}
            onEditEvent={(evt) => {
              setEventToEdit(evt);
              setIsEventModalOpen(true);
            }}
            onDeleteEvent={handleDeleteEvent}
            onDuplicateEvent={handleDuplicateEvent}
            onModeChange={handleModeChange}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onAddEventClick={() => {
              setEventToEdit(null);
              setIsEventModalOpen(true);
            }}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 mt-12 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Smart Commute Assistant • Local journey planner</p>
        <p>Google Routes • Local saved events • In-app reminders • Optional Gemini advice</p>
      </footer>

      {/* OVERLAY MODALS & DRAWERS */}
      {isNotificationOpen && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setIsNotificationOpen(false)}
          onMarkRead={handleMarkRead}
          onTriggerTestAlert={handleTriggerTestAlert}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          preferences={preferences}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSavePreferences}
        />
      )}

      {isSchemaOpen && <DatabaseSchemaModal onClose={() => setIsSchemaOpen(false)} />}

      {isEventModalOpen && (
        <EventModal
          eventToEdit={eventToEdit}
          onClose={() => {
            setIsEventModalOpen(false);
            setEventToEdit(null);
          }}
          onSave={handleSaveEvent}
        />
      )}

      {modeCompareEvent && (
        <ModeComparison
          event={modeCompareEvent}
          onClose={() => setModeCompareEvent(null)}
          onSelectMode={(mode) => {
            handleModeChange(modeCompareEvent.id, mode);
            setModeCompareEvent(null);
          }}
        />
      )}

      {mapVisualizerEvent && (
        <RouteMapVisualizer
          event={mapVisualizerEvent}
          originAddress={preferences.originAddress}
          onClose={() => setMapVisualizerEvent(null)}
        />
      )}

      {aiAdviceEvent && (
        <AICommuteAdvisor event={aiAdviceEvent} onClose={() => setAiAdviceEvent(null)} />
      )}
    </div>
  );
}
