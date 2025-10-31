-- ============================================================================
-- PHASE 3: REFONTE LOGIQUE - Secteurs, Rayons & Gestion par Colis
-- ============================================================================
-- Architecture: Magasin > Secteur > Rayon > Employé
-- Calcul automatique: temps = (nb_colis × 42s) × 1.2
-- ============================================================================

-- ============================================================================
-- 1. TABLE SECTEURS (Departments en français: Secteurs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sectors (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Frais", "Épicerie Sucrée", "Boissons", etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_sectors_store ON public.sectors(store_id);

-- ============================================================================
-- 2. TABLE RAYONS (Departments individuels)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  sector_id INTEGER NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Fromage", "Yaourt", "Café", "BNA", "Alcool", etc.
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_departments_sector ON public.departments(sector_id);
CREATE INDEX IF NOT EXISTS idx_departments_store ON public.departments(store_id);

-- ============================================================================
-- 3. MODIFICATION TABLE EMPLOYEES - Ajout affectation rayon
-- ============================================================================
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sector_id INTEGER REFERENCES public.sectors(id) ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_sector ON public.employees(sector_id);

-- ============================================================================
-- 4. TABLE HORAIRES DE TRAVAIL (Employee Schedules)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.employee_schedules (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_start TIME NOT NULL, -- Heure début (ex: 08:00)
  work_end TIME NOT NULL,   -- Heure fin (ex: 17:00)
  is_present BOOLEAN DEFAULT TRUE, -- Présent/Absent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte: un employé ne peut avoir qu'un seul horaire par jour
  UNIQUE(employee_id, work_date)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_schedules_employee ON public.employee_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.employee_schedules(work_date);
CREATE INDEX IF NOT EXISTS idx_schedules_store ON public.employee_schedules(store_id);

-- ============================================================================
-- 5. MODIFICATION TABLE TASKS - Nouvelle logique colis par rayon
-- ============================================================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS sector_id INTEGER REFERENCES public.sectors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS packages_count INTEGER DEFAULT 0, -- Nombre de colis
ADD COLUMN IF NOT EXISTS calculated_duration INTEGER DEFAULT 0, -- Durée calculée en secondes
ADD COLUMN IF NOT EXISTS time_per_package INTEGER DEFAULT 42; -- Temps par colis (défaut 42s)

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_tasks_sector ON public.tasks(sector_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department_id);

-- ============================================================================
-- 6. FONCTION CALCUL AUTOMATIQUE DURÉE TÂCHE
-- ============================================================================
-- Formule: temps_calculé = (nb_colis × temps_par_colis) × 1.2 (majoration 20%)
CREATE OR REPLACE FUNCTION calculate_task_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Si packages_count est défini, calculer automatiquement la durée
  IF NEW.packages_count > 0 THEN
    -- Temps brut: nb_colis × temps_par_colis (défaut 42s)
    -- Majoration 20%: × 1.2
    NEW.calculated_duration := ROUND((NEW.packages_count * COALESCE(NEW.time_per_package, 42)) * 1.2);

    -- Mettre à jour estimated_duration si non défini manuellement
    IF NEW.estimated_duration IS NULL OR NEW.estimated_duration = 0 THEN
      NEW.estimated_duration := NEW.calculated_duration;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calcul automatique
DROP TRIGGER IF EXISTS trigger_calculate_task_duration ON public.tasks;
CREATE TRIGGER trigger_calculate_task_duration
  BEFORE INSERT OR UPDATE OF packages_count, time_per_package
  ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_task_duration();

-- ============================================================================
-- 7. FONCTION HELPER: Obtenir temps de travail restant employé
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
    -- Récupérer l'horaire du jour
    SELECT
      EXTRACT(EPOCH FROM (work_end - work_start)) / 60 AS total_minutes
    FROM employee_schedules
    WHERE employee_id = p_employee_id
      AND work_date = p_date
      AND is_present = TRUE
  ),
  tasks_time AS (
    -- Calculer le temps utilisé par les tâches assignées
    SELECT
      COALESCE(SUM(calculated_duration) / 60, 0) AS used_minutes
    FROM tasks
    WHERE assigned_to = p_employee_id
      AND date = p_date
      AND is_completed = FALSE
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
-- 8. VUE: Résumé par secteur pour directeurs
-- ============================================================================
CREATE OR REPLACE VIEW sector_summary AS
SELECT
  s.id AS sector_id,
  s.name AS sector_name,
  s.store_id,
  COUNT(DISTINCT e.id) AS total_employees,
  COUNT(DISTINCT CASE WHEN eca.status = 'active' THEN e.id END) AS active_employees,
  COUNT(DISTINCT t.id) AS total_tasks,
  COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END) AS completed_tasks,
  COALESCE(SUM(t.packages_count), 0) AS total_packages,
  COALESCE(SUM(CASE WHEN t.is_completed THEN t.packages_count ELSE 0 END), 0) AS completed_packages,
  COALESCE(SUM(t.calculated_duration) / 60, 0)::INTEGER AS total_work_minutes,
  COALESCE(SUM(CASE WHEN NOT t.is_completed THEN t.calculated_duration ELSE 0 END) / 60, 0)::INTEGER AS remaining_work_minutes
FROM sectors s
LEFT JOIN employees e ON e.sector_id = s.id
LEFT JOIN tasks t ON t.sector_id = s.id AND t.date = CURRENT_DATE
LEFT JOIN employee_current_activity eca ON eca.employee_id = e.id
GROUP BY s.id, s.name, s.store_id;

-- ============================================================================
-- 9. RLS POLICIES - Sécurité
-- ============================================================================

-- Activer RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;

-- Policies Sectors
DROP POLICY IF EXISTS "Sectors visible by all authenticated users" ON public.sectors;
CREATE POLICY "Sectors visible by all authenticated users"
  ON public.sectors FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Sectors manageable by directors" ON public.sectors;
CREATE POLICY "Sectors manageable by directors"
  ON public.sectors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'directeur'
    )
  );

-- Policies Departments
DROP POLICY IF EXISTS "Departments visible by all authenticated users" ON public.departments;
CREATE POLICY "Departments visible by all authenticated users"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Departments manageable by directors" ON public.departments;
CREATE POLICY "Departments manageable by directors"
  ON public.departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'directeur'
    )
  );

-- Policies Employee Schedules
DROP POLICY IF EXISTS "Schedules visible by employee or director" ON public.employee_schedules;
CREATE POLICY "Schedules visible by employee or director"
  ON public.employee_schedules FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role IN ('directeur', 'manager')
    )
  );

DROP POLICY IF EXISTS "Schedules manageable by directors" ON public.employee_schedules;
CREATE POLICY "Schedules manageable by directors"
  ON public.employee_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.user_id = auth.uid()
      AND employees.role = 'directeur'
    )
  );

-- ============================================================================
-- 10. DONNÉES DE TEST - Secteurs & Rayons réalistes
-- ============================================================================

-- Insérer secteurs pour le magasin de test (store_id = 1)
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

-- Insérer rayons pour chaque secteur
-- SECTEUR FRAIS (id=1)
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(1, 1, 'Fromage', 1),
(1, 1, 'Yaourt', 2),
(1, 1, 'Charcuterie', 3),
(1, 1, 'Boucherie', 4),
(1, 1, 'Poissonnerie', 5),
(1, 1, 'Traiteur', 6),
(1, 1, 'Fruits & Légumes', 7)
ON CONFLICT DO NOTHING;

-- SECTEUR ÉPICERIE SUCRÉE (id=2)
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(2, 1, 'Chocolat', 1),
(2, 1, 'Biscuits', 2),
(2, 1, 'Confiserie', 3),
(2, 1, 'Céréales', 4),
(2, 1, 'Pâtisserie', 5)
ON CONFLICT DO NOTHING;

-- SECTEUR ÉPICERIE SALÉE (id=3)
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(3, 1, 'Conserves', 1),
(3, 1, 'Pâtes & Riz', 2),
(3, 1, 'Condiments', 3),
(3, 1, 'Huiles & Vinaigres', 4),
(3, 1, 'Sauces', 5)
ON CONFLICT DO NOTHING;

-- SECTEUR BOISSONS (id=4)
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(4, 1, 'Eaux', 1),
(4, 1, 'Soft Drinks', 2),
(4, 1, 'Jus de Fruits', 3),
(4, 1, 'Café & Thé', 4),
(4, 1, 'Vins', 5),
(4, 1, 'Bières', 6),
(4, 1, 'Alcools', 7)
ON CONFLICT DO NOTHING;

-- SECTEUR HYGIÈNE & BEAUTÉ (id=5)
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(5, 1, 'Cosmétiques', 1),
(5, 1, 'Parfumerie', 2),
(5, 1, 'Hygiène Corporelle', 3),
(5, 1, 'Hygiène Bucco-dentaire', 4),
(5, 1, 'Bébé', 5)
ON CONFLICT DO NOTHING;

-- SECTEUR ENTRETIEN (id=6)
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(6, 1, 'Lessive', 1),
(6, 1, 'Vaisselle', 2),
(6, 1, 'Nettoyage Sol', 3),
(6, 1, 'Papeterie', 4)
ON CONFLICT DO NOTHING;

-- SECTEUR TEXTILE (id=7)
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(7, 1, 'Vêtements Homme', 1),
(7, 1, 'Vêtements Femme', 2),
(7, 1, 'Vêtements Enfant', 3),
(7, 1, 'Linge de Maison', 4)
ON CONFLICT DO NOTHING;

-- SECTEUR BAZAR (id=8)
INSERT INTO public.departments (sector_id, store_id, name, display_order) VALUES
(8, 1, 'Jouets', 1),
(8, 1, 'Électronique', 2),
(8, 1, 'Bricolage', 3),
(8, 1, 'Jardin', 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. EXEMPLE D'ASSIGNATION D'EMPLOYÉS (à adapter avec vos données)
-- ============================================================================
-- Mettre à jour les employés existants avec des affectations de rayons
-- (À exécuter après avoir créé de vrais employés)
/*
UPDATE employees SET department_id = 1, sector_id = 1 WHERE first_name = 'Isabelle'; -- Fromage
UPDATE employees SET department_id = 2, sector_id = 1 WHERE first_name = 'Enzo'; -- Yaourt
*/

COMMENT ON TABLE public.sectors IS 'Secteurs du magasin (Frais, Épicerie, Boissons, etc.)';
COMMENT ON TABLE public.departments IS 'Rayons individuels au sein de chaque secteur';
COMMENT ON TABLE public.employee_schedules IS 'Horaires de travail des employés par jour';
COMMENT ON COLUMN public.tasks.packages_count IS 'Nombre de colis à traiter';
COMMENT ON COLUMN public.tasks.calculated_duration IS 'Durée calculée automatiquement: (nb_colis × 42s) × 1.2';
COMMENT ON COLUMN public.tasks.time_per_package IS 'Temps moyen par colis en secondes (défaut 42s)';
