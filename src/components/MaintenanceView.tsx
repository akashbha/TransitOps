/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { MaintenanceLog, MaintenanceStatus } from "../types";
import {
  Wrench,
  Plus,
  CheckCircle,
  Clock,
  X,
  Calendar,
  IndianRupee,
  Gauge,
  HelpCircle,
  TrendingDown,
} from "lucide-react";

export const MaintenanceView: React.FC = () => {
  const {
    maintenanceLogs,
    vehicles,
    addMaintenanceLog,
    closeMaintenanceLog,
    currentUser,
  } = useApp();

  const isAuthorizedToEdit = currentUser?.role === "Fleet Manager";

  // --- STATE ---
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | "All">(
    "All",
  );

  // Add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mCost, setMCost] = useState(250);

  // Close modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingLogId, setClosingLogId] = useState<string | null>(null);
  const [closingCost, setClosingCost] = useState(0);
  const [closingError, setClosingError] = useState("");

  // Selectable vehicles (exclude Retired, they shouldn't enter maintenance unless registered)
  const selectableVehicles = vehicles.filter((v) => v.status !== "Retired");

  // Filtered maintenance logs
  const filteredLogs = maintenanceLogs
    .filter((log) => {
      return filterStatus === "All" || log.status === filterStatus;
    })
    .sort((a, b) => {
      // Active logs first, then newest first
      if (a.status === "Active" && b.status !== "Active") return -1;
      if (a.status !== "Active" && b.status === "Active") return 1;
      return b.startDate.localeCompare(a.startDate);
    });

  // --- HANDLERS ---
  const handleOpenAddModal = () => {
    setSelectedVehicleId(selectableVehicles[0]?.id || "");
    setMDescription("");
    setMCost(250);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedVehicleId || !mDescription.trim()) {
      setFormError("Please select a vehicle and describe the work.");
      return;
    }

    const res = await addMaintenanceLog({
      vehicleId: selectedVehicleId,
      description: mDescription.trim(),
      cost: Number(mCost),
    });

    if (res.success) {
      setIsModalOpen(false);
    } else {
      setFormError(res.error || "Failed to submit maintenance log.");
    }
  };

  const handleOpenCloseModal = (log: MaintenanceLog) => {
    setClosingLogId(log.id);
    setClosingCost(log.cost);
    setClosingError("");
    setIsCloseModalOpen(true);
  };

  const handleCloseConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setClosingError("");

    if (!closingLogId) return;

    const res = await closeMaintenanceLog(closingLogId, Number(closingCost));
    if (res.success) {
      setIsCloseModalOpen(false);
    } else {
      setClosingError(res.error || "Failed to complete maintenance task.");
    }
  };

  return (
    <div className="space-y-4">
      {/* QUICK METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI: Active shop logs */}
        <div className="rounded border border-slate-200 bg-white p-3.5 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Vehicles in Shop
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-1 block">
              {maintenanceLogs.filter((m) => m.status === "Active").length}{" "}
              Active Repairs
            </span>
          </div>
          <Clock className="h-6 w-6 text-red-600 animate-pulse" />
        </div>

        {/* KPI: Financial Maintenance Spend */}
        <div className="rounded border border-slate-200 bg-white p-3.5 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Servicing Costs
            </span>
            <span className="text-base font-extrabold text-indigo-750 mt-1 block">
              ₹
              {maintenanceLogs
                .reduce((acc, curr) => acc + curr.cost, 0)
                .toLocaleString()}
            </span>
          </div>
          <IndianRupee className="h-6 w-6 text-indigo-650" />
        </div>

        {/* KPI: Fleet Odometer warning */}
        <div className="rounded border border-slate-200 bg-white p-3.5 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Completed Checkups
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-1 block">
              {maintenanceLogs.filter((m) => m.status === "Completed").length}{" "}
              Closed Logs
            </span>
          </div>
          <CheckCircle className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-150 pb-2.5">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-650"
          >
            <option value="All">All Servicing Logs</option>
            <option value="Active">Active Repairs (In Shop)</option>
            <option value="Completed">Completed Repairs (History)</option>
          </select>
        </div>

        {isAuthorizedToEdit ? (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 rounded bg-indigo-600 px-3.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Record Service Entry</span>
          </button>
        ) : (
          <button
            disabled
            title="Only Fleet Managers or Safety Officers can manage maintenance logs"
            className="flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-400 cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Record Service (Manager)</span>
          </button>
        )}
      </div>

      {/* CORE RULE INDICATOR BAR */}
      <div className="rounded border border-indigo-200 bg-indigo-50 p-3 flex gap-2.5 text-xs text-indigo-800">
        <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold text-indigo-900">
            Maintenance Rule Check:
          </span>{" "}
          Transitioning any vehicle to a{" "}
          <span className="font-bold text-indigo-950">"Service Entry"</span>{" "}
          immediately switches its status to{" "}
          <span className="text-indigo-850 font-extrabold">"In Shop"</span>,
          automatically blocking it from the Dispatch scheduler's pool.
          Completing the maintenance log restores it back to{" "}
          <span className="text-emerald-700 font-bold">"Available"</span>.
        </p>
      </div>

      {/* SERVICING LOGS LIST */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic text-xs">
            No maintenance schedules found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Vehicle Details</th>
                  <th className="px-4 py-2.5">Work Description</th>
                  <th className="px-4 py-2.5">Cost (INR)</th>
                  <th className="px-4 py-2.5">Start Date</th>
                  <th className="px-4 py-2.5">End Date</th>
                  <th className="px-4 py-2.5">Log Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredLogs.map((log) => {
                  const v = vehicles.find((item) => item.id === log.vehicleId);
                  const isActive = log.status === "Active";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      {/* Vehicle Identity */}
                      <td className="px-4 py-2">
                        <div>
                          <span className="font-mono font-bold text-indigo-650 block tracking-wide text-[10px]">
                            {v?.registrationNumber || "N/A"}
                          </span>
                          <span className="text-xs font-bold text-slate-800 block mt-0.5">
                            {v?.name || "Unknown Asset"}
                          </span>
                        </div>
                      </td>

                      {/* Work Description */}
                      <td
                        className="px-4 py-2 font-medium text-slate-600 max-w-[200px] truncate"
                        title={log.description}
                      >
                        {log.description}
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-2 font-mono font-bold text-slate-700">
                        ₹{log.cost.toLocaleString()}
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-2 font-mono text-slate-500">
                        {log.startDate}
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-500">
                        {log.endDate || (
                          <span className="italic text-slate-450 font-normal">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold border ${
                            isActive
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-250"
                          }`}
                        >
                          {isActive ? "Active Shop" : "Completed"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2 text-right">
                        {isActive && isAuthorizedToEdit ? (
                          <button
                            onClick={() => handleOpenCloseModal(log)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[9px] font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Complete & Release</span>
                          </button>
                        ) : isActive ? (
                          <span className="text-[9px] italic text-slate-450 font-medium">
                            View Only
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-450 font-bold flex items-center justify-end gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD RECORD SERVICE ENTRY MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Record Shop Service Intake
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {formError && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 mb-3 text-xs text-red-700 font-semibold">
                {formError}
              </div>
            )}

            {selectableVehicles.length === 0 ? (
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-850 mb-3 font-semibold">
                ⚠️ All active registered assets are retired. Create or edit an
                asset to proceed.
              </div>
            ) : null}

            <form onSubmit={handleCreateLog} className="space-y-3">
              {/* Vehicle Select */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Target Vehicle *
                </label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                >
                  {selectableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber}) - Current Status:{" "}
                      {v.status}
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-450 italic block mt-0.5">
                  This will automatically lock the vehicle in "In Shop" mode.
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Service Work Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe maintenance actions... (e.g. Oil Change, Tyre replacement, Transmission fixing)"
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none resize-none"
                />
              </div>

              {/* Cost */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Estimated Repair Cost (INR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={mCost}
                  onChange={(e) => setMCost(Number(e.target.value))}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-slate-150 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectableVehicles.length === 0}
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
                >
                  Confirm Shop Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- COMPLETE & CLOSE MAINTENANCE TASK MODAL --- */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Complete & Release Service Task
              </h3>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="rounded text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {closingError && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 mb-3 text-xs text-red-700 font-semibold">
                {closingError}
              </div>
            )}

            <form onSubmit={handleCloseConfirm} className="space-y-3">
              {/* Cost */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Final Invoice Cost (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={closingCost}
                  onChange={(e) => setClosingCost(Number(e.target.value))}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
                <span className="text-[9px] text-slate-450 italic block mt-0.5">
                  This will release the vehicle back to "Available" status.
                </span>
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-slate-150 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="rounded border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                >
                  Close & Release Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
