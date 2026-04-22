-- SQLite Database Schema for parc_roulant_test

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================
-- RH TABLE
-- ============================================
CREATE TABLE RH (
    nom TEXT,
    prenom TEXT,
    matricule TEXT PRIMARY KEY,
    NUM_CONT TEXT,
    structure TEXT,
    password TEXT DEFAULT '123456',
    STRUC TEXT,
    role TEXT DEFAULT 'agent',
    CONSTRAINT CK_RH_Role CHECK (role IN ('agent', 'secretaire', 'chef departement', 'chef service'))
);

INSERT INTO RH (nom, prenom, matricule, NUM_CONT, structure, role)
VALUES  
    ('karim', 'isi', '010874', '021669', 'ISI', 'agent'),
    ('mansor', 'isi', '798072', '715172', 'ISI', 'secretaire'),
    ('zakaria2', 'isi', '048045', '031615', 'ISI', 'chef service'),
    ('ali', 'isi', '068184', '220727', 'ISI', 'chef departement'),
    ('chehhat', 'dsl', '010873', '021663', 'DSL', 'agent'),
    ('jamal', 'dsl', '030870', '031860', 'DSL', 'secretaire'),
    ('ahmed', 'dsl', '048009', '031692', 'DSL', 'chef service'),
    ('anes', 'dsl', '010870', '021660', 'DSL', 'chef departement'),
    ('tayeb', 'cpa', '010871', '021661', 'CPA', 'agent'),
    ('amine', 'cpa', '039009', '031693', 'CPA', 'secretaire'),
    ('reda', 'cpa', '039010', '031694', 'CPA', 'chef service'),
    ('fateh', 'cpa', '010872', '021662', 'CPA', 'chef departement'),
    ('malek', 'MVE', '010883', '021683', 'MVE', 'agent'),
    ('ryad', 'MVE', '457890', '451536', 'MVE', 'secretaire'),
    ('baraa', 'MVE', '457891', '451537', 'MVE', 'chef service'),
    ('malek', 'MVE', '010894', '021664', 'MVE', 'chef departement');

-- ============================================
-- STRUCTURES TABLE
-- ============================================
CREATE TABLE structures (
    COD_STRUCT_H TEXT PRIMARY KEY,
    INITIAL TEXT,
    INTITULE TEXT,
    NATURE_STRUCTURE TEXT
);

INSERT INTO structures (COD_STRUCT_H, INITIAL, INTITULE, NATURE_STRUCTURE)
VALUES 
    ('850000S', 'GMO', 'SERVICE GESTION MAINS D''OEUVRES', 'SER'),
    ('850001S', 'ADM', 'ADMINISTRATION GENERALE', 'ADM'),
    ('850002S', 'LOG', 'LOGISTIQUE ET TRANSPORT', 'LOG'),
    ('850003S', 'MTN', 'MAINTENANCE INDUSTRIELLE', 'MTN'),
    ('850004S', 'RHU', 'RESSOURCES HUMAINES', 'RHU');

-- ============================================
-- AFFAIRES TABLE
-- ============================================
CREATE TABLE affaires (
    Code_Affaire TEXT PRIMARY KEY,
    NUM_OSC TEXT,
    DESIGN TEXT,
    CLIENT TEXT,
    DATE_DEBUT TEXT,
    DATE_Fin TEXT,
    Annule TEXT,
    Date_Cloture TEXT,
    Cloture_Automatique INTEGER,
    BUDGET REAL,
    DESIGN2 TEXT,
    COD_STRUCT_H TEXT,
    CONSTRAINT FK_Affaire_Structure FOREIGN KEY (COD_STRUCT_H) 
        REFERENCES structures(COD_STRUCT_H)
);

INSERT INTO affaires (Code_Affaire, NUM_OSC, DESIGN, CLIENT, DATE_DEBUT, DATE_Fin, Annule, Date_Cloture, Cloture_Automatique, BUDGET, DESIGN2, COD_STRUCT_H)
VALUES 
    ('851477R', 'IFC/CPM 150/11', 'Affaire Régie', 'EGZIA', '2012-01-01', '2012-03-31', 'C', '2012-04-11', 0, 234000.00, 'Affaire Régie', '850000S'),
    ('851560R', NULL, 'Affaire Régie', 'NAFTAL GPL DJELFA', '2012-06-01', '2012-08-31', 'C', '2012-10-14', 0, 8153600.00, 'Affaire Régie', '850000S'),
    ('851561R', NULL, 'Affaire Régie', 'NAFTAL GPL DJELFA', '2012-06-01', '2012-08-31', 'C', '2012-10-14', 0, 205920.00, 'Affaire Régie', '850000S'),
    ('851645R', '138/12', 'Affaire Régie', 'DRIZ', '2013-01-01', '2013-06-30', 'C', '2013-07-15', 0, 2416128.00, 'Affaire Régie', '850000S'),
    ('851724R', '03-13-SZ/PER', 'Affaire Régie', 'NAFTAL GPL DJELFA', '2013-06-01', '2013-11-30', 'C', '2013-12-26', 0, 911760.00, 'Affaire Régie', '850000S');

-- ============================================
-- VIEW: structures_affaires
-- ============================================
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

-- ============================================
-- LISTE EQUIPEMENT TABLE
-- ============================================
CREATE TABLE ListeEquipement (
    "Code Domaine" TEXT,
    "Code Prestation" TEXT PRIMARY KEY,
    Prestation TEXT,
    Tarif_A_J REAL,
    Tarif_A_H REAL,
    Tarif_B REAL,
    Tarif_C_J REAL,
    Tarif_C_H REAL,
    Nature TEXT
);

INSERT INTO ListeEquipement ("Code Domaine", "Code Prestation", Prestation, Tarif_A_J, Tarif_A_H, Tarif_B, Tarif_C_J, Tarif_C_H, Nature) 
VALUES 
    ('T*H', 'H*1', 'TUBES D ECHAFAUDAGE 6 M', 9.0, 1.13, 11.25, 13.5, 1.69, 'J'),
    ('T*H', 'H*10', 'MADRIERS D ECHAFAUDAGE 1M', 6.0, 0.75, 7.5, 9.0, 1.13, 'J'),
    ('T*H', 'H*11', 'PLAQUES D APPUI (SOCLES)', 4.0, 0.5, 5.0, 6.0, 0.75, 'J'),
    ('T*H', 'H*12', 'COLLIERS A ANGLE DROIT', 2250.0, 2250.0, 13.75, 16.5, 2.06, 'J'),
    ('T*H', 'H*13', 'COLLIERS PIVOTANTS', 11.0, 1.37, 13.75, 16.5, 2.06, 'J'),
    ('T*H', 'H*14', 'RACCORDS', 72000.0, 72000.0, 3.75, 4.5, 0.56, 'J'),
    ('T*H', 'H*15', 'MATERIELS D ECHAFAUDAGE', 18000.0, 2250.0, 22500.0, 27000.0, 3375.0, 'J'),
    ('T*H', 'H*16', 'MARTEAU PIQUEUR', 3150.0, 3150.0, 494.0, 4725.0, 4725.0, 'J'),
    ('T*H', 'H*17', 'Camion 10 T grue', 19845.0, 19845.0, 3101.0, 29768.0, 29768.0, 'J'),
    ('T*H', 'H*2', 'TUBES D ECHAFAUDAGE DE 4M', 9.0, 1.13, 11.25, 13.5, 1.69, 'J');

-- ============================================
-- DEMANDES TABLE
-- ============================================
CREATE TABLE Demandes (
    num_demande TEXT PRIMARY KEY,
    Date_Demande TEXT DEFAULT (datetime('now')),
    Code_Affaire TEXT,
    Date_Debut_Prestation TEXT,
    Date_Fin_Prestation TEXT,
    description TEXT,
    Observation TEXT,
    utilisateur TEXT,
    date_validation_demandeur TEXT,
    validateur_demandeur TEXT,
    Status TEXT DEFAULT 'En Attente',
    date_validation_prestataire TEXT,
    validateur_dsl TEXT,
    OT_ODS TEXT,
    Fournisseur TEXT,
    motif_rejet TEXT,
    ref_ods_client TEXT,
    lieu_prestation TEXT,
    demandeur_structure TEXT,
    date_cpa TEXT,
    CONSTRAINT FK_Demandes_Affaire FOREIGN KEY (Code_Affaire) 
        REFERENCES affaires(Code_Affaire)
);

-- ============================================
-- DEMANDE_ENGINS TABLE
-- ============================================
CREATE TABLE Demande_Engins (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    num_demande TEXT,
    Code_Prestation TEXT,
    CONSTRAINT FK_DemandeEngins_Demande FOREIGN KEY (num_demande) 
        REFERENCES Demandes(num_demande),
    CONSTRAINT FK_DemandeEngins_Equipement FOREIGN KEY (Code_Prestation) 
        REFERENCES ListeEquipement("Code Prestation")
);

-- ============================================
-- VIEW: vue_demandes
-- ============================================
CREATE VIEW vue_demandes AS
SELECT 
    d.num_demande,
    d.Date_Demande,
    d.Code_Affaire,
    d.Date_Debut_Prestation,
    d.Date_Fin_Prestation,
    d.description,
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

-- ============================================
-- JOURNAL TABLE
-- ============================================
CREATE TABLE Journal (
    NUM_ORDRE INTEGER PRIMARY KEY AUTOINCREMENT,
    UTILISATEUR TEXT,
    TYPE_OPERATION TEXT,
    DATE TEXT DEFAULT (datetime('now')),
    COMPTE_WIN TEXT,
    NOM_MACHINE TEXT,
    ADRESSE_IP TEXT,
    NOM_TABLE TEXT,
    CODE_PIECE TEXT,
    ANCIENNE_VALEUR TEXT,
    OBSERVATION TEXT,
    DATE_EXECUTABLE TEXT,
    EXERCICE TEXT
);

-- ============================================
-- MAINTENANCE TABLES
-- ============================================

-- Table: MaintenanceTypes
CREATE TABLE MaintenanceTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    libelle TEXT NOT NULL,
    categorie TEXT NOT NULL CHECK (categorie IN ('Preventif', 'Curatif')),
    description TEXT
);

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

-- Table: MaintenanceRules
CREATE TABLE MaintenanceRules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_prestation TEXT NOT NULL,
    type_maintenance TEXT NOT NULL,
    interval_km INTEGER,
    interval_days INTEGER,
    alert_before_km INTEGER,
    alert_before_days INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    CONSTRAINT FK_Rules_Equipement FOREIGN KEY (code_prestation) 
        REFERENCES ListeEquipement("Code Prestation"),
    CONSTRAINT FK_Rules_Type FOREIGN KEY (type_maintenance) 
        REFERENCES MaintenanceTypes(code),
    CONSTRAINT UQ_Rules_Equipement_Type UNIQUE (code_prestation, type_maintenance)
);

-- Table: MaintenanceRequests
CREATE TABLE MaintenanceRequests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_prestation TEXT NOT NULL,
    type_maintenance TEXT NOT NULL,
    date_debut TEXT NOT NULL,
    date_fin TEXT NOT NULL,
    kilometrage_actuel INTEGER,
    description TEXT,
    status TEXT DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE', 'VALIDE', 'REJETE', 'EN_COURS', 'TERMINE')),
    demandeur_matricule TEXT NOT NULL,
    demandeur_structure TEXT NOT NULL,
    validateur_matricule TEXT,
    date_demande TEXT DEFAULT (datetime('now')),
    date_validation TEXT,
    date_debut_reelle TEXT,
    date_fin_reelle TEXT,
    motif_rejet TEXT,
    CONSTRAINT FK_Maintenance_Type FOREIGN KEY (type_maintenance) 
        REFERENCES MaintenanceTypes(code),
    CONSTRAINT FK_Maintenance_Equipement FOREIGN KEY (code_prestation) 
        REFERENCES ListeEquipement("Code Prestation")
);

-- Table: EquipmentMobilization
CREATE TABLE EquipmentMobilization (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_prestation TEXT NOT NULL,
    num_demande TEXT NOT NULL,
    type_operation TEXT NOT NULL CHECK (type_operation IN ('MOBILISATION', 'DEMOBILISATION')),
    date_operation TEXT DEFAULT (datetime('now')),
    matricule_operateur TEXT NOT NULL,
    structure_operateur TEXT NOT NULL,
    observation TEXT,
    CONSTRAINT FK_Mobilization_Demande FOREIGN KEY (num_demande) 
        REFERENCES Demandes(num_demande),
    CONSTRAINT FK_Mobilization_Equipement FOREIGN KEY (code_prestation) 
        REFERENCES ListeEquipement("Code Prestation")
);

-- Table: EquipmentKilometrage
CREATE TABLE EquipmentKilometrage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_prestation TEXT NOT NULL,
    date_enregistrement TEXT DEFAULT (datetime('now')),
    kilometrage INTEGER NOT NULL CHECK (kilometrage >= 0),
    source TEXT NOT NULL CHECK (source IN ('MOBILISATION', 'DEMOBILISATION', 'MAINTENANCE', 'MANUEL', 'RULE_CHECK')),
    reference_id INTEGER,
    matricule_operateur TEXT NOT NULL,
    observation TEXT,
    CONSTRAINT FK_Kilometrage_Equipement FOREIGN KEY (code_prestation) 
        REFERENCES ListeEquipement("Code Prestation")
);

-- Table: EquipmentMaintenanceLog
CREATE TABLE EquipmentMaintenanceLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_prestation TEXT NOT NULL,
    type_maintenance TEXT NOT NULL,
    last_done_date TEXT NOT NULL,
    last_done_km INTEGER NOT NULL,
    maintenance_request_id INTEGER,
    CONSTRAINT FK_Log_Equipement FOREIGN KEY (code_prestation) 
        REFERENCES ListeEquipement("Code Prestation"),
    CONSTRAINT FK_Log_Type FOREIGN KEY (type_maintenance) 
        REFERENCES MaintenanceTypes(code),
    CONSTRAINT FK_Log_Request FOREIGN KEY (maintenance_request_id) 
        REFERENCES MaintenanceRequests(id) ON DELETE SET NULL,
    CONSTRAINT UQ_Log_Equipement_Type UNIQUE (code_prestation, type_maintenance)
);

-- Table: MaintenanceEquipment
CREATE TABLE MaintenanceEquipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maintenance_request_id INTEGER NOT NULL,
    code_prestation TEXT NOT NULL,
    kilometrage_actuel INTEGER,
    CONSTRAINT FK_MaintenanceEquip_Request FOREIGN KEY (maintenance_request_id) 
        REFERENCES MaintenanceRequests(id) ON DELETE CASCADE,
    CONSTRAINT FK_MaintenanceEquip_Equipement FOREIGN KEY (code_prestation) 
        REFERENCES ListeEquipement("Code Prestation")
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IX_MaintenanceRequests_Status ON MaintenanceRequests(status);
CREATE INDEX IX_MaintenanceRequests_Dates ON MaintenanceRequests(date_debut, date_fin);
CREATE INDEX IX_MaintenanceRequests_Equipement ON MaintenanceRequests(code_prestation);
CREATE INDEX IX_MaintenanceRules_Active ON MaintenanceRules(is_active);
CREATE INDEX IX_Kilometrage_Equipement ON EquipmentKilometrage(code_prestation, date_enregistrement DESC);
CREATE INDEX IX_Kilometrage_Source ON EquipmentKilometrage(source, reference_id);
CREATE INDEX IX_MaintenanceEquipment_Request ON MaintenanceEquipment(maintenance_request_id);
CREATE INDEX IX_MaintenanceEquipment_Equipement ON MaintenanceEquipment(code_prestation);