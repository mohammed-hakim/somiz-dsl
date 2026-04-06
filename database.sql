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
    [Code_Affaire] NVARCHAR(50) PRIMARY KEY,
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




















IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Demandes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Demandes] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [N_DSL] NVARCHAR(100) UNIQUE,
        [Date_Demande] DATETIME DEFAULT GETDATE(),
        
        [Code_Structure] NVARCHAR(50),
        [Code_Affaire] NVARCHAR(50),
        
        [Client] NVARCHAR(255),
        [Ref_ODS_Client] NVARCHAR(255),
        
        [Lieu_Prestation] NVARCHAR(255),
        [Date_Debut_Prestation] DATETIME,
        [Date_Fin_Prestation] DATETIME,
        
        [Nature_Prestation] NVARCHAR(MAX),
        [Observation] NVARCHAR(MAX),
        
        [utilisateur] NVARCHAR(20),
        [date_validation_demandeur] DATETIME,
        
        [Status] NVARCHAR(50) DEFAULT 'En Attente', -- En Attente, Validé, Clôturé, Refusé
        
        [Enregistre_A_DSL] BIT DEFAULT 0,
        [date_validation_prestataire] DATETIME,
        [OT_ODS] NVARCHAR(255),
        [Fournisseur] NVARCHAR(255)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Demande_Engins]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Demande_Engins] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Id_Demande] INT,
        [Code_Prestation] NVARCHAR(20),
        
        CONSTRAINT FK_DemandeEngins_Demande FOREIGN KEY (Id_Demande) REFERENCES Demandes(Id),
        CONSTRAINT FK_DemandeEngins_Equipement FOREIGN KEY (Code_Prestation) REFERENCES ListeEquipement([Code Prestation])
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Journaux]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Journaux] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Id_Demande] INT,
        [Utilisateur_Matricule] NVARCHAR(20),
        [Action] NVARCHAR(255),
        [Nom_PC] NVARCHAR(255),
        [Adresse_IP] NVARCHAR(255),
        [Session_Windows] NVARCHAR(255),
        [Date_Action] DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT FK_Journaux_Demande FOREIGN KEY (Id_Demande) REFERENCES Demandes(Id)
    );
END
GO

