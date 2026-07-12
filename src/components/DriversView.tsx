/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp, TODAY_DATE } from "../context/AppContext";
import { Driver, DriverStatus } from "../types";
import { exportToCSV } from "../utils/csvExport";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  AlertCircle,
  X,
  ShieldAlert,
  Check,
  Sparkles,
  Phone,
  Flame,
  Award,
} from "lucide-react";

export const DriversView: React.FC = () => {
  const { drivers, addDriver, updateDriver, deleteDriver, currentUser } =
    useApp();

  const isManager = currentUser?.role === "Fleet Manager";
  const isSafetyOfficer = currentUser?.role === "Safety Officer";
  const isAuthorizedToEdit = isSafetyOfficer;

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<DriverStatus | "All">("All");
  const [filterCompliance, setFilterCompliance] = useState<
    "All" | "Compliant" | "Expired" | "ExpiringSoon"
  >("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [dName, setDName] = useState("");
  const [dLicense, setDLicense] = useState("");
  const [dCategory, setDCategory] = useState("Class A CDL");
  const [dExpiry, setDExpiry] = useState("");
  const [dContact, setDContact] = useState("");
  const [dSafety, setDSafety] = useState(90);
  const [dStatus, setDStatus] = useState<DriverStatus>("Available");

  // --- COMPLIANCE CHECKS ---
  const checkLicenseStatus = (
    expiry: string,
  ): "Expired" | "ExpiringSoon" | "Compliant" => {
    if (expiry < TODAY_DATE) return "Expired";

    // Check if expiring in the next 30 days (simplified date arithmetic)
    const today = new Date(TODAY_DATE);
    const exp = new Date(expiry);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 30) return "ExpiringSoon";
    return "Compliant";
  };

  // --- FILTER LOGIC ---
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || d.status === filterStatus;

    const compStatus = checkLicenseStatus(d.licenseExpiry);
    const matchesCompliance =
      filterCompliance === "All" ||
      (filterCompliance === "Expired" && compStatus === "Expired") ||
      (filterCompliance === "ExpiringSoon" && compStatus === "ExpiringSoon") ||
      (filterCompliance === "Compliant" && compStatus === "Compliant");

    return matchesSearch && matchesStatus && matchesCompliance;
  });

  // --- ACTION HANDLERS ---
  const openAddModal = () => {
    setModalMode("add");
    setDName("");
    setDLicense("");
    setDCategory("Class A CDL");
    setDExpiry("");
    setDContact("");
    setDSafety(95);
    setDStatus("Available");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setModalMode("edit");
    setEditingId(driver.id);
    setDName(driver.name);
    setDLicense(driver.licenseNumber);
    setDCategory(driver.licenseCategory);
    setDExpiry(driver.licenseExpiry);
    setDContact(driver.contactNumber);
    setDSafety(driver.safetyScore);
    setDStatus(driver.status);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!dName.trim() || !dLicense.trim() || !dExpiry.trim()) {
      setFormError("Please fill out all required fields.");
      return;
    }

    const driverData = {
      name: dName.trim(),
      licenseNumber: dLicense.trim(),
      licenseCategory: dCategory,
      licenseExpiry: dExpiry,
      contactNumber: dContact.trim(),
      safetyScore: Number(dSafety),
      status: dStatus,
    };

    if (modalMode === "add") {
      const res = await addDriver(driverData);
      if (res.success) setIsModalOpen(false);
      else setFormError(res.error || "Failed to register driver.");
    } else if (modalMode === "edit" && editingId) {
      const res = await updateDriver({
        ...driverData,
        id: editingId,
      });
      if (res.success) setIsModalOpen(false);
      else setFormError(res.error || "Failed to update driver profile.");
    }
  };

  const handleSuspendDriver = async (driver: Driver) => {
    await updateDriver({
      ...driver,
      status: "Suspended",
    });
  };

  const handleReinstateDriver = async (driver: Driver) => {
    await updateDriver({
      ...driver,
      status: "Available",
    });
  };

  const handleCSVExport = () => {
    const exportData = drivers.map((d) => ({
      "Driver Name": d.name,
      "License ID": d.licenseNumber,
      "License Class": d.licenseCategory,
      "License Expiry": d.licenseExpiry,
      "Contact Phone": d.contactNumber,
      "Safety Score (0-100)": d.safetyScore,
      "Operational Status": d.status,
      "Compliance Check": checkLicenseStatus(d.licenseExpiry),
    }));
    exportToCSV(
      exportData,
      `TransitOps_Drivers_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const getStatusBadgeClass = (status: DriverStatus) => {
    switch (status) {
      case "Available":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "On Trip":
        return "bg-indigo-55 text-indigo-700 border-indigo-200";
      case "Off Duty":
        return "bg-slate-50 text-slate-600 border-slate-200";
      case "Suspended":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* COMPLIANCE WIDGETS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Compliance widget */}
        <div className="rounded border border-slate-200 bg-white p-3.5 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">
              Licensing Alert Center
            </span>
            <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
              {
                drivers.filter(
                  (d) => checkLicenseStatus(d.licenseExpiry) === "Expired",
                ).length
              }{" "}
              Expired License(s)
            </span>
          </div>
          <AlertCircle
            className={`h-7 w-7 ${drivers.some((d) => checkLicenseStatus(d.licenseExpiry) === "Expired") ? "text-red-600 animate-pulse" : "text-slate-300"}`}
          />
        </div>

        {/* Safety widget */}
        <div className="rounded border border-slate-200 bg-white p-3.5 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">
              Average Safety Rating
            </span>
            <span className="text-lg font-extrabold text-indigo-650 mt-0.5 block">
              {Math.round(
                drivers.reduce((acc, curr) => acc + curr.safetyScore, 0) /
                  drivers.length,
              )}
              /100
            </span>
          </div>
          <Award className="h-7 w-7 text-indigo-600" />
        </div>

        {/* Action widget */}
        <div className="rounded border border-slate-200 bg-white p-3.5 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">
              Suspended Personnel
            </span>
            <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
              {drivers.filter((d) => d.status === "Suspended").length} Drivers
              Blocked
            </span>
          </div>
          <ShieldAlert className="h-7 w-7 text-red-500" />
        </div>
      </div>

      {/* FILTER & TOOLBARS */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        {/* Search & Filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by driver name or license plate ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:flex">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-650"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select
              value={filterCompliance}
              onChange={(e) => setFilterCompliance(e.target.value as any)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-650"
            >
              <option value="All">All Compliance</option>
              <option value="Compliant">Active/Compliant</option>
              <option value="Expired">License Expired</option>
              <option value="ExpiringSoon">Expiring Soon (30d)</option>
            </select>
          </div>
        </div>

        {/* Toolbar action buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {isAuthorizedToEdit ? (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 rounded bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Register Driver</span>
            </button>
          ) : (
            <button
              disabled
              title="Only Safety Officers or Fleet Managers can register drivers"
              className="flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-450 cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>Register (Compliance)</span>
            </button>
          )}
        </div>
      </div>

      {/* DRIVER ROSTER CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic text-xs">
            No driver compliance profiles found matching filter queries.
          </div>
        ) : (
          filteredDrivers.map((driver) => {
            const licenseCheck = checkLicenseStatus(driver.licenseExpiry);
            const isSuspended = driver.status === "Suspended";

            return (
              <div
                key={driver.id}
                className={`rounded border bg-white p-4 flex flex-col justify-between transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md ${
                  licenseCheck === "Expired"
                    ? "border-red-300 shadow-xs shadow-red-500/5"
                    : licenseCheck === "ExpiringSoon"
                      ? "border-amber-300"
                      : "border-slate-200"
                }`}
              >
                {/* Visual Accent for Compliance problems */}
                {licenseCheck === "Expired" && (
                  <div className="absolute right-0 top-0 rounded-bl bg-red-600 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                    Expired Plate
                  </div>
                )}
                {licenseCheck === "ExpiringSoon" && (
                  <div className="absolute right-0 top-0 rounded-bl bg-amber-600 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider animate-pulse">
                    Expiring Soon
                  </div>
                )}

                <div className="space-y-3">
                  {/* Avatar and Name */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 font-bold text-indigo-650 text-xs">
                      {driver.name.charAt(0)}
                      {driver.name.split(" ")[1]?.charAt(0) || ""}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {driver.name}
                      </h4>
                      <span
                        className={`inline-block rounded border px-1.5 py-0.25 text-[8px] font-bold mt-1 uppercase ${getStatusBadgeClass(driver.status)}`}
                      >
                        {driver.status}
                      </span>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        License Number
                      </span>
                      <span className="text-slate-700 font-mono font-bold mt-0.5 block">
                        {driver.licenseNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        Category
                      </span>
                      <span className="text-slate-700 font-medium mt-0.5 block">
                        {driver.licenseCategory}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        Expiration
                      </span>
                      <span
                        className={`font-mono font-bold mt-0.5 block ${
                          licenseCheck === "Expired"
                            ? "text-red-600"
                            : licenseCheck === "ExpiringSoon"
                              ? "text-amber-600"
                              : "text-slate-700"
                        }`}
                      >
                        {driver.licenseExpiry}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        Safety Rating
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`font-mono font-bold block flex items-center gap-1 ${
                            driver.safetyScore >= 90
                              ? "text-emerald-700"
                              : driver.safetyScore >= 70
                                ? "text-amber-600"
                                : "text-red-650"
                          }`}
                        >
                          {driver.safetyScore}/100
                          {driver.safetyScore >= 95 && (
                            <Sparkles className="h-3 w-3 text-yellow-500 shrink-0" />
                          )}
                        </span>
                        <div className="h-1.5 w-8 rounded-full bg-slate-100 overflow-hidden shrink-0 hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              driver.safetyScore >= 90
                                ? "bg-emerald-500"
                                : driver.safetyScore >= 70
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${driver.safetyScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone contact */}
                  <div className="flex items-center gap-1 rounded bg-slate-50 border border-slate-150 px-2 py-1 text-[11px] text-slate-500 font-medium">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{driver.contactNumber || "No phone logged"}</span>
                  </div>
                </div>

                {/* Operations Actions bar (Only managers or safety officers) */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-3">
                  {isAuthorizedToEdit ? (
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        {isSuspended ? (
                          <button
                            onClick={() => handleReinstateDriver(driver)}
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-xs"
                          >
                            <Check className="h-3 w-3" />
                            <span>Unsuspend</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendDriver(driver)}
                            disabled={driver.status === "On Trip"}
                            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-bold transition shadow-xs ${
                              driver.status === "On Trip"
                                ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                            title={
                              driver.status === "On Trip"
                                ? "Cannot suspend driver while on trip"
                                : "Lock credentials / suspend dispatch"
                            }
                          >
                            <ShieldAlert className="h-3 w-3" />
                            <span>Suspend</span>
                          </button>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(driver)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition"
                          title="Edit Profile"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>

                        {isSafetyOfficer && (
                          <button
                            onClick={() => deleteDriver(driver.id)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete profile"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] italic text-slate-500 font-semibold w-full text-center">
                      View Access Only
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {modalMode === "add"
                  ? "Register New Compliance Driver"
                  : "Edit Driver Profile"}
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

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Driver Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* License Number */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    License ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-TX44910"
                    value={dLicense}
                    onChange={(e) => setDLicense(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                {/* License Class */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    License Classification
                  </label>
                  <select
                    value={dCategory}
                    onChange={(e) => setDCategory(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  >
                    <option value="Class A CDL">
                      Class A CDL (Commercial)
                    </option>
                    <option value="Class B CDL">Class B CDL (Heavy/Bus)</option>
                    <option value="Class C CDL">
                      Class C CDL (Specialist)
                    </option>
                    <option value="Class C Standard">
                      Class C Standard (Automobile)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Expiration Date */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    License Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dExpiry}
                    onChange={(e) => setDExpiry(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                {/* Safety Score */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Compliance Safety Score (0-100)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={dSafety}
                    onChange={(e) => setDSafety(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Contact Phone */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 123-4567"
                    value={dContact}
                    onChange={(e) => setDContact(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Duty Status
                  </label>
                  <select
                    value={dStatus}
                    onChange={(e) => setDStatus(e.target.value as DriverStatus)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
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
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                >
                  {modalMode === "add"
                    ? "Confirm Registration"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
