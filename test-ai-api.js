/**
 * Simple test script for AI Assistant API endpoints
 */

const BASE_URL = 'http://localhost:3000';

async function testContentAPI() {
  console.log('Testing /api/ai/content...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/content?type=all`);
    const data = await response.json();
    console.log('✓ Content API working:', data.content?.length || 0, 'items found');
    return data.content?.[0]; // Return first item for analysis test
  } catch (error) {
    console.error('✗ Content API failed:', error.message);
    return null;
  }
}

async function testHistoryAPI() {
  console.log('\nTesting /api/ai/history...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/history?limit=5`);
    const data = await response.json();
    console.log('✓ History API working:', data.analyses?.length || 0, 'records found');
  } catch (error) {
    console.error('✗ History API failed:', error.message);
  }
}

async function testAnalyzeAPI(contentItem) {
  if (!contentItem) {
    console.log('\nSkipping analyze API test (no content available)');
    return;
  }

  console.log('\nTesting /api/ai/analyze...');
  console.log('Using content:', contentItem.title);

  try {
    const response = await fetch(`${BASE_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType: contentItem.type,
        sourceId: contentItem.id,
        analysisType: 'requirement_analysis',
        userPrompt: '测试分析'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('✗ Analyze API failed:', error.error);
      if (error.error.includes('GEMINI_API_KEY')) {
        console.log('  ℹ️  Please set a valid GEMINI_API_KEY in .env file');
      }
      return;
    }

    const data = await response.json();
    console.log('✓ Analyze API working');
    console.log('  - Analysis ID:', data.id);
    console.log('  - Model:', data.metadata.model);
    console.log('  - Processing time:', data.metadata.processingTime, 'ms');
    console.log('  - Result preview:', data.result.substring(0, 100) + '...');
  } catch (error) {
    console.error('✗ Analyze API failed:', error.message);
  }
}

async function runTests() {
  console.log('='.repeat(50));
  console.log('AI Assistant API Tests');
  console.log('='.repeat(50));

  const firstContent = await testContentAPI();
  await testHistoryAPI();
  await testAnalyzeAPI(firstContent);

  console.log('\n' + '='.repeat(50));
  console.log('Tests completed!');
  console.log('='.repeat(50));
}

runTests();
