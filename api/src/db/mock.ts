// Mock database for MVP - in-memory storage with JSON persistence
// Transition to PostgreSQL for production

import fs from 'fs';
import path from 'path';

interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name?: string;
  role: string;
  organization?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

class MockDatabase {
  private users: Map<string, User> = new Map();
  private auditLogs: AuditLog[] = [];
  private nextUserId: number = 1;
  private nextAuditId: number = 1;
  private dataFile: string = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'mock-db.json') : 'mock-db.json';

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        this.users = new Map(data.users || []);
        this.auditLogs = (data.auditLogs || []).map((log: any) => ({
          ...log,
          created_at: new Date(log.created_at),
        }));
        this.nextUserId = data.nextUserId || 1;
        this.nextAuditId = data.nextAuditId || 1;
      }
    } catch (error) {
      console.warn('Could not load mock database from disk, starting fresh:', error);
    }
  }

  private saveToDisk() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        auditLogs: this.auditLogs,
        nextUserId: this.nextUserId,
        nextAuditId: this.nextAuditId,
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save mock database:', error);
    }
  }

  async createUser(email: string, passwordHash: string, fullName?: string, role?: string): Promise<User> {
    if (this.users.has(email)) {
      throw new Error('Email already registered');
    }

    const user: User = {
      id: this.nextUserId++,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role: role || 'viewer',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.users.set(email, user);
    this.saveToDisk();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = this.users.get(email);
    return user && user.is_active ? user : null;
  }

  async getUserById(id: number): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id && user.is_active) {
        return user;
      }
    }
    return null;
  }

  async logAudit(data: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    const log: AuditLog = {
      id: this.nextAuditId++,
      ...data,
      created_at: new Date(),
    };
    this.auditLogs.push(log);
    this.saveToDisk();
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogs.slice(-limit);
  }
}

export const mockDb = new MockDatabase();
