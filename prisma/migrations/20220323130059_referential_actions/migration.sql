-- DropForeignKey
ALTER TABLE "Deadline" DROP CONSTRAINT "Deadline_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_guildId_fkey";

-- DropForeignKey
ALTER TABLE "studentsToRoles" DROP CONSTRAINT "studentsToRoles_guildId_roleType_fkey";

-- DropForeignKey
ALTER TABLE "studentsToRoles" DROP CONSTRAINT "studentsToRoles_studentDiscordId_fkey";

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studentsToRoles" ADD CONSTRAINT "studentsToRoles_studentDiscordId_fkey" FOREIGN KEY ("studentDiscordId") REFERENCES "Student"("discordId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studentsToRoles" ADD CONSTRAINT "studentsToRoles_guildId_roleType_fkey" FOREIGN KEY ("guildId", "roleType") REFERENCES "Role"("guildId", "type") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
