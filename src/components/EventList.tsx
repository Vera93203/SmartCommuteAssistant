import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Car,
  Bus,
  Bike,
  Footprints,
  AlertTriangle,
  Sparkles,
  Map as MapIcon,
  Sliders,
  Trash2,
  Edit2,
  ChevronRight,
  ShieldAlert,
  Search,
  Plus,
  Copy,
  List,
  CalendarDays,
  Clock3,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { CalendarEvent, TransportMode, UserPreferences } from '../types';

interface EventListProps {
  events: CalendarEvent[];
  preferences: UserPreferences;
  onSelectEvent: (event: CalendarEvent) => void;
  onOpenModeCompare: (event: CalendarEvent) => void;
  onOpenMap: (event: CalendarEvent) => void;
  onOpenAIAdvice: (event: CalendarEvent) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onDuplicateEvent?: (event: CalendarEvent) => void;
  onModeChange: (eventId: string, mode: TransportMode) => void;
  onOpenSettings: () => void;
  onAddEventClick?: () => void;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  preferences,
  onSelectEvent,
  onOpenModeCompare,
  onOpenMap,
  onOpenAIAdvice,
  onEditEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onModeChange,
  onOpenSettings,
  onAddEventClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'calendar'>('list');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Filter events
  const filteredEvents = events.filter((evt) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = evt.title.toLowerCase().includes(q);
      const locMatch = evt.location.toLowerCase().includes(q);
      const notesMatch = evt.notes?.toLowerCase().includes(q) || false;
      if (!titleMatch && !locMatch && !notesMatch) return false;
    }

    // Category & Date filters
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'today') {
      const evtDate = new Date(evt.startTime).toDateString();
      const todayDate = new Date().toDateString();
      return evtDate === todayDate;
    }
    if (selectedCategory === 'upcoming') {
      return new Date(evt.startTime).getTime() >= Date.now();
    }
    return evt.category === selectedCategory;
  });

  // Calendar Day specific filtered events
  const calendarEvents = selectedCalendarDay
    ? filteredEvents.filter((evt) => new Date(evt.startTime).toDateString() === selectedCalendarDay)
    : filteredEvents;

  const getModeIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'driving':
        return <Car className="w-4 h-4" />;
      case 'transit':
        return <Bus className="w-4 h-4" />;
      case 'bicycling':
        return <Bike className="w-4 h-4" />;
      case 'walking':
        return <Footprints className="w-4 h-4" />;
    }
  };

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const calcCountdown = (leaveByIso: string) => {
    const diffMs = new Date(leaveByIso).getTime() - Date.now();
    const mins = Math.round(diffMs / (1000 * 60));
    if (mins < 0) {
      return { text: `Passed by ${Math.abs(mins)}m`, urgent: true, passed: true };
    }
    if (mins === 0) {
      return { text: 'LEAVE NOW!', urgent: true, passed: false };
    }
    if (mins <= 15) {
      return { text: `Leave in ${mins} min`, urgent: true, passed: false };
    }
    if (mins < 60) {
      return { text: `Leave in ${mins} min`, urgent: false, passed: false };
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return { text: `Leave in ${hrs}h ${remMins}m`, urgent: false, passed: false };
  };

  // Generate next 7 days for Calendar Grid view
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const next7Days = getNext7Days();

  return (
    <div className="space-y-6">
      {/* Origin & Controls Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Departure Origin
            </span>
            <p className="text-sm font-medium text-slate-100 font-mono">
              {preferences.originAddress || '100 Howard St, San Francisco, CA'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={onOpenSettings}
            className="text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-2 rounded-xl flex items-center transition"
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" /> Configure Origin & Buffers
          </button>
          {onAddEventClick && (
            <button
              onClick={onAddEventClick}
              className="text-xs font-extrabold text-slate-900 bg-cyan-500 hover:bg-cyan-400 px-3.5 py-2 rounded-xl flex items-center space-x-1 shadow-md shadow-cyan-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Schedule Controls Bar: View Modes, Search, Category Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Mode Switcher Pills */}
          <div className="flex items-center space-x-1 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 self-start">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Schedule</span>
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Clock3 className="w-3.5 h-3.5" />
              <span>Day Timeline</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Week Grid</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule by title, venue, or note..."
              className="w-full bg-slate-800/90 border border-slate-700/80 text-white rounded-xl pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            {[
              { id: 'all', label: 'All Schedule' },
              { id: 'today', label: "Today's Schedule" },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'work', label: 'Work' },
              { id: 'health', label: 'Health' },
              { id: 'social', label: 'Social' },
              { id: 'personal', label: 'Personal' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  selectedCategory === tab.id
                    ? 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Found <strong className="text-white">{filteredEvents.length}</strong> scheduled event
            {filteredEvents.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* VIEW MODE 1: WEEK CALENDAR GRID VIEW */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {next7Days.map((day) => {
              const dateStr = day.toDateString();
              const isToday = dateStr === new Date().toDateString();
              const dayEvents = filteredEvents.filter((e) => new Date(e.startTime).toDateString() === dateStr);
              const isSelected = selectedCalendarDay === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between min-h-[110px] ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-500/50'
                      : isToday
                      ? 'bg-slate-800/90 border-cyan-500/50 hover:bg-slate-800'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        {day.toLocaleDateString([], { weekday: 'short' })}
                      </span>
                      {isToday && (
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-black text-white">{day.getDate()}</div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
                    </span>
                    <div className="flex space-x-1">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <span
                          key={idx}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: e.color || '#3b82f6' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedCalendarDay && (
            <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-3 text-xs text-indigo-200">
              <span>
                Filtering schedule for <strong>{selectedCalendarDay}</strong> ({calendarEvents.length} events)
              </span>
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="text-indigo-300 hover:text-white font-bold underline"
              >
                Clear Day Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center">
            <Clock3 className="w-4 h-4 text-cyan-400 mr-2" /> Daily Schedule Trajectory Timeline
          </h3>

          <div className="relative border-l-2 border-slate-700 ml-4 pl-6 space-y-6 py-2">
            {calendarEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No events scheduled on this trajectory.</p>
            ) : (
              calendarEvents.map((evt) => {
                const currentMode: TransportMode = evt.selectedMode || 'transit';
                const route = evt.routeOptions?.[currentMode];

                return (
                  <div key={evt.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 shadow"
                      style={{ backgroundColor: evt.color || '#3b82f6' }}
                    />

                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2 hover:border-slate-600 transition">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                            {formatTime(evt.startTime)} - {formatTime(evt.endTime)}
                          </span>
                          <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEditEvent(evt)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(evt.id)}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{evt.location}</span>
                      </p>

                      {route && (
                        <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                          <span className="flex items-center space-x-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-amber-400 mr-1" />
                            <span>Leave-By: <strong>{formatTime(route.leaveByTime)}</strong></span>
                          </span>
                          <span className="text-slate-400">
                            Mode: <strong className="text-slate-200 capitalize">{currentMode}</strong> ({route.durationMinutes}m)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: DEFAULT LIST VIEW */}
      {(viewMode === 'list' || viewMode === 'calendar') && (
        <>
          {calendarEvents.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
              <CalendarIcon className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-semibold text-slate-200">No matching scheduled events found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No events match your current filter or search criteria. Try clearing search or click below to add a new event.
              </p>
              {onAddEventClick && (
                <button
                  onClick={onAddEventClick}
                  className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Schedule Event</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {calendarEvents.map((evt) => {
                const currentMode: TransportMode = evt.selectedMode || 'transit';
                const route = evt.routeOptions?.[currentMode];
                const countdown = route ? calcCountdown(route.leaveByTime) : null;
                const isDeleting = deleteConfirmId === evt.id;

                return (
                  <div
                    key={evt.id}
                    className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 shadow-md transition space-y-4"
                  >
                    {/* Delete Confirmation Modal Overlay */}
                    {isDeleting && (
                      <div className="bg-red-950/90 border border-red-500/40 rounded-xl p-3.5 flex items-center justify-between text-xs text-red-200 animate-in fade-in duration-200">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Are you sure you want to delete <strong>"{evt.title}"</strong>?</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              onDeleteEvent(evt.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-lg shadow-sm"
                          >
                            Confirm Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Event Top Bar: Date, Title, Category & Direct Action Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                            {formatDate(evt.startTime)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatTime(evt.startTime)} - {formatTime(evt.endTime)}
                          </span>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: evt.color || '#3b82f6' }}
                          >
                            {evt.category}
                          </span>
                          {evt.isSynced && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                              Synced
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-100">{evt.title}</h3>
                      </div>

                      {/* Actions for Edit / Duplicate / Delete */}
                      <div className="flex items-center space-x-1.5 self-start">
                        {onDuplicateEvent && (
                          <button
                            onClick={() => onDuplicateEvent(evt)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-700/60 hover:bg-slate-700 rounded-lg transition"
                            title="Duplicate Schedule Item"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditEvent(evt)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg transition"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(evt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-700/60 hover:bg-slate-700 rounded-lg transition"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Location row */}
                    <div className="flex items-start space-x-2 text-xs text-slate-300">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{evt.location}</span>
                    </div>

                    {/* Transport Mode Selector Pills */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Select Transport Mode:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['driving', 'transit', 'bicycling', 'walking'] as TransportMode[]).map((mode) => {
                          const modeOption = evt.routeOptions?.[mode];
                          const isSelected = currentMode === mode;
                          return (
                            <button
                              key={mode}
                              onClick={() => onModeChange(evt.id, mode)}
                              className={`p-2 rounded-lg border text-xs text-left transition flex flex-col justify-between space-y-1 ${
                                isSelected
                                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500/50'
                                  : 'bg-slate-900/60 border-slate-700/70 text-slate-300 hover:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="flex items-center font-semibold capitalize">
                                  <span className="mr-1.5">{getModeIcon(mode)}</span>
                                  {mode}
                                </span>
                                {evt.recommendedMode === mode && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-bold">
                                    Fastest
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>{modeOption ? `${modeOption.durationMinutes}m` : '--'}</span>
                                <span className="font-mono text-[10px]">
                                  {modeOption ? formatTime(modeOption.leaveByTime) : '--'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Leave-By & Traffic Status Box */}
                    {route && (
                      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Leave-By Time & Buffer */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-xs text-slate-400">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>Calculated Leave-By Time:</span>
                          </div>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-black text-white font-mono tracking-tight">
                              {formatTime(route.leaveByTime)}
                            </span>
                            <span className="text-xs text-slate-400">
                              (ETA {formatTime(route.etaTime)} • +{route.bufferMinutes}m buffer)
                            </span>
                          </div>
                        </div>

                        {/* Center: Live Countdown Badge */}
                        {countdown && (
                          <div className="flex items-center space-x-3">
                            <div
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1.5 ${
                                countdown.urgent
                                  ? 'bg-red-500/20 text-red-200 border-red-500/40 animate-pulse'
                                  : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                              }`}
                            >
                              <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${countdown.urgent ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${countdown.urgent ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                              </span>
                              <span>{countdown.text}</span>
                            </div>
                          </div>
                        )}

                        {/* Right: Traffic & Delay Rating */}
                        <div className="text-left md:text-right space-y-0.5">
                          <div className="flex items-center md:justify-end space-x-1 text-xs">
                            <span className="text-slate-400">Traffic Delay:</span>
                            <span
                              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                                route.trafficDelayMinutes > 5
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : route.trafficDelayMinutes > 0
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {route.trafficStatus === 'unknown' ? 'Not available' : route.trafficDelayMinutes > 0 ? `+${route.trafficDelayMinutes}m delay` : 'No added delay'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {route.distanceKm} km • {route.costEstimate}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Summary note if present */}
                    {evt.aiSummary && (
                      <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-lg p-3 text-xs text-indigo-200 flex items-start space-x-2">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <p>{evt.aiSummary}</p>
                      </div>
                    )}

                    {/* Bottom Action bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60 text-xs">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpenModeCompare(evt)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium flex items-center transition"
                        >
                          <Sliders className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Mode Comparison
                        </button>
                        <button
                          onClick={() => onOpenMap(evt)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-medium flex items-center transition"
                        >
                          <MapIcon className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> View Map
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenAIAdvice(evt)}
                        className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg font-medium flex items-center transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-300" /> AI Commute Advice
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

