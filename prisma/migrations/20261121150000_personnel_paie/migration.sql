BEGIN TRY

BEGIN TRAN;

-- Module Utilisateurs (personnel + comptes) et module Gestion de la paie

-- AlterTable
ALTER TABLE [dbo].[Utilisateur] ADD [personnelId] INT;

-- CreateTable
CREATE TABLE [dbo].[Personnel] (
    [id] INT NOT NULL IDENTITY(1,1),
    [matricule] NVARCHAR(30) NOT NULL,
    [nom] NVARCHAR(100) NOT NULL,
    [prenoms] NVARCHAR(150),
    [fonctionId] INT,
    [telephone] NVARCHAR(50),
    [email] NVARCHAR(150),
    [photo] NVARCHAR(max),
    [dateEmbauche] DATE,
    [salaireBase] DECIMAL(18,2) NOT NULL CONSTRAINT [Personnel_salaireBase_df] DEFAULT 0,
    [actif] BIT NOT NULL CONSTRAINT [Personnel_actif_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Personnel_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Personnel_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Personnel_matricule_key] UNIQUE NONCLUSTERED ([matricule])
);

-- CreateTable
CREATE TABLE [dbo].[BulletinPaie] (
    [id] INT NOT NULL IDENTITY(1,1),
    [numero] NVARCHAR(30) NOT NULL,
    [personnelId] INT NOT NULL,
    [mois] NVARCHAR(7) NOT NULL,
    [salaireBase] DECIMAL(18,2) NOT NULL CONSTRAINT [BulletinPaie_salaireBase_df] DEFAULT 0,
    [totalPrimes] DECIMAL(18,2) NOT NULL CONSTRAINT [BulletinPaie_totalPrimes_df] DEFAULT 0,
    [totalRetenues] DECIMAL(18,2) NOT NULL CONSTRAINT [BulletinPaie_totalRetenues_df] DEFAULT 0,
    [netAPayer] DECIMAL(18,2) NOT NULL CONSTRAINT [BulletinPaie_netAPayer_df] DEFAULT 0,
    [statut] NVARCHAR(15) NOT NULL CONSTRAINT [BulletinPaie_statut_df] DEFAULT 'BROUILLON',
    [datePaiement] DATE,
    [modePaiement] NVARCHAR(20),
    [observation] NVARCHAR(255),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BulletinPaie_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BulletinPaie_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BulletinPaie_numero_key] UNIQUE NONCLUSTERED ([numero]),
    CONSTRAINT [BulletinPaie_personnelId_mois_key] UNIQUE NONCLUSTERED ([personnelId],[mois])
);

-- CreateTable
CREATE TABLE [dbo].[LigneBulletin] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bulletinId] INT NOT NULL,
    [type] NVARCHAR(10) NOT NULL,
    [libelle] NVARCHAR(100) NOT NULL,
    [montant] DECIMAL(18,2) NOT NULL,
    [ordre] INT NOT NULL CONSTRAINT [LigneBulletin_ordre_df] DEFAULT 0,
    CONSTRAINT [LigneBulletin_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BulletinPaie_mois_idx] ON [dbo].[BulletinPaie]([mois]);

-- AddForeignKey
ALTER TABLE [dbo].[Utilisateur] ADD CONSTRAINT [Utilisateur_personnelId_fkey] FOREIGN KEY ([personnelId]) REFERENCES [dbo].[Personnel]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Personnel] ADD CONSTRAINT [Personnel_fonctionId_fkey] FOREIGN KEY ([fonctionId]) REFERENCES [dbo].[Fonction]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BulletinPaie] ADD CONSTRAINT [BulletinPaie_personnelId_fkey] FOREIGN KEY ([personnelId]) REFERENCES [dbo].[Personnel]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LigneBulletin] ADD CONSTRAINT [LigneBulletin_bulletinId_fkey] FOREIGN KEY ([bulletinId]) REFERENCES [dbo].[BulletinPaie]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Reprise des comptes existants : une fiche du personnel par compte (sauf SYSTÈME),
-- puis le compte est rattaché à sa fiche (identifiant = matricule)
EXEC('INSERT INTO [dbo].[Personnel] ([matricule], [nom], [prenoms], [fonctionId], [telephone], [email], [actif], [updatedAt])
      SELECT [matricule], [nom], [prenoms], [fonctionId], [telephone], [email], [actif], CURRENT_TIMESTAMP
      FROM [dbo].[Utilisateur] WHERE [role] <> ''SYSTEME''');
EXEC('UPDATE u SET u.[personnelId] = p.[id] FROM [dbo].[Utilisateur] u JOIN [dbo].[Personnel] p ON p.[matricule] = u.[matricule]');

-- Nouveaux modules : la Direction consulte la paie (l'administrateur a tous les droits)
EXEC('UPDATE [dbo].[Profil] SET [permissions] = JSON_MODIFY([permissions], ''$.paie'', JSON_QUERY(''["VOIR","IMPRIMER"]'')) WHERE [code] = ''DIRECTION'' AND ISJSON([permissions]) = 1');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

