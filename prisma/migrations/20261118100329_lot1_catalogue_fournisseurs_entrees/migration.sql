BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Utilisateur] (
    [id] INT NOT NULL IDENTITY(1,1),
    [matricule] NVARCHAR(30) NOT NULL,
    [nom] NVARCHAR(100) NOT NULL,
    [prenoms] NVARCHAR(150),
    [motDePasse] NVARCHAR(100) NOT NULL,
    [role] NVARCHAR(20) NOT NULL,
    [actif] BIT NOT NULL CONSTRAINT [Utilisateur_actif_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Utilisateur_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Utilisateur_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Utilisateur_matricule_key] UNIQUE NONCLUSTERED ([matricule])
);

-- CreateTable
CREATE TABLE [dbo].[JournalAction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL CONSTRAINT [JournalAction_date_df] DEFAULT CURRENT_TIMESTAMP,
    [utilisateurId] INT,
    [action] NVARCHAR(30) NOT NULL,
    [entite] NVARCHAR(50) NOT NULL,
    [entiteId] INT,
    [details] NVARCHAR(max),
    CONSTRAINT [JournalAction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Forme] (
    [id] INT NOT NULL IDENTITY(1,1),
    [libelle] NVARCHAR(80) NOT NULL,
    CONSTRAINT [Forme_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Forme_libelle_key] UNIQUE NONCLUSTERED ([libelle])
);

-- CreateTable
CREATE TABLE [dbo].[Fournisseur] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nom] NVARCHAR(150) NOT NULL,
    [contact] NVARCHAR(150),
    [telephone] NVARCHAR(50),
    [adresse] NVARCHAR(255),
    [actif] BIT NOT NULL CONSTRAINT [Fournisseur_actif_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Fournisseur_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Fournisseur_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Fournisseur_nom_key] UNIQUE NONCLUSTERED ([nom])
);

-- CreateTable
CREATE TABLE [dbo].[Produit] (
    [id] INT NOT NULL IDENTITY(1,1),
    [designation] NVARCHAR(200) NOT NULL,
    [formeId] INT,
    [venteBoite] BIT NOT NULL CONSTRAINT [Produit_venteBoite_df] DEFAULT 1,
    [ventePlaque] BIT NOT NULL CONSTRAINT [Produit_ventePlaque_df] DEFAULT 0,
    [plaquesParBoite] INT NOT NULL CONSTRAINT [Produit_plaquesParBoite_df] DEFAULT 1,
    [consommable] BIT NOT NULL CONSTRAINT [Produit_consommable_df] DEFAULT 0,
    [prixVenteBoite] DECIMAL(18,2) NOT NULL CONSTRAINT [Produit_prixVenteBoite_df] DEFAULT 0,
    [prixVentePlaque] DECIMAL(18,2) NOT NULL CONSTRAINT [Produit_prixVentePlaque_df] DEFAULT 0,
    [prixAchatPlaque] DECIMAL(18,2) NOT NULL CONSTRAINT [Produit_prixAchatPlaque_df] DEFAULT 0,
    [consoJournaliere] DECIMAL(18,4) NOT NULL CONSTRAINT [Produit_consoJournaliere_df] DEFAULT 0,
    [etatStock] NVARCHAR(20) NOT NULL CONSTRAINT [Produit_etatStock_df] DEFAULT 'RUPTURE',
    [actif] BIT NOT NULL CONSTRAINT [Produit_actif_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Produit_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Produit_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Produit_designation_key] UNIQUE NONCLUSTERED ([designation])
);

-- CreateTable
CREATE TABLE [dbo].[Lot] (
    [id] INT NOT NULL IDENTITY(1,1),
    [produitId] INT NOT NULL,
    [numeroLot] NVARCHAR(60) NOT NULL,
    [datePeremption] DATE NOT NULL,
    [fournisseurId] INT,
    [prixAchatPlaque] DECIMAL(18,2) NOT NULL CONSTRAINT [Lot_prixAchatPlaque_df] DEFAULT 0,
    [quantiteRestante] INT NOT NULL CONSTRAINT [Lot_quantiteRestante_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Lot_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Lot_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Lot_produitId_numeroLot_key] UNIQUE NONCLUSTERED ([produitId],[numeroLot])
);

-- CreateTable
CREATE TABLE [dbo].[Reception] (
    [id] INT NOT NULL IDENTITY(1,1),
    [numero] NVARCHAR(30) NOT NULL,
    [fournisseurId] INT NOT NULL,
    [dateReception] DATE NOT NULL,
    [observation] NVARCHAR(500),
    [montantTotal] DECIMAL(18,2) NOT NULL CONSTRAINT [Reception_montantTotal_df] DEFAULT 0,
    [utilisateurId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Reception_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Reception_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Reception_numero_key] UNIQUE NONCLUSTERED ([numero])
);

-- CreateTable
CREATE TABLE [dbo].[ReceptionLigne] (
    [id] INT NOT NULL IDENTITY(1,1),
    [receptionId] INT NOT NULL,
    [produitId] INT NOT NULL,
    [lotId] INT NOT NULL,
    [numeroLot] NVARCHAR(60) NOT NULL,
    [datePeremption] DATE NOT NULL,
    [quantite] INT NOT NULL,
    [unite] NVARCHAR(10) NOT NULL,
    [quantitePlaques] INT NOT NULL,
    [prixAchatUnitaire] DECIMAL(18,2) NOT NULL,
    [montant] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [ReceptionLigne_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Mouvement] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL CONSTRAINT [Mouvement_date_df] DEFAULT CURRENT_TIMESTAMP,
    [type] NVARCHAR(20) NOT NULL,
    [produitId] INT NOT NULL,
    [lotId] INT NOT NULL,
    [quantite] INT NOT NULL,
    [quantiteAvant] INT NOT NULL,
    [quantiteApres] INT NOT NULL,
    [prixUnitaire] DECIMAL(18,2) NOT NULL CONSTRAINT [Mouvement_prixUnitaire_df] DEFAULT 0,
    [motif] NVARCHAR(255),
    [documentType] NVARCHAR(20),
    [documentId] INT,
    [utilisateurId] INT NOT NULL,
    CONSTRAINT [Mouvement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [JournalAction_date_idx] ON [dbo].[JournalAction]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [JournalAction_entite_entiteId_idx] ON [dbo].[JournalAction]([entite], [entiteId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Produit_etatStock_idx] ON [dbo].[Produit]([etatStock]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Lot_datePeremption_idx] ON [dbo].[Lot]([datePeremption]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Reception_dateReception_idx] ON [dbo].[Reception]([dateReception]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Mouvement_date_idx] ON [dbo].[Mouvement]([date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Mouvement_produitId_date_idx] ON [dbo].[Mouvement]([produitId], [date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Mouvement_type_date_idx] ON [dbo].[Mouvement]([type], [date]);

-- AddForeignKey
ALTER TABLE [dbo].[JournalAction] ADD CONSTRAINT [JournalAction_utilisateurId_fkey] FOREIGN KEY ([utilisateurId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Produit] ADD CONSTRAINT [Produit_formeId_fkey] FOREIGN KEY ([formeId]) REFERENCES [dbo].[Forme]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Lot] ADD CONSTRAINT [Lot_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Lot] ADD CONSTRAINT [Lot_fournisseurId_fkey] FOREIGN KEY ([fournisseurId]) REFERENCES [dbo].[Fournisseur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reception] ADD CONSTRAINT [Reception_fournisseurId_fkey] FOREIGN KEY ([fournisseurId]) REFERENCES [dbo].[Fournisseur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reception] ADD CONSTRAINT [Reception_utilisateurId_fkey] FOREIGN KEY ([utilisateurId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ReceptionLigne] ADD CONSTRAINT [ReceptionLigne_receptionId_fkey] FOREIGN KEY ([receptionId]) REFERENCES [dbo].[Reception]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ReceptionLigne] ADD CONSTRAINT [ReceptionLigne_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ReceptionLigne] ADD CONSTRAINT [ReceptionLigne_lotId_fkey] FOREIGN KEY ([lotId]) REFERENCES [dbo].[Lot]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Mouvement] ADD CONSTRAINT [Mouvement_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Mouvement] ADD CONSTRAINT [Mouvement_lotId_fkey] FOREIGN KEY ([lotId]) REFERENCES [dbo].[Lot]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Mouvement] ADD CONSTRAINT [Mouvement_utilisateurId_fkey] FOREIGN KEY ([utilisateurId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
