import fs from "fs";
import path from "path";

export const DataTypes = {
  STRING: "STRING",
  INTEGER: "INTEGER",
  DOUBLE: "DOUBLE",
};

export const Op = {};

const DB_FILE = path.join(process.cwd(), "transitops.json");

let dbData: Record<string, any[]> = {};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf8");
      dbData = JSON.parse(content);
    } else {
      dbData = {};
    }
  } catch (err) {
    console.error("Error loading custom DB file, resetting database:", err);
    dbData = {};
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving custom DB file:", err);
  }
}

export class Sequelize {
  constructor(options?: any) {
    // No-op
  }
  async sync() {
    loadDb();
  }
}

export class Model {
  [key: string]: any;

  static tableName = "";
  static modelName = "";

  constructor(values: any) {
    Object.assign(this, values);
  }

  static init(
    attributes: any,
    options: { sequelize: Sequelize; modelName: string; tableName: string },
  ) {
    this.tableName = options.tableName;
    this.modelName = options.modelName;
    if (!dbData[this.tableName]) {
      dbData[this.tableName] = [];
    }
  }

  static async count(): Promise<number> {
    loadDb();
    return (dbData[this.tableName] || []).length;
  }

  static async bulkCreate(records: any[]): Promise<Model[]> {
    loadDb();
    if (!dbData[this.tableName]) {
      dbData[this.tableName] = [];
    }
    const created: Model[] = [];
    for (const rec of records) {
      dbData[this.tableName].push(rec);
      created.push(new this(rec));
    }
    saveDb();
    return created;
  }

  static async findOne(options?: {
    where: Record<string, any>;
  }): Promise<Model | null> {
    loadDb();
    const list = dbData[this.tableName] || [];
    if (!options || !options.where) {
      return list.length > 0 ? new this(list[0]) : null;
    }
    const match = list.find((item) => {
      for (const [key, val] of Object.entries(options.where)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
    return match ? new this(match) : null;
  }

  static async findAll(options?: {
    order?: [string, string][];
  }): Promise<Model[]> {
    loadDb();
    let list = [...(dbData[this.tableName] || [])];
    if (options?.order) {
      for (const [field, direction] of options.order) {
        list.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return direction.toUpperCase() === "DESC" ? 1 : -1;
          if (valA > valB) return direction.toUpperCase() === "DESC" ? -1 : 1;
          return 0;
        });
      }
    }
    return list.map((item) => new this(item));
  }

  static async findByPk(id: string | number): Promise<Model | null> {
    loadDb();
    const list = dbData[this.tableName] || [];
    const match = list.find((item) => String(item.id) === String(id));
    return match ? new this(match) : null;
  }

  static async create(record: any): Promise<Model> {
    loadDb();
    if (!dbData[this.tableName]) {
      dbData[this.tableName] = [];
    }
    dbData[this.tableName].push(record);
    saveDb();
    return new this(record);
  }

  static async destroy(options?: {
    where?: Record<string, any>;
  }): Promise<number> {
    loadDb();
    if (!options || !options.where || Object.keys(options.where).length === 0) {
      const count = (dbData[this.tableName] || []).length;
      dbData[this.tableName] = [];
      saveDb();
      return count;
    }
    const beforeCount = (dbData[this.tableName] || []).length;
    dbData[this.tableName] = (dbData[this.tableName] || []).filter((item) => {
      for (const [key, val] of Object.entries(options.where!)) {
        if (item[key] === val) return false;
      }
      return true;
    });
    saveDb();
    return beforeCount - dbData[this.tableName].length;
  }

  async update(updates: any): Promise<this> {
    loadDb();
    const self = this as any;
    const constructor = this.constructor as typeof Model;
    const list = dbData[constructor.tableName] || [];
    const idx = list.findIndex((item) => String(item.id) === String(self.id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      Object.assign(this, list[idx]);
      saveDb();
    }
    return this;
  }
}
