/**
 * PHASE 2: EMPLOYEE TRACKING - SUIVI TEMPS RÉEL
 *
 * Tables pour le monitoring d'activité des employés
 * - Heartbeat toutes les 5 minutes
 * - État actuel de l'activité
 * - Alertes d'inactivité
 */

-- ============================================================
-- TABLE: employee_heartbeat
-- Enregistre les battements de cœur réguliers des employés
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_heartbeat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT, -- Position GPS optionnelle (format: "lat,lon")
  device_info JSONB, -- Info appareil (OS, version app, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_heartbeat_employee ON public.employee_heartbeat(employee_id);
CREATE INDEX IF NOT EXISTS idx_heartbeat_timestamp ON public.employee_heartbeat(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_heartbeat_store ON public.employee_heartbeat(store_id);

-- Commentaires
COMMENT ON TABLE public.employee_heartbeat IS 'Heartbeats réguliers des employés (toutes les 5 min)';
COMMENT ON COLUMN public.employee_heartbeat.employee_id IS 'Référence vers l''employé';
COMMENT ON COLUMN public.employee_heartbeat.timestamp IS 'Moment du heartbeat';
COMMENT ON COLUMN public.employee_heartbeat.location IS 'Position GPS optionnelle';

-- ============================================================
-- TABLE: employee_current_activity
-- État actuel de l'activité de chaque employé
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_current_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'on_break', 'offline')),
  current_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB, -- Données supplémentaires (ex: tâche en cours)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_activity_employee ON public.employee_current_activity(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_status ON public.employee_current_activity(status);
CREATE INDEX IF NOT EXISTS idx_activity_store ON public.employee_current_activity(store_id);
CREATE INDEX IF NOT EXISTS idx_activity_last_heartbeat ON public.employee_current_activity(last_heartbeat DESC);

-- Commentaires
COMMENT ON TABLE public.employee_current_activity IS 'État actuel de l''activité de chaque employé';
COMMENT ON COLUMN public.employee_current_activity.status IS 'Statut: active, inactive, on_break, offline';
COMMENT ON COLUMN public.employee_current_activity.last_heartbeat IS 'Dernier heartbeat reçu';
COMMENT ON COLUMN public.employee_current_activity.last_activity IS 'Dernière activité détectée';

-- ============================================================
-- TABLE: activity_alerts
-- Alertes générées par le système de monitoring
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('inactivity', 'long_break', 'offline', 'low_performance')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_alerts_employee ON public.activity_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_alerts_store ON public.activity_alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.activity_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON public.activity_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.activity_alerts(severity);

-- Commentaires
COMMENT ON TABLE public.activity_alerts IS 'Alertes de monitoring d''activité';
COMMENT ON COLUMN public.activity_alerts.alert_type IS 'Type: inactivity, long_break, offline, low_performance';
COMMENT ON COLUMN public.activity_alerts.severity IS 'Gravité: low, medium, high, critical';

-- ============================================================
-- FONCTION: update_employee_activity
-- Met à jour l'état d'activité après chaque heartbeat
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_employee_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
  v_time_diff INTERVAL;
BEGIN
  -- Calculer le temps depuis le dernier heartbeat
  SELECT last_heartbeat INTO v_time_diff
  FROM public.employee_current_activity
  WHERE employee_id = NEW.employee_id;

  -- Déterminer le statut
  IF v_time_diff IS NULL OR (NOW() - v_time_diff) < INTERVAL '10 minutes' THEN
    v_status := 'active';
  ELSIF (NOW() - v_time_diff) < INTERVAL '30 minutes' THEN
    v_status := 'inactive';
  ELSE
    v_status := 'offline';
  END IF;

  -- Mettre à jour ou créer l'enregistrement d'activité
  INSERT INTO public.employee_current_activity (
    employee_id,
    store_id,
    status,
    last_heartbeat,
    last_activity,
    updated_at
  ) VALUES (
    NEW.employee_id,
    NEW.store_id,
    v_status,
    NEW.timestamp,
    NEW.timestamp,
    NOW()
  )
  ON CONFLICT (employee_id) DO UPDATE SET
    status = v_status,
    last_heartbeat = NEW.timestamp,
    last_activity = NEW.timestamp,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Commentaire
COMMENT ON FUNCTION public.update_employee_activity IS 'Met à jour l''état d''activité après chaque heartbeat';

-- ============================================================
-- TRIGGER: trigger_update_activity
-- Déclenché à chaque nouveau heartbeat
-- ============================================================

DROP TRIGGER IF EXISTS trigger_update_activity ON public.employee_heartbeat;
CREATE TRIGGER trigger_update_activity
  AFTER INSERT ON public.employee_heartbeat
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_activity();

-- ============================================================
-- FONCTION: check_inactive_employees
-- Vérifie les employés inactifs et crée des alertes
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_inactive_employees()
RETURNS void AS $$
DECLARE
  v_employee RECORD;
  v_inactivity_threshold INTERVAL := INTERVAL '15 minutes';
BEGIN
  -- Parcourir les employés inactifs
  FOR v_employee IN
    SELECT
      ea.employee_id,
      ea.store_id,
      e.first_name,
      e.last_name,
      ea.last_heartbeat,
      EXTRACT(EPOCH FROM (NOW() - ea.last_heartbeat))/60 AS minutes_inactive
    FROM public.employee_current_activity ea
    JOIN public.employees e ON e.id = ea.employee_id
    WHERE
      ea.status IN ('inactive', 'offline')
      AND ea.last_heartbeat < (NOW() - v_inactivity_threshold)
      AND NOT EXISTS (
        SELECT 1 FROM public.activity_alerts
        WHERE employee_id = ea.employee_id
        AND alert_type = 'inactivity'
        AND is_resolved = FALSE
        AND created_at > (NOW() - INTERVAL '1 hour')
      )
  LOOP
    -- Créer une alerte
    INSERT INTO public.activity_alerts (
      employee_id,
      store_id,
      alert_type,
      severity,
      message,
      metadata
    ) VALUES (
      v_employee.employee_id,
      v_employee.store_id,
      'inactivity',
      CASE
        WHEN v_employee.minutes_inactive > 60 THEN 'critical'
        WHEN v_employee.minutes_inactive > 30 THEN 'high'
        ELSE 'medium'
      END,
      format('%s %s n''a pas donné signe de vie depuis %s minutes',
        v_employee.first_name,
        v_employee.last_name,
        ROUND(v_employee.minutes_inactive::numeric, 0)
      ),
      jsonb_build_object(
        'minutes_inactive', v_employee.minutes_inactive,
        'last_heartbeat', v_employee.last_heartbeat
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Commentaire
COMMENT ON FUNCTION public.check_inactive_employees IS 'Vérifie les employés inactifs et génère des alertes';

-- ============================================================
-- POLICIES RLS (Row Level Security)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.employee_heartbeat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_current_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_alerts ENABLE ROW LEVEL SECURITY;

-- Politique: Les directeurs voient tout leur magasin
CREATE POLICY "Directeurs voient heartbeats de leur magasin"
  ON public.employee_heartbeat
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.users
      WHERE id = auth.uid() AND role = 'director'
    )
  );

CREATE POLICY "Directeurs voient activité de leur magasin"
  ON public.employee_current_activity
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.users
      WHERE id = auth.uid() AND role = 'director'
    )
  );

CREATE POLICY "Directeurs voient alertes de leur magasin"
  ON public.activity_alerts
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.users
      WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Politique: Les managers voient leurs propres données
CREATE POLICY "Managers voient leurs heartbeats"
  ON public.employee_heartbeat
  FOR SELECT
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      JOIN public.users u ON u.id = auth.uid()
      WHERE e.user_id = u.id
    )
  );

CREATE POLICY "Managers voient leur activité"
  ON public.employee_current_activity
  FOR SELECT
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      JOIN public.users u ON u.id = auth.uid()
      WHERE e.user_id = u.id
    )
  );

-- Politique: Les managers peuvent insérer leurs heartbeats
CREATE POLICY "Managers insèrent leurs heartbeats"
  ON public.employee_heartbeat
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM public.employees e
      JOIN public.users u ON u.id = auth.uid()
      WHERE e.user_id = u.id
    )
  );

-- Politique: Les directeurs peuvent résoudre les alertes
CREATE POLICY "Directeurs résolvent alertes"
  ON public.activity_alerts
  FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM public.users
      WHERE id = auth.uid() AND role = 'director'
    )
  );

-- ============================================================
-- FONCTION DE NETTOYAGE (optionnel)
-- Supprime les vieux heartbeats (> 7 jours)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_heartbeats()
RETURNS void AS $$
BEGIN
  DELETE FROM public.employee_heartbeat
  WHERE created_at < (NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.cleanup_old_heartbeats IS 'Supprime les heartbeats de plus de 7 jours';

-- ============================================================
-- GRANTS (Permissions)
-- ============================================================

-- Service role a tous les droits (pour l'API backend)
GRANT ALL ON public.employee_heartbeat TO service_role;
GRANT ALL ON public.employee_current_activity TO service_role;
GRANT ALL ON public.activity_alerts TO service_role;

-- Authenticated users (via RLS policies)
GRANT SELECT, INSERT ON public.employee_heartbeat TO authenticated;
GRANT SELECT ON public.employee_current_activity TO authenticated;
GRANT SELECT, UPDATE ON public.activity_alerts TO authenticated;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================

-- Messages de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Tables de tracking créées avec succès:';
  RAISE NOTICE '   - employee_heartbeat';
  RAISE NOTICE '   - employee_current_activity';
  RAISE NOTICE '   - activity_alerts';
  RAISE NOTICE '✅ Triggers et fonctions configurés';
  RAISE NOTICE '✅ RLS activé sur toutes les tables';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaines étapes:';
  RAISE NOTICE '   1. Développer le frontend React Native';
  RAISE NOTICE '   2. Implémenter les hooks useActivityTracking';
  RAISE NOTICE '   3. Créer le dashboard de monitoring en temps réel';
END $$;
