/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Wrench,
  DollarSign,
  Terminal,
  ShieldAlert,
  LogOut,
  Navigation,
  BarChart2,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { currentUser, logout } = useApp();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: [
        "Fleet Manager",
        "Dispatcher",
        "Safety Officer",
        "Financial Analyst",
      ],
    },
    {
      id: "vehicles",
      label: "Vehicle Registry",
      icon: Truck,
      roles: [
        "Fleet Manager",
        "Dispatcher",
        "Safety Officer",
        "Financial Analyst",
      ],
    },
    {
      id: "drivers",
      label: "Driver Management",
      icon: Users,
      roles: [
        "Fleet Manager",
        "Dispatcher",
        "Safety Officer",
        "Financial Analyst",
      ],
    },
    {
      id: "trips",
      label: "Trip Management",
      icon: MapPin,
      roles: [
        "Fleet Manager",
        "Dispatcher",
        "Safety Officer",
        "Financial Analyst",
      ],
    },
    {
      id: "maintenance",
      label: "Maintenance Log",
      icon: Wrench,
      roles: ["Fleet Manager", "Dispatcher", "Financial Analyst"],
    },
    {
      id: "expenses",
      label: "Fuel & Expenses",
      icon: DollarSign,
      roles: ["Fleet Manager", "Financial Analyst"],
    },
    {
      id: "analytics",
      label: "Advanced Analytics",
      icon: BarChart2,
      roles: ["Fleet Manager", "Financial Analyst"],
    },
  ];

  React.useEffect(() => {
    const currentItem = menuItems.find((item) => item.id === activeTab);
    if (currentItem && !currentItem.roles.includes(currentUser?.role || "")) {
      setActiveTab("dashboard");
    }
  }, [currentUser?.role, activeTab, setActiveTab]);

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-slate-200 bg-white text-slate-700 select-none">
      {/* Brand Logo */}
      <div className="flex h-14 items-center gap-2 px-5 border-b border-slate-200 bg-white">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 font-bold text-white shadow shadow-indigo-600/10">
          <Navigation className="h-4.5 w-4.5 rotate-45 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-slate-900 leading-none block">
            TransitOps
          </span>
          <span className="text-[9px] font-bold text-indigo-600 tracking-wider uppercase block mt-0.5">
            Fleet Console
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <span className="px-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          Main Menu
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isAccessible = item.roles.includes(currentUser?.role || "");

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isAccessible) {
                  setActiveTab(item.id);
                }
              }}
              disabled={!isAccessible}
              className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-xs font-medium transition-all duration-150 group relative ${
                !isAccessible
                  ? "opacity-40 cursor-not-allowed text-slate-400"
                  : activeTab === item.id
                    ? "bg-slate-100 text-slate-950 font-semibold border-l-2 border-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`h-4 w-4 transition-colors duration-150 ${
                    activeTab === item.id
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {/* Role Restricted indicator helper */}
              {!isAccessible && (
                <ShieldAlert
                  className="h-3.5 w-3.5 text-slate-450 group-hover:text-amber-650"
                  title="Restricted view role"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info / Log Out */}
      <div className="border-t border-slate-200 p-3 bg-slate-50">
        {currentUser && (
          <div className="rounded border border-slate-200 bg-white p-2.5 mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Session Active
              </span>
            </div>
            <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
              {currentUser.email}
            </p>
          </div>
        )}

        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-650 transition-colors duration-150"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};
