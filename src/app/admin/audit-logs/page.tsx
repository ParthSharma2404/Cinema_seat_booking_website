'use client';

import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, Filter, RefreshCw, Calendar, User } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { TableSkeleton } from '@/components/Skeleton';

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
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5 uppercase tracking-wide">
            <History className="w-5 h-5 text-[#cca255]" />
            Cinema Activity &amp; Security Trail
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time log of bookings, pass redemptions, show schedules, and cancellations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Action Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {actions.map((act) => {
          const isActive = (act === 'All' && !actionFilter) || actionFilter === act;
          return (
            <button
              key={act}
              onClick={() => setActionFilter(act === 'All' ? '' : act)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold shadow-[0_0_12px_rgba(204,162,85,0.3)]'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/10'
              }`}
            >
              {act}
            </button>
          );
        })}
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500 font-mono rounded-3xl border border-white/10 bg-[#0d0f17]/90">
          No logs match the current filter.
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
              Audit Records Stream
            </span>
            <span className="text-xs font-mono text-zinc-400">{logs.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Actor / User</th>
                  <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Metadata Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300 font-mono">
                {logs.map((log) => {
                  let badgeStyle = 'bg-[#cca255]/15 text-[#cca255] border-[#cca255]/30';
                  if (log.action.includes('CONFIRMED') || log.action.includes('REDEEMED')) {
                    badgeStyle = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                  } else if (log.action.includes('CANCELLED') || log.action.includes('FAILED')) {
                    badgeStyle = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {log.actor ? (
                          <div>
                            <span className="font-bold text-white block uppercase tracking-tight">{log.actor.fullName}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{log.actor.role}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic font-mono text-[11px]">SYSTEM</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-zinc-300">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-[10px] text-zinc-500 block truncate max-w-[120px]">
                            {log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-zinc-400 max-w-xs truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
