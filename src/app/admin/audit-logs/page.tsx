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
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-violet-600" />
            System Audit Trail & Security Log
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of material business transactions, gate redemptions, and cancellations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Log
        </button>
      </div>

      {/* Action Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {actions.map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act === 'All' ? '' : act)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-colors whitespace-nowrap ${
              (act === 'All' && !actionFilter) || actionFilter === act
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Actor</th>
                  <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action.includes('CONFIRMED')
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : log.action.includes('CANCELLED')
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : log.action.includes('REDEEMED')
                            ? 'bg-violet-50 text-violet-800 border border-violet-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-900 block font-sans font-semibold">
                        {log.actorEmail || 'System / Guest'}
                      </span>
                      {log.actorRole && (
                        <span className="text-[10px] text-slate-400 uppercase">
                          {log.actorRole}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {log.targetEntity} {log.targetId ? `(#${log.targetId.slice(-6)})` : ''}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-500 font-sans">
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
