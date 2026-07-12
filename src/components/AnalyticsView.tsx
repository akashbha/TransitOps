/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { TODAY_DATE } from "../context/AppContext";
import { exportToCSV } from "../utils/csvExport";
import {
  TrendingUp,
  IndianRupee,
  ShieldCheck,
  Activity,
  Truck,
  Gauge,
  Award,
  AlertTriangle,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  UserCheck,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

export const AnalyticsView: React.FC = () => {
  const {
    vehicles,
    drivers,
    trips,
    expenses,
    fuelLogs,
    maintenanceLogs,
    getVehicleStats,
    currentUser,
  } = useApp();

  const [timeframe, setTimeframe] = useState<"daily" | "weekly">("daily");
  const [vehicleFilter, setVehicleFilter] = useState<string>("All");

  // --- 1. DYNAMIC FINANCIAL TIMELINE CALCULATIONS ---
  const chartData = useMemo(() => {
    if (timeframe === "daily") {
      // Generate last 14 days of data up to TODAY_DATE (2026-07-11)
      const data = [];
      const today = new Date(TODAY_DATE);

      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];

        // Sum revenue on this day
        const dayRevenue = trips
          .filter(
            (t) =>
              t.status === "Completed" && t.completedAt?.startsWith(dateStr),
          )
          .reduce((sum, t) => sum + (t.revenue || 0), 0);

        // Sum fuel expenses on this day
        const dayFuel = expenses
          .filter((e) => e.category === "Fuel" && e.date === dateStr)
          .reduce((sum, e) => sum + e.amount, 0);

        // Sum maintenance expenses on this day
        const dayMaint = expenses
          .filter((e) => e.category === "Maintenance" && e.date === dateStr)
          .reduce((sum, e) => sum + e.amount, 0);

        // Sum other expenses on this day
        const dayOther = expenses
          .filter(
            (e) =>
              e.category !== "Fuel" &&
              e.category !== "Maintenance" &&
              e.date === dateStr,
          )
          .reduce((sum, e) => sum + e.amount, 0);

        const totalExpenses = dayFuel + dayMaint + dayOther;
        const netProfit = dayRevenue - totalExpenses;

        // Human readable date label (e.g. "Jul 09")
        const label = d.toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
        });

        data.push({
          date: dateStr,
          label,
          Revenue: dayRevenue,
          Fuel: dayFuel,
          Maintenance: dayMaint,
          Other: dayOther,
          Expenses: totalExpenses,
          NetProfit: netProfit,
        });
      }
      return data;
    } else {
      // Group last 4 weeks
      // We will define 4 weekly periods ending on TODAY_DATE (2026-07-11)
      const data = [];
      const today = new Date(TODAY_DATE);

      for (let w = 3; w >= 0; w--) {
        const startDay = new Date(today);
        startDay.setDate(today.getDate() - w * 7 - 6);
        const endDay = new Date(today);
        endDay.setDate(today.getDate() - w * 7);

        const startStr = startDay.toISOString().split("T")[0];
        const endStr = endDay.toISOString().split("T")[0];

        // Sum over the 7-day week
        const weekRevenue = trips
          .filter((t) => {
            if (t.status !== "Completed" || !t.completedAt) return false;
            const compDate = t.completedAt.substring(0, 10);
            return compDate >= startStr && compDate <= endStr;
          })
          .reduce((sum, t) => sum + (t.revenue || 0), 0);

        const weekFuel = expenses
          .filter(
            (e) =>
              e.category === "Fuel" && e.date >= startStr && e.date <= endStr,
          )
          .reduce((sum, e) => sum + e.amount, 0);

        const weekMaint = expenses
          .filter(
            (e) =>
              e.category === "Maintenance" &&
              e.date >= startStr &&
              e.date <= endStr,
          )
          .reduce((sum, e) => sum + e.amount, 0);

        const weekOther = expenses
          .filter(
            (e) =>
              e.category !== "Fuel" &&
              e.category !== "Maintenance" &&
              e.date >= startStr &&
              e.date <= endStr,
          )
          .reduce((sum, e) => sum + e.amount, 0);

        const totalExpenses = weekFuel + weekMaint + weekOther;
        const netProfit = weekRevenue - totalExpenses;

        const label = `Wk ending ${endDay.toLocaleDateString(undefined, { month: "short", day: "2-digit" })}`;

        data.push({
          label,
          Revenue: weekRevenue,
          Fuel: weekFuel,
          Maintenance: weekMaint,
          Other: weekOther,
          Expenses: totalExpenses,
          NetProfit: netProfit,
        });
      }
      return data;
    }
  }, [timeframe, trips, expenses]);

  // --- 2. ASSET PERFORMANCE INDICATORS ---
  const assetMetrics = useMemo(() => {
    return vehicles
      .filter((v) => v.status !== "Retired")
      .map((v) => {
        const stats = getVehicleStats(v.id);

        // Distance traveled on completed trips
        const distance = trips
          .filter((t) => t.vehicleId === v.id && t.status === "Completed")
          .reduce((sum, t) => sum + t.plannedDistance, 0);

        // Total cost including other expenses
        const totalExpenses = expenses
          .filter((e) => e.vehicleId === v.id)
          .reduce((sum, e) => sum + e.amount, 0);

        const costPerKm = distance > 0 ? totalExpenses / distance : 0;
        const fuelEconomy =
          distance > 0 ? (stats.totalLiters / distance) * 100 : 0;

        // Custom warnings
        let warning = "";
        if (v.type === "Truck" && fuelEconomy > 40) {
          warning = "Extremely high diesel consumption";
        } else if (v.type === "Van" && fuelEconomy > 15) {
          warning = "High fuel burn rate for cargo van";
        } else if (costPerKm > 1.5) {
          warning = "High operating cost per kilometer";
        }

        return {
          id: v.id,
          name: v.name,
          reg: v.registrationNumber,
          type: v.type,
          odometer: v.odometer,
          distance,
          totalCost: totalExpenses,
          fuelLiters: stats.totalLiters,
          revenue: stats.totalRevenue,
          costPerKm,
          fuelEconomy,
          warning,
        };
      });
  }, [vehicles, trips, expenses, fuelLogs, getVehicleStats]);

  // --- 3. DRIVER SAFETY LEADERBOARD ---
  const driverLeaderboard = useMemo(() => {
    return drivers
      .map((d) => {
        const driverTrips = trips.filter(
          (t) => t.driverId === d.id && t.status === "Completed",
        );
        const totalDistance = driverTrips.reduce(
          (sum, t) => sum + t.plannedDistance,
          0,
        );
        const totalRevenue = driverTrips.reduce(
          (sum, t) => sum + (t.revenue || 0),
          0,
        );

        let tier:
          "Elite Operator" | "Pro Operator" | "Qualified" | "Under Review" =
          "Qualified";
        if (d.safetyScore >= 95) {
          tier = "Elite Operator";
        } else if (d.safetyScore >= 90) {
          tier = "Pro Operator";
        } else if (d.safetyScore < 80) {
          tier = "Under Review";
        }

        return {
          ...d,
          completedTripsCount: driverTrips.length,
          totalDistance,
          totalRevenue,
          tier,
        };
      })
      .sort((a, b) => b.safetyScore - a.safetyScore);
  }, [drivers, trips]);

  // --- 4. REGIONAL PERFORMANCE COMPARISONS ---
  const regionalMetrics = useMemo(() => {
    const regions: ("North" | "South" | "East" | "West")[] = [
      "North",
      "South",
      "East",
      "West",
    ];
    return regions.map((r) => {
      const regionalVehicles = vehicles.filter((v) => v.region === r);
      const vehicleIds = regionalVehicles.map((v) => v.id);

      const regionalTrips = trips.filter(
        (t) => t.status === "Completed" && vehicleIds.includes(t.vehicleId),
      );
      const revenue = regionalTrips.reduce(
        (sum, t) => sum + (t.revenue || 0),
        0,
      );

      const regionalExpenses = expenses.filter((e) =>
        vehicleIds.includes(e.vehicleId),
      );
      const overhead = regionalExpenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = revenue - overhead;

      return {
        region: r,
        Revenue: revenue,
        Overhead: overhead,
        NetProfit: profit,
        TripsCount: regionalTrips.length,
        VehiclesCount: regionalVehicles.length,
      };
    });
  }, [vehicles, trips, expenses]);

  // General KPIs
  const totalFleetRevenue = useMemo(
    () =>
      trips
        .filter((t) => t.status === "Completed")
        .reduce((sum, t) => sum + (t.revenue || 0), 0),
    [trips],
  );
  const totalFleetExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );
  const totalNetProfit = totalFleetRevenue - totalFleetExpenses;
  const averageSafetyScore = useMemo(() => {
    const active = drivers.filter((d) => d.status !== "Suspended");
    return active.length > 0
      ? Math.round(
          active.reduce((sum, d) => sum + d.safetyScore, 0) / active.length,
        )
      : 0;
  }, [drivers]);

  return (
    <div className="space-y-6">
      {/* Analytics Page Title & Exports */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1 border-b border-slate-150">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
            Advanced Fleet Analytics & ROI Reports
          </h2>
          <p className="text-xs text-slate-450 mt-0.5">
            Financial ledger charts, overhead cost structures, and driver
            safe-mile rewards performance metrics.
          </p>
        </div>

        {/* Financial Analyst CSV export button */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {currentUser?.role === "Financial Analyst" ? (
            <button
              onClick={() => {
                const exportData = chartData.map((row) => ({
                  "Date Label": row.label,
                  "Date YYYY-MM-DD": row.date,
                  "Invoice Revenue (INR)": row.Revenue,
                  "Operating Expenses (INR)": row.Expenses,
                  "Fuel Overhead (INR)": row.Fuel,
                  "Maintenance Overhead (INR)": row.Maintenance,
                  "Other Overhead (INR)": row.Other,
                  "Net Profit Margin (INR)": row.NetProfit,
                }));
                exportToCSV(
                  exportData,
                  `TransitOps_Financial_Report_${new Date().toISOString().split("T")[0]}`,
                );
              }}
              className="flex items-center gap-1.5 rounded bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs animate-pulse"
              title="Download compiled ledger spreadsheet"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Financial Report</span>
            </button>
          ) : (
            <button
              disabled
              title="Report downloading is restricted to Financial Analysts only"
              className="flex items-center gap-1.5 rounded bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Report (Analysts Only)</span>
            </button>
          )}
        </div>
      </div>

      {/* FINANCIAL & PERFORMANCE HEADER SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Fleet Revenue
            </span>
            <div className="rounded bg-emerald-50 p-1.5 text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ₹
            {totalFleetRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="font-semibold text-emerald-600">
              Dynamic Live Ledger
            </span>
            <span>from completed trips</span>
          </div>
        </div>

        {/* Total Operating Cost */}
        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Fleet Overhead
            </span>
            <div className="rounded bg-amber-50 p-1.5 text-amber-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ₹
            {totalFleetExpenses.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <Activity className="h-3 w-3 text-amber-500" />
            <span className="font-semibold text-amber-600">
              Fuel & Maint. Costs
            </span>
            <span>fully aggregated</span>
          </div>
        </div>

        {/* Net Profit Margin */}
        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Net ROI / Operating Profit
            </span>
            <div className="rounded bg-indigo-50 p-1.5 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`mt-2 text-2xl font-black font-mono ${totalNetProfit >= 0 ? "text-indigo-650" : "text-red-650"}`}
          >
            ₹
            {totalNetProfit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <span
              className={`font-bold ${totalNetProfit >= 0 ? "text-indigo-600" : "text-red-600"}`}
            >
              {totalFleetRevenue > 0
                ? ((totalNetProfit / totalFleetRevenue) * 100).toFixed(1)
                : 0}
              %
            </span>
            <span>Net operational margin</span>
          </div>
        </div>

        {/* Fleet Compliance and Safety */}
        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Mean Fleet Safety Rating
            </span>
            <div className="rounded bg-purple-50 p-1.5 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {averageSafetyScore}{" "}
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <Award className="h-3.5 w-3.5 text-purple-500" />
            <span className="font-semibold text-purple-600">
              Class A CDL Standard
            </span>
            <span>enforced daily</span>
          </div>
        </div>
      </div>

      {/* --- TIME-SERIES FINANCIAL PERFORMANCE CHART --- */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dynamic Revenue vs Overhead Cost Trends
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Time-series tracking comparing trip income logs against fuel
              receipts and fleet garage repair invoices.
            </p>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 rounded bg-slate-50 border border-slate-200 p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setTimeframe("daily")}
              className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                timeframe === "daily"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              }`}
            >
              Daily (14D)
            </button>
            <button
              onClick={() => setTimeframe("weekly")}
              className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                timeframe === "weekly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              }`}
            >
              Weekly (4W)
            </button>
          </div>
        </div>

        {/* Recharts Area/Line Chart */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val) => `₹${val}`}
                tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "11px",
                }}
                itemStyle={{ padding: "2px 0" }}
                formatter={(value: any) => [`₹${Number(value).toFixed(2)}`]}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              />
              <Area
                type="monotone"
                name="Invoice Revenue"
                dataKey="Revenue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                name="Operating Expenses"
                dataKey="Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />
              <Area
                type="monotone"
                name="Net Profit"
                dataKey="NetProfit"
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses Cost Allocation Breakdown Bar Chart */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 border-t border-slate-100 mt-6 pt-5">
          <div className="md:col-span-4 flex flex-col justify-center space-y-3">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
              Overhead Cost Allocation
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Visualizes how operating budgets are divided across fuel
              logistics, routine vehicle maintenance checkups, and
              administrative tolls.
            </p>
            <div className="space-y-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-amber-500 block shrink-0" />
                <span>Fuel Depot Charging</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-red-500 block shrink-0" />
                <span>Maintenance & Shop Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded bg-slate-400 block shrink-0" />
                <span>Tolls & Turnpike Admin</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-8 h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `₹${val}`}
                  tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`]}
                />
                <Bar
                  dataKey="Fuel"
                  name="Fuel Log"
                  stackId="a"
                  fill="#f59e0b"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Maintenance"
                  name="Shop Repairs"
                  stackId="a"
                  fill="#ef4444"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Other"
                  name="Highway Tolls"
                  stackId="a"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* REGIONAL PERFORMANCE COMPARISON CARD */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Regional Profitability & Dispatch Comparison
              </h3>
            </div>
            <p className="text-[11px] text-slate-450 mt-1">
              Cross-zone comparisons of total revenue, overhead costs, and net
              operating margins across active regional sectors.
            </p>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
            All Regions Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionalMetrics}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="region"
                  tick={{ fontSize: 9, fill: "#64748b", fontWeight: 700 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                  formatter={(value: any) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                />
                <Bar
                  dataKey="Revenue"
                  name="Revenue"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Overhead"
                  name="Total Overhead"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="NetProfit"
                  name="Net Profit"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center space-y-3.5 bg-slate-50 border border-slate-150 rounded p-4">
            <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Zone Performance Indicators
            </h4>
            <div className="space-y-2.5">
              {regionalMetrics.map((rm) => (
                <div
                  key={rm.region}
                  className="flex justify-between items-center text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-650 block shrink-0" />
                    <span className="font-bold text-slate-700">
                      {rm.region} Region
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      ₹
                      {rm.NetProfit.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block mt-0.5">
                      {rm.TripsCount} Trips ({rm.VehiclesCount} Assets)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- TELEMATICS & ASSET PERFORMANCE INDICATORS --- */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-650" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Telematics & Asset Efficiency Indicators
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Evaluates asset health based on fuel consumption per 100km and
              overall operating cost efficiency index (₹ per kilometer).
            </p>
          </div>
          <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-bold text-indigo-700 uppercase tracking-wider">
            Diagnostics Mode
          </span>
        </div>

        {/* Grid of Vehicle Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assetMetrics.map((asset) => {
            // Determine indicators color threshold
            const economyColor =
              asset.fuelEconomy === 0
                ? "text-slate-400"
                : asset.type === "Truck"
                  ? asset.fuelEconomy > 35
                    ? "text-red-650"
                    : "text-emerald-650"
                  : asset.fuelEconomy > 12
                    ? "text-red-650"
                    : "text-emerald-650";

            const costColor =
              asset.costPerKm === 0
                ? "text-slate-400"
                : asset.costPerKm > 1.2
                  ? "text-red-650"
                  : "text-emerald-650";

            return (
              <div
                key={asset.id}
                className={`rounded border p-4 bg-slate-50/50 flex flex-col justify-between space-y-4 hover:border-indigo-200 transition relative ${
                  asset.warning
                    ? "border-amber-250 bg-amber-50/5"
                    : "border-slate-200"
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 block truncate max-w-[170px]">
                      {asset.name}
                    </h4>
                    <span className="font-mono text-[9px] text-slate-400 font-bold block mt-0.5">
                      {asset.reg} • {asset.type}
                    </span>
                  </div>
                  <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[9px] text-slate-500 font-mono font-bold">
                    {asset.odometer.toLocaleString()} km
                  </span>
                </div>

                {/* Performance numbers */}
                <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-150 py-2.5">
                  {/* Fuel Economy */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Fuel Economy
                    </span>
                    <div className="flex items-center gap-1">
                      <Gauge
                        className={`h-3.5 w-3.5 shrink-0 ${economyColor}`}
                      />
                      <span
                        className={`text-sm font-black font-mono leading-none ${economyColor}`}
                      >
                        {asset.fuelEconomy > 0
                          ? asset.fuelEconomy.toFixed(1)
                          : "—"}
                      </span>
                      {asset.fuelEconomy > 0 && (
                        <span className="text-[9px] font-semibold text-slate-500">
                          L/100km
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cost per KM */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Cost per KM
                    </span>
                    <div className="flex items-center gap-1">
                      <IndianRupee
                        className={`h-3.5 w-3.5 shrink-0 ${costColor}`}
                      />
                      <span
                        className={`text-sm font-black font-mono leading-none ${costColor}`}
                      >
                        {asset.costPerKm > 0
                          ? `₹${asset.costPerKm.toFixed(2)}`
                          : "—"}
                      </span>
                      {asset.costPerKm > 0 && (
                        <span className="text-[9px] font-semibold text-slate-500">
                          /km
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtext or Warning Alert */}
                <div className="flex items-center justify-between text-[10px]">
                  {asset.warning ? (
                    <div className="flex items-center gap-1 text-amber-700 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-550 shrink-0" />
                      <span
                        className="truncate max-w-[190px]"
                        title={asset.warning}
                      >
                        {asset.warning}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Activity className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Operating standard normal</span>
                    </div>
                  )}

                  <span className="text-[9px] font-mono text-slate-400">
                    {asset.distance > 0
                      ? `${asset.distance} km logged`
                      : "0 trips"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- DRIVER SAFETY LEADERBOARD --- */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-600 animate-bounce" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Operator Safety & Compliance Leaderboard
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ranks drivers by computed safety index derived from hard braking,
              speed limits, and route compliance metrics.
            </p>
          </div>
          <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-bold text-indigo-700 uppercase tracking-wider">
            CDL Safe-Miles Rewards
          </span>
        </div>

        {/* Leaderboard list */}
        <div className="overflow-hidden rounded border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-center w-12">Rank</th>
                  <th className="px-4 py-2.5">Driver Operator</th>
                  <th className="px-4 py-2.5">Safety Rank Tier</th>
                  <th className="px-4 py-2.5">Completed Trips</th>
                  <th className="px-4 py-2.5">Total Safe Kilometers</th>
                  <th className="px-4 py-2.5">Accumulated Revenue</th>
                  <th className="px-5 py-2.5 text-center w-28">Safety Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {driverLeaderboard.map((driver, idx) => {
                  const medalColors = [
                    "bg-amber-100 text-amber-800 border-amber-300 font-black",
                    "bg-slate-200 text-slate-700 border-slate-300 font-bold",
                    "bg-orange-100 text-orange-800 border-orange-200 font-bold",
                  ];

                  const rankStyle =
                    idx < 3
                      ? medalColors[idx]
                      : "bg-slate-100 text-slate-500 border-slate-200";

                  const progressColor =
                    driver.safetyScore >= 95
                      ? "stroke-emerald-500"
                      : driver.safetyScore >= 90
                        ? "stroke-indigo-500"
                        : driver.safetyScore >= 80
                          ? "stroke-amber-500"
                          : "stroke-red-500";

                  const badgeColors = {
                    "Elite Operator":
                      "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
                    "Pro Operator":
                      "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold",
                    Qualified: "bg-slate-50 text-slate-600 border-slate-200",
                    "Under Review":
                      "bg-red-50 text-red-700 border-red-200 font-semibold",
                  }[driver.tier];

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/40">
                      {/* Rank Medal */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${rankStyle}`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      {/* Driver Name & License */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {driver.name}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400 mt-0.5 block">
                            {driver.licenseCategory} • {driver.licenseNumber}
                          </span>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[9px] uppercase ${badgeColors}`}
                        >
                          {driver.tier}
                        </span>
                      </td>

                      {/* Trips Count */}
                      <td className="px-4 py-3 font-mono text-slate-500 font-bold">
                        {driver.completedTripsCount} Completed
                      </td>

                      {/* Kilometers */}
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {driver.totalDistance.toLocaleString()} km
                      </td>

                      {/* Revenue generated */}
                      <td className="px-4 py-3 font-mono text-slate-700 font-bold">
                        ₹{driver.totalRevenue.toLocaleString()}
                      </td>

                      {/* Circular Progress Ring Safety Score */}
                      <td className="px-5 py-3 text-center flex items-center justify-center">
                        <div className="relative flex h-9 w-9 items-center justify-center">
                          <svg className="absolute h-full w-full -rotate-90">
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              className="stroke-slate-100 fill-none"
                              strokeWidth="3.5"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              className={`fill-none transition-all duration-500 ${progressColor}`}
                              strokeWidth="3.5"
                              strokeDasharray={`${2 * Math.PI * 15}`}
                              strokeDashoffset={`${2 * Math.PI * 15 * (1 - driver.safetyScore / 100)}`}
                            />
                          </svg>
                          <span className="text-[10px] font-black text-slate-800">
                            {driver.safetyScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
