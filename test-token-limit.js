const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyBQ0TZ7O-bAIb2GRIDHhmOZNHjfvbvm2cE';
const genAI = new GoogleGenerativeAI(apiKey);

async function testBothModels() {
  const testPrompt = `作为工业伺服产品需求分析师，请简要分析：

需求：实现电机实时监控功能
描述：需要显示转速、扭矩、温度等参数

给出3条建议。`;

  // 测试 Pro 模型（2048 tokens - 会被截断）
  console.log('='.repeat(80));
  console.log('Testing gemini-2.5-pro with 2048 tokens (OLD)');
  console.log('='.repeat(80));

  try {
    const model1 = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.2,
      },
    });

    const result1 = await model1.generateContent(testPrompt);
    const response1 = result1.response;
    const text1 = response1.text();

    console.log('Finish reason:', response1.candidates[0].finishReason);
    console.log('Thoughts tokens:', response1.usageMetadata.thoughtsTokenCount);
    console.log('Output tokens:', response1.usageMetadata.candidatesTokenCount);
    console.log('Total tokens:', response1.usageMetadata.totalTokenCount);
    console.log('Text length:', text1.length);
    console.log('\n');
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 测试 Pro 模型（8192 tokens - 应该完整）
  console.log('='.repeat(80));
  console.log('Testing gemini-2.5-pro with 8192 tokens (NEW)');
  console.log('='.repeat(80));

  try {
    const model2 = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.2,
      },
    });

    const result2 = await model2.generateContent(testPrompt);
    const response2 = result2.response;
    const text2 = response2.text();

    console.log('Finish reason:', response2.candidates[0].finishReason);
    console.log('Thoughts tokens:', response2.usageMetadata.thoughtsTokenCount);
    console.log('Output tokens:', response2.usageMetadata.candidatesTokenCount);
    console.log('Total tokens:', response2.usageMetadata.totalTokenCount);
    console.log('Text length:', text2.length);
    console.log('\nFull response:');
    console.log(text2);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testBothModels();
