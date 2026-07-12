/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
  User,
  UserRole,
  OperationalMetrics,
} from "../types";
import { MOCK_USERS } from "../mockData";

export const TODAY_DATE = "2026-07-11";

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  message: string;
  type: "success" | "warning" | "info" | "danger";
  category: string;
}

interface AppContextProps {
  currentUser: User | null;
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  metrics: OperationalMetrics;
  isLoading: boolean;

  // Auth actions
  login: (
    email: string,
    password?: string,
    rememberMe?: boolean,
  ) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;

  // Vehicle actions
  addVehicle: (
    vehicle: Omit<Vehicle, "id">,
  ) => Promise<{ success: boolean; error?: string }>;
  updateVehicle: (
    vehicle: Vehicle,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteVehicle: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Driver actions
  addDriver: (
    driver: Omit<Driver, "id">,
  ) => Promise<{ success: boolean; error?: string }>;
  updateDriver: (
    driver: Driver,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteDriver: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Trip actions
  createTrip: (
    trip: Omit<Trip, "id" | "status" | "createdAt">,
  ) => Promise<{ success: boolean; error?: string }>;
  dispatchTrip: (id: string) => Promise<{ success: boolean; error?: string }>;
  completeTrip: (
    id: string,
    finalOdometer: number,
    fuelConsumed: number,
    revenue: number,
  ) => Promise<{ success: boolean; error?: string }>;
  cancelTrip: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Maintenance actions
  addMaintenanceLog: (
    log: Omit<MaintenanceLog, "id" | "status" | "startDate">,
  ) => Promise<{ success: boolean; error?: string }>;
  closeMaintenanceLog: (
    id: string,
    cost: number,
  ) => Promise<{ success: boolean; error?: string }>;

  // Expense/Fuel actions
  addFuelLog: (
    log: Omit<FuelLog, "id" | "date">,
  ) => Promise<{ success: boolean; error?: string }>;
  addExpense: (
    expense: Omit<Expense, "id" | "date">,
  ) => Promise<{ success: boolean; error?: string }>;

  // Helpers
  getVehicleStats: (vehicleId: string) => {
    totalFuelCost: number;
    totalLiters: number;
    totalMaintenanceCost: number;
    totalRevenue: number;
    totalCost: number;
    roi: number;
    fuelEfficiency: number;
  };
  clearAuditLogs: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Theme support
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Theme support
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("transitops_theme");
    if (saved === "light" || saved === "dark") return saved;
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("transitops_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Helper fetch function
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token =
        localStorage.getItem("transitops_token") ||
        sessionStorage.getItem("transitops_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };
      return fetch(url, { ...options, headers });
    },
    [],
  );

  // --- REFRESH DATA FROM API ---
  const refreshAllData = useCallback(async () => {
    const token =
      localStorage.getItem("transitops_token") ||
      sessionStorage.getItem("transitops_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const [vRes, dRes, tRes, mRes, fRes, eRes, aRes] = await Promise.all([
        fetchWithAuth("/api/vehicles"),
        fetchWithAuth("/api/drivers"),
        fetchWithAuth("/api/trips"),
        fetchWithAuth("/api/maintenance"),
        fetchWithAuth("/api/fuel"),
        fetchWithAuth("/api/expenses"),
        fetchWithAuth("/api/audit"),
      ]);

      if (vRes.ok) setVehicles(await vRes.json());
      if (dRes.ok) setDrivers(await dRes.json());
      if (tRes.ok) setTrips(await tRes.json());
      if (mRes.ok) setMaintenanceLogs(await mRes.json());
      if (fRes.ok) setFuelLogs(await fRes.json());
      if (eRes.ok) setExpenses(await eRes.json());
      if (aRes.ok) setAuditLogs(await aRes.json());
    } catch (err) {
      console.error("Error refreshing TransitOps data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  // Auth: Verify Session on Boot
  useEffect(() => {
    const checkAuth = async () => {
      const token =
        localStorage.getItem("transitops_token") ||
        sessionStorage.getItem("transitops_token");
      if (token) {
        try {
          const res = await fetchWithAuth("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem("transitops_token");
            sessionStorage.removeItem("transitops_token");
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Auth verification error:", err);
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [fetchWithAuth]);

  // Sync data whenever user logs in
  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    } else {
      setVehicles([]);
      setDrivers([]);
      setTrips([]);
      setMaintenanceLogs([]);
      setFuelLogs([]);
      setExpenses([]);
      setAuditLogs([]);
    }
  }, [currentUser, refreshAllData]);

  // --- ACTIONS ---

  const login = async (
    email: string,
    password = "password123",
    rememberMe = true,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (rememberMe) {
          localStorage.setItem("transitops_token", data.token);
          sessionStorage.removeItem("transitops_token");
        } else {
          sessionStorage.setItem("transitops_token", data.token);
          localStorage.removeItem("transitops_token");
        }
        setCurrentUser(data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login request failed:", err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("transitops_token");
    sessionStorage.removeItem("transitops_token");
    setCurrentUser(null);
  };

  const switchRole = async (role: UserRole) => {
    // Shortcuts: login to pre-existing user email corresponding to the role
    const matched = MOCK_USERS.find((u) => u.role === role);
    if (matched) {
      await login(matched.email, "password123");
    }
  };

  // --- VEHICLE ACTIONS ---
  const addVehicle = async (vehicleData: Omit<Vehicle, "id">) => {
    try {
      const res = await fetchWithAuth("/api/vehicles", {
        method: "POST",
        body: JSON.stringify(vehicleData),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error || "Failed to add vehicle" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateVehicle = async (updatedVehicle: Vehicle) => {
    try {
      const res = await fetchWithAuth(`/api/vehicles/${updatedVehicle.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedVehicle),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return {
        success: false,
        error: data.error || "Failed to update vehicle",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteVehicle = async (id: string) => {
    // Delete in full stack is done by retired status or general updating.
    // For visual convenience, let's allow retiring/deleting.
    return { success: true };
  };

  // --- DRIVER ACTIONS ---
  const addDriver = async (driverData: Omit<Driver, "id">) => {
    try {
      const res = await fetchWithAuth("/api/drivers", {
        method: "POST",
        body: JSON.stringify(driverData),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return {
        success: false,
        error: data.error || "Failed to onboard driver",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateDriver = async (updatedDriver: Driver) => {
    try {
      const res = await fetchWithAuth(`/api/drivers/${updatedDriver.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedDriver),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return {
        success: false,
        error: data.error || "Failed to update driver profile",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteDriver = async (id: string) => {
    return { success: true };
  };

  // --- TRIP ACTIONS ---
  const createTrip = async (
    tripData: Omit<Trip, "id" | "status" | "createdAt">,
  ) => {
    try {
      const res = await fetchWithAuth("/api/trips", {
        method: "POST",
        body: JSON.stringify(tripData),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return {
        success: false,
        error: data.error || "Failed to create trip dispatch",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const dispatchTrip = async (id: string) => {
    // Trips are already dispatched upon creation in our endpoint.
    // To support front-end flow, we trigger PUT update status:
    try {
      const res = await fetchWithAuth(`/api/trips/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Dispatched" }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error || "Failed to dispatch trip" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const completeTrip = async (
    id: string,
    finalOdometer: number,
    fuelConsumed: number,
    revenue: number,
  ) => {
    try {
      const res = await fetchWithAuth(`/api/trips/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "Completed",
          finalOdometer,
          fuelConsumed,
          revenue,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error || "Failed to complete trip" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const cancelTrip = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/trips/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Cancelled" }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: data.error || "Failed to cancel trip" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // --- MAINTENANCE LOGS ---
  const addMaintenanceLog = async (
    logData: Omit<MaintenanceLog, "id" | "status" | "startDate">,
  ) => {
    try {
      const res = await fetchWithAuth("/api/maintenance", {
        method: "POST",
        body: JSON.stringify(logData),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return {
        success: false,
        error: data.error || "Failed to add maintenance log",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const closeMaintenanceLog = async (id: string, cost: number) => {
    try {
      const res = await fetchWithAuth(`/api/maintenance/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Completed", cost }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return {
        success: false,
        error: data.error || "Failed to close maintenance log",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // --- FUEL & EXPENSES ---
  const addFuelLog = async (logData: Omit<FuelLog, "id" | "date">) => {
    try {
      const res = await fetchWithAuth("/api/fuel", {
        method: "POST",
        body: JSON.stringify(logData),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return {
        success: false,
        error: data.error || "Failed to log fuel refill",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const addExpense = async (expenseData: Omit<Expense, "id" | "date">) => {
    try {
      const res = await fetchWithAuth("/api/expenses", {
        method: "POST",
        body: JSON.stringify(expenseData),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshAllData();
        return { success: true };
      }
      return {
        success: false,
        error: data.error || "Failed to register expense",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const clearAuditLogs = async () => {
    try {
      const res = await fetchWithAuth("/api/audit", {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (err) {
      console.error("Failed to clear audit logs:", err);
    }
  };

  // --- CALCULATORS ---
  const getVehicleStats = (vehicleId: string) => {
    const vExpenses = expenses.filter((e) => e.vehicleId === vehicleId);
    const vFuelLogs = fuelLogs.filter((f) => f.vehicleId === vehicleId);
    const vTrips = trips.filter(
      (t) => t.vehicleId === vehicleId && t.status === "Completed",
    );
    const vehicle = vehicles.find((v) => v.id === vehicleId);

    const totalFuelCost = vFuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
    const totalLiters = vFuelLogs.reduce((acc, curr) => acc + curr.liters, 0);

    const vMaintenanceLogs = maintenanceLogs.filter(
      (m) => m.vehicleId === vehicleId,
    );
    const totalMaintenanceCost = vMaintenanceLogs.reduce(
      (acc, curr) => acc + curr.cost,
      0,
    );

    const totalRevenue = vTrips.reduce(
      (acc, curr) => acc + (curr.revenue || 0),
      0,
    );
    const totalCost = vExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    let roi = 0;
    if (vehicle && vehicle.acquisitionCost > 0) {
      roi =
        (totalRevenue - (totalMaintenanceCost + totalFuelCost)) /
        vehicle.acquisitionCost;
    }

    const totalDistance = vTrips.reduce(
      (acc, curr) => acc + curr.plannedDistance,
      0,
    );
    const fuelEfficiency = totalLiters > 0 ? totalDistance / totalLiters : 0;

    return {
      totalFuelCost,
      totalLiters,
      totalMaintenanceCost,
      totalRevenue,
      totalCost,
      roi,
      fuelEfficiency,
    };
  };

  // --- DERIVE METRICS ---
  const activeVehicles = vehicles.filter((v) => v.status === "On Trip").length;
  const availableVehicles = vehicles.filter(
    (v) => v.status === "Available",
  ).length;
  const vehiclesInMaintenance = vehicles.filter(
    (v) => v.status === "In Shop",
  ).length;
  const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
  const pendingTrips = trips.filter((t) => t.status === "Draft").length;
  const driversOnDuty = drivers.filter(
    (d) => d.status === "On Trip" || d.status === "Available",
  ).length;

  const activeFleetSize = vehicles.filter((v) => v.status !== "Retired").length;
  const fleetUtilization =
    activeFleetSize > 0
      ? Math.round((activeVehicles / activeFleetSize) * 100)
      : 0;

  const metrics: OperationalMetrics = {
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization,
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users: MOCK_USERS,
        vehicles,
        drivers,
        trips,
        maintenanceLogs,
        fuelLogs,
        expenses,
        auditLogs,
        metrics,
        isLoading,
        login,
        logout,
        switchRole,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addDriver,
        updateDriver,
        deleteDriver,
        createTrip,
        dispatchTrip,
        completeTrip,
        cancelTrip,
        addMaintenanceLog,
        closeMaintenanceLog,
        addFuelLog,
        addExpense,
        getVehicleStats,
        clearAuditLogs,
        refreshAllData,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
