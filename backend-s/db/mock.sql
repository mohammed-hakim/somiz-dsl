-- -- ============================================
-- -- MOCK DATA: DEMANDES
-- -- ============================================
-- -- Status values used: 'En Attente', 'Validé', 'Rejeté', 'Clôturé'
-- INSERT INTO Demandes (
--     num_demande, Date_Demande, Code_Affaire, Date_Debut_Prestation, Date_Fin_Prestation, 
--     description, Observation, utilisateur, date_validation_demandeur, validateur_demandeur, 
--     Status, date_validation_prestataire, validateur_dsl, OT_ODS, Fournisseur, 
--     motif_rejet, ref_ods_client, lieu_prestation, demandeur_structure, date_cpa
-- ) VALUES 
-- -- Demande 1 : Validée par le chef de département ISI et le chef DSL
-- ('DM-2023-001', '2023-10-01 08:30:00', '851477R', '2023-10-05', '2023-10-10', 
--  'Demande de matériel pour échafaudage', 'Urgent', '010874', '2023-10-01 10:00:00', '068184', 
--  'Validé', '2023-10-02 09:15:00', '010870', 'OT-10254', NULL, 
--  NULL, 'ODS-CLI-001', 'Site EGZIA', 'ISI', NULL),

-- -- Demande 2 : En Attente de validation (demandeur MVE)
-- ('DM-2023-002', '2023-10-15 14:20:00', '851560R', '2023-10-20', '2023-11-20', 
--  'Location Camion Grue pour chantier Naftal', 'Prévoir chauffeur', '010883', NULL, NULL, 
--  'En Attente', NULL, NULL, NULL, 'EXTERN_LOU', 
--  NULL, 'ODS-NAF-887', 'Site DJELFA', 'MVE', NULL),

-- -- Demande 3 : Rejetée par le prestataire (DSL) pour indisponibilité
-- ('DM-2023-003', '2023-11-02 09:00:00', '851645R', '2023-11-05', '2023-11-15', 
--  'Besoin de marteaux piqueurs', 'Chantier DRIZ', '010871', '2023-11-02 11:30:00', '010872', 
--  'Rejeté', '2023-11-03 08:45:00', '048009', NULL, NULL, 
--  'Matériel indisponible aux dates demandées', 'ODS-DRIZ-44', 'Base Logistique', 'CPA', NULL);


-- -- ============================================
-- -- MOCK DATA: DEMANDE_ENGINS
-- -- ============================================
-- INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES 
-- -- Matériel pour DM-2023-001 (Echafaudage)
-- ('DM-2023-001', 'H*1'),  -- TUBES D ECHAFAUDAGE 6 M
-- ('DM-2023-001', 'H*11'), -- PLAQUES D APPUI
-- ('DM-2023-001', 'H*12'), -- COLLIERS A ANGLE DROIT

-- -- Matériel pour DM-2023-002 (Camion Grue)
-- ('DM-2023-002', 'H*17'), -- Camion 10 T grue

-- -- Matériel pour DM-2023-003 (Marteau Piqueur)
-- ('DM-2023-003', 'H*16'); -- MARTEAU PIQUEUR


-- -- ============================================
-- -- MOCK DATA: MAINTENANCE RULES
-- -- ============================================
-- -- Règles de maintenance préventive pour le Camion 10 T grue (H*17) et le Marteau Piqueur (H*16)
-- INSERT INTO MaintenanceRules (
--     code_prestation, type_maintenance, interval_km, interval_days, 
--     alert_before_km, alert_before_days, is_active
-- ) VALUES 
-- -- Camion Grue : Vidange tous les 10 000 km ou 180 jours, alerte 500 km ou 15 jours avant
-- ('H*17', 'VIDANGE', 10000, 180, 500, 15, 1),
-- -- Camion Grue : Changement pneus tous les 50 000 km, alerte 1000 km avant
-- ('H*17', 'PNEUS', 50000, 730, 1000, 30, 1),
-- -- Camion Grue : Révision Générale 30k
-- ('H*17', 'REVISION_30K', 30000, 365, 1500, 20, 1),
-- -- Marteau Piqueur : Révision préventive basée sur les jours (tous les 90 jours)
-- ('H*16', 'REVISION_10K', NULL, 90, NULL, 10, 1);


-- -- ============================================
-- -- MOCK DATA: MAINTENANCE REQUESTS
-- -- ============================================
-- -- Contraintes de statut : 'EN_ATTENTE', 'VALIDE', 'REJETE', 'EN_COURS', 'TERMINE'
-- INSERT INTO MaintenanceRequests (
--     code_prestation, type_maintenance, date_debut, date_fin, kilometrage_actuel, 
--     description, status, demandeur_matricule, demandeur_structure, validateur_matricule, 
--     date_demande, date_validation, date_debut_reelle, date_fin_reelle, motif_rejet
-- ) VALUES 
-- -- 1. Intervention terminée (Vidange Camion)
-- ('H*17', 'VIDANGE', '2023-09-01', '2023-09-02', 49850, 
--  'Vidange de routine et changement de filtres', 'TERMINE', '010873', 'DSL', '010870', 
--  '2023-08-25 10:00:00', '2023-08-26 09:00:00', '2023-09-01 08:00:00', '2023-09-01 16:30:00', NULL),

-- -- 2. Intervention en cours (Changement Pneus Camion)
-- ('H*17', 'PNEUS', '2023-11-10', '2023-11-12', 50120, 
--  'Remplacement des 6 pneus suite à l''usure constatée', 'EN_COURS', '010873', 'DSL', '010870', 
--  '2023-11-05 14:00:00', '2023-11-06 10:00:00', '2023-11-10 08:30:00', NULL, NULL),

-- -- 3. Intervention en attente (Panne mécanique Marteau Piqueur)
-- ('H*16', 'REPARATION_MECA', '2023-11-20', '2023-11-22', NULL, 
--  'Le marteau ne démarre plus, suspecte un blocage du piston', 'EN_ATTENTE', '010874', 'ISI', NULL, 
--  '2023-11-18 08:15:00', NULL, NULL, NULL, NULL),

-- -- 4. Intervention rejetée (Demande injustifiée pour un échafaudage)
-- ('H*1', 'REPARATION_MECA', '2023-10-15', '2023-10-16', NULL, 
--  'Tube tordu à redresser', 'REJETE', '010883', 'MVE', '010894', 
--  '2023-10-10 09:00:00', '2023-10-11 11:00:00', NULL, NULL, 'Matériel consommable, à remplacer au lieu de réparer'),

-- -- 5. Demande validée, en attente d'exécution (Dépannage Camion Grue sur site)
-- ('H*17', 'DEPANNAGE', '2023-11-25', '2023-11-25', 50500, 
--  'Problème hydraulique sur la grue signalé sur le chantier de Djelfa', 'VALIDE', '010883', 'MVE', '010894', 
--  '2023-11-23 15:30:00', '2023-11-23 16:00:00', NULL, NULL, NULL);



--  -- ============================================
-- -- MOCK DATA: DEMANDES (Scenarios supplémentaires)
-- -- ============================================
-- INSERT INTO Demandes (
--     num_demande, Date_Demande, Code_Affaire, Date_Debut_Prestation, Date_Fin_Prestation, 
--     description, Observation, utilisateur, date_validation_demandeur, validateur_demandeur, 
--     Status, date_validation_prestataire, validateur_dsl, OT_ODS, Fournisseur, 
--     motif_rejet, ref_ods_client, lieu_prestation, demandeur_structure, date_cpa
-- ) VALUES 
-- -- Demande 4 : Clôturée avec succès (Structure CPA pour l'affaire DRIZ)
-- ('DM-2023-004', '2023-02-10 08:00:00', '851645R', '2023-02-15', '2023-03-15', 
--  'Installation complète échafaudage pour façade principale', 'Chantier prioritaire', '010871', '2023-02-10 09:30:00', '010872', 
--  'Clôturé', '2023-02-11 10:00:00', '010870', 'OT-09921', NULL, 
--  NULL, 'ODS-DRIZ-02', 'Site DRIZ Sud', 'CPA', '2023-03-20'),

-- -- Demande 5 : Validée et en cours (Structure MVE pour Naftal Djelfa)
-- ('DM-2023-005', '2023-11-28 10:15:00', '851560R', '2023-12-01', '2023-12-15', 
--  'Renfort matériel échafaudage + Marteau', 'Extension de la zone de travail', '010883', '2023-11-28 14:00:00', '010894', 
--  'Validé', '2023-11-29 08:30:00', '010870', 'OT-10300', NULL, 
--  NULL, 'ODS-NAF-102', 'Naftal Djelfa Zone B', 'MVE', NULL),

-- -- Demande 6 : Rejetée par le Chef de Département du Demandeur (ISI)
-- ('DM-2023-006', '2023-12-05 11:00:00', '851477R', '2023-12-10', '2023-12-12', 
--  'Location Camion Grue pour déplacement de charge légère', 'Test', '010874', '2023-12-05 11:30:00', '068184', 
--  'Rejeté', NULL, NULL, NULL, NULL, 
--  'Utilisation du camion grue non justifiée pour des charges légères', NULL, 'Base Logistique', 'ISI', NULL);

-- -- ============================================
-- -- MOCK DATA: DEMANDE_ENGINS (Détails pour les nouvelles demandes)
-- -- ============================================
-- INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES 
-- -- Matériel pour DM-2023-004 (Gros lot échafaudage)
-- ('DM-2023-004', 'H*2'),  -- TUBES 4M
-- ('DM-2023-004', 'H*10'), -- MADRIERS 1M
-- ('DM-2023-004', 'H*13'), -- COLLIERS PIVOTANTS
-- ('DM-2023-004', 'H*14'), -- RACCORDS
-- ('DM-2023-004', 'H*15'), -- MATERIELS D ECHAFAUDAGE

-- -- Matériel pour DM-2023-005 (Renfort Echafaudage + Marteau)
-- ('DM-2023-005', 'H*1'),  -- TUBES 6M
-- ('DM-2023-005', 'H*11'), -- PLAQUES D APPUI
-- ('DM-2023-005', 'H*16'), -- MARTEAU PIQUEUR

-- -- Matériel pour DM-2023-006 (Camion Grue refusé)
-- ('DM-2023-006', 'H*17'); -- Camion 10 T grue

-- -- ============================================
-- -- MOCK DATA: MAINTENANCE RULES (Règles supplémentaires)
-- -- ============================================
-- INSERT INTO MaintenanceRules (
--     code_prestation, type_maintenance, interval_km, interval_days, 
--     alert_before_km, alert_before_days, is_active
-- ) VALUES 
-- -- Camion Grue : Maintenance des freins tous les 20 000 km
-- ('H*17', 'FREINS', 20000, 365, 1000, 30, 1),
-- -- Camion Grue : Grosse révision complète à 20 000 km
-- ('H*17', 'REVISION_20K', 20000, 730, 1000, 45, 1),
-- -- Marteau Piqueur : Grosse révision annuelle
-- ('H*16', 'REVISION_20K', NULL, 365, NULL, 30, 1);

-- -- ============================================
-- -- MOCK DATA: MAINTENANCE REQUESTS (Nouveaux historiques d'interventions)
-- -- ============================================
-- INSERT INTO MaintenanceRequests (
--     code_prestation, type_maintenance, date_debut, date_fin, kilometrage_actuel, 
--     description, status, demandeur_matricule, demandeur_structure, validateur_matricule, 
--     date_demande, date_validation, date_debut_reelle, date_fin_reelle, motif_rejet
-- ) VALUES 
-- -- 6. Curatif : Problème électrique sur Camion Grue (Terminé)
-- ('H*17', 'REPARATION_ELEC', '2023-05-14', '2023-05-15', 42100, 
--  'Remplacement démarreur et vérification alternateur', 'TERMINE', '010873', 'DSL', '010870', 
--  '2023-05-13 08:00:00', '2023-05-13 09:30:00', '2023-05-14 08:00:00', '2023-05-15 14:00:00', NULL),

-- -- 7. Curatif : Réparation carrosserie Camion Grue (En cours)
-- ('H*17', 'CARROSSERIE', '2023-12-01', '2023-12-10', 50550, 
--  'Redressement pare-choc avant et peinture suite à accrochage sur chantier', 'EN_COURS', '010883', 'MVE', '010894', 
--  '2023-11-28 16:00:00', '2023-11-29 10:00:00', '2023-12-01 08:00:00', NULL, NULL),

-- -- 8. Préventif : Remplacement freins Camion Grue (Validé, en attente d'entrée à l'atelier)
-- ('H*17', 'FREINS', '2023-12-15', '2023-12-16', 50550, 
--  'Remplacement plaquettes et disques de frein', 'VALIDE', '010873', 'DSL', '010870', 
--  '2023-12-05 09:00:00', '2023-12-06 11:15:00', NULL, NULL, NULL),

-- -- 9. Préventif : Révision complète Marteau Piqueur (En Attente)
-- ('H*16', 'REVISION_20K', '2023-12-20', '2023-12-25', NULL, 
--  'Maintenance annuelle complète du système pneumatique', 'EN_ATTENTE', '010871', 'CPA', NULL, 
--  '2023-12-06 14:30:00', NULL, NULL, NULL, NULL),

-- -- 10. Curatif : Rejeté (Demande de réparation pour des madriers d'échafaudage)
-- ('H*10', 'REPARATION_MECA', '2023-07-10', '2023-07-11', NULL, 
--  'Madrier cassé à réparer', 'REJETE', '010874', 'ISI', '068184', 
--  '2023-07-09 10:00:00', '2023-07-09 14:00:00', NULL, NULL, 'Pièce en bois cassée, veuillez procéder à un rebut direct');



-- -- Vider le journal existant pour insérer les données complètes
-- DELETE FROM Journal;
-- DELETE FROM sqlite_sequence WHERE name='Journal'; -- Reset de l'auto-incrément

-- INSERT INTO Journal (
--     UTILISATEUR, TYPE_OPERATION, DATE, COMPTE_WIN, NOM_MACHINE, ADRESSE_IP, 
--     NOM_TABLE, CODE_PIECE, ANCIENNE_VALEUR, OBSERVATION, DATE_EXECUTABLE, EXERCICE
-- ) VALUES 
-- -- ==========================================
-- -- AUDIT : DEMANDES (Response 1 & 2)
-- -- ==========================================

-- -- DM-2023-001 (Validée bout en bout)
-- ('010874', 'INSERT', '2023-10-01 08:30:00', 'karim.isi', 'PC-ISI-01', '192.168.1.45', 'Demandes', 'DM-2023-001', NULL, 'Création de la demande (Echafaudage)', '2023-01-01', '2023'),
-- ('068184', 'UPDATE', '2023-10-01 10:00:00', 'ali.isi', 'PC-ISI-DIR', '192.168.1.10', 'Demandes', 'DM-2023-001', 'Status: En Attente', 'Validation demande par Chef Département ISI', '2023-01-01', '2023'),
-- ('010870', 'UPDATE', '2023-10-02 09:15:00', 'anes.dsl', 'PC-DSL-DIR', '192.168.2.11', 'Demandes', 'DM-2023-001', 'Status: Validé', 'Validation finale par DSL et assignation OT-10254', '2023-01-01', '2023'),

-- -- DM-2023-002 (En Attente)
-- ('010883', 'INSERT', '2023-10-15 14:20:00', 'malek.mve', 'PC-MVE-02', '192.168.4.22', 'Demandes', 'DM-2023-002', NULL, 'Création de la demande (Camion Grue Naftal)', '2023-01-01', '2023'),

-- -- DM-2023-003 (Rejetée par DSL)
-- ('010871', 'INSERT', '2023-11-02 09:00:00', 'tayeb.cpa', 'PC-CPA-03', '192.168.3.15', 'Demandes', 'DM-2023-003', NULL, 'Création de la demande (Marteau DRIZ)', '2023-01-01', '2023'),
-- ('010872', 'UPDATE', '2023-11-02 11:30:00', 'fateh.cpa', 'PC-CPA-DIR', '192.168.3.10', 'Demandes', 'DM-2023-003', 'Status: En Attente', 'Validation demande par Chef Département CPA', '2023-01-01', '2023'),
-- ('048009', 'UPDATE', '2023-11-03 08:45:00', 'ahmed.dsl', 'PC-DSL-05', '192.168.2.14', 'Demandes', 'DM-2023-003', 'Status: Validé', 'Rejet DSL : Matériel indisponible', '2023-01-01', '2023'),

-- -- DM-2023-004 (Clôturée)
-- ('010871', 'INSERT', '2023-02-10 08:00:00', 'tayeb.cpa', 'PC-CPA-03', '192.168.3.15', 'Demandes', 'DM-2023-004', NULL, 'Création demande Gros lot Echafaudage', '2023-01-01', '2023'),
-- ('010872', 'UPDATE', '2023-02-10 09:30:00', 'fateh.cpa', 'PC-CPA-DIR', '192.168.3.10', 'Demandes', 'DM-2023-004', 'Status: En Attente', 'Validation demande', '2023-01-01', '2023'),
-- ('010870', 'UPDATE', '2023-02-11 10:00:00', 'anes.dsl', 'PC-DSL-DIR', '192.168.2.11', 'Demandes', 'DM-2023-004', 'Status: Validé', 'Validation DSL OT-09921', '2023-01-01', '2023'),
-- ('010870', 'UPDATE', '2023-03-20 16:00:00', 'anes.dsl', 'PC-DSL-DIR', '192.168.2.11', 'Demandes', 'DM-2023-004', 'Status: Validé', 'Clôture de la demande, retour matériel le 2023-03-20', '2023-01-01', '2023'),

-- -- DM-2023-005 (Validée)
-- ('010883', 'INSERT', '2023-11-28 10:15:00', 'malek.mve', 'PC-MVE-02', '192.168.4.22', 'Demandes', 'DM-2023-005', NULL, 'Création demande renfort Echafaudage', '2023-01-01', '2023'),
-- ('010894', 'UPDATE', '2023-11-28 14:00:00', 'malek_c.mve', 'PC-MVE-DIR', '192.168.4.10', 'Demandes', 'DM-2023-005', 'Status: En Attente', 'Validation MVE', '2023-01-01', '2023'),
-- ('010870', 'UPDATE', '2023-11-29 08:30:00', 'anes.dsl', 'PC-DSL-DIR', '192.168.2.11', 'Demandes', 'DM-2023-005', 'Status: Validé', 'Validation DSL OT-10300', '2023-01-01', '2023'),

-- -- DM-2023-006 (Rejetée par le demandeur)
-- ('010874', 'INSERT', '2023-12-05 11:00:00', 'karim.isi', 'PC-ISI-01', '192.168.1.45', 'Demandes', 'DM-2023-006', NULL, 'Création demande Camion Grue', '2023-01-01', '2023'),
-- ('068184', 'UPDATE', '2023-12-05 11:30:00', 'ali.isi', 'PC-ISI-DIR', '192.168.1.10', 'Demandes', 'DM-2023-006', 'Status: En Attente', 'Rejet demande par Chef : Utilisation non justifiée', '2023-01-01', '2023'),


-- -- ==========================================
-- -- AUDIT : MAINTENANCE (Response 1 & 2)
-- -- ==========================================

-- -- Request ID 1 (Vidange - Terminé)
-- ('010873', 'INSERT', '2023-08-25 10:00:00', 'chehhat.dsl', 'PC-ATELIER-01', '192.168.2.55', 'MaintenanceRequests', 'ID: 1', NULL, 'Demande Vidange H*17', '2023-01-01', '2023'),
-- ('010870', 'UPDATE', '2023-08-26 09:00:00', 'anes.dsl', 'PC-DSL-DIR', '192.168.2.11', 'MaintenanceRequests', 'ID: 1', 'Status: EN_ATTENTE', 'Validation Demande Vidange', '2023-01-01', '2023'),
-- ('010873', 'UPDATE', '2023-09-01 16:30:00', 'chehhat.dsl', 'PC-ATELIER-01', '192.168.2.55', 'MaintenanceRequests', 'ID: 1', 'Status: EN_COURS', 'Clôture de l''intervention Vidange', '2023-01-01', '2023'),

-- -- Request ID 2 (Pneus - En Cours)
-- ('010873', 'INSERT', '2023-11-05 14:00:00', 'chehhat.dsl', 'PC-ATELIER-01', '192.168.2.55', 'MaintenanceRequests', 'ID: 2', NULL, 'Demande Pneus H*17', '2023-01-01', '2023'),
-- ('010870', 'UPDATE', '2023-11-06 10:00:00', 'anes.dsl', 'PC-DSL-DIR', '192.168.2.11', 'MaintenanceRequests', 'ID: 2', 'Status: EN_ATTENTE', 'Validation Demande Pneus', '2023-01-01', '2023'),
-- ('010873', 'UPDATE', '2023-11-10 08:30:00', 'chehhat.dsl', 'PC-ATELIER-01', '192.168.2.55', 'MaintenanceRequests', 'ID: 2', 'Status: VALIDE', 'Début intervention Pneus (EN_COURS)', '2023-01-01', '2023'),

-- -- Request ID 3 (Marteau Panne - En Attente)
-- ('010874', 'INSERT', '2023-11-18 08:15:00', 'karim.isi', 'PC-ISI-01', '192.168.1.45', 'MaintenanceRequests', 'ID: 3', NULL, 'Demande Curative Marteau Piqueur (H*16)', '2023-01-01', '2023'),

-- -- Request ID 4 (Rejetée - Echafaudage)
-- ('010883', 'INSERT', '2023-10-10 09:00:00', 'malek.mve', 'PC-MVE-02', '192.168.4.22', 'MaintenanceRequests', 'ID: 4', NULL, 'Demande Curative Tube Echafaudage', '2023-01-01', '2023'),
-- ('010894', 'UPDATE', '2023-10-11 11:00:00', 'malek_c.mve', 'PC-MVE-DIR', '192.168.4.10', 'MaintenanceRequests', 'ID: 4', 'Status: EN_ATTENTE', 'Rejet : Matériel consommable, rebut direct', '2023-01-01', '2023'),

-- -- Request ID 5 (Dépannage - Validé)
-- ('010883', 'INSERT', '2023-11-23 15:30:00', 'malek.mve', 'PC-MVE-02', '192.168.4.22', 'MaintenanceRequests', 'ID: 5', NULL, 'Demande Urgente Dépannage Grue H*17', '2023-01-01', '2023'),
-- ('010894', 'UPDATE', '2023-11-23 16:00:00', 'malek_c.mve', 'PC-MVE-DIR', '192.168.4.10', 'MaintenanceRequests', 'ID: 5', 'Status: EN_ATTENTE', 'Validation Dépannage', '2023-01-01', '2023'),

-- -- Request ID 6 (Electrique - Terminé)
-- ('010873', 'INSERT', '2023-05-13 08:00:00', 'chehhat.dsl', 'PC-ATELIER-01', '192.168.2.55', 'MaintenanceRequests', 'ID: 6', NULL, 'Problème Electrique H*17', '2023-01-01', '2023'),
-- ('010870', 'UPDATE', '2023-05-15 14:00:00', 'anes.dsl', 'PC-DSL-DIR', '192.168.2.11', 'MaintenanceRequests', 'ID: 6', 'Status: EN_COURS', 'Fin intervention électrique', '2023-01-01', '2023'),

-- -- Request ID 7 (Carrosserie - En cours)
-- ('010883', 'INSERT', '2023-11-28 16:00:00', 'malek.mve', 'PC-MVE-02', '192.168.4.22', 'MaintenanceRequests', 'ID: 7', NULL, 'Demande Carrosserie H*17', '2023-01-01', '2023'),
-- ('010894', 'UPDATE', '2023-12-01 08:00:00', 'malek_c.mve', 'PC-MVE-DIR', '192.168.4.10', 'MaintenanceRequests', 'ID: 7', 'Status: VALIDE', 'Passage en statut EN_COURS', '2023-01-01', '2023'),

-- -- Request ID 8 (Freins - Validé)
-- ('010873', 'INSERT', '2023-12-05 09:00:00', 'chehhat.dsl', 'PC-ATELIER-01', '192.168.2.55', 'MaintenanceRequests', 'ID: 8', NULL, 'Demande Changement Freins H*17', '2023-01-01', '2023'),
-- ('010870', 'UPDATE', '2023-12-06 11:15:00', 'anes.dsl', 'PC-DSL-DIR', '192.168.2.11', 'MaintenanceRequests', 'ID: 8', 'Status: EN_ATTENTE', 'Validation Demande Freins', '2023-01-01', '2023'),

-- -- Request ID 9 (Révision Marteau - En Attente)
-- ('010871', 'INSERT', '2023-12-06 14:30:00', 'tayeb.cpa', 'PC-CPA-03', '192.168.3.15', 'MaintenanceRequests', 'ID: 9', NULL, 'Demande Révision Annuelle H*16', '2023-01-01', '2023'),

-- -- Request ID 10 (Rejetée - Madriers)
-- ('010874', 'INSERT', '2023-07-09 10:00:00', 'karim.isi', 'PC-ISI-01', '192.168.1.45', 'MaintenanceRequests', 'ID: 10', NULL, 'Demande réparation Madrier H*10', '2023-01-01', '2023'),
-- ('068184', 'UPDATE', '2023-07-09 14:00:00', 'ali.isi', 'PC-ISI-DIR', '192.168.1.10', 'MaintenanceRequests', 'ID: 10', 'Status: EN_ATTENTE', 'Rejet : Pièce en bois', '2023-01-01', '2023');




-- ==============================================================================
-- 1. INSERTION DES DEMANDES (DOCUMENTS)
-- Période : 20 Avril 2026 au 27 Avril 2026
-- ==============================================================================

INSERT INTO Demandes (
    num_demande, Date_Demande, Code_Affaire, Date_Debut_Prestation, Date_Fin_Prestation, 
    description, utilisateur, demandeur_structure, Status, 
    validateur_demandeur, date_validation_demandeur, 
    validateur_dsl, date_validation_prestataire, motif_rejet, lieu_prestation
) VALUES 

-- ====================================================================================
-- BLOC 1 : CLÔTURÉ (Du 20/04/2026 au 21/04/2026) - Terminées et validées
-- ====================================================================================
('DEM-2026-001', '2026-04-19 08:30:00', '851477R', '2026-04-20', '2026-04-21', 'Besoin échafaudage urgent', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:00:00', '048009', '2026-04-19 10:00:00', NULL, 'Zone A'),
('DEM-2026-002', '2026-04-19 08:35:00', '851560R', '2026-04-20', '2026-04-21', 'Tubes 4M pour maintenance', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:15:00', '048009', '2026-04-19 10:15:00', NULL, 'Zone B'),
('DEM-2026-003', '2026-04-19 08:40:00', '851561R', '2026-04-20', '2026-04-21', 'Madriers pour support', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:30:00', '048009', '2026-04-19 10:20:00', NULL, 'Atelier Central'),
('DEM-2026-004', '2026-04-19 08:50:00', '851645R', '2026-04-20', '2026-04-21', 'Plaques appui', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:40:00', '048009', '2026-04-19 10:30:00', NULL, 'Zone C'),
('DEM-2026-005', '2026-04-19 09:00:00', '851724R', '2026-04-20', '2026-04-21', 'Colliers divers angles', '010874', 'ISI', 'Clôturé', '048045', '2026-04-19 09:45:00', '048009', '2026-04-19 10:45:00', NULL, 'Parc ISI'),

-- ====================================================================================
-- BLOC 2 : APPROUVÉ (Du 22/04/2026 au 24/04/2026) - Prévues après la clôture du bloc 1
-- Les mêmes équipements sont réutilisés ici (Aucun conflit de disponibilité)
-- ====================================================================================
('DEM-2026-006', '2026-04-20 10:00:00', '851477R', '2026-04-22', '2026-04-24', 'Travaux en hauteur (Phase 2)', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 08:00:00', '048009', '2026-04-21 11:00:00', NULL, 'Zone A'),
('DEM-2026-007', '2026-04-20 10:15:00', '851560R', '2026-04-22', '2026-04-24', 'Tubes supplémentaires', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 08:30:00', '048009', '2026-04-21 11:15:00', NULL, 'Zone B'),
('DEM-2026-008', '2026-04-20 10:30:00', '851561R', '2026-04-22', '2026-04-24', 'Remplacement Madriers', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 09:00:00', '048009', '2026-04-21 11:30:00', NULL, 'Atelier Central'),
('DEM-2026-009', '2026-04-20 11:00:00', '851645R', '2026-04-22', '2026-04-24', 'Socles de base', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 09:15:00', '048009', '2026-04-21 11:45:00', NULL, 'Zone C'),
('DEM-2026-010', '2026-04-20 11:30:00', '851724R', '2026-04-22', '2026-04-24', 'Sécurisation colliers', '010874', 'ISI', 'Approuvé', '048045', '2026-04-21 09:30:00', '048009', '2026-04-21 12:00:00', NULL, 'Parc ISI'),

-- ====================================================================================
-- BLOC 3 : EN COURS (Du 25/04/2026 au 27/04/2026) - En cours d'utilisation
-- Équipements réutilisés après le bloc 2 (Aucun conflit de disponibilité)
-- ====================================================================================
('DEM-2026-011', '2026-04-23 09:00:00', '851477R', '2026-04-25', '2026-04-27', 'Finition travaux hauteur', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 08:30:00', '048009', '2026-04-24 10:00:00', NULL, 'Zone A'),
('DEM-2026-012', '2026-04-23 09:30:00', '851560R', '2026-04-25', '2026-04-27', 'Tubes pour inspection', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 08:45:00', '048009', '2026-04-24 10:15:00', NULL, 'Zone B'),
('DEM-2026-013', '2026-04-23 10:00:00', '851561R', '2026-04-25', '2026-04-27', 'Stabilisation madriers', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 09:00:00', '048009', '2026-04-24 10:30:00', NULL, 'Atelier Central'),
('DEM-2026-014', '2026-04-23 10:30:00', '851645R', '2026-04-25', '2026-04-27', 'Repositionnement socles', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 09:30:00', '048009', '2026-04-24 11:00:00', NULL, 'Zone C'),
('DEM-2026-015', '2026-04-23 11:00:00', '851724R', '2026-04-25', '2026-04-27', 'Derniers colliers', '010874', 'ISI', 'En Cours', '048045', '2026-04-24 10:00:00', '048009', '2026-04-24 11:30:00', NULL, 'Parc ISI'),

-- ====================================================================================
-- BLOC 4 : REJETÉ (Dates variées) - Ne posent pas de problèmes de dispo car rejetés
-- ====================================================================================
('DEM-2026-016', '2026-04-19 14:00:00', '851477R', '2026-04-22', '2026-04-26', 'Demande en doublon', '010874', 'ISI', 'Rejeté', '048045', '2026-04-20 09:00:00', '048009', '2026-04-20 14:00:00', 'Chevauchement de dates avec DEM-2026-006', 'Zone A'),
('DEM-2026-017', '2026-04-18 10:00:00', '851560R', '2026-04-20', '2026-04-25', 'Erreur de saisie de période', '010874', 'ISI', 'Rejeté', '048045', '2026-04-19 09:00:00', '048009', '2026-04-19 14:30:00', 'Demande trop longue, revoir planning', 'Zone B'),
('DEM-2026-018', '2026-04-20 08:00:00', '851561R', '2026-04-21', '2026-04-23', 'Intervention annulée', '010874', 'ISI', 'Rejeté', '048045', '2026-04-20 10:00:00', '048009', '2026-04-20 15:00:00', 'Matériel indisponible pour maintenance curative', 'Zone D'),
('DEM-2026-019', '2026-04-24 15:00:00', '851645R', '2026-04-26', '2026-04-27', 'Manque ODS', '010874', 'ISI', 'Rejeté', '048045', '2026-04-25 08:00:00', '048009', '2026-04-25 10:00:00', 'Veuillez fournir le numéro ODS', 'Zone E'),
('DEM-2026-020', '2026-04-22 10:00:00', '851724R', '2026-04-25', '2026-04-26', 'Marteau piqueur defect', '010874', 'ISI', 'Rejeté', '048045', '2026-04-23 09:00:00', '048009', '2026-04-23 11:00:00', 'Équipement en cours de réparation (Curatif)', 'Zone F'),

-- ====================================================================================
-- BLOC 5 : EN ATTENTE / VALIDÉ / ANNULÉ (Dates variées) - Ne bloquent pas la dispo
-- ====================================================================================
('DEM-2026-021', '2026-04-24 16:00:00', '851477R', '2026-04-26', '2026-04-27', 'Camion Grue Attente', '010874', 'ISI', 'En Attente', NULL, NULL, NULL, NULL, NULL, 'Base Logistique'),
('DEM-2026-022', '2026-04-22 11:00:00', '851560R', '2026-04-25', '2026-04-26', 'Besoin Raccords (En cours validation)', '010874', 'ISI', 'Validé', '048045', '2026-04-23 08:00:00', NULL, NULL, NULL, 'Parc ISI'),
('DEM-2026-023', '2026-04-20 09:00:00', '851561R', '2026-04-22', '2026-04-23', 'Annulation par le demandeur', '010874', 'ISI', 'Annulé', '048045', '2026-04-20 10:00:00', NULL, NULL, NULL, 'Zone C'),
('DEM-2026-024', '2026-04-18 15:00:00', '851645R', '2026-04-20', '2026-04-22', 'Attente validation chef', '010874', 'ISI', 'En Attente', NULL, NULL, NULL, NULL, NULL, 'Atelier Central'),
('DEM-2026-025', '2026-04-18 16:00:00', '851724R', '2026-04-20', '2026-04-21', 'Validé mais en attente prestataire', '010874', 'ISI', 'Validé', '048045', '2026-04-19 08:00:00', NULL, NULL, NULL, 'Base Vie');


-- ==============================================================================
-- 2. INSERTION DES ÉQUIPEMENTS LIÉS AUX DEMANDES (Demande_Engins)
-- ==============================================================================

INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES 
-- Bloc 1 : Clôturé (20/04 au 21/04)
('DEM-2026-001', 'H*1'),  -- TUBES D ECHAFAUDAGE 6 M
('DEM-2026-002', 'H*2'),  -- TUBES D ECHAFAUDAGE DE 4M
('DEM-2026-003', 'H*10'), -- MADRIERS D ECHAFAUDAGE 1M
('DEM-2026-004', 'H*11'), -- PLAQUES D APPUI (SOCLES)
('DEM-2026-005', 'H*12'), -- COLLIERS A ANGLE DROIT
('DEM-2026-005', 'H*13'), -- COLLIERS PIVOTANTS (2 équipements pour cette demande)

-- Bloc 2 : Approuvé (22/04 au 24/04) => Mêmes équipements, mais dates ultérieures
('DEM-2026-006', 'H*1'),
('DEM-2026-007', 'H*2'),
('DEM-2026-008', 'H*10'),
('DEM-2026-009', 'H*11'),
('DEM-2026-010', 'H*12'),
('DEM-2026-010', 'H*13'),

-- Bloc 3 : En Cours (25/04 au 27/04) => Mêmes équipements, mais dates encore ultérieures
('DEM-2026-011', 'H*1'),
('DEM-2026-012', 'H*2'),
('DEM-2026-013', 'H*10'),
('DEM-2026-014', 'H*11'),
('DEM-2026-015', 'H*12'),
('DEM-2026-015', 'H*13'),

-- Bloc 4 : Rejeté (Chevauchements de dates possibles mais inoffensifs car rejetés)
('DEM-2026-016', 'H*1'),
('DEM-2026-017', 'H*2'),
('DEM-2026-018', 'H*14'), -- RACCORDS
('DEM-2026-019', 'H*15'), -- MATERIELS D ECHAFAUDAGE
('DEM-2026-020', 'H*16'), -- MARTEAU PIQUEUR

-- Bloc 5 : En Attente / Validé / Annulé
('DEM-2026-021', 'H*17'), -- Camion 10 T grue
('DEM-2026-022', 'H*14'), -- RACCORDS
('DEM-2026-023', 'H*15'), -- MATERIELS D ECHAFAUDAGE
('DEM-2026-024', 'H*16'), -- MARTEAU PIQUEUR
('DEM-2026-025', 'H*17'); -- Camion 10 T grue




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

('DEM-2026-026', '2026-04-18 08:00:00', '851477R', '2026-04-20', '2026-04-22', 'Location Raccords spécifiques', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-18 09:30:00', '048009', '2026-04-18 11:00:00', 'SARL TRANS-MECA', '2026-04-19 10:00:00', 'Zone A'),
('DEM-2026-027', '2026-04-18 08:30:00', '851560R', '2026-04-23', '2026-04-25', 'Location matériels échafaudage lourds', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-18 10:00:00', '048009', '2026-04-18 13:30:00', 'EURL EQUIP-PRO', '2026-04-19 14:30:00', 'Zone B'),
('DEM-2026-028', '2026-04-19 09:00:00', '851561R', '2026-04-21', '2026-04-23', 'Sous traitance Marteau Piqueur (Panne interne)', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-19 09:45:00', '048009', '2026-04-19 11:30:00', 'SNC BTP EXPRESS', '2026-04-20 09:00:00', 'Atelier Central'),
('DEM-2026-029', '2026-04-20 08:00:00', '851645R', '2026-04-24', '2026-04-27', 'Besoin Camion Grue 10T externe', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-20 10:00:00', '048009', '2026-04-20 14:00:00', 'ENTREPRISE LEVAGE AL', '2026-04-21 11:00:00', 'Zone C'),
('DEM-2026-030', '2026-04-21 09:00:00', '851724R', '2026-04-26', '2026-04-27', 'Renfort Marteau Piqueur', '010874', 'ISI', 'Sous Traitance', '048045', '2026-04-21 10:30:00', '048009', '2026-04-21 15:00:00', 'SNC BTP EXPRESS', '2026-04-22 10:15:00', 'Base Logistique');


-- ==============================================================================
-- 2. INSERTION DES ÉQUIPEMENTS LIÉS (Demande_Engins)
-- ==============================================================================

INSERT INTO Demande_Engins (num_demande, Code_Prestation) VALUES 
('DEM-2026-026', 'H*14'), -- RACCORDS (Dispo car uniquement utilisé en bloc Rejeté/Attente précédemment)
('DEM-2026-027', 'H*15'), -- MATERIELS D ECHAFAUDAGE
('DEM-2026-028', 'H*16'), -- MARTEAU PIQUEUR
('DEM-2026-029', 'H*17'), -- Camion 10 T grue
('DEM-2026-030', 'H*16'); -- MARTEAU PIQUEUR (Réutilisé après la fin de la demande DEM-2026-028)




-- ==============================================================================
-- 1. INSERTION DES RÈGLES DE MAINTENANCE (MaintenanceRules)
-- ==============================================================================

INSERT INTO MaintenanceRules (
    code_prestation, type_maintenance, interval_km, interval_days, 
    alert_before_km, alert_before_days, is_active
) VALUES 
('H*14', 'REVISION_10K', NULL, 180, NULL, 15, 1),
('H*15', 'REPARATION_MECA', NULL, NULL, NULL, NULL, 1),
('H*16', 'REVISION_20K', NULL, 365, NULL, 30, 1),
('H*17', 'VIDANGE', 10000, 365, 1000, 30, 1),
('H*1', 'REVISION_10K', NULL, 180, NULL, 15, 1);

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

-- 1. H*15 (MATERIELS D ECHAFAUDAGE) : Libre du 20 au 22 avril
('H*15', 'REPARATION_MECA', '2026-04-20', '2026-04-21', NULL, 
 'Réparation suite à usure constatée', 'TERMINE', 
 '010873', 'DSL', '048009', '2026-04-18 08:00:00', '2026-04-18 10:00:00', 
 '2026-04-20 08:00:00', '2026-04-21 16:00:00', NULL),

-- 2. H*17 (Camion 10 T grue) : Libre du 20 au 23 avril
('H*17', 'VIDANGE', '2026-04-21', '2026-04-22', 125400, 
 'Vidange préventive avant affection chantier lourd', 'TERMINE', 
 '010873', 'DSL', '048009', '2026-04-19 09:00:00', '2026-04-19 14:00:00', 
 '2026-04-21 08:30:00', '2026-04-22 15:30:00', NULL),

-- 3. H*16 (MARTEAU PIQUEUR) : Libre la fenêtre du 24 au 25 avril
('H*16', 'REVISION_20K', '2026-04-24', '2026-04-25', NULL, 
 'Révision des 365 jours entre deux locations', 'VALIDE', 
 '010873', 'DSL', '048009', '2026-04-20 11:00:00', '2026-04-21 09:00:00', 
 NULL, NULL, NULL),

-- 4. H*14 (RACCORDS) : Libre du 23 au 27 avril
('H*14', 'REVISION_10K', '2026-04-24', '2026-04-26', NULL, 
 'Vérification visserie et filetages', 'EN_COURS', 
 '010873', 'DSL', '048009', '2026-04-22 10:00:00', '2026-04-22 15:00:00', 
 '2026-04-24 08:00:00', NULL, NULL),

-- 5. H*1 (TUBES D ECHAFAUDAGE 6 M) : Indisponible (Occupé sans interruption du 20 au 27 avril)
('H*1', 'REVISION_10K', '2026-04-22', '2026-04-23', NULL, 
 'Vérification de la rectitude des tubes', 'REJETE', 
 '010873', 'DSL', '048009', '2026-04-20 14:00:00', '2026-04-21 08:30:00', 
 NULL, NULL, 'Rejeté : Équipement actuellement déployé sur chantier (ISI) du 20 au 27 Avril.');