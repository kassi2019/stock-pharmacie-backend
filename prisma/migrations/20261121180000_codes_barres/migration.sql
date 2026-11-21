BEGIN TRY

BEGIN TRAN;

-- Codes-barres des médicaments (scan à la vente et sur le téléphone)

-- CreateTable
CREATE TABLE [dbo].[CodeBarre] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(50) NOT NULL,
    [produitId] INT NOT NULL,
    [unite] NVARCHAR(10) NOT NULL CONSTRAINT [CodeBarre_unite_df] DEFAULT 'BOITE',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CodeBarre_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CodeBarre_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CodeBarre_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CodeBarre_produitId_idx] ON [dbo].[CodeBarre]([produitId]);

-- AddForeignKey
ALTER TABLE [dbo].[CodeBarre] ADD CONSTRAINT [CodeBarre_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Le caissier vend : droit MODIFIER sur Ventes et dispensations
EXEC('UPDATE [dbo].[Profil] SET [permissions] = JSON_MODIFY([permissions], ''$.dispensation'', JSON_QUERY(''["VOIR","IMPRIMER","MODIFIER"]'')) WHERE [code] = ''CAISSIER'' AND ISJSON([permissions]) = 1');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

