import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Bell,
  Settings,
  Plus,
  RefreshCw,
  Database,
  Navigation,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { CommuteNotification } from '../types';

interface HeaderProps {
  notifications: CommuteNotification[];
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenSchema: () => void;
  onOpenAddEvent: () => void;
  onSyncCalendar: () => void;
  isSyncing: boolean;
  nextLeaveSummary?: { title: string; mode: string; leaveByTime: string; duration: number };
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
  onOpenSchema,
  onOpenAddEvent,
  onSyncCalendar,
  isSyncing,
  nextLeaveSummary,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [timezoneStr, setTimezoneStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezoneStr(tzName);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute countdown for next leave summary
  const [minsLeft, setMinsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!nextLeaveSummary?.leaveByTime) {
      setMinsLeft(null);
      return;
    }

    const calc = () => {
      const target = new Date(nextLeaveSummary.leaveByTime).getTime();
      const diff = Math.round((target - Date.now()) / (1000 * 60));
      setMinsLeft(diff);
    };

    calc();
    const timer = setInterval(calc, 30000);
    return () => clearInterval(timer);
  }, [nextLeaveSummary?.leaveByTime]);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: Brand & Live Clock */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  Smart Commute Assistant
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Zap className="w-3 h-3 mr-1" /> Commute Planner
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center text-emerald-400 font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" /> {timeStr || '--:--:--'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono">{timezoneStr || 'Local Time'}</span>
              </div>
            </div>
          </div>

          {/* Center: Live Leave-By Ticker Banner */}
          {nextLeaveSummary && minsLeft !== null && (
            <div className="hidden lg:flex items-center px-3.5 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-full text-xs space-x-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${minsLeft <= 15 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${minsLeft <= 15 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-slate-300">
                Next Leave: <strong className="text-white font-semibold">{nextLeaveSummary.title}</strong>
              </span>
              <span className="text-slate-500"> via {nextLeaveSummary.mode}</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                minsLeft <= 15
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {minsLeft <= 0 ? 'LEAVE NOW' : `in ${minsLeft}m`}
              </span>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center space-x-2 self-end md:self-auto">
            {/* Sync Calendar button */}
            <button
              onClick={onSyncCalendar}
              disabled={isSyncing}
              title="Refresh saved event routes"
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium flex items-center transition"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isSyncing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Refreshing...' : 'Refresh Routes'}</span>
            </button>

            {/* Notification Drawer Button */}
            <button
              onClick={onOpenNotifications}
              title="Notification Center"
              className="relative p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Architecture Schema Specs button */}
            <button
              onClick={onOpenSchema}
              title="PostgreSQL Schema & Architecture Specs"
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium flex items-center transition"
            >
              <Database className="w-4 h-4 mr-1 text-slate-400" />
              <span className="hidden sm:inline">Schema & Architecture</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              title="Commute Buffer & Notification Settings"
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <Settings className="w-4 h-4 text-slate-400" />
            </button>

            {/* Add Event Button */}
            <button
              onClick={onOpenAddEvent}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center shadow-sm shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Event
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
