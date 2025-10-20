/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Administrator` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nom` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prenom` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypeRole" AS ENUM ('ENSEIGNANT', 'ADMINISTRATEUR', 'CHEF_DE_FILIERE', 'CHEF_DE_DEPARTEMENT', 'DIRECTEUR_GENERAL');

-- CreateEnum
CREATE TYPE "RoleModule" AS ENUM ('ENSEIGNANT', 'COORDINATEUR', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "TypeSeance" AS ENUM ('COURS', 'TD', 'TP', 'EXAMEN', 'CONFERENCE', 'SEMINAIRE');

-- DropForeignKey
ALTER TABLE "public"."Administrator" DROP CONSTRAINT "Administrator_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "departementId" TEXT,
ADD COLUMN     "filiereId" TEXT,
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "prenom" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Administrator";

-- DropEnum
DROP TYPE "public"."AdminRole";

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeRole" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filiere" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "departementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER,
    "heures" INTEGER,
    "filiereId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserModule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "role" "RoleModule" NOT NULL DEFAULT 'ENSEIGNANT',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "dateseance" TIMESTAMP(3) NOT NULL,
    "heureDebut" TIMESTAMP(3) NOT NULL,
    "heureFin" TIMESTAMP(3) NOT NULL,
    "salle" TEXT,
    "type" "TypeSeance" NOT NULL DEFAULT 'COURS',
    "complement" TEXT,
    "moduleId" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_nom_key" ON "Role"("nom");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Departement_nom_key" ON "Departement"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Filiere_nom_key" ON "Filiere"("nom");

-- CreateIndex
CREATE INDEX "Filiere_departementId_idx" ON "Filiere"("departementId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_code_key" ON "Module"("code");

-- CreateIndex
CREATE INDEX "Module_filiereId_idx" ON "Module"("filiereId");

-- CreateIndex
CREATE INDEX "Module_code_idx" ON "Module"("code");

-- CreateIndex
CREATE INDEX "UserModule_userId_idx" ON "UserModule"("userId");

-- CreateIndex
CREATE INDEX "UserModule_moduleId_idx" ON "UserModule"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserModule_userId_moduleId_key" ON "UserModule"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "Seance_moduleId_idx" ON "Seance"("moduleId");

-- CreateIndex
CREATE INDEX "Seance_enseignantId_idx" ON "Seance"("enseignantId");

-- CreateIndex
CREATE INDEX "Seance_dateseance_idx" ON "Seance"("dateseance");

-- CreateIndex
CREATE INDEX "User_departementId_idx" ON "User"("departementId");

-- CreateIndex
CREATE INDEX "User_filiereId_idx" ON "User"("filiereId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "Departement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filiere" ADD CONSTRAINT "Filiere_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModule" ADD CONSTRAINT "UserModule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModule" ADD CONSTRAINT "UserModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
