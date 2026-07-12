/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Vehicle, VehicleType, VehicleStatus, Region } from "../types";
import { exportToCSV } from "../utils/csvExport";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Check,
  X,
  DollarSign,
  Activity,
  MapPin,
  ChevronRight,
  Gauge,
} from "lucide-react";

export const VehiclesView: React.FC = () => {
  const {
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleStats,
    currentUser,
  } = useApp();

  const isManager = currentUser?.role === "Fleet Manager";

  // --- COMPONENT STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<VehicleType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | "All">(
    "All",
  );
  const [filterRegion, setFilterRegion] = useState<Region | "All">("All");
  const [sortBy, setSortBy] = useState<"reg" | "name" | "odometer" | "roi">(
    "name",
  );

  // Form states for Add / Edit Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const [regNum, setRegNum] = useState("");
  const [vName, setVName] = useState("");
  const [vType, setVType] = useState<VehicleType>("Van");
  const [maxCap, setMaxCap] = useState(1000);
  const [vOdometer, setVOdometer] = useState(10000);
  const [vCost, setVCost] = useState(30000);
  const [vStatus, setVStatus] = useState<VehicleStatus>("Available");
  const [vRegion, setVRegion] = useState<Region>("North");

  // Selected vehicle for ROI Ledger Modal
  const [inspectedVehicle, setInspectedVehicle] = useState<Vehicle | null>(
    null,
  );

  // --- FILTER & SORT LOGIC ---
  const filteredVehicles = vehicles
    .filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "All" || v.type === filterType;
      const matchesStatus = filterStatus === "All" || v.status === filterStatus;
      const matchesRegion = filterRegion === "All" || v.region === filterRegion;

      return matchesSearch && matchesType && matchesStatus && matchesRegion;
    })
    .sort((a, b) => {
      if (sortBy === "reg")
        return a.registrationNumber.localeCompare(b.registrationNumber);
      if (sortBy === "odometer") return b.odometer - a.odometer;
      if (sortBy === "roi") {
        return getVehicleStats(b.id).roi - getVehicleStats(a.id).roi;
      }
      return a.name.localeCompare(b.name);
    });

  // --- CRUD DISPATCHERS ---
  const openAddModal = () => {
    setModalMode("add");
    setRegNum("");
    setVName("");
    setVType("Van");
    setMaxCap(1000);
    setVOdometer(10000);
    setVCost(30000);
    setVStatus("Available");
    setVRegion("North");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setModalMode("edit");
    setEditingId(vehicle.id);
    setRegNum(vehicle.registrationNumber);
    setVName(vehicle.name);
    setVType(vehicle.type);
    setMaxCap(vehicle.maxCapacity);
    setVOdometer(vehicle.odometer);
    setVCost(vehicle.acquisitionCost);
    setVStatus(vehicle.status);
    setVRegion(vehicle.region);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!regNum.trim() || !vName.trim()) {
      setFormError("Please fill out all required fields.");
      return;
    }

    const vehicleData = {
      registrationNumber: regNum.trim(),
      name: vName.trim(),
      type: vType,
      maxCapacity: Number(maxCap),
      odometer: Number(vOdometer),
      acquisitionCost: Number(vCost),
      status: vStatus,
      region: vRegion,
    };

    if (modalMode === "add") {
      const res = await addVehicle(vehicleData);
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.error || "Failed to add vehicle.");
      }
    } else if (modalMode === "edit" && editingId) {
      const res = await updateVehicle({
        ...vehicleData,
        id: editingId,
      });
      if (res.success) {
        setIsModalOpen(false);
      } else {
        setFormError(res.error || "Failed to update vehicle.");
      }
    }
  };

  // --- EXPORT TO CSV ---
  const handleCSVExport = () => {
    const exportData = vehicles.map((v) => {
      const stats = getVehicleStats(v.id);
      return {
        "Reg Number": v.registrationNumber,
        "Name/Model": v.name,
        Type: v.type,
        "Max Capacity (kg)": v.maxCapacity,
        "Odometer (km)": v.odometer,
        "Acquisition Cost (INR)": v.acquisitionCost,
        Status: v.status,
        Region: v.region,
        "Fuel Cost (INR)": stats.totalFuelCost,
        "Maint Cost (INR)": stats.totalMaintenanceCost,
        "Revenue Generated (INR)": stats.totalRevenue,
        "ROI (%)": (stats.roi * 100).toFixed(1) + "%",
        "Fuel Efficiency (km/L)": stats.fuelEfficiency.toFixed(1),
      };
    });

    exportToCSV(
      exportData,
      `TransitOps_Vehicles_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const getStatusBadgeClass = (status: VehicleStatus) => {
    switch (status) {
      case "Available":
        return "bg-emerald-50 text-emerald-700 border-emerald-250";
      case "On Trip":
        return "bg-indigo-50 text-indigo-700 border-indigo-250";
      case "In Shop":
        return "bg-red-50 text-red-700 border-red-250";
      case "Retired":
        return "bg-slate-50 text-slate-700 border-slate-250";
      default:
        return "bg-slate-50 text-slate-750 border-slate-250";
    }
  };

  return (
    <div className="space-y-4">
      {/* TOOLBAR CONTROLS */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Search & Filter bar */}
        <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by model or reg plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:flex">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="All">All Types</option>
              <option value="Van">Vans</option>
              <option value="Truck">Trucks</option>
              <option value="Box Truck">Box Trucks</option>
              <option value="Sedan">Sedans</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value as any)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="All">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* CSV Download Button */}
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Asset Button (Restricted to Manager) */}
          {isManager ? (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register Vehicle</span>
            </button>
          ) : (
            <button
              disabled
              title="Only Fleet Managers can register vehicles"
              className="flex items-center gap-1.5 rounded bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-400 cursor-not-allowed border border-slate-200"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register (Manager)</span>
            </button>
          )}
        </div>
      </div>

      {/* SORT CONTROLS CARD */}
      <div className="flex items-center gap-3 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
        <span>Sort By:</span>
        <button
          onClick={() => setSortBy("name")}
          className={`font-semibold hover:text-slate-900 ${sortBy === "name" ? "text-indigo-600 font-bold" : ""}`}
        >
          Model Name
        </button>
        <span className="text-slate-200">•</span>
        <button
          onClick={() => setSortBy("reg")}
          className={`font-semibold hover:text-slate-900 ${sortBy === "reg" ? "text-indigo-600 font-bold" : ""}`}
        >
          Registration ID
        </button>
        <span className="text-slate-200">•</span>
        <button
          onClick={() => setSortBy("odometer")}
          className={`font-semibold hover:text-slate-900 ${sortBy === "odometer" ? "text-indigo-600 font-bold" : ""}`}
        >
          Odometer (Highest)
        </button>
        <span className="text-slate-200">•</span>
        <button
          onClick={() => setSortBy("roi")}
          className={`font-semibold hover:text-slate-900 ${sortBy === "roi" ? "text-indigo-600 font-bold" : ""}`}
        >
          Vehicle ROI (Highest)
        </button>
      </div>

      {/* ASSETS TABLE/GRID VIEW */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filteredVehicles.length === 0 ? (
          <div className="py-16 text-center text-slate-400 italic text-xs">
            No fleet vehicles found matching active queries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-2.5">Registration & Model</th>
                  <th className="px-4 py-2.5">Type & Load Capacity</th>
                  <th className="px-4 py-2.5">Region & Odometer</th>
                  <th className="px-4 py-2.5">Operational Status</th>
                  <th className="px-4 py-2.5">Acquisition Cost</th>
                  <th className="px-4 py-2.5 text-center">Financials (ROI)</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((vehicle) => {
                  const stats = getVehicleStats(vehicle.id);
                  const roiPercent = stats.roi * 100;
                  const totalOpCost =
                    stats.totalFuelCost + stats.totalMaintenanceCost;

                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-50/50 group">
                      {/* Name and Reg Plate */}
                      <td className="px-5 py-3">
                        <div>
                          <span className="font-mono font-bold text-indigo-650 block tracking-wide text-xs">
                            {vehicle.registrationNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-950 mt-0.5 block">
                            {vehicle.name}
                          </span>
                        </div>
                      </td>

                      {/* Type and capacity */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-semibold text-slate-700 block">
                            {vehicle.type}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Max Cargo: {vehicle.maxCapacity.toLocaleString()} kg
                          </span>
                        </div>
                      </td>

                      {/* Region and Odometer */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-slate-700 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {vehicle.region} Region
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-1 flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {vehicle.odometer.toLocaleString()} km
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(vehicle.status)}`}
                        >
                          {vehicle.status}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 font-mono text-slate-900 font-bold">
                        ₹{vehicle.acquisitionCost.toLocaleString()}
                      </td>

                      {/* Financial performance ROI Ledger */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center justify-center">
                          <button
                            onClick={() => setInspectedVehicle(vehicle)}
                            className="text-[11px] font-bold text-slate-700 hover:text-indigo-650 hover:bg-slate-50 flex items-center gap-1 rounded bg-white border border-slate-200 px-2.5 py-1 hover:border-indigo-500/50 transition shadow-xs"
                          >
                            <TrendingUp
                              className={`h-3 w-3 ${roiPercent >= 0 ? "text-emerald-600" : "text-red-655"}`}
                            />
                            <span className="font-mono text-[10px]">
                              ROI:{" "}
                              <span
                                className={
                                  roiPercent >= 0
                                    ? "text-emerald-600 font-bold"
                                    : "text-red-600 font-bold"
                                }
                              >
                                {roiPercent >= 0 ? "+" : ""}
                                {roiPercent.toFixed(1)}%
                              </span>
                            </span>
                            <ChevronRight className="h-3 w-3 text-slate-400" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isManager ? (
                            <>
                              <button
                                onClick={() => openEditModal(vehicle)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
                                title="Edit specs"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteVehicle(vehicle.id)}
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-650 transition"
                                title="Delete from registry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] italic text-slate-450 font-semibold uppercase tracking-wider">
                              Read Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {modalMode === "add"
                  ? "Register New Fleet Asset"
                  : "Modify Asset Specifications"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded text-slate-450 hover:text-slate-700 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {formError && (
              <div className="rounded border border-red-200 bg-red-50/50 p-2 mb-3 text-xs text-red-650 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Registration Number */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Registration Plate *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TX-492-Z"
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                {/* Model Name */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Vehicle Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ford Cargo Van"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Vehicle Type */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Vehicle Type
                  </label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value as VehicleType)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Sedan">Sedan</option>
                  </select>
                </div>

                {/* Max Load Capacity */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Max Capacity (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={maxCap}
                    onChange={(e) => setMaxCap(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Odometer */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Current Odometer (km)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={vOdometer}
                    onChange={(e) => setVOdometer(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                {/* Acquisition Cost */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Acquisition Cost (INR)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={vCost}
                    onChange={(e) => setVCost(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Operational Status
                  </label>
                  <select
                    value={vStatus}
                    onChange={(e) =>
                      setVStatus(e.target.value as VehicleStatus)
                    }
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                {/* Region */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Operational Region
                  </label>
                  <select
                    value={vRegion}
                    onChange={(e) => setVRegion(e.target.value as Region)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
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
                    : "Save Modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAIL ROI LEDGER MODAL --- */}
      {inspectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-indigo-650 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Vehicle Performance Ledger
                </h3>
              </div>
              <button
                onClick={() => setInspectedVehicle(null)}
                className="rounded text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Ledger content */}
            <div className="space-y-4">
              {/* Asset Identity Card */}
              <div className="rounded bg-slate-50 border border-slate-150 p-3.5">
                <p className="font-mono text-[10px] font-bold text-indigo-650 uppercase tracking-wider">
                  {inspectedVehicle.registrationNumber}
                </p>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {inspectedVehicle.name}
                </h4>
                <div className="grid grid-cols-2 gap-3 mt-2.5 pt-2.5 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] block">
                      Asset Value (Acquisition):
                    </span>
                    <span className="text-slate-800 font-mono font-bold">
                      ₹{inspectedVehicle.acquisitionCost.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] block">
                      Total Odometer:
                    </span>
                    <span className="text-slate-800 font-mono font-bold">
                      {inspectedVehicle.odometer.toLocaleString()} km
                    </span>
                  </div>
                </div>
              </div>

              {/* ROI Formulas */}
              <div className="space-y-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Formula Verification
                </h5>

                {/* Visual calculation box */}
                <div className="rounded border border-slate-150 bg-slate-50 p-3.5 font-mono text-xs space-y-2 text-slate-700">
                  <div className="flex justify-between items-center text-slate-450">
                    <span>Acquisition Cost (A)</span>
                    <span className="text-slate-900 font-bold">
                      ₹{inspectedVehicle.acquisitionCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-650 font-semibold">
                    <span>Total Trip Revenue (R)</span>
                    <span>
                      +₹
                      {getVehicleStats(
                        inspectedVehicle.id,
                      ).totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-600 font-semibold">
                    <span>Total Fuel Expenses (F)</span>
                    <span>
                      -₹
                      {getVehicleStats(
                        inspectedVehicle.id,
                      ).totalFuelCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-600 font-semibold">
                    <span>Total Maintenance Costs (M)</span>
                    <span>
                      -₹
                      {getVehicleStats(
                        inspectedVehicle.id,
                      ).totalMaintenanceCost.toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center text-slate-800">
                    <span>Net Profit (R - M - F)</span>
                    <span className="font-extrabold text-slate-950">
                      ₹
                      {(
                        getVehicleStats(inspectedVehicle.id).totalRevenue -
                        (getVehicleStats(inspectedVehicle.id)
                          .totalMaintenanceCost +
                          getVehicleStats(inspectedVehicle.id).totalFuelCost)
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-indigo-50 rounded border border-indigo-150 p-2 mt-2 text-center text-indigo-750">
                    <span className="block text-[9px] uppercase font-bold text-indigo-600">
                      Calculated Return On Investment (ROI)
                    </span>
                    <span className="text-base font-extrabold text-indigo-700">
                      {(
                        ((getVehicleStats(inspectedVehicle.id).totalRevenue -
                          (getVehicleStats(inspectedVehicle.id)
                            .totalMaintenanceCost +
                            getVehicleStats(inspectedVehicle.id)
                              .totalFuelCost)) /
                          inspectedVehicle.acquisitionCost) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-slate-150 bg-slate-50 p-2.5 text-center">
                    <span className="text-slate-450 block text-[9px] uppercase font-bold">
                      Fuel Efficiency
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">
                      {getVehicleStats(
                        inspectedVehicle.id,
                      ).fuelEfficiency.toFixed(2)}{" "}
                      km/L
                    </span>
                  </div>
                  <div className="rounded border border-slate-150 bg-slate-50 p-2.5 text-center">
                    <span className="text-slate-450 block text-[9px] uppercase font-bold">
                      Total Liters Logged
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">
                      {getVehicleStats(
                        inspectedVehicle.id,
                      ).totalLiters.toLocaleString()}{" "}
                      L
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setInspectedVehicle(null)}
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                >
                  Dismiss Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
