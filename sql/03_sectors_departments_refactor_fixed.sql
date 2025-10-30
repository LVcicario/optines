-- ============================================================================
-- PHASE 3: REFONTE LOGIQUE - Secteurs, Rayons & Gestion par Colis (FIXED)
-- ============================================================================
-- Architecture: Magasin > Secteur > Rayon > Employé
-- Calcul automatique: temps = (nb_colis × 42s) × 1.2
-- ============================================================================

-- ============================================================================
-- 1. TABLE SECTEURS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sectors (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sectors_store ON public.sectors(store_id);

-- ============================================================================
-- 2. TABLE RAYONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  sector_id INTEGER NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_sector ON public.departments(sector_id);
CREATE INDEX IF NOT EXISTS idx_departments_store ON public.departments(store_id);

-- ============================================================================
-- 3. MODIFICATION EMPLOYEES - Affectation rayon
-- ============================================================================
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sector_id INTEGER REFERENCES public.sectors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_sector ON public.employees(sector_id);

-- ============================================================================
-- 4. TABLE HORAIRES DE TRAVAIL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.employee_schedules (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_start TIME NOT NULL,
  work_end TIME NOT NULL,
  is_present BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_schedules_employee ON public.employee_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.employee_schedules(work_date);
CREATE INDEX IF NOT EXISTS idx_schedules_store ON public.employee_schedules(store_id);

-- ============================================================================
-- 5. MODIFICATION TASKS - Nouvelle logique (FIXED)
-- ============================================================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS sector_id INTEGER REFERENCES public.sectors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS calculated_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_per_package INTEGER DEFAULT 42;

CREATE INDEX IF NOT EXISTS idx_tasks_sector ON public.tasks(sector_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department_id);

-- ============================================================================
-- 6. FONCTION CALCUL AUTOMATIQUE (FIXED)
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_task_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Utiliser la colonne 'packages' existante
  IF NEW.packages > 0 THEN
    NEW.calculated_duration := ROUND((NEW.packages * COALESCE(NEW.time_per_package, 42)) * 1.2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_task_duration ON public.tasks;
CREATE TRIGGER trigger_calculate_task_duration
  BEFORE INSERT OR UPDATE OF packages, time_per_package
  ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_task_duration();

-- ============================================================================
-- 7. FONCTION TEMPS RESTANT EMPLOYÉ (FIXED)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_employee_remaining_work_time(
  p_employee_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_work_minutes INTEGER,
  used_work_minutes INTEGER,
  remaining_work_minutes INTEGER,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH schedule AS (
    SELECT
      EXTRACT(EPOCH FROM (work_end - work_start)) / 60 AS total_minutes
    FROM employee_schedules
    WHERE employee_id = p_employee_id
      AND work_date = p_date
      AND is_present = TRUE
  ),
  tasks_time AS (
    SELECT
      COALESCE(SUM(calculated_duration) / 60, 0) AS used_minutes
    FROM tasks
    WHERE employee_id = p_employee_id  -- FIXED: colonne correcte
      AND date = p_date
      AND status != 'completed'  -- FIXED: utiliser status
  )
  SELECT
    COALESCE(s.total_minutes::INTEGER, 0) AS total_work_minutes,
    COALESCE(t.used_minutes::INTEGER, 0) AS used_work_minutes,
    GREATEST(COALESCE(s.total_minutes::INTEGER, 0) - COALESCE(t.used_minutes::INTEGER, 0), 0) AS remaining_work_minutes,
    (COALESCE(s.total_minutes::INTEGER, 0) - COALESCE(t.used_minutes::INTEGER, 0)) > 0 AS is_available
  FROM schedule s
  CROSS JOIN tasks_time t;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. VUE RÉSUMÉ PAR SECTEUR (FIXED)
-- ============================================================================
CREATE OR REPLACE VIEW sector_summary AS
SELECT
  s.id AS sector_id,
  s.name AS sector_name,
  s.store_id,
  COUNT(DISTINCT e.id) AS total_employees,
  COUNT(DISTINCT CASE WHEN eca.status = 'active' THEN e.id END) AS active_employees,
  COUNT(DISTINCT t.id) AS total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completed_tasks,  -- FIXED
  COALESCE(SUM(t.packages), 0) AS total_packages,  -- FIXED: utiliser packages
  COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.packages ELSE 0 END), 0) AS completed_packages,  -- FIXED
  COALESCE(SUM(t.calculated_duration) / 60, 0)::INTEGER AS total_work_minutes,
  COALESCE(SUM(CASE WHEN t.status != 'completed' THEN t.calculated_duration ELSE 0 END) / 60, 0)::INTEGER AS remaining_work_minutes  -- FIXED
FROM sectors s
LEFT JOIN employees e ON e.sector_id = s.id
LEFT JOIN tasks t ON t.sector_id = s.id AND t.date = CURRENT_DATE
LEFT JOIN employee_current_activity eca ON eca.employee_id = e.id
GROUP BY s.id, s.name, s.store_id;

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sectors visible by all" ON public.sectors;
CREATE POLICY "Sectors visible by all"
  ON public.sectors FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Departments visible by all" ON public.departments;
CREATE POLICY "Departments visible by all"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Schedules visible by all" ON public.employee_schedules;
CREATE POLICY "Schedules visible by all"
  ON public.employee_schedules FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 10. DONNÉES DE TEST - Secteurs & Rayons
-- ============================================================================

INSERT INTO public.sectors (store_id, name, display_order) VALUES
(1, 'Frais', 1),
(1, 'Épicerie Sucrée', 2),
(1, 'Épicerie Salée', 3),
(1, 'Boissons', 4),
(1, 'Hygiène & Beauté', 5),
(1, 'Entretien', 6),
(1, 'Textile', 7),
(1, 'Bazar', 8)
ON CONFLICT DO NOTHING;

-- SECTEUR FRAIS
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(1, 1, 'Fromage', 1),
(1, 1, 'Yaourt', 2),
(1, 1, 'Charcuterie', 3),
(1, 1, 'Boucherie', 4),
(1, 1, 'Poissonnerie', 5),
(1, 1, 'Traiteur', 6),
(1, 1, 'Fruits & Légumes', 7)
ON CONFLICT DO NOTHING;

-- SECTEUR ÉPICERIE SUCRÉE
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(2, 1, 'Chocolat', 1),
(2, 1, 'Biscuits', 2),
(2, 1, 'Confiserie', 3),
(2, 1, 'Céréales', 4),
(2, 1, 'Pâtisserie', 5)
ON CONFLICT DO NOTHING;

-- SECTEUR ÉPICERIE SALÉE
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(3, 1, 'Conserves', 1),
(3, 1, 'Pâtes & Riz', 2),
(3, 1, 'Condiments', 3),
(3, 1, 'Huiles & Vinaigres', 4),
(3, 1, 'Sauces', 5)
ON CONFLICT DO NOTHING;

-- SECTEUR BOISSONS
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(4, 1, 'Eaux', 1),
(4, 1, 'Soft Drinks', 2),
(4, 1, 'Jus de Fruits', 3),
(4, 1, 'Café & Thé', 4),
(4, 1, 'Vins', 5),
(4, 1, 'Bières', 6),
(4, 1, 'Alcools', 7)
ON CONFLICT DO NOTHING;

-- SECTEUR HYGIÈNE & BEAUTÉ
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(5, 1, 'Cosmétiques', 1),
(5, 1, 'Parfumerie', 2),
(5, 1, 'Hygiène Corporelle', 3),
(5, 1, 'Hygiène Bucco-dentaire', 4),
(5, 1, 'Bébé', 5)
ON CONFLICT DO NOTHING;

-- SECTEUR ENTRETIEN
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(6, 1, 'Lessive', 1),
(6, 1, 'Vaisselle', 2),
(6, 1, 'Nettoyage Sol', 3),
(6, 1, 'Papeterie', 4)
ON CONFLICT DO NOTHING;

-- SECTEUR TEXTILE
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(7, 1, 'Vêtements Homme', 1),
(7, 1, 'Vêtements Femme', 2),
(7, 1, 'Vêtements Enfant', 3),
(7, 1, 'Linge de Maison', 4)
ON CONFLICT DO NOTHING;

-- SECTEUR BAZAR
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(8, 1, 'Jouets', 1),
(8, 1, 'Électronique', 2),
(8, 1, 'Bricolage', 3),
(8, 1, 'Jardin', 4)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.sectors IS 'Secteurs du magasin (Frais, Épicerie, Boissons, etc.)';
COMMENT ON TABLE public.departments IS 'Rayons individuels au sein de chaque secteur';
COMMENT ON TABLE public.employee_schedules IS 'Horaires de travail des employés par jour';
COMMENT ON COLUMN public.tasks.packages IS 'Nombre de colis à traiter';
COMMENT ON COLUMN public.tasks.calculated_duration IS 'Durée calculée: (packages × 42s) × 1.2';
