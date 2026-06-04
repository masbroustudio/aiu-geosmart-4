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

export interface ApiKey {
  id: number;
  user_id: number;
  key_hash: string;
  role: string;
  rate_limit: number;
  is_active: boolean;
  last_used?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface WhatIfScenario {
  id: number;
  user_id: number;
  scenario_name: string;
  parameters: string;
  results: string;
  base_score: number;
  simulated_score: number;
  impact: number;
  created_at: Date;
}

export interface BatchJob {
  id: number;
  user_id?: number;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  result_stats?: string;
  result_rows?: string;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}


class MockDatabase {
  private users: Map<string, User> = new Map();
  private auditLogs: AuditLog[] = [];
  private portfolios: Map<string, Portfolio> = new Map();
  private portfolioItems: Map<string, PortfolioItem> = new Map();
  private apiKeys: Map<number, ApiKey> = new Map();
  private whatifScenarios: Map<number, WhatIfScenario> = new Map();
  private batchJobs: Map<number, BatchJob> = new Map();
  private nextUserId: number = 1;
  private nextAuditId: number = 1;
  private nextPortfolioId: number = 1;
  private nextPortfolioItemId: number = 1;
  private nextApiKeyId: number = 1;
  private nextWhatIfScenarioId: number = 1;
  private nextBatchJobId: number = 1;

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
        this.apiKeys = new Map(
          (data.apiKeys || []).map((k: any) => [
            k[0],
            {
              ...k[1],
              last_used: k[1].last_used ? new Date(k[1].last_used) : undefined,
              created_at: new Date(k[1].created_at),
              updated_at: new Date(k[1].updated_at),
            },
          ])
        );
        this.whatifScenarios = new Map(
          (data.whatifScenarios || []).map((s: any) => [
            s[0],
            {
              ...s[1],
              created_at: new Date(s[1].created_at),
            },
          ])
        );
        this.batchJobs = new Map(
          (data.batchJobs || []).map((j: any) => [
            j[0],
            {
              ...j[1],
              created_at: new Date(j[1].created_at),
              updated_at: new Date(j[1].updated_at),
            },
          ])
        );
        this.nextUserId = data.nextUserId || 1;
        this.nextAuditId = data.nextAuditId || 1;
        this.nextPortfolioId = data.nextPortfolioId || 1;
        this.nextPortfolioItemId = data.nextPortfolioItemId || 1;
        this.nextApiKeyId = data.nextApiKeyId || 1;
        this.nextWhatIfScenarioId = data.nextWhatIfScenarioId || 1;
        this.nextBatchJobId = data.nextBatchJobId || 1;

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
        apiKeys: Array.from(this.apiKeys.entries()),
        whatifScenarios: Array.from(this.whatifScenarios.entries()),
        batchJobs: Array.from(this.batchJobs.entries()),
        nextUserId: this.nextUserId,
        nextAuditId: this.nextAuditId,
        nextPortfolioId: this.nextPortfolioId,
        nextPortfolioItemId: this.nextPortfolioItemId,
        nextApiKeyId: this.nextApiKeyId,
        nextWhatIfScenarioId: this.nextWhatIfScenarioId,
        nextBatchJobId: this.nextBatchJobId,
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

  // API Key methods
  async createApiKey(userId: number, keyHash: string, role: string, rateLimit: number = 100): Promise<ApiKey> {
    const apiKey: ApiKey = {
      id: this.nextApiKeyId++,
      user_id: userId,
      key_hash: keyHash,
      role,
      rate_limit: rateLimit,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.apiKeys.set(apiKey.id, apiKey);
    this.saveToDisk();
    return apiKey;
  }

  async getApiKeysByUser(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter((k) => k.user_id === userId && k.is_active);
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    for (const key of this.apiKeys.values()) {
      if (key.key_hash === keyHash && key.is_active) {
        return key;
      }
    }
    return null;
  }

  async deleteApiKey(keyId: number, userId: number): Promise<boolean> {
    const key = this.apiKeys.get(keyId);
    if (key && key.user_id === userId) {
      key.is_active = false;
      key.updated_at = new Date();
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // What-If Scenario methods
  async createWhatIfScenario(
    userId: number,
    name: string,
    params: string,
    results: string,
    baseScore: number,
    simulatedScore: number,
    impact: number
  ): Promise<WhatIfScenario> {
    const scenario: WhatIfScenario = {
      id: this.nextWhatIfScenarioId++,
      user_id: userId,
      scenario_name: name,
      parameters: params,
      results,
      base_score: baseScore,
      simulated_score: simulatedScore,
      impact,
      created_at: new Date()
    };
    this.whatifScenarios.set(scenario.id, scenario);
    this.saveToDisk();
    return scenario;
  }

  async getWhatIfScenariosByUser(userId: number): Promise<WhatIfScenario[]> {
    return Array.from(this.whatifScenarios.values()).filter((s) => s.user_id === userId);
  }

  async deleteWhatIfScenario(scenarioId: number, userId: number): Promise<boolean> {
    const scenario = this.whatifScenarios.get(scenarioId);
    if (scenario && scenario.user_id === userId) {
      this.whatifScenarios.delete(scenarioId);
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Batch Job methods
  async createBatchJob(userId: number, filename: string, totalRows: number): Promise<BatchJob> {
    const job: BatchJob = {
      id: this.nextBatchJobId++,
      user_id: userId,
      filename,
      status: 'pending',
      total_rows: totalRows,
      processed_rows: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.batchJobs.set(job.id, job);
    this.saveToDisk();
    return job;
  }

  async getBatchJob(jobId: number): Promise<BatchJob | null> {
    const job = this.batchJobs.get(jobId);
    return job || null;
  }

  async updateBatchJobProgress(jobId: number, processedRows: number, status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<boolean> {
    const job = this.batchJobs.get(jobId);
    if (job) {
      job.processed_rows = processedRows;
      job.status = status;
      job.updated_at = new Date();
      this.saveToDisk();
      return true;
    }
    return false;
  }

  async completeBatchJob(
    jobId: number,
    status: 'completed' | 'failed',
    stats?: string,
    resultRows?: string,
    errorMessage?: string
  ): Promise<boolean> {
    const job = this.batchJobs.get(jobId);
    if (job) {
      job.status = status;
      if (stats) job.result_stats = stats;
      if (resultRows) job.result_rows = resultRows;
      if (errorMessage) job.error_message = errorMessage;
      job.updated_at = new Date();
      this.saveToDisk();
      return true;
    }
    return false;
  }
}


export const mockDb = new MockDatabase();
