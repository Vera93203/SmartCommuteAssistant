import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, Building2, Map, Check, Navigation } from 'lucide-react';
import { LocationSuggestion } from '../types';

interface LocationAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  id?: string;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'Enter address, postcode, or landmark...',
  className = '',
  inputClassName = '',
  required = false,
  id,
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions debounced
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const resp = await fetch(`/api/location/autocomplete?q=${encodeURIComponent(value.trim())}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) {
            setSuggestions(data);
            setIsOpen(data.length > 0);
          }
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (item: LocationSuggestion) => {
    onChange(item.address || item.displayName);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} id={id ? `${id}-container` : undefined}>
      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
        <input
          id={id}
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-9 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition ${inputClassName}`}
        />
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin absolute right-3 pointer-events-none" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-3 p-0.5 text-slate-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-900/90 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800">
            <span>Location Suggestions</span>
            <span className="text-[9px] text-slate-500">Postcodes & Addresses Supported</span>
          </div>

          {suggestions.map((item, idx) => {
            const isHighlighted = idx === selectedIndex;
            return (
              <button
                key={`${item.address}-${idx}`}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-3 py-2.5 flex items-start space-x-2.5 transition text-xs ${
                  isHighlighted ? 'bg-indigo-600/20 text-white border-l-2 border-indigo-500' : 'text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="p-1 rounded bg-slate-800 text-indigo-400 mt-0.5 shrink-0">
                  {item.type === 'postcode' ? (
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  ) : item.type === 'landmark' ? (
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  ) : item.type === 'city' ? (
                    <Map className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between space-x-2">
                    <span className="font-semibold text-white truncate text-[11px]">{item.displayName}</span>
                    {item.type && (
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                          item.type === 'postcode'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : item.type === 'landmark'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : item.type === 'city'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.type}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.address}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
