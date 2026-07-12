/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { Terminal, ShieldCheck, AlertTriangle, Trash2 } from "lucide-react";

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, clearAuditLogs } = useApp();

  return (
    <div className="rounded border border-slate-200 bg-white p-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Business Rules & Operations Audit Trail
          </h3>
        </div>
        <button
          onClick={clearAuditLogs}
          className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear Logs</span>
        </button>
      </div>

      <div className="max-h-[160px] min-h-[100px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px] leading-relaxed select-text">
        {auditLogs.length === 0 ? (
          <div className="flex h-[100px] items-center justify-center text-slate-400 italic">
            Audit logs empty. Trigger operations to view real-time business rule
            checks.
          </div>
        ) : (
          auditLogs.map((log) => (
            <div
              key={log.id}
              className={`rounded border p-2 transition-all ${
                log.type === "success"
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                  : log.type === "warning"
                    ? "bg-amber-50/50 border-amber-200 text-amber-850 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-0.5">
                <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-[8px]">
                  {log.type === "success" ? (
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  ) : log.type === "warning" ? (
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                  ) : (
                    <Terminal className="h-3 w-3 text-indigo-600" />
                  )}
                  <span>{log.ruleTitle || "Platform Event"}</span>
                </div>
                <span className="text-[8px] text-slate-400 font-semibold">
                  {log.timestamp}
                </span>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">
                {log.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
