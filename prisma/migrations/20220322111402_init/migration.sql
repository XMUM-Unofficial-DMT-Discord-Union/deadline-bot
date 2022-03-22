-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('UNVERIFIED', 'VERIFIED', 'MOD', 'ADMIN', 'DEV');

-- CreateTable
CREATE TABLE "GuildToStudents" (
    "guildId" TEXT NOT NULL,
    "studentDiscordId" TEXT NOT NULL,

    CONSTRAINT "GuildToStudents_pkey" PRIMARY KEY ("guildId","studentDiscordId")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentsToCourses" (
    "studentDiscordId" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "StudentsToCourses_pkey" PRIMARY KEY ("courseId","studentDiscordId")
);

-- CreateTable
CREATE TABLE "ExcludedStudentsInDeadlines" (
    "deadlineId" INTEGER NOT NULL,
    "studentDiscordId" TEXT NOT NULL,

    CONSTRAINT "ExcludedStudentsInDeadlines_pkey" PRIMARY KEY ("deadlineId","studentDiscordId")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "datetime" TIMESTAMPTZ NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentToRoles" (
    "id" SERIAL NOT NULL,
    "studentDiscordId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "roleType" "RoleType" NOT NULL,

    CONSTRAINT "StudentToRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "discordId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enrolledBatch" TEXT NOT NULL,
    "remindTime" TEXT NOT NULL DEFAULT E'1 Week',

    CONSTRAINT "Student_pkey" PRIMARY KEY ("discordId")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "type" "RoleType" NOT NULL,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id","type")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_key" ON "Course"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_discordId_key" ON "Student"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_id_key" ON "Student"("id");

-- AddForeignKey
ALTER TABLE "GuildToStudents" ADD CONSTRAINT "GuildToStudents_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildToStudents" ADD CONSTRAINT "GuildToStudents_studentDiscordId_fkey" FOREIGN KEY ("studentDiscordId") REFERENCES "Student"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentsToCourses" ADD CONSTRAINT "StudentsToCourses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentsToCourses" ADD CONSTRAINT "StudentsToCourses_studentDiscordId_fkey" FOREIGN KEY ("studentDiscordId") REFERENCES "Student"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcludedStudentsInDeadlines" ADD CONSTRAINT "ExcludedStudentsInDeadlines_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcludedStudentsInDeadlines" ADD CONSTRAINT "ExcludedStudentsInDeadlines_studentDiscordId_fkey" FOREIGN KEY ("studentDiscordId") REFERENCES "Student"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentToRoles" ADD CONSTRAINT "StudentToRoles_studentDiscordId_fkey" FOREIGN KEY ("studentDiscordId") REFERENCES "Student"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentToRoles" ADD CONSTRAINT "StudentToRoles_roleId_roleType_fkey" FOREIGN KEY ("roleId", "roleType") REFERENCES "Role"("id", "type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
