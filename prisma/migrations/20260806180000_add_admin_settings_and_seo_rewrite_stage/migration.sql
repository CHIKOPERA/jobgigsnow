-- AlterEnum
ALTER TYPE "IngestFailureStage" ADD VALUE 'SEO_REWRITE';

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "seoRewritePrompt" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);
