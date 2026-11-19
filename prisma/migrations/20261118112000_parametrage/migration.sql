BEGIN TRY

BEGIN TRAN;

-- Utilisateurs : contacts et dernière connexion
ALTER TABLE [dbo].[Utilisateur] ADD [telephone] NVARCHAR(50), [email] NVARCHAR(150), [derniereConnexion] DATETIME2;

-- Codes (ajoutés vides, remplis pour les lignes existantes, puis rendus obligatoires et uniques)
ALTER TABLE [dbo].[Forme] ADD [code] NVARCHAR(30);
ALTER TABLE [dbo].[Fournisseur] ADD [code] NVARCHAR(30), [email] NVARCHAR(150);
ALTER TABLE [dbo].[Produit] ADD [code] NVARCHAR(30);

EXEC('UPDATE [dbo].[Forme] SET [code] = CONCAT(''FRM-'', RIGHT(CONCAT(''0000'', [id]), 4))');
EXEC('UPDATE [dbo].[Fournisseur] SET [code] = CONCAT(''FRN-'', RIGHT(CONCAT(''0000'', [id]), 4))');
EXEC('UPDATE [dbo].[Produit] SET [code] = CONCAT(''MED-'', RIGHT(CONCAT(''0000'', [id]), 4))');

EXEC('ALTER TABLE [dbo].[Forme] ALTER COLUMN [code] NVARCHAR(30) NOT NULL');
EXEC('ALTER TABLE [dbo].[Fournisseur] ALTER COLUMN [code] NVARCHAR(30) NOT NULL');
EXEC('ALTER TABLE [dbo].[Produit] ALTER COLUMN [code] NVARCHAR(30) NOT NULL');

EXEC('ALTER TABLE [dbo].[Forme] ADD CONSTRAINT [Forme_code_key] UNIQUE NONCLUSTERED ([code])');
EXEC('ALTER TABLE [dbo].[Fournisseur] ADD CONSTRAINT [Fournisseur_code_key] UNIQUE NONCLUSTERED ([code])');
EXEC('ALTER TABLE [dbo].[Produit] ADD CONSTRAINT [Produit_code_key] UNIQUE NONCLUSTERED ([code])');

-- Paramètres généraux
CREATE TABLE [dbo].[Parametre] (
    [cle] NVARCHAR(60) NOT NULL,
    [valeur] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(255),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Parametre_pkey] PRIMARY KEY CLUSTERED ([cle])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
