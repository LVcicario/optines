/**
 * PHASE 1: SCHÉMA DE BASE - OPTINES
 *
 * Tables principales de l'application
 * - Stores (magasins)
 * - Users (utilisateurs/directeurs)
 * - Employees (employés/managers)
 * - Tasks (tâches)
 * - Employee breaks (pauses)
 */

-- ============================================================
-- ENABLE EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: stores
-- Magasins
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  opening_time TIME NOT NULL DEFAULT '08:00',
  closing_time TIME NOT NULL DEFAULT '20:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_stores_name ON public.stores(name);

-- Commentaires
COMMENT ON TABLE public.stores IS 'Magasins/Points de vente';
COMMENT ON COLUMN public.stores.opening_time IS 'Heure d''ouverture du magasin';
COMMENT ON COLUMN public.stores.closing_time IS 'Heure de fermeture du magasin';

-- ============================================================
-- TABLE: users
-- Utilisateurs (directeurs)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'manager')),
  store_id INTEGER REFERENCES public.stores(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_store ON public.users(store_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Commentaires
COMMENT ON TABLE public.users IS 'Utilisateurs de l''application (directeurs et managers)';
COMMENT ON COLUMN public.users.role IS 'Rôle: director ou manager';

-- ============================================================
-- TABLE: employees
-- Employés/Managers terrain
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT DEFAULT 'manager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_employees_store ON public.employees(store_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- Commentaires
COMMENT ON TABLE public.employees IS 'Employés/Managers sur le terrain';
COMMENT ON COLUMN public.employees.position IS 'Poste occupé (manager, assistant, etc.)';

-- ============================================================
-- TABLE: tasks
-- Tâches planifiées
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  packages INTEGER DEFAULT 0,
  team_size INTEGER DEFAULT 1,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tasks_store ON public.tasks(store_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON public.tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- Commentaires
COMMENT ON TABLE public.tasks IS 'Tâches planifiées pour les employés';
COMMENT ON COLUMN public.tasks.packages IS 'Nombre de colis à traiter';
COMMENT ON COLUMN public.tasks.team_size IS 'Taille de l''équipe requise';
COMMENT ON COLUMN public.tasks.priority IS 'Priorité: low, medium, high, urgent';
COMMENT ON COLUMN public.tasks.status IS 'Statut: pending, in_progress, completed, cancelled';

-- ============================================================
-- TABLE: employee_breaks
-- Gestion des pauses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  break_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  break_type TEXT DEFAULT 'regular' CHECK (break_type IN ('regular', 'meal', 'rest', 'emergency')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_breaks_employee ON public.employee_breaks(employee_id);
CREATE INDEX IF NOT EXISTS idx_breaks_store ON public.employee_breaks(store_id);
CREATE INDEX IF NOT EXISTS idx_breaks_date ON public.employee_breaks(break_date);

-- Commentaires
COMMENT ON TABLE public.employee_breaks IS 'Historique des pauses des employés';
COMMENT ON COLUMN public.employee_breaks.duration_minutes IS 'Durée de la pause en minutes';
COMMENT ON COLUMN public.employee_breaks.break_type IS 'Type: regular, meal, rest, emergency';

-- ============================================================
-- FONCTION: calculate_break_duration
-- Calcule la durée d'une pause quand elle se termine
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_break_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement la durée
DROP TRIGGER IF EXISTS trigger_calculate_break_duration ON public.employee_breaks;
CREATE TRIGGER trigger_calculate_break_duration
  BEFORE INSERT OR UPDATE ON public.employee_breaks
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_break_duration();

-- ============================================================
-- FONCTION: update_task_completed_at
-- Met à jour completed_at quand une tâche est terminée
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at := NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_task_completed ON public.tasks;
CREATE TRIGGER trigger_update_task_completed
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_completed_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_breaks ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policies pour stores
CREATE POLICY "Directors can view their store"
  ON public.stores FOR SELECT
  USING (id IN (
    SELECT store_id FROM public.users
    WHERE id = auth.uid()
  ));

-- Policies pour employees
CREATE POLICY "Directors can view employees in their store"
  ON public.employees FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM public.users
    WHERE id = auth.uid() AND role = 'director'
  ));

CREATE POLICY "Managers can view their own data"
  ON public.employees FOR SELECT
  USING (user_id = auth.uid());

-- Policies pour tasks
CREATE POLICY "Directors can manage tasks in their store"
  ON public.tasks FOR ALL
  USING (store_id IN (
    SELECT store_id FROM public.users
    WHERE id = auth.uid() AND role = 'director'
  ));

CREATE POLICY "Managers can view their assigned tasks"
  ON public.tasks FOR SELECT
  USING (employee_id IN (
    SELECT id FROM public.employees
    WHERE user_id = auth.uid()
  ));

-- Policies pour breaks
CREATE POLICY "Directors can view breaks in their store"
  ON public.employee_breaks FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM public.users
    WHERE id = auth.uid() AND role = 'director'
  ));

CREATE POLICY "Employees can manage their own breaks"
  ON public.employee_breaks FOR ALL
  USING (employee_id IN (
    SELECT id FROM public.employees
    WHERE user_id = auth.uid()
  ));

-- ============================================================
-- GRANTS (Permissions)
-- ============================================================

-- Service role a tous les droits
GRANT ALL ON public.stores TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.employees TO service_role;
GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.employee_breaks TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.stores_id_seq TO service_role;

-- Authenticated users (via RLS)
GRANT SELECT ON public.stores TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employee_breaks TO authenticated;

-- ============================================================
-- DONNÉES DE TEST (optionnel)
-- ============================================================

-- Magasin de test
INSERT INTO public.stores (name, location, opening_time, closing_time)
VALUES ('Magasin Test', 'Paris', '04:30', '20:00')
ON CONFLICT DO NOTHING;

-- Directeur de test
-- Note: Le mot de passe doit être hashé en production
INSERT INTO public.users (email, password, role, store_id, first_name, last_name)
VALUES ('directeur@test.com', '$2a$10$placeholder', 'director', 1, 'Thomas', 'Directeur')
ON CONFLICT (email) DO NOTHING;

-- Manager de test
INSERT INTO public.employees (store_id, first_name, last_name, email, position)
VALUES (1, 'Luca', 'Vicario', 'luca@test.com', 'manager')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================

-- Messages de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Schéma de base créé avec succès:';
  RAISE NOTICE '   - stores';
  RAISE NOTICE '   - users';
  RAISE NOTICE '   - employees';
  RAISE NOTICE '   - tasks';
  RAISE NOTICE '   - employee_breaks';
  RAISE NOTICE '✅ Triggers et fonctions configurés';
  RAISE NOTICE '✅ RLS activé sur toutes les tables';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaine étape:';
  RAISE NOTICE '   Appliquer le SQL Phase 2 (employee_tracking)';
END $$;
