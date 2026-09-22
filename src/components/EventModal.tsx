import React, { useState } from 'react';
import { X, Calendar, MapPin, Tag, FileText, Navigation, Check } from 'lucide-react';
import { CalendarEvent, EventCategory, TransportMode } from '../types';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';

interface EventModalProps {
  eventToEdit?: CalendarEvent | null;
  onClose: () => void;
  onSave: (eventData: Partial<CalendarEvent>) => void;
}

const PRESET_LOCATIONS = [
  { name: 'Canary Wharf (London)', address: 'One Canada Square, Canary Wharf, London E14 5AB, UK' },
  { name: 'The Shard (London Bridge)', address: '31 St Thomas St, London SE1 9RY, UK' },
  { name: "St Thomas' Hospital", address: "Westminster Bridge Rd, London SE1 7EH, UK" },
  { name: 'The O2 Arena (Greenwich)', address: 'Peninsula Square, London SE10 0DX, UK' },
  { name: 'Heathrow Airport T5', address: 'Terminal 5, Heathrow Airport, Longford TW6 2GA, UK' },
  { name: 'Salesforce Tower (SF)', address: '415 Mission St, San Francisco, CA' },
  { name: 'Chase Center (SF)', address: '1 Warriors Way, San Francisco, CA' },
];

export const EventModal: React.FC<EventModalProps> = ({ eventToEdit, onClose, onSave }) => {
  const isEditing = !!eventToEdit;

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 120 * 60 * 1000).toISOString().slice(0, 16);

  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [location, setLocation] = useState(eventToEdit?.location || '');
  const [parsedDestination, setParsedDestination] = useState(eventToEdit?.parsedDestination || '');
  const [startTime, setStartTime] = useState(
    eventToEdit ? new Date(eventToEdit.startTime).toISOString().slice(0, 16) : defaultStart
  );
  const [endTime, setEndTime] = useState(
    eventToEdit ? new Date(eventToEdit.endTime).toISOString().slice(0, 16) : defaultEnd
  );
  const [category, setCategory] = useState<EventCategory>(eventToEdit?.category || 'work');
  const [selectedMode, setSelectedMode] = useState<TransportMode>(eventToEdit?.selectedMode || 'transit');
  const [notes, setNotes] = useState(eventToEdit?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location) return;

    onSave({
      id: eventToEdit?.id,
      title,
      location,
      parsedDestination: parsedDestination || location,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      category,
      selectedMode,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">{isEditing ? 'Edit Calendar Event' : 'Add New Event'}</h2>
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
          {/* Title */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Executive Board Sync"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Location & Presets */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              Location / Destination Address or Postcode *
            </label>
            <LocationAutocompleteInput
              value={location}
              required
              onChange={(val) => {
                setLocation(val);
                setParsedDestination(val);
              }}
              onSelectSuggestion={(sug) => {
                setLocation(sug.address);
                setParsedDestination(sug.displayName);
              }}
              placeholder="Search address, postcode (e.g. SW1A 1AA, 90210), or landmark..."
            />

            {/* Quick Presets */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Quick Presets:</span>
              <div className="flex flex-wrap gap-1">
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      setLocation(loc.address);
                      setParsedDestination(loc.name);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px] transition"
                  >
                    + {loc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start & End Date-Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category & Preferred Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="work">Work</option>
                <option value="health">Health</option>
                <option value="social">Social</option>
                <option value="personal">Personal</option>
                <option value="flight">Flight/Travel</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                Default Transport
              </label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as TransportMode)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="transit">Public Transit</option>
                <option value="driving">Driving</option>
                <option value="bicycling">Bicycling</option>
                <option value="walking">Walking</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              Event Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Parking code or room details..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-sm"
            >
              {isEditing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
