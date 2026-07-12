/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp, TODAY_DATE } from "../context/AppContext";
import { Trip, TripStatus } from "../types";
import {
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Navigation,
  Weight,
  Sparkles,
  Info,
  Clock,
  Gauge,
  DollarSign,
  Fuel,
} from "lucide-react";

export const TripsView: React.FC = () => {
  const {
    trips,
    vehicles,
    drivers,
    expenses,
    createTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
    currentUser,
  } = useApp();

  const isCapableRole =
    currentUser?.role === "Fleet Manager" || currentUser?.role === "Dispatcher";

  // --- STATE ---
  const [activeSubTab, setActiveSubTab] = useState<TripStatus>("Dispatched");

  // Trip Draft Modal
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [tSource, setTSource] = useState("");
  const [tDestination, setTDestination] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [tCargoWeight, setTCargoWeight] = useState(500);
  const [tDistance, setTDistance] = useState(250);
  const [tRevenue, setTRevenue] = useState(600);

  // Complete Trip Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingTripId, setCompletingTripId] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState("");
  const [finalOdo, setFinalOdo] = useState(0);
  const [fuelUsed, setFuelUsed] = useState(0);
  const [compRevenue, setCompRevenue] = useState(0);

  // --- DERIVE LISTS FOR DROPDOWNS ENFORCING RULES ---
  // "Retired or In Shop vehicles must never appear in dispatch selection"
  // "A vehicle already marked On Trip cannot be assigned to another trip"
  // This leaves ONLY 'Available' vehicles for selection!
  const selectableVehicles = vehicles.filter((v) => v.status === "Available");

  // "Drivers with expired licenses or Suspended status cannot be assigned to trips."
  // "A driver already marked On Trip cannot be assigned to another trip."
  // This leaves ONLY 'Available' drivers, whose license is not expired!
  const selectableDrivers = drivers.filter(
    (d) => d.status === "Available" && d.licenseExpiry >= TODAY_DATE,
  );

  // Filter trips for grid
  const subTabTrips = trips.filter((t) => t.status === activeSubTab);

  // --- HANDLERS ---
  const handleOpenDraftModal = () => {
    setTSource("");
    setTDestination("");
    setSelectedVehicleId(selectableVehicles[0]?.id || "");
    setSelectedDriverId(selectableDrivers[0]?.id || "");
    setTCargoWeight(200);
    setTDistance(150);
    setTRevenue(500);
    setFormError("");
    setIsDraftModalOpen(true);
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (
      !tSource.trim() ||
      !tDestination.trim() ||
      !selectedVehicleId ||
      !selectedDriverId
    ) {
      setFormError("Please complete all form inputs.");
      return;
    }

    const res = await createTrip({
      source: tSource.trim(),
      destination: tDestination.trim(),
      vehicleId: selectedVehicleId,
      driverId: selectedDriverId,
      cargoWeight: Number(tCargoWeight),
      plannedDistance: Number(tDistance),
      revenue: Number(tRevenue),
    });

    if (res.success) {
      setIsDraftModalOpen(false);
      setActiveSubTab("Draft"); // Auto redirect to draft subtab to see it!
    } else {
      setFormError(res.error || "Trip validation failed.");
    }
  };

  const handleOpenCompleteModal = (trip: Trip) => {
    const v = vehicles.find((item) => item.id === trip.vehicleId);
    setCompletingTripId(trip.id);
    setFinalOdo((v?.odometer || 0) + trip.plannedDistance); // Auto prefill reasonable odometer update
    setFuelUsed(Math.round(trip.plannedDistance * 0.12)); // Auto prefill estimate (12L per 100km)
    setCompRevenue(trip.revenue || 500);
    setCompleteError("");
    setIsCompleteModalOpen(true);
  };

  const handleCompleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteError("");

    if (!completingTripId) return;

    const res = await completeTrip(
      completingTripId,
      Number(finalOdo),
      Number(fuelUsed),
      Number(compRevenue),
    );

    if (res.success) {
      setIsCompleteModalOpen(false);
      setActiveSubTab("Completed"); // Redirect to finished logs
    } else {
      setCompleteError(res.error || "Failed to complete trip.");
    }
  };

  return (
    <div className="space-y-4">
      {/* SUB TABS NAVIGATION */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-150 pb-2.5">
        <div className="flex gap-1.5 flex-wrap">
          {(
            ["Dispatched", "Draft", "Completed", "Cancelled"] as TripStatus[]
          ).map((tab) => {
            const count = trips.filter((t) => t.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition relative flex items-center gap-1.5 ${
                  activeSubTab === tab
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>
                  {tab === "Dispatched"
                    ? "Active Transit"
                    : tab === "Draft"
                      ? "Draft Board"
                      : tab}
                </span>
                <span
                  className={`text-[9px] rounded-full px-1.5 py-0.25 font-bold ${activeSubTab === tab ? "bg-indigo-700 text-indigo-100" : "bg-slate-100 text-slate-500"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Trip (Only available to Driver role under strict RBAC) */}
        {currentUser?.role === "Driver" ? (
          <button
            onClick={handleOpenDraftModal}
            className="flex items-center gap-1 rounded bg-indigo-600 px-3.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Dispatch Draft</span>
          </button>
        ) : (
          <button
            disabled
            title="Only Drivers can create or schedule new trips"
            className="flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-400 cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Create Draft (Driver Only)</span>
          </button>
        )}
      </div>

      {/* CORE BUSINESS RULES HELP SUMMARY CARD */}
      {activeSubTab === "Dispatched" && (
        <div className="rounded border border-indigo-200 bg-indigo-50 p-3 flex gap-2.5 text-xs text-indigo-800">
          <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold text-indigo-900">
              Validation Notice:
            </span>{" "}
            Dispatching a trip automatically transitions the selected vehicle
            and driver statuses to{" "}
            <span className="text-indigo-800 font-bold">"On Trip"</span>,
            removing them from subsequent schedulers. Completing or cancelling
            the trip automatically restores them back to{" "}
            <span className="text-emerald-700 font-bold">"Available"</span>.
          </p>
        </div>
      )}

      {/* TRIPS RENDER CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subTabTrips.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 italic text-xs border border-dashed border-slate-200 rounded">
            No logged trips found in "{activeSubTab}" state.
          </div>
        ) : (
          subTabTrips.map((trip) => {
            const v = vehicles.find((item) => item.id === trip.vehicleId);
            const d = drivers.find((item) => item.id === trip.driverId);

            // Calculate per-trip actual expenses and ROI
            const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
            const totalTripCost = tripExpenses.reduce(
              (acc, curr) => acc + curr.amount,
              0,
            );
            const tripRevenue = trip.revenue || 0;
            const tripRoi =
              totalTripCost > 0
                ? ((tripRevenue - totalTripCost) / totalTripCost) * 100
                : 0;

            return (
              <div
                key={trip.id}
                className="rounded border border-slate-200 bg-white p-4 flex flex-col justify-between hover:shadow-md transition shadow-xs"
              >
                <div className="space-y-3">
                  {/* Route Title */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-indigo-600 rotate-45" />
                      <span className="text-xs font-bold text-slate-900">
                        {trip.source} → {trip.destination}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-450 font-bold">
                      ID: {trip.id}
                    </span>
                  </div>

                  {/* Visual Timeline route */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-50 border border-slate-150">
                    <div className="text-center flex-1">
                      <span className="text-[8px] text-slate-450 uppercase tracking-wider block font-bold">
                        Departure Hub
                      </span>
                      <span className="text-xs font-bold text-slate-700 mt-0.5 truncate block max-w-[120px] mx-auto">
                        {trip.source}
                      </span>
                    </div>
                    <div className="flex flex-col items-center flex-0.5 px-1">
                      <span className="font-mono text-[9px] font-extrabold text-indigo-650">
                        {trip.plannedDistance} km
                      </span>
                      <div className="w-full border-t border-dashed border-indigo-200 my-1 relative">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 absolute -top-0.75 left-1/2 -translate-x-1/2 animate-ping" />
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <span className="text-[8px] text-slate-450 uppercase tracking-wider block font-bold">
                        Arrival Depot
                      </span>
                      <span className="text-xs font-bold text-slate-700 mt-0.5 truncate block max-w-[120px] mx-auto">
                        {trip.destination}
                      </span>
                    </div>
                  </div>

                  {/* Asset and driver tags */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100 mt-2">
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        Scheduled Vehicle
                      </span>
                      <span className="text-slate-700 font-bold block mt-0.5">
                        {v ? v.name : "Unknown Vehicle"}
                      </span>
                      {v && (
                        <span className="text-[9px] font-mono text-slate-450 font-bold block mt-0.5">
                          Plate: {v.registrationNumber}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        Assigned Operator
                      </span>
                      <span className="text-slate-700 font-bold block mt-0.5">
                        {d ? d.name : "Unknown Operator"}
                      </span>
                      {d && (
                        <span className="text-[9px] font-mono text-slate-450 font-bold block mt-0.5">
                          Score: {d.safetyScore}/100
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        Cargo Weight Details
                      </span>
                      <span className="text-slate-700 font-bold block font-mono mt-0.5 flex items-center gap-1">
                        <Weight className="h-3.5 w-3.5 text-slate-450" />
                        {trip.cargoWeight} kg
                      </span>
                      {v && (
                        <span className="text-[9px] text-slate-450 font-medium block mt-0.5">
                          Limit: {v.maxCapacity} kg
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        Assigned Value
                      </span>
                      <span className="text-emerald-700 font-bold font-mono text-xs block mt-0.5">
                        ₹{trip.revenue?.toLocaleString() || "0"} Est.
                      </span>
                    </div>
                  </div>

                  {/* Historical metrics for completed trips */}
                  {trip.status === "Completed" && (
                    <div className="border-t border-slate-100 pt-2.5 mt-2.5 space-y-2">
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded border border-slate-150 p-2">
                        <div>
                          <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block">
                            Odometer Recorded
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-800 mt-0.5 block flex items-center gap-1">
                            <Gauge className="h-3.5 w-3.5 text-indigo-600" />
                            {trip.finalOdometer?.toLocaleString("en-IN")} km
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block">
                            Fuel Consumed
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-800 mt-0.5 block flex items-center gap-1">
                            <Fuel className="h-3.5 w-3.5 text-amber-600" />
                            {trip.fuelConsumed} L
                          </span>
                        </div>
                      </div>

                      {/* Revenue vs Cost ROI per-trip indicator */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded border border-slate-150 p-2 text-xs">
                        <div>
                          <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block">
                            Actual Total Cost
                          </span>
                          <span className="text-xs font-bold font-mono text-red-650 mt-0.5 block">
                            ₹{totalTripCost.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block">
                            Trip Net Profit / ROI
                          </span>
                          <span
                            className={`text-xs font-bold font-mono block mt-0.5 ${
                              tripRoi > 20
                                ? "text-emerald-700"
                                : tripRoi >= 0
                                  ? "text-amber-650"
                                  : "text-red-600"
                            }`}
                          >
                            ₹
                            {(tripRevenue - totalTripCost).toLocaleString(
                              "en-IN",
                            )}{" "}
                            ({tripRoi.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operations controller footer */}
                <div className="border-t border-slate-100 pt-2.5 mt-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[9px] text-slate-450 font-medium">
                    <Clock className="h-3 w-3 text-slate-450" />
                    <span>
                      Created: {new Date(trip.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {isCapableRole ? (
                    <div className="flex gap-1.5">
                      {trip.status === "Draft" && (
                        <>
                          {currentUser?.role === "Dispatcher" ? (
                            <>
                              <button
                                onClick={async () => {
                                  const res = await cancelTrip(trip.id);
                                  if (res && !res.success) alert(res.error);
                                }}
                                className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                              >
                                Cancel Draft
                              </button>
                              <button
                                onClick={async () => {
                                  const res = await dispatchTrip(trip.id);
                                  if (res && !res.success) alert(res.error);
                                }}
                                className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-[9px] font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                              >
                                <Play className="h-3 w-3 fill-current" />
                                <span>Dispatch Asset</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[9px] italic text-slate-400 font-semibold">
                              Dispatcher Dispatch Required
                            </span>
                          )}
                        </>
                      )}

                      {trip.status === "Dispatched" && (
                        <>
                          {currentUser?.role === "Dispatcher" && (
                            <>
                              <button
                                onClick={async () => {
                                  const res = await cancelTrip(trip.id);
                                  if (res && !res.success) alert(res.error);
                                }}
                                className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                              >
                                Abort Dispatch
                              </button>
                              <button
                                onClick={() => handleOpenCompleteModal(trip)}
                                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[9px] font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Complete Trip</span>
                              </button>
                            </>
                          )}
                          {currentUser?.role === "Fleet Manager" && (
                            <button
                              onClick={async () => {
                                const res = await cancelTrip(trip.id);
                                if (res && !res.success) alert(res.error);
                              }}
                              className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-[9px] font-bold text-red-700 hover:bg-red-100 transition shadow-xs"
                              title="Force cancel active trip on behalf of driver"
                            >
                              Force Cancel (Manager)
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] italic text-slate-500 font-semibold">
                      View Access Only
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- CREATE DISPATCH DRAFT MODAL --- */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Create New Trip Draft
              </h3>
              <button
                onClick={() => setIsDraftModalOpen(false)}
                className="rounded text-slate-400 hover:text-slate-700 transition"
              >
                <XCircle className="h-4.5 w-4.5" />
              </button>
            </div>

            {formError && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 mb-3 text-xs text-red-700 font-semibold">
                {formError}
              </div>
            )}

            {selectableVehicles.length === 0 ||
            selectableDrivers.length === 0 ? (
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-850 space-y-1.5 mb-3 font-semibold">
                <p>⚠️ Cannot schedule right now:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 font-medium">
                  {selectableVehicles.length === 0 && (
                    <li>No vehicles are currently status: "Available"</li>
                  )}
                  {selectableDrivers.length === 0 && (
                    <li>
                      No drivers with valid licenses are status: "Available"
                    </li>
                  )}
                </ul>
                <p className="text-[10px] text-slate-500 italic mt-1 font-normal">
                  Go to Registry or Compliance tab and update status or register
                  new assets to continue.
                </p>
              </div>
            ) : null}

            <form onSubmit={handleCreateDraft} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Source */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Source Terminal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai JNPT Port Terminal"
                    value={tSource}
                    onChange={(e) => setTSource(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Destination Depot *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune Bhosari Industrial Depot"
                    value={tDestination}
                    onChange={(e) => setTDestination(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-650 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Available Asset *
                </label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                >
                  {selectableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber}) - Capacity:{" "}
                      {v.maxCapacity} kg
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-450 italic block mt-0.5">
                  Retired or In Shop assets are locked from scheduling.
                </span>
              </div>

              {/* Driver Selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Available Driver *
                </label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                >
                  {selectableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Safety: {d.safetyScore}) - {d.licenseCategory}
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-450 italic block mt-0.5">
                  Expired license or Suspended personnel are locked.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Cargo Weight */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cargo (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={tCargoWeight}
                    onChange={(e) => setTCargoWeight(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                {/* Planned Distance */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={tDistance}
                    onChange={(e) => setTDistance(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  />
                </div>

                {/* Trip Value */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Revenue (INR)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={tRevenue}
                    onChange={(e) => setTRevenue(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-slate-150 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="rounded border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    selectableVehicles.length === 0 ||
                    selectableDrivers.length === 0
                  }
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Schedule Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- COMPLETE TRIP MODAL --- */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Record Dispatch Completion
              </h3>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="rounded text-slate-400 hover:text-slate-700 transition"
              >
                <XCircle className="h-4.5 w-4.5" />
              </button>
            </div>

            {completeError && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 mb-3 text-xs text-red-700 font-semibold">
                {completeError}
              </div>
            )}

            <form onSubmit={handleCompleteConfirm} className="space-y-3">
              {/* Final odometer */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Final Vehicle Odometer (km) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={finalOdo}
                  onChange={(e) => setFinalOdo(Number(e.target.value))}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
                {completingTripId && (
                  <span className="text-[9px] text-slate-450 italic block mt-0.5">
                    Must exceed current vehicle odometer (
                    {
                      vehicles.find(
                        (v) =>
                          v.id ===
                          trips.find((t) => t.id === completingTripId)
                            ?.vehicleId,
                      )?.odometer
                    }{" "}
                    km).
                  </span>
                )}
              </div>

              {/* Fuel used */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Fuel Consumed (Liters) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={fuelUsed}
                  onChange={(e) => setFuelUsed(Number(e.target.value))}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
                <span className="text-[9px] text-slate-450 italic block mt-0.5 font-normal">
                  Automatically computes fuel costs & expenses in financials.
                </span>
              </div>

              {/* Final Revenue */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Final Invoiced Revenue (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={compRevenue}
                  onChange={(e) => setCompRevenue(Number(e.target.value))}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-slate-150 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="rounded border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                >
                  Verify & Archive Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
