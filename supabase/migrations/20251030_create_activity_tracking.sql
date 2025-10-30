-- =====================================================
-- MIGRATION: TRACKING D'ACTIVITÉ EN TEMPS RÉEL
-- Date: 30 octobre 2025
-- Objectif: Résoudre le problème des 5h perdues/employé/semaine
-- =====================================================

-- =====================================================
-- TABLE: employee_activity_log
-- Suit l'activité réelle de chaque employé minute par minute
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id BIGINT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  task_id UUID REFERENCES scheduled_tasks(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('working', 'idle', 'break', 'offline')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  location_section VARCHAR(100),
  tracking_method VARCHAR(50) DEFAULT 'manual' CHECK (tracking_method IN ('manual', 'auto', 'heartbeat')),
  activity_data JSONB DEFAULT '{}'::jsonb,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_activity_log_employee_id ON employee_activity_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_task_id ON employee_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_status ON employee_activity_log(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_started_at ON employee_activity_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_store_id ON employee_activity_log(store_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_active ON employee_activity_log(employee_id, ended_at) WHERE ended_at IS NULL;

-- =====================================================
-- TABLE: activity_alerts
-- Alertes automatiques pour temps mort détecté
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id BIGINT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  task_id UUID REFERENCES scheduled_tasks(id) ON DELETE SET NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('inactivity_10min', 'inactivity_30min', 'break_too_long', 'task_delayed')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  idle_duration_minutes INTEGER,
  notified_to_manager BOOLEAN DEFAULT false,
  notified_to_director BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by BIGINT REFERENCES users(id),
  resolution_note TEXT,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_activity_alerts_employee_id ON activity_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_alerts_task_id ON activity_alerts(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_alerts_type ON activity_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_activity_alerts_severity ON activity_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_activity_alerts_resolved ON activity_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_activity_alerts_store_id ON activity_alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_activity_alerts_created ON activity_alerts(created_at DESC);

-- =====================================================
-- TABLE: employee_heartbeat
-- Heartbeat pour détecter les employés actifs
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_heartbeat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id BIGINT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  task_id UUID REFERENCES scheduled_tasks(id) ON DELETE SET NULL,
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb,
  location_data JSONB DEFAULT '{}'::jsonb,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id) -- Un seul heartbeat actif par employé
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_heartbeat_employee_id ON employee_heartbeat(employee_id);
CREATE INDEX IF NOT EXISTS idx_heartbeat_last_heartbeat ON employee_heartbeat(last_heartbeat DESC);
CREATE INDEX IF NOT EXISTS idx_heartbeat_store_id ON employee_heartbeat(store_id);

-- =====================================================
-- FUNCTION: Mettre à jour updated_at automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_employee_activity_log_updated_at BEFORE UPDATE ON employee_activity_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_alerts_updated_at BEFORE UPDATE ON activity_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_heartbeat_updated_at BEFORE UPDATE ON employee_heartbeat
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- employee_activity_log RLS
ALTER TABLE employee_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors can view their store's activity logs" ON employee_activity_log
  FOR SELECT USING (
    store_id = (SELECT store_id FROM users WHERE id = auth.uid() AND role = 'director')
  );

CREATE POLICY "Managers can view their team's activity logs" ON employee_activity_log
  FOR SELECT USING (
    employee_id IN (SELECT id FROM team_members WHERE manager_id = auth.uid())
  );

CREATE POLICY "System can insert activity logs" ON employee_activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update activity logs" ON employee_activity_log
  FOR UPDATE USING (true);

-- activity_alerts RLS
ALTER TABLE activity_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors can view their store's activity alerts" ON activity_alerts
  FOR SELECT USING (
    store_id = (SELECT store_id FROM users WHERE id = auth.uid() AND role = 'director')
  );

CREATE POLICY "Managers can view their team's activity alerts" ON activity_alerts
  FOR SELECT USING (
    employee_id IN (SELECT id FROM team_members WHERE manager_id = auth.uid())
  );

CREATE POLICY "Directors can resolve activity alerts" ON activity_alerts
  FOR UPDATE USING (
    store_id = (SELECT store_id FROM users WHERE id = auth.uid() AND role = 'director')
  );

CREATE POLICY "System can insert activity alerts" ON activity_alerts
  FOR INSERT WITH CHECK (true);

-- employee_heartbeat RLS
ALTER TABLE employee_heartbeat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors can view their store's heartbeats" ON employee_heartbeat
  FOR SELECT USING (
    store_id = (SELECT store_id FROM users WHERE id = auth.uid() AND role = 'director')
  );

CREATE POLICY "Managers can view their team's heartbeats" ON employee_heartbeat
  FOR SELECT USING (
    employee_id IN (SELECT id FROM team_members WHERE manager_id = auth.uid())
  );

CREATE POLICY "Employees can update their own heartbeat" ON employee_heartbeat
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Employees can update their own heartbeat data" ON employee_heartbeat
  FOR UPDATE USING (true);

-- =====================================================
-- VIEW: Activité en cours des employés (pour dashboard)
-- =====================================================
CREATE OR REPLACE VIEW employee_current_activity AS
SELECT
  tm.id AS employee_id,
  tm.name AS employee_name,
  tm.role AS employee_role,
  tm.location AS employee_section,
  tm.status AS employee_status,
  tm.manager_id,
  u.full_name AS manager_name,
  eal.id AS activity_id,
  eal.task_id,
  st.title AS task_title,
  eal.status AS activity_status,
  eal.started_at,
  EXTRACT(EPOCH FROM (NOW() - eal.started_at)) / 60 AS minutes_active,
  eh.last_heartbeat,
  EXTRACT(EPOCH FROM (NOW() - eh.last_heartbeat)) / 60 AS minutes_since_heartbeat,
  tm.store_id
FROM team_members tm
LEFT JOIN employee_activity_log eal ON eal.employee_id = tm.id AND eal.ended_at IS NULL
LEFT JOIN scheduled_tasks st ON st.id = eal.task_id
LEFT JOIN employee_heartbeat eh ON eh.employee_id = tm.id
LEFT JOIN users u ON u.id = tm.manager_id
WHERE tm.status != 'offline'
ORDER BY tm.name;

-- =====================================================
-- VIEW: Statistiques de productivité par employé
-- =====================================================
CREATE OR REPLACE VIEW employee_productivity_stats AS
SELECT
  tm.id AS employee_id,
  tm.name AS employee_name,
  tm.location AS employee_section,
  tm.manager_id,
  tm.store_id,
  -- Temps total travaillé aujourd'hui
  COALESCE(SUM(
    CASE WHEN eal.status = 'working' AND DATE(eal.started_at) = CURRENT_DATE
    THEN EXTRACT(EPOCH FROM (COALESCE(eal.ended_at, NOW()) - eal.started_at))
    ELSE 0 END
  ) / 3600, 0) AS hours_worked_today,
  -- Temps idle aujourd'hui
  COALESCE(SUM(
    CASE WHEN eal.status = 'idle' AND DATE(eal.started_at) = CURRENT_DATE
    THEN EXTRACT(EPOCH FROM (COALESCE(eal.ended_at, NOW()) - eal.started_at))
    ELSE 0 END
  ) / 3600, 0) AS hours_idle_today,
  -- Temps en pause aujourd'hui
  COALESCE(SUM(
    CASE WHEN eal.status = 'break' AND DATE(eal.started_at) = CURRENT_DATE
    THEN EXTRACT(EPOCH FROM (COALESCE(eal.ended_at, NOW()) - eal.started_at))
    ELSE 0 END
  ) / 3600, 0) AS hours_break_today,
  -- Nombre de tâches complétées aujourd'hui
  COUNT(DISTINCT CASE WHEN DATE(eal.started_at) = CURRENT_DATE AND eal.status = 'working'
    THEN eal.task_id END) AS tasks_today,
  -- Nombre d'alertes d'inactivité cette semaine
  (SELECT COUNT(*) FROM activity_alerts aa
   WHERE aa.employee_id = tm.id
   AND aa.created_at >= DATE_TRUNC('week', CURRENT_DATE)
   AND aa.alert_type LIKE 'inactivity%') AS inactivity_alerts_this_week
FROM team_members tm
LEFT JOIN employee_activity_log eal ON eal.employee_id = tm.id
GROUP BY tm.id, tm.name, tm.location, tm.manager_id, tm.store_id;

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE employee_activity_log IS 'Log de toutes les activités des employés pour tracker le temps réel';
COMMENT ON TABLE activity_alerts IS 'Alertes automatiques générées lors de détection d''inactivité';
COMMENT ON TABLE employee_heartbeat IS 'Heartbeat des employés pour détecter les connexions actives';
COMMENT ON VIEW employee_current_activity IS 'Vue en temps réel de l''activité courante de tous les employés';
COMMENT ON VIEW employee_productivity_stats IS 'Statistiques de productivité quotidienne par employé';
