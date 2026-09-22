import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Trash2,
  CheckCheck,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { CommuteNotification } from '../types';

interface NotificationCenterProps {
  notifications: CommuteNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onTriggerTestAlert: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onClose,
  onMarkRead,
  onTriggerTestAlert,
}) => {
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'leave_now':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'heads_up':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'live_update':
        return <Zap className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleTogglePush = () => {
    if (!pushEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
    setPushEnabled(!pushEnabled);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-5 shadow-2xl flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="space-y-3 shrink-0 border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Notification Engine</h2>
                <p className="text-xs text-slate-400">Web Push & Debounced Alerts Log</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Web Push Toggle Bar */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className={`w-4 h-4 ${pushEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-200">Browser Push Alerts</span>
                <p className="text-[10px] text-slate-400">Debounced (&gt;2m changes)</p>
              </div>
            </div>
            <button
              onClick={handleTogglePush}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                pushEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {pushEnabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          {/* Test Alert & Mark All Buttons */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              onClick={onTriggerTestAlert}
              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test Send "Leave Now" Alert</span>
            </button>
            <button
              onClick={() => onMarkRead('all')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Read All</span>
            </button>
          </div>
        </div>

        {/* Notifications Log List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-slate-500">
              <Bell className="w-8 h-8 mx-auto" />
              <p className="text-xs">No notifications logged yet.</p>
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                  !n.read
                    ? 'bg-slate-800 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {getNotifIcon(n.type)}
                    <span className="font-bold text-slate-200">{n.eventTitle}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed text-[11px]">{n.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
                  <span className="capitalize">Mode: {n.mode}</span>
                  {!n.read ? (
                    <span className="text-indigo-400 font-semibold">• Unread</span>
                  ) : (
                    <span className="text-slate-500">Read</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 pt-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Smart Commute Assistant Notification Engine v1.0
        </div>
      </div>
    </div>
  );
};
