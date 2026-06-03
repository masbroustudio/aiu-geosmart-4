-- GeoUMKM Smart v4.0 Database Schema
-- PostgreSQL 12+

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- bank, government, investor, admin, viewer
  organization VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys (for programmatic access)
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL, -- inherited from user or override
  rate_limit INTEGER DEFAULT 100, -- requests per minute
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs (for compliance & debugging)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL, -- register, login, credit_score, export, etc.
  endpoint VARCHAR(255),
  request_body TEXT,
  response_status INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UMKM Scorings (user-initiated credit/location scores)
CREATE TABLE IF NOT EXISTS umkm_scorings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  umkm_id VARCHAR(255),
  umkm_name VARCHAR(255),
  credit_score DECIMAL(5, 2),
  credit_score_band VARCHAR(50),
  location_score DECIMAL(5, 2),
  confidence DECIMAL(3, 2),
  features_used TEXT, -- JSON array of feature names
  model_version VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio Management (users can save/manage portfolios)
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  umkm_count INTEGER DEFAULT 0,
  avg_score DECIMAL(5, 2),
  risk_distribution TEXT, -- JSON with risk bands
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio Items (UMKM within portfolios)
CREATE TABLE IF NOT EXISTS portfolio_items (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  umkm_id VARCHAR(255) NOT NULL,
  credit_score DECIMAL(5, 2),
  location_score DECIMAL(5, 2),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- What-If Scenarios (policy simulation results)
CREATE TABLE IF NOT EXISTS whatif_scenarios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_name VARCHAR(255),
  parameters TEXT, -- JSON with simulation parameters
  results TEXT, -- JSON with impact analysis
  base_score DECIMAL(5, 2),
  simulated_score DECIMAL(5, 2),
  impact DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports (generated PDFs, exports)
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(100), -- executive_summary, portfolio_analysis, credit_assessment
  title VARCHAR(255),
  file_path VARCHAR(500),
  file_size INTEGER,
  filters TEXT, -- JSON with applied filters
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_umkm_scorings_user_id ON umkm_scorings(user_id);
CREATE INDEX idx_umkm_scorings_created_at ON umkm_scorings(created_at);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolio_items_portfolio_id ON portfolio_items(portfolio_id);
CREATE INDEX idx_whatif_scenarios_user_id ON whatif_scenarios(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);

-- Create updater function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updater trigger to users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updater trigger to api_keys
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updater trigger to portfolios
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updater trigger to umkm_scorings
CREATE TRIGGER update_umkm_scorings_updated_at BEFORE UPDATE ON umkm_scorings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
