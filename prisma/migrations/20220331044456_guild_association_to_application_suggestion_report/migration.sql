/*
  Warnings:

  - Added the required column `guildId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guildId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guildId` to the `Suggestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "guildId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "guildId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "guildId" TEXT NOT NULL,
ALTER COLUMN "datetime" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
