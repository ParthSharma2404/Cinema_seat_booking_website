'use client';

import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, Filter, RefreshCw, Calendar, User } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = actionFilter
        ? `/api/admin/audit-logs?action=${actionFilter}`
        : '/api/admin/audit-logs';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const actions = [
    'All',
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'TICKET_REDEEMED',
    'SHOW_SCHEDULED',
    'MOVIE_CREATED',
    'USER_LOGIN',
    'USER_REGISTERED',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-red-500" />
            System Audit Trail & Security Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of material business transactions, gate redemptions, and cancellations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Log
        </button>
      </div>

      {/* Action Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {actions.map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act === 'All' ? '' : act)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              (act === 'All' && !actionFilter) || actionFilter === act
                ? 'bg-red-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action.includes('CONFIRMED')
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : log.action.includes('CANCELLED')
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : log.action.includes('REDEEMED')
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-white block font-sans font-medium">
                        {log.actorEmail || 'System / Guest'}
                      </span>
                      {log.actorRole && (
                        <span className="text-[10px] text-slate-500 uppercase">
                          {log.actorRole}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {log.targetEntity} {log.targetId ? `(#${log.targetId.slice(-6)})` : ''}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-400 font-sans">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
