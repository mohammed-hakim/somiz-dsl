

INSERT INTO Demandes (
    num_demande, Date_Demande, Code_Affaire, Date_Debut_Prestation, Date_Fin_Prestation, 
    description, utilisateur, demandeur_structure, Status, 
    validateur_demandeur, date_validation_demandeur, 
    validateur_dsl, date_validation_prestataire, motif_rejet, lieu_prestation
) VALUES 

-- ====================================================================================
-- BLOC 1 : CLÔTURÉ (Du 20/04/2026 au 21/04/2026) - Terminées et validées
-- ====================================================================================
('ISI-001-26', '2026-04-19 08:30:00', '851477R', '2026-04-20', '2026-04-21', 'Besoin échafaudage urgent', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:00:00', '048009', '2026-04-19 10:00:00', NULL, 'Zone A'),
('ISI-002-26', '2026-04-19 08:35:00', '851560R', '2026-04-20', '2026-04-21', 'Tubes 4M pour maintenance', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:15:00', '048009', '2026-04-19 10:15:00', NULL, 'Zone B'),
('ISI-003-26', '2026-04-19 08:40:00', '851561R', '2026-04-20', '2026-04-21', 'Madriers pour support', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:30:00', '048009', '2026-04-19 10:20:00', NULL, 'Atelier Central'),
('ISI-004-26', '2026-04-19 08:50:00', '851645R', '2026-04-20', '2026-04-21', 'Plaques appui', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:40:00', '048009', '2026-04-19 10:30:00', NULL, 'Zone C'),
('ISI-005-26', '2026-04-19 09:00:00', '851724R', '2026-04-20', '2026-04-21', 'Colliers divers angles', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:45:00', '048009', '2026-04-19 10:45:00', NULL, 'Parc ISI'),

-- ====================================================================================
-- BLOC 2 : APPROUVÉ (Du 22/04/2026 au 24/04/2026) - Prévues après la clôture du bloc 1
-- Les mêmes équipements sont réutilisés ici (Aucun conflit de disponibilité)
-- ====================================================================================
('ISI-006-26', '2026-04-20 10:00:00', '851477R', '2026-04-22', '2026-04-24', 'Travaux en hauteur (Phase 2)', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 08:00:00', '048009', '2026-04-21 11:00:00', NULL, 'Zone A'),
('ISI-007-26', '2026-04-20 10:15:00', '851560R', '2026-04-22', '2026-04-24', 'Tubes supplémentaires', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 08:30:00', '048009', '2026-04-21 11:15:00', NULL, 'Zone B'),
('ISI-008-26', '2026-04-20 10:30:00', '851561R', '2026-04-22', '2026-04-24', 'Remplacement Madriers', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 09:00:00', '048009', '2026-04-21 11:30:00', NULL, 'Atelier Central'),
('ISI-009-26', '2026-04-20 11:00:00', '851645R', '2026-04-22', '2026-04-24', 'Socles de base', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 09:15:00', '048009', '2026-04-21 11:45:00', NULL, 'Zone C'),
('ISI-010-26', '2026-04-20 11:30:00', '851724R', '2026-04-22', '2026-04-24', 'Sécurisation colliers', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 09:30:00', '048009', '2026-04-21 12:00:00', NULL, 'Parc ISI'),

-- ====================================================================================
-- BLOC 3 : EN COURS (Du 25/04/2026 au 27/04/2026) - En cours d'utilisation
-- Équipements réutilisés après le bloc 2 (Aucun conflit de disponibilité)
-- ====================================================================================
('ISI-011-26', '2026-04-23 09:00:00', '851477R', '2026-04-25', '2026-04-27', 'Finition travaux hauteur', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 08:30:00', '048009', '2026-04-24 10:00:00', NULL, 'Zone A'),
('ISI-012-26', '2026-04-23 09:30:00', '851560R', '2026-04-25', '2026-04-27', 'Tubes pour inspection', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 08:45:00', '048009', '2026-04-24 10:15:00', NULL, 'Zone B'),
('ISI-013-26', '2026-04-23 10:00:00', '851561R', '2026-04-25', '2026-04-27', 'Stabilisation madriers', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 09:00:00', '048009', '2026-04-24 10:30:00', NULL, 'Atelier Central'),
('ISI-014-26', '2026-04-23 10:30:00', '851645R', '2026-04-25', '2026-04-27', 'Repositionnement socles', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 09:30:00', '048009', '2026-04-24 11:00:00', NULL, 'Zone C'),
('ISI-015-26', '2026-04-23 11:00:00', '851724R', '2026-04-25', '2026-04-27', 'Derniers colliers', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 10:00:00', '048009', '2026-04-24 11:30:00', NULL, 'Parc ISI'),

-- ====================================================================================
-- BLOC 4 : REJETÉ (Dates variées) - Ne posent pas de problèmes de dispo car rejetés
-- ====================================================================================
('ISI-016-26', '2026-04-19 14:00:00', '851477R', '2026-04-22', '2026-04-26', 'Demande en doublon', '010874', 'ISI', 'Rejeté', '048045', '2026-04-20 09:00:00', '048009', '2026-04-20 14:00:00', 'Chevauchement de dates avec ISI-006-26', 'Zone A'),
('ISI-017-26', '2026-04-18 10:00:00', '851560R', '2026-04-20', '2026-04-25', 'Erreur de saisie de période', '010874', 'ISI', 'Rejeté', '048045', '2026-04-19 09:00:00', '048009', '2026-04-19 14:30:00', 'Demande trop longue, revoir planning', 'Zone B'),
('ISI-018-26', '2026-04-20 08:00:00', '851561R', '2026-04-21', '2026-04-23', 'Intervention annulée', '010874', 'ISI', 'Rejeté', '048045', '2026-04-20 10:00:00', '048009', '2026-04-20 15:00:00', 'Matériel indisponible pour maintenance curative', 'Zone D'),
('ISI-019-26', '2026-04-24 15:00:00', '851645R', '2026-04-26', '2026-04-27', 'Manque ODS', '010874', 'ISI', 'Rejeté', '048045', '2026-04-25 08:00:00', '048009', '2026-04-25 10:00:00', 'Veuillez fournir le numéro ODS', 'Zone E'),
('ISI-020-26', '2026-04-22 10:00:00', '851724R', '2026-04-25', '2026-04-26', 'Marteau piqueur defect', '010874', 'ISI', 'Rejeté', '048045', '2026-04-23 09:00:00', '048009', '2026-04-23 11:00:00', 'Équipement en cours de réparation (Curatif)', 'Zone F'),

-- ====================================================================================
-- BLOC 5 : EN ATTENTE / VALIDÉ / ANNULÉ (Dates variées) - Ne bloquent pas la dispo
-- ====================================================================================
('ISI-021-26', '2026-04-24 16:00:00', '851477R', '2026-04-26', '2026-04-27', 'Camion Grue Attente', '010874', 'ISI', 'En Attente', NULL, NULL, NULL, NULL, NULL, 'Base Logistique'),
('ISI-022-26', '2026-04-22 11:00:00', '851560R', '2026-04-25', '2026-04-26', 'Besoin Raccords (En cours validation)', '010874', 'ISI', 'Validé', '048045', '2026-04-23 08:00:00', NULL, NULL, NULL, 'Parc ISI'),
('ISI-023-26', '2026-04-20 09:00:00', '851561R', '2026-04-22', '2026-04-23', 'Annulation par le demandeur', '010874', 'ISI', 'Annulé', '048045', '2026-04-20 10:00:00', NULL, NULL, NULL, 'Zone C'),
('ISI-024-26', '2026-04-18 15:00:00', '851645R', '2026-04-20', '2026-04-22', 'Attente validation chef', '010874', 'ISI', 'En Attente', NULL, NULL, NULL, NULL, NULL, 'Atelier Central'),
('ISI-025-26', '2026-04-18 16:00:00', '851724R', '2026-04-20', '2026-04-21', 'Validé mais en attente prestataire', '010874', 'ISI', 'Validé', '048045', '2026-04-19 08:00:00', NULL, NULL, NULL, 'Base Vie');


-- ==============================================================================
-- 2. INSERTION DES ÉQUIPEMENTS LIÉS AUX DEMANDES (Demande_Engins)
-- ==============================================================================

INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES 
-- Bloc 1 : Clôturé (20/04 au 21/04)
('ISI-001-26', 'H*1'),  -- TUBES D ECHAFAUDAGE 6 M
('ISI-002-26', 'H*2'),  -- TUBES D ECHAFAUDAGE DE 4M
('ISI-003-26', 'H*10'), -- MADRIERS D ECHAFAUDAGE 1M
('ISI-004-26', 'H*11'), -- PLAQUES D APPUI (SOCLES)
('ISI-005-26', 'H*12'), -- COLLIERS A ANGLE DROIT
('ISI-005-26', 'H*13'), -- COLLIERS PIVOTANTS (2 équipements pour cette demande)

-- Bloc 2 : Approuvé (22/04 au 24/04) => Mêmes équipements, mais dates ultérieures
('ISI-006-26', 'H*1'),
('ISI-007-26', 'H*2'),
('ISI-008-26', 'H*10'),
('ISI-009-26', 'H*11'),
('ISI-010-26', 'H*12'),
('ISI-010-26', 'H*13'),

-- Bloc 3 : En Cours (25/04 au 27/04) => Mêmes équipements, mais dates encore ultérieures
('ISI-011-26', 'H*1'),
('ISI-012-26', 'H*2'),
('ISI-013-26', 'H*10'),
('ISI-014-26', 'H*11'),
('ISI-015-26', 'H*12'),
('ISI-015-26', 'H*13'),

-- Bloc 4 : Rejeté (Chevauchements de dates possibles mais inoffensifs car rejetés)
('ISI-016-26', 'H*1'),
('ISI-017-26', 'H*2'),
('ISI-018-26', 'H*14'), -- RACCORDS
('ISI-019-26', 'H*15'), -- MATERIELS D ECHAFAUDAGE
('ISI-020-26', 'H*16'), -- MARTEAU PIQUEUR

-- Bloc 5 : En Attente / Validé / Annulé
('ISI-021-26', 'H*17'), -- Camion 10 T grue
('ISI-022-26', 'H*14'), -- RACCORDS
('ISI-023-26', 'H*15'), -- MATERIELS D ECHAFAUDAGE
('ISI-024-26', 'H*16'), -- MARTEAU PIQUEUR
('ISI-025-26', 'H*17'); -- Camion 10 T grue




-- ==============================================================================
-- 1. INSERTION DES NOUVELLES DEMANDES (SOUS-TRAITANCE CPA)
-- ==============================================================================

INSERT INTO Demandes (
    num_demande, Date_Demande, Code_Affaire, Date_Debut_Prestation, Date_Fin_Prestation, 
    description, utilisateur, demandeur_structure, Status, 
    validateur_demandeur, date_validation_demandeur, 
    validateur_dsl, date_validation_prestataire, 
    Fournisseur, date_cpa, lieu_prestation
) VALUES 

('ISI-026-26', '2026-04-18 08:00:00', '851477R', '2026-04-20', '2026-04-22', 'Location Raccords spécifiques', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-18 09:30:00', '048009', '2026-04-18 11:00:00', 'SARL TRANS-MECA', '2026-04-19 10:00:00', 'Zone A'),
('ISI-027-26', '2026-04-18 08:30:00', '851560R', '2026-04-23', '2026-04-25', 'Location matériels échafaudage lourds', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-18 10:00:00', '048009', '2026-04-18 13:30:00', 'EURL EQUIP-PRO', '2026-04-19 14:30:00', 'Zone B'),
('ISI-028-26', '2026-04-19 09:00:00', '851561R', '2026-04-21', '2026-04-23', 'Sous traitance Marteau Piqueur (Panne interne)', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-19 09:45:00', '048009', '2026-04-19 11:30:00', 'SNC BTP EXPRESS', '2026-04-20 09:00:00', 'Atelier Central'),
('ISI-029-26', '2026-04-20 08:00:00', '851645R', '2026-04-24', '2026-04-27', 'Besoin Camion Grue 10T externe', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-20 10:00:00', '048009', '2026-04-20 14:00:00', 'ENTREPRISE LEVAGE AL', '2026-04-21 11:00:00', 'Zone C'),
('ISI-030-26', '2026-04-21 09:00:00', '851724R', '2026-04-26', '2026-04-27', 'Renfort Marteau Piqueur', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-21 10:30:00', '048009', '2026-04-21 15:00:00', 'SNC BTP EXPRESS', '2026-04-22 10:15:00', 'Base Logistique');


-- ==============================================================================
-- 2. INSERTION DES ÉQUIPEMENTS LIÉS (Demande_Engins)
-- ==============================================================================

INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES 
('ISI-026-26', 'H*14'), -- RACCORDS (Dispo car uniquement utilisé en bloc Rejeté/Attente précédemment)
('ISI-027-26', 'H*15'), -- MATERIELS D ECHAFAUDAGE
('ISI-028-26', 'H*16'), -- MARTEAU PIQUEUR
('ISI-029-26', 'H*17'), -- Camion 10 T grue
('ISI-030-26', 'H*16'); -- MARTEAU PIQUEUR (Réutilisé après la fin de la demande ISI-028-26)




-- ==============================================================================
-- 1. INSERTION DES RÈGLES DE MAINTENANCE (MaintenanceRules)
-- ==============================================================================

INSERT INTO MaintenanceRules (
    code_prestation, type_maintenance, interval_km, interval_days, 
    alert_before_km, alert_before_days, is_active
) VALUES 
-- Raccords : Contrôle visuel tous les 180 jours (environ 6 mois), alerte 15 jours avant
('H*14', 'CONTROLE_USURE', NULL, 180, NULL, 15, 1),

-- Matériels d'échafaudage : Inspection structurelle tous les 180 jours
('H*15', 'INSPECTION_ECHAFAUDAGE', NULL, 180, NULL, 15, 1),

-- Marteau piqueur : Entretien annuel tous les 365 jours, alerte 30 jours avant
('H*16', 'ENTRETIEN_ANNUEL', NULL, 365, NULL, 30, 1),

-- Camion 10 T grue : Véhicule roulant, donc on garde l'intervalle KM ET Jours (le premier échu)
('H*17', 'VIDANGE', 10000, 365, 1000, 30, 1),

-- Tubes d'échafaudage : Inspection structurelle tous les 180 jours
('H*1', 'INSPECTION_ECHAFAUDAGE', NULL, 180, NULL, 15, 1);

-- ==============================================================================
-- 2. INSERTION DES DEMANDES DE MAINTENANCE (MaintenanceRequests)
-- Période : 20 Avril 2026 au 27 Avril 2026
-- ==============================================================================

-- ==============================================================================
-- 2. INSERTION DES DEMANDES DE MAINTENANCE (MaintenanceRequests)
-- Période : 20 Avril 2026 au 27 Avril 2026
-- ==============================================================================
INSERT INTO MaintenanceRequests (
    code_prestation, type_maintenance, date_debut, date_fin, kilometrage_actuel,
    description, status, demandeur_matricule, demandeur_structure,
    validateur_matricule, date_demande, date_validation,
    date_debut_reelle, date_fin_reelle, motif_rejet
) VALUES
-- 1. H15 (MATERIELS D ECHAFAUDAGE) : Équipement statique 
('H*15', 'INSPECTION_ECHAFAUDAGE', '2026-04-20', '2026-04-21', NULL,
 'Inspection visuelle et remplacement d''éléments tordus suite à usure constatée', 'TERMINE',
 '010873', 'DSL', '048009', '2026-04-18 08:00:00', '2026-04-18 10:00:00',
 '2026-04-20 08:00:00', '2026-04-21 16:00:00', NULL),

-- 2. H17 (Camion 10 T grue) : Véhicule roulant (Maintien du KM et de la Vidange)
('H*17', 'VIDANGE', '2026-04-21', '2026-04-22', 125400,
 'Vidange préventive avant affection chantier lourd', 'TERMINE',
 '010873', 'DSL', '048009', '2026-04-19 09:00:00', '2026-04-19 14:00:00',
 '2026-04-21 08:30:00', '2026-04-22 15:30:00', NULL),

-- 3. H16 (MARTEAU PIQUEUR) : Outil électroportatif ou pneumatique (Pas de KM, basé sur le temps)
('H*16', 'ENTRETIEN_ANNUEL', '2026-04-24', '2026-04-25', NULL,
 'Entretien annuel (graissage du système de frappe) après 365 jours de location', 'VALIDE',
 '010873', 'DSL', '048009', '2026-04-20 11:00:00', '2026-04-21 09:00:00',
 NULL, NULL, NULL),

-- 4. H14 (RACCORDS) : Pièces d'assemblage (Pas de KM)
('H*14', 'CONTROLE_USURE', '2026-04-24', '2026-04-26', NULL,
 'Vérification de la visserie, des filetages et tri des pièces défectueuses', 'EN_COURS',
 '010873', 'DSL', '048009', '2026-04-22 10:00:00', '2026-04-22 15:00:00',
 '2026-04-24 08:00:00', NULL, NULL),

-- 5. H1 (TUBES D ECHAFAUDAGE 6 M) : Matériel de structure (Pas de KM)
('H*1', 'INSPECTION_ECHAFAUDAGE', '2026-04-22', '2026-04-23', NULL,
 'Vérification de la rectitude des tubes et contrôle anticorrosion', 'REJETE',
 '010873', 'DSL', '048009', '2026-04-20 14:00:00', '2026-04-21 08:30:00',
 NULL, NULL, 'Rejeté : Équipement actuellement déployé sur chantier (ISI) du 20 au 27 Avril.');


-- ==============================================================================
-- 3. KILOMÉTRAGES ACTUELS DES ÉQUIPEMENTS (EquipementKm)
-- ==============================================================================
INSERT INTO EquipementKm (code_prestation, current_km, updated_by) VALUES
('H*17', 134900, '010873');
