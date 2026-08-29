import React, { useState, useEffect } from 'react';
import { Visitor, DeckLog } from '../types';
import { Users, Activity, Monitor, Globe, Smartphone, RefreshCw, ChevronDown, ChevronUp, Lock, KeyRound } from 'lucide-react';
import { visitorId } from '../store';

const ACTION_COLORS: Record<string, string> = {
  CREATE_DECK:  'bg-emerald-50 text-emerald-600 border-emerald-200',
  ADD_CARD:     'bg-blue-50 text-blue-600 border-blue-200',
  ADD_CARDS:    'bg-blue-50 text-blue-600 border-blue-200',
  BULK_UPLOAD:  'bg-purple-50 text-purple-600 border-purple-200',
  EDIT_CARD:    'bg-amber-50 text-amber-600 border-amber-200',
  DELETE_CARD:  'bg-rose-50 text-rose-600 border-rose-200',
};

function DeviceIcon({ type }: { type: string }) {
  if (type === 'mobile' || type === 'tablet') return <Smartphone className="w-4 h-4 text-gray-400" />;
  return <Monitor className="w-4 h-4 text-gray-400" />;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' });
}

function shortenId(id: string) {
  return id ? `${id.slice(0, 8)}…` : '—';
}

export default function AnalyticsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [logs, setLogs] = useState<DeckLog[]>([]);
  const [tab, setTab] = useState<'visitors' | 'logs'>('visitors');
  const [loading, setLoading] = useState(false);
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetch('/api/analytics/has-password')
      .then(r => r.json())
      .then(data => {
        setHasPassword(data.hasPassword);
      })
      .catch(e => console.error('Failed to check password state', e));
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [vRes, lRes] = await Promise.all([
        fetch('/api/analytics/visitors', { headers: { 'x-visitor-id': visitorId } }),
        fetch('/api/analytics/logs',     { headers: { 'x-visitor-id': visitorId } }),
      ]);
      if (vRes.ok) setVisitors(await vRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!hasPassword) {
      const res = await fetch('/api/analytics/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        setHasPassword(true);
        setIsAuthenticated(true);
        setPasswordInput('');
        fetchAll();
      } else {
        setAuthError('Failed to set password');
      }
    } else {
      const res = await fetch('/api/analytics/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verified) {
          setIsAuthenticated(true);
          setPasswordInput('');
          fetchAll();
        } else {
          setAuthError('Invalid password');
        }
      } else {
        setAuthError('Invalid password');
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/analytics/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
    });
    if (res.ok) {
      setIsChangingPassword(false);
      setPasswordInput('');
    } else {
      setAuthError('Failed to update password');
    }
  };

  if (hasPassword === null) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Decorative blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 mb-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-white/50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors shadow-sm"
          >
            ← Back to Home
          </button>
        </div>

        <div className="relative z-10 w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
            {hasPassword ? 'Analytics Login' : 'Set Analytics Password'}
          </h1>
          <p className="text-gray-500 text-sm mb-6 font-medium">
            {hasPassword ? 'Enter the password to access analytics.' : 'Create a password to secure the analytics page.'}
          </p>
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div>
              <input
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                required
              />
              {authError && <p className="text-rose-500 text-xs mt-2 font-bold">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              {hasPassword ? 'Unlock Analytics' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#1F2937] font-sans p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Back Link */}
        <div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-white/50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors shadow-sm"
          >
            ← Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Visitor fingerprints & activity logs across all decks</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsChangingPassword(!isChangingPassword);
                setAuthError('');
                setPasswordInput('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 transition-all shadow-sm"
            >
              <KeyRound className="w-4 h-4" />
              Settings
            </button>
            <button
              id="analytics-refresh-btn"
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {isChangingPassword && (
          <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 mb-2">Change Password</h2>
            <p className="text-gray-500 text-xs font-medium mb-4">Set a new password to secure the analytics page.</p>
            <form onSubmit={handleChangePassword} className="flex gap-3 max-w-sm">
              <input
                type="password"
                placeholder="New Password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:border-gray-400"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"
              >
                Save
              </button>
            </form>
            {authError && <p className="text-rose-500 text-xs mt-2 font-bold">{authError}</p>}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Visitors',   value: visitors.length,  icon: <Users className="w-5 h-5 text-rose-500" />,    bg: 'bg-rose-50 border-rose-100' },
            { label: 'Total Actions',    value: logs.length,      icon: <Activity className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50 border-blue-100' },
            { label: 'Unique Browsers',  value: new Set(visitors.map(v => v.browser_name).filter(Boolean)).size, icon: <Globe className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50 border-purple-100' },
            { label: 'Mobile Visitors',  value: visitors.filter(v => v.device_type === 'mobile' || v.device_type === 'tablet').length, icon: <Smartphone className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50 border-amber-100' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-white border rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm`}>
              <div className={`p-2 rounded-xl w-fit ${stat.bg}`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {(['visitors', 'logs'] as const).map((t) => (
            <button
              key={t}
              id={`analytics-tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'visitors' ? `Visitors (${visitors.length})` : `Activity Log (${logs.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : tab === 'visitors' ? (
          <div className="flex flex-col gap-3">
            {visitors.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-medium bg-white rounded-3xl border border-gray-200 shadow-sm">No visitors recorded yet.</div>
            ) : visitors.map((v) => (
              <div key={v.visitor_id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                <button
                  id={`visitor-row-${v.visitor_id.slice(0, 8)}`}
                  onClick={() => setExpandedVisitor(expandedVisitor === v.visitor_id ? null : v.visitor_id)}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-xl border ${v.visitor_id === visitorId ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                    <DeviceIcon type={v.device_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-700 font-bold">{shortenId(v.visitor_id)}</span>
                      {v.visitor_id === visitorId && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">{v.browser_name || 'Unknown Browser'} {v.browser_version || ''}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500 font-medium">{v.os_name || 'Unknown OS'} {v.os_version || ''}</span>
                      {v.ip_address && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-500 font-mono font-medium">{v.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Last seen</p>
                    <p className="text-xs text-gray-600 font-medium">{formatDate(v.last_seen_at)}</p>
                  </div>
                  {expandedVisitor === v.visitor_id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {expandedVisitor === v.visitor_id && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                      {[
                        { label: 'Visitor ID', value: v.visitor_id },
                        { label: 'IP Address', value: v.ip_address || '—' },
                        { label: 'Browser', value: `${v.browser_name || '—'} ${v.browser_version || ''}` },
                        { label: 'Operating System', value: `${v.os_name || '—'} ${v.os_version || ''}` },
                        { label: 'Device Type', value: v.device_type || '—' },
                        { label: 'Device', value: v.device_vendor ? `${v.device_vendor} ${v.device_model || ''}` : '—' },
                        { label: 'Timezone', value: v.timezone || '—' },
                        { label: 'Language', value: v.language || '—' },
                        { label: 'Resolution', value: v.screen_resolution || '—' },
                        { label: 'Referrer', value: v.referrer || '—' },
                        { label: 'First Seen', value: formatDate(v.first_seen_at) },
                        { label: 'Last Seen', value: formatDate(v.last_seen_at) },
                      ].map((field) => (
                        <div key={field.label} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{field.label}</p>
                          <p className="text-xs text-gray-800 font-mono break-all font-medium">{field.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Full User Agent</p>
                      <p className="text-[11px] text-gray-500 font-mono break-all leading-relaxed">{v.user_agent || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="py-3 px-5">Time</th>
                    <th className="py-3 px-5">Action</th>
                    <th className="py-3 px-5">Deck</th>
                    <th className="py-3 px-5">Visitor</th>
                    <th className="py-3 px-5">Browser / OS</th>
                    <th className="py-3 px-5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">No activity logs yet.</td>
                    </tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-5 text-gray-500 text-xs font-mono whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="py-3 px-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${ACTION_COLORS[log.action] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-700 text-xs font-bold max-w-[140px] truncate">{log.deck_name || shortenId(log.deck_id)}</td>
                      <td className="py-3 px-5">
                        <span className={`font-mono text-xs ${log.visitor_id === visitorId ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}>
                          {log.visitor_id ? shortenId(log.visitor_id) : '—'}
                          {log.visitor_id === visitorId && ' (you)'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-500 text-xs">{log.browser_name || '—'} / {log.os_name || '—'}</td>
                      <td className="py-3 px-5 text-gray-500 text-xs font-mono max-w-[180px] truncate">
                        {log.details ? (() => { try { const d = JSON.parse(log.details); return Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(', '); } catch { return log.details; } })() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
