/*
  Warnings:

  - The primary key for the `Role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_RoleToStudent` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_RoleToStudent" DROP CONSTRAINT "_RoleToStudent_A_fkey";

-- DropForeignKey
ALTER TABLE "_RoleToStudent" DROP CONSTRAINT "_RoleToStudent_B_fkey";

-- AlterTable
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey",
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("guildId", "type");

-- DropTable
DROP TABLE "_RoleToStudent";

-- CreateTable
CREATE TABLE "studentsToRoles" (
    "id" SERIAL NOT NULL,
    "studentDiscordId" TEXT NOT NULL,
    "roleType" "RoleType" NOT NULL,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "studentsToRoles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_id_key" ON "Role"("id");

-- AddForeignKey
ALTER TABLE "studentsToRoles" ADD CONSTRAINT "studentsToRoles_studentDiscordId_fkey" FOREIGN KEY ("studentDiscordId") REFERENCES "Student"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studentsToRoles" ADD CONSTRAINT "studentsToRoles_guildId_roleType_fkey" FOREIGN KEY ("guildId", "roleType") REFERENCES "Role"("guildId", "type") ON DELETE RESTRICT ON UPDATE CASCADE;
