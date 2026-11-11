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
            <History className="w-6 h-6 text-violet-400" />
            System Audit Trail & Security Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of material business transactions, gate redemptions, and cancellations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
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
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors whitespace-nowrap ${
              (act === 'All' && !actionFilter) || actionFilter === act
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl border border-white/10 bg-[#0e101a] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
            Audit Records Stream
          </span>
          <span className="text-xs font-mono text-slate-500">{logs.length} events logged</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No logs match the current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Actor / User</th>
                  <th className="py-3 px-4 font-semibold">Target Entity</th>
                  <th className="py-3 px-4 font-semibold">Metadata Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {log.actor ? (
                        <div>
                          <span className="font-bold text-white block">{log.actor.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.actor.role}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">SYSTEM</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-400">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
