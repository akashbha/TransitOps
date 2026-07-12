/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  "Fleet Manager" | "Dispatcher" | "Safety Officer" | "Financial Analyst";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type VehicleType = "Truck" | "Van" | "Sedan" | "Box Truck";
export type Region = "North" | "South" | "East" | "West";

export interface Vehicle {
  id: string;
  registrationNumber: string; // Must be unique
  name: string;
  type: VehicleType;
  maxCapacity: number; // in kg
  odometer: number; // in km
  lastMaintenanceOdometer: number; // in km
  acquisitionCost: number; // in USD
  status: VehicleStatus;
  region: Region;
}

export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // YYYY-MM-DD
  contactNumber: string;
  safetyScore: number; // 0-100
  status: DriverStatus;
}

export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  status: TripStatus;
  createdAt: string;
  completedAt?: string;
  finalOdometer?: number; // in km
  fuelConsumed?: number; // in liters
  revenue?: number; // in USD (to calculate ROI)
}

export type MaintenanceStatus = "Active" | "Completed";

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  cost: number; // in USD
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status: MaintenanceStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number; // in USD
  date: string; // YYYY-MM-DD
}

export type ExpenseCategory =
  "Toll" | "Maintenance" | "Fuel" | "Insurance" | "Permits" | "Other";

export interface Expense {
  id: string;
  vehicleId: string;
  tripId?: string;
  category: ExpenseCategory;
  amount: number; // in USD
  date: string; // YYYY-MM-DD
  description: string;
}

export interface OperationalMetrics {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number; // %
}
