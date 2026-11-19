BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Dispensation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [numero] NVARCHAR(30) NOT NULL,
    [date] DATETIME2 NOT NULL CONSTRAINT [Dispensation_date_df] DEFAULT CURRENT_TIMESTAMP,
    [patient] NVARCHAR(150) NOT NULL,
    [numeroPassage] NVARCHAR(50),
    [prescripteur] NVARCHAR(150),
    [montantTotal] DECIMAL(18,2) NOT NULL CONSTRAINT [Dispensation_montantTotal_df] DEFAULT 0,
    [statut] NVARCHAR(20) NOT NULL CONSTRAINT [Dispensation_statut_df] DEFAULT 'VALIDEE',
    [motifAnnulation] NVARCHAR(255),
    [dateAnnulation] DATETIME2,
    [utilisateurId] INT NOT NULL,
    [annuleParId] INT,
    CONSTRAINT [Dispensation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Dispensation_numero_key] UNIQUE NONCLUSTERED ([numero])
);

-- CreateTable
CREATE TABLE [dbo].[DispensationLigne] (
    [id] INT NOT NULL IDENTITY(1,1),
    [dispensationId] INT NOT NULL,
    [produitId] INT NOT NULL,
    [unite] NVARCHAR(10) NOT NULL,
    [quantite] INT NOT NULL,
    [quantitePlaques] INT NOT NULL,
    [prixUnitaire] DECIMAL(18,2) NOT NULL CONSTRAINT [DispensationLigne_prixUnitaire_df] DEFAULT 0,
    [montant] DECIMAL(18,2) NOT NULL CONSTRAINT [DispensationLigne_montant_df] DEFAULT 0,
    CONSTRAINT [DispensationLigne_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Retrait] (
    [id] INT NOT NULL IDENTITY(1,1),
    [numero] NVARCHAR(30) NOT NULL,
    [date] DATETIME2 NOT NULL CONSTRAINT [Retrait_date_df] DEFAULT CURRENT_TIMESTAMP,
    [produitId] INT NOT NULL,
    [lotId] INT NOT NULL,
    [quantite] INT NOT NULL,
    [motif] NVARCHAR(40) NOT NULL,
    [precision] NVARCHAR(255),
    [valeur] DECIMAL(18,2) NOT NULL CONSTRAINT [Retrait_valeur_df] DEFAULT 0,
    [automatique] BIT NOT NULL CONSTRAINT [Retrait_automatique_df] DEFAULT 0,
    [utilisateurId] INT NOT NULL,
    CONSTRAINT [Retrait_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Retrait_numero_key] UNIQUE NONCLUSTERED ([numero])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Dispensation_date_idx] ON [dbo].[Dispensation]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Retrait_date_idx] ON [dbo].[Retrait]([date]);

-- AddForeignKey
ALTER TABLE [dbo].[Dispensation] ADD CONSTRAINT [Dispensation_utilisateurId_fkey] FOREIGN KEY ([utilisateurId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Dispensation] ADD CONSTRAINT [Dispensation_annuleParId_fkey] FOREIGN KEY ([annuleParId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DispensationLigne] ADD CONSTRAINT [DispensationLigne_dispensationId_fkey] FOREIGN KEY ([dispensationId]) REFERENCES [dbo].[Dispensation]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DispensationLigne] ADD CONSTRAINT [DispensationLigne_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Retrait] ADD CONSTRAINT [Retrait_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Retrait] ADD CONSTRAINT [Retrait_lotId_fkey] FOREIGN KEY ([lotId]) REFERENCES [dbo].[Lot]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Retrait] ADD CONSTRAINT [Retrait_utilisateurId_fkey] FOREIGN KEY ([utilisateurId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

