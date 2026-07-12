/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";
import {
  Shield,
  User,
  RefreshCw,
  Calendar,
  Flame,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { currentUser, switchRole, users, drivers, theme, toggleTheme } =
    useApp();

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "Fleet Manager":
        return "bg-blue-50 text-blue-750 border-blue-200";
      case "Dispatcher":
        return "bg-purple-50 text-purple-750 border-purple-200";
      case "Safety Officer":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Financial Analyst":
        return "bg-emerald-50 text-emerald-750 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Find compliance alerts for header
  const expiredLicenses = drivers.filter((d) => d.licenseExpiry < "2026-07-11");
  const criticalSafety = drivers.filter((d) => d.safetyScore < 80);

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-5 shadow-xs">
      {/* Title & Date */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 capitalize leading-none">
            {activeTab.replace("-", " ")}
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>Today: Saturday, July 11, 2026</span>
          </div>
        </div>

        {/* Rapid Alerts */}
        <div className="hidden lg:flex items-center gap-2 ml-3">
          {expiredLicenses.length > 0 && (
            <div className="flex items-center gap-1 rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              <span>
                {expiredLicenses.length} Expired License
                {expiredLicenses.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {criticalSafety.length > 0 && (
            <div className="flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <Flame className="h-3 w-3" />
              <span>{criticalSafety.length} Low Safety Drivers</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Bypass Selector & User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Simulator Box */}
        <div className="flex items-center gap-2 rounded bg-slate-50 border border-slate-200 p-0.5 px-2">
          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            <RefreshCw className="h-2.5 w-2.5 animate-spin-slow text-indigo-500" />
            Role:
          </span>
          <div className="flex gap-1">
            {users.map((u) => (
              <button
                key={u.role}
                onClick={async () => {
                  await switchRole(u.role);
                }}
                title={`Impersonate ${u.name} (${u.role})`}
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition-all duration-150 ${
                  currentUser?.role === u.role
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                {u.role.split(" ")[0]}{" "}
                {/* Shorten for space (Fleet, Driver, Safety, Financial) */}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={
            theme === "dark"
              ? "Switch to Light Mode"
              : "Switch to High-Contrast Dark Mode"
          }
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {/* Current User Display */}
        {currentUser ? (
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="hidden text-right md:block">
              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                {currentUser.name}
              </p>
              <span
                className={`inline-block rounded border px-1 py-0.25 text-[9px] font-bold mt-0.5 ${getRoleBadgeColor(
                  currentUser.role,
                )}`}
              >
                {currentUser.role}
              </span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 border border-slate-200 text-slate-600">
              <User className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600 border border-slate-200">
            <Shield className="h-3 w-3 text-red-500" />
            <span>Unauthorized</span>
          </div>
        )}
      </div>
    </header>
  );
};
