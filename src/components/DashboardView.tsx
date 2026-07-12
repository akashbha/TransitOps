/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { VehicleType, VehicleStatus, Region } from "../types";
import {
  TrendingUp,
  Truck,
  MapPin,
  Wrench,
  Users,
  DollarSign,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  Filter,
  Navigation,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const {
    vehicles,
    drivers,
    trips,
    metrics,
    dispatchTrip,
    completeTrip,
    cancelTrip,
    getVehicleStats,
    currentUser,
  } = useApp();

  const formatINR = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // --- FILTERS ---
  const [selectedType, setSelectedType] = useState<VehicleType | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | "All">(
    "All",
  );
  const [selectedRegion, setSelectedRegion] = useState<Region | "All">("All");

  // Filtered vehicles for dashboard grid
  const filteredVehicles = vehicles.filter((v) => {
    const typeMatch = selectedType === "All" || v.type === selectedType;
    const statusMatch = selectedStatus === "All" || v.status === selectedStatus;
    const regionMatch = selectedRegion === "All" || v.region === selectedRegion;
    return typeMatch && statusMatch && regionMatch;
  });

  // Calculate filtered stats
  const activeFiltered = filteredVehicles.filter(
    (v) => v.status === "On Trip",
  ).length;
  const availableFiltered = filteredVehicles.filter(
    (v) => v.status === "Available",
  ).length;
  const inShopFiltered = filteredVehicles.filter(
    (v) => v.status === "In Shop",
  ).length;

  // Driver/License safety alerts
  const expiredLicenses = drivers.filter((d) => d.licenseExpiry < "2026-07-11");
  const lowSafetyDrivers = drivers.filter(
    (d) => d.safetyScore < 85 && d.status !== "Suspended",
  );

  // Draft Trips that are ready for dispatch
  const pendingDispatchTrips = trips.filter((t) => t.status === "Draft");
  // Dispatched Trips currently active
  const activeDispatchedTrips = trips.filter((t) => t.status === "Dispatched");

  // Completed Trips list
  const completedTrips = trips.filter((t) => t.status === "Completed");

  // Calculate Fleet Revenue, Maintenance and Fuel sums
  const totalFleetRevenue = completedTrips.reduce(
    (sum, t) => sum + (t.revenue || 0),
    0,
  );
  const totalFleetFuelCost = vehicles.reduce(
    (sum, v) => sum + getVehicleStats(v.id).totalFuelCost,
    0,
  );
  const totalFleetMaintCost = vehicles.reduce(
    (sum, v) => sum + getVehicleStats(v.id).totalMaintenanceCost,
    0,
  );
  const totalFleetProfit =
    totalFleetRevenue - (totalFleetFuelCost + totalFleetMaintCost);

  // SVG Chart Dimensions & Data
  // Operational Cost breakdown per Vehicle
  const costChartData = vehicles.slice(0, 5).map((v) => {
    const stats = getVehicleStats(v.id);
    return {
      name: v.registrationNumber,
      fuel: stats.totalFuelCost,
      maint: stats.totalMaintenanceCost,
      total: stats.totalFuelCost + stats.totalMaintenanceCost,
    };
  });

  const maxCost = Math.max(...costChartData.map((d) => d.total), 500);

  // Calculate vehicle counts per region
  const regionCounts = vehicles.reduce(
    (acc, v) => {
      const reg = v.region || "North";
      acc[reg] = (acc[reg] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const regionsList: Region[] = ["North", "West", "East", "South"];
  const maxRegionCount = Math.max(
    ...regionsList.map((r) => regionCounts[r] || 0),
    1,
  );

  // SVG Map Coordinates for logistics visualization (simulated positions in India)
  const mapLocations: Record<string, { x: number; y: number }> = {
    "Mumbai JNPT Port Terminal": { x: 30, y: 70 },
    "Pune Bhosari Industrial Depot": { x: 35, y: 75 },
    "Delhi Okhla Logistics Center": { x: 45, y: 25 },
    "Gurugram CyberCity Hub": { x: 40, y: 28 },
    "Chennai Oragadam Plant": { x: 48, y: 85 },
    "Bangalore Whitefield Terminal": { x: 42, y: 80 },
    "Noida Sector 62 Warehouse": { x: 50, y: 26 },
    "Kanpur Transport Nagar Depot": { x: 60, y: 35 },
    "Kolkata Salt Lake Hub": { x: 80, y: 50 },
    "Guwahati Paltan Bazar Depot": { x: 92, y: 40 },
    "Hyderabad Gachibowli Logistics Hub": { x: 45, y: 68 },
    "Ahmedabad Sanand GIDC": { x: 22, y: 48 },
    "Chandigarh Phase 1 Depot": { x: 42, y: 15 },
    "Jaipur Transport Nagar": { x: 35, y: 32 },
    "Jodhpur GIDC Depot": { x: 25, y: 34 },
    "Mumbai Port Terminal": { x: 28, y: 68 },
    "Chennai Harbour": { x: 50, y: 83 },
  };

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {/* Active Fleet */}
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Truck className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Active Fleet
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900">
            {metrics.activeVehicles}
          </p>
          <span className="text-[10px] text-slate-500">
            Currently dispatched
          </span>
        </div>

        {/* Available */}
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Available
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900">
            {metrics.availableVehicles}
          </p>
          <span className="text-[10px] text-slate-500">Ready for dispatch</span>
        </div>

        {/* In Shop */}
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-rose-600 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Wrench className="h-4 w-4 text-rose-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              In Shop
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900">
            {metrics.vehiclesInMaintenance}
          </p>
          <span className="text-[10px] text-slate-500">Under maintenance</span>
        </div>

        {/* Active Trips */}
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-blue-600 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-1.5 text-slate-500">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Active Trips
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900">
            {metrics.activeTrips}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            In-transit dispatches
          </span>
        </div>

        {/* Pending Trips */}
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-amber-600 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-1.5 text-slate-500">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Pending Trips
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900">
            {metrics.pendingTrips}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            Trips in Draft status
          </span>
        </div>

        {/* Drivers Duty */}
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-purple-600 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Drivers Duty
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900">
            {metrics.driversOnDuty}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            On-trip or Available
          </span>
        </div>

        {/* Fleet Utilization Progress Ring */}
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-pink-600 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <svg className="absolute h-full w-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-slate-100 fill-none"
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-pink-600 fill-none transition-all duration-500"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - metrics.fleetUtilization / 100)}`}
              />
            </svg>
            <span className="text-xs font-black text-slate-950">
              {metrics.fleetUtilization}%
            </span>
          </div>
          <span className="mt-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
            Fleet Util.
          </span>
        </div>
      </div>

      {/* FINANCIAL LEDGER OVERVIEW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 border border-emerald-200 p-2 text-emerald-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Fleet Revenue
            </span>
            <span className="text-lg font-black text-slate-900">
              {formatINR(totalFleetRevenue)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-200 pt-3 sm:border-t-0 sm:pt-0 sm:border-x sm:px-4">
          <div className="rounded-lg bg-rose-100 border border-rose-200 p-2 text-rose-700">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Overhead Cost
            </span>
            <span className="text-lg font-black text-slate-900">
              {formatINR(totalFleetFuelCost + totalFleetMaintCost)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-200 pt-3 sm:border-t-0 sm:pt-0 sm:pl-4">
          <div
            className={`rounded-lg p-2 border ${totalFleetProfit >= 0 ? "bg-indigo-100 border-indigo-200 text-indigo-700" : "bg-rose-100 border-rose-200 text-rose-700"}`}
          >
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Net Fleet Profit
            </span>
            <span
              className={`text-lg font-black ${totalFleetProfit >= 0 ? "text-indigo-650" : "text-rose-650"}`}
            >
              {formatINR(totalFleetProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* COMPLIANCE ALERTS & NOTIFICATIONS */}
      {(expiredLicenses.length > 0 || lowSafetyDrivers.length > 0) && (
        <div className="rounded border border-red-200 bg-red-50 p-3.5 flex gap-3 items-start">
          <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">
              Compliance & Safety Officer Warnings
            </h4>
            <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
              {expiredLicenses.map((d) => (
                <li key={d.id}>
                  Driver{" "}
                  <span className="font-bold text-slate-900">{d.name}</span> has
                  an{" "}
                  <span className="text-red-700 font-semibold">
                    expired license
                  </span>{" "}
                  ({d.licenseExpiry}). Dispatch is blocked.
                </li>
              ))}
              {lowSafetyDrivers.map((d) => (
                <li key={d.id}>
                  Driver{" "}
                  <span className="font-bold text-slate-900">{d.name}</span> has
                  a critical safety score of{" "}
                  <span className="text-amber-800 font-semibold">
                    {d.safetyScore}/100
                  </span>
                  . Schedule extra checkups.
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* INTERACTIVE ASSET FILTERING PANEL */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Live Asset Registry Filter
            </h3>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {filteredVehicles.length} / {vehicles.length} Assets
            </span>
          </div>

          {/* Selector filters */}
          <div className="grid grid-cols-3 gap-1.5 sm:flex">
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Truck">Trucks</option>
                <option value="Van">Vans</option>
                <option value="Box Truck">Box Trucks</option>
              </select>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as any)}
                className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
              >
                <option value="All">All Regions</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Micro-Stats for Filtered Assets */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2 text-center">
            <span className="text-[9px] text-blue-600 block font-bold uppercase tracking-wider">
              Filtered On Trip
            </span>
            <span className="text-sm font-black text-blue-900">
              {activeFiltered}
            </span>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2 text-center">
            <span className="text-[9px] text-emerald-600 block font-bold uppercase tracking-wider">
              Filtered Ready
            </span>
            <span className="text-sm font-black text-emerald-900">
              {availableFiltered}
            </span>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2 text-center">
            <span className="text-[9px] text-amber-600 block font-bold uppercase tracking-wider">
              Filtered In Shop
            </span>
            <span className="text-sm font-black text-amber-900">
              {inShopFiltered}
            </span>
          </div>
        </div>

        {/* Vehicles Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
              No assets match the selected filters.
            </div>
          ) : (
            filteredVehicles.map((v) => {
              const stats = getVehicleStats(v.id);
              const activeTrip = trips.find(
                (t) => t.vehicleId === v.id && t.status === "Dispatched",
              );

              // Real-time capacity utilization percentage
              let utilizationPercent = 0;
              if (v.status === "On Trip" && activeTrip) {
                utilizationPercent = Math.round(
                  (activeTrip.cargoWeight / v.maxCapacity) * 100,
                );
              }

              // Determine styling based on status
              let statusBadgeClass =
                "bg-slate-100 text-slate-700 border-slate-200";
              let statusDotClass = "bg-slate-400";

              if (v.status === "Available") {
                statusBadgeClass =
                  "bg-emerald-50 text-emerald-700 border-emerald-200";
                statusDotClass = "bg-emerald-500";
              } else if (v.status === "On Trip") {
                statusBadgeClass =
                  "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
                statusDotClass = "bg-blue-500";
              } else if (v.status === "In Shop") {
                statusBadgeClass =
                  "bg-amber-50 text-amber-700 border-amber-200";
                statusDotClass = "bg-amber-500";
              } else if (v.status === "Retired") {
                statusBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                statusDotClass = "bg-rose-500";
              }

              const totalOverhead =
                stats.totalFuelCost + stats.totalMaintenanceCost;

              return (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs hover:shadow-md hover:bg-white hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Reg & Status */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {v.registrationNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDotClass}`}
                        />
                        {v.status}
                      </span>
                    </div>

                    {/* Name & Region */}
                    <h4
                      className="text-xs font-bold text-slate-900 truncate"
                      title={v.name}
                    >
                      {v.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-medium mb-3">
                      {v.type} • {v.region} Region
                    </span>

                    {/* Real-time Capacity Utilization */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>Capacity Util.</span>
                        <span className="font-mono font-bold text-slate-850">
                          {v.status === "On Trip"
                            ? `${utilizationPercent}%`
                            : v.status === "In Shop"
                              ? "Under Service"
                              : "0% (Idle)"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200/60 overflow-hidden">
                        <div
                          style={{
                            width: `${v.status === "On Trip" ? utilizationPercent : 0}%`,
                          }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            utilizationPercent > 90
                              ? "bg-amber-500"
                              : "bg-indigo-600"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Operational Stats Footer */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-[10px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">
                        Odometer
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {v.odometer.toLocaleString("en-IN")} km
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">
                        Overhead
                      </span>
                      <span className="font-mono font-bold text-indigo-600">
                        {formatINR(totalOverhead)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* LIVE INTERACTIVE LOGISTICS MAP & VISUAL ANALYTICS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Logistics Live map */}
        <div className="rounded border border-slate-200 bg-white p-4 lg:col-span-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-indigo-600 rotate-45" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Fleet Logistics Route Radar
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <span className="h-2 w-2 rounded-full bg-slate-200" />
                Hub
              </span>
              <span className="flex items-center gap-1.5 text-indigo-650 animate-pulse font-bold">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Active Dispatch ({activeDispatchedTrips.length})
              </span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative rounded border border-slate-200 bg-slate-50/60 p-1 select-none overflow-hidden h-[240px]">
            {/* Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-slate-200)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-slate-200)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-60" />

            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Draw routes for active dispatches */}
              {activeDispatchedTrips.map((trip) => {
                const srcCoord = mapLocations[trip.source];
                const destCoord = mapLocations[trip.destination];

                if (!srcCoord || !destCoord) return null;

                return (
                  <g key={trip.id}>
                    {/* Pulsing route path */}
                    <line
                      x1={srcCoord.x}
                      y1={srcCoord.y}
                      x2={destCoord.x}
                      y2={destCoord.y}
                      className="stroke-indigo-100 stroke-[1.5]"
                    />
                    <line
                      x1={srcCoord.x}
                      y1={srcCoord.y}
                      x2={destCoord.x}
                      y2={destCoord.y}
                      className="stroke-indigo-500 stroke-[0.75] stroke-dasharray-[2,2] animate-marquee"
                    />

                    {/* Animated moving vehicle dot */}
                    <circle r="1" fill="#4f46e5" className="animate-pulse-slow">
                      <animateMotion
                        dur="8s"
                        repeatCount="indefinite"
                        path={`M ${srcCoord.x} ${srcCoord.y} L ${destCoord.x} ${destCoord.y}`}
                      />
                    </circle>
                  </g>
                );
              })}

              {/* Draw all locations as nodes */}
              {Object.entries(mapLocations).map(([name, coord]) => {
                const isActiveHub = activeDispatchedTrips.some(
                  (t) => t.source === name || t.destination === name,
                );

                return (
                  <g key={name}>
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isActiveHub ? "1.8" : "1.2"}
                      className={`${
                        isActiveHub
                          ? "fill-indigo-600 stroke-indigo-100 stroke-[1.5]"
                          : "fill-slate-300 stroke-slate-100"
                      }`}
                    />
                    <text
                      x={coord.x}
                      y={coord.y - 2.5}
                      className="fill-slate-500 font-sans text-[2.2px] font-bold"
                      textAnchor="middle"
                    >
                      {name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Float details of active trips */}
            {activeDispatchedTrips.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 rounded border border-slate-200 bg-white/95 p-2 backdrop-blur-xs max-h-[80px] overflow-y-auto space-y-1 shadow-sm">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                  Real-time GPS Tracking
                </span>
                {activeDispatchedTrips.map((trip) => {
                  const v = vehicles.find((item) => item.id === trip.vehicleId);
                  const d = drivers.find((item) => item.id === trip.driverId);
                  return (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between text-[9px] text-slate-650"
                    >
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">
                        {v?.name} • {d?.name}
                      </span>
                      <span className="text-slate-500 font-semibold truncate max-w-[200px]">
                        {trip.source} → {trip.destination}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Operational Cost Charts (Financial overview) */}
        <div className="rounded border border-slate-200 bg-white p-4 lg:col-span-3 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Expense Profile
                </h3>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mb-3.5">
              Breakdown of total accrued fuel and maintenance costs relative to
              maximum fleet totals.
            </p>

            {/* Custom SVG Bar Chart */}
            <div className="h-[180px] w-full flex items-end justify-between px-2 pt-4 relative">
              {/* Background gridlines */}
              <div className="absolute inset-x-0 bottom-0 top-4 flex flex-col justify-between pointer-events-none select-none">
                <div className="border-t border-slate-100 w-full" />
                <div className="border-t border-slate-100 w-full" />
                <div className="border-t border-slate-100 w-full" />
              </div>

              {costChartData.length === 0 ? (
                <div className="w-full text-center py-12 text-slate-600 italic text-xs">
                  No maintenance or fuel data currently logged.
                </div>
              ) : (
                costChartData.map((data, index) => {
                  const fuelPercent = (data.fuel / maxCost) * 100;
                  const maintPercent = (data.maint / maxCost) * 100;

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1 group relative mx-1"
                    >
                      {/* Bar columns */}
                      <div className="w-6 sm:w-8 flex flex-col justify-end bg-slate-50 rounded-t h-[130px] overflow-hidden relative border border-slate-150">
                        {/* Maintenance segment (on top/bottom) */}
                        <div
                          style={{ height: `${maintPercent}%` }}
                          className="bg-red-500 w-full hover:brightness-110 transition-all cursor-pointer"
                          title={`Maint: ₹${data.maint.toFixed(0)}`}
                        />
                        {/* Fuel segment */}
                        <div
                          style={{ height: `${fuelPercent}%` }}
                          className="bg-amber-500 w-full hover:brightness-110 transition-all cursor-pointer"
                          title={`Fuel: ₹${data.fuel.toFixed(0)}`}
                        />
                      </div>

                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-1 bg-slate-900 border border-slate-950 text-[10px] p-2 rounded shadow-xl hidden group-hover:block z-20 text-slate-300 pointer-events-none whitespace-nowrap">
                        <p className="font-bold text-white text-center mb-1">
                          {data.name}
                        </p>
                        <p className="flex justify-between gap-4">
                          <span>Fuel:</span>{" "}
                          <span className="font-mono text-amber-400 font-bold">
                            {formatINR(data.fuel)}
                          </span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span>Maint:</span>{" "}
                          <span className="font-mono text-red-400 font-bold">
                            {formatINR(data.maint)}
                          </span>
                        </p>
                        <p className="border-t border-slate-800 mt-1 pt-1 flex justify-between gap-4 font-bold text-white">
                          <span>Total:</span>{" "}
                          <span>{formatINR(data.total)}</span>
                        </p>
                      </div>

                      <span className="text-[9px] font-mono font-semibold text-slate-500 mt-2 rotate-45 sm:rotate-0 origin-center truncate w-full text-center">
                        {data.name.split("-")[1] || data.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mini-metrics legend */}
          <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-100 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-amber-500" />
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                Fuel
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-red-500" />
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                Maint
              </span>
            </div>
          </div>
        </div>

        {/* Regional Fleet Distribution */}
        <div className="rounded border border-slate-200 bg-white p-4 lg:col-span-3 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Regional Fleet
                </h3>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mb-4">
              Geographic distribution of assets across operating zones.
            </p>

            <div className="space-y-4">
              {regionsList.map((region) => {
                const count = regionCounts[region] || 0;
                const percent = (count / maxRegionCount) * 100;

                // Color mapping
                const barColor =
                  region === "North"
                    ? "bg-indigo-600"
                    : region === "West"
                      ? "bg-amber-500"
                      : region === "East"
                        ? "bg-emerald-500"
                        : "bg-purple-600";

                return (
                  <div key={region} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            region === "North"
                              ? "bg-indigo-600"
                              : region === "West"
                                ? "bg-amber-500"
                                : region === "East"
                                  ? "bg-emerald-500"
                                  : "bg-purple-600"
                          }`}
                        />
                        {region} Zone
                      </span>
                      <span className="font-mono text-slate-900 bg-slate-50 border border-slate-150 rounded px-1.5 py-0.25 text-[10px]">
                        {count} asset{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-r ${barColor} transition-all duration-300`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3.5 mt-4 text-[10px] text-slate-400 text-center italic">
            Active GPS registry monitoring
          </div>
        </div>
      </div>

      {/* TRIP DISPATCH CONTROLLER SHORTCUT PANEL */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Dispatches Waiting For Clearance ({pendingDispatchTrips.length})
            </h3>
          </div>
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full animate-pulse">
            Action Required
          </span>
        </div>

        {pendingDispatchTrips.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic">
            All created drafts are dispatched or completed. Create a new trip in
            the Trip Management section.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingDispatchTrips.map((trip) => {
              const v = vehicles.find((item) => item.id === trip.vehicleId);
              const d = drivers.find((item) => item.id === trip.driverId);
              const isRoleCapable =
                currentUser?.role === "Fleet Manager" ||
                currentUser?.role === "Dispatcher";
              const capacityPercent = v
                ? Math.round((trip.cargoWeight / v.maxCapacity) * 100)
                : 0;

              return (
                <div
                  key={trip.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-white hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Status & Price */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Draft Clearance
                      </span>
                      <span className="font-mono text-xs font-black text-emerald-650">
                        {trip.revenue ? formatINR(trip.revenue) : "—"}
                      </span>
                    </div>

                    {/* Route Info */}
                    <div className="flex items-center gap-2 bg-white border border-slate-100 p-2.5 rounded-lg">
                      <div className="text-[11px] font-bold text-slate-800 truncate flex-1">
                        {trip.source}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div className="text-[11px] font-bold text-slate-800 truncate flex-1 text-right">
                        {trip.destination}
                      </div>
                    </div>

                    {/* Cargo Weight & Distance info */}
                    <div className="grid grid-cols-2 gap-2.5 text-[10px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">
                          Cargo & Capacity
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {trip.cargoWeight.toLocaleString()} kg
                        </span>
                        {v && (
                          <span className="text-[9px] text-indigo-650 block font-semibold">
                            {capacityPercent}% of Cap ({v.maxCapacity} kg)
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">
                          Distance
                        </span>
                        <span className="font-mono font-bold text-slate-700">
                          {trip.plannedDistance.toLocaleString()} km
                        </span>
                      </div>
                    </div>

                    {/* Assignment Details */}
                    <div className="border-t border-slate-200/60 pt-2.5 text-[10px] space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          Assigned Asset:
                        </span>
                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                          {v ? (
                            v.name
                          ) : (
                            <span className="text-red-500 italic">None</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          Driver Duty:
                        </span>
                        <span className="font-semibold text-slate-700 truncate max-w-[150px] flex items-center gap-1">
                          {d ? (
                            <>
                              {d.name}
                              <span
                                className={`text-[8px] px-1 rounded font-bold ${d.safetyScore >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                              >
                                ({d.safetyScore}/100)
                              </span>
                            </>
                          ) : (
                            <span className="text-red-500 italic">None</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Authorize Action Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    {isRoleCapable ? (
                      <button
                        onClick={() => dispatchTrip(trip.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white transition shadow-xs hover:shadow-md cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Authorize Dispatch</span>
                      </button>
                    ) : (
                      <span className="text-[10px] italic text-slate-400 block text-center w-full bg-slate-100 py-1.5 rounded-lg">
                        View Only (Fleet Manager / Dispatcher required)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
