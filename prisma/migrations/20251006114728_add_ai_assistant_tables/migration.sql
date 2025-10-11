-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "inputContent" TEXT NOT NULL,
    "userPrompt" TEXT,
    "analysisResult" TEXT NOT NULL,
    "structuredData" TEXT,
    "modelUsed" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "tokensUsed" INTEGER,
    "processingTime" INTEGER,
    "rating" INTEGER,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIPromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "analysisType" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "defaultParams" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AIAnalysis_sourceType_sourceId_idx" ON "AIAnalysis"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "AIAnalysis_analysisType_idx" ON "AIAnalysis"("analysisType");

-- CreateIndex
CREATE INDEX "AIAnalysis_createdAt_idx" ON "AIAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "AIPromptTemplate_analysisType_idx" ON "AIPromptTemplate"("analysisType");
