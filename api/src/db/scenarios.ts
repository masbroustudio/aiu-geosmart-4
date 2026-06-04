import { mockDb } from './mock.js';
import { query, getPool } from './pool.js';

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

export const createWhatIfScenario = async (
  userId: number,
  name: string,
  parameters: string,
  results: string,
  baseScore: number,
  simulatedScore: number,
  impact: number
): Promise<WhatIfScenario> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.createWhatIfScenario(userId, name, parameters, results, baseScore, simulatedScore, impact);
  }

  const res = await query(
    `INSERT INTO whatif_scenarios (user_id, scenario_name, parameters, results, base_score, simulated_score, impact) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, name, parameters, results, baseScore, simulatedScore, impact]
  );
  return res.rows[0];
};

export const getWhatIfScenariosByUser = async (userId: number): Promise<WhatIfScenario[]> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.getWhatIfScenariosByUser(userId);
  }

  const res = await query(
    'SELECT * FROM whatif_scenarios WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return res.rows;
};

export const deleteWhatIfScenario = async (scenarioId: number, userId: number): Promise<boolean> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.deleteWhatIfScenario(scenarioId, userId);
  }

  const res = await query(
    'DELETE FROM whatif_scenarios WHERE id = $1 AND user_id = $2',
    [scenarioId, userId]
  );
  return (res.rowCount ?? 0) > 0;
};
