-- CreateTable
CREATE TABLE "administrateur" (
    "idUser" TEXT NOT NULL,
    "nomUsr" TEXT NOT NULL,
    "prenomUsr" TEXT NOT NULL,
    "emailUsr" TEXT NOT NULL,
    "paswUsr" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administrateur_pkey" PRIMARY KEY ("idUser")
);

-- CreateIndex
CREATE UNIQUE INDEX "administrateur_emailUsr_key" ON "administrateur"("emailUsr");
