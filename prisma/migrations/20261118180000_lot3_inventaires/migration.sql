BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Inventaire] (
    [id] INT NOT NULL IDENTITY(1,1),
    [numero] NVARCHAR(30) NOT NULL,
    [dateOuverture] DATETIME2 NOT NULL CONSTRAINT [Inventaire_dateOuverture_df] DEFAULT CURRENT_TIMESTAMP,
    [perimetre] NVARCHAR(20) NOT NULL,
    [familleId] INT,
    [produitId] INT,
    [observation] NVARCHAR(500),
    [statut] NVARCHAR(20) NOT NULL CONSTRAINT [Inventaire_statut_df] DEFAULT 'EN_COURS',
    [ouvertParId] INT NOT NULL,
    [valideParId] INT,
    [dateValidation] DATETIME2,
    CONSTRAINT [Inventaire_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Inventaire_numero_key] UNIQUE NONCLUSTERED ([numero])
);

-- CreateTable
CREATE TABLE [dbo].[InventaireLigne] (
    [id] INT NOT NULL IDENTITY(1,1),
    [inventaireId] INT NOT NULL,
    [produitId] INT NOT NULL,
    [lotId] INT,
    [numeroLot] NVARCHAR(60) NOT NULL,
    [datePeremption] DATE NOT NULL,
    [lotTrouve] BIT NOT NULL CONSTRAINT [InventaireLigne_lotTrouve_df] DEFAULT 0,
    [quantiteTheorique] INT NOT NULL,
    [quantiteComptee] INT,
    [justification] NVARCHAR(255),
    [prixAchatPlaque] DECIMAL(18,2) NOT NULL CONSTRAINT [InventaireLigne_prixAchatPlaque_df] DEFAULT 0,
    [compteParId] INT,
    [dateComptage] DATETIME2,
    CONSTRAINT [InventaireLigne_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Inventaire_statut_idx] ON [dbo].[Inventaire]([statut]);

-- AddForeignKey
ALTER TABLE [dbo].[Inventaire] ADD CONSTRAINT [Inventaire_familleId_fkey] FOREIGN KEY ([familleId]) REFERENCES [dbo].[Famille]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Inventaire] ADD CONSTRAINT [Inventaire_ouvertParId_fkey] FOREIGN KEY ([ouvertParId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Inventaire] ADD CONSTRAINT [Inventaire_valideParId_fkey] FOREIGN KEY ([valideParId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InventaireLigne] ADD CONSTRAINT [InventaireLigne_inventaireId_fkey] FOREIGN KEY ([inventaireId]) REFERENCES [dbo].[Inventaire]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InventaireLigne] ADD CONSTRAINT [InventaireLigne_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InventaireLigne] ADD CONSTRAINT [InventaireLigne_lotId_fkey] FOREIGN KEY ([lotId]) REFERENCES [dbo].[Lot]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InventaireLigne] ADD CONSTRAINT [InventaireLigne_compteParId_fkey] FOREIGN KEY ([compteParId]) REFERENCES [dbo].[Utilisateur]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

