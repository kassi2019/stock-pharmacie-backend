BEGIN TRY

BEGIN TRAN;

-- Profils (rôles) et droits par module, gérés par l'administrateur
CREATE TABLE [dbo].[Profil] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(20) NOT NULL,
    [libelle] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(255),
    [permissions] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Profil_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Profil_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Profil_code_key] UNIQUE NONCLUSTERED ([code])
);

-- Les six rôles du cahier des charges (§ 5), avec les droits qu'ils avaient jusqu'ici
INSERT INTO [dbo].[Profil] ([code], [libelle], [description], [permissions]) VALUES
(N'ADMIN', N'Administrateur', N'Tous les droits, dont le paramétrage, les utilisateurs et les réglages du module.', NULL),
(N'RESPONSABLE', N'Responsable de pharmacie', N'Catalogue, fournisseurs, entrées, retraits, inventaires (validation), rapports et points financiers.',
 N'{"parametres":["VOIR","IMPRIMER","MODIFIER"],"produits":["VOIR","IMPRIMER","MODIFIER"],"receptions":["VOIR","IMPRIMER","MODIFIER"],"dispensation":["VOIR","IMPRIMER","MODIFIER","VALIDER"],"retraits":["VOIR","IMPRIMER","MODIFIER"],"peremptions":["VOIR","IMPRIMER","MODIFIER"],"inventaires":["VOIR","IMPRIMER","MODIFIER","VALIDER"],"alertes":["VOIR","IMPRIMER","MODIFIER"],"mouvements":["VOIR","IMPRIMER"],"rapports":["VOIR","IMPRIMER"],"prixVente":["VOIR"],"prixAchat":["VOIR"]}'),
(N'AGENT', N'Agent de pharmacie', N'Consultation du stock et des alertes, dispensation, comptage d''inventaire (sans validation).',
 N'{"produits":["VOIR","IMPRIMER"],"dispensation":["VOIR","IMPRIMER","MODIFIER"],"retraits":["VOIR","IMPRIMER"],"peremptions":["VOIR","IMPRIMER"],"inventaires":["VOIR","IMPRIMER","MODIFIER"],"alertes":["VOIR","IMPRIMER"],"mouvements":["VOIR","IMPRIMER"],"prixVente":["VOIR"],"prixAchat":["VOIR"]}'),
(N'CAISSIER', N'Caissier', N'Lecture du stock et des prix de vente ; aucun mouvement de stock.',
 N'{"produits":["VOIR","IMPRIMER"],"dispensation":["VOIR","IMPRIMER"],"peremptions":["VOIR","IMPRIMER"],"alertes":["VOIR","IMPRIMER"],"prixVente":["VOIR"]}'),
(N'MEDECIN', N'Médecin / sage-femme', N'Lecture du catalogue pour la prescription (sans prix ni quantités).',
 N'{"produits":["VOIR","IMPRIMER"]}'),
(N'DIRECTION', N'Direction', N'Lecture des états de stock, des rapports et des points financiers.',
 N'{"produits":["VOIR","IMPRIMER"],"receptions":["VOIR","IMPRIMER"],"dispensation":["VOIR","IMPRIMER"],"retraits":["VOIR","IMPRIMER"],"peremptions":["VOIR","IMPRIMER"],"inventaires":["VOIR","IMPRIMER"],"alertes":["VOIR","IMPRIMER"],"mouvements":["VOIR","IMPRIMER"],"rapports":["VOIR","IMPRIMER"],"prixVente":["VOIR"],"prixAchat":["VOIR"]}');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;

THROW

END CATCH
