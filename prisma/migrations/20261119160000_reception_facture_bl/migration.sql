BEGIN TRY

BEGIN TRAN;

-- Réception : n° de facture et de bon de livraison du fournisseur
ALTER TABLE [dbo].[Reception] ADD [numFactureFourn] NVARCHAR(50),
[numBonLivraison] NVARCHAR(50);

-- Ligne de réception : observation facultative
ALTER TABLE [dbo].[ReceptionLigne] ADD [observation] NVARCHAR(500);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;

THROW

END CATCH
