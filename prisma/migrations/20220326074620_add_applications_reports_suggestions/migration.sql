-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('ADMIN', 'MOD', 'DEV');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('ADMIN', 'MOD', 'DEV');

-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('CHANNEL', 'EVENT');

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" SERIAL NOT NULL,
    "type" "SuggestionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "datetime" TIMESTAMPTZ,
    "location" TEXT,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "type" "ReportType" NOT NULL,
    "reporterDiscordId" TEXT NOT NULL,
    "reportedDiscordId" TEXT NOT NULL,
    "datetime" TIMESTAMPTZ NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
