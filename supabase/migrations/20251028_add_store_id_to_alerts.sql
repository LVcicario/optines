-- Migration: Ajouter store_id à la table alerts
-- Date: 28 octobre 2025
-- Raison: Isolation multi-store pour les alertes
-- Bug fix: Les directeurs voient les alertes de tous les magasins

-- =====================================================
-- ÉTAPE 1: Ajouter la colonne store_id (nullable)
-- =====================================================
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);

-- =====================================================
-- ÉTAPE 2: Remplir les données existantes
-- =====================================================
-- Mettre à jour store_id en récupérant le store_id du manager concerné
UPDATE alerts
SET store_id = (
  SELECT store_id
  FROM users
  WHERE users.id = alerts.manager_id
)
WHERE store_id IS NULL;

-- =====================================================
-- ÉTAPE 3: Rendre la colonne obligatoire
-- =====================================================
-- Après avoir rempli toutes les valeurs, rendre NOT NULL
ALTER TABLE alerts
ALTER COLUMN store_id SET NOT NULL;

-- =====================================================
-- ÉTAPE 4: Créer un index pour optimiser les requêtes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_alerts_store_id
ON alerts(store_id);

-- Index composé pour les requêtes fréquentes (store + is_read)
CREATE INDEX IF NOT EXISTS idx_alerts_store_read
ON alerts(store_id, is_read);

-- =====================================================
-- ÉTAPE 5: Ajouter RLS (Row Level Security)
-- =====================================================
-- Activer RLS sur la table alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs ne peuvent voir que les alertes de leur magasin
CREATE POLICY alerts_select_policy ON alerts
FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM users WHERE id = auth.uid()
  )
);

-- Politique: Seuls les directeurs peuvent créer des alertes
CREATE POLICY alerts_insert_policy ON alerts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'director'
    AND store_id = alerts.store_id
  )
);

-- Politique: Seuls les directeurs et le manager concerné peuvent mettre à jour les alertes
CREATE POLICY alerts_update_policy ON alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'director' OR id = alerts.manager_id
    )
    AND store_id = alerts.store_id
  )
);

-- Politique: Seuls les directeurs peuvent supprimer des alertes
CREATE POLICY alerts_delete_policy ON alerts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'director'
    AND store_id = alerts.store_id
  )
);

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================
-- Vérifier que toutes les alertes ont un store_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM alerts WHERE store_id IS NULL) THEN
    RAISE EXCEPTION 'Migration failed: Some alerts still have NULL store_id';
  END IF;
END $$;

-- Afficher un résumé
DO $$
DECLARE
  alert_count INTEGER;
  store_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alert_count FROM alerts;
  SELECT COUNT(DISTINCT store_id) INTO store_count FROM alerts;

  RAISE NOTICE '✅ Migration terminée avec succès';
  RAISE NOTICE '📊 % alertes mises à jour', alert_count;
  RAISE NOTICE '🏪 % magasins concernés', store_count;
END $$;
