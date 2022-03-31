/*
  Warnings:

  - The primary key for the `Role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `ExcludedStudentsInDeadlines` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GuildToStudents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentToRoles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentsToCourses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExcludedStudentsInDeadlines" DROP CONSTRAINT "ExcludedStudentsInDeadlines_deadlineId_fkey";

-- DropForeignKey
ALTER TABLE "ExcludedStudentsInDeadlines" DROP CONSTRAINT "ExcludedStudentsInDeadlines_studentDiscordId_fkey";

-- DropForeignKey
ALTER TABLE "GuildToStudents" DROP CONSTRAINT "GuildToStudents_guildId_fkey";

-- DropForeignKey
ALTER TABLE "GuildToStudents" DROP CONSTRAINT "GuildToStudents_studentDiscordId_fkey";

-- DropForeignKey
ALTER TABLE "StudentToRoles" DROP CONSTRAINT "StudentToRoles_roleId_roleType_fkey";

-- DropForeignKey
ALTER TABLE "StudentToRoles" DROP CONSTRAINT "StudentToRoles_studentDiscordId_fkey";

-- DropForeignKey
ALTER TABLE "StudentsToCourses" DROP CONSTRAINT "StudentsToCourses_courseId_fkey";

-- DropForeignKey
ALTER TABLE "StudentsToCourses" DROP CONSTRAINT "StudentsToCourses_studentDiscordId_fkey";

-- AlterTable
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey",
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "ExcludedStudentsInDeadlines";

-- DropTable
DROP TABLE "GuildToStudents";

-- DropTable
DROP TABLE "StudentToRoles";

-- DropTable
DROP TABLE "StudentsToCourses";

-- CreateTable
CREATE TABLE "_GuildToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DeadlineToStudent" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CourseToStudent" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_RoleToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GuildToStudent_AB_unique" ON "_GuildToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_GuildToStudent_B_index" ON "_GuildToStudent"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DeadlineToStudent_AB_unique" ON "_DeadlineToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_DeadlineToStudent_B_index" ON "_DeadlineToStudent"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CourseToStudent_AB_unique" ON "_CourseToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_CourseToStudent_B_index" ON "_CourseToStudent"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToStudent_AB_unique" ON "_RoleToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToStudent_B_index" ON "_RoleToStudent"("B");

-- AddForeignKey
ALTER TABLE "_GuildToStudent" ADD FOREIGN KEY ("A") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuildToStudent" ADD FOREIGN KEY ("B") REFERENCES "Student"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeadlineToStudent" ADD FOREIGN KEY ("A") REFERENCES "Deadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeadlineToStudent" ADD FOREIGN KEY ("B") REFERENCES "Student"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToStudent" ADD FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToStudent" ADD FOREIGN KEY ("B") REFERENCES "Student"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToStudent" ADD FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToStudent" ADD FOREIGN KEY ("B") REFERENCES "Student"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;
