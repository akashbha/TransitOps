/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { ExpenseCategory } from "../types";
import { exportToCSV } from "../utils/csvExport";
import {
  DollarSign,
  Plus,
  Fuel,
  Layers,
  Download,
  Search,
  Trash2,
  Calendar,
  Truck,
  TrendingUp,
  TrendingDown,
  BarChart,
  X,
  FileSpreadsheet,
} from "lucide-react";

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    vehicles,
    fuelLogs,
    trips,
    addFuelLog,
    addExpense,
    getVehicleStats,
    currentUser,
  } = useApp();

  const isFinancialAnalyst = currentUser?.role === "Financial Analyst";
  const isManager = currentUser?.role === "Fleet Manager";
  const isAuthorizedToEdit = isFinancialAnalyst || isManager;

  // --- COMPONENT STATE ---
  const [activeForm, setActiveForm] = useState<"expense" | "fuel" | "none">(
    "none",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "All">(
    "All",
  );
  const [filterVehicle, setFilterVehicle] = useState<string>("All");

  // Fuel Form Fields
  const [fVehicleId, setFVehicleId] = useState("");
  const [fLiters, setFLiters] = useState(40);
  const [fCost, setFCost] = useState(64);
  const [fuelError, setFuelError] = useState("");

  // Expense Form Fields
  const [eVehicleId, setEVehicleId] = useState("");
  const [eCategory, setECategory] = useState<ExpenseCategory>("Toll");
  const [eAmount, setEAmount] = useState(25);
  const [eDescription, setEDescription] = useState("");
  const [expenseError, setExpenseError] = useState("");

  // --- METRIC CALCULATIONS ---
  const completedTrips = trips.filter((t) => t.status === "Completed");
  const totalRevenue = completedTrips.reduce(
    (acc, curr) => acc + (curr.revenue || 0),
    0,
  );

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalFuelLiters = fuelLogs.reduce((acc, curr) => acc + curr.liters, 0);

  // Filtered expense list
  const filteredExpenses = expenses
    .filter((e) => {
      const v = vehicles.find((item) => item.id === e.vehicleId);
      const matchesSearch =
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v?.name.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (v?.registrationNumber.toLowerCase() || "").includes(
          searchQuery.toLowerCase(),
        );

      const matchesCategory =
        filterCategory === "All" || e.category === filterCategory;
      const matchesVehicle =
        filterVehicle === "All" || e.vehicleId === filterVehicle;

      return matchesSearch && matchesCategory && matchesVehicle;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // --- ACTIONS ---
  const handleOpenFuelForm = () => {
    setFVehicleId(vehicles[0]?.id || "");
    setFLiters(50);
    setFCost(80);
    setFuelError("");
    setActiveForm("fuel");
  };

  const handleOpenExpenseForm = () => {
    setEVehicleId(vehicles[0]?.id || "");
    setECategory("Toll");
    setEAmount(25);
    setEDescription("");
    setExpenseError("");
    setActiveForm("expense");
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuelError("");

    if (!fVehicleId || fLiters <= 0 || fCost <= 0) {
      setFuelError("Please enter valid quantities.");
      return;
    }

    const res = await addFuelLog({
      vehicleId: fVehicleId,
      liters: Number(fLiters),
      cost: Number(fCost),
    });

    if (res && !res.success) {
      setFuelError(res.error || "Failed to log fuel.");
    } else {
      setActiveForm("none");
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError("");

    if (!eVehicleId || !eDescription.trim() || eAmount <= 0) {
      setExpenseError("Please enter description and valid amount.");
      return;
    }

    const res = await addExpense({
      vehicleId: eVehicleId,
      category: eCategory,
      amount: Number(eAmount),
      description: eDescription.trim(),
    });

    if (res && !res.success) {
      setExpenseError(res.error || "Failed to log expense.");
    } else {
      setActiveForm("none");
    }
  };

  const handleCSVExport = () => {
    const exportData = expenses.map((e) => {
      const v = vehicles.find((vItem) => vItem.id === e.vehicleId);
      return {
        Date: e.date,
        "Vehicle Name": v ? v.name : "Unassigned",
        "Reg Number": v ? v.registrationNumber : "N/A",
        Category: e.category,
        "Amount (INR)": e.amount,
        Description: e.description,
        "Associated Trip ID": e.tripId || "N/A",
      };
    });
    exportToCSV(
      exportData,
      `TransitOps_Expenses_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const getCategoryBadgeClass = (category: ExpenseCategory) => {
    switch (category) {
      case "Fuel":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Maintenance":
        return "bg-red-50 text-red-700 border-red-200";
      case "Toll":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Insurance":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Permits":
        return "bg-pink-50 text-pink-700 border-pink-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* FINANCIAL PROFIT & EXPENSE KPI DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI: Revenue */}
        <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-extrabold uppercase tracking-wider">
              Fleet Invoiced Revenue
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-base font-extrabold text-slate-900">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <span className="text-[9px] text-slate-450 mt-0.5 block">
            From completed deliveries
          </span>
        </div>

        {/* KPI: Expenses */}
        <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-extrabold uppercase tracking-wider">
              Total Fleet Spend
            </span>
            <TrendingDown className="h-4 w-4 text-red-650" />
          </div>
          <p className="mt-1 text-base font-extrabold text-slate-900">
            ₹{totalExpenses.toLocaleString()}
          </p>
          <span className="text-[9px] text-slate-450 mt-0.5 block">
            Fuel, Shop, Tolls & Permits
          </span>
        </div>

        {/* KPI: Profit */}
        <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-extrabold uppercase tracking-wider">
              Net Operational Profit
            </span>
            <BarChart className="h-4 w-4 text-indigo-600" />
          </div>
          <p
            className={`mt-1 text-base font-extrabold ${totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}
          >
            ₹{totalProfit.toLocaleString()}
          </p>
          <span className="text-[9px] text-slate-450 mt-0.5 block">
            Revenue minus expenses
          </span>
        </div>

        {/* KPI: Fuel used */}
        <div className="rounded border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[9px] font-extrabold uppercase tracking-wider">
              Total Diesel Logged
            </span>
            <Fuel className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-1 text-base font-extrabold text-slate-900">
            {totalFuelLiters.toLocaleString()} L
          </p>
          <span className="text-[9px] text-slate-450 mt-0.5 block">
            Aggregate fuel consumption
          </span>
        </div>
      </div>

      {/* COMPUTE TOTAL OPERATIONAL COST (FUEL + MAINTENANCE) PER VEHICLE LEDGER */}
      <div className="rounded border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
          Vehicle-Specific Operations Ledger (Fuel & Maintenance)
        </h3>
        <p className="text-[10px] text-slate-500 mb-3">
          Automated live computations showing operational overhead (Fuel Cost +
          Maintenance Cost) per registered vehicle.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {vehicles.slice(0, 4).map((vehicle) => {
            const stats = getVehicleStats(vehicle.id);
            const overhead = stats.totalFuelCost + stats.totalMaintenanceCost;
            return (
              <div
                key={vehicle.id}
                className="rounded border border-slate-150 bg-slate-50 p-3 space-y-1.5"
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[9px] font-bold text-indigo-650">
                    {vehicle.registrationNumber}
                  </span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">
                    {vehicle.type}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate">
                  {vehicle.name}
                </h4>
                <div className="border-t border-slate-200 my-1 pt-1.5 space-y-1 text-[10px] font-mono text-slate-500">
                  <div className="flex justify-between">
                    <span>Fuel Cost:</span>{" "}
                    <span className="text-amber-700 font-bold">
                      ₹{stats.totalFuelCost.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maint Cost:</span>{" "}
                    <span className="text-red-700 font-bold">
                      ₹{stats.totalMaintenanceCost.toFixed(0)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900 text-xs">
                    <span>Total Overhead:</span>
                    <span>₹{overhead.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOOLBAR CONTROLS */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between border-b border-slate-150 pb-2.5">
        {/* Search and filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by keywords, plates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white py-1 pl-7.5 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-650"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-650"
            >
              <option value="All">All Categories</option>
              <option value="Fuel">Fuel</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Toll">Tolls</option>
              <option value="Insurance">Insurance</option>
              <option value="Permits">Permits</option>
              <option value="Other">Other Category</option>
            </select>

            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-650 max-w-[150px]"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* CSV Export */}
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {isAuthorizedToEdit ? (
            <div className="flex gap-2">
              <button
                onClick={handleOpenFuelForm}
                className="flex items-center gap-1 rounded border border-amber-200 bg-amber-50 text-amber-700 px-3 py-1 text-xs font-bold hover:bg-amber-100 transition shadow-xs"
              >
                <Fuel className="h-4 w-4" />
                <span>Log Fuel</span>
              </button>
              <button
                onClick={handleOpenExpenseForm}
                className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Log Expense</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic font-semibold">
              Read Only Mode
            </span>
          )}
        </div>
      </div>

      {/* LEDGER EXPENSE LIST TABLE */}
      <div className="rounded border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic text-xs">
            No expenses found matching query criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Expense Date</th>
                  <th className="px-4 py-2.5">Vehicle / Asset</th>
                  <th className="px-4 py-2.5">Overhead Category</th>
                  <th className="px-4 py-2.5">Amount Charged</th>
                  <th className="px-4 py-2.5">Invoice Details</th>
                  <th className="px-4 py-2.5 text-right">Trip Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredExpenses.map((expense) => {
                  const v = vehicles.find(
                    (item) => item.id === expense.vehicleId,
                  );

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/50">
                      {/* Date */}
                      <td className="px-4 py-2 font-mono text-slate-500">
                        {expense.date}
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-2">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {v?.name || "Unassigned"}
                          </span>
                          <span className="font-mono text-[9px] text-slate-450 mt-0.5 block font-bold">
                            {v?.registrationNumber}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${getCategoryBadgeClass(expense.category)}`}
                        >
                          {expense.category}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-2 font-mono text-slate-700 font-bold">
                        ₹
                        {expense.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Description */}
                      <td
                        className="px-4 py-2 text-slate-600 max-w-[250px] truncate"
                        title={expense.description}
                      >
                        {expense.description}
                      </td>

                      {/* Trip ID */}
                      <td className="px-4 py-2 text-right font-mono text-[9px] text-slate-450">
                        {expense.tripId ? (
                          <span
                            className="rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-indigo-650 font-bold"
                            title={`Trip ID: ${expense.tripId}`}
                          >
                            Trip Link
                          </span>
                        ) : (
                          <span className="italic text-slate-400 font-normal">
                            General Fleet
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

      {/* FUEL LOG HISTORY REGISTRY */}
      <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Fuel className="h-4 w-4 text-amber-600" />
              Fuel Log Registry & Consumption History
            </h3>
            <p className="text-[10px] text-slate-500">
              Detailed log of diesel fuel consumption, refuel costs, and
              computed efficiency per vehicle dispatch.
            </p>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
            {fuelLogs.length} Records
          </span>
        </div>

        {fuelLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            No fuel logs currently recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Refuel Date</th>
                  <th className="px-4 py-2.5">Vehicle</th>
                  <th className="px-4 py-2.5">Quantity (Liters)</th>
                  <th className="px-4 py-2.5">Total Cost</th>
                  <th className="px-4 py-2.5">Efficiency (km/L)</th>
                  <th className="px-4 py-2.5 text-right">Trip Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-sans text-slate-700">
                {fuelLogs.map((log) => {
                  const v = vehicles.find((item) => item.id === log.vehicleId);
                  const t = log.tripId
                    ? trips.find((item) => item.id === log.tripId)
                    : null;

                  let efficiency = "N/A";
                  if (t && t.plannedDistance && log.liters > 0) {
                    efficiency = `${(t.plannedDistance / log.liters).toFixed(2)} km/L`;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-mono text-slate-500">
                        {log.date}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs font-bold text-slate-800 block">
                          {v?.name || "Unassigned"}
                        </span>
                        <span className="font-mono text-[9px] text-slate-450 mt-0.5 block font-bold">
                          {v?.registrationNumber}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-700">
                        {log.liters.toLocaleString()} L
                      </td>
                      <td className="px-4 py-2 font-mono text-emerald-700 font-bold">
                        ₹
                        {log.cost.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-2 font-mono text-indigo-600 font-bold">
                        {efficiency}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-[9px] text-slate-450">
                        {t ? (
                          <span className="rounded bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-indigo-650 font-bold">
                            Trip {t.id} ({t.plannedDistance} km)
                          </span>
                        ) : (
                          <span className="italic text-slate-400 font-normal">
                            Direct Tank Fill
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

      {/* --- ADD FUEL FORM MODAL --- */}
      {activeForm === "fuel" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <Fuel className="h-4 w-4 text-amber-650" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Log Fuel Consumption
                </h3>
              </div>
              <button
                onClick={() => setActiveForm("none")}
                className="rounded text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {fuelError && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 mb-3 text-xs text-red-700 font-semibold">
                {fuelError}
              </div>
            )}

            <form onSubmit={handleFuelSubmit} className="space-y-3">
              {/* Vehicle */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Refueled Vehicle *
                </label>
                <select
                  required
                  value={fVehicleId}
                  onChange={(e) => setFVehicleId(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-650"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Liters */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Fuel Quantity (Liters) *
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={fLiters}
                  onChange={(e) => setFLiters(Number(e.target.value))}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
              </div>

              {/* Cost */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Fuel Cost (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={fCost}
                  onChange={(e) => setFCost(Number(e.target.value))}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-slate-150 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveForm("none")}
                  className="rounded border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                >
                  Record Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD EXPENSE FORM MODAL --- */}
      {activeForm === "expense" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded border border-slate-200 bg-white p-5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Record Operational Expense
                </h3>
              </div>
              <button
                onClick={() => setActiveForm("none")}
                className="rounded text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {expenseError && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 mb-3 text-xs text-red-700 font-semibold">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              {/* Vehicle selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Assign to Fleet Vehicle *
                </label>
                <select
                  required
                  value={eVehicleId}
                  onChange={(e) => setEVehicleId(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-650"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Expense Category
                </label>
                <select
                  value={eCategory}
                  onChange={(e) =>
                    setECategory(e.target.value as ExpenseCategory)
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                >
                  <option value="Toll">Tolls / Highway Fee</option>
                  <option value="Maintenance">Maintenance / Spare part</option>
                  <option value="Insurance">Asset Insurance Premium</option>
                  <option value="Permits">Transit Permits & Licenses</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              {/* Cost amount */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Invoice Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={eAmount}
                  onChange={(e) => setEAmount(Number(e.target.value))}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Expense Description / Memo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State route turnpike pass"
                  value={eDescription}
                  onChange={(e) => setEDescription(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-650 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-slate-150 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveForm("none")}
                  className="rounded border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                >
                  Log Invoice Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
