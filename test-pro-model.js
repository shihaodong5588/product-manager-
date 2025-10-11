const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyBQ0TZ7O-bAIb2GRIDHhmOZNHjfvbvm2cE';
const genAI = new GoogleGenerativeAI(apiKey);

async function testProModel() {
  console.log('Testing gemini-2.5-pro model...\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    },
  });

  const prompt = `你是工业伺服产品的资深需求分析师，请简单分析以下需求：

需求：添加用户登录功能
描述：需要实现邮箱登录和第三方登录

请给出3条分析建议。`;

  try {
    console.log('Sending request...');
    const startTime = Date.now();

    const result = await model.generateContent(prompt);
    const response = result.response;

    console.log('Response received in', Date.now() - startTime, 'ms\n');

    console.log('Response structure:');
    console.log('- candidates:', response.candidates?.length);
    console.log('- promptFeedback:', JSON.stringify(response.promptFeedback, null, 2));
    console.log('- usageMetadata:', response.usageMetadata);

    console.log('\nFirst candidate:');
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      console.log('- finishReason:', candidate.finishReason);
      console.log('- content parts:', candidate.content?.parts?.length);
      console.log('- safetyRatings:', candidate.safetyRatings);

      if (candidate.content?.parts?.[0]) {
        console.log('\nFirst part text length:', candidate.content.parts[0].text?.length || 0);
        console.log('First 200 chars:', candidate.content.parts[0].text?.substring(0, 200));
      }
    }

    console.log('\nUsing response.text():');
    const text = response.text();
    console.log('- Length:', text.length);
    console.log('- First 200 chars:', text.substring(0, 200));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testProModel();
