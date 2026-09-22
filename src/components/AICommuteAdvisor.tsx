import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  AlertTriangle,
  CloudRain,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { CalendarEvent, AICommuteAdvice } from '../types';
import { getAIRecommendation, askAIChat } from '../services/api';

interface AICommuteAdvisorProps {
  event: CalendarEvent;
  onClose: () => void;
}

export const AICommuteAdvisor: React.FC<AICommuteAdvisorProps> = ({ event, onClose }) => {
  const [advice, setAdvice] = useState<AICommuteAdvice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello! I am your AI Commute Assistant. I can help explain route information for your event "${event.title}". Ask about journey times and transport options. Live weather and parking availability are not connected.`,
    },
  ]);
  const [inputMsg, setInputMsg] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function loadAdvice() {
      setLoading(true);
      try {
        const res = await getAIRecommendation(event.id, event.selectedMode);
        if (mounted) {
          setAdvice(res);
        }
      } catch (err) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: 'AI advice is unavailable. You can still use the route comparison.' }]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAdvice();
    return () => {
      mounted = false;
    };
  }, [event.id, event.selectedMode]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isSending) return;

    const userText = inputMsg.trim();
    setInputMsg('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsSending(true);

    try {
      const reply = await askAIChat(userText, event.id);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'AI could not answer this request. Please try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Commute Advisor</h2>
              <p className="text-xs text-slate-400">Powered by Gemini AI • Smart Route Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Proactive AI Recommendation Card */}
        {loading ? (
          <div className="bg-slate-800/60 rounded-xl p-6 text-center space-y-2 border border-slate-700/60 shrink-0">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-medium">Requesting advice based on saved route information…</p>
          </div>
        ) : advice ? (
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-xl p-4 space-y-3 shrink-0 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                {advice.source || 'Gemini'} · Suggested Mode: <strong className="text-white capitalize">{advice.recommendedMode}</strong>
              </span>
              <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Leave by {new Date(advice.leaveByTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">{advice.reasoning}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              {advice.trafficWarning && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg p-2 flex items-start space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{advice.trafficWarning}</span>
                </div>
              )}
              {advice.weatherImpact && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg p-2 flex items-start space-x-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{advice.weatherImpact}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* AI Chat History */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex-1 overflow-y-auto space-y-3 min-h-[180px]">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start space-x-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="p-1.5 bg-indigo-600/30 text-indigo-400 rounded-lg border border-indigo-500/30 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <div className="p-1.5 bg-slate-700 text-slate-300 rounded-lg shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
          {isSending && (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Gemini is thinking...</span>
            </div>
          )}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSendChat} className="flex items-center space-x-2 shrink-0">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Ask AI about traffic, weather, parking or alternative routes..."
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!inputMsg.trim() || isSending}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white p-2.5 rounded-xl transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
