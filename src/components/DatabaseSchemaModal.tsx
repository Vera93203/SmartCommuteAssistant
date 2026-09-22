import React, { useState, useEffect } from 'react';
import { X, Database, Code, Server, Layers, Copy, Check, ShieldCheck, Zap } from 'lucide-react';
import { SystemSchema } from '../types';
import { fetchDatabaseSchema } from '../services/api';

interface DatabaseSchemaModalProps {
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
  const [schemaData, setSchemaData] = useState<SystemSchema | null>(null);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tables' | 'architecture'>('tables');

  useEffect(() => {
    fetchDatabaseSchema().then(setSchemaData).catch(console.error);
  }, []);

  const handleCopy = (tableName: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedTable(tableName);
    setTimeout(() => setCopiedTable(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">PostgreSQL Schema & System Architecture</h2>
              <p className="text-xs text-slate-400">Database DDL • Calendar Push • Route Engine Specs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'tables' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>PostgreSQL Tables DDL</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'architecture' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Module Architecture Specs</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'tables' && schemaData && (
            <div className="space-y-4">
              {schemaData.tables.map((table) => (
                <div
                  key={table.name}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-indigo-400 font-bold font-sans text-sm">{table.name}</span>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">{table.description}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(table.name, table.sql)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans rounded text-[11px] flex items-center space-x-1 transition"
                    >
                      {copiedTable === table.name ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 bg-slate-900 rounded-lg text-indigo-200 overflow-x-auto text-[11px] leading-relaxed border border-slate-800/80">
                    {table.sql}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>1. Calendar Sync Engine</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Uses Google Calendar API <code className="bg-slate-800 px-1 py-0.5 rounded">calendar.readonly</code> scope. Registers watch channels for instant push webhooks on event changes, backed by a 5-minute polling fallback. Automatically geocodes location strings to parse destination addresses.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <Server className="w-4 h-4" />
                  <span>2. Route Engine & Rate-Limit Optimization</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Calculates travel metrics across 4 transport modes (driving, transit, bicycling, walking). Batches Google Maps Distance Matrix API calls for events occurring within the next 6 hours to minimize API cost and respect quota limits.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Leave-By Calculator & Notification Debouncer</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Formula: <code className="bg-slate-800 px-1 py-0.5 rounded">leave_by = event_start - duration - buffer</code>. Automatically incorporates mode-specific buffer padding (+10m transit, +8m driving). Notifications are debounced so users are only alerted when leave-by times shift by more than 2 minutes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
