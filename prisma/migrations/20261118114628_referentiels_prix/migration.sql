BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Produit] ADD [familleId] INT,
[uniteVenteId] INT;

-- AlterTable
ALTER TABLE [dbo].[Utilisateur] ADD [fonctionId] INT;

-- CreateTable
CREATE TABLE [dbo].[Famille] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(30) NOT NULL,
    [libelle] NVARCHAR(100) NOT NULL,
    [categorie] NVARCHAR(100),
    CONSTRAINT [Famille_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Famille_code_key] UNIQUE NONCLUSTERED ([code]),
    CONSTRAINT [Famille_libelle_key] UNIQUE NONCLUSTERED ([libelle])
);

-- CreateTable
CREATE TABLE [dbo].[UniteVente] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(30) NOT NULL,
    [libelle] NVARCHAR(60) NOT NULL,
    CONSTRAINT [UniteVente_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UniteVente_code_key] UNIQUE NONCLUSTERED ([code]),
    CONSTRAINT [UniteVente_libelle_key] UNIQUE NONCLUSTERED ([libelle])
);

-- CreateTable
CREATE TABLE [dbo].[Fonction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(30) NOT NULL,
    [libelle] NVARCHAR(100) NOT NULL,
    CONSTRAINT [Fonction_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Fonction_code_key] UNIQUE NONCLUSTERED ([code]),
    CONSTRAINT [Fonction_libelle_key] UNIQUE NONCLUSTERED ([libelle])
);

-- CreateTable
CREATE TABLE [dbo].[PrixVente] (
    [id] INT NOT NULL IDENTITY(1,1),
    [produitId] INT NOT NULL,
    [prixBoite] DECIMAL(18,2) NOT NULL,
    [prixPlaque] DECIMAL(18,2) NOT NULL,
    [dateEffet] DATE NOT NULL,
    [dateFin] DATE,
    [motifCorrection] NVARCHAR(255),
    [utilisateurId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PrixVente_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PrixVente_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PrixVente_produitId_dateEffet_idx] ON [dbo].[PrixVente]([produitId], [dateEffet]);

-- AddForeignKey
ALTER TABLE [dbo].[Utilisateur] ADD CONSTRAINT [Utilisateur_fonctionId_fkey] FOREIGN KEY ([fonctionId]) REFERENCES [dbo].[Fonction]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Produit] ADD CONSTRAINT [Produit_familleId_fkey] FOREIGN KEY ([familleId]) REFERENCES [dbo].[Famille]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Produit] ADD CONSTRAINT [Produit_uniteVenteId_fkey] FOREIGN KEY ([uniteVenteId]) REFERENCES [dbo].[UniteVente]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PrixVente] ADD CONSTRAINT [PrixVente_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PrixVente] ADD CONSTRAINT [PrixVente_utilisateurId_fkey] FOREIGN KEY ([utilisateurId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Données initiales : unités de vente et fonctions du personnel
INSERT INTO [dbo].[UniteVente] ([code], [libelle]) VALUES
  (N'BOITE', N'BOÎTE'), (N'PLAQUE', N'PLAQUE'), (N'FLACON', N'FLACON'), (N'TUBE', N'TUBE'),
  (N'AMPOULE', N'AMPOULE'), (N'SACHET', N'SACHET'), (N'UNITE', N'UNITÉ');
INSERT INTO [dbo].[Fonction] ([code], [libelle]) VALUES
  (N'PHARMACIEN', N'PHARMACIEN'), (N'GESTIONNAIRE', N'GESTIONNAIRE DE STOCK'),
  (N'AGENT-PHARMACIE', N'AGENT DE PHARMACIE'), (N'CAISSIER', N'CAISSIER');

-- Historique : le prix en cours de chaque produit existant devient sa première ligne
INSERT INTO [dbo].[PrixVente] ([produitId], [prixBoite], [prixPlaque], [dateEffet], [utilisateurId])
SELECT p.[id], p.[prixVenteBoite], p.[prixVentePlaque], CAST(p.[createdAt] AS DATE),
       (SELECT TOP 1 [id] FROM [dbo].[Utilisateur] WHERE [matricule] = N'SYSTEME')
FROM [dbo].[Produit] p
WHERE EXISTS (SELECT 1 FROM [dbo].[Utilisateur] WHERE [matricule] = N'SYSTEME');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
