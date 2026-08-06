-- CreateEnum
CREATE TYPE "OpportunityCategory" AS ENUM ('JOB', 'INTERNSHIP', 'LEARNERSHIP', 'APPRENTICESHIP', 'GRADUATE_PROGRAMME', 'CALL_FOR_APPLICATIONS', 'FUNDING');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('HOW_TO', 'CAREER_DEVELOPMENT');

-- DropIndex
DROP INDEX "Job_description_trgm_idx";

-- DropIndex
DROP INDEX "Job_title_trgm_idx";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "category" "OpportunityCategory" NOT NULL DEFAULT 'JOB';

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ContentCategory" NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "author" TEXT,
    "source" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceLabel" TEXT,
    "durationLabel" TEXT,
    "enrollUrl" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_category_publishedAt_idx" ON "Article"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_published_idx" ON "Article"("published");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_published_publishedAt_idx" ON "Course"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "Job_status_category_postedAt_idx" ON "Job"("status", "category", "postedAt");
