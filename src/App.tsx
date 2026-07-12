/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./components/DashboardView";
import { VehiclesView } from "./components/VehiclesView";
import { DriversView } from "./components/DriversView";
import { TripsView } from "./components/TripsView";
import { MaintenanceView } from "./components/MaintenanceView";
import { ExpensesView } from "./components/ExpensesView";
import { AnalyticsView } from "./components/AnalyticsView";
import { AuditLogViewer } from "./components/AuditLogViewer";
import {
  Navigation,
  Key,
  Shield,
  UserCheck,
  Play,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";

function AppContent() {
  const { currentUser, login, users, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [emailInput, setEmailInput] = useState("manager@transitops.com");
  const [passwordInput, setPasswordInput] = useState("password123"); // Preset password
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState("");
  const [authError, setAuthError] = useState("");

  // --- MANUAL LOGIN HANDLER ---
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setForgotPasswordMsg("");
    const success = await login(emailInput, passwordInput, rememberMe);
    if (!success) {
      setAuthError(
        "Access Denied: Invalid email or password. Use one of the preset accounts.",
      );
    }
  };

  // --- QUICK DEMO LOGIN CLICK ---
  const handleQuickLogin = async (email: string) => {
    setForgotPasswordMsg("");
    await login(email, "password123", true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-xs font-mono tracking-wider">
            SECURE CONSOLE SYNCHRONIZING...
          </span>
        </div>
      </div>
    );
  }

  // --- UNAUTHORIZED / NOT LOGGED IN VIEW ---
  if (!currentUser) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 font-sans select-none relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-emerald-500/3 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 z-10 animate-in fade-in slide-in-from-bottom-8 duration-300">
          {/* Brand/Welcome Column */}
          <div className="md:col-span-5 flex flex-col justify-center text-slate-600 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow shadow-indigo-600/20">
                <Navigation className="h-5 w-5 rotate-45 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  TransitOps
                </h1>
                <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">
                  Operations Control
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-snug">
                Digitizing Fleet Logistics with Enforced Business Rules
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Welcome to the TransitOps evaluation center. This dashboard
                provides complete visibility over vehicle registration, driver
                compliance, trip schedules, maintenance tasks, and financial
                cost-ROI audits.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2 text-xs text-slate-600 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase text-[9px] tracking-wider">
                <Shield className="h-3.5 w-3.5" />
                <span>Enforced Constraints</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-slate-500">
                <li>Load limits verified during dispatch.</li>
                <li>Expired driver licenses blocked.</li>
                <li>Vehicles under maintenance hidden.</li>
                <li>Dynamic multi-vehicle ROI models.</li>
              </ul>
            </div>
          </div>

          {/* Login Gate Form Column */}
          <div className="md:col-span-7 rounded-xl border border-slate-200 bg-white p-6 sm:p-7 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <Key className="h-3.5 w-3.5 text-indigo-600" />
                  Operator Authorization
                </h3>
                <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-2 py-0.5 font-bold tracking-wider uppercase">
                  RBAC Gate
                </span>
              </div>

              {authError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 mb-5 text-[11px] text-red-700 font-semibold">
                  {authError}
                </div>
              )}

              {forgotPasswordMsg && (
                <div className="rounded border border-blue-200 bg-blue-50 p-2.5 mb-5 text-[11px] text-blue-700 font-semibold">
                  {forgotPasswordMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleManualLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Security Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setForgotPasswordMsg(
                          "For security and audit compliance, please contact your System Administrator to reset your TransitOps account credentials.",
                        )
                      }
                      className="text-[9px] font-bold text-indigo-600 hover:underline hover:text-indigo-700 focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex items-center gap-2 py-1 select-none">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-[11px] text-slate-500 font-medium cursor-pointer"
                  >
                    Remember my credentials (persistent session)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow shadow-indigo-600/10 mt-2"
                >
                  <span>Authorize Console Session</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Quick Impersonate Switcher for fast review */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
                Reviewer Shortcuts: Click Role to Login
              </span>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {users.map((u) => (
                  <button
                    key={u.role}
                    type="button"
                    onClick={() => handleQuickLogin(u.email)}
                    className="rounded border border-slate-200 bg-slate-50 p-2 text-center hover:border-indigo-600 hover:bg-slate-100 group transition duration-150"
                  >
                    <p className="text-[9px] font-bold text-indigo-600 group-hover:text-indigo-700 leading-tight">
                      {u.role}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                      {u.name.split(" ")[0]}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING ROUTED PANEL CONTENT ---
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "vehicles":
        return <VehiclesView />;
      case "drivers":
        return <DriversView />;
      case "trips":
        return <TripsView />;
      case "maintenance":
        return <MaintenanceView />;
      case "expenses":
        return <ExpensesView />;
      case "analytics":
        return <AnalyticsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Common Header */}
        <Header activeTab={activeTab} />

        {/* Dynamic content scroll frame */}
        <main className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {renderContent()}

            {/* Live Operations Audit Trail component - persistent at bottom for rich rule observability */}
            <AuditLogViewer />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
