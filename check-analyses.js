const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAnalyses() {
  console.log('Checking latest AI analyses...\n');

  const analyses = await prisma.aIAnalysis.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      modelUsed: true,
      analysisType: true,
      sourceType: true,
      tokensUsed: true,
      processingTime: true,
      analysisResult: true,
      createdAt: true,
    },
  });

  console.log(`Found ${analyses.length} analyses:\n`);

  for (const analysis of analyses) {
    console.log('='.repeat(80));
    console.log(`ID: ${analysis.id}`);
    console.log(`Model: ${analysis.modelUsed}`);
    console.log(`Type: ${analysis.analysisType} (${analysis.sourceType})`);
    console.log(`Tokens: ${analysis.tokensUsed || 'N/A'}`);
    console.log(`Time: ${analysis.processingTime}ms`);
    console.log(`Created: ${analysis.createdAt.toLocaleString('zh-CN')}`);
    console.log(`\nResult length: ${analysis.analysisResult?.length || 0} characters`);

    if (analysis.analysisResult) {
      console.log(`\nFirst 200 chars:`);
      console.log(analysis.analysisResult.substring(0, 200) + '...');
    } else {
      console.log(`\n⚠️  RESULT IS EMPTY OR NULL!`);
    }
    console.log('\n');
  }

  await prisma.$disconnect();
}

checkAnalyses().catch(console.error);
