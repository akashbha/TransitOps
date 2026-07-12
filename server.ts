import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Sequelize, DataTypes, Model, Op } from "./src/db/customSequelize";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-transitops-key";
const PORT = 3000;

// Initialize Sequelize with SQLite in-memory or a persistent local file
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "transitops.sqlite"),
  logging: false,
});

// --- MODELS ---

class UserModel extends Model {
  public id!: string;
  public email!: string;
  public name!: string;
  public role!: string;
  public passwordHash!: string;
}

UserModel.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "User", tableName: "users" },
);

class VehicleModel extends Model {
  public id!: string;
  public registrationNumber!: string;
  public name!: string;
  public type!: string;
  public maxCapacity!: number;
  public odometer!: number;
  public lastMaintenanceOdometer!: number;
  public acquisitionCost!: number;
  public status!: string;
  public region!: string;
}

VehicleModel.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    registrationNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    maxCapacity: { type: DataTypes.INTEGER, allowNull: false },
    odometer: { type: DataTypes.INTEGER, allowNull: false },
    lastMaintenanceOdometer: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    acquisitionCost: { type: DataTypes.DOUBLE, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false },
    region: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "Vehicle", tableName: "vehicles" },
);

class DriverModel extends Model {
  public id!: string;
  public name!: string;
  public licenseNumber!: string;
  public licenseCategory!: string;
  public licenseExpiry!: string;
  public contactNumber!: string;
  public safetyScore!: number;
  public status!: string;
}

DriverModel.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    licenseNumber: { type: DataTypes.STRING, allowNull: false },
    licenseCategory: { type: DataTypes.STRING, allowNull: false },
    licenseExpiry: { type: DataTypes.STRING, allowNull: false },
    contactNumber: { type: DataTypes.STRING, allowNull: false },
    safetyScore: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "Driver", tableName: "drivers" },
);

class TripModel extends Model {
  public id!: string;
  public source!: string;
  public destination!: string;
  public vehicleId!: string;
  public driverId!: string;
  public cargoWeight!: number;
  public plannedDistance!: number;
  public status!: string;
  public createdAt!: string;
  public completedAt!: string | null;
  public finalOdometer!: number | null;
  public fuelConsumed!: number | null;
  public revenue!: number | null;
}

TripModel.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    source: { type: DataTypes.STRING, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    vehicleId: { type: DataTypes.STRING, allowNull: false },
    driverId: { type: DataTypes.STRING, allowNull: false },
    cargoWeight: { type: DataTypes.INTEGER, allowNull: false },
    plannedDistance: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.STRING, allowNull: false },
    completedAt: { type: DataTypes.STRING, allowNull: true },
    finalOdometer: { type: DataTypes.INTEGER, allowNull: true },
    fuelConsumed: { type: DataTypes.DOUBLE, allowNull: true },
    revenue: { type: DataTypes.DOUBLE, allowNull: true },
  },
  { sequelize, modelName: "Trip", tableName: "trips" },
);

class MaintenanceLogModel extends Model {
  public id!: string;
  public vehicleId!: string;
  public description!: string;
  public cost!: number;
  public startDate!: string;
  public endDate!: string | null;
  public status!: string;
}

MaintenanceLogModel.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    vehicleId: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    cost: { type: DataTypes.DOUBLE, allowNull: false },
    startDate: { type: DataTypes.STRING, allowNull: false },
    endDate: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "MaintenanceLog", tableName: "maintenance_logs" },
);

class FuelLogModel extends Model {
  public id!: string;
  public vehicleId!: string;
  public tripId!: string | null;
  public liters!: number;
  public cost!: number;
  public date!: string;
}

FuelLogModel.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    vehicleId: { type: DataTypes.STRING, allowNull: false },
    tripId: { type: DataTypes.STRING, allowNull: true },
    liters: { type: DataTypes.DOUBLE, allowNull: false },
    cost: { type: DataTypes.DOUBLE, allowNull: false },
    date: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "FuelLog", tableName: "fuel_logs" },
);

class ExpenseModel extends Model {
  public id!: string;
  public vehicleId!: string;
  public tripId!: string | null;
  public category!: string;
  public amount!: number;
  public date!: string;
  public description!: string;
}

ExpenseModel.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    vehicleId: { type: DataTypes.STRING, allowNull: false },
    tripId: { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DOUBLE, allowNull: false },
    date: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "Expense", tableName: "expenses" },
);

class AuditLogModel extends Model {
  public id!: string;
  public timestamp!: string;
  public userEmail!: string;
  public message!: string;
  public type!: string;
  public category!: string;
}

AuditLogModel.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    timestamp: { type: DataTypes.STRING, allowNull: false },
    userEmail: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "AuditLog", tableName: "audit_logs" },
);

// --- SEED DATABASE ---

async function seedDatabase() {
  await sequelize.sync();

  // Wipe if it's the old USA seed to migrate to beautiful Indian locations
  const hasOldTrip = await TripModel.findOne({
    where: { source: "Dallas Warehouse A" },
  });
  if (hasOldTrip) {
    console.log(
      "Old USA seed detected. Migrating database to beautiful Indian locations...",
    );
    await UserModel.destroy({ where: {} });
    await VehicleModel.destroy({ where: {} });
    await DriverModel.destroy({ where: {} });
    await TripModel.destroy({ where: {} });
    await MaintenanceLogModel.destroy({ where: {} });
    await FuelLogModel.destroy({ where: {} });
    await ExpenseModel.destroy({ where: {} });
    await AuditLogModel.destroy({ where: {} });
  }

  const userCount = await UserModel.count();
  const vehicleCount = await VehicleModel.count();

  if (userCount === 0 || vehicleCount <= 7) {
    console.log("Seeding or Enriching Database with Mock Data...");
    await UserModel.destroy({ where: {} });
    await VehicleModel.destroy({ where: {} });
    await DriverModel.destroy({ where: {} });
    await TripModel.destroy({ where: {} });
    await MaintenanceLogModel.destroy({ where: {} });
    await FuelLogModel.destroy({ where: {} });
    await ExpenseModel.destroy({ where: {} });
    await AuditLogModel.destroy({ where: {} });

    // Hash passwords for the pre-configured accounts
    const passwordHash = await bcrypt.hash("password123", 10);

    const MOCK_USERS = [
      {
        id: "user-1",
        email: "manager@transitops.com",
        name: "Marcus Vance",
        role: "Fleet Manager",
        passwordHash,
      },
      {
        id: "user-2",
        email: "driver@transitops.com",
        name: "Alex Mercer",
        role: "Dispatcher",
        passwordHash,
      },
      {
        id: "user-3",
        email: "safety@transitops.com",
        name: "Sarah Connor",
        role: "Safety Officer",
        passwordHash,
      },
      {
        id: "user-4",
        email: "analyst@transitops.com",
        name: "Fiona Gallagher",
        role: "Financial Analyst",
        passwordHash,
      },
    ];

    await UserModel.bulkCreate(MOCK_USERS);

    const INITIAL_VEHICLES = [
      {
        id: "v-1",
        registrationNumber: "MH-12-PQ-4567",
        name: "Tata Ace Gold CNG",
        type: "Van",
        maxCapacity: 1200,
        odometer: 45200,
        lastMaintenanceOdometer: 45000,
        acquisitionCost: 35000,
        status: "Available",
        region: "North",
      },
      {
        id: "v-2",
        registrationNumber: "DL-3C-AB-1234",
        name: "Tata Ultra T.11 Box Truck",
        type: "Box Truck",
        maxCapacity: 7500,
        odometer: 112400,
        lastMaintenanceOdometer: 110000,
        acquisitionCost: 85000,
        status: "On Trip",
        region: "West",
      },
      {
        id: "v-3",
        registrationNumber: "KA-03-MJ-7890",
        name: "BharatBenz 2823R Heavy Truck",
        type: "Truck",
        maxCapacity: 18000,
        odometer: 289100,
        lastMaintenanceOdometer: 285000,
        acquisitionCost: 145000,
        status: "In Shop",
        region: "East",
      },
      {
        id: "v-4",
        registrationNumber: "TN-07-CS-5678",
        name: "Force Traveller 3350 Delivery",
        type: "Van",
        maxCapacity: 1500,
        odometer: 32000,
        lastMaintenanceOdometer: 30000,
        acquisitionCost: 48000,
        status: "Available",
        region: "South",
      },
      {
        id: "v-5",
        registrationNumber: "HR-26-AT-9012",
        name: "Maruti Suzuki Super Carry",
        type: "Van",
        maxCapacity: 650,
        odometer: 12000,
        lastMaintenanceOdometer: 10000,
        acquisitionCost: 24000,
        status: "Available",
        region: "West",
      },
      {
        id: "v-6",
        registrationNumber: "GJ-01-XX-3456",
        name: "Eicher Pro 2049 Box Truck",
        type: "Box Truck",
        maxCapacity: 5000,
        odometer: 98000,
        lastMaintenanceOdometer: 95000,
        acquisitionCost: 65000,
        status: "Retired",
        region: "North",
      },
      {
        id: "v-7",
        registrationNumber: "UP-16-BZ-8844",
        name: "Ashok Leyland Dost Strong",
        type: "Truck",
        maxCapacity: 9000,
        odometer: 54000,
        lastMaintenanceOdometer: 50000,
        acquisitionCost: 72000,
        status: "Available",
        region: "South",
      },
      {
        id: "v-8",
        registrationNumber: "MH-43-AL-9988",
        name: "Tata Signa 2821.T Heavy Cargo",
        type: "Truck",
        maxCapacity: 20000,
        odometer: 78200,
        lastMaintenanceOdometer: 75000,
        acquisitionCost: 160000,
        status: "On Trip",
        region: "West",
      },
      {
        id: "v-9",
        registrationNumber: "KA-51-AB-4545",
        name: "Mahindra Bolero Pik-Up",
        type: "Van",
        maxCapacity: 1700,
        odometer: 15400,
        lastMaintenanceOdometer: 15000,
        acquisitionCost: 26000,
        status: "On Trip",
        region: "South",
      },
      {
        id: "v-10",
        registrationNumber: "HR-55-CC-1212",
        name: "Eicher Pro 3019 Box Truck",
        type: "Box Truck",
        maxCapacity: 11000,
        odometer: 162300,
        lastMaintenanceOdometer: 160000,
        acquisitionCost: 92000,
        status: "Available",
        region: "North",
      },
      {
        id: "v-11",
        registrationNumber: "WB-02-HH-7766",
        name: "Ashok Leyland Partner Super",
        type: "Box Truck",
        maxCapacity: 4000,
        odometer: 45800,
        lastMaintenanceOdometer: 41000,
        acquisitionCost: 51000,
        status: "In Shop",
        region: "East",
      },
      {
        id: "v-12",
        registrationNumber: "MH-12-XX-8822",
        name: "Tata Winger Cargo Van",
        type: "Van",
        maxCapacity: 1600,
        odometer: 25600,
        lastMaintenanceOdometer: 25000,
        acquisitionCost: 38000,
        status: "Available",
        region: "West",
      },
      {
        id: "v-13",
        registrationNumber: "DL-1A-ZZ-3030",
        name: "BharatBenz 3528T Tipper",
        type: "Truck",
        maxCapacity: 28000,
        odometer: 120500,
        lastMaintenanceOdometer: 120000,
        acquisitionCost: 185000,
        status: "Available",
        region: "North",
      },
      {
        id: "v-14",
        registrationNumber: "AP-10-YY-5555",
        name: "Mahindra Supro Profit Truck",
        type: "Van",
        maxCapacity: 900,
        odometer: 8400,
        lastMaintenanceOdometer: 8000,
        acquisitionCost: 18000,
        status: "Available",
        region: "South",
      },
      {
        id: "v-15",
        registrationNumber: "AS-01-DD-1122",
        name: "Tata LPT 1913 Cowl Truck",
        type: "Truck",
        maxCapacity: 14000,
        odometer: 135000,
        lastMaintenanceOdometer: 130000,
        acquisitionCost: 110000,
        status: "On Trip",
        region: "East",
      },
    ];

    await VehicleModel.bulkCreate(INITIAL_VEHICLES);

    const INITIAL_DRIVERS = [
      {
        id: "d-1",
        name: "Rajesh Kumar",
        licenseNumber: "DL-MH12-2015-098",
        licenseCategory: "Class A CDL",
        licenseExpiry: "2027-11-15",
        contactNumber: "+91 98765 43210",
        safetyScore: 94,
        status: "Available",
      },
      {
        id: "d-2",
        name: "Amir Patel",
        licenseNumber: "DL-DL03-2018-456",
        licenseCategory: "Class B CDL",
        licenseExpiry: "2026-07-28",
        contactNumber: "+91 87654 32109",
        safetyScore: 98,
        status: "On Trip",
      },
      {
        id: "d-3",
        name: "Gurpreet Singh",
        licenseNumber: "DL-PB02-2010-771",
        licenseCategory: "Class A CDL",
        licenseExpiry: "2026-06-30",
        contactNumber: "+91 76543 21098",
        safetyScore: 68,
        status: "Suspended",
      },
      {
        id: "d-4",
        name: "Srinivas Murthy",
        licenseNumber: "DL-KA03-2012-900",
        licenseCategory: "Class C Standard",
        licenseExpiry: "2028-02-19",
        contactNumber: "+91 65432 10987",
        safetyScore: 85,
        status: "Available",
      },
      {
        id: "d-5",
        name: "Priyanka Sen",
        licenseNumber: "DL-WB01-2019-100",
        licenseCategory: "Class A CDL",
        licenseExpiry: "2027-05-10",
        contactNumber: "+91 54321 09876",
        safetyScore: 91,
        status: "Available",
      },
      {
        id: "d-6",
        name: "Vijay Yadav",
        licenseNumber: "DL-UP16-2014-449",
        licenseCategory: "Class B CDL",
        licenseExpiry: "2028-10-04",
        contactNumber: "+91 91234 56789",
        safetyScore: 89,
        status: "Off Duty",
      },
      {
        id: "d-7",
        name: "Aniket Sawant",
        licenseNumber: "DL-MH43-2016-880",
        licenseCategory: "Class A CDL",
        licenseExpiry: "2027-09-22",
        contactNumber: "+91 95432 11223",
        safetyScore: 92,
        status: "On Trip",
      },
      {
        id: "d-8",
        name: "Baldev Singh",
        licenseNumber: "DL-PB02-2015-321",
        licenseCategory: "Class B CDL",
        licenseExpiry: "2028-01-12",
        contactNumber: "+91 81234 98765",
        safetyScore: 81,
        status: "Available",
      },
      {
        id: "d-9",
        name: "Karthik Raja",
        licenseNumber: "DL-TN07-2019-556",
        licenseCategory: "Class A CDL",
        licenseExpiry: "2026-08-15",
        contactNumber: "+91 74321 00998",
        safetyScore: 95,
        status: "On Trip",
      },
      {
        id: "d-10",
        name: "Arjun Das",
        licenseNumber: "DL-WB02-2020-112",
        licenseCategory: "Class B CDL",
        licenseExpiry: "2027-03-30",
        contactNumber: "+91 99887 76655",
        safetyScore: 78,
        status: "On Trip",
      },
      {
        id: "d-11",
        name: "Sandeep Hooda",
        licenseNumber: "DL-HR26-2013-404",
        licenseCategory: "Class A CDL",
        licenseExpiry: "2029-05-25",
        contactNumber: "+91 90011 22334",
        safetyScore: 87,
        status: "Available",
      },
      {
        id: "d-12",
        name: "Meera Nair",
        licenseNumber: "DL-KL01-2022-777",
        licenseCategory: "Class C Standard",
        licenseExpiry: "2028-12-05",
        contactNumber: "+91 88899 90011",
        safetyScore: 96,
        status: "Available",
      },
    ];

    await DriverModel.bulkCreate(INITIAL_DRIVERS);

    const INITIAL_TRIPS = [
      {
        id: "t-1",
        source: "Mumbai JNPT Port Terminal",
        destination: "Pune Bhosari Industrial Depot",
        vehicleId: "v-2",
        driverId: "d-2",
        cargoWeight: 4500,
        plannedDistance: 125,
        status: "Dispatched",
        createdAt: "2026-07-11T08:30:00Z",
        revenue: 1200,
      },
      {
        id: "t-2",
        source: "Delhi Okhla Logistics Center",
        destination: "Gurugram CyberCity Hub",
        vehicleId: "v-1",
        driverId: "d-1",
        cargoWeight: 950,
        plannedDistance: 45,
        status: "Completed",
        createdAt: "2026-07-09T07:00:00Z",
        completedAt: "2026-07-09T14:30:00Z",
        finalOdometer: 45200,
        fuelConsumed: 55,
        revenue: 950,
      },
      {
        id: "t-3",
        source: "Chennai Oragadam Plant",
        destination: "Bangalore Whitefield Terminal",
        vehicleId: "v-4",
        driverId: "d-4",
        cargoWeight: 1100,
        plannedDistance: 350,
        status: "Completed",
        createdAt: "2026-07-10T09:15:00Z",
        completedAt: "2026-07-10T15:45:00Z",
        finalOdometer: 32000,
        fuelConsumed: 48,
        revenue: 800,
      },
      {
        id: "t-4",
        source: "Noida Sector 62 Warehouse",
        destination: "Kanpur Transport Nagar Depot",
        vehicleId: "v-5",
        driverId: "d-5",
        cargoWeight: 400,
        plannedDistance: 480,
        status: "Draft",
        createdAt: "2026-07-11T14:00:00Z",
        revenue: 750,
      },
      {
        id: "t-5",
        source: "Ahmedabad Sanand GIDC",
        destination: "Mumbai Port Terminal",
        vehicleId: "v-8",
        driverId: "d-7",
        cargoWeight: 15500,
        plannedDistance: 540,
        status: "Dispatched",
        createdAt: "2026-07-11T10:00:00Z",
        revenue: 3800,
      },
      {
        id: "t-6",
        source: "Bangalore Whitefield Terminal",
        destination: "Chennai Harbour",
        vehicleId: "v-9",
        driverId: "d-9",
        cargoWeight: 1200,
        plannedDistance: 360,
        status: "Dispatched",
        createdAt: "2026-07-11T11:15:00Z",
        revenue: 1900,
      },
      {
        id: "t-7",
        source: "Kolkata Salt Lake Hub",
        destination: "Guwahati Paltan Bazar Depot",
        vehicleId: "v-15",
        driverId: "d-10",
        cargoWeight: 1100,
        plannedDistance: 1000,
        status: "Dispatched",
        createdAt: "2026-07-11T06:00:00Z",
        revenue: 5800,
      },
      {
        id: "t-8",
        source: "Delhi Okhla Logistics Center",
        destination: "Chandigarh Phase 1 Depot",
        vehicleId: "v-10",
        driverId: "d-11",
        cargoWeight: 8500,
        plannedDistance: 260,
        status: "Draft",
        createdAt: "2026-07-11T15:30:00Z",
        revenue: 2100,
      },
      {
        id: "t-9",
        source: "Bangalore Whitefield Terminal",
        destination: "Hyderabad Gachibowli Logistics Hub",
        vehicleId: "v-12",
        driverId: "d-12",
        cargoWeight: 1300,
        plannedDistance: 570,
        status: "Draft",
        createdAt: "2026-07-11T16:45:00Z",
        revenue: 2400,
      },
      {
        id: "t-10",
        source: "Pune Bhosari Industrial Depot",
        destination: "Jaipur Transport Nagar",
        vehicleId: "v-12",
        driverId: "d-12",
        cargoWeight: 1400,
        plannedDistance: 960,
        status: "Completed",
        createdAt: "2026-07-07T08:00:00Z",
        completedAt: "2026-07-08T18:00:00Z",
        finalOdometer: 25600,
        fuelConsumed: 110,
        revenue: 4100,
      },
      {
        id: "t-11",
        source: "Jaipur Transport Nagar",
        destination: "Jodhpur GIDC Depot",
        vehicleId: "v-7",
        driverId: "d-11",
        cargoWeight: 7800,
        plannedDistance: 340,
        status: "Completed",
        createdAt: "2026-07-06T09:00:00Z",
        completedAt: "2026-07-06T17:00:00Z",
        finalOdometer: 54000,
        fuelConsumed: 45,
        revenue: 1650,
      },
    ];

    await TripModel.bulkCreate(INITIAL_TRIPS);

    const INITIAL_MAINTENANCE_LOGS = [
      {
        id: "m-1",
        vehicleId: "v-3",
        description: "Brake Pad Replacement & Engine Tuning",
        cost: 1450,
        startDate: "2026-07-10",
        status: "Active",
      },
      {
        id: "m-2",
        vehicleId: "v-1",
        description: "Routine oil change & tire rotation",
        cost: 180,
        startDate: "2026-07-05",
        endDate: "2026-07-05",
        status: "Completed",
      },
      {
        id: "m-3",
        vehicleId: "v-2",
        description: "A/C compressor servicing",
        cost: 450,
        startDate: "2026-06-20",
        endDate: "2026-06-21",
        status: "Completed",
      },
      {
        id: "m-4",
        vehicleId: "v-11",
        description: "Transmission fluid flush & gear alignment",
        cost: 1200,
        startDate: "2026-07-09",
        status: "Active",
      },
      {
        id: "m-5",
        vehicleId: "v-12",
        description: "Rear suspension shock absorbers replacement",
        cost: 850,
        startDate: "2026-07-02",
        endDate: "2026-07-03",
        status: "Completed",
      },
      {
        id: "m-6",
        vehicleId: "v-8",
        description: "Wheel balancing & alignment",
        cost: 350,
        startDate: "2026-07-06",
        endDate: "2026-07-06",
        status: "Completed",
      },
      {
        id: "m-7",
        vehicleId: "v-13",
        description: "Hydraulic pump repair & fluid top-up",
        cost: 2200,
        startDate: "2026-07-01",
        endDate: "2026-07-02",
        status: "Completed",
      },
    ];

    await MaintenanceLogModel.bulkCreate(INITIAL_MAINTENANCE_LOGS);

    const INITIAL_FUEL_LOGS = [
      {
        id: "f-1",
        vehicleId: "v-1",
        tripId: "t-2",
        liters: 55,
        cost: 88,
        date: "2026-07-09",
      },
      {
        id: "f-2",
        vehicleId: "v-4",
        tripId: "t-3",
        liters: 48,
        cost: 76.8,
        date: "2026-07-10",
      },
      {
        id: "f-3",
        vehicleId: "v-2",
        liters: 120,
        cost: 216,
        date: "2026-07-08",
      },
      {
        id: "f-4",
        vehicleId: "v-12",
        tripId: "t-10",
        liters: 110,
        cost: 9900,
        date: "2026-07-08",
      },
      {
        id: "f-5",
        vehicleId: "v-7",
        tripId: "t-11",
        liters: 45,
        cost: 4050,
        date: "2026-07-06",
      },
      {
        id: "f-6",
        vehicleId: "v-8",
        liters: 150,
        cost: 13500,
        date: "2026-07-05",
      },
      {
        id: "f-7",
        vehicleId: "v-10",
        liters: 95,
        cost: 8550,
        date: "2026-07-03",
      },
    ];

    await FuelLogModel.bulkCreate(INITIAL_FUEL_LOGS);

    const INITIAL_EXPENSES = [
      {
        id: "e-1",
        vehicleId: "v-1",
        tripId: "t-2",
        category: "Toll",
        amount: 35,
        date: "2026-07-09",
        description: "Mumbai-Pune Expressway Toll",
      },
      {
        id: "e-2",
        vehicleId: "v-4",
        tripId: "t-3",
        category: "Fuel",
        amount: 76.8,
        date: "2026-07-10",
        description: "Bharat Petroleum Chennai Refuel",
      },
      {
        id: "e-3",
        vehicleId: "v-1",
        category: "Maintenance",
        amount: 180,
        date: "2026-07-05",
        description: "Oil change routine expense",
      },
      {
        id: "e-9",
        vehicleId: "v-12",
        tripId: "t-10",
        category: "Fuel",
        amount: 9900,
        date: "2026-07-08",
        description: "IndianOil Fuel Card Refuel (110L)",
      },
      {
        id: "e-10",
        vehicleId: "v-7",
        tripId: "t-11",
        category: "Fuel",
        amount: 4050,
        date: "2026-07-06",
        description: "Bharat Petroleum Jodhpur Refuel (45L)",
      },
      {
        id: "e-11",
        vehicleId: "v-12",
        tripId: "t-10",
        category: "Toll",
        amount: 120,
        date: "2026-07-07",
        description: "NH-48 Toll Plaza - Western Route",
      },
      {
        id: "e-12",
        vehicleId: "v-7",
        tripId: "t-11",
        category: "Toll",
        amount: 80,
        date: "2026-07-06",
        description: "Jaipur Bypass Highway Toll",
      },
      {
        id: "e-13",
        vehicleId: "v-11",
        category: "Maintenance",
        amount: 1200,
        date: "2026-07-09",
        description: "Transmission fluid flush & gear alignment",
      },
      {
        id: "e-14",
        vehicleId: "v-12",
        category: "Maintenance",
        amount: 850,
        date: "2026-07-03",
        description: "Rear suspension shock absorbers replacement",
      },
      {
        id: "e-15",
        vehicleId: "v-13",
        category: "Maintenance",
        amount: 2200,
        date: "2026-07-02",
        description: "Hydraulic pump repair & fluid top-up",
      },
      {
        id: "e-16",
        vehicleId: "v-8",
        category: "Maintenance",
        amount: 350,
        date: "2026-07-06",
        description: "Wheel balancing & alignment",
      },
      {
        id: "e-17",
        vehicleId: "v-10",
        category: "Insurance",
        amount: 18500,
        date: "2026-07-01",
        description: "Annual commercial vehicle third-party insurance renewal",
      },
    ];

    await ExpenseModel.bulkCreate(INITIAL_EXPENSES);

    const INITIAL_AUDITS = [
      {
        id: "init-audit",
        timestamp: new Date().toISOString(),
        userEmail: "system@transitops.com",
        message:
          "TransitOps database initialized and enriched successfully with complete 15-vehicle relational seed data.",
        type: "info",
        category: "Database Sync",
      },
    ];

    await AuditLogModel.bulkCreate(INITIAL_AUDITS);

    console.log("Database Seeding and Enrichment Completed Successfully.");
  }
}

// --- SERVER INSTANCE ---

async function startServer() {
  await seedDatabase();

  const app = express();
  app.use(express.json());

  // --- MIDDLEWARES ---

  // Request Auth / JWT Extractor Middleware
  app.use((req: any, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
      } catch (err) {
        // Invalid token is treated as unauthenticated, but we don't crash
      }
    }
    next();
  });

  // RBAC Role Check Middleware
  const requireRole = (allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Session token missing or expired" });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({
            error: `Forbidden: Enforced server-side policy blocks ${req.user.role} role from this resource`,
          });
      }
      next();
    };
  };

  // Helper function to write an audit log
  const logToDatabase = async (
    email: string,
    message: string,
    type: "info" | "success" | "warning" | "danger",
    category: string,
  ) => {
    try {
      await AuditLogModel.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        userEmail: email,
        message,
        type,
        category,
      });
    } catch (err) {
      console.error("Audit logging failure:", err);
    }
  };

  // --- REST API ENDPOINTS ---

  // Auth: Login Route
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const user = await UserModel.findOne({
        where: { email: email.toLowerCase().trim() },
      });
      if (!user) {
        await logToDatabase(
          email,
          `Failed login attempt: non-existent email`,
          "warning",
          "Auth",
        );
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // If user exists, we check password. Since our seed uses 'password123', we check with bcrypt.
      const match = await bcrypt.compare(password || "", user.passwordHash);
      if (!match) {
        await logToDatabase(
          email,
          `Failed login attempt for account "${user.name}" (role: ${user.role}) - Invalid password`,
          "warning",
          "Auth",
        );
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      await logToDatabase(
        user.email,
        `Session authorized for "${user.name}" [${user.role}] via JWT auth.`,
        "success",
        "User Authentication",
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Auth: Get Current Profile
  app.get("/api/auth/me", (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.json({ user: req.user });
  });

  // --- VEHICLE ROUTES ---
  // Any role can view vehicles
  app.get(
    "/api/vehicles",
    requireRole([
      "Fleet Manager",
      "Dispatcher",
      "Safety Officer",
      "Financial Analyst",
    ]),
    async (req, res) => {
      try {
        const list = await VehicleModel.findAll();
        return res.json(list);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // Fleet Manager only can register a vehicle
  app.post(
    "/api/vehicles",
    requireRole(["Fleet Manager"]),
    async (req: any, res) => {
      try {
        const {
          registrationNumber,
          name,
          type,
          maxCapacity,
          odometer,
          acquisitionCost,
          status,
          region,
        } = req.body;

        // Unique validation
        const exists = await VehicleModel.findOne({
          where: { registrationNumber },
        });
        if (exists) {
          return res
            .status(400)
            .json({
              error: `Registration number ${registrationNumber} already registered`,
            });
        }

        const vehicle = await VehicleModel.create({
          id: `v-${Date.now()}`,
          registrationNumber,
          name,
          type,
          maxCapacity,
          odometer,
          acquisitionCost,
          status: status || "Available",
          region,
        });

        await logToDatabase(
          req.user.email,
          `Registered new asset: ${name} (${registrationNumber})`,
          "success",
          "Fleet Update",
        );
        return res.json(vehicle);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // Update vehicle status/mileage - Fleet Manager only
  app.put(
    "/api/vehicles/:id",
    requireRole(["Fleet Manager"]),
    async (req: any, res) => {
      try {
        const vehicle = await VehicleModel.findByPk(req.params.id);
        if (!vehicle) {
          return res.status(404).json({ error: "Vehicle not found" });
        }

        // If Dispatcher, restrict what they can do (dispatchers can only update status to/from trip and odometer)
        const allowedKeys =
          req.user.role === "Dispatcher"
            ? ["status", "odometer"]
            : [
                "registrationNumber",
                "name",
                "type",
                "maxCapacity",
                "odometer",
                "acquisitionCost",
                "status",
                "region",
              ];

        const updates: any = {};
        for (const key of allowedKeys) {
          if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
          }
        }

        await vehicle.update(updates);
        await logToDatabase(
          req.user.email,
          `Updated vehicle ${vehicle.name}: ${JSON.stringify(updates)}`,
          "info",
          "Fleet Update",
        );
        return res.json(vehicle);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // --- DRIVER ROUTES ---
  // Any role can view drivers
  app.get(
    "/api/drivers",
    requireRole([
      "Fleet Manager",
      "Dispatcher",
      "Safety Officer",
      "Financial Analyst",
    ]),
    async (req, res) => {
      try {
        const list = await DriverModel.findAll();
        return res.json(list);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // Safety Officer can add/update drivers
  app.post(
    "/api/drivers",
    requireRole(["Safety Officer"]),
    async (req: any, res) => {
      try {
        const {
          name,
          licenseNumber,
          licenseCategory,
          licenseExpiry,
          contactNumber,
          safetyScore,
          status,
        } = req.body;
        const driver = await DriverModel.create({
          id: `d-${Date.now()}`,
          name,
          licenseNumber,
          licenseCategory,
          licenseExpiry,
          contactNumber,
          safetyScore: safetyScore || 100,
          status: status || "Available",
        });

        await logToDatabase(
          req.user.email,
          `Onboarded new driver: ${name} (License: ${licenseNumber})`,
          "success",
          "Driver Registry",
        );
        return res.json(driver);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  app.put(
    "/api/drivers/:id",
    requireRole(["Safety Officer"]),
    async (req: any, res) => {
      try {
        const driver = await DriverModel.findByPk(req.params.id);
        if (!driver) {
          return res.status(404).json({ error: "Driver not found" });
        }

        await driver.update(req.body);
        await logToDatabase(
          req.user.email,
          `Updated profile/status for driver: ${driver.name}`,
          "info",
          "Driver Registry",
        );
        return res.json(driver);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // --- TRIP ROUTES ---
  // Any role can view trips
  app.get(
    "/api/trips",
    requireRole([
      "Fleet Manager",
      "Dispatcher",
      "Safety Officer",
      "Financial Analyst",
    ]),
    async (req, res) => {
      try {
        const list = await TripModel.findAll();
        return res.json(list);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // Dispatchers can dispatch/create trips
  app.post("/api/trips", requireRole(["Dispatcher"]), async (req: any, res) => {
    try {
      const {
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeight,
        plannedDistance,
        revenue,
      } = req.body;

      // Business rule validation: Expired license, vehicle in maintenance, capacity overload
      const vehicle = await VehicleModel.findByPk(vehicleId);
      const driver = await DriverModel.findByPk(driverId);

      if (!vehicle)
        return res
          .status(400)
          .json({ error: "Selected vehicle does not exist" });
      if (!driver)
        return res
          .status(400)
          .json({ error: "Selected driver does not exist" });

      // Only vehicles with status Available are selectable
      if (vehicle.status !== "Available") {
        return res
          .status(400)
          .json({
            error: `Dispatch Block: Selected vehicle is not Available (status: ${vehicle.status})`,
          });
      }

      // Only drivers with status Available are selectable
      if (driver.status !== "Available") {
        return res
          .status(400)
          .json({
            error: `Dispatch Block: Selected driver is not Available (status: ${driver.status})`,
          });
      }

      // Expired Driver License Validation
      const todayStr = new Date().toISOString().split("T")[0];
      if (driver.licenseExpiry < todayStr) {
        return res
          .status(400)
          .json({
            error: `Safety Compliance Block: Driver license expired on ${driver.licenseExpiry}`,
          });
      }

      // Suspended Driver Validation
      if (driver.status === "Suspended") {
        return res
          .status(400)
          .json({
            error: `Safety Compliance Block: Driver state is "Suspended"`,
          });
      }

      // Capacity Overload Validation
      if (cargoWeight > vehicle.maxCapacity) {
        return res
          .status(400)
          .json({
            error: `Dispatch Block: Cargo Weight (${cargoWeight} kg) exceeds maximum capacity (${vehicle.maxCapacity} kg)`,
          });
      }

      // Vehicle in shop Block
      if (vehicle.status === "In Shop") {
        return res
          .status(400)
          .json({
            error: `Dispatch Block: Vehicle is currently marked "In Shop" for maintenance`,
          });
      }

      const trip = await TripModel.create({
        id: `t-${Date.now()}`,
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeight,
        plannedDistance,
        status: "Dispatched",
        createdAt: new Date().toISOString(),
        revenue: revenue || 0,
      });

      // Update vehicle and driver status to 'On Trip'
      await vehicle.update({ status: "On Trip" });
      await driver.update({ status: "On Trip" });

      await logToDatabase(
        req.user.email,
        `Dispatched trip ${trip.id} from ${source} to ${destination} via vehicle ${vehicle.name}`,
        "success",
        "Trip Dispatch",
      );
      return res.json(trip);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Complete/cancel trips
  app.put(
    "/api/trips/:id",
    requireRole(["Dispatcher", "Fleet Manager"]),
    async (req: any, res) => {
      try {
        const trip = await TripModel.findByPk(req.params.id);
        if (!trip) {
          return res.status(404).json({ error: "Trip not found" });
        }

        const { status, finalOdometer, fuelConsumed, revenue } = req.body;

        // Fleet Manager can only force-cancel trips
        if (req.user.role === "Fleet Manager") {
          if (status !== "Cancelled") {
            return res
              .status(403)
              .json({
                error:
                  "Enforced server-side policy: Fleet Manager is restricted to force-cancel operations only",
              });
          }
        }

        if (status === "Completed") {
          if (!finalOdometer) {
            return res
              .status(400)
              .json({ error: "Final odometer is required to complete a trip" });
          }

          const vehicle = await VehicleModel.findByPk(trip.vehicleId);
          if (vehicle && finalOdometer < vehicle.odometer) {
            return res
              .status(400)
              .json({
                error: `Final odometer (${finalOdometer} km) cannot be less than initial odometer (${vehicle.odometer} km)`,
              });
          }

          await trip.update({
            status: "Completed",
            completedAt: new Date().toISOString(),
            finalOdometer,
            fuelConsumed: fuelConsumed || 0,
            revenue: revenue || trip.revenue,
          });

          // Set vehicle and driver status back to Available or In Shop if maintenance needed
          if (vehicle) {
            const lastMaint = vehicle.lastMaintenanceOdometer || 0;
            let nextStatus = "Available";

            if (finalOdometer > lastMaint + 10000) {
              nextStatus = "In Shop";

              // Generate a background Maintenance Log
              await MaintenanceLogModel.create({
                id: `m-auto-${Date.now()}`,
                vehicleId: vehicle.id,
                description: `Automated Maintenance Trigger: Mileage (${finalOdometer.toLocaleString("en-IN")} km) exceeds last maintenance mileage (${lastMaint.toLocaleString("en-IN")} km) by over 10,000 km.`,
                cost: 15000, // typical service cost preset
                startDate: new Date().toISOString().split("T")[0],
                status: "Active",
              });

              // Create automatic maintenance expense
              await ExpenseModel.create({
                id: `e-auto-${Date.now()}`,
                vehicleId: vehicle.id,
                category: "Maintenance",
                amount: 15000,
                date: new Date().toISOString().split("T")[0],
                description: `Auto-Trigger Maintenance Cost for exceeding 10,000 km threshold.`,
              });

              await logToDatabase(
                "system@transitops.com",
                `Automated Maintenance Trigger: Vehicle ${vehicle.name} (${vehicle.registrationNumber}) reached ${finalOdometer.toLocaleString("en-IN")} km (threshold exceeded by ${(finalOdometer - lastMaint).toLocaleString("en-IN")} km). Status set to "In Shop" and background maintenance log created.`,
                "warning",
                "Asset Maintenance",
              );
            }

            await vehicle.update({
              odometer: finalOdometer,
              status: nextStatus,
            });
          }
          const driver = await DriverModel.findByPk(trip.driverId);
          if (driver) {
            await driver.update({ status: "Available" });
          }

          // Auto-log fuel consumption if provided
          if (fuelConsumed && fuelConsumed > 0) {
            const costPerLiter = 1.6; // average
            const fuelCost = fuelConsumed * costPerLiter;
            await FuelLogModel.create({
              id: `f-${Date.now()}`,
              vehicleId: trip.vehicleId,
              tripId: trip.id,
              liters: fuelConsumed,
              cost: fuelCost,
              date: new Date().toISOString().split("T")[0],
            });

            await ExpenseModel.create({
              id: `e-${Date.now()}`,
              vehicleId: trip.vehicleId,
              tripId: trip.id,
              category: "Fuel",
              amount: fuelCost,
              date: new Date().toISOString().split("T")[0],
              description: `Fuel consumption from Trip ${trip.id}`,
            });
          }

          await logToDatabase(
            req.user.email,
            `Completed trip ${trip.id} with final odometer: ${finalOdometer} km`,
            "success",
            "Trip Execution",
          );
        } else if (status === "Cancelled") {
          await trip.update({ status: "Cancelled" });
          const vehicle = await VehicleModel.findByPk(trip.vehicleId);
          if (vehicle) await vehicle.update({ status: "Available" });
          const driver = await DriverModel.findByPk(trip.driverId);
          if (driver) await driver.update({ status: "Available" });

          await logToDatabase(
            req.user.email,
            `Cancelled trip ${trip.id}`,
            "danger",
            "Trip Execution",
          );
        } else {
          await trip.update(req.body);
        }

        return res.json(trip);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // --- MAINTENANCE ROUTES ---
  // Only Fleet Manager and Financial Analyst can read maintenance
  app.get(
    "/api/maintenance",
    requireRole(["Fleet Manager", "Financial Analyst"]),
    async (req, res) => {
      try {
        const list = await MaintenanceLogModel.findAll();
        return res.json(list);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // Fleet Manager can book vehicle in shop
  app.post(
    "/api/maintenance",
    requireRole(["Fleet Manager"]),
    async (req: any, res) => {
      try {
        const { vehicleId, description, cost, startDate } = req.body;
        const vehicle = await VehicleModel.findByPk(vehicleId);
        if (!vehicle) {
          return res
            .status(400)
            .json({ error: "Selected vehicle does not exist" });
        }

        const log = await MaintenanceLogModel.create({
          id: `m-${Date.now()}`,
          vehicleId,
          description,
          cost,
          startDate,
          status: "Active",
        });

        // Put vehicle in shop
        await vehicle.update({ status: "In Shop" });

        // Auto-create expense
        await ExpenseModel.create({
          id: `e-${Date.now()}`,
          vehicleId,
          category: "Maintenance",
          amount: cost,
          date: startDate,
          description: `Active maintenance: ${description}`,
        });

        await logToDatabase(
          req.user.email,
          `Sent vehicle ${vehicle.name} to maintenance: ${description}`,
          "warning",
          "Maintenance Audit",
        );
        return res.json(log);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // Fleet Manager can release vehicle from shop
  app.put(
    "/api/maintenance/:id",
    requireRole(["Fleet Manager"]),
    async (req: any, res) => {
      try {
        const log = await MaintenanceLogModel.findByPk(req.params.id);
        if (!log) {
          return res.status(404).json({ error: "Maintenance log not found" });
        }

        const { endDate, status } = req.body;

        if (status === "Completed") {
          await log.update({
            status: "Completed",
            endDate: endDate || new Date().toISOString().split("T")[0],
          });

          // Set vehicle back to Available and reset maintenance mileage tracker
          const vehicle = await VehicleModel.findByPk(log.vehicleId);
          if (vehicle) {
            await vehicle.update({
              status: "Available",
              lastMaintenanceOdometer: vehicle.odometer,
            });
            await logToDatabase(
              req.user.email,
              `Completed maintenance on ${vehicle.name}. Released back to fleet service. Last maintenance odometer reset to ${vehicle.odometer} km.`,
              "success",
              "Maintenance Audit",
            );
          }
        } else {
          await log.update(req.body);
        }

        return res.json(log);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // --- FUEL LOG ROUTES ---
  app.get(
    "/api/fuel",
    requireRole(["Fleet Manager", "Financial Analyst"]),
    async (req, res) => {
      try {
        const list = await FuelLogModel.findAll();
        return res.json(list);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  app.post(
    "/api/fuel",
    requireRole(["Financial Analyst", "Fleet Manager"]),
    async (req: any, res) => {
      try {
        const { vehicleId, tripId, liters, cost, date } = req.body;
        const vehicle = await VehicleModel.findByPk(vehicleId);
        if (!vehicle) {
          return res
            .status(400)
            .json({ error: "Selected vehicle does not exist" });
        }

        const log = await FuelLogModel.create({
          id: `f-${Date.now()}`,
          vehicleId,
          tripId,
          liters,
          cost,
          date,
        });

        // Auto-create expense
        await ExpenseModel.create({
          id: `e-${Date.now()}`,
          vehicleId,
          tripId,
          category: "Fuel",
          amount: cost,
          date,
          description: `Fuel logging of ${liters} liters`,
        });

        await logToDatabase(
          req.user.email,
          `Registered fuel log of ${liters}L ($${cost}) for ${vehicle.name}`,
          "info",
          "Fuel Operations",
        );
        return res.json(log);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // --- EXPENSE ROUTES ---
  app.get(
    "/api/expenses",
    requireRole(["Fleet Manager", "Financial Analyst"]),
    async (req, res) => {
      try {
        const list = await ExpenseModel.findAll();
        return res.json(list);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  app.post(
    "/api/expenses",
    requireRole(["Financial Analyst", "Fleet Manager"]),
    async (req: any, res) => {
      try {
        const { vehicleId, tripId, category, amount, date, description } =
          req.body;
        const expense = await ExpenseModel.create({
          id: `e-${Date.now()}`,
          vehicleId,
          tripId,
          category,
          amount,
          date,
          description,
        });

        await logToDatabase(
          req.user.email,
          `Logged operation expense: ${category} ($${amount}) for vehicle ${vehicleId}`,
          "info",
          "Financial Audit",
        );
        return res.json(expense);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // --- AUDIT LOGS ROUTES ---
  app.get("/api/audit", requireRole(["Fleet Manager"]), async (req, res) => {
    try {
      const list = await AuditLogModel.findAll({
        order: [["timestamp", "DESC"]],
      });
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/audit", async (req: any, res) => {
    try {
      const { message, type, category } = req.body;
      const userEmail = req.user ? req.user.email : "anonymous@transitops.com";
      const log = await AuditLogModel.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        userEmail,
        message,
        type: type || "info",
        category: category || "General",
      });
      return res.json(log);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete(
    "/api/audit",
    requireRole(["Fleet Manager"]),
    async (req: any, res) => {
      try {
        await AuditLogModel.destroy({ where: {} });
        await logToDatabase(
          req.user.email,
          `Audit log table cleared by Fleet Manager.`,
          "danger",
          "Admin Action",
        );
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // --- VITE DEV / PRODUCTION HANDLERS ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
