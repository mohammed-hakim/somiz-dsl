USE parc_roulant_test2;
GO

CREATE TABLE [RH] (
    [nom]        NVARCHAR(100),
    [prenom]     NVARCHAR(100),
    [matricule]  NVARCHAR(20) PRIMARY KEY,
    [NUM_CONT]   NVARCHAR(20),
    [structure]  NVARCHAR(50),
    [password] NVARCHAR(255) DEFAULT '123456',
    [STRUC] NVARCHAR(20),
    [role] NVARCHAR(50) DEFAULT 'agent',
    CONSTRAINT CK_RH_Role CHECK ([role] IN ('agent', 'secretaire', 'chef departement'))
);
GO



INSERT INTO [RH] ([nom], [prenom], [matricule], [NUM_CONT], [structure],[role])
VALUES  (N'karim', N'yacine', N'010874', N'021669', N'ISI','agent'),
        (N'mansor', N'omar', N'798072', N'715172', N'ISI','secretaire'),
        (N'salem', N'amina', N'068184', N'220727', N'ISI','chef departement'),
        (N'chehhat', N'dsl', N'010873', N'021663', N'DSL','agent'),
        (N'anes', N'dsl', N'010870', N'021660', N'DSL','chef departement');
GO



CREATE TABLE [structures] (
    [COD_STRUCT_H] NVARCHAR(50) PRIMARY KEY,
    [INITIAL] NVARCHAR(50),
    [INTITULE] NVARCHAR(255),
    [NATURE_STRUCTURE] NVARCHAR(50)
);
GO

CREATE TABLE [affaires] (
    [Code_Affaire] NVARCHAR(7) PRIMARY KEY,
    [NUM_OSC] NVARCHAR(100),
    [DESIGN] NVARCHAR(255),
    [CLIENT] NVARCHAR(255),
    [DATE_DEBUT] DATETIME,
    [DATE_Fin] DATETIME,
    [Annule] NVARCHAR(10),
    [Date_Cloture] DATETIME,
    [Cloture_Automatique] INT,
    [BUDGET] DECIMAL(18, 2),
    [DESIGN2] NVARCHAR(255),
    [COD_STRUCT_H] NVARCHAR(50),
    CONSTRAINT FK_Affaire_Structure FOREIGN KEY (COD_STRUCT_H) 
    REFERENCES structures(COD_STRUCT_H)
);
GO

CREATE VIEW structures_affaires AS
SELECT 
    a.Code_Affaire,
    a.NUM_OSC,
    a.DESIGN,
    a.CLIENT,
    a.DATE_DEBUT,
    a.DATE_Fin,
    a.Annule,
    a.Date_Cloture,
    a.Cloture_Automatique,
    a.BUDGET,
    s.COD_STRUCT_H,
    s.INITIAL,
    s.INTITULE,
    s.NATURE_STRUCTURE
FROM affaires a
INNER JOIN structures s ON a.COD_STRUCT_H = s.COD_STRUCT_H;
GO



INSERT INTO [structures] ([COD_STRUCT_H], [INITIAL], [INTITULE], [NATURE_STRUCTURE])
VALUES 
('850000S', 'GMO', 'SERVICE GESTION MAINS D''OEUVRES', 'SER'),
('850001S', 'ADM', 'ADMINISTRATION GENERALE', 'ADM'),
('850002S', 'LOG', 'LOGISTIQUE ET TRANSPORT', 'LOG'),
('850003S', 'MTN', 'MAINTENANCE INDUSTRIELLE', 'MTN'),
('850004S', 'RHU', 'RESSOURCES HUMAINES', 'RHU');
GO

INSERT INTO [affaires] ([Code_Affaire], [NUM_OSC], [DESIGN], [CLIENT], [DATE_DEBUT], [DATE_Fin], [Annule], [Date_Cloture], [Cloture_Automatique], [BUDGET], [DESIGN2], [COD_STRUCT_H])
VALUES 
('851477R', 'IFC/CPM 150/11', 'Affaire Régie', 'EGZIA', '2012-01-01', '2012-03-31', 'C', '2012-04-11', 0, 234000.00, 'Affaire Régie', '850000S'),
('851560R', NULL, 'Affaire Régie', 'NAFTAL GPL DJELFA', '2012-06-01', '2012-08-31', 'C', '2012-10-14', 0, 8153600.00, 'Affaire Régie', '850000S'),
('851561R', NULL, 'Affaire Régie', 'NAFTAL GPL DJELFA', '2012-06-01', '2012-08-31', 'C', '2012-10-14', 0, 205920.00, 'Affaire Régie', '850000S'),
('851645R', '138/12', 'Affaire Régie', 'DRIZ', '2013-01-01', '2013-06-30', 'C', '2013-07-15', 0, 2416128.00, 'Affaire Régie', '850000S'),
('851724R', '03-13-SZ/PER', 'Affaire Régie', 'NAFTAL GPL DJELFA', '2013-06-01', '2013-11-30', 'C', '2013-12-26', 0, 911760.00, 'Affaire Régie', '850000S');
GO



CREATE TABLE [ListeEquipement] (
    [Code Domaine]    NVARCHAR(10),
    [Code Prestation] NVARCHAR(20) PRIMARY KEY,
    [Prestation]      NVARCHAR(255),
    [Tarif_A_J]       DECIMAL(18, 2),
    [Tarif_A_H]       DECIMAL(18, 2),
    [Tarif_B]         DECIMAL(18, 2),
    [Tarif_C_J]       DECIMAL(18, 2),
    [Tarif_C_H]       DECIMAL(18, 2),
    [Nature]          NVARCHAR(5)
);
GO



INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*1', N'TUBES D ECHAFAUDAGE 6 M', 9.0, 1.13, 11.25, 13.5, 1.69, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*10', N'MADRIERS D ECHAFAUDAGE 1M', 6.0, 0.75, 7.5, 9.0, 1.13, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*11', N'PLAQUES D APPUI (SOCLES)', 4.0, 0.5, 5.0, 6.0, 0.75, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*12', N'COLLIERS A ANGLE DROIT', 2250.0, 2250.0, 13.75, 16.5, 2.06, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*13', N'COLLIERS PIVOTANTS', 11.0, 1.37, 13.75, 16.5, 2.06, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*14', N'RACCORDS', 72000.0, 72000.0, 3.75, 4.5, 0.56, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*15', N'MATERIELS D ECHAFAUDAGE', 18000.0, 2250.0, 22500.0, 27000.0, 3375.0, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*16', N'MARTEAU PIQUEUR', 3150.0, 3150.0, 494.0, 4725.0, 4725.0, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*17', N'Camion 10 T grue', 19845.0, 19845.0, 3101.0, 29768.0, 29768.0, N'J');
GO

INSERT INTO [ListeEquipement] ([Code Domaine], [Code Prestation], [Prestation], [Tarif_A_J], [Tarif_A_H], [Tarif_B], [Tarif_C_J], [Tarif_C_H], [Nature]) 
VALUES (N'T*H', N'H*2', N'TUBES D ECHAFAUDAGE DE 4M', 9.0, 1.13, 11.25, 13.5, 1.69, N'J');
GO



CREATE TABLE [Demandes] (
        [num_demande] NVARCHAR(100) PRIMARY KEY,
        [Date_Demande] DATETIME DEFAULT GETDATE(),
        [Code_Affaire] NVARCHAR(7),
        [Date_Debut_Prestation] DATETIME,
        [Date_Fin_Prestation] DATETIME,
        [description] VARCHAR(MAX),
        [Observation] VARCHAR(MAX),
        [utilisateur] NVARCHAR(20),
        [date_validation_demandeur] DATETIME,
        [validateur_demandeur] NVARCHAR(20),
        [Status] NVARCHAR(50) DEFAULT 'En Attente',
        [date_validation_prestataire] DATETIME,
        [validateur_dsl] NVARCHAR(20),
        [OT_ODS] NVARCHAR(255),
        [Fournisseur] NVARCHAR(255),
        [motif_rejet] NVARCHAR(MAX),
        [ref_ods_client] NVARCHAR(255),
        [lieu_prestation] NVARCHAR(255),
        [demandeur_structure] NVARCHAR(50),
        [date_cpa] DATE NULL,

        CONSTRAINT FK_Demandes_Affaire FOREIGN KEY (Code_Affaire) 
        REFERENCES affaires(Code_Affaire)
);
GO


CREATE TABLE [Demande_Engins] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [num_demande] NVARCHAR(100),
        [Code_Prestation] NVARCHAR(20),
        
        CONSTRAINT FK_DemandeEngins_Demande FOREIGN KEY (num_demande) REFERENCES Demandes(num_demande),
        CONSTRAINT FK_DemandeEngins_Equipement FOREIGN KEY (Code_Prestation) REFERENCES ListeEquipement([Code Prestation])
);
GO


CREATE VIEW vue_demandes AS
SELECT 
    d.num_demande,
    d.Date_Demande,
    d.Code_Affaire,
    d.Date_Debut_Prestation,
    d.Date_Fin_Prestation,
    d.[description],
    d.Observation,
    d.utilisateur,
    d.date_validation_demandeur,
    d.validateur_demandeur,
    d.Status,
    d.date_validation_prestataire,
    d.validateur_dsl,
    d.OT_ODS,
    d.Fournisseur,
    d.motif_rejet,
    d.ref_ods_client,
    d.lieu_prestation,
    d.demandeur_structure,
    a.CLIENT,
    s.COD_STRUCT_H AS Code_Structure,
    s.INITIAL AS Structure_Initial,
    s.INTITULE AS Structure_Intitule
FROM Demandes d
LEFT JOIN affaires a ON d.Code_Affaire = a.Code_Affaire
LEFT JOIN structures s ON a.COD_STRUCT_H = s.COD_STRUCT_H;
GO


CREATE TABLE [Journal] (
        [NUM_ORDRE]        INT IDENTITY(1,1) PRIMARY KEY,
        [UTILISATEUR]      NVARCHAR(50),
        [TYPE_OPERATION]   NVARCHAR(255),
        [DATE]             DATETIME DEFAULT GETDATE(),
        [COMPTE_WIN]       NVARCHAR(255),
        [NOM_MACHINE]      NVARCHAR(255),
        [ADRESSE_IP]       NVARCHAR(50),
        [NOM_TABLE]        NVARCHAR(255),
        [CODE_PIECE]       NVARCHAR(255),
        [ANCIENNE_VALEUR]  NVARCHAR(MAX),
        [OBSERVATION]      NVARCHAR(MAX),
        [DATE_EXECUTABLE]  DATETIME,
        [EXERCICE]         NVARCHAR(10)
);
GO

-- ============================================
-- MAINTENANCE TABLES (from migration_maintenance_v2.sql)
-- ============================================

-- Table: MaintenanceTypes
CREATE TABLE MaintenanceTypes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(20) UNIQUE NOT NULL,
    libelle NVARCHAR(100) NOT NULL,
    categorie NVARCHAR(20) NOT NULL CHECK (categorie IN ('Preventif', 'Curatif')),
    description NVARCHAR(255)
);
GO

INSERT INTO MaintenanceTypes (code, libelle, categorie, description) VALUES
('VIDANGE', 'Vidange', 'Preventif', 'Vidange et changement des filtres'),
('REVISION_10K', 'Revision 10,000 km', 'Preventif', 'Revision periodique a 10,000 km'),
('REVISION_20K', 'Revision 20,000 km', 'Preventif', 'Revision complete a 20,000 km'),
('REVISION_30K', 'Revision 30,000 km', 'Preventif', 'Revision complete a 30,000 km'),
('PNEUS', 'Changement Pneus', 'Preventif', 'Remplacement des pneus uses'),
('FREINS', 'Maintenance Freins', 'Preventif', 'Verification et remplacement des freins'),
('REPARATION_MECA', 'Reparation Mecanique', 'Curatif', 'Reparation suite a panne mecanique'),
('REPARATION_ELEC', 'Reparation Electrique', 'Curatif', 'Reparation probleme electrique'),
('CARROSSERIE', 'Reparation Carrosserie', 'Curatif', 'Reparation carrosserie suite a accident'),
('DEPANNAGE', 'Depannage', 'Curatif', 'Intervention urgente sur site');
GO

-- Table: MaintenanceRules
CREATE TABLE MaintenanceRules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code_prestation NVARCHAR(20) NOT NULL,
    type_maintenance NVARCHAR(20) NOT NULL,
    interval_km INT NULL,
    interval_days INT NULL,
    alert_before_km INT NULL,
    alert_before_days INT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Rules_Equipement FOREIGN KEY (code_prestation) REFERENCES ListeEquipement([Code Prestation]),
    CONSTRAINT FK_Rules_Type FOREIGN KEY (type_maintenance) REFERENCES MaintenanceTypes(code),
    CONSTRAINT UQ_Rules_Equipement_Type UNIQUE (code_prestation, type_maintenance)
);
GO

-- Table: MaintenanceRequests
CREATE TABLE MaintenanceRequests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code_prestation NVARCHAR(20) NOT NULL,
    type_maintenance NVARCHAR(20) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    kilometrage_actuel INT NULL,
    description NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE', 'VALIDE', 'REJETE', 'EN_COURS', 'TERMINE')),
    demandeur_matricule NVARCHAR(20) NOT NULL,
    demandeur_structure NVARCHAR(50) NOT NULL,
    validateur_matricule NVARCHAR(20) NULL,
    date_demande DATETIME DEFAULT GETDATE(),
    date_validation DATETIME NULL,
    date_debut_reelle DATETIME NULL,
    date_fin_reelle DATETIME NULL,
    motif_rejet NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Maintenance_Type FOREIGN KEY (type_maintenance) REFERENCES MaintenanceTypes(code),
    CONSTRAINT FK_Maintenance_Equipement FOREIGN KEY (code_prestation) REFERENCES ListeEquipement([Code Prestation])
);
GO

-- Table: EquipmentMobilization
CREATE TABLE EquipmentMobilization (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code_prestation NVARCHAR(20) NOT NULL,
    num_demande NVARCHAR(100) NOT NULL,
    type_operation NVARCHAR(20) NOT NULL CHECK (type_operation IN ('MOBILISATION', 'DEMOBILISATION')),
    date_operation DATETIME DEFAULT GETDATE(),
    matricule_operateur NVARCHAR(20) NOT NULL,
    structure_operateur NVARCHAR(50) NOT NULL,
    observation NVARCHAR(MAX),
    CONSTRAINT FK_Mobilization_Demande FOREIGN KEY (num_demande) REFERENCES Demandes(num_demande),
    CONSTRAINT FK_Mobilization_Equipement FOREIGN KEY (code_prestation) REFERENCES ListeEquipement([Code Prestation])
);
GO

-- Table: EquipmentKilometrage
CREATE TABLE EquipmentKilometrage (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code_prestation NVARCHAR(20) NOT NULL,
    date_enregistrement DATETIME DEFAULT GETDATE(),
    kilometrage INT NOT NULL CHECK (kilometrage >= 0),
    source NVARCHAR(50) NOT NULL CHECK (source IN ('MOBILISATION', 'DEMOBILISATION', 'MAINTENANCE', 'MANUEL', 'RULE_CHECK')),
    reference_id INT NULL,
    matricule_operateur NVARCHAR(20) NOT NULL,
    observation NVARCHAR(255),
    CONSTRAINT FK_Kilometrage_Equipement FOREIGN KEY (code_prestation) REFERENCES ListeEquipement([Code Prestation])
);
GO

-- Table: EquipmentMaintenanceLog
CREATE TABLE EquipmentMaintenanceLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code_prestation NVARCHAR(20) NOT NULL,
    type_maintenance NVARCHAR(20) NOT NULL,
    last_done_date DATE NOT NULL,
    last_done_km INT NOT NULL,
    maintenance_request_id INT NULL,
    CONSTRAINT FK_Log_Equipement FOREIGN KEY (code_prestation) REFERENCES ListeEquipement([Code Prestation]),
    CONSTRAINT FK_Log_Type FOREIGN KEY (type_maintenance) REFERENCES MaintenanceTypes(code),
    CONSTRAINT FK_Log_Request FOREIGN KEY (maintenance_request_id) REFERENCES MaintenanceRequests(id) ON DELETE SET NULL,
    CONSTRAINT UQ_Log_Equipement_Type UNIQUE (code_prestation, type_maintenance)
);
GO

-- Table: MaintenanceEquipment (from migration_maintenance_v3.sql)
CREATE TABLE MaintenanceEquipment (
    id INT IDENTITY(1,1) PRIMARY KEY,
    maintenance_request_id INT NOT NULL,
    code_prestation NVARCHAR(20) NOT NULL,
    kilometrage_actuel INT NULL,
    CONSTRAINT FK_MaintenanceEquip_Request FOREIGN KEY (maintenance_request_id) 
        REFERENCES MaintenanceRequests(id) ON DELETE CASCADE,
    CONSTRAINT FK_MaintenanceEquip_Equipement FOREIGN KEY (code_prestation) 
        REFERENCES ListeEquipement([Code Prestation])
);
GO

-- Indexes for performance
SET QUOTED_IDENTIFIER ON;
GO

CREATE INDEX IX_MaintenanceRequests_Status ON MaintenanceRequests(status);
CREATE INDEX IX_MaintenanceRequests_Dates ON MaintenanceRequests(date_debut, date_fin);
CREATE INDEX IX_MaintenanceRequests_Equipement ON MaintenanceRequests(code_prestation);
CREATE INDEX IX_MaintenanceRules_Active ON MaintenanceRules(is_active) WHERE is_active = 1;
CREATE INDEX IX_Kilometrage_Equipement ON EquipmentKilometrage(code_prestation, date_enregistrement DESC);
CREATE INDEX IX_Kilometrage_Source ON EquipmentKilometrage(source, reference_id);
CREATE INDEX IX_MaintenanceEquipment_Request ON MaintenanceEquipment(maintenance_request_id);
CREATE INDEX IX_MaintenanceEquipment_Equipement ON MaintenanceEquipment(code_prestation);
GO

PRINT 'Database schema created successfully!';
GO
