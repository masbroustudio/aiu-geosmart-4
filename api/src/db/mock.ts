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

interface Portfolio {
  id: string;
  user_id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

interface PortfolioItem {
  id: string;
  portfolio_id: string;
  umkm_id: string;
  umkm_name?: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  added_at: Date;
}

class MockDatabase {
  private users: Map<string, User> = new Map();
  private auditLogs: AuditLog[] = [];
  private portfolios: Map<string, Portfolio> = new Map();
  private portfolioItems: Map<string, PortfolioItem> = new Map();
  private nextUserId: number = 1;
  private nextAuditId: number = 1;
  private nextPortfolioId: number = 1;
  private nextPortfolioItemId: number = 1;
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
        this.portfolios = new Map(
          (data.portfolios || []).map((p: any) => [
            p[0],
            {
              ...p[1],
              created_at: new Date(p[1].created_at),
              updated_at: new Date(p[1].updated_at),
            },
          ])
        );
        this.portfolioItems = new Map(
          (data.portfolioItems || []).map((item: any) => [
            item[0],
            {
              ...item[1],
              added_at: new Date(item[1].added_at),
            },
          ])
        );
        this.nextUserId = data.nextUserId || 1;
        this.nextAuditId = data.nextAuditId || 1;
        this.nextPortfolioId = data.nextPortfolioId || 1;
        this.nextPortfolioItemId = data.nextPortfolioItemId || 1;
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
        portfolios: Array.from(this.portfolios.entries()),
        portfolioItems: Array.from(this.portfolioItems.entries()),
        nextUserId: this.nextUserId,
        nextAuditId: this.nextAuditId,
        nextPortfolioId: this.nextPortfolioId,
        nextPortfolioItemId: this.nextPortfolioItemId,
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

  // Portfolio methods
  async createPortfolio(userId: number, name: string, description?: string): Promise<Portfolio> {
    const id = `portfolio_${this.nextPortfolioId++}`;
    const portfolio: Portfolio = {
      id,
      user_id: userId,
      name,
      description,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.portfolios.set(id, portfolio);
    this.saveToDisk();
    return portfolio;
  }

  async getPortfolio(portfolioId: string, userId: number): Promise<Portfolio | null> {
    const portfolio = this.portfolios.get(portfolioId);
    if (portfolio && portfolio.user_id === userId) {
      return portfolio;
    }
    return null;
  }

  async getPortfoliosByUser(userId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter((p) => p.user_id === userId);
  }

  async deletePortfolio(portfolioId: string, userId: number): Promise<boolean> {
    const portfolio = this.portfolios.get(portfolioId);
    if (portfolio && portfolio.user_id === userId) {
      this.portfolios.delete(portfolioId);
      // Delete all items in this portfolio
      for (const [itemId, item] of this.portfolioItems.entries()) {
        if (item.portfolio_id === portfolioId) {
          this.portfolioItems.delete(itemId);
        }
      }
      this.saveToDisk();
      return true;
    }
    return false;
  }

  async addPortfolioItem(
    portfolioId: string,
    umkmId: string,
    score: number,
    riskLevel: 'low' | 'medium' | 'high' | 'very_high',
    umkmName?: string,
    userId?: number
  ): Promise<PortfolioItem> {
    // Verify portfolio belongs to user
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio || (userId && portfolio.user_id !== userId)) {
      throw new Error('Portfolio not found');
    }

    const id = `portfolio_item_${this.nextPortfolioItemId++}`;
    const item: PortfolioItem = {
      id,
      portfolio_id: portfolioId,
      umkm_id: umkmId,
      umkm_name: umkmName,
      score,
      risk_level: riskLevel,
      added_at: new Date(),
    };
    this.portfolioItems.set(id, item);
    this.saveToDisk();
    return item;
  }

  async getPortfolioItems(portfolioId: string): Promise<PortfolioItem[]> {
    return Array.from(this.portfolioItems.values()).filter((item) => item.portfolio_id === portfolioId);
  }

  async removePortfolioItem(itemId: string, portfolioId: string): Promise<boolean> {
    const item = this.portfolioItems.get(itemId);
    if (item && item.portfolio_id === portfolioId) {
      this.portfolioItems.delete(itemId);
      this.saveToDisk();
      return true;
    }
    return false;
  }
}

export const mockDb = new MockDatabase();
